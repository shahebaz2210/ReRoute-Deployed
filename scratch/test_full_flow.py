import requests
import json
import time

BASE_WEB_URL = "http://localhost:3000"
OPTIMIZER_URL = "http://127.0.0.1:8000"

def test_full_pipeline():
    print("==================================================")
    print("1. Checking Python Optimizer Microservice Health")
    print("==================================================")
    try:
        r = requests.get(f"{OPTIMIZER_URL}/health", timeout=5)
        print(f"Optimizer health: {r.status_code} -> {r.json()}")
        assert r.status_code == 200
    except Exception as e:
        print(f"Failed to connect to Python Optimizer: {e}")
        return False

    print("\n==================================================")
    print("2. Testing Multi-Depot Violation (Negative Test)")
    print("==================================================")
    # Vehicle 2 has different start coordinates
    orders_csv = """order_id,customer_name,delivery_address,latitude,longitude,weight_kg,volume_m3,time_window_start,time_window_end,priority
ORD-1001,Astra Tech Labs,12 Innovation Way,51.5220,-0.1280,240,1.2,08:30,11:30,STANDARD
ORD-1002,BioGen Research,45 Medical Sciences Park,51.5160,-0.0920,450,2.5,09:00,12:00,EXPRESS"""

    vehicles_invalid_csv = """vehicle_id,vehicle_code,vehicle_type,weight_capacity,volume_capacity,fuel_efficiency,fuel_efficiency_unit,shift_start_time,shift_end_time,start_location,start_latitude,start_longitude
VH-001,TRK-01,Mercedes Sprinter 3500,1500,14.0,5.4,km_per_litre,08:00,18:00,DEPOT-CENTRAL,51.5150,-0.1200
VH-002,TRK-02,Ford E-Transit Electric,1200,11.5,6.8,km_per_litre,08:00,18:00,DEPOT-SOUTH,51.4500,-0.0500"""

    files = {
        "ordersFile": ("orders.csv", orders_csv, "text/csv"),
        "vehiclesFile": ("vehicles.csv", vehicles_invalid_csv, "text/csv"),
    }
    r = requests.post(f"{BASE_WEB_URL}/api/v1/plans/upload", files=files)
    print(f"Upload response status: {r.status_code}")
    res = r.json()
    assert r.status_code == 422
    assert res["success"] is False
    assert any(e["code"] == "MULTIPLE_DEPOTS_FORBIDDEN" for e in res["vehiclesResult"]["errors"])
    print("SUCCESS: Single Depot violation correctly caught by rule engine!")

    print("\n==================================================")
    print("3. Testing Compulsory Dual CSV Ingestion (Positive Test)")
    print("==================================================")
    # Valid files sharing exact Depot Center (51.5150, -0.1200)
    vehicles_valid_csv = """vehicle_id,vehicle_code,vehicle_type,weight_capacity,volume_capacity,fuel_efficiency,fuel_efficiency_unit,shift_start_time,shift_end_time,start_location,start_latitude,start_longitude
VH-001,TRK-01,Mercedes Sprinter 3500,1500,14.0,5.4,km_per_litre,08:00,18:00,DEPOT-CENTRAL,51.5150,-0.1200
VH-002,TRK-02,Ford E-Transit Electric,1200,11.5,6.8,km_per_litre,08:00,18:00,DEPOT-CENTRAL,51.5150,-0.1200
VH-003,VAN-03,Ram ProMaster Cargo,1800,13.0,5.8,km_per_litre,08:30,17:30,DEPOT-CENTRAL,51.5150,-0.1200"""

    files_valid = {
        "ordersFile": ("orders.csv", orders_csv, "text/csv"),
        "vehiclesFile": ("vehicles.csv", vehicles_valid_csv, "text/csv"),
    }
    r = requests.post(f"{BASE_WEB_URL}/api/v1/plans/upload", files=files_valid)
    assert r.status_code == 200
    res_valid = r.json()
    assert res_valid["success"] is True
    assert len(res_valid["ordersResult"]["validRows"]) == 2
    assert len(res_valid["vehiclesResult"]["validRows"]) == 3
    print(f"SUCCESS: Validated 2 orders and 3 fleet vehicles at Depot Center: {res_valid['depotCenter']}")

    print("\n==================================================")
    print("4. Creating Plan with Uploaded Data")
    print("==================================================")
    create_payload = {
        "planName": "Dual CSV Test Plan",
        "depotId": res_valid["depotCenter"]["id"],
        "depotCenter": res_valid["depotCenter"],
        "vehicleIds": [v["vehicleId"] for v in res_valid["vehiclesResult"]["validRows"]],
        "vehicles": res_valid["vehiclesResult"]["validRows"],
        "orders": res_valid["ordersResult"]["validRows"],
    }
    r = requests.post(f"{BASE_WEB_URL}/api/v1/plans", json=create_payload)
    print(f"Plan create status: {r.status_code}")
    plan_data = r.json()
    assert r.status_code == 201
    plan_id = plan_data["data"]["id"]
    print(f"Plan created successfully: {plan_id}")

    print("\n==================================================")
    print("5. Optimizing Plan via RouteIQ OR-Tools + OSRM Engine")
    print("==================================================")
    opt_start = time.time()
    r = requests.post(f"{BASE_WEB_URL}/api/v1/plans/{plan_id}/optimize")
    opt_duration = time.time() - opt_start
    print(f"Optimize status: {r.status_code} (took {opt_duration:.2f}s)")
    opt_res = r.json()
    assert r.status_code == 200
    plan_optimized = opt_res["data"]
    print(f"Optimization Status: {plan_optimized['status']}")
    print(f"Total Distance: {plan_optimized['totalDistanceKm']} km")
    print(f"Total Duration: {plan_optimized['totalDurationMinutes']} min")
    print(f"Total Fuel: {plan_optimized['totalFuelLiters']} L")
    print(f"Total CO2: {plan_optimized['totalCo2Kg']} kg")
    print(f"Active Routes Generated: {len(plan_optimized['routes'])}")

    for idx, route in enumerate(plan_optimized['routes']):
        print(f"  Route #{idx+1} ({route['vehicleCode']}): {route['stopsCount']} stops, {route['distanceKm']} km, {route['weightUtilizationPercent']}% load")

    print("\n==================================================")
    print("ALL TESTS PASSED! RouteIQ Engine & Dual Ingestion Complete.")
    print("==================================================")
    return True

if __name__ == "__main__":
    test_full_pipeline()
