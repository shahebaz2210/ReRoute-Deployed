"""
Unit test for Google OR-Tools VRPTW solver with demo instance
"""
from app.models import (
    OptimizationRequest,
    VehicleInput,
    OrderInput,
    OptimizationResponse,
)
from app.solver import solve_vrptw

def test_solver_basic_instance():
    # 2 vehicles, 4 orders
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
            available_from_minute=0,
            available_to_minute=480,
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
            available_from_minute=0,
            available_to_minute=480,
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
            window_start_minute=0,
            window_end_minute=240,
            service_duration_minute=15,
        ),
        OrderInput(
            id="ORD-2",
            order_reference="REF-02",
            delivery_latitude=37.7850,
            delivery_longitude=-122.4050,
            weight_kg=150.0,
            volume_m3=1.5,
            window_start_minute=30,
            window_end_minute=300,
            service_duration_minute=15,
        ),
    ]

    # NxN matrix (size 2 vehicles * 2 start/end + 2 orders = 6 nodes)
    # 0: V1 start, 1: V1 end, 2: V2 start, 3: V2 end, 4: ORD-1, 5: ORD-2
    n = 6
    duration_matrix = [[600 for _ in range(n)] for _ in range(n)]
    distance_matrix = [[5000 for _ in range(n)] for _ in range(n)]
    for i in range(n):
        duration_matrix[i][i] = 0
        distance_matrix[i][i] = 0

    req = OptimizationRequest(
        plan_id="TEST-PLAN-1",
        is_replan=False,
        vehicles=vehicles,
        orders=orders,
        duration_matrix_seconds=duration_matrix,
        distance_matrix_meters=distance_matrix,
        time_limit_seconds=5,
    )

    res: OptimizationResponse = solve_vrptw(req)
    assert res.status in ["OPTIMAL", "FEASIBLE"]
    assert res.input_hash != ""
    print("Solver basic instance passed successfully! Status:", res.status)

if __name__ == "__main__":
    test_solver_basic_instance()
