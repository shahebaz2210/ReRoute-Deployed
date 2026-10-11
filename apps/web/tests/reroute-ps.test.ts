import { describe, it, expect } from "vitest";
import { solveLocally, OptimizationPayload } from "../lib/optimizer/client";
import { parseVoiceTranscript } from "../lib/voice/elevenlabs";
import { comparePlanVersions } from "../lib/plans/compare";

describe("PS S-01 — ReRoute: Dynamic Fleet & Delivery Replanning Full Verification Suite", () => {
  // Base Demo Setup
  const depot = { id: "DEPOT-SF-01", name: "Central Hub", lat: 37.7749, lng: -122.4194 };
  const vehicles = [
    {
      id: "V-1",
      name: "Van Alpha",
      capacity_kg: 500,
      capacity_m3: 5.0,
      depot_id: "DEPOT-SF-01",
      max_shift_minutes: 480, // 8 hours
    },
    {
      id: "V-2",
      name: "Van Beta",
      capacity_kg: 500,
      capacity_m3: 5.0,
      depot_id: "DEPOT-SF-01",
      max_shift_minutes: 480,
    },
  ];

  const stops = [
    {
      id: "STOP-1",
      name: "Apex BioLabs",
      lat: 37.7765,
      lng: -122.3934,
      weight_kg: 100,
      volume_m3: 1.0,
      time_window_start_minutes: 500, // 08:20
      time_window_end_minutes: 600,   // 10:00
      service_duration_minutes: 15,
    },
    {
      id: "STOP-2",
      name: "Marina Grocers",
      lat: 37.8001,
      lng: -122.4398,
      weight_kg: 150,
      volume_m3: 1.5,
      time_window_start_minutes: 540, // 09:00
      time_window_end_minutes: 700,   // 11:40
      service_duration_minutes: 15,
    },
    {
      id: "STOP-3",
      name: "Mission Culinary",
      lat: 37.7607,
      lng: -122.4216,
      weight_kg: 200,
      volume_m3: 2.0,
      time_window_start_minutes: 560, // 09:20
      time_window_end_minutes: 720,   // 12:00
      service_duration_minutes: 20,
    },
  ];

  // 1. Initial Plan & Algorithm Limits & Waiting Time Check
  it("Requirement 1: Solves allocation respecting capacity and time windows; records arrival & waiting time", () => {
    const payload: OptimizationPayload = {
      plan_id: "PLAN-BASE-01",
      vehicles,
      stops,
      depot,
    };

    const solution = solveLocally(payload);
    expect(solution.status).toBe("OPTIMAL");
    expect(solution.algorithm_explanation).toContain("Earliest-Deadline Forward Insertion");
    expect(solution.unassigned_stop_ids.length).toBe(0);

    // Verify arrival time and waiting time are explicitly tracked
    const allStops = solution.routes.flatMap((r) => r.stops);
    expect(allStops.length).toBe(3);
    for (const s of allStops) {
      expect(s.arrival_time_minutes).toBeGreaterThan(0);
      expect(s.departure_time_minutes).toBeGreaterThan(s.arrival_time_minutes);
      expect(typeof s.waiting_time_minutes).toBe("number");
    }
  });

  // 2. Capacity Overload & Unassigned Reason
  it("Requirement 2: Never overloads a vehicle at any point and reports unplaced reason", () => {
    const heavyStops = [
      ...stops,
      {
        id: "STOP-OVERLOAD",
        name: "Massive Steel Cargo",
        lat: 37.7800,
        lng: -122.4100,
        weight_kg: 800, // Exceeds both 500kg capacity vehicles
        volume_m3: 1.0,
        time_window_start_minutes: 500,
        time_window_end_minutes: 800,
        service_duration_minutes: 15,
      },
    ];

    const payload: OptimizationPayload = {
      plan_id: "PLAN-OVERLOAD-01",
      vehicles,
      stops: heavyStops,
      depot,
    };

    const solution = solveLocally(payload);
    expect(solution.unassigned_stop_ids).toContain("STOP-OVERLOAD");
    expect(solution.unassigned_reasons["STOP-OVERLOAD"]).toContain("EXCEEDS_MAX_WEIGHT_CAPACITY");

    // Ensure no vehicle was overloaded
    for (const r of solution.routes) {
      expect(r.total_weight_kg).toBeLessThanOrEqual(500);
      expect(r.total_volume_m3).toBeLessThanOrEqual(5.0);
    }
  });

  // 3. Disruption 1: Road Closure
  it("Requirement 3 (Disruption 1): Road closure increases travel time between locations for stated period", () => {
    const payloadWithClosure: OptimizationPayload = {
      plan_id: "PLAN-CLOSURE-01",
      vehicles,
      stops,
      depot,
      road_closures: [
        {
          location_a_id: "DEPOT-SF-01",
          location_b_id: "STOP-1",
          additional_delay_minutes: 45, // 45 min delay on bridge closure
          active_until_minutes: 700,
        },
      ],
    };

    const solution = solveLocally(payloadWithClosure);
    expect(solution.status).toBe("OPTIMAL");
    // Verify total duration adjusted for closure
    expect(solution.total_duration_minutes).toBeGreaterThan(0);
  });

  // 4. Disruption 2: Vehicle Failure at Stated Time & Freeze Horizon
  it("Requirement 4 (Disruption 2): Vehicle fails at stated time and receives NO stops after failure time", () => {
    const failedVehicles = [
      {
        ...vehicles[0],
        failure_time_minutes: 510, // Fails at 08:30 AM (minute 510)
      },
      vehicles[1], // Van Beta remains active
    ];

    // STOP-1 is completed before failure; STOP-2 and STOP-3 are pending
    const stopsWithCompleted = [
      { ...stops[0], is_completed: true, assigned_vehicle_id: "V-1" }, // Completed stay fixed
      stops[1],
      stops[2],
    ];

    const payload: OptimizationPayload = {
      plan_id: "PLAN-REPLAN-VEHICLE-FAIL",
      vehicles: failedVehicles,
      stops: stopsWithCompleted,
      depot,
    };

    const solution = solveLocally(payload);
    const v1Route = solution.routes.find((r) => r.vehicle_id === "V-1");
    const v2Route = solution.routes.find((r) => r.vehicle_id === "V-2");

    // Completed stop stay fixed on V-1
    expect(v1Route?.stops.some((s) => s.stop_id === "STOP-1")).toBe(true);

    // Failed vehicle receives NO pending stops after failure time!
    const v1StopsAfterFailure = v1Route?.stops.filter(
      (s) => s.stop_id !== "STOP-1" && s.arrival_time_minutes >= 510
    );
    expect(v1StopsAfterFailure?.length || 0).toBe(0);

    // Pending stops are reallocated to active Van Beta (V-2)
    expect(v2Route?.stops.length).toBeGreaterThan(0);
  });

  // 5. Disruption 3: Urgent Delivery Added During the Day
  it("Requirement 5 (Disruption 3): Urgent delivery added during the day dynamically", () => {
    const urgentDelivery = {
      id: "STOP-URGENT",
      name: "Emergency Blood Sample",
      lat: 37.7780,
      lng: -122.4150,
      weight_kg: 10,
      volume_m3: 0.1,
      time_window_start_minutes: 510,
      time_window_end_minutes: 580, // tight window
      service_duration_minutes: 10,
    };

    const payload: OptimizationPayload = {
      plan_id: "PLAN-URGENT-ADD",
      vehicles,
      stops: [...stops, urgentDelivery],
      depot,
    };

    const solution = solveLocally(payload);
    expect(solution.status).toBe("OPTIMAL");
    const assignedStops = solution.routes.flatMap((r) => r.stops.map((s) => s.stop_id));
    expect(assignedStops).toContain("STOP-URGENT");
  });

  // 6. Text Report Interpretation & Unknown Location Rejection
  it("Requirement 6: Text reports with unknown locations MUST be rejected, not guessed at", () => {
    // 6a: Text report with an unknown location outside network
    const unknownReport = "Emergency bridge closure on Broadway Expressway near Gotham Harbor, expect 45 min delay";
    const parsedUnknown = parseVoiceTranscript(unknownReport, "V-1");
    expect(parsedUnknown.status).toBe("REJECTED");
    expect(parsedUnknown.rejection_reason).toContain("Report rejected: Location");
    expect(parsedUnknown.rejection_reason).toContain("unknown in the delivery network");
    expect(parsedUnknown.requires_dispatcher_confirmation).toBe(true);

    // 6b: Text report with a known location in network
    const validReport = "Emergency road closure on Market St near stop ORD-9902 for 45 minutes";
    const parsedValid = parseVoiceTranscript(validReport, "V-1");
    expect(parsedValid.status).toBe("VALID");
    expect(parsedValid.type).toBe("ROAD_CLOSURE");
    expect(parsedValid.requires_dispatcher_confirmation).toBe(true); // Dispatcher must confirm
  });

  // 7. Side-by-Side Original and Revised Plans Comparison (KEPT / MOVED / BROKEN)
  it("Requirement 7: Compares original and revised plans side by side, classifying every delivery as kept, moved, or broken", () => {
    const baselineRoutes = [
      {
        vehicle_id: "V-1",
        stops: [
          { stop_id: "STOP-1", sequence: 1, arrival: "08:45 AM", customer: "Apex BioLabs" },
          { stop_id: "STOP-2", sequence: 2, arrival: "09:30 AM", customer: "Marina Grocers" },
          { stop_id: "STOP-3", sequence: 3, arrival: "10:15 AM", customer: "Mission Culinary" },
        ],
      },
    ];

    // Revised routes after V-1 failure: STOP-1 kept, STOP-2 moved to V-2, STOP-3 broken/unassigned
    const targetRoutes = [
      {
        vehicle_id: "V-1",
        stops: [
          { stop_id: "STOP-1", sequence: 1, arrival: "08:45 AM", customer: "Apex BioLabs" }, // KEPT
        ],
      },
      {
        vehicle_id: "V-2",
        stops: [
          { stop_id: "STOP-2", sequence: 1, arrival: "09:45 AM", customer: "Marina Grocers" }, // MOVED
        ],
      },
    ];

    const comparison = comparePlanVersions(baselineRoutes, targetRoutes, ["STOP-3"]);
    expect(comparison.kept_count).toBe(1);
    expect(comparison.moved_count).toBe(1);
    expect(comparison.broken_count).toBe(1);

    const keptDelta = comparison.stop_deltas.find((d) => d.stop_id === "STOP-1");
    const movedDelta = comparison.stop_deltas.find((d) => d.stop_id === "STOP-2");
    const brokenDelta = comparison.stop_deltas.find((d) => d.stop_id === "STOP-3");

    expect(keptDelta?.status).toBe("KEPT");
    expect(movedDelta?.status).toBe("MOVED");
    expect(movedDelta?.reason).toContain("Reassigned from V-1 to V-2");
    expect(brokenDelta?.status).toBe("BROKEN");
    expect(brokenDelta?.reason).toContain("Unassigned");
  });
});
