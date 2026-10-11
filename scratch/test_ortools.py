import json
import urllib.request

depot = {"lat": 51.5074, "lng": -0.1278} # London Central Depot
orders = [
    {"id": "ORD-1001", "ref": "ORD-1001", "lat": 51.515, "lng": -0.120, "weight": 240, "vol": 1.2, "w_start": 510, "w_end": 690, "service": 15, "priority": "STANDARD"},
    {"id": "ORD-1002", "ref": "ORD-1002", "lat": 51.522, "lng": -0.115, "weight": 450, "vol": 2.5, "w_start": 540, "w_end": 720, "service": 15, "priority": "EXPRESS"},
    {"id": "ORD-1003", "ref": "ORD-1003", "lat": 51.530, "lng": -0.105, "weight": 1200, "vol": 6.8, "w_start": 600, "w_end": 840, "service": 20, "priority": "STANDARD"},
    {"id": "ORD-1004", "ref": "ORD-1004", "lat": 51.505, "lng": -0.130, "weight": 380, "vol": 1.9, "w_start": 660, "w_end": 900, "service": 15, "priority": "CRITICAL"},
    {"id": "ORD-1005", "ref": "ORD-1005", "lat": 51.518, "lng": -0.125, "weight": 520, "vol": 3.1, "w_start": 480, "w_end": 630, "service": 15, "priority": "CRITICAL"},
    {"id": "ORD-1006", "ref": "ORD-1006", "lat": 51.540, "lng": -0.090, "weight": 950, "vol": 5.2, "w_start": 780, "w_end": 1020, "service": 20, "priority": "STANDARD"},
]

all_nodes = [depot] + [{"lat": o["lat"], "lng": o["lng"]} for o in orders]
import math

def haversine_km(lat1, lon1, lat2, lon2):
    R = 6371
    dLat = math.radians(lat2 - lat1)
    dLon = math.radians(lon2 - lon1)
    a = math.sin(dLat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dLon/2)**2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

N = len(all_nodes)
dur_matrix = []
dist_matrix = []
for i in range(N):
    dur_row = []
    dist_row = []
    for j in range(N):
        if i == j:
            dur_row.append(0)
            dist_row.append(0)
        else:
            km = haversine_km(all_nodes[i]["lat"], all_nodes[i]["lng"], all_nodes[j]["lat"], all_nodes[j]["lng"]) * 1.25
            meters = int(km * 1000)
            seconds = int((km / 30.0) * 3600)
            dist_row.append(meters)
            dur_row.append(seconds)
    dur_matrix.append(dur_row)
    dist_matrix.append(dist_row)

req_data = {
    "plan_id": "TEST-REAL-DATA-PLAN",
    "is_replan": False,
    "vehicles": [
        {
            "id": "VH-001",
            "vehicle_code": "TRK-01",
            "max_weight_kg": 1500,
            "max_volume_m3": 14.0,
            "start_latitude": depot["lat"],
            "start_longitude": depot["lng"],
            "end_latitude": depot["lat"],
            "end_longitude": depot["lng"],
            "available_from_minute": 480,
            "available_to_minute": 1080
        },
        {
            "id": "VH-002",
            "vehicle_code": "TRK-02",
            "max_weight_kg": 1200,
            "max_volume_m3": 11.5,
            "start_latitude": depot["lat"],
            "start_longitude": depot["lng"],
            "end_latitude": depot["lat"],
            "end_longitude": depot["lng"],
            "available_from_minute": 480,
            "available_to_minute": 1080
        },
        {
            "id": "VH-003",
            "vehicle_code": "VAN-03",
            "max_weight_kg": 1800,
            "max_volume_m3": 13.0,
            "start_latitude": depot["lat"],
            "start_longitude": depot["lng"],
            "end_latitude": depot["lat"],
            "end_longitude": depot["lng"],
            "available_from_minute": 480,
            "available_to_minute": 1080
        }
    ],
    "orders": [
        {
            "id": o["id"],
            "order_reference": o["ref"],
            "delivery_latitude": o["lat"],
            "delivery_longitude": o["lng"],
            "weight_kg": o["weight"],
            "volume_m3": o["vol"],
            "window_start_minute": o["w_start"],
            "window_end_minute": o["w_end"],
            "service_duration_minute": o["service"],
            "priority": o["priority"],
            "is_completed": False
        }
        for o in orders
    ],
    "duration_matrix_seconds": dur_matrix,
    "distance_matrix_meters": dist_matrix,
    "time_limit_seconds": 3
}

req = urllib.request.Request(
    "http://127.0.0.1:8000/optimize",
    data=json.dumps(req_data).encode("utf-8"),
    headers={
        "Content-Type": "application/json",
        "X-Worker-Secret": "dispatchx-internal-optimizer-secret-2026"
    }
)

with urllib.request.urlopen(req) as response:
    result = json.loads(response.read().decode("utf-8"))
    print("STATUS:", result.get("status"))
    print("SOLVE TIME (ms):", result.get("solver_duration_ms"))
    print("METRICS:", result.get("metrics"))
    print("NUM ROUTES:", len(result.get("routes", [])))
    for r in result.get("routes", []):
        print(f"Vehicle {r['vehicle_code']}: {len(r['stops'])} stops, distance={r['total_distance_km']}km, weight_util={r['weight_utilization_percent']}%")
