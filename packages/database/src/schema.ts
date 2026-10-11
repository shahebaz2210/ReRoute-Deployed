import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  pgEnum,
  integer,
  doublePrecision,
  boolean,
  jsonb,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

// ==============================================================================
// 1. PostgreSQL Enums (TRD §5.3)
// ==============================================================================
export const memberRoleEnum = pgEnum("member_role", ["admin", "dispatcher", "driver", "viewer"]);

export const vehicleStatusEnum = pgEnum("vehicle_status", [
  "available",
  "en_route",
  "delayed",
  "broken_down",
  "maintenance",
]);

export const deliveryStatusEnum = pgEnum("delivery_status", [
  "pending",
  "assigned",
  "in_transit",
  "completed",
  "failed",
  "cancelled",
]);

export const incidentTypeEnum = pgEnum("incident_type", [
  "breakdown",
  "road_closure",
  "traffic_delay",
  "urgent_order",
  "weather",
  "other",
]);

export const incidentStatusEnum = pgEnum("incident_status", [
  "draft",
  "submitted",
  "under_assessment",
  "confirmed",
  "dismissed",
  "replanning",
  "awaiting_approval",
  "applying",
  "resolved",
  "failed",
  "cancelled",
]);

export const planStatusEnum = pgEnum("plan_status", [
  "draft",
  "solving",
  "proposed",
  "active",
  "superseded",
]);

export const jobStatusEnum = pgEnum("job_status", [
  "queued",
  "running",
  "succeeded",
  "failed",
  "timed_out",
  "cancelled",
]);

export const comparisonClassEnum = pgEnum("comparison_class", ["KEPT", "MOVED", "BROKEN"]);

export const notificationStatusEnum = pgEnum("notification_status", [
  "pending",
  "sent",
  "delivered",
  "failed",
  "simulated_sent",
  "manual_contacted",
]);

// ==============================================================================
// 2. Multi-Tenant Core: Organizations & Memberships (TRD §5.2 #1, #2)
// ==============================================================================
export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const memberships = pgTable(
  "memberships",
  {
    id: uuid("id").primaryKey(),
    userId: varchar("user_id", { length: 255 }).notNull(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    role: memberRoleEnum("role").default("dispatcher").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("org_user_idx").on(t.organizationId, t.userId),
    index("org_role_idx").on(t.organizationId, t.role),
  ]
);

// ==============================================================================
// 3. Locations (Catalog & Verified Coordinates) (TRD §5.2 #3)
// ==============================================================================
export const locations = pgTable(
  "locations",
  {
    id: uuid("id").primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    code: varchar("code", { length: 50 }),
    name: varchar("name", { length: 255 }).notNull(),
    address: text("address").notNull(),
    latitude: doublePrecision("latitude").notNull(),
    longitude: doublePrecision("longitude").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("location_org_idx").on(t.organizationId),
    index("location_code_idx").on(t.organizationId, t.code),
  ]
);

// ==============================================================================
// 4. Vehicles (Capacity in kg & m3) (TRD §5.2 #4)
// ==============================================================================
export const vehicles = pgTable(
  "vehicles",
  {
    id: uuid("id").primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    code: varchar("code", { length: 50 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    driverName: varchar("driver_name", { length: 255 }),
    maxWeightKg: doublePrecision("max_weight_kg").notNull(),
    maxVolumeM3: doublePrecision("max_volume_m3").notNull(),
    status: vehicleStatusEnum("status").default("available").notNull(),
    currentLatitude: doublePrecision("current_latitude"),
    currentLongitude: doublePrecision("current_longitude"),
    positionUpdatedAt: timestamp("position_updated_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("vehicle_code_idx").on(t.organizationId, t.code),
    index("vehicle_status_idx").on(t.organizationId, t.status),
  ]
);

// ==============================================================================
// 5. Customers (TRD §5.2 #5)
// ==============================================================================
export const customers = pgTable(
  "customers",
  {
    id: uuid("id").primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 50 }).notNull(),
    email: varchar("email", { length: 255 }),
    notificationConsent: boolean("notification_consent").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("customer_org_idx").on(t.organizationId)]
);

// ==============================================================================
// 6. Orders & Deliveries (TRD §5.2 #6)
// ==============================================================================
export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    trackingNumber: varchar("tracking_number", { length: 100 }).notNull(),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id),
    locationId: uuid("location_id")
      .notNull()
      .references(() => locations.id),
    weightKg: doublePrecision("weight_kg").notNull(),
    volumeM3: doublePrecision("volume_m3").notNull(),
    windowStart: timestamp("window_start", { withTimezone: true }).notNull(),
    windowEnd: timestamp("window_end", { withTimezone: true }).notNull(),
    serviceDurationSeconds: integer("service_duration_seconds").default(300).notNull(),
    priority: varchar("priority", { length: 50 }).default("standard").notNull(),
    status: deliveryStatusEnum("status").default("pending").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("order_tracking_idx").on(t.organizationId, t.trackingNumber),
    index("order_status_idx").on(t.organizationId, t.status),
    index("order_window_idx").on(t.windowStart, t.windowEnd),
  ]
);

