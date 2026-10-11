/**
 * Dynamic Travel Time & Distance Matrix Generator
 * Generates deterministic NxN travel time and distance matrices from real GPS coordinates.
 * Strictly adheres to PS S-01 (ReRoute: Dynamic Fleet & Delivery Replanning):
 * - Offline simulated matrix with realistic urban routing factor (no external GPS dependency)
 * - Supports dynamic corridor road closures and traffic congestion delay adjustments
 */

export interface MatrixLocation {
  id: string;
  name?: string;
  lat: number;
  lng: number;
}

export interface RoadClosureDelay {
  fromId: string;
  toId: string;
  additionalDelaySeconds: number;
}

export interface GeneratedMatrix {
  duration_matrix_seconds: number[][];
  distance_matrix_meters: number[][];
  nodes: MatrixLocation[];
  nodeIndexMap: Record<string, number>;
}

/**
 * Great-circle distance between two GPS coordinates using the Haversine formula (in kilometers).
 */
export function haversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (lat1 === lat2 && lon1 === lon2) return 0;
  const R = 6371; // Earth's mean radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Builds deterministic travel duration (seconds) and distance (meters) matrices
 * for any arbitrary set of real locations (Depot + Orders).
 * 
 * Routing Model Parameters:
 * - Urban Detour Factor: 1.25x (accounts for street grids, turnings, and one-way streets)
 * - Commercial Fleet Speed: 32 km/h average in metropolitan distribution zones
 */
export function buildTravelTimeMatrix(
  locations: MatrixLocation[],
  roadClosures?: RoadClosureDelay[]
): GeneratedMatrix {
  const n = locations.length;
  const durationMatrix: number[][] = [];
  const distanceMatrix: number[][] = [];
  const nodeIndexMap: Record<string, number> = {};

  locations.forEach((loc, idx) => {
    nodeIndexMap[loc.id] = idx;
  });

  const AVERAGE_SPEED_KMH = 32.0;
  const URBAN_CIRCUITY_FACTOR = 1.25;

  for (let i = 0; i < n; i++) {
    const durRow: number[] = [];
    const distRow: number[] = [];

    for (let j = 0; j < n; j++) {
      if (i === j) {
        durRow.push(0);
        distRow.push(0);
      } else {
        const straightKm = haversineDistanceKm(
          locations[i].lat,
          locations[i].lng,
          locations[j].lat,
          locations[j].lng
        );
        const roadDistanceKm = straightKm * URBAN_CIRCUITY_FACTOR;
        const distanceMeters = Math.round(roadDistanceKm * 1000);
        let durationSeconds = Math.round((roadDistanceKm / AVERAGE_SPEED_KMH) * 3600);

        // Apply road closure or corridor congestion if active between i and j
        if (roadClosures && roadClosures.length > 0) {
          for (const rc of roadClosures) {
            if (
              (rc.fromId === locations[i].id && rc.toId === locations[j].id) ||
              (rc.toId === locations[i].id && rc.fromId === locations[j].id)
            ) {
              durationSeconds += rc.additionalDelaySeconds;
            }
          }
        }

        durRow.push(Math.max(60, durationSeconds)); // Min 1 min between separate stops
        distRow.push(Math.max(200, distanceMeters));
      }
    }

    durationMatrix.push(durRow);
    distanceMatrix.push(distRow);
  }

  return {
    duration_matrix_seconds: durationMatrix,
    distance_matrix_meters: distanceMatrix,
    nodes: locations,
    nodeIndexMap,
  };
}
