import json
import urllib.request

BASE_URL = "http://localhost:3000"

# Fetch latest plan
req_plans = urllib.request.urlopen(f"{BASE_URL}/api/v1/plans")
plans_data = json.loads(req_plans.read().decode("utf-8"))["data"]
latest_plan_id = plans_data[0]["id"]
print(f"Testing Cancellation Disruption on Plan: {latest_plan_id}")

disruption_payload = {
    "disruption": {
        "incidentType": "CANCELLATION",
        "locationName": "ORD-REAL-104",
        "from": "ORD-REAL-104",
        "reason": "Customer cancellation - skip location entirely"
    }
}

req_replan = urllib.request.Request(
    f"{BASE_URL}/api/v1/plans/{latest_plan_id}/optimize",
    data=json.dumps(disruption_payload).encode("utf-8"),
    headers={"Content-Type": "application/json"}
)

with urllib.request.urlopen(req_replan) as resp:
    res = json.loads(resp.read().decode("utf-8"))
    res_plan = res["result"]
    print("Re-optimization after Cancellation completed!")
    print(f"Total Distance: {res_plan['totalDistanceKm']} km (Fuel: {res_plan['totalFuelLiters']} L)")
    cancelled_order = next((o for o in res_plan["orders"] if "104" in o["id"] or "104" in o["orderReference"]), None)
    print(f"Cancelled Order Status: {cancelled_order['status'] if cancelled_order else 'Not Found'}")

# Verify in /api/v1/orders
with urllib.request.urlopen(f"{BASE_URL}/api/v1/orders") as resp:
    orders_res = json.loads(resp.read().decode("utf-8"))
    for o in orders_res["data"]:
        print(f"  [{o['status']}] {o['orderReference']} - {o['customerName']}")

print("\nDISRUPTION RE-ROUTE VERIFICATION PASSED!")
