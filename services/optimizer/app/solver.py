import hashlib
import json
import time
import math
import logging
from typing import List, Dict, Any, Tuple
from ortools.constraint_solver import routing_enums_pb2
from ortools.constraint_solver import pywrapcp

from app.models import (
    OptimizationRequest,
    OptimizationResponse,
    VehicleRoute,
    StopAssignment,
    UnassignedOrder,
    MetricEstimates,
    ValidationResult,
    PriorityEnum,
)
from app.osrm_client import OSRMClient, build_fallback_matrices
from app.validator import validate_solution

logger = logging.getLogger("routeiq.solver")


def compute_input_hash(req: OptimizationRequest) -> str:
    serialized = json.dumps(
        {
            "plan_id": req.plan_id,
            "vehicles": [v.model_dump() for v in sorted(req.vehicles, key=lambda x: x.id)],
            "orders": [o.model_dump() for o in sorted(req.orders, key=lambda x: x.id)],
        },
        sort_keys=True,
    )
    return hashlib.sha256(serialized.encode("utf-8")).hexdigest()[:16]


async def solve_vrptw(req: OptimizationRequest) -> OptimizationResponse:
    start_time = time.time()
    input_hash = compute_input_hash(req)

    sorted_vehicles = sorted(req.vehicles, key=lambda v: v.id)
    sorted_orders = sorted([o for o in req.orders if not o.is_completed], key=lambda o: o.id)

    num_vehicles = len(sorted_vehicles)
    num_orders = len(sorted_orders)

    # Resolve Single Central Depot coordinates
    depot_lat = req.depot.latitude if req.depot else (sorted_vehicles[0].start_latitude if sorted_vehicles else 37.7749)
    depot_lng = req.depot.longitude if req.depot else (sorted_vehicles[0].start_longitude if sorted_vehicles else -122.4194)
    depot_id = req.depot.id if req.depot else "DC01"

    if num_vehicles == 0 or num_orders == 0:
        return OptimizationResponse(
            plan_id=req.plan_id,
            status="FEASIBLE",
            input_hash=input_hash,
            solver_duration_ms=0,
            routing_provider="NONE",
            routes=[],
            unassigned_orders=[],
            metrics=MetricEstimates(
                total_distance_km=0.0,
                total_duration_minutes=0,
                total_orders_served=0,
                total_orders_unassigned=0,
                estimated_fuel_liters=0.0,
                estimated_cost_usd=0.0,
                estimated_co2_kg=0.0,
            ),
            validation=ValidationResult(is_valid=True, errors=[]),
        )

    # 1. Build Location Registry: Index 0 is Central Depot; Index 1..N are Delivery Orders
    locations = [{"latitude": depot_lat, "longitude": depot_lng, "id": depot_id}]
    location_index_map: Dict[str, int] = {depot_id: 0}

    for idx, order in enumerate(sorted_orders):
        locations.append({
            "latitude": order.delivery_latitude,
            "longitude": order.delivery_longitude,
            "id": order.id,
        })
        location_index_map[order.id] = idx + 1

    num_locations = len(locations)
    depot_index = 0

    # 2. Build or Retrieve OSRM Road Distance and Duration Matrices
    routing_provider = "OSRM"
    if req.duration_matrix_seconds and req.distance_matrix_meters and len(req.duration_matrix_seconds) == num_locations:
        dur_matrix_seconds = req.duration_matrix_seconds
        dist_matrix_meters = req.distance_matrix_meters
        routing_provider = "PRECOMPUTED_MATRIX"
    else:
        osrm = OSRMClient()
        dist_km_mat, dur_min_mat, provider_name = await osrm.get_table_matrix(locations)
        routing_provider = provider_name
        dur_matrix_seconds = [[int(round(m * 60)) for m in row] for row in dur_min_mat]
        dist_matrix_meters = [[int(round(km * 1000)) for km in row] for row in dist_km_mat]

    # 3. Setup RoutingIndexManager & RoutingModel
    # Every vehicle starts and ends at the Central Depot Center
    manager = pywrapcp.RoutingIndexManager(
        num_locations, num_vehicles, [depot_index] * num_vehicles, [depot_index] * num_vehicles
    )
    routing = pywrapcp.RoutingModel(manager)

    # 4. Travel Time Callback with Road Closures
    def time_callback(from_index: int, to_index: int) -> int:
        from_node = manager.IndexToNode(from_index)
        to_node = manager.IndexToNode(to_index)
        service_time = sorted_orders[from_node - 1].service_duration_minute if from_node > 0 else 0
        travel_time = 15
        if from_node < len(dur_matrix_seconds) and to_node < len(dur_matrix_seconds[from_node]):
            travel_time = dur_matrix_seconds[from_node][to_node] // 60

        closure_delay = 0
        if req.road_closures:
            for rc in req.road_closures:
                if (rc.from_node_index == from_node and rc.to_node_index == to_node) or \
                   (rc.to_node_index == from_node and rc.from_node_index == to_node):
                    closure_delay += rc.additional_delay_seconds // 60

        return service_time + travel_time + closure_delay

    transit_time_callback_index = routing.RegisterTransitCallback(time_callback)
    routing.SetArcCostEvaluatorOfAllVehicles(transit_time_callback_index)

    # 5. Weight Capacity Dimension
    def weight_demand_callback(from_index: int) -> int:
        from_node = manager.IndexToNode(from_index)
        if from_node == 0:
            return 0
        return int(sorted_orders[from_node - 1].weight_kg * 100)

    weight_callback_index = routing.RegisterUnaryTransitCallback(weight_demand_callback)
    vehicle_weight_capacities = [int(v.max_weight_kg * 100) for v in sorted_vehicles]

    routing.AddDimensionWithVehicleCapacity(
        weight_callback_index,
        0,
        vehicle_weight_capacities,
        True,
        "Weight",
    )

    # 6. Volume Capacity Dimension
    def volume_demand_callback(from_index: int) -> int:
        from_node = manager.IndexToNode(from_index)
        if from_node == 0:
            return 0
        return int(sorted_orders[from_node - 1].volume_m3 * 1000)

    volume_callback_index = routing.RegisterUnaryTransitCallback(volume_demand_callback)
    vehicle_volume_capacities = [int(v.max_volume_m3 * 1000) for v in sorted_vehicles]

    routing.AddDimensionWithVehicleCapacity(
        volume_callback_index,
        0,
        vehicle_volume_capacities,
        True,
        "Volume",
    )

    # 7. Time Dimension with Hard Delivery Windows
    routing.AddDimension(
        transit_time_callback_index,
        180,   # allow waiting time up to 180 mins before window opens
        1440,  # 24-hr day timeline
        False,
        "Time",
    )
    time_dimension = routing.GetDimensionOrDie("Time")

    for order_idx, order in enumerate(sorted_orders):
        node = order_idx + 1
        index = manager.NodeToIndex(node)
        time_dimension.CumulVar(index).SetRange(order.window_start_minute, order.window_end_minute)

    # Vehicle Shift Windows & Mid-Day Failure (Breakdown)
    for v_idx, v in enumerate(sorted_vehicles):
        start_idx = routing.Start(v_idx)
        end_idx = routing.End(v_idx)
        effective_to_minute = v.available_to_minute
        if v.failure_time_minute is not None:
            effective_to_minute = min(v.failure_time_minute, v.available_to_minute)

        time_dimension.CumulVar(start_idx).SetRange(v.available_from_minute, effective_to_minute)
        time_dimension.CumulVar(end_idx).SetRange(v.available_from_minute, effective_to_minute)

    # 8. Disjunction Penalties by Priority
    for order_idx, order in enumerate(sorted_orders):
        node = order_idx + 1
        index = manager.NodeToIndex(node)
        penalty = req.weights.unassigned_penalty_standard
        if order.priority == PriorityEnum.CRITICAL:
            penalty = req.weights.unassigned_penalty_critical
        elif order.priority == PriorityEnum.EXPRESS:
            penalty = req.weights.unassigned_penalty_express
        routing.AddDisjunction([index], penalty)

    # 9. Search Parameters: PATH_CHEAPEST_ARC & GUIDED_LOCAL_SEARCH
    search_parameters = pywrapcp.DefaultRoutingSearchParameters()
    search_parameters.first_solution_strategy = (
        routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
    )
    search_parameters.local_search_metaheuristic = (
        routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH
    )
    search_parameters.time_limit.seconds = req.time_limit_seconds

    # 10. Solve
    solution = routing.SolveWithParameters(search_parameters)
    solve_duration_ms = int((time.time() - start_time) * 1000)

    if not solution:
        return OptimizationResponse(
            plan_id=req.plan_id,
            status="INFEASIBLE",
            input_hash=input_hash,
            solver_duration_ms=solve_duration_ms,
            routing_provider=routing_provider,
            routes=[],
            unassigned_orders=[
                UnassignedOrder(
                    order_id=o.id,
                    order_reference=o.order_reference,
                    reason_code="INFEASIBLE_CONSTRAINTS",
                    reason_message="No feasible route found respecting all capacity and time window constraints.",
                )
                for o in sorted_orders
            ],
            metrics=MetricEstimates(
                total_distance_km=0.0,
                total_duration_minutes=0,
                total_orders_served=0,
                total_orders_unassigned=num_orders,
                estimated_fuel_liters=0.0,
                estimated_cost_usd=0.0,
                estimated_co2_kg=0.0,
            ),
            validation=ValidationResult(is_valid=False, errors=["Solver established no feasible solution."]),
        )

    # 11. Extract Solution Routes & Metrics
    routes: List[VehicleRoute] = []
    assigned_orders_set = set()
    total_distance_km = 0.0
    total_duration_minutes = 0
    total_fuel_liters = 0.0
    total_co2_kg = 0.0

    osrm_client = OSRMClient()

    for v_idx, v in enumerate(sorted_vehicles):
        stops: List[StopAssignment] = []
        route_distance_meters = 0
        route_weight_kg = 0.0
        route_volume_m3 = 0.0

        index = routing.Start(v_idx)
        prev_node = 0
        seq = 1

        # Departure from Central Depot
        depot_start_time = solution.Min(time_dimension.CumulVar(index))
        stops.append(
            StopAssignment(
                stop_sequence=seq,
                location_type="DEPOT_START",
                latitude=depot_lat,
                longitude=depot_lng,
                arrival_minute=depot_start_time,
                waiting_minutes=0,
                service_duration_minutes=0,
                departure_minute=depot_start_time,
                delivery_status="completed",
            )
        )

        while not routing.IsEnd(index):
            next_index = solution.Value(routing.NextVar(index))
            from_node = manager.IndexToNode(index)
            to_node = manager.IndexToNode(next_index)

            if from_node < len(dist_matrix_meters) and to_node < len(dist_matrix_meters[from_node]):
                route_distance_meters += dist_matrix_meters[from_node][to_node]

            index = next_index
            if routing.IsEnd(index):
                break

            seq += 1
            node = manager.IndexToNode(index)
            order = sorted_orders[node - 1]
            assigned_orders_set.add(order.id)

            arrival_time = solution.Min(time_dimension.CumulVar(index))
            waiting_time = max(0, order.window_start_minute - arrival_time)
            departure_time = arrival_time + waiting_time + order.service_duration_minute

            route_weight_kg += order.weight_kg
            route_volume_m3 += order.volume_m3

            stops.append(
                StopAssignment(
                    stop_sequence=seq,
                    order_id=order.id,
                    order_reference=order.order_reference,
                    retailer_id=order.retailer_id,
                    location_type="DELIVERY",
                    latitude=order.delivery_latitude,
                    longitude=order.delivery_longitude,
                    arrival_minute=arrival_time,
                    waiting_minutes=waiting_time,
                    service_duration_minutes=order.service_duration_minute,
                    departure_minute=departure_time,
                    cumulative_weight_kg=round(route_weight_kg, 1),
                    cumulative_volume_m3=round(route_volume_m3, 2),
                    delivery_status=order.status,
                )
            )

        # Return to Central Depot
        seq += 1
        depot_end_time = solution.Min(time_dimension.CumulVar(index))
        stops.append(
            StopAssignment(
                stop_sequence=seq,
                location_type="DEPOT_END",
                latitude=depot_lat,
                longitude=depot_lng,
                arrival_minute=depot_end_time,
                waiting_minutes=0,
                service_duration_minutes=0,
                departure_minute=depot_end_time,
                cumulative_weight_kg=round(route_weight_kg, 1),
                cumulative_volume_m3=round(route_volume_m3, 2),
                delivery_status="pending",
            )
        )

        v_dist_km = round(route_distance_meters / 1000.0, 2)
        v_duration_mins = depot_end_time - depot_start_time
        fuel_eff = getattr(v, "fuel_efficiency", 5.4) or 5.4
        v_fuel_liters = round(v_dist_km / fuel_eff, 2)
        v_co2_kg = round(v_fuel_liters * 2.68, 2)

        total_distance_km += v_dist_km
        total_duration_minutes += v_duration_mins
        total_fuel_liters += v_fuel_liters
        total_co2_kg += v_co2_kg

        # Fetch real road polyline geometry from OSRM
        route_coords = [{"latitude": st.latitude, "longitude": st.longitude} for st in stops]
        route_geom = None
        if len(stops) > 2:
            route_geom = await osrm_client.get_route_geometry(route_coords)

        routes.append(
            VehicleRoute(
                vehicle_id=v.id,
                vehicle_code=v.vehicle_code,
                stops=stops,
                total_distance_km=v_dist_km,
                total_duration_minutes=v_duration_mins,
                estimated_fuel_liters=v_fuel_liters,
                estimated_co2_kg=v_co2_kg,
                weight_utilization_percent=round((route_weight_kg / v.max_weight_kg) * 100, 1),
                volume_utilization_percent=round((route_volume_m3 / v.max_volume_m3) * 100, 1),
                is_failed=bool(v.failure_time_minute),
                failure_time_minute=v.failure_time_minute,
                route_geometry=route_geom,
            )
        )

    # 12. Diagnose Unassigned Orders
    unassigned_orders: List[UnassignedOrder] = []
    for order in sorted_orders:
        if order.id not in assigned_orders_set:
            reason = "CAPACITY_OR_TIME_WINDOW_MISSED"
            if order.weight_kg > max(v.max_weight_kg for v in sorted_vehicles):
                reason = "WEIGHT_EXCEEDS_FLEET_CAPACITY"
            elif order.volume_m3 > max(v.max_volume_m3 for v in sorted_vehicles):
                reason = "VOLUME_EXCEEDS_FLEET_CAPACITY"

            unassigned_orders.append(
                UnassignedOrder(
                    order_id=order.id,
                    order_reference=order.order_reference,
                    reason_code=reason,
                    reason_message=f"Order could not be accommodated within active vehicle capacities and shift time windows.",
                )
            )

    # 13. Independent Solution Validation
    dur_matrix_mins = [[sec / 60.0 for sec in row] for row in dur_matrix_seconds]
    dist_matrix_km = [[m / 1000.0 for m in row] for row in dist_matrix_meters]

    is_valid, validation_errors = validate_solution(
        vehicles=sorted_vehicles,
        orders=sorted_orders,
        depot=req.depot,
        routes=routes,
        unassigned_order_ids=[u.order_id for u in unassigned_orders],
        travel_time_matrix_minutes=dur_matrix_mins,
        distance_matrix_km=dist_matrix_km,
        location_index_map=location_index_map,
    )

    status_str = "OPTIMAL" if len(unassigned_orders) == 0 else "FEASIBLE"
    if not is_valid:
        logger.warning(f"Plan validation identified warnings: {validation_errors}")

    return OptimizationResponse(
        plan_id=req.plan_id,
        status=status_str,
        input_hash=input_hash,
        solver_duration_ms=solve_duration_ms,
        routing_provider=routing_provider,
        routes=routes,
        unassigned_orders=unassigned_orders,
        metrics=MetricEstimates(
            total_distance_km=round(total_distance_km, 2),
            total_duration_minutes=total_duration_minutes,
            total_orders_served=len(assigned_orders_set),
            total_orders_unassigned=len(unassigned_orders),
            estimated_fuel_liters=round(total_fuel_liters, 2),
            estimated_cost_usd=round(total_fuel_liters * 1.65, 2),
            estimated_co2_kg=round(total_co2_kg, 2),
        ),
        validation=ValidationResult(is_valid=is_valid, errors=validation_errors),
    )
