import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const CreatePlanRequestSchema = z.object({
  planName: z.string().min(1).default("Daily Delivery Plan"),
  depotId: z.string().default("DEPOT-CENTRAL"),
  vehicleIds: z.array(z.string()).optional(),
  orders: z.array(
    z.object({
      orderReference: z.string(),
      customerName: z.string().optional(),
      deliveryAddress: z.string().optional(),
      latitude: z.number(),
      longitude: z.number(),
      weightKg: z.number(),
      volumeM3: z.number(),
      timeWindowStart: z.string(),
      timeWindowEnd: z.string(),
      serviceDurationMinutes: z.number().optional(),
      priority: z.enum(["STANDARD", "EXPRESS", "CRITICAL"]).optional(),
    })
  ).min(1, "At least one order must be provided"),
  vehicles: z.array(z.any()).optional(),
  depotCenter: z
    .object({
      id: z.string().optional(),
      latitude: z.number(),
      longitude: z.number(),
      name: z.string().optional(),
    })
    .optional(),
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

import { createPlan, plansStore, getActivePlan } from "@/lib/plans/store";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const activeParam = searchParams.get("active");

  if (activeParam === "true" || activeParam === "latest") {
    const active = getActivePlan();
    return NextResponse.json({
      success: true,
      data: active,
    });
  }

  const storePlans = Array.from(plansStore.values()).map((p) => ({
    id: p.id,
    planName: p.planName,
    status: p.status,
    activeVersionNumber: p.activeVersionNumber,
    depotId: p.depot.id,
    totalOrders: p.totalOrders,
    totalVehicles: p.totalVehicles,
    totalDistanceKm: p.totalDistanceKm,
    totalDurationMinutes: p.totalDurationMinutes,
    createdAt: p.createdAt,
  }));

  const storeIds = new Set(storePlans.map((p) => p.id));
  const uniqueDemoPlans = demoPlans.filter((p) => !storeIds.has(p.id));
  const allPlans = [...storePlans.reverse(), ...uniqueDemoPlans];

  return NextResponse.json({
    success: true,
    data: allPlans,
    total: allPlans.length,
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

    const { planName, depotId, vehicleIds, orders, vehicles, depotCenter } = parsed.data;
    const planId = `019488a0-0000-7000-9000-${Math.random().toString(16).slice(2, 14).padEnd(12, "0")}`;

    const effectiveVehicleIds =
      vehicleIds && vehicleIds.length > 0
        ? vehicleIds
        : vehicles && vehicles.length > 0
        ? vehicles.map((v: any) => v.vehicleId || v.id)
        : ["VH-001", "VH-002", "VH-003"];

    // Store real plan with real order rows, vehicles, and dispatcher single central depot in centralized plansStore
    const storedPlan = createPlan(planId, planName, orders, effectiveVehicleIds, vehicles, depotCenter);

    const planSummary = {
      id: storedPlan.id,
      planName: storedPlan.planName,
      status: storedPlan.status,
      activeVersionNumber: storedPlan.activeVersionNumber,
      depotId: storedPlan.depot.id,
      depotCenter: storedPlan.depot,
      totalOrders: storedPlan.totalOrders,
      totalVehicles: storedPlan.totalVehicles,
      totalDistanceKm: 0,
      totalDurationMinutes: 0,
      createdAt: storedPlan.createdAt,
    };

    return NextResponse.json({ success: true, data: planSummary }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: "INTERNAL_ERROR", message: "Failed to create delivery plan" }, { status: 500 });
  }
}