// ==============================================================================
// 7. Route Plans (Versioned) (TRD §5.2 #7)
// ==============================================================================
export const routePlans = pgTable(
  "route_plans",
  {
    id: uuid("id").primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    version: integer("version").default(1).notNull(),
    operatingDate: varchar("operating_date", { length: 10 }).notNull(),
    status: planStatusEnum("status").default("draft").notNull(),
    approvedBy: varchar("approved_by", { length: 255 }),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    activatedAt: timestamp("activated_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("plan_org_date_idx").on(t.organizationId, t.operatingDate),
    index("plan_status_idx").on(t.organizationId, t.status),
  ]
);

// ==============================================================================
// 8. Route Stops (TRD §5.2 #8)
// ==============================================================================
export const routeStops = pgTable(
  "route_stops",
  {
    id: uuid("id").primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    planId: uuid("plan_id")
      .notNull()
      .references(() => routePlans.id, { onDelete: "cascade" }),
    vehicleId: uuid("vehicle_id")
      .notNull()
      .references(() => vehicles.id),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id),
    sequenceIndex: integer("sequence_index").notNull(),
    plannedArrival: timestamp("planned_arrival", { withTimezone: true }).notNull(),
    plannedDeparture: timestamp("planned_departure", { withTimezone: true }),
    actualArrival: timestamp("actual_arrival", { withTimezone: true }),
    status: deliveryStatusEnum("status").default("assigned").notNull(),
  },
  (t) => [
    uniqueIndex("unique_stop_seq").on(t.planId, t.vehicleId, t.sequenceIndex),
    index("stop_vehicle_idx").on(t.vehicleId, t.plannedArrival),
  ]
);

// ==============================================================================
// 9. Delivery Events (Append-Only Proof of Delivery) (TRD §5.2 #9)
// ==============================================================================
export const deliveryEvents = pgTable(
  "delivery_events",
  {
    id: uuid("id").primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id),
    stopId: uuid("stop_id").references(() => routeStops.id),
    vehicleId: uuid("vehicle_id").references(() => vehicles.id),
    eventType: varchar("event_type", { length: 50 }).notNull(),
    details: jsonb("details"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("delivery_event_order_idx").on(t.orderId, t.createdAt)]
);

// ==============================================================================
// 10. Incidents (TRD §5.2 #10)
// ==============================================================================
export const incidents = pgTable(
  "incidents",
  {
    id: uuid("id").primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    planId: uuid("plan_id").references(() => routePlans.id),
    type: incidentTypeEnum("type").notNull(),
    status: incidentStatusEnum("status").default("draft").notNull(),
    severity: varchar("severity", { length: 50 }).default("medium").notNull(),
    description: text("description").notNull(),
    vehicleId: uuid("vehicle_id").references(() => vehicles.id),
    locationId: uuid("location_id").references(() => locations.id),
    extractedData: jsonb("extracted_data"),
    reportedAt: timestamp("reported_at", { withTimezone: true }).defaultNow().notNull(),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
  },
  (t) => [index("incident_org_status_idx").on(t.organizationId, t.status)]
);

