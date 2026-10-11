import { describe, it, expect } from "vitest";
import { parseVoiceTranscript } from "../lib/voice/elevenlabs";

describe("Phase 8: ElevenLabs Voice Integration & Incident Extraction", () => {
  it("extracts road closure with high severity and estimated delay", () => {
    const transcript = "Hey dispatch, complete road closure on Market Street due to burst water pipe, delay is about 35 minutes";
    const incident = parseVoiceTranscript(transcript, "VH-001");
    expect(incident.type).toBe("ROAD_CLOSURE");
    expect(incident.severity).toBe("HIGH");
    expect(incident.delay_minutes).toBe(35);
    expect(incident.vehicle_id).toBe("VH-001");
    expect(incident.recommended_action).toContain("detour");
  });

  it("extracts vehicle breakdown with critical severity", () => {
    const transcript = "We have an engine breakdown on Van Ness, smoke coming out, vehicle stopped";
    const incident = parseVoiceTranscript(transcript, "VH-003");
    expect(incident.type).toBe("VEHICLE_BREAKDOWN");
    expect(incident.severity).toBe("CRITICAL");
    expect(incident.recommended_action).toContain("reassign");
  });

  it("extracts customer unavailable exception and order id", () => {
    const transcript = "Store is locked, customer unavailable at ORD-9902 Marina Grocers";
    const incident = parseVoiceTranscript(transcript, "VH-002");
    expect(incident.type).toBe("CUSTOMER_UNAVAILABLE");
    expect(incident.severity).toBe("LOW");
    expect(incident.order_id).toBe("ORD-9902");
  });
});
