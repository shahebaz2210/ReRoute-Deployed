/**
 * Simulated Travel Time Matrix Module
 * Strictly adheres to PS S-01 (ReRoute):
 * "Inputs include the depot, vehicles, deliveries, and a matrix of simulated travel times;
 *  no live mapping or GPS service may be used."
 */

export interface NetworkLocationNode {
  id: string;
  name: string;
  nodeIndex: number;
}

export interface SimulatedRoadClosure {
  location_a_id: string;
  location_b_id: string;
  additional_delay_minutes: number;
  active_until_minutes: number;
}

// Fixed network nodes
export const SIMULATED_NETWORK_NODES: NetworkLocationNode[] = [
  { id: "DEPOT-SF-01", name: "Central Hub Depot", nodeIndex: 0 },
  { id: "ORD-9901", name: "Apex BioLabs (Berry St)", nodeIndex: 1 },
  { id: "ORD-9902", name: "Marina Grocers (Chestnut St)", nodeIndex: 2 },
  { id: "ORD-9903", name: "Mission Culinary Arts (Valencia St)", nodeIndex: 3 },
  { id: "ORD-9904", name: "Presidio Diagnostic Clinic (Montgomery St)", nodeIndex: 4 },
  { id: "ORD-9905", name: "BayTech Robotics (2nd St)", nodeIndex: 5 },
  { id: "ORD-9906", name: "Van Ness Diagnostic Lab (Van Ness)", nodeIndex: 6 },
];

/**
 * Deterministic baseline simulated travel time matrix in minutes (NxN).
 * Purely simulated offline matrix — zero external GPS or live mapping dependencies.
 *
 * Matrix indices:
 * 0: DEPOT-SF-01
 * 1: ORD-9901 (Apex BioLabs)
 * 2: ORD-9902 (Marina Grocers)
 * 3: ORD-9903 (Mission Culinary)
 * 4: ORD-9904 (Presidio Diagnostic)
 * 5: ORD-9905 (BayTech Robotics)
 * 6: ORD-9906 (Van Ness Diagnostic Lab)
 */
export const BASELINE_SIMULATED_TRAVEL_TIME_MATRIX_MINUTES: number[][] = [
  // 0    1    2    3    4    5    6
  [  0,  14,  26,  16,  24,  10,  18 ], // 0: DEPOT
  [ 14,   0,  28,  18,  30,  12,  22 ], // 1: ORD-9901
  [ 26,  28,   0,  32,  15,  24,  20 ], // 2: ORD-9902
  [ 16,  18,  32,   0,  28,  14,  15 ], // 3: ORD-9903
  [ 24,  30,  15,  28,   0,  26,  22 ], // 4: ORD-9904
  [ 10,  12,  24,  14,  26,   0,  16 ], // 5: ORD-9905
  [ 18,  22,  20,  15,  22,  16,   0 ], // 6: ORD-9906
];

/**
 * Build a customized simulated travel time matrix for any requested list of location IDs,
 * taking into account active road closures.
 */
export function getSimulatedTravelTimeMatrix(
  locationIds: string[],
  activeRoadClosures: SimulatedRoadClosure[] = [],
  currentTimeMinutes: number = 480 // 08:00 default
): { matrix: number[][]; locationIds: string[] } {
  const n = locationIds.length;
  const matrix: number[][] = Array.from({ length: n }, () => Array(n).fill(0));

  const idToIndex = new Map<string, number>();
  SIMULATED_NETWORK_NODES.forEach((node) => {
    idToIndex.set(node.id, node.nodeIndex);
  });

  for (let i = 0; i < n; i++) {
    const fromId = locationIds[i];
    const fromBaseIdx = idToIndex.get(fromId) ?? 0;

    for (let j = 0; j < n; j++) {
      if (i === j) {
        matrix[i][j] = 0;
        continue;
      }

      const toId = locationIds[j];
      const toBaseIdx = idToIndex.get(toId) ?? 0;

      let travelTime =
        fromBaseIdx < BASELINE_SIMULATED_TRAVEL_TIME_MATRIX_MINUTES.length &&
        toBaseIdx < BASELINE_SIMULATED_TRAVEL_TIME_MATRIX_MINUTES[fromBaseIdx].length
          ? BASELINE_SIMULATED_TRAVEL_TIME_MATRIX_MINUTES[fromBaseIdx][toBaseIdx]
          : 20; // fallback 20 mins if outside baseline matrix

      // Apply road closures if active during current time
      for (const closure of activeRoadClosures) {
        if (
          ((closure.location_a_id === fromId && closure.location_b_id === toId) ||
            (closure.location_b_id === fromId && closure.location_a_id === toId)) &&
          currentTimeMinutes < closure.active_until_minutes
        ) {
          travelTime += closure.additional_delay_minutes;
        }
      }

      matrix[i][j] = travelTime;
    }
  }

  return { matrix, locationIds };
}
