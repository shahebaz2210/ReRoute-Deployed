import { NextRequest, NextResponse } from "next/server";
import { mockDisruptions, mockPlans, mockVehicles, mockOrders } from "@/lib/mock-data";
import { dispatchOptimization } from "@/lib/optimizer/client";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const disruption = mockDisruptions.find((d) => d.id === id);

  if (!disruption) {
    return NextResponse.json({ error: "Disruption not found" }, { status: 404 });
  }

  // Freeze horizon: filter out orders that are already DELIVERED
  const activeOrders = mockOrders.filter((o) => o.status !== "DELIVERED");

  // Re-plan using VRPTW optimizer
  const payload = {
    plan_id: "PLAN-REPLAN-" + id,
    vehicles: mockVehicles.map((v) => ({
      id: v.id,
      name: v.licensePlate,
      capacity_kg: v.capacityWeightKg,
      capacity_m3: v.capacityVolumeM3,
      depot_id: "DEPOT-SF-01",
      max_shift_minutes: 480,
    })),
    stops: activeOrders.map((o) => ({
      id: o.id,
      name: o.customerName,
      lat: o.deliveryLat,
      lng: o.deliveryLng,
      weight_kg: o.weightKg,
      volume_m3: o.volumeM3,
      time_window_start_minutes: 500,
      time_window_end_minutes: 1100,
      service_duration_minutes: 15,
    })),
    depot: {
      id: "DEPOT-SF-01",
      name: "SOMA Central Hub",
      lat: 37.7749,
      lng: -122.4194,
    },
    unassigned_penalty: 5000,
  };

  const reoptimizedSolution = await dispatchOptimization(payload);

  const proposal = {
    proposal_id: `PROP-${Date.now().toString().slice(-4)}`,
    disruption_id: id,
    target_plan_version: 2,
    generated_at: new Date().toISOString(),
    delta_metrics: {
      distance_delta_km: -2.4,
      duration_delta_minutes: 8,
      cost_delta_usd: 12.5,
      affected_stops_count: activeOrders.length,
      reassigned_vehicles_count: 2,
    },
    solution: reoptimizedSolution,
  };

  return NextResponse.json({
    success: true,
    disruption_id: id,
    proposal,
  });
}
