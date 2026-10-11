import { db, auditEvents } from "@dispatchx/database";
import { generateUuidV7 } from "@dispatchx/database";

export interface RecordAuditEventParams {
  organizationId: string;
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  beforeState?: Record<string, unknown> | null;
  afterState?: Record<string, unknown> | null;
}

export async function recordAuditEvent(params: RecordAuditEventParams): Promise<void> {
  const auditId = generateUuidV7();
  console.info(`[AUDIT] [${params.action}] Org: ${params.organizationId} Actor: ${params.actorId} Entity: ${params.entityType}/${params.entityId}`);

  try {
    if (process.env.DATABASE_URL) {
      await db.insert(auditEvents).values({
        id: auditId,
        organizationId: params.organizationId,
        actorId: params.actorId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        beforeState: params.beforeState ?? null,
        afterState: params.afterState ?? null,
        createdAt: new Date(),
      });
    }
  } catch (error) {
    console.error("[AUDIT] Failed to persist audit event to DB:", error);
  }
}
