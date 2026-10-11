/**
 * ElevenLabs Voice & Text Disruption Parsing Module
 * Strictly adheres to Problem Statement S-01 (ReRoute: Dynamic Fleet & Delivery Replanning):
 * 1. Road closure increasing travel time between two locations for a stated period.
 * 2. Vehicle failure at a stated time (receives no stops after failure time).
 * 3. Urgent delivery added during the day.
 * 
 * Hard Policy: Reports referencing an unknown location MUST be REJECTED, not guessed at.
 * Dispatcher confirmation required before any text report takes effect.
 */

export interface ParsedVoiceIncident {
  type: "ROAD_CLOSURE" | "VEHICLE_BREAKDOWN" | "URGENT_DELIVERY" | "CUSTOMER_UNAVAILABLE" | "TRAFFIC_DELAY";
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "VALID" | "REJECTED";
  rejection_reason?: string;
  voice_feedback?: string;
  order_id?: string;
  vehicle_id?: string;
  failure_time_minutes?: number;
  delay_minutes: number;
  delay_min?: number;
  from?: string;
  to?: string;
  duration_period_minutes?: number;
  location_from?: string;
  location_to?: string;
  raw_transcript: string;
  extracted_summary: string;
  recommended_action: string;
  requires_dispatcher_confirmation: boolean;
}

// Known nodes / delivery locations in the active network
export const KNOWN_NETWORK_LOCATIONS = [
  "market st",
  "chestnut st",
  "berry st",
  "valencia st",
  "montgomery st",
  "2nd st",
  "van ness",
  "soma central hub",
  "marina grocers",
  "apex biolabs",
  "mission culinary",
  "presidio clinic",
  "baytech robotics",
  "depot-sf-01",
  "depot-central",
  "depot-north",
  "depot-east",
  "node 1",
  "node 2",
  "node 3",
  "node 4",
  "node 5",
  "node 6",
  "node 7",
  "node 8",
  "node 9",
  "node 10",
  "loc_01",
  "loc_02",
  "loc_03",
  "loc_04",
  "loc_05",
  "loc_06",
  "loc_07",
  "loc_08",
  "ord-9901",
  "ord-9902",
  "ord-9903",
  "ord-9904",
  "ord-9905",
];

