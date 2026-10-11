import { NextRequest, NextResponse } from "next/server";
import { dispatchOptimization } from "@/lib/optimizer/client";
import { mockVehicles, mockOrders } from "@/lib/mock-data";

// In-memory jobs map for async job tracking
export const jobQueue = new Map<string, any>();

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  // Prepare optimization payload from demo fleet and orders
  const payload = {
    plan_id: id,
    vehicles: mockVehicles.map((v) => ({
      id: v.id,
      name: v.licensePlate,
      capacity_kg: v.capacityWeightKg,
      capacity_m3: v.capacityVolumeM3,
      depot_id: "DEPOT-SF-01",
      max_shift_minutes: 480,
    })),
    stops: mockOrders.map((o) => ({
      id: o.id,
      name: o.customerName,
      lat: o.deliveryLat,
      lng: o.deliveryLng,
      weight_kg: o.weightKg,
      volume_m3: o.volumeM3,
      time_window_start_minutes: 480, // 08:00
      time_window_end_minutes: 1080, // 18:00
      service_duration_minutes: 15,
    })),
    depot: {
      id: "DEPOT-SF-01",
      name: "SOMA Central Hub",
      lat: 37.7749,
      lng: -122.4194,
    },
    time_limit_seconds: 5,
  };

  // Run or enqueue optimization
  const result = await dispatchOptimization(payload);

  const jobRecord = {
    id: jobId,
    plan_id: id,
    status: "COMPLETED",
    created_at: new Date().toISOString(),
    result,
  };

  jobQueue.set(jobId, jobRecord);

  return NextResponse.json({
    job_id: jobId,
    status: "COMPLETED",
    plan_id: id,
    result,
  });
}
