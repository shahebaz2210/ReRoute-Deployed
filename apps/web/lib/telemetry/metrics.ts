/**
 * DispatchX Telemetry & Performance Metrics Logger (Phase 17)
 * Provides OpenTelemetry-compatible structured logging and trace context propagation.
 */

export interface TelemetrySpan {
  traceId: string;
  spanId: string;
  name: string;
  durationMs: number;
  statusCode: "OK" | "ERROR";
  attributes: Record<string, any>;
  timestamp: string;
}

const spanBuffer: TelemetrySpan[] = [];

export function recordSpan(
  name: string,
  durationMs: number,
  attributes: Record<string, any> = {},
  isError: boolean = false
): TelemetrySpan {
  const span: TelemetrySpan = {
    traceId: `tr_${Date.now().toString(16)}_${Math.random().toString(16).slice(2, 8)}`,
    spanId: `sp_${Math.random().toString(16).slice(2, 10)}`,
    name,
    durationMs,
    statusCode: isError ? "ERROR" : "OK",
    attributes,
    timestamp: new Date().toISOString(),
  };

  spanBuffer.unshift(span);
  if (spanBuffer.length > 100) {
    spanBuffer.pop();
  }

  return span;
}

export function getTelemetrySpans(): TelemetrySpan[] {
  return [...spanBuffer];
}