// ==============================================================================
// 11. Optimization Jobs (TRD §5.2 #11)
// ==============================================================================
export const optimizationJobs = pgTable(
  "optimization_jobs",
  {
    id: uuid("id").primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    planId: uuid("plan_id")
      .notNull()
      .references(() => routePlans.id),
    incidentId: uuid("incident_id").references(() => incidents.id),
    status: jobStatusEnum("status").default("queued").notNull(),
    solverStatus: varchar("solver_status", { length: 100 }),
    latencyMs: integer("latency_ms"),
    inputSnapshot: jsonb("input_snapshot"),
    proposalResult: jsonb("proposal_result"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (t) => [index("opt_job_plan_idx").on(t.planId, t.status)]
);

// ==============================================================================
// 12. Plan Diffs (KEPT/MOVED/BROKEN) (TRD §5.2 #12)
// ==============================================================================
export const planDiffs = pgTable(
  "plan_diffs",
  {
    id: uuid("id").primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    planId: uuid("plan_id")
      .notNull()
      .references(() => routePlans.id),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id),
    comparisonClass: comparisonClassEnum("comparison_class").notNull(),
    oldVehicleId: uuid("old_vehicle_id").references(() => vehicles.id),
    newVehicleId: uuid("new_vehicle_id").references(() => vehicles.id),
    oldArrival: timestamp("old_arrival", { withTimezone: true }),
    newArrival: timestamp("new_arrival", { withTimezone: true }),
    brokenReason: varchar("broken_reason", { length: 100 }),
    explanation: text("explanation"),
  },
  (t) => [index("diff_plan_order_idx").on(t.planId, t.orderId)]
);

// ==============================================================================
// 13. Customer Notifications (ElevenLabs Voice / SMS) (TRD §5.2 #13)
// ==============================================================================
export const customerNotifications = pgTable(
  "customer_notifications",
  {
    id: uuid("id").primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id),
    status: notificationStatusEnum("status").default("pending").notNull(),
    revisedEta: timestamp("revised_eta", { withTimezone: true }),
    messageText: text("message_text").notNull(),
    audioUrl: text("audio_url"),
    idempotencyKey: varchar("idempotency_key", { length: 255 }).unique(),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("notif_org_order_idx").on(t.organizationId, t.orderId)]
);

// ==============================================================================
// 14. Fleet Briefings (ElevenLabs Voice Summaries) (TRD §5.2 #14)
// ==============================================================================
export const fleetBriefings = pgTable(
  "fleet_briefings",
  {
    id: uuid("id").primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    planId: uuid("plan_id")
      .notNull()
      .references(() => routePlans.id),
    shift: varchar("shift", { length: 50 }).notNull(),
    briefingText: text("briefing_text").notNull(),
    audioUrl: text("audio_url"),
    wordCount: integer("word_count").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("briefing_plan_idx").on(t.planId)]
);

