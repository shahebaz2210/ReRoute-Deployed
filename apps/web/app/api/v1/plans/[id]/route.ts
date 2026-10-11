import { NextRequest, NextResponse } from "next/server";
import { getPlan, optimizePlan } from "@/lib/plans/store";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let stored = getPlan(id);

  if (!stored) {
    try {
      stored = await optimizePlan(id);
    } catch {
      // fallback
    }
  }

  if (stored) {
    return NextResponse.json({
      success: true,
      data: {
        id: stored.id,
        planName: stored.planName,
        status: stored.status,
        activeVersionNumber: stored.activeVersionNumber,
        depotId: stored.depot.id,
        depot: stored.depot,
        totalOrders: stored.totalOrders,
        totalVehicles: stored.totalVehicles,
        totalDistanceKm: stored.totalDistanceKm,
        totalDurationMinutes: stored.totalDurationMinutes,
        totalFuelLiters: stored.totalFuelLiters,
        totalCo2Kg: stored.totalCo2Kg,
        routes: stored.routes,
        orders: stored.orders,
        unassignedOrders: stored.unassignedOrders,
        matrix: stored.matrix,
        createdAt: stored.createdAt,
        optimizedAt: stored.optimizedAt,
      },
    });
  }

  return NextResponse.json(
    { error: "PLAN_NOT_FOUND", message: `Delivery plan ${id} not found` },
    { status: 404 }
  );
}
