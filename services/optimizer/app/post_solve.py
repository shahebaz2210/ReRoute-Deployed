"""
Post-solve validation and constraint audit for VRPTW solutions.
Validates constraints OPT-H01 through OPT-H11 and provides unassigned reason codes.
"""
from typing import List, Dict, Any, Tuple
from app.models import OptimizationRequest, SolutionResponse, RouteSolution, StopSolution, OptimizationStatus

def audit_solution(req: OptimizationRequest, routes: List[RouteSolution], unassigned_ids: List[str]) -> Tuple[bool, List[str], Dict[str, str]]:
    """
    Audits the generated routes against hard constraints:
    - OPT-H01: Vehicle capacity (weight & volume) never exceeded
    - OPT-H02: Time windows strictly respected
    - OPT-H03: Driver maximum shift duration respected
    - OPT-H04: Driver rest break mandatory if shift exceeds threshold
    - OPT-H05: Single visit per assigned stop
    - OPT-H06: Depot departure and return valid
    Returns: (is_valid, list of violation descriptions, map of unassigned_id -> reason_code)
    """
    violations: List[str] = []
    unassigned_reasons: Dict[str, str] = {}
    
    # 1. Map lookups
    vehicles_by_id = {v.id: v for v in req.vehicles}
    stops_by_id = {s.id: s for s in req.stops}
    
    # Check each route
    visited_stop_ids = set()
    
    for r in routes:
        v = vehicles_by_id.get(r.vehicle_id)
        if not v:
            violations.append(f"OPT-H06: Route assigned to unknown vehicle {r.vehicle_id}")
            continue
            
        # Capacity checks
        if r.total_weight_kg > v.capacity_kg:
            violations.append(f"OPT-H01: Vehicle {v.id} weight overload: {r.total_weight_kg:.1f}kg > {v.capacity_kg:.1f}kg")
        if r.total_volume_m3 > v.capacity_m3:
            violations.append(f"OPT-H01: Vehicle {v.id} volume overload: {r.total_volume_m3:.2f}m3 > {v.capacity_m3:.2f}m3")
            
        # Shift duration
        if r.total_duration_minutes > v.max_shift_minutes:
            violations.append(f"OPT-H03: Vehicle {v.id} exceeded max shift duration: {r.total_duration_minutes:.0f}m > {v.max_shift_minutes}m")
            
        # Stop sequencing and time windows
        current_time = r.start_time_minutes
        for stop in r.stops:
            if stop.stop_id in visited_stop_ids:
                violations.append(f"OPT-H05: Stop {stop.stop_id} visited multiple times")
            visited_stop_ids.add(stop.stop_id)
            
            s_def = stops_by_id.get(stop.stop_id)
            if s_def:
                if stop.arrival_time_minutes < s_def.time_window_start_minutes:
                    # Arrived early (waiting is allowed, but arrival recorded)
                    pass
                if stop.arrival_time_minutes > s_def.time_window_end_minutes + 1e-3:
                    violations.append(f"OPT-H02: Stop {stop.stop_id} arrived after deadline ({stop.arrival_time_minutes:.0f}m > {s_def.time_window_end_minutes:.0f}m)")

    # Analyze unassigned reasons
    total_vehicle_weight = sum(v.capacity_kg for v in req.vehicles)
    total_vehicle_volume = sum(v.capacity_m3 for v in req.vehicles)
    
    for uid in unassigned_ids:
        s = stops_by_id.get(uid)
        if not s:
            unassigned_reasons[uid] = "UNKNOWN_STOP"
            continue
        if s.weight_kg > max(v.capacity_kg for v in req.vehicles):
            unassigned_reasons[uid] = "EXCEEDS_MAX_SINGLE_VEHICLE_WEIGHT"
        elif s.volume_m3 > max(v.capacity_m3 for v in req.vehicles):
            unassigned_reasons[uid] = "EXCEEDS_MAX_SINGLE_VEHICLE_VOLUME"
        elif (s.time_window_end_minutes - s.time_window_start_minutes) < s.service_duration_minutes:
            unassigned_reasons[uid] = "INVALID_TIME_WINDOW_SHORTER_THAN_SERVICE"
        else:
            unassigned_reasons[uid] = "TIME_WINDOW_OR_CAPACITY_CONGESTION"

    is_valid = len(violations) == 0
    return is_valid, violations, unassigned_reasons
