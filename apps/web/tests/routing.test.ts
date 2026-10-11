import { describe, it, expect } from "vitest";
import { fetchTravelTimeMatrix, LatLng } from "../lib/routing/valhalla";

describe("Phase 5: Map & Routing Integration (Valhalla & Matrices)", () => {
  it("computes travel time matrix with zero diagonals for identical coordinates", async () => {
    const locations: LatLng[] = [
      { lat: 51.5074, lng: -0.1278 },
      { lat: 51.5200, lng: -0.1100 },
      { lat: 51.4900, lng: -0.1400 },
    ];

    const result = await fetchTravelTimeMatrix(locations, "http://invalid-valhalla-host:9999");

    // Falls back to precomputed matrix (Task 134)
    expect(result.durationsSeconds.length).toBe(3);
    expect(result.durationsSeconds[0].length).toBe(3);
    expect(result.durationsSeconds[0][0]).toBe(0);
    expect(result.durationsSeconds[1][1]).toBe(0);
    expect(result.durationsSeconds[2][2]).toBe(0);
    expect(result.distancesMeters[0][0]).toBe(0);
    expect(result.isFallbackOffline).toBe(true);
  });

  it("handles empty locations gracefully", async () => {
    const result = await fetchTravelTimeMatrix([]);
    expect(result.durationsSeconds.length).toBe(0);
    expect(result.distancesMeters.length).toBe(0);
  });

  it("returns positive travel durations between distinct locations in the demo road network", async () => {
    const locations: LatLng[] = [
      { lat: 51.5074, lng: -0.1278 },
      { lat: 51.5200, lng: -0.1100 },
    ];

    const result = await fetchTravelTimeMatrix(locations);
    expect(result.durationsSeconds[0][1]).toBeGreaterThan(0);
    expect(result.durationsSeconds[1][0]).toBeGreaterThan(0);
    expect(result.distancesMeters[0][1]).toBeGreaterThan(0);
  });
});
