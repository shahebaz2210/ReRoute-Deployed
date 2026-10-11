import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { FLEET_MAX_WEIGHT_KG, FLEET_MAX_VOLUME_M3 } from "@/lib/ingestion/plan-parser";

const CreateOrderSchema = z.object({
  orderReference: z.string().min(1, "Order reference is required"),
  customerName: z.string().min(1, "Customer name is required"),
  deliveryAddress: z.string().min(1, "Delivery address is required"),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  weightKg: z.number().positive("Weight must be greater than 0 kg").max(FLEET_MAX_WEIGHT_KG, `Order exceeds maximum vehicle capacity (${FLEET_MAX_WEIGHT_KG} kg)`),
  volumeM3: z.number().positive("Volume must be greater than 0 m³").max(FLEET_MAX_VOLUME_M3, `Order exceeds maximum vehicle volume (${FLEET_MAX_VOLUME_M3} m³)`),
  timeWindowStart: z.string().regex(/^\d{1,2}:\d{2}$/, "Must be formatted as HH:MM"),
  timeWindowEnd: z.string().regex(/^\d{1,2}:\d{2}$/, "Must be formatted as HH:MM"),
  serviceDurationMinutes: z.number().nonnegative().default(10),
  priority: z.enum(["STANDARD", "EXPRESS", "CRITICAL"]).default("STANDARD"),
});

interface OrderRecord {
  id: string;
  orderReference: string;
  customerName: string;
  deliveryAddress: string;
  latitude: number;
  longitude: number;
  weightKg: number;
  volumeM3: number;
  timeWindowStart: string;
  timeWindowEnd: string;
  serviceDurationMinutes?: number;
  status: string;
  assignedVehicleId: string | null;
  priority: string;
}

// Demo in-memory orders cache featuring live logistics statuses
let inMemoryOrders: OrderRecord[] = [
  {
    id: "019488a0-0000-7000-8000-000000000010",
    orderReference: "ORD-1001",
    customerName: "Astra Tech Labs",
    deliveryAddress: "12 Innovation Way, Tech District",
    latitude: 51.515,
    longitude: -0.12,
    weightKg: 240,
    volumeM3: 1.2,
    timeWindowStart: "08:30",
    timeWindowEnd: "11:30",
    status: "DELIVERED",
    assignedVehicleId: "019488a0-0000-7000-8000-000000000001",
    priority: "STANDARD",
  },
  {
    id: "019488a0-0000-7000-8000-000000000011",
    orderReference: "ORD-1002",
    customerName: "BioGen Research",
    deliveryAddress: "45 Medical Sciences Park",
    latitude: 51.522,
    longitude: -0.115,
    weightKg: 450,
    volumeM3: 2.5,
    timeWindowStart: "09:00",
    timeWindowEnd: "12:00",
    status: "IN_TRANSIT",
    assignedVehicleId: "019488a0-0000-7000-8000-000000000001",
    priority: "EXPRESS",
  },
  {
    id: "019488a0-0000-7000-8000-000000000012",
    orderReference: "ORD-1003",
    customerName: "Apex Logistics Depot",
    deliveryAddress: "88 Cargo Terminal Road",
    latitude: 51.53,
    longitude: -0.105,
    weightKg: 1200,
    volumeM3: 6.8,
    timeWindowStart: "10:00",
    timeWindowEnd: "14:00",
    status: "STUCKED",
    assignedVehicleId: "019488a0-0000-7000-8000-000000000002",
    priority: "STANDARD",
  },
  {
    id: "019488a0-0000-7000-8000-000000000013",
    orderReference: "ORD-1004",
    customerName: "Vortex Quantum Hub",
    deliveryAddress: "101 Silicon Quay, Financial Hub",
    latitude: 51.505,
    longitude: -0.13,
    weightKg: 380,
    volumeM3: 1.9,
    timeWindowStart: "11:00",
    timeWindowEnd: "15:00",
    status: "IN_TRANSIT",
    assignedVehicleId: "019488a0-0000-7000-8000-000000000003",
    priority: "CRITICAL",
  },
  {
    id: "019488a0-0000-7000-8000-000000000014",
    orderReference: "ORD-1005",
    customerName: "St. Jude Hospital Supply",
    deliveryAddress: "14 Healthcare Ave",
    latitude: 51.518,
    longitude: -0.125,
    weightKg: 520,
    volumeM3: 3.1,
    timeWindowStart: "08:00",
    timeWindowEnd: "10:30",
    status: "DELIVERED",
    assignedVehicleId: "019488a0-0000-7000-8000-000000000001",
    priority: "CRITICAL",
  },
  {
    id: "019488a0-0000-7000-8000-000000000015",
    orderReference: "ORD-1006",
    customerName: "Nova Distribution Centre",
    deliveryAddress: "9 North Circular Gate",
    latitude: 51.54,
    longitude: -0.09,
    weightKg: 950,
    volumeM3: 5.2,
    timeWindowStart: "13:00",
    timeWindowEnd: "17:00",
    status: "CANCELED",
    assignedVehicleId: null,
    priority: "STANDARD",
  },
];

import { plansStore } from "@/lib/plans/store";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const vehicleId = searchParams.get("vehicleId");
  const planId = searchParams.get("planId");

  let ordersList: any[] = [];

  // Check if plans exist in plansStore
  const allStoredPlans = Array.from(plansStore.values());
  const targetPlan = planId
    ? plansStore.get(planId)
    : allStoredPlans.length > 0
    ? allStoredPlans[allStoredPlans.length - 1]
    : null;

  if (targetPlan && targetPlan.orders && targetPlan.orders.length > 0) {
    ordersList = targetPlan.orders.map((o) => ({
      id: o.id,
      orderReference: o.orderReference,
      customerName: o.customerName,
      deliveryAddress: o.deliveryAddress,
      latitude: o.latitude,
      longitude: o.longitude,
      weightKg: o.weightKg,
      volumeM3: o.volumeM3,
      timeWindowStart: o.timeWindowStart,
      timeWindowEnd: o.timeWindowEnd,
      serviceDurationMinutes: o.serviceDurationMinutes,
      status: o.status,
      assignedVehicleId: o.assignedVehicleId || null,
      priority: o.priority,
      eta: o.eta,
    }));
  } else {
    ordersList = [...inMemoryOrders];
  }

  let filtered = [...ordersList];
  if (status && status !== "ALL") {
    filtered = filtered.filter((o) => o.status === status);
  }
  if (vehicleId) {
    filtered = filtered.filter((o) => o.assignedVehicleId === vehicleId);
  }

  return NextResponse.json({
    success: true,
    data: filtered,
    total: filtered.length,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = CreateOrderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "VALIDATION_FAILED", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Check unique reference
    const exists = inMemoryOrders.some((o) => o.orderReference.toLowerCase() === data.orderReference.toLowerCase());
    if (exists) {
      return NextResponse.json(
        { error: "DUPLICATE_ORDER_REFERENCE", message: `Order with reference '${data.orderReference}' already exists.` },
        { status: 409 }
      );
    }

    const newOrder = {
      id: `019488a0-0000-7000-8000-${Math.random().toString(16).slice(2, 14).padEnd(12, "0")}`,
      ...data,
      status: "PENDING",
      assignedVehicleId: null,
    };

    inMemoryOrders.push(newOrder);

    return NextResponse.json({ success: true, data: newOrder }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: "INTERNAL_ERROR", message: "Failed to create delivery order" }, { status: 500 });
  }
}
