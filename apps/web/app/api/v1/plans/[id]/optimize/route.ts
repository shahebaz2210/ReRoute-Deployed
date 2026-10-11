import { NextRequest, NextResponse } from "next/server";
import { optimizePlan } from "@/lib/plans/store";

// In-memory jobs map for async job tracking
export const jobQueue = new Map<string, any>();

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  // Optimize staged or newly created plan with real coordinates & dynamic travel time matrix
  const optimizedPlan = await optimizePlan(id, {
    disruption: body.disruption,
    vehicle_id: body.vehicle_id,
  });

  const jobRecord = {
    id: jobId,
    plan_id: id,
    status: "COMPLETED",
    created_at: new Date().toISOString(),
    result: optimizedPlan,
  };

  jobQueue.set(jobId, jobRecord);

  return NextResponse.json({
    job_id: jobId,
    status: "COMPLETED",
    plan_id: id,
    result: optimizedPlan,
    data: optimizedPlan,
  });
}
