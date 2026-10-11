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

// Demo in-memory orders cache
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
    status: "PENDING",
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
    status: "PENDING",
    assignedVehicleId: "019488a0-0000-7000-8000-000000000002",
    priority: "STANDARD",
  },
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const vehicleId = searchParams.get("vehicleId");

  let filtered = [...inMemoryOrders];
  if (status) {
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
