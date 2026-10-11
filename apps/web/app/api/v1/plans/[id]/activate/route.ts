import { NextRequest, NextResponse } from "next/server";
import { mockPlans } from "@/lib/mock-data";

// Plan lock version tracker for optimistic concurrency control (Task 235)
const planLockVersions = new Map<string, number>();

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const expectedVersion = body.expected_version || 1;
  const targetVersion = body.target_version || 2;

  const currentVersion = planLockVersions.get(id) || 1;

  // Optimistic concurrency check
  if (expectedVersion !== currentVersion) {
    return NextResponse.json(
      {
        error: "CONCURRENCY_CONFLICT",
        message: `Plan version conflict: expected version ${expectedVersion}, but active version is ${currentVersion}. Another dispatcher may have activated an update.`,
        current_version: currentVersion,
      },
      { status: 409 }
    );
  }

  // Atomically advance version
  planLockVersions.set(id, targetVersion);

  const plan = mockPlans.find((p) => p.id === id);
  if (plan) {
    plan.status = "ACTIVE";
    plan.version = targetVersion;
  }

  const activationReceipt = {
    plan_id: id,
    activated_version: targetVersion,
    previous_version: currentVersion,
    activated_at: new Date().toISOString(),
    status: "ACTIVE",
    notified_fleet_count: 5,
    audit_hash: `act_tx_${Date.now().toString(16)}`,
  };

  return NextResponse.json({
    success: true,
    activation: activationReceipt,
  });
}
