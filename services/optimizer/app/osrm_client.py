"""
RouteIQ OSRM Routing Client
Queries Open Source Routing Machine (OSRM) for:
1. Road-network distance (km) and travel-time (minutes) matrix via Table API.
2. Real-road geojson polylines for solved route sequences via Route API.

Key Constraints:
- Internal representation: latitude, longitude
- OSRM URL parameter representation: longitude,latitude
- Configurable OSRM_BASE_URL (defaults to public OSRM with intelligent offline fallback)
"""

import os
import math
import logging
from typing import List, Dict, Tuple, Optional, Any
import httpx

logger = logging.getLogger("routeiq.osrm")

OSRM_BASE_URL = os.environ.get("OSRM_BASE_URL", "http://router.project-osrm.org").rstrip("/")
OSRM_TIMEOUT_SECONDS = float(os.environ.get("OSRM_TIMEOUT_SECONDS", "8.0"))


def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates great-circle distance in kilometers using the Haversine formula."""
    if lat1 == lat2 and lon1 == lon2:
        return 0.0
    r = 6371.0  # Earth radius in km
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (math.sin(delta_phi / 2.0) ** 2 +
         math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(max(0.0, 1.0 - a)))
    return r * c


def build_fallback_matrices(
    locations: List[Dict[str, float]],
    average_speed_kmh: float = 32.0,
    circuity_factor: float = 1.25,
) -> Tuple[List[List[float]], List[List[float]]]:
    """
    Builds offline fallback matrices using Haversine distance and urban circuity factor
    when the external OSRM service is unreachable or rate-limited.
    """
    n = len(locations)
    distance_matrix_km: List[List[float]] = [[0.0] * n for _ in range(n)]
    travel_time_matrix_minutes: List[List[float]] = [[0.0] * n for _ in range(n)]

    for i in range(n):
        for j in range(n):
            if i == j:
                continue
            dist_km = haversine_distance_km(
                locations[i]["latitude"], locations[i]["longitude"],
                locations[j]["latitude"], locations[j]["longitude"]
            ) * circuity_factor
            distance_matrix_km[i][j] = round(max(0.2, dist_km), 2)
            duration_mins = (dist_km / average_speed_kmh) * 60.0
            travel_time_matrix_minutes[i][j] = round(max(1.0, duration_mins), 2)

    return distance_matrix_km, travel_time_matrix_minutes


class OSRMClient:
    def __init__(self, base_url: str = OSRM_BASE_URL, timeout: float = OSRM_TIMEOUT_SECONDS):
        self.base_url = base_url
        self.timeout = timeout

    async def get_table_matrix(
        self,
        locations: List[Dict[str, float]],
    ) -> Tuple[List[List[float]], List[List[float]], str]:
        """
        Retrieves duration and distance matrices from OSRM Table API.
        locations: list of dicts with 'latitude' and 'longitude'.
        Returns:
            (distance_matrix_km, travel_time_matrix_minutes, provider_info)
        """
        n = len(locations)
        if n == 0:
            return [], [], "empty"
        if n == 1:
            return [[0.0]], [[0.0]], "single_node"

        # OSRM expects coordinates in {longitude},{latitude} format
        coords_str = ";".join(
            f"{loc['longitude']:.6f},{loc['latitude']:.6f}" for loc in locations
        )
        url = f"{self.base_url}/table/v1/driving/{coords_str}?annotations=duration,distance"

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await client.get(url)
                if resp.status_code == 200:
                    data = resp.json()
                    if data.get("code") == "Ok" and "durations" in data and "distances" in data:
                        raw_durations = data["durations"]   # in seconds
                        raw_distances = data["distances"]   # in meters

                        dist_matrix_km: List[List[float]] = []
                        dur_matrix_mins: List[List[float]] = []

                        for i in range(n):
                            dist_row: List[float] = []
                            dur_row: List[float] = []
                            for j in range(n):
                                if i == j:
                                    dist_row.append(0.0)
                                    dur_row.append(0.0)
                                else:
                                    dist_m = raw_distances[i][j]
                                    dur_s = raw_durations[i][j]

                                    if dist_m is None or dur_s is None:
                                        # Unreachable leg fallback
                                        fallback_dist = haversine_distance_km(
                                            locations[i]["latitude"], locations[i]["longitude"],
                                            locations[j]["latitude"], locations[j]["longitude"]
                                        ) * 1.5
                                        dist_row.append(round(fallback_dist, 2))
                                        dur_row.append(round((fallback_dist / 30.0) * 60.0, 2))
                                    else:
                                        dist_row.append(round(dist_m / 1000.0, 2))
                                        dur_row.append(round(dur_s / 60.0, 2))
                            dist_matrix_km.append(dist_row)
                            dur_matrix_mins.append(dur_row)

                        return dist_matrix_km, dur_matrix_mins, "OSRM_API"
        except Exception as e:
            logger.warning(f"OSRM Table request failed ({e}); switching to offline circuity model")

        # Fallback to realistic offline circuity matrix
        dist_km, dur_mins = build_fallback_matrices(locations)
        return dist_km, dur_mins, "OFFLINE_CIRCUITY_MODEL"

    async def get_route_geometry(
        self,
        ordered_locations: List[Dict[str, float]],
    ) -> Optional[Dict[str, Any]]:
        """
        Retrieves real-road polyline geometry from OSRM Route API.
        ordered_locations: list of dicts with 'latitude' and 'longitude'.
        """
        if len(ordered_locations) < 2:
            return None

        coords_str = ";".join(
            f"{loc['longitude']:.6f},{loc['latitude']:.6f}" for loc in ordered_locations
        )
        url = f"{self.base_url}/route/v1/driving/{coords_str}?overview=full&geometries=geojson"

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await client.get(url)
                if resp.status_code == 200:
                    data = resp.json()
                    if data.get("code") == "Ok" and "routes" in data and len(data["routes"]) > 0:
                        primary_route = data["routes"][0]
                        return {
                            "geometry": primary_route.get("geometry"),
                            "distance_km": round(primary_route.get("distance", 0) / 1000.0, 2),
                            "duration_minutes": round(primary_route.get("duration", 0) / 60.0, 2),
                        }
        except Exception as e:
            logger.warning(f"OSRM Route geometry request failed: {e}")

        # Construct straight GeoJSON lineString fallback
        return {
            "geometry": {
                "type": "LineString",
                "coordinates": [
                    [loc["longitude"], loc["latitude"]] for loc in ordered_locations
                ]
            },
            "distance_km": round(sum(
                haversine_distance_km(
                    ordered_locations[i]["latitude"], ordered_locations[i]["longitude"],
                    ordered_locations[i+1]["latitude"], ordered_locations[i+1]["longitude"]
                ) for i in range(len(ordered_locations) - 1)
            ), 2),
            "duration_minutes": 0,
        }
