import { NextRequest, NextResponse } from "next/server";

export interface PlatformDisruption {
  id: string;
  incidentType: "ROAD_CLOSURE" | "TRAFFIC_CONGESTION" | "CANCELLATION" | "BREAKDOWN" | "DELAY";
  vehicleCode: string;
  driverName: string;
  locationName: string;
  description: string;
  reportedAt: string;
  status: "AWAITING_APPROVAL" | "APPROVED" | "REJECTED";
  affectedOrdersCount: number;
  delayMinutes?: number;
  from?: string;
  to?: string;
}

// In-memory store that persists across requests
export let GLOBAL_DISRUPTIONS_STORE: PlatformDisruption[] = [
  {
    id: "INC-901",
    incidentType: "ROAD_CLOSURE",
    vehicleCode: "VH-002 (Truck Beta)",
    driverName: "Marcus Sterling",
    locationName: "Industrial Bypass / Node 3 ➔ Node 7",
    description: "Severe roadwork blocking northbound arterial. Detour adds 40 mins travel time.",
    reportedAt: "10:14 AM",
    status: "AWAITING_APPROVAL",
    affectedOrdersCount: 3,
    delayMinutes: 40,
    from: "LOC_03",
    to: "LOC_07",
  },
  {
    id: "INC-902",
    incidentType: "BREAKDOWN",
    vehicleCode: "VH-001 (Truck Alpha)",
    driverName: "Alex Vance",
    locationName: "Exit 4 Junction / Market St",
    description: "Engine oil pressure warning indicator. Safe pull-over at service bay.",
    reportedAt: "09:42 AM",
    status: "APPROVED",
    affectedOrdersCount: 2,
    delayMinutes: 120,
    from: "LOC_01",
  },
];

export async function GET(req: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      data: GLOBAL_DISRUPTIONS_STORE,
      totalCount: GLOBAL_DISRUPTIONS_STORE.length,
      pendingCount: GLOBAL_DISRUPTIONS_STORE.filter((i) => i.status === "AWAITING_APPROVAL").length,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to fetch disruptions" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const newId = `INC-${900 + GLOBAL_DISRUPTIONS_STORE.length + 1}`;
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    // Map incoming type
    let mappedType: PlatformDisruption["incidentType"] = "ROAD_CLOSURE";
    if (body.incidentType === "CANCELLATION" || body.type === "CANCELLATION" || body.type === "CUSTOMER_UNAVAILABLE") {
      mappedType = "CANCELLATION";
    } else if (body.incidentType === "TRAFFIC_CONGESTION" || body.type === "TRAFFIC_CONGESTION" || body.type === "TRAFFIC_DELAY") {
      mappedType = "TRAFFIC_CONGESTION";
    } else if (body.incidentType === "BREAKDOWN" || body.type === "VEHICLE_BREAKDOWN") {
      mappedType = "BREAKDOWN";
    } else {
      mappedType = "ROAD_CLOSURE";
    }

    const newDisruption: PlatformDisruption = {
      id: newId,
      incidentType: mappedType,
      vehicleCode: body.vehicleCode || body.vehicle_id || "VH-001",
      driverName: body.driverName || "Assigned Driver",
      locationName: body.locationName || (body.from && body.to ? `${body.from} ➔ ${body.to}` : body.from || "Sector Node"),
      description: body.description || body.reason || "Disruption logged via Dispatcher Console",
      reportedAt: timeStr,
      status: "AWAITING_APPROVAL",
      affectedOrdersCount: body.affectedOrdersCount || (mappedType === "CANCELLATION" ? 1 : 3),
      delayMinutes: body.delayMinutes || body.delay_min || 30,
      from: body.from,
      to: body.to,
    };

    GLOBAL_DISRUPTIONS_STORE.unshift(newDisruption);

    return NextResponse.json({
      success: true,
      message: "Disruption added to disruptions page successfully",
      data: newDisruption,
      allDisruptions: GLOBAL_DISRUPTIONS_STORE,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to create disruption" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status } = body;

    const item = GLOBAL_DISRUPTIONS_STORE.find((i) => i.id === id);
    if (!item) {
      return NextResponse.json({ success: false, error: "Incident not found" }, { status: 404 });
    }

    if (status) {
      item.status = status;
    }

    return NextResponse.json({
      success: true,
      message: `Incident ${id} updated to ${status}`,
      data: item,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Update failed" },
      { status: 500 }
    );
  }
}
