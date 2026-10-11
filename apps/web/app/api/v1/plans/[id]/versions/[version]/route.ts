import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; version: string }> }
) {
  const { id, version } = await params;
  const versionNum = parseInt(version, 10) || 1;

  return NextResponse.json({
    success: true,
    data: {
      planId: id,
      versionNumber: versionNum,
      isCommitted: versionNum === 1,
      versionStatus: versionNum === 1 ? "COMMITTED" : "PROPOSED",
      changeSummary: {
        totalKept: versionNum === 1 ? 12 : 9,
        totalMoved: versionNum === 1 ? 0 : 2,
        totalBroken: versionNum === 1 ? 0 : 1,
      },
      createdAt: new Date().toISOString(),
    },
  });
}
