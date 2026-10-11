import { uuidv7 } from "./uuid";

export const DEMO_IDS = {
  orgId: "018f0000-0000-7000-8000-000000000001",
  dispatcherId: "usr_dispatcher_01",
  managerId: "usr_manager_01",
  depotId: "018f0000-0000-7000-8000-000000000010",
  planId: "018f0000-0000-7000-8000-000000000100",
  v1Id: "018f0000-0000-7000-8000-000000000201",
  v2Id: "018f0000-0000-7000-8000-000000000202",
  v3Id: "018f0000-0000-7000-8000-000000000203",
};

// 12 Demo Locations (Downtown & Metro logistics hubs)
export const DEMO_LOCATIONS = [
  {
    id: DEMO_IDS.depotId,
    code: "DEPOT-01",
    name: "Vortexa Central Logistics Depot",
    address: "100 Logistics Way, Central Hub",
    latitude: 37.7749,
    longitude: -122.4194,
  },
  {
    id: "018f0000-0000-7000-8000-000000000011",
    code: "LOC-01",
    name: "Mission District Medical Center",
    address: "1230 Mission St",
    latitude: 37.7765,
    longitude: -122.4172,
  },
  {
    id: "018f0000-0000-7000-8000-000000000012",
    code: "LOC-02",
    name: "SOMA Tech Plaza",
    address: "450 Howard St",
    latitude: 37.7885,
    longitude: -122.3982,
  },
  {
    id: "018f0000-0000-7000-8000-000000000013",
    code: "LOC-03",
    name: "Market Street Retail Flagship",
    address: "835 Market St",
    latitude: 37.7849,
    longitude: -122.4068,
  },
  {
    id: "018f0000-0000-7000-8000-000000000014",
    code: "LOC-04",
    name: "Embarcadero Financial Center",
    address: "101 California St",
    latitude: 37.7932,
    longitude: -122.3989,
  },
  {
    id: "018f0000-0000-7000-8000-000000000015",
    code: "LOC-05",
    name: "Fisherman Wharf Marine Supply",
    address: "2800 Leavenworth St",
    latitude: 37.8078,
    longitude: -122.4182,
  },
  {
    id: "018f0000-0000-7000-8000-000000000016",
    code: "LOC-06",
    name: "Nob Hill Executive Suites",
    address: "1075 California St",
    latitude: 37.7915,
    longitude: -122.4132,
  },
  {
    id: "018f0000-0000-7000-8000-000000000017",
    code: "LOC-07",
    name: "Civic Center Govt Warehouse",
    address: "401 Van Ness Ave",
    latitude: 37.7788,
    longitude: -122.4208,
  },
  {
    id: "018f0000-0000-7000-8000-000000000018",
    code: "LOC-08",
    name: "Marina Green Artisan Foods",
    address: "2050 Chestnut St",
    latitude: 37.8005,
    longitude: -122.4385,
  },
  {
    id: "018f0000-0000-7000-8000-000000000019",
    code: "LOC-09",
    name: "Pacific Heights Labs",
    address: "2400 Pacific Ave",
    latitude: 37.7925,
    longitude: -122.4328,
  },
  {
    id: "018f0000-0000-7000-8000-000000000020",
    code: "LOC-10",
    name: "Sunset District Distribution Point",
    address: "1350 9th Ave",
    latitude: 37.7628,
    longitude: -122.4665,
  },
  {
    id: "018f0000-0000-7000-8000-000000000021",
    code: "LOC-11",
    name: "Richmond Commercial Depot",
    address: "3200 Geary Blvd",
    latitude: 37.7818,
    longitude: -122.4542,
  },
  {
    id: "018f0000-0000-7000-8000-000000000022",
    code: "LOC-12",
    name: "Potrero Hill Industrial Park",
    address: "1050 16th St",
    latitude: 37.7668,
    longitude: -122.3965,
  },
];

// Precomputed Travel Time & Distance Matrix (13x13 nodes: Depot + 12 Stops)
export function getPrecomputedDistanceMatrix() {
  const n = DEMO_LOCATIONS.length;
  const durations: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
  const distances: number[][] = Array.from({ length: n }, () => Array(n).fill(0));

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      const locA = DEMO_LOCATIONS[i];
      const locB = DEMO_LOCATIONS[j];
      // Euclidean proxy scaled to urban street grid
      const dLat = (locA.latitude - locB.latitude) * 111000;
      const dLng = (locA.longitude - locB.longitude) * 88000;
      const directMeters = Math.sqrt(dLat * dLat + dLng * dLng);
      // Street factor ~1.35x
      const streetMeters = Math.round(directMeters * 1.35);
      distances[i][j] = streetMeters;
      // Urban average speed: 8.5 m/s (~30 km/h) + traffic jitter
      durations[i][j] = Math.round(streetMeters / 8.5) + 60;
    }
  }

  return { distances, durations, locations: DEMO_LOCATIONS };
}
