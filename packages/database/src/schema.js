"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roadEdges = exports.locationNodes = exports.generatedAudio = exports.deliveryChangeRecords = exports.optimizationMetrics = exports.planVersions = exports.incidentApprovals = exports.vehiclePositions = exports.idempotencyRecords = exports.auditEvents = exports.fleetBriefings = exports.customerNotifications = exports.planDiffs = exports.optimizationJobs = exports.incidents = exports.deliveryEvents = exports.routeStops = exports.routePlans = exports.orders = exports.customers = exports.vehicles = exports.locations = exports.memberships = exports.organizations = exports.notificationStatusEnum = exports.comparisonClassEnum = exports.jobStatusEnum = exports.planStatusEnum = exports.incidentStatusEnum = exports.incidentTypeEnum = exports.deliveryStatusEnum = exports.vehicleStatusEnum = exports.memberRoleEnum = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
// ==============================================================================
// 1. PostgreSQL Enums (TRD §5.3)
// ==============================================================================
exports.memberRoleEnum = (0, pg_core_1.pgEnum)("member_role", ["admin", "dispatcher", "driver", "viewer"]);
exports.vehicleStatusEnum = (0, pg_core_1.pgEnum)("vehicle_status", [
    "available",
    "en_route",
    "delayed",
    "broken_down",
    "maintenance",
]);
exports.deliveryStatusEnum = (0, pg_core_1.pgEnum)("delivery_status", [
    "pending",
    "assigned",
    "in_transit",
    "completed",
    "failed",
    "cancelled",
]);
exports.incidentTypeEnum = (0, pg_core_1.pgEnum)("incident_type", [
    "breakdown",
    "road_closure",
    "traffic_delay",
    "weather",
    "other",
]);
exports.incidentStatusEnum = (0, pg_core_1.pgEnum)("incident_status", [
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
exports.planStatusEnum = (0, pg_core_1.pgEnum)("plan_status", [
    "draft",
    "solving",
    "proposed",
    "active",
    "superseded",
]);
exports.jobStatusEnum = (0, pg_core_1.pgEnum)("job_status", [
    "queued",
    "running",
    "succeeded",
    "failed",
    "timed_out",
    "cancelled",
]);
exports.comparisonClassEnum = (0, pg_core_1.pgEnum)("comparison_class", ["KEPT", "MOVED", "BROKEN"]);
exports.notificationStatusEnum = (0, pg_core_1.pgEnum)("notification_status", [
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
exports.organizations = (0, pg_core_1.pgTable)("organizations", {
    id: (0, pg_core_1.uuid)("id").primaryKey(),
    name: (0, pg_core_1.varchar)("name", { length: 255 }).notNull(),
    slug: (0, pg_core_1.varchar)("slug", { length: 100 }).notNull().unique(),
    createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
exports.memberships = (0, pg_core_1.pgTable)("memberships", {
    id: (0, pg_core_1.uuid)("id").primaryKey(),
    userId: (0, pg_core_1.varchar)("user_id", { length: 255 }).notNull(),
    organizationId: (0, pg_core_1.uuid)("organization_id")
        .notNull()
        .references(() => exports.organizations.id, { onDelete: "cascade" }),
    role: (0, exports.memberRoleEnum)("role").default("dispatcher").notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
    (0, pg_core_1.uniqueIndex)("org_user_idx").on(t.organizationId, t.userId),
    (0, pg_core_1.index)("org_role_idx").on(t.organizationId, t.role),
]);
// ==============================================================================
// 3. Locations (Catalog & Verified Coordinates) (TRD §5.2 #3)
// ==============================================================================
exports.locations = (0, pg_core_1.pgTable)("locations", {
    id: (0, pg_core_1.uuid)("id").primaryKey(),
    organizationId: (0, pg_core_1.uuid)("organization_id")
        .notNull()
        .references(() => exports.organizations.id, { onDelete: "cascade" }),
    code: (0, pg_core_1.varchar)("code", { length: 50 }),
    name: (0, pg_core_1.varchar)("name", { length: 255 }).notNull(),
    address: (0, pg_core_1.text)("address").notNull(),
    latitude: (0, pg_core_1.doublePrecision)("latitude").notNull(),
    longitude: (0, pg_core_1.doublePrecision)("longitude").notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
    (0, pg_core_1.index)("location_org_idx").on(t.organizationId),
    (0, pg_core_1.index)("location_code_idx").on(t.organizationId, t.code),
]);
// ==============================================================================
// 4. Vehicles (Capacity in kg & m3) (TRD §5.2 #4)
// ==============================================================================
exports.vehicles = (0, pg_core_1.pgTable)("vehicles", {
    id: (0, pg_core_1.uuid)("id").primaryKey(),
    organizationId: (0, pg_core_1.uuid)("organization_id")
        .notNull()
        .references(() => exports.organizations.id, { onDelete: "cascade" }),
    code: (0, pg_core_1.varchar)("code", { length: 50 }).notNull(),
    name: (0, pg_core_1.varchar)("name", { length: 255 }).notNull(),
    driverName: (0, pg_core_1.varchar)("driver_name", { length: 255 }),
    maxWeightKg: (0, pg_core_1.doublePrecision)("max_weight_kg").notNull(),
    maxVolumeM3: (0, pg_core_1.doublePrecision)("max_volume_m3").notNull(),
    status: (0, exports.vehicleStatusEnum)("status").default("available").notNull(),
    currentLatitude: (0, pg_core_1.doublePrecision)("current_latitude"),
    currentLongitude: (0, pg_core_1.doublePrecision)("current_longitude"),
    positionUpdatedAt: (0, pg_core_1.timestamp)("position_updated_at", { withTimezone: true }),
    createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
    (0, pg_core_1.uniqueIndex)("vehicle_code_idx").on(t.organizationId, t.code),
    (0, pg_core_1.index)("vehicle_status_idx").on(t.organizationId, t.status),
]);
// ==============================================================================
// 5. Customers (TRD §5.2 #5)
// ==============================================================================
exports.customers = (0, pg_core_1.pgTable)("customers", {
    id: (0, pg_core_1.uuid)("id").primaryKey(),
    organizationId: (0, pg_core_1.uuid)("organization_id")
        .notNull()
        .references(() => exports.organizations.id, { onDelete: "cascade" }),
    name: (0, pg_core_1.varchar)("name", { length: 255 }).notNull(),
    phone: (0, pg_core_1.varchar)("phone", { length: 50 }).notNull(),
    email: (0, pg_core_1.varchar)("email", { length: 255 }),
    notificationConsent: (0, pg_core_1.boolean)("notification_consent").default(true).notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [(0, pg_core_1.index)("customer_org_idx").on(t.organizationId)]);
// ==============================================================================
// 6. Orders & Deliveries (TRD §5.2 #6)
// ==============================================================================
exports.orders = (0, pg_core_1.pgTable)("orders", {
    id: (0, pg_core_1.uuid)("id").primaryKey(),
    organizationId: (0, pg_core_1.uuid)("organization_id")
        .notNull()
        .references(() => exports.organizations.id, { onDelete: "cascade" }),
    trackingNumber: (0, pg_core_1.varchar)("tracking_number", { length: 100 }).notNull(),
    customerId: (0, pg_core_1.uuid)("customer_id")
        .notNull()
        .references(() => exports.customers.id),
    locationId: (0, pg_core_1.uuid)("location_id")
        .notNull()
        .references(() => exports.locations.id),
    weightKg: (0, pg_core_1.doublePrecision)("weight_kg").notNull(),
    volumeM3: (0, pg_core_1.doublePrecision)("volume_m3").notNull(),
    windowStart: (0, pg_core_1.timestamp)("window_start", { withTimezone: true }).notNull(),
    windowEnd: (0, pg_core_1.timestamp)("window_end", { withTimezone: true }).notNull(),
    serviceDurationSeconds: (0, pg_core_1.integer)("service_duration_seconds").default(300).notNull(),
    priority: (0, pg_core_1.varchar)("priority", { length: 50 }).default("standard").notNull(),
    status: (0, exports.deliveryStatusEnum)("status").default("pending").notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
    (0, pg_core_1.uniqueIndex)("order_tracking_idx").on(t.organizationId, t.trackingNumber),
    (0, pg_core_1.index)("order_status_idx").on(t.organizationId, t.status),
    (0, pg_core_1.index)("order_window_idx").on(t.windowStart, t.windowEnd),
]);
// ==============================================================================
// 7. Route Plans (Versioned) (TRD §5.2 #7)
// ==============================================================================
exports.routePlans = (0, pg_core_1.pgTable)("route_plans", {
    id: (0, pg_core_1.uuid)("id").primaryKey(),
    organizationId: (0, pg_core_1.uuid)("organization_id")
        .notNull()
        .references(() => exports.organizations.id, { onDelete: "cascade" }),
    version: (0, pg_core_1.integer)("version").default(1).notNull(),
    operatingDate: (0, pg_core_1.varchar)("operating_date", { length: 10 }).notNull(),
    status: (0, exports.planStatusEnum)("status").default("draft").notNull(),
    approvedBy: (0, pg_core_1.varchar)("approved_by", { length: 255 }),
    approvedAt: (0, pg_core_1.timestamp)("approved_at", { withTimezone: true }),
    activatedAt: (0, pg_core_1.timestamp)("activated_at", { withTimezone: true }),
    createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
    (0, pg_core_1.index)("plan_org_date_idx").on(t.organizationId, t.operatingDate),
    (0, pg_core_1.index)("plan_status_idx").on(t.organizationId, t.status),
]);
// ==============================================================================
// 8. Route Stops (TRD §5.2 #8)
// ==============================================================================
exports.routeStops = (0, pg_core_1.pgTable)("route_stops", {
    id: (0, pg_core_1.uuid)("id").primaryKey(),
    organizationId: (0, pg_core_1.uuid)("organization_id")
        .notNull()
        .references(() => exports.organizations.id, { onDelete: "cascade" }),
    planId: (0, pg_core_1.uuid)("plan_id")
        .notNull()
        .references(() => exports.routePlans.id, { onDelete: "cascade" }),
    vehicleId: (0, pg_core_1.uuid)("vehicle_id")
        .notNull()
        .references(() => exports.vehicles.id),
    orderId: (0, pg_core_1.uuid)("order_id")
        .notNull()
        .references(() => exports.orders.id),
    sequenceIndex: (0, pg_core_1.integer)("sequence_index").notNull(),
    plannedArrival: (0, pg_core_1.timestamp)("planned_arrival", { withTimezone: true }).notNull(),
    plannedDeparture: (0, pg_core_1.timestamp)("planned_departure", { withTimezone: true }),
    actualArrival: (0, pg_core_1.timestamp)("actual_arrival", { withTimezone: true }),
    status: (0, exports.deliveryStatusEnum)("status").default("assigned").notNull(),
}, (t) => [
    (0, pg_core_1.uniqueIndex)("unique_stop_seq").on(t.planId, t.vehicleId, t.sequenceIndex),
    (0, pg_core_1.index)("stop_vehicle_idx").on(t.vehicleId, t.plannedArrival),
]);
// ==============================================================================
// 9. Delivery Events (Append-Only Proof of Delivery) (TRD §5.2 #9)
// ==============================================================================
exports.deliveryEvents = (0, pg_core_1.pgTable)("delivery_events", {
    id: (0, pg_core_1.uuid)("id").primaryKey(),
    organizationId: (0, pg_core_1.uuid)("organization_id")
        .notNull()
        .references(() => exports.organizations.id, { onDelete: "cascade" }),
    orderId: (0, pg_core_1.uuid)("order_id")
        .notNull()
        .references(() => exports.orders.id),
    stopId: (0, pg_core_1.uuid)("stop_id").references(() => exports.routeStops.id),
    vehicleId: (0, pg_core_1.uuid)("vehicle_id").references(() => exports.vehicles.id),
    eventType: (0, pg_core_1.varchar)("event_type", { length: 50 }).notNull(),
    details: (0, pg_core_1.jsonb)("details"),
    createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [(0, pg_core_1.index)("delivery_event_order_idx").on(t.orderId, t.createdAt)]);
// ==============================================================================
// 10. Incidents (TRD §5.2 #10)
// ==============================================================================
exports.incidents = (0, pg_core_1.pgTable)("incidents", {
    id: (0, pg_core_1.uuid)("id").primaryKey(),
    organizationId: (0, pg_core_1.uuid)("organization_id")
        .notNull()
        .references(() => exports.organizations.id, { onDelete: "cascade" }),
    planId: (0, pg_core_1.uuid)("plan_id").references(() => exports.routePlans.id),
    type: (0, exports.incidentTypeEnum)("type").notNull(),
    status: (0, exports.incidentStatusEnum)("status").default("draft").notNull(),
    severity: (0, pg_core_1.varchar)("severity", { length: 50 }).default("medium").notNull(),
    description: (0, pg_core_1.text)("description").notNull(),
    vehicleId: (0, pg_core_1.uuid)("vehicle_id").references(() => exports.vehicles.id),
    locationId: (0, pg_core_1.uuid)("location_id").references(() => exports.locations.id),
    extractedData: (0, pg_core_1.jsonb)("extracted_data"),
    reportedAt: (0, pg_core_1.timestamp)("reported_at", { withTimezone: true }).defaultNow().notNull(),
    confirmedAt: (0, pg_core_1.timestamp)("confirmed_at", { withTimezone: true }),
}, (t) => [(0, pg_core_1.index)("incident_org_status_idx").on(t.organizationId, t.status)]);
// ==============================================================================
// 11. Optimization Jobs (TRD §5.2 #11)
// ==============================================================================
exports.optimizationJobs = (0, pg_core_1.pgTable)("optimization_jobs", {
    id: (0, pg_core_1.uuid)("id").primaryKey(),
    organizationId: (0, pg_core_1.uuid)("organization_id")
        .notNull()
        .references(() => exports.organizations.id, { onDelete: "cascade" }),
    planId: (0, pg_core_1.uuid)("plan_id")
        .notNull()
        .references(() => exports.routePlans.id),
    incidentId: (0, pg_core_1.uuid)("incident_id").references(() => exports.incidents.id),
    status: (0, exports.jobStatusEnum)("status").default("queued").notNull(),
    solverStatus: (0, pg_core_1.varchar)("solver_status", { length: 100 }),
    latencyMs: (0, pg_core_1.integer)("latency_ms"),
    inputSnapshot: (0, pg_core_1.jsonb)("input_snapshot"),
    proposalResult: (0, pg_core_1.jsonb)("proposal_result"),
    createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: true }).defaultNow().notNull(),
    completedAt: (0, pg_core_1.timestamp)("completed_at", { withTimezone: true }),
}, (t) => [(0, pg_core_1.index)("opt_job_plan_idx").on(t.planId, t.status)]);
// ==============================================================================
// 12. Plan Diffs (KEPT/MOVED/BROKEN) (TRD §5.2 #12)
// ==============================================================================
exports.planDiffs = (0, pg_core_1.pgTable)("plan_diffs", {
    id: (0, pg_core_1.uuid)("id").primaryKey(),
    organizationId: (0, pg_core_1.uuid)("organization_id")
        .notNull()
        .references(() => exports.organizations.id, { onDelete: "cascade" }),
    planId: (0, pg_core_1.uuid)("plan_id")
        .notNull()
        .references(() => exports.routePlans.id),
    orderId: (0, pg_core_1.uuid)("order_id")
        .notNull()
        .references(() => exports.orders.id),
    comparisonClass: (0, exports.comparisonClassEnum)("comparison_class").notNull(),
    oldVehicleId: (0, pg_core_1.uuid)("old_vehicle_id").references(() => exports.vehicles.id),
    newVehicleId: (0, pg_core_1.uuid)("new_vehicle_id").references(() => exports.vehicles.id),
    oldArrival: (0, pg_core_1.timestamp)("old_arrival", { withTimezone: true }),
    newArrival: (0, pg_core_1.timestamp)("new_arrival", { withTimezone: true }),
    brokenReason: (0, pg_core_1.varchar)("broken_reason", { length: 100 }),
    explanation: (0, pg_core_1.text)("explanation"),
}, (t) => [(0, pg_core_1.index)("diff_plan_order_idx").on(t.planId, t.orderId)]);
// ==============================================================================
// 13. Customer Notifications (ElevenLabs Voice / SMS) (TRD §5.2 #13)
// ==============================================================================
exports.customerNotifications = (0, pg_core_1.pgTable)("customer_notifications", {
    id: (0, pg_core_1.uuid)("id").primaryKey(),
    organizationId: (0, pg_core_1.uuid)("organization_id")
        .notNull()
        .references(() => exports.organizations.id, { onDelete: "cascade" }),
    orderId: (0, pg_core_1.uuid)("order_id")
        .notNull()
        .references(() => exports.orders.id),
    status: (0, exports.notificationStatusEnum)("status").default("pending").notNull(),
    revisedEta: (0, pg_core_1.timestamp)("revised_eta", { withTimezone: true }),
    messageText: (0, pg_core_1.text)("message_text").notNull(),
    audioUrl: (0, pg_core_1.text)("audio_url"),
    idempotencyKey: (0, pg_core_1.varchar)("idempotency_key", { length: 255 }).unique(),
    sentAt: (0, pg_core_1.timestamp)("sent_at", { withTimezone: true }),
    createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [(0, pg_core_1.index)("notif_org_order_idx").on(t.organizationId, t.orderId)]);
// ==============================================================================
// 14. Fleet Briefings (ElevenLabs Voice Summaries) (TRD §5.2 #14)
// ==============================================================================
exports.fleetBriefings = (0, pg_core_1.pgTable)("fleet_briefings", {
    id: (0, pg_core_1.uuid)("id").primaryKey(),
    organizationId: (0, pg_core_1.uuid)("organization_id")
        .notNull()
        .references(() => exports.organizations.id, { onDelete: "cascade" }),
    planId: (0, pg_core_1.uuid)("plan_id")
        .notNull()
        .references(() => exports.routePlans.id),
    shift: (0, pg_core_1.varchar)("shift", { length: 50 }).notNull(),
    briefingText: (0, pg_core_1.text)("briefing_text").notNull(),
    audioUrl: (0, pg_core_1.text)("audio_url"),
    wordCount: (0, pg_core_1.integer)("word_count").notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [(0, pg_core_1.index)("briefing_plan_idx").on(t.planId)]);
// ==============================================================================
// 15. Audit Events (Append-Only) (TRD §5.2 #15)
// ==============================================================================
exports.auditEvents = (0, pg_core_1.pgTable)("audit_events", {
    id: (0, pg_core_1.uuid)("id").primaryKey(),
    organizationId: (0, pg_core_1.uuid)("organization_id")
        .notNull()
        .references(() => exports.organizations.id, { onDelete: "cascade" }),
    actorId: (0, pg_core_1.varchar)("actor_id", { length: 255 }).notNull(),
    action: (0, pg_core_1.varchar)("action", { length: 100 }).notNull(),
    entityType: (0, pg_core_1.varchar)("entity_type", { length: 100 }).notNull(),
    entityId: (0, pg_core_1.uuid)("entity_id").notNull(),
    beforeState: (0, pg_core_1.jsonb)("before_state"),
    afterState: (0, pg_core_1.jsonb)("after_state"),
    createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [(0, pg_core_1.index)("audit_org_created_idx").on(t.organizationId, t.createdAt)]);
// ==============================================================================
// 16. Idempotency Records (TRD §5.2 #16)
// ==============================================================================
exports.idempotencyRecords = (0, pg_core_1.pgTable)("idempotency_records", {
    id: (0, pg_core_1.uuid)("id").primaryKey(),
    organizationId: (0, pg_core_1.uuid)("organization_id")
        .notNull()
        .references(() => exports.organizations.id, { onDelete: "cascade" }),
    key: (0, pg_core_1.varchar)("key", { length: 255 }).notNull(),
    requestHash: (0, pg_core_1.varchar)("request_hash", { length: 255 }).notNull(),
    responseJson: (0, pg_core_1.jsonb)("response_json"),
    statusCode: (0, pg_core_1.integer)("status_code"),
    expiresAt: (0, pg_core_1.timestamp)("expires_at", { withTimezone: true }).notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [(0, pg_core_1.uniqueIndex)("idempotency_org_key_idx").on(t.organizationId, t.key)]);
// ==============================================================================
// 17. Vehicle Positions Telemetry Stream (Task 38)
// ==============================================================================
exports.vehiclePositions = (0, pg_core_1.pgTable)("vehicle_positions", {
    id: (0, pg_core_1.uuid)("id").primaryKey(),
    organizationId: (0, pg_core_1.uuid)("organization_id")
        .notNull()
        .references(() => exports.organizations.id, { onDelete: "cascade" }),
    vehicleId: (0, pg_core_1.uuid)("vehicle_id")
        .notNull()
        .references(() => exports.vehicles.id, { onDelete: "cascade" }),
    latitude: (0, pg_core_1.doublePrecision)("latitude").notNull(),
    longitude: (0, pg_core_1.doublePrecision)("longitude").notNull(),
    speedMps: (0, pg_core_1.doublePrecision)("speed_mps"),
    headingDeg: (0, pg_core_1.doublePrecision)("heading_deg"),
    recordedAt: (0, pg_core_1.timestamp)("recorded_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [(0, pg_core_1.index)("veh_pos_veh_time_idx").on(t.vehicleId, t.recordedAt)]);
// ==============================================================================
// 18. Incident Approvals (Task 39)
// ==============================================================================
exports.incidentApprovals = (0, pg_core_1.pgTable)("incident_approvals", {
    id: (0, pg_core_1.uuid)("id").primaryKey(),
    organizationId: (0, pg_core_1.uuid)("organization_id")
        .notNull()
        .references(() => exports.organizations.id, { onDelete: "cascade" }),
    incidentId: (0, pg_core_1.uuid)("incident_id")
        .notNull()
        .references(() => exports.incidents.id, { onDelete: "cascade" }),
    approverId: (0, pg_core_1.varchar)("approver_id", { length: 255 }).notNull(),
    decision: (0, pg_core_1.varchar)("decision", { length: 50 }).notNull(),
    notes: (0, pg_core_1.text)("notes"),
    modifications: (0, pg_core_1.jsonb)("modifications"),
    approvedAt: (0, pg_core_1.timestamp)("approved_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [(0, pg_core_1.index)("inc_approval_incident_idx").on(t.incidentId)]);
// ==============================================================================
// 19. Plan Versions (Task 40)
// ==============================================================================
exports.planVersions = (0, pg_core_1.pgTable)("plan_versions", {
    id: (0, pg_core_1.uuid)("id").primaryKey(),
    organizationId: (0, pg_core_1.uuid)("organization_id")
        .notNull()
        .references(() => exports.organizations.id, { onDelete: "cascade" }),
    planId: (0, pg_core_1.uuid)("plan_id")
        .notNull()
        .references(() => exports.routePlans.id, { onDelete: "cascade" }),
    versionNumber: (0, pg_core_1.integer)("version_number").notNull(),
    stateSnapshot: (0, pg_core_1.jsonb)("state_snapshot").notNull(),
    isActive: (0, pg_core_1.boolean)("is_active").default(false).notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
    (0, pg_core_1.uniqueIndex)("plan_ver_num_idx").on(t.planId, t.versionNumber),
    (0, pg_core_1.index)("plan_ver_active_idx").on(t.planId, t.isActive),
]);
// ==============================================================================
// 20. Optimization Metrics (Task 41)
// ==============================================================================
exports.optimizationMetrics = (0, pg_core_1.pgTable)("optimization_metrics", {
    id: (0, pg_core_1.uuid)("id").primaryKey(),
    organizationId: (0, pg_core_1.uuid)("organization_id")
        .notNull()
        .references(() => exports.organizations.id, { onDelete: "cascade" }),
    jobId: (0, pg_core_1.uuid)("job_id")
        .notNull()
        .references(() => exports.optimizationJobs.id, { onDelete: "cascade" }),
    totalDistanceMeters: (0, pg_core_1.doublePrecision)("total_distance_meters").notNull(),
    totalDurationSeconds: (0, pg_core_1.integer)("total_duration_seconds").notNull(),
    estimatedFuelLiters: (0, pg_core_1.doublePrecision)("estimated_fuel_liters"),
    estimatedCostUsd: (0, pg_core_1.doublePrecision)("estimated_cost_usd"),
    estimatedCo2Kg: (0, pg_core_1.doublePrecision)("estimated_co2_kg"),
    slaOnTimePercent: (0, pg_core_1.doublePrecision)("sla_on_time_percent"),
    unassignedCount: (0, pg_core_1.integer)("unassigned_count").default(0).notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [(0, pg_core_1.index)("opt_metrics_job_idx").on(t.jobId)]);
// ==============================================================================
// 21. Delivery Change Records (Task 42)
// ==============================================================================
exports.deliveryChangeRecords = (0, pg_core_1.pgTable)("delivery_change_records", {
    id: (0, pg_core_1.uuid)("id").primaryKey(),
    organizationId: (0, pg_core_1.uuid)("organization_id")
        .notNull()
        .references(() => exports.organizations.id, { onDelete: "cascade" }),
    orderId: (0, pg_core_1.uuid)("order_id")
        .notNull()
        .references(() => exports.orders.id, { onDelete: "cascade" }),
    oldArrival: (0, pg_core_1.timestamp)("old_arrival", { withTimezone: true }),
    newArrival: (0, pg_core_1.timestamp)("new_arrival", { withTimezone: true }).notNull(),
    reason: (0, pg_core_1.text)("reason").notNull(),
    notified: (0, pg_core_1.boolean)("notified").default(false).notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [(0, pg_core_1.index)("deliv_change_order_idx").on(t.orderId)]);
// ==============================================================================
// 22. Generated Audio (ElevenLabs Voice Audio Artifacts) (Task 43)
// ==============================================================================
exports.generatedAudio = (0, pg_core_1.pgTable)("generated_audio", {
    id: (0, pg_core_1.uuid)("id").primaryKey(),
    organizationId: (0, pg_core_1.uuid)("organization_id")
        .notNull()
        .references(() => exports.organizations.id, { onDelete: "cascade" }),
    entityType: (0, pg_core_1.varchar)("entity_type", { length: 50 }).notNull(),
    entityId: (0, pg_core_1.uuid)("entity_id").notNull(),
    voiceId: (0, pg_core_1.varchar)("voice_id", { length: 100 }).notNull(),
    modelId: (0, pg_core_1.varchar)("model_id", { length: 100 }).notNull(),
    audioUrl: (0, pg_core_1.text)("audio_url").notNull(),
    fileSizeBytes: (0, pg_core_1.integer)("file_size_bytes"),
    durationSeconds: (0, pg_core_1.doublePrecision)("duration_seconds"),
    expiresAt: (0, pg_core_1.timestamp)("expires_at", { withTimezone: true }),
    createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [(0, pg_core_1.index)("gen_audio_entity_idx").on(t.entityType, t.entityId)]);
// ==============================================================================
// 23. Road Network Nodes & Edges (Task 44)
// ==============================================================================
exports.locationNodes = (0, pg_core_1.pgTable)("location_nodes", {
    id: (0, pg_core_1.uuid)("id").primaryKey(),
    organizationId: (0, pg_core_1.uuid)("organization_id")
        .notNull()
        .references(() => exports.organizations.id, { onDelete: "cascade" }),
    nodeOsmId: (0, pg_core_1.varchar)("node_osm_id", { length: 50 }),
    latitude: (0, pg_core_1.doublePrecision)("latitude").notNull(),
    longitude: (0, pg_core_1.doublePrecision)("longitude").notNull(),
});
exports.roadEdges = (0, pg_core_1.pgTable)("road_edges", {
    id: (0, pg_core_1.uuid)("id").primaryKey(),
    organizationId: (0, pg_core_1.uuid)("organization_id")
        .notNull()
        .references(() => exports.organizations.id, { onDelete: "cascade" }),
    sourceNodeId: (0, pg_core_1.uuid)("source_node_id")
        .notNull()
        .references(() => exports.locationNodes.id, { onDelete: "cascade" }),
    targetNodeId: (0, pg_core_1.uuid)("target_node_id")
        .notNull()
        .references(() => exports.locationNodes.id, { onDelete: "cascade" }),
    distanceMeters: (0, pg_core_1.doublePrecision)("distance_meters").notNull(),
    durationSeconds: (0, pg_core_1.doublePrecision)("duration_seconds").notNull(),
    isBlocked: (0, pg_core_1.boolean)("is_blocked").default(false).notNull(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [(0, pg_core_1.index)("road_edges_source_target_idx").on(t.sourceNodeId, t.targetNodeId)]);
