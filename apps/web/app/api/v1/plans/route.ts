import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const CreatePlanRequestSchema = z.object({
  planName: z.string().min(1).default("Daily Delivery Plan"),
  depotId: z.string().default("DEPOT-CENTRAL"),
  vehicleIds: z.array(z.string()).min(1, "At least one vehicle must be selected"),
  orders: z.array(
    z.object({
      orderReference: z.string(),
      customerName: z.string(),
      deliveryAddress: z.string(),
      latitude: z.number(),
      longitude: z.number(),
      weightKg: z.number(),
      volumeM3: z.number(),
      timeWindowStart: z.string(),
      timeWindowEnd: z.string(),
      priority: z.enum(["STANDARD", "EXPRESS", "CRITICAL"]).optional(),
    })
  ).min(1, "At least one order must be provided"),
});

// Demo plans store
const demoPlans = [
  {
    id: "019488a0-0000-7000-9000-000000000001",
    planName: "Morning Shift Dispatch Plan",
    status: "ACTIVE",
    activeVersionNumber: 1,
    depotId: "DEPOT-CENTRAL",
    totalOrders: 12,
    totalVehicles: 3,
    totalDistanceKm: 142.6,
    totalDurationMinutes: 380,
    createdAt: new Date().toISOString(),
  },
];

export async function GET() {
  return NextResponse.json({
    success: true,
    data: demoPlans,
    total: demoPlans.length,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = CreatePlanRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "VALIDATION_FAILED", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { planName, depotId, vehicleIds, orders } = parsed.data;
    const planId = `019488a0-0000-7000-9000-${Math.random().toString(16).slice(2, 14).padEnd(12, "0")}`;

    const newPlan = {
      id: planId,
      planName,
      status: "DRAFT",
      activeVersionNumber: 1,
      depotId,
      totalOrders: orders.length,
      totalVehicles: vehicleIds.length,
      totalDistanceKm: 0,
      totalDurationMinutes: 0,
      createdAt: new Date().toISOString(),
    };

    demoPlans.unshift(newPlan);

    return NextResponse.json({ success: true, data: newPlan }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: "INTERNAL_ERROR", message: "Failed to create delivery plan" }, { status: 500 });
  }
}
