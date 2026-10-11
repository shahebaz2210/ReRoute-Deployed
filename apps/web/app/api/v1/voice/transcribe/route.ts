import { NextRequest, NextResponse } from "next/server";
import { parseVoiceTranscript, ParsedVoiceIncident } from "@/lib/voice/elevenlabs";
import { mockDisruptions } from "@/lib/mock-data";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const transcript = body.transcript || body.text || "";
    const vehicleId = body.vehicle_id || "VH-001";

    if (!transcript.trim()) {
      return NextResponse.json({ error: "Empty speech transcript" }, { status: 400 });
    }

    // 1. NLP extract incident
    const incident: ParsedVoiceIncident = parseVoiceTranscript(transcript, vehicleId);

    // If location is unrecognized, enforce hard rejection policy (PS S-01)
    if (incident.status === "REJECTED") {
      return NextResponse.json({
        success: false,
        guardrailRejected: true,
        rejectionReason: incident.rejection_reason,
        voiceFeedback: incident.voice_feedback || "Location unrecognized, please state a valid sector.",
        incident,
      });
    }

    // 2. Synthesize disruption event into platform disruptions
    const disruptionRecord = {
      id: `DISR-${Date.now().toString().slice(-4)}`,
      type: incident.type,
      severity: incident.severity,
      vehicleId: incident.vehicle_id,
      from: incident.from,
      to: incident.to,
      delayMinutes: incident.delay_minutes,
      description: incident.extracted_summary,
      impactDurationMinutes: incident.delay_minutes,
      timestamp: new Date().toISOString(),
      status: "OPEN",
      recommendedAction: incident.recommended_action,
      structuredParameters: {
        type: incident.type,
        from: incident.from,
        to: incident.to,
        delay_min: incident.delay_minutes,
      },
    };

    // Add to mock disruptions pool
    mockDisruptions.unshift(disruptionRecord as any);

    return NextResponse.json({
      success: true,
      incident,
      disruption: disruptionRecord,
      structured: {
        type: incident.type,
        from: incident.from,
        to: incident.to,
        delay_min: incident.delay_minutes,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to process voice transcript" }, { status: 500 });
  }
}
