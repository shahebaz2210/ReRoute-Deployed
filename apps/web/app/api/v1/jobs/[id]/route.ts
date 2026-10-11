import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  return NextResponse.json({
    id,
    status: "COMPLETED",
    progress_pct: 100,
    updated_at: new Date().toISOString(),
    message: "Optimization job completed successfully.",
  });
}
