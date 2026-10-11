import { NextResponse } from "next/server";
import { clearSession, getSession } from "@/lib/auth/session";
import { recordAuditEvent } from "@/lib/audit/audit-logger";

export async function POST() {
  const session = await getSession();
  if (session) {
    await recordAuditEvent({
      organizationId: session.organizationId,
      actorId: session.userId,
      action: "AUTH_LOGOUT",
      entityType: "USER",
      entityId: session.userId,
    });
  }
  await clearSession();
  return NextResponse.json({ success: true, message: "Logged out successfully" });
}

