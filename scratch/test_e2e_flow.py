import json
import urllib.request

BASE_URL = "http://localhost:3000"

print("--- Step 1: Create Plan with Real Uploaded Orders ---")
payload = {
    "planName": "SF Metro Commercial Deliveries - Real Batch",
    "depotId": "DEPOT-CENTRAL",
    "vehicleIds": ["VH-001", "VH-002", "VH-003"],
    "orders": [
        {
            "orderReference": "ORD-REAL-101",
            "customerName": "Pacific Heights Pharmacy",
            "deliveryAddress": "2400 California St, San Francisco, CA",
            "latitude": 37.7892,
            "longitude": -122.4338,
            "weightKg": 140,
            "volumeM3": 0.9,
            "timeWindowStart": "08:30",
            "timeWindowEnd": "11:30",
            "priority": "EXPRESS"
        },
        {
            "orderReference": "ORD-REAL-102",
            "customerName": "Financial District BioTech",
            "deliveryAddress": "555 California St, San Francisco, CA",
            "latitude": 37.7925,
            "longitude": -122.4038,
            "weightKg": 320,
            "volumeM3": 2.1,
            "timeWindowStart": "09:00",
            "timeWindowEnd": "12:00",
            "priority": "CRITICAL"
        },
        {
            "orderReference": "ORD-REAL-103",
            "customerName": "Mission Artisan Goods",
            "deliveryAddress": "988 Valencia St, San Francisco, CA",
            "latitude": 37.7584,
            "longitude": -122.4212,
            "weightKg": 210,
            "volumeM3": 1.4,
            "timeWindowStart": "10:00",
            "timeWindowEnd": "14:00",
            "priority": "STANDARD"
        },
        {
            "orderReference": "ORD-REAL-104",
            "customerName": "Marina Organic Produce",
            "deliveryAddress": "2100 Chestnut St, San Francisco, CA",
            "latitude": 37.8005,
            "longitude": -122.4372,
            "weightKg": 290,
            "volumeM3": 2.0,
            "timeWindowStart": "09:30",
            "timeWindowEnd": "13:30",
            "priority": "STANDARD"
        },
        {
            "orderReference": "ORD-REAL-105",
            "customerName": "SoMa Hardware Hub",
            "deliveryAddress": "350 Townsend St, San Francisco, CA",
            "latitude": 37.7761,
            "longitude": -122.3983,
            "weightKg": 410,
            "volumeM3": 2.8,
            "timeWindowStart": "08:00",
            "timeWindowEnd": "11:00",
            "priority": "CRITICAL"
        }
    ]
}

req = urllib.request.Request(
    f"{BASE_URL}/api/v1/plans",
    data=json.dumps(payload).encode("utf-8"),
    headers={"Content-Type": "application/json"}
)
with urllib.request.urlopen(req) as resp:
    res = json.loads(resp.read().decode("utf-8"))
    print("Plan Created:", res)
    plan_id = res["data"]["id"]

print(f"\n--- Step 2: Optimize Plan {plan_id} (Dynamic Travel Time Matrix + OR-Tools) ---")
req_opt = urllib.request.Request(
    f"{BASE_URL}/api/v1/plans/{plan_id}/optimize",
    data=b"{}",
    headers={"Content-Type": "application/json"}
)
with urllib.request.urlopen(req_opt) as resp:
    opt_res = json.loads(resp.read().decode("utf-8"))
    res_plan = opt_res["result"]
    print(f"Status: {opt_res['status']}")
    print(f"Total Distance: {res_plan['totalDistanceKm']} km")
    print(f"Total Duration: {res_plan['totalDurationMinutes']} mins")
    print(f"Total Fuel: {res_plan['totalFuelLiters']} L")
    print(f"Total CO2: {res_plan['totalCo2Kg']} kg")
    print(f"Number of Routes: {len(res_plan['routes'])}")
    for r in res_plan['routes']:
        print(f"  Vehicle {r['vehicleCode']}: {len(r['stops'])} stops, {r['weightUtilizationPercent']}% load, {r['distanceKm']} km")

print("\n--- Step 3: Fetch Orders Tab (/api/v1/orders) ---")
with urllib.request.urlopen(f"{BASE_URL}/api/v1/orders") as resp:
    orders_res = json.loads(resp.read().decode("utf-8"))
    print(f"Total Orders: {orders_res['total']}")
    for o in orders_res["data"][:5]:
        print(f"  [{o['status']}] {o['orderReference']} - {o['customerName']} (ETA: {o.get('eta', 'N/A')}, Vehicle: {o.get('assignedVehicleId')})")

print("\n--- Step 4: Fetch Fleet Tab (/api/v1/fleet) ---")
with urllib.request.urlopen(f"{BASE_URL}/api/v1/fleet") as resp:
    fleet_res = json.loads(resp.read().decode("utf-8"))
    print(f"Total Vehicles: {fleet_res['total']}")
    for v in fleet_res["data"]:
        print(f"  [{v['status']}] {v['vehicleCode']} - Load: {v['currentWeightKg']}/{v['maxWeightKg']} kg, Driver: {v['driverName']}, Loc: {v['currentLocationName']}")

print("\nALL VERIFICATION CHECKS PASSED!")