// ==============================================================================
// 15. Audit Events (Append-Only) (TRD §5.2 #15)
// ==============================================================================
export const auditEvents = pgTable(
  "audit_events",
  {
    id: uuid("id").primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    actorId: varchar("actor_id", { length: 255 }).notNull(),
    action: varchar("action", { length: 100 }).notNull(),
    entityType: varchar("entity_type", { length: 100 }).notNull(),
    entityId: uuid("entity_id").notNull(),
    beforeState: jsonb("before_state"),
    afterState: jsonb("after_state"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("audit_org_created_idx").on(t.organizationId, t.createdAt)]
);

// ==============================================================================
// 16. Idempotency Records (TRD §5.2 #16)
// ==============================================================================
export const idempotencyRecords = pgTable(
  "idempotency_records",
  {
    id: uuid("id").primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    key: varchar("key", { length: 255 }).notNull(),
    requestHash: varchar("request_hash", { length: 255 }).notNull(),
    responseJson: jsonb("response_json"),
    statusCode: integer("status_code"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("idempotency_org_key_idx").on(t.organizationId, t.key)]
);

// ==============================================================================
// 17. Vehicle Positions Telemetry Stream (Task 38)
// ==============================================================================
export const vehiclePositions = pgTable(
  "vehicle_positions",
  {
    id: uuid("id").primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    vehicleId: uuid("vehicle_id")
      .notNull()
      .references(() => vehicles.id, { onDelete: "cascade" }),
    latitude: doublePrecision("latitude").notNull(),
    longitude: doublePrecision("longitude").notNull(),
    speedMps: doublePrecision("speed_mps"),
    headingDeg: doublePrecision("heading_deg"),
    recordedAt: timestamp("recorded_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("veh_pos_veh_time_idx").on(t.vehicleId, t.recordedAt)]
);

// ==============================================================================
// 18. Incident Approvals (Task 39)
// ==============================================================================
export const incidentApprovals = pgTable(
  "incident_approvals",
  {
    id: uuid("id").primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    incidentId: uuid("incident_id")
      .notNull()
      .references(() => incidents.id, { onDelete: "cascade" }),
    approverId: varchar("approver_id", { length: 255 }).notNull(),
    decision: varchar("decision", { length: 50 }).notNull(),
    notes: text("notes"),
    modifications: jsonb("modifications"),
    approvedAt: timestamp("approved_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("inc_approval_incident_idx").on(t.incidentId)]
);

// ==============================================================================
// 19. Plan Versions (Task 40)
// ==============================================================================
export const planVersions = pgTable(
  "plan_versions",
  {
    id: uuid("id").primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    planId: uuid("plan_id")
      .notNull()
      .references(() => routePlans.id, { onDelete: "cascade" }),
    versionNumber: integer("version_number").notNull(),
    stateSnapshot: jsonb("state_snapshot").notNull(),
    isActive: boolean("is_active").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("plan_ver_num_idx").on(t.planId, t.versionNumber),
    index("plan_ver_active_idx").on(t.planId, t.isActive),
  ]
);

// ==============================================================================
// 20. Optimization Metrics (Task 41)
// ==============================================================================
export const optimizationMetrics = pgTable(
  "optimization_metrics",
  {
    id: uuid("id").primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    jobId: uuid("job_id")
      .notNull()
      .references(() => optimizationJobs.id, { onDelete: "cascade" }),
    totalDistanceMeters: doublePrecision("total_distance_meters").notNull(),
    totalDurationSeconds: integer("total_duration_seconds").notNull(),
    estimatedFuelLiters: doublePrecision("estimated_fuel_liters"),
    estimatedCostUsd: doublePrecision("estimated_cost_usd"),
    estimatedCo2Kg: doublePrecision("estimated_co2_kg"),
    slaOnTimePercent: doublePrecision("sla_on_time_percent"),
    unassignedCount: integer("unassigned_count").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("opt_metrics_job_idx").on(t.jobId)]
);

// ==============================================================================
// 21. Delivery Change Records (Task 42)
// ==============================================================================
export const deliveryChangeRecords = pgTable(
  "delivery_change_records",
  {
    id: uuid("id").primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    oldArrival: timestamp("old_arrival", { withTimezone: true }),
    newArrival: timestamp("new_arrival", { withTimezone: true }).notNull(),
    reason: text("reason").notNull(),
    notified: boolean("notified").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("deliv_change_order_idx").on(t.orderId)]
);

// ==============================================================================
// 22. Generated Audio (ElevenLabs Voice Audio Artifacts) (Task 43)
// ==============================================================================
export const generatedAudio = pgTable(
  "generated_audio",
  {
    id: uuid("id").primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    entityType: varchar("entity_type", { length: 50 }).notNull(),
    entityId: uuid("entity_id").notNull(),
    voiceId: varchar("voice_id", { length: 100 }).notNull(),
    modelId: varchar("model_id", { length: 100 }).notNull(),
    audioUrl: text("audio_url").notNull(),
    fileSizeBytes: integer("file_size_bytes"),
    durationSeconds: doublePrecision("duration_seconds"),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("gen_audio_entity_idx").on(t.entityType, t.entityId)]
);

// ==============================================================================
// 23. Road Network Nodes & Edges (Task 44)
// ==============================================================================
export const locationNodes = pgTable("location_nodes", {
  id: uuid("id").primaryKey(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  nodeOsmId: varchar("node_osm_id", { length: 50 }),
  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),
});

export const roadEdges = pgTable(
  "road_edges",
  {
    id: uuid("id").primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    sourceNodeId: uuid("source_node_id")
      .notNull()
      .references(() => locationNodes.id, { onDelete: "cascade" }),
    targetNodeId: uuid("target_node_id")
      .notNull()
      .references(() => locationNodes.id, { onDelete: "cascade" }),
    distanceMeters: doublePrecision("distance_meters").notNull(),
    durationSeconds: doublePrecision("duration_seconds").notNull(),
    isBlocked: boolean("is_blocked").default(false).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("road_edges_source_target_idx").on(t.sourceNodeId, t.targetNodeId)]
);

