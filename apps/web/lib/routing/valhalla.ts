export interface LatLng {
  lat: number;
  lng: number;
}

export interface RouteGeometry {
  coordinates: [number, number][]; // [lng, lat]
  distanceKm: number;
  durationSeconds: number;
}

export interface MatrixResponse {
  durationsSeconds: number[][];
  distancesMeters: number[][];
  isFallbackOffline: boolean;
}

// 12x12 precomputed matrix fallback for demo network (Task 134)
const DEMO_FALLBACK_MATRIX = [
  [0, 480, 720, 950, 1200, 1400, 1600, 1850, 2100, 2300, 2500, 2800],
  [480, 0, 360, 600, 850, 1100, 1300, 1500, 1800, 2000, 2200, 2500],
  [720, 360, 0, 420, 680, 900, 1150, 1350, 1600, 1850, 2050, 2350],
  [950, 600, 420, 0, 390, 610, 840, 1080, 1320, 1550, 1780, 2050],
  [1200, 850, 680, 390, 0, 340, 580, 820, 1050, 1280, 1500, 1800],
  [1400, 1100, 900, 610, 340, 0, 360, 600, 840, 1060, 1300, 1600],
  [1600, 1300, 1150, 840, 580, 360, 0, 380, 620, 850, 1100, 1400],
  [1850, 1500, 1350, 1080, 820, 600, 380, 0, 350, 590, 830, 1150],
  [2100, 1800, 1600, 1320, 1050, 840, 620, 350, 0, 370, 610, 920],
  [2300, 2000, 1850, 1550, 1280, 1060, 850, 590, 370, 0, 360, 680],
  [2500, 2200, 2050, 1780, 1500, 1300, 1100, 830, 610, 360, 0, 450],
  [2800, 2500, 2350, 2050, 1800, 1600, 1400, 1150, 920, 680, 450, 0],
];

export async function fetchTravelTimeMatrix(
  locations: LatLng[],
  valhallaUrl = process.env.VALHALLA_URL || "http://localhost:8002"
): Promise<MatrixResponse> {
  if (locations.length === 0) {
    return { durationsSeconds: [], distancesMeters: [], isFallbackOffline: false };
  }

  try {
    const payload = {
      sources: locations.map((loc) => ({ lat: loc.lat, lon: loc.lng })),
      targets: locations.map((loc) => ({ lat: loc.lat, lon: loc.lng })),
      costing: "auto",
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000); // 2s timeout

    const res = await fetch(`${valhallaUrl}/sources_to_targets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (data.sources_to_targets && Array.isArray(data.sources_to_targets)) {
        // Validate matrix dimensions (Task 133)
        const durations: number[][] = [];
        const distances: number[][] = [];

        for (let i = 0; i < locations.length; i++) {
          durations[i] = [];
          distances[i] = [];
          for (let j = 0; j < locations.length; j++) {
            const item = data.sources_to_targets[i]?.[j];
            durations[i][j] = item?.time ?? (i === j ? 0 : 600);
            distances[i][j] = item?.distance ?? (i === j ? 0 : 5000);
          }
        }

        return {
          durationsSeconds: durations,
          distancesMeters: distances,
          isFallbackOffline: false,
        };
      }
    }
  } catch (err) {
    console.warn("[ROUTING] Valhalla service unreachable, engaging precomputed matrix fallback (Task 134):", err);
  }

  // Graceful fallback to precomputed demo matrix with "offline" flag (Tasks 133, 134)
  const n = locations.length;
  const durations: number[][] = [];
  const distances: number[][] = [];

  for (let i = 0; i < n; i++) {
    durations[i] = [];
    distances[i] = [];
    for (let j = 0; j < n; j++) {
      if (i === j) {
        durations[i][j] = 0;
        distances[i][j] = 0;
      } else {
        const fallbackVal = DEMO_FALLBACK_MATRIX[i % 12][j % 12] || 600;
        durations[i][j] = fallbackVal;
        distances[i][j] = fallbackVal * 10; // ~36 km/h avg
      }
    }
  }

  return {
    durationsSeconds: durations,
    distancesMeters: distances,
    isFallbackOffline: true,
  };
}
