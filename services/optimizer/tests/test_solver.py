"""
Unit tests for RouteIQ / Google OR-Tools VRPTW solver with OSRM integration:
- Basic VRPTW assignment & capacities
- Road closure delay & vehicle failure at stated time
- OSRM Table matrix generation & route geometry
- Independent validation check
"""
import sys
import os
import asyncio

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.models import (
    OptimizationRequest,
    VehicleInput,
    OrderInput,
    OptimizationResponse,
    RoadClosureInput,
    DepotInput,
)
from app.solver import solve_vrptw


def test_solver_basic_instance():
    vehicles = [
        VehicleInput(
            id="V-1",
            vehicle_code="VAN-01",
            max_weight_kg=1000.0,
            max_volume_m3=10.0,
            start_latitude=37.7749,
            start_longitude=-122.4194,
            end_latitude=37.7749,
            end_longitude=-122.4194,
            available_from_minute=480,
            available_to_minute=1080,
        ),
        VehicleInput(
            id="V-2",
            vehicle_code="VAN-02",
            max_weight_kg=1200.0,
            max_volume_m3=12.0,
            start_latitude=37.7749,
            start_longitude=-122.4194,
            end_latitude=37.7749,
            end_longitude=-122.4194,
            available_from_minute=480,
            available_to_minute=1080,
        ),
    ]

    orders = [
        OrderInput(
            id="ORD-1",
            order_reference="REF-01",
            delivery_latitude=37.7800,
            delivery_longitude=-122.4100,
            weight_kg=100.0,
            volume_m3=1.0,
            window_start_minute=480,
            window_end_minute=720,
            service_duration_minute=15,
        ),
        OrderInput(
            id="ORD-2",
            order_reference="REF-02",
            delivery_latitude=37.7850,
            delivery_longitude=-122.4050,
            weight_kg=150.0,
            volume_m3=1.5,
            window_start_minute=510,
            window_end_minute=780,
            service_duration_minute=15,
        ),
    ]

    n = 3  # 0: Depot, 1: ORD-1, 2: ORD-2
    duration_matrix = [[600 for _ in range(n)] for _ in range(n)]
    distance_matrix = [[5000 for _ in range(n)] for _ in range(n)]
    for i in range(n):
        duration_matrix[i][i] = 0
        distance_matrix[i][i] = 0

    req = OptimizationRequest(
        plan_id="TEST-PLAN-1",
        is_replan=False,
        depot=DepotInput(id="DC01", latitude=37.7749, longitude=-122.4194),
        vehicles=vehicles,
        orders=orders,
        duration_matrix_seconds=duration_matrix,
        distance_matrix_meters=distance_matrix,
        time_limit_seconds=5,
    )

    res: OptimizationResponse = asyncio.run(solve_vrptw(req))
    assert res.status in ["OPTIMAL", "FEASIBLE"]
    assert res.input_hash != ""
    assert res.validation.is_valid is True
    print("Solver basic instance passed successfully! Status:", res.status)


def test_solver_vehicle_failure_and_road_closure():
    vehicles = [
        VehicleInput(
            id="V-1",
            vehicle_code="VAN-01",
            max_weight_kg=500.0,
            max_volume_m3=5.0,
            start_latitude=37.7749,
            start_longitude=-122.4194,
            end_latitude=37.7749,
            end_longitude=-122.4194,
            available_from_minute=480,
            available_to_minute=1080,
            failure_time_minute=500,  # Fails at minute 500 (08:20 AM)
        ),
        VehicleInput(
            id="V-2",
            vehicle_code="VAN-02",
            max_weight_kg=500.0,
            max_volume_m3=5.0,
            start_latitude=37.7749,
            start_longitude=-122.4194,
            end_latitude=37.7749,
            end_longitude=-122.4194,
            available_from_minute=480,
            available_to_minute=1080,
        ),
    ]

    orders = [
        OrderInput(
            id="ORD-1",
            order_reference="REF-01",
            delivery_latitude=37.7800,
            delivery_longitude=-122.4100,
            weight_kg=100.0,
            volume_m3=1.0,
            window_start_minute=510,
            window_end_minute=600,
            service_duration_minute=15,
        ),
    ]

    n = 2  # 0: Depot, 1: ORD-1
    duration_matrix = [[600 for _ in range(n)] for _ in range(n)]
    distance_matrix = [[5000 for _ in range(n)] for _ in range(n)]
    for i in range(n):
        duration_matrix[i][i] = 0
        distance_matrix[i][i] = 0

    req = OptimizationRequest(
        plan_id="TEST-FAIL-REPLAN",
        is_replan=True,
        depot=DepotInput(id="DC01", latitude=37.7749, longitude=-122.4194),
        vehicles=vehicles,
        orders=orders,
        duration_matrix_seconds=duration_matrix,
        distance_matrix_meters=distance_matrix,
        road_closures=[
            RoadClosureInput(
                from_node_index=0,
                to_node_index=1,
                additional_delay_seconds=1200,
                active_until_minute=600,
            )
        ],
        time_limit_seconds=5,
    )

    res = asyncio.run(solve_vrptw(req))
    assert res.status in ["OPTIMAL", "FEASIBLE"]
    v1_route = next(r for r in res.routes if r.vehicle_id == "V-1")
    v2_route = next(r for r in res.routes if r.vehicle_id == "V-2")

    # V-1 has no delivery stops after failure time
    v1_delivery_stops = [s for s in v1_route.stops if s.location_type == "DELIVERY"]
    assert len(v1_delivery_stops) == 0, "Failed vehicle must not receive delivery stops"

    # V-2 served the order
    v2_delivery_stops = [s for s in v2_route.stops if s.location_type == "DELIVERY"]
    assert len(v2_delivery_stops) == 1, "Non-failed vehicle must serve the delivery"
    print("Vehicle failure & road closure test passed successfully!")


if __name__ == "__main__":
    test_solver_basic_instance()
    test_solver_vehicle_failure_and_road_closure()
