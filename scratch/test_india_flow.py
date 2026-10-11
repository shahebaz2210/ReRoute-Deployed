import requests
import json
import time

BASE_WEB_URL = "http://localhost:3000"
OPTIMIZER_URL = "http://127.0.0.1:8000"

def test_india_pipeline():
    print("==================================================")
    print("1. Checking Python Optimizer Microservice Health")
    print("==================================================")
    r = requests.get(f"{OPTIMIZER_URL}/health", timeout=5)
    print(f"Optimizer health: {r.status_code} -> {r.json()}")
    assert r.status_code == 200

    print("\n==================================================")
    print("2. Ingesting Real India Orders & Vehicles (Mumbai)")
    print("==================================================")
    orders_csv = """order_id,customer_name,delivery_address,latitude,longitude,weight_kg,volume_m3,time_window_start,time_window_end,priority
ORD-IN-1001,Tata Consultancy Services Hub,Hiranandani Business Park Powai Mumbai,19.1176,72.9060,240,1.2,08:30,11:30,STANDARD
ORD-IN-1002,Reliance Retail Logistics Center,MIDC Andheri East Mumbai,19.1197,72.8468,450,2.5,09:00,12:00,EXPRESS
ORD-IN-1003,Bharat Petroleum Wadala Terminal,Sewri Wadala Road Mumbai,19.0178,72.8562,920,5.8,10:00,14:00,STANDARD
ORD-IN-1004,Godrej & Boyce Industrial Complex,Pirojshanagar Vikhroli Mumbai,19.1009,72.9295,380,1.9,11:00,15:00,CRITICAL
ORD-IN-1005,Apollo MedSkills Healthcare,Sector 11 CBD Belapur Navi Mumbai,19.0222,73.0416,520,3.1,08:00,10:30,CRITICAL
ORD-IN-1006,Mahindra Auto Logistics Hub,Akurli Road Kandivali East Mumbai,19.2062,72.8534,850,4.8,13:00,17:00,STANDARD"""

    vehicles_csv = """vehicle_id,vehicle_code,vehicle_type,weight_capacity,volume_capacity,fuel_efficiency,fuel_efficiency_unit,shift_start_time,shift_end_time,start_location,start_latitude,start_longitude
VH-IN-01,MH-01-TRK,Tata Ultra 1918.T Truck,2500,18.0,5.2,km_per_litre,08:00,18:00,DEPOT-MUMBAI-BKC,19.0760,72.8777
VH-IN-02,MH-02-EV,Tata Ace EV Electric,1200,10.5,6.8,km_per_litre,08:00,18:00,DEPOT-MUMBAI-BKC,19.0760,72.8777
VH-IN-03,MH-03-HYB,Ashok Leyland BADA DOST Cargo,1800,14.0,5.8,km_per_litre,08:30,17:30,DEPOT-MUMBAI-BKC,19.0760,72.8777"""

    files = {
        "ordersFile": ("orders_mumbai.csv", orders_csv, "text/csv"),
        "vehiclesFile": ("vehicles_mumbai.csv", vehicles_csv, "text/csv"),
    }
    r = requests.post(f"{BASE_WEB_URL}/api/v1/plans/upload", files=files)
    print(f"Upload response status: {r.status_code}")
    res = r.json()
    assert r.status_code == 200
    assert res["success"] is True
    print(f"Single Depot Confirmed (India): {res['depotCenter']}")
    assert abs(res["depotCenter"]["latitude"] - 19.0760) < 0.001
    assert abs(res["depotCenter"]["longitude"] - 72.8777) < 0.001

    print("\n==================================================")
    print("3. Staging and Creating Mumbai India Delivery Plan")
    print("==================================================")
    create_payload = {
        "planName": "Mumbai Metro Commercial Distribution Plan",
        "depotId": res["depotCenter"]["id"],
        "depotCenter": res["depotCenter"],
        "vehicleIds": [v["vehicleId"] for v in res["vehiclesResult"]["validRows"]],
        "vehicles": res["vehiclesResult"]["validRows"],
        "orders": res["ordersResult"]["validRows"],
    }
    r = requests.post(f"{BASE_WEB_URL}/api/v1/plans", json=create_payload)
    assert r.status_code == 201
    plan_id = r.json()["data"]["id"]
    print(f"Created Plan ID: {plan_id}")

    print("\n==================================================")
    print("4. Optimizing Real India Routes via RouteIQ OR-Tools + OSRM")
    print("==================================================")
    t0 = time.time()
    r = requests.post(f"{BASE_WEB_URL}/api/v1/plans/{plan_id}/optimize")
    elapsed = time.time() - t0
    assert r.status_code == 200
    opt_data = r.json()["data"]
    print(f"Optimization completed in {elapsed:.2f}s!")
    print(f"  Plan: {opt_data['planName']}")
    print(f"  Depot: {opt_data['depot']['name']} ({opt_data['depot']['lat']} N, {opt_data['depot']['lng']} E)")
    print(f"  Total Distance: {opt_data['totalDistanceKm']} km")
    print(f"  Total Duration: {opt_data['totalDurationMinutes']} min")
    print(f"  Total Fuel: {opt_data['totalFuelLiters']} L")
    print(f"  Total CO2: {opt_data['totalCo2Kg']} kg")

    print(f"\nGenerated {len(opt_data['routes'])} Active India Routes:")
    for idx, route in enumerate(opt_data['routes']):
        print(f"  [Route {idx+1}] Vehicle {route['vehicleCode']} ({route['vehicleName']}):")
        print(f"    Driver: {route['driverName']}")
        print(f"    Stops: {route['stopsCount']} stops, {route['distanceKm']} km")
        print(f"    Load: {route['weightUtilizationPercent']}% weight, {route['volumeUtilizationPercent']}% volume")
        for s in route['stops']:
            print(f"      - #{s['stopNumber']} {s['locationName']} ({s['lat']}, {s['lng']}) ETA: {s['eta']}")

    print("\n==================================================")
    print("INDIA ROUTE OPTIMIZATION FULLY VERIFIED & WORKING!")
    print("==================================================")
    return plan_id

if __name__ == "__main__":
    test_india_pipeline()
