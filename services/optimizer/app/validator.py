"""
RouteIQ Independent Solution Validator
Verifies solution feasibility against all operational constraints
strictly separate from the OR-Tools solver search.
"""

from typing import List, Dict, Any, Tuple


class SolutionValidationError(Exception):
    def __init__(self, message: str, details: Dict[str, Any] = None):
        super().__init__(message)
        self.message = message
        self.details = details or {}


def validate_solution(
    vehicles: List[Any],
    orders: List[Any],
    depot: Any,
    routes: List[Any],
    unassigned_order_ids: List[str],
    travel_time_matrix_minutes: List[List[float]],
    distance_matrix_km: List[List[float]],
    location_index_map: Dict[str, int],
) -> Tuple[bool, List[str]]:
    """
    Independently audits the solved routes against all RouteIQ hard constraints.
    Returns (is_valid: bool, error_messages: List[str]).
    """
    errors: List[str] = []
    
    order_map = {o.id: o for o in orders}
    vehicle_map = {v.id: v for v in vehicles}
    served_order_ids = set()

    for route in routes:
        v_id = route.vehicle_id
        if v_id not in vehicle_map:
            errors.append(f"Route assigned to unrecognized vehicle '{v_id}'.")
            continue

        vehicle = vehicle_map[v_id]
        if not getattr(vehicle, "available", True):
            errors.append(f"Vehicle '{v_id}' is marked unavailable but was assigned deliveries.")

        route_weight = 0.0
        route_volume = 0.0
        current_time_minutes = getattr(vehicle, "available_from_minute", 480)
        prev_node_id = getattr(depot, "id", "DEPOT")

        for stop in route.stops:
            if stop.location_type != "DELIVERY":
                continue

            order_id = stop.order_id
            if not order_id or order_id not in order_map:
                errors.append(f"Stop references missing or invalid order '{order_id}'.")
                continue

            order = order_map[order_id]

            # 1. Duplication check
            if order_id in served_order_ids:
                errors.append(f"Duplicate assignment: Order '{order_id}' was assigned more than once.")
            served_order_ids.add(order_id)

            # 2. Cumulative load check
            route_weight += order.weight_kg
            route_volume += order.volume_m3

            # 3. Time window check
            arrival_minute = stop.arrival_minute
            if arrival_minute > order.window_end_minute:
                errors.append(
                    f"Time window violation: Order '{order_id}' arrival ({arrival_minute}m) "
                    f"exceeds deadline ({order.window_end_minute}m)."
                )

            # 4. Matrix consistency check
            if prev_node_id in location_index_map and order_id in location_index_map:
                i = location_index_map[prev_node_id]
                j = location_index_map[order_id]
                if i < len(travel_time_matrix_minutes) and j < len(travel_time_matrix_minutes[i]):
                    leg_travel = travel_time_matrix_minutes[i][j]
                    if leg_travel > 9999:
                        errors.append(f"Unreachable road leg used between '{prev_node_id}' and '{order_id}'.")

            prev_node_id = order_id

        # 5. Weight capacity check
        max_w = getattr(vehicle, "max_weight_kg", getattr(vehicle, "weight_capacity", 5000))
        if route_weight > max_w + 0.01:
            errors.append(
                f"Weight capacity violation: Vehicle '{v_id}' assigned {route_weight:.1f}kg "
                f"exceeding max capacity {max_w:.1f}kg."
            )

        # 6. Volume capacity check
        max_v = getattr(vehicle, "max_volume_m3", getattr(vehicle, "volume_capacity", 30.0))
        if route_volume > max_v + 0.01:
            errors.append(
                f"Volume capacity violation: Vehicle '{v_id}' assigned {route_volume:.2f}m³ "
                f"exceeding max capacity {max_v:.2f}m³."
            )

        # 7. Shift duration check
        max_shift = getattr(vehicle, "available_to_minute", 1080) - getattr(vehicle, "available_from_minute", 480)
        if route.total_duration_minutes > max_shift:
            errors.append(
                f"Shift limit violation: Vehicle '{v_id}' route duration "
                f"({route.total_duration_minutes}m) exceeds max shift ({max_shift}m)."
            )

        # 8. Vehicle failure check (PS S-01 / RouteIQ)
        failure_time = getattr(vehicle, "failure_time_minute", None)
        if failure_time is not None:
            for stop in route.stops:
                if stop.location_type == "DELIVERY" and stop.arrival_minute > failure_time:
                    errors.append(
                        f"Vehicle breakdown violation: Vehicle '{v_id}' failed at {failure_time}m "
                        f"but has delivery stop '{stop.order_id}' at {stop.arrival_minute}m."
                    )

    # 9. Coverage check: every order must be served OR explicitly listed as unassigned with reason
    all_accounted = served_order_ids.union(set(unassigned_order_ids))
    mandatory_unserved = [o.id for o in orders if not getattr(o, "is_completed", False) and o.id not in all_accounted]
    if mandatory_unserved:
        errors.append(f"Unaccounted orders dropped by solver: {mandatory_unserved}")

    is_valid = len(errors) == 0
    return is_valid, errors
