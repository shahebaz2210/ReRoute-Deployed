import { describe, it, expect } from "vitest";
import { recordSpan, getTelemetrySpans } from "../lib/telemetry/metrics";

describe("Phase 17 & 18: Observability & Performance Metrics", () => {
  it("records telemetry spans with traceId and duration", () => {
    const span = recordSpan("test_route_optimization", 125, { planId: "TEST-01" });
    expect(span.name).toBe("test_route_optimization");
    expect(span.durationMs).toBe(125);
    expect(span.statusCode).toBe("OK");
    expect(span.traceId).toContain("tr_");

    const spans = getTelemetrySpans();
    expect(spans.length).toBeGreaterThan(0);
    expect(spans[0].name).toBe("test_route_optimization");
  });
});
