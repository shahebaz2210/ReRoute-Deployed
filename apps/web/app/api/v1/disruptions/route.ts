import { NextRequest, NextResponse } from "next/server";
import { getActivePlan } from "@/lib/plans/store";

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

// User created disruptions and status overrides
export let USER_POSTED_DISRUPTIONS: PlatformDisruption[] = [];
export const STATUS_OVERRIDES: Record<string, "AWAITING_APPROVAL" | "APPROVED" | "REJECTED"> = {};

export function getDisruptionsList(): PlatformDisruption[] {
  const activePlan = getActivePlan();
  const v1 = activePlan.fleet?.[0] || { id: "V001", vehicleCode: "V001", name: "Light Truck", driverName: "Driver #1" };
  const v2 = activePlan.fleet?.[1] || v1;
  const o1 = activePlan.orders?.[0] || { id: "ORD001", orderReference: "ORD001", customerName: "Customer 01", deliveryAddress: "Pune" };
  const o2 = activePlan.orders?.[1] || o1;
  const depotName = activePlan.depot?.name || "Swargate Central Logistics Hub, Pune";

  const baselineIncidents: PlatformDisruption[] = [
    {
      id: "INC-901",
      incidentType: "TRAFFIC_CONGESTION",
      vehicleCode: `${v2.vehicleCode || v2.id} (${v2.name})`,
      driverName: v2.driverName || "Driver #2",
      locationName: `${depotName} ➔ ${o2.customerName || o2.orderReference}`,
      description: `Severe traffic congestion along corridor towards ${o2.customerName}. Re-routes via alternate arterial corridor.`,
      reportedAt: "10:14 AM",
      status: STATUS_OVERRIDES["INC-901"] || "AWAITING_APPROVAL",
      affectedOrdersCount: 3,
      delayMinutes: 35,
      from: depotName,
      to: o2.orderReference || o2.id,
    },
    {
      id: "INC-902",
      incidentType: "CANCELLATION",
      vehicleCode: `${v1.vehicleCode || v1.id} (${v1.name})`,
      driverName: v1.driverName || "Driver #1",
      locationName: `${o2.customerName} (${o2.orderReference || o2.id})`,
      description: `Customer cancelled order ${o2.orderReference || o2.id}. Location skipped completely to save distance & fuel.`,
      reportedAt: "09:42 AM",
      status: STATUS_OVERRIDES["INC-902"] || "AWAITING_APPROVAL",
      affectedOrdersCount: 1,
      delayMinutes: 0,
      from: o2.orderReference || o2.id,
    },
    {
      id: "INC-903",
      incidentType: "ROAD_CLOSURE",
      vehicleCode: `${v2.vehicleCode || v2.id} (${v2.name})`,
      driverName: v2.driverName || "Driver #2",
      locationName: `Arterial Bypass ➔ ${o1.customerName}`,
      description: `Emergency road closure blocking corridor. Travel time increased by +40m. Moved stop to ${v2.name}.`,
      reportedAt: "09:15 AM",
      status: STATUS_OVERRIDES["INC-903"] || "APPROVED",
      affectedOrdersCount: 2,
      delayMinutes: 40,
      from: "Arterial Bypass",
      to: o1.orderReference || o1.id,
    },
    {
      id: "INC-904",
      incidentType: "BREAKDOWN",
      vehicleCode: `${v1.vehicleCode || v1.id} (${v1.name})`,
      driverName: v1.driverName || "Driver #1",
      locationName: `${o1.customerName || "En Route"} / Service Bay`,
      description: `Mechanical failure on ${v1.name} at 09:45 AM. Vehicle receives NO stops after failure time.`,
      reportedAt: "08:50 AM",
      status: STATUS_OVERRIDES["INC-904"] || "APPROVED",
      affectedOrdersCount: 2,
      delayMinutes: 120,
      from: v1.id,
    },
  ];

  return [...USER_POSTED_DISRUPTIONS, ...baselineIncidents];
}

export async function GET(req: NextRequest) {
  try {
    const list = getDisruptionsList();
    return NextResponse.json({
      success: true,
      data: list,
      totalCount: list.length,
      pendingCount: list.filter((i) => i.status === "AWAITING_APPROVAL").length,
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

    const currentList = getDisruptionsList();
    const newId = `INC-${900 + currentList.length + 1}`;
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

    USER_POSTED_DISRUPTIONS.unshift(newDisruption);

    return NextResponse.json({
      success: true,
      message: "Disruption added to disruptions page successfully",
      data: newDisruption,
      allDisruptions: getDisruptionsList(),
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

    const list = getDisruptionsList();
    const item = list.find((i) => i.id === id);
    if (!item) {
      return NextResponse.json({ success: false, error: "Incident not found" }, { status: 404 });
    }

    if (status) {
      STATUS_OVERRIDES[id] = status;
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
