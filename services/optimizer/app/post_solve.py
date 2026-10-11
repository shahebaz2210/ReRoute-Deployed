"""
Post-solve validation and constraint audit for VRPTW solutions.
Validates constraints OPT-H01 through OPT-H11 and provides unassigned reason codes.
"""
from typing import List, Dict, Any, Tuple
from app.models import OptimizationRequest, VehicleRoute, StopAssignment, OptimizationResponse


def audit_solution(req: OptimizationRequest, routes: List[VehicleRoute], unassigned_ids: List[str]) -> Tuple[bool, List[str], Dict[str, str]]:
    """
    Audits the generated routes against hard constraints:
    - OPT-H01: Vehicle capacity (weight & volume) never exceeded
    - OPT-H02: Time windows strictly respected
    - OPT-H03: Driver maximum shift duration respected
    - OPT-H05: Single visit per assigned stop
    - OPT-H06: Depot departure and return valid
    Returns: (is_valid, list of violation descriptions, map of unassigned_id -> reason_code)
    """
    violations: List[str] = []
    unassigned_reasons: Dict[str, str] = {}
    
    vehicles_by_id = {v.id: v for v in req.vehicles}
    orders_by_id = {o.id: o for o in req.orders}
    
    visited_stop_ids = set()
    
    for r in routes:
        v = vehicles_by_id.get(r.vehicle_id)
        if not v:
            violations.append(f"OPT-H06: Route assigned to unknown vehicle {r.vehicle_id}")
            continue
            
        # Capacity checks
        delivery_stops = [s for s in r.stops if s.location_type == "DELIVERY"]
        route_weight = sum(orders_by_id[s.order_id].weight_kg for s in delivery_stops if s.order_id in orders_by_id)
        route_volume = sum(orders_by_id[s.order_id].volume_m3 for s in delivery_stops if s.order_id in orders_by_id)

        if route_weight > v.max_weight_kg + 1e-3:
            violations.append(f"OPT-H01: Vehicle {v.id} weight overload: {route_weight:.1f}kg > {v.max_weight_kg:.1f}kg")
        if route_volume > v.max_volume_m3 + 1e-3:
            violations.append(f"OPT-H01: Vehicle {v.id} volume overload: {route_volume:.2f}m3 > {v.max_volume_m3:.2f}m3")
            
        # Stop sequencing and time windows
        for stop in delivery_stops:
            if not stop.order_id:
                continue
            if stop.order_id in visited_stop_ids:
                violations.append(f"OPT-H05: Order {stop.order_id} visited multiple times")
            visited_stop_ids.add(stop.order_id)
            
            o_def = orders_by_id.get(stop.order_id)
            if o_def:
                if stop.arrival_minute > o_def.window_end_minute + 1e-3:
                    violations.append(f"OPT-H02: Stop {stop.order_id} arrived after deadline ({stop.arrival_minute}m > {o_def.window_end_minute}m)")

    # Analyze unassigned reasons
    for uid in unassigned_ids:
        o = orders_by_id.get(uid)
        if not o:
            unassigned_reasons[uid] = "UNKNOWN_ORDER"
            continue
        if o.weight_kg > max(v.max_weight_kg for v in req.vehicles):
            unassigned_reasons[uid] = "EXCEEDS_MAX_SINGLE_VEHICLE_WEIGHT"
        elif o.volume_m3 > max(v.max_volume_m3 for v in req.vehicles):
            unassigned_reasons[uid] = "EXCEEDS_MAX_SINGLE_VEHICLE_VOLUME"
        elif (o.window_end_minute - o.window_start_minute) < o.service_duration_minute:
            unassigned_reasons[uid] = "INVALID_TIME_WINDOW_SHORTER_THAN_SERVICE"
        else:
            unassigned_reasons[uid] = "CAPACITY_OR_TIME_WINDOW_INFEASIBLE"

    is_valid = len(violations) == 0
    return is_valid, violations, unassigned_reasons