export function parseVoiceTranscript(
  transcript: string,
  driverVehicleId: string = "VH-001",
  customKnownLocations: string[] = []
): ParsedVoiceIncident {
  const text = transcript.toLowerCase();
  const known = [...KNOWN_NETWORK_LOCATIONS, ...customKnownLocations.map((l) => l.toLowerCase())];

  // Detect vehicle mention if present in transcript (e.g. "Truck 2", "Truck 1", "Van 3")
  let vehicleId = driverVehicleId;
  const truckMatch = text.match(/(?:truck|vehicle|van)\s*#?\s*(\d+)/i);
  if (truckMatch) {
    const num = parseInt(truckMatch[1], 10);
    vehicleId = num < 10 ? `TRK-0${num}` : `TRK-${num}`;
  }

  // 1. Detect location mentions (between Loc A and Loc B, or at/on/near Loc)
  const betweenMatch = text.match(/between\s+([a-z0-9_\s]{2,20}?)\s+and\s+([a-z0-9_\s]{2,20}?)(?:,|\.|$|\s+traffic|\s+due|\s+waterlogging|\s+for|\s+at)/i);
  let locFrom: string | undefined;
  let locTo: string | undefined;

  if (betweenMatch) {
    const rawFrom = betweenMatch[1].trim();
    const rawTo = betweenMatch[2].trim();

    // Guardrail Check
    const fromKnown = known.some((k) => rawFrom.includes(k) || k.includes(rawFrom));
    const toKnown = known.some((k) => rawTo.includes(k) || k.includes(rawTo));

    if (!fromKnown || !toKnown) {
      const invalidLoc = !fromKnown ? rawFrom : rawTo;
      return {
        type: "ROAD_CLOSURE",
        severity: "HIGH",
        status: "REJECTED",
        rejection_reason: `Report rejected: Location '${invalidLoc}' is unknown in the delivery network. Location unrecognized, please state a valid sector.`,
        voice_feedback: `Location unrecognized, please state a valid sector.`,
        vehicle_id: vehicleId,
        delay_minutes: 0,
        raw_transcript: transcript,
        extracted_summary: `Location unrecognized, please state a valid sector (Unknown: '${invalidLoc}').`,
        recommended_action: "Reject report and request clarification from driver",
        requires_dispatcher_confirmation: true,
      };
    }

    // Normalize Node X to LOC_0X
    const nodeFromNum = rawFrom.match(/node\s*(\d+)/i);
    locFrom = nodeFromNum ? `LOC_0${nodeFromNum[1]}` : rawFrom.toUpperCase().replace(/\s+/g, "_");
    const nodeToNum = rawTo.match(/node\s*(\d+)/i);
    locTo = nodeToNum ? `LOC_0${nodeToNum[1]}` : rawTo.toUpperCase().replace(/\s+/g, "_");
  } else {
    // Single location detection: "at <loc>", "on <loc>", "near <loc>", "sector <loc>"
    const singleLocMatch = text.match(/(?:at|on|near|in|sector)\s+([a-z0-9\s]{3,30}?)(?:,|\.|\s+due|\s+delayed|\s+blocked|\s+closed|\s+at|$)/i);
    let detectedLocation = singleLocMatch ? singleLocMatch[1].trim() : null;

    if (detectedLocation && (detectedLocation.startsWith("the ") || detectedLocation.startsWith("a "))) {
      detectedLocation = detectedLocation.replace(/^(the|a)\s+/i, "");
    }

    if (detectedLocation) {
      const isKnown = known.some((k) => detectedLocation!.includes(k) || k.includes(detectedLocation!));
      if (!isKnown) {
        return {
          type: "ROAD_CLOSURE",
          severity: "HIGH",
          status: "REJECTED",
          rejection_reason: `Report rejected: Location '${detectedLocation}' is unknown in the delivery network. Location unrecognized, please state a valid sector.`,
          voice_feedback: `Location unrecognized, please state a valid sector.`,
          vehicle_id: vehicleId,
          delay_minutes: 0,
          raw_transcript: transcript,
          extracted_summary: `Location unrecognized, please state a valid sector (Unknown: '${detectedLocation}').`,
          recommended_action: "Reject report and request clarification from driver",
          requires_dispatcher_confirmation: true,
        };
      }
      locFrom = detectedLocation;
    }
  }

  // 2. Identify Disruption Type
  let type: ParsedVoiceIncident["type"] = "TRAFFIC_DELAY";
  let severity: ParsedVoiceIncident["severity"] = "MEDIUM";
  let delay = 15;
  let action = "Hold schedule and recalculate ETA";
  let failureTime: number | undefined = undefined;
  let durationPeriod = 60; // 60 min default closure period

  if (text.includes("urgent") || text.includes("priority delivery") || text.includes("emergency order")) {
    type = "URGENT_DELIVERY";
    severity = "HIGH";
    action = "Insert urgent delivery into optimal active vehicle route respecting capacity and deadlines";
  } else if (text.includes("breakdown") || text.includes("failed") || text.includes("failure") || text.includes("flat tire") || text.includes("engine") || text.includes("overheated")) {
    type = "VEHICLE_BREAKDOWN";
    severity = "CRITICAL";
    delay = 120;
    failureTime = 630; // default 10:30 AM (630 mins from midnight)
    const timeMatch = text.match(/at\s+(\d{1,2}):?(\d{2})?\s*(am|pm)?/i);
    if (timeMatch) {
      const hours = parseInt(timeMatch[1], 10);
      const mins = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
      const isPm = timeMatch[3]?.toLowerCase() === "pm";
      failureTime = (isPm && hours !== 12 ? hours + 12 : hours) * 60 + mins;
    }
    action = `Halt ${vehicleId} at failure time (${failureTime}m). Reassign and reassign remaining route stops to active fleet.`;
  } else if (text.includes("closure") || text.includes("closed") || text.includes("bridge") || text.includes("blocked") || text.includes("waterlogging") || text.includes("flooded") || text.includes("halted")) {
    type = "ROAD_CLOSURE";
    severity = "HIGH";
    delay = 60;
    // Extract stated duration period if mentioned: "an hour", "1 hour", "for 2 hours", "for 45 minutes"
    if (text.includes("an hour") || text.includes("one hour") || text.includes("1 hour")) {
      delay = 60;
      durationPeriod = 60;
    } else {
      const durMatch = text.match(/for\s+(\d+)\s*(hour|minute|min)/i);
      if (durMatch) {
        const val = parseInt(durMatch[1], 10);
        delay = durMatch[2].startsWith("hour") ? val * 60 : val;
        durationPeriod = delay;
      }
    }
    action = `Increase travel time between ${locFrom || "segment"} and ${locTo || "segment"} by +${delay}m for ${durationPeriod}m. Trigger dynamic detour.`;
  } else if (text.includes("nobody") || text.includes("not home") || text.includes("customer unavailable")) {
    type = "CUSTOMER_UNAVAILABLE";
    severity = "LOW";
    delay = 10;
    action = "Mark stop as failed attempt and proceed to next stop";
  }

  // Extract order reference
  const orderMatch = transcript.match(/ord-?\d+/i) || transcript.match(/order\s*#?\s*(\d+)/i);
  const orderId = orderMatch ? orderMatch[0].toUpperCase().replace("ORDER", "ORD") : undefined;

  // Extract custom delay minutes if explicitly stated
  const minMatch = transcript.match(/(\d+)\s*(?:min|minute)/i);
  if (minMatch) {
    delay = parseInt(minMatch[1], 10);
  }

  return {
    type,
    severity,
    status: "VALID",
    order_id: orderId,
    vehicle_id: vehicleId,
    failure_time_minutes: failureTime,
    delay_minutes: delay,
    delay_min: delay,
    from: locFrom,
    to: locTo,
    duration_period_minutes: durationPeriod,
    location_from: locFrom,
    location_to: locTo,
    raw_transcript: transcript,
    extracted_summary: locTo
      ? `${type.replace(/_/g, " ")} reported between ${locFrom} and ${locTo}. Delay: ${delay}m (${vehicleId}).`
      : `${type.replace(/_/g, " ")} at ${locFrom || "active route"}. Delay: ${delay}m (${vehicleId}).`,
    recommended_action: action,
    requires_dispatcher_confirmation: true,
  };
}

/**
 * ElevenLabs Speech Audio Generation
 */
export async function generateElevenLabsSpeech(text: string, voiceId: string = "21m00Tcm4TlvDq8ikWAM"): Promise<ArrayBuffer | null> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        "Accept": "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_monolingual_v1",
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    });
    if (!res.ok) return null;
    return await res.arrayBuffer();
  } catch {
    return null;
  }
}
