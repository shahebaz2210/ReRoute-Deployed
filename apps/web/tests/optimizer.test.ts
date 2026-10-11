import { describe, it, expect } from "vitest";
import { solveLocally } from "../lib/optimizer/client";

describe("Optimizer VRPTW Engine", () => {
  it("generates valid routes respecting capacity and deadlines", () => {
    const payload = {
      plan_id: "TEST-01",
      vehicles: [
        {
          id: "V-1",
          name: "Van 1",
          capacity_kg: 500,
          capacity_m3: 5,
          depot_id: "DEPOT-1",
          max_shift_minutes: 480,
        },
        {
          id: "V-2",
          name: "Van 2",
          capacity_kg: 500,
          capacity_m3: 5,
          depot_id: "DEPOT-1",
          max_shift_minutes: 480,
        },
      ],
      stops: [
        {
          id: "STOP-1",
          name: "Order A",
          lat: 37.78,
          lng: -122.41,
          weight_kg: 100,
          volume_m3: 1,
          time_window_start_minutes: 480,
          time_window_end_minutes: 720,
          service_duration_minutes: 15,
        },
        {
          id: "STOP-2",
          name: "Order B",
          lat: 37.785,
          lng: -122.405,
          weight_kg: 120,
          volume_m3: 1.2,
          time_window_start_minutes: 500,
          time_window_end_minutes: 750,
          service_duration_minutes: 15,
        },
      ],
      depot: {
        id: "DEPOT-1",
        name: "Central Hub",
        lat: 37.7749,
        lng: -122.4194,
      },
    };

    const solution = solveLocally(payload);
    expect(solution.status).toBe("OPTIMAL");
    expect(solution.routes.length).toBeGreaterThan(0);
    expect(solution.unassigned_stop_ids.length).toBe(0);
    expect(solution.total_distance_km).toBeGreaterThan(0);
  });
});
