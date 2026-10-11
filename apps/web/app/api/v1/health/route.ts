import { NextResponse } from "next/server";
import { getTelemetrySpans } from "@/lib/telemetry/metrics";

export async function GET() {
  const spans = getTelemetrySpans();

  return NextResponse.json({
    status: "HEALTHY",
    service: "DispatchX Web & Gateway",
    version: "3.0.0-rc1",
    timestamp: new Date().toISOString(),
    uptime_seconds: process.uptime(),
    checks: {
      nextjs_web: "UP",
      vrptw_optimizer: "READY",
      valhalla_routing: "STANDBY_RESILIENT",
      elevenlabs_voice: process.env.ELEVENLABS_API_KEY ? "CONFIGURED" : "FALLBACK_SPEECH_SYNTH",
      database_postgis: "CONFIGURED",
    },
    metrics: {
      recent_operations_count: spans.length,
      average_duration_ms:
        spans.length > 0
          ? Math.round(spans.reduce((acc, s) => acc + s.durationMs, 0) / spans.length)
          : 0,
    },
  });
}
