"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemHealthSchema = exports.FleetBriefingSchema = exports.GenerateAudioNotificationSchema = exports.CustomerNotificationSchema = exports.ProposalApprovalSchema = exports.OptimizationJobRequestSchema = exports.IncidentConfirmationSchema = exports.IncidentVoiceSubmitSchema = exports.IncidentCreateSchema = exports.CreateOrderSchema = exports.OrderSchema = exports.UpdateVehiclePositionSchema = exports.VehicleSchema = exports.LocationSchema = exports.CoordinatesSchema = exports.NotificationStatusSchema = exports.JobStatusSchema = exports.BrokenReasonCodeSchema = exports.ComparisonClassSchema = exports.IncidentStatusSchema = exports.IncidentTypeSchema = exports.DeliveryStatusSchema = exports.VehicleStatusSchema = exports.MemberRoleSchema = void 0;
const zod_1 = require("zod");
// --- System & Auth Enums ---
exports.MemberRoleSchema = zod_1.z.enum(["admin", "dispatcher", "driver", "viewer"]);
exports.VehicleStatusSchema = zod_1.z.enum([
    "available",
    "en_route",
    "delayed",
    "broken_down",
    "maintenance",
]);
exports.DeliveryStatusSchema = zod_1.z.enum([
    "pending",
    "assigned",
    "in_transit",
    "completed",
    "failed",
    "cancelled",
]);
exports.IncidentTypeSchema = zod_1.z.enum([
    "breakdown",
    "road_closure",
    "traffic_delay",
    "urgent_order",
    "weather",
    "other",
]);
exports.IncidentStatusSchema = zod_1.z.enum([
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
exports.ComparisonClassSchema = zod_1.z.enum(["KEPT", "MOVED", "BROKEN"]);
exports.BrokenReasonCodeSchema = zod_1.z.enum([
    "CAPACITY_EXCEEDED",
    "NO_AVAILABLE_VEHICLE",
    "TIME_WINDOW_INFEASIBLE",
    "LOCATION_UNREACHABLE",
    "ROAD_CLOSURE",
    "OPTIMIZATION_LIMIT",
    "OTHER",
]);
exports.JobStatusSchema = zod_1.z.enum([
    "queued",
    "running",
    "succeeded",
    "failed",
    "timed_out",
    "cancelled",
]);
exports.NotificationStatusSchema = zod_1.z.enum([
    "pending",
    "sent",
    "delivered",
    "failed",
    "simulated_sent",
    "manual_contacted",
]);
// --- Geospatial & Location ---
exports.CoordinatesSchema = zod_1.z.object({
    latitude: zod_1.z.number().min(-90).max(90),
    longitude: zod_1.z.number().min(-180).max(180),
});
exports.LocationSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    code: zod_1.z.string().optional(),
    name: zod_1.z.string(),
    address: zod_1.z.string(),
    latitude: zod_1.z.number().min(-90).max(90),
    longitude: zod_1.z.number().min(-180).max(180),
});
// --- Fleet & Vehicles ---
exports.VehicleSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    code: zod_1.z.string(),
    name: zod_1.z.string(),
    driverName: zod_1.z.string().optional(),
    maxWeightKg: zod_1.z.number().positive(),
    maxVolumeM3: zod_1.z.number().positive(),
    currentWeightKg: zod_1.z.number().nonnegative().default(0),
    currentVolumeM3: zod_1.z.number().nonnegative().default(0),
    status: exports.VehicleStatusSchema,
    currentLatitude: zod_1.z.number().min(-90).max(90).optional(),
    currentLongitude: zod_1.z.number().min(-180).max(180).optional(),
    updatedAt: zod_1.z.string().datetime(),
});
exports.UpdateVehiclePositionSchema = zod_1.z.object({
    latitude: zod_1.z.number().min(-90).max(90),
    longitude: zod_1.z.number().min(-180).max(180),
    timestamp: zod_1.z.string().datetime(),
});
// --- Orders & Deliveries ---
exports.OrderSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    trackingNumber: zod_1.z.string(),
    customerId: zod_1.z.string().uuid(),
    locationId: zod_1.z.string().uuid(),
    weightKg: zod_1.z.number().positive(),
    volumeM3: zod_1.z.number().positive(),
    windowStart: zod_1.z.string().datetime(),
    windowEnd: zod_1.z.string().datetime(),
    serviceDurationSeconds: zod_1.z.number().int().nonnegative().default(300),
    priority: zod_1.z.enum(["standard", "high", "urgent"]).default("standard"),
    status: exports.DeliveryStatusSchema,
});
exports.CreateOrderSchema = exports.OrderSchema.omit({ id: true, status: true }).extend({
    status: exports.DeliveryStatusSchema.optional(),
});
// --- Disruption & Incidents ---
exports.IncidentCreateSchema = zod_1.z.object({
    type: exports.IncidentTypeSchema,
    severity: zod_1.z.enum(["low", "medium", "high", "critical"]).default("medium"),
    description: zod_1.z.string().min(3),
    vehicleId: zod_1.z.string().uuid().optional(),
    routeId: zod_1.z.string().uuid().optional(),
    locationId: zod_1.z.string().uuid().optional(),
    reportedAt: zod_1.z.string().datetime().optional(),
});
exports.IncidentVoiceSubmitSchema = zod_1.z.object({
    audioBase64: zod_1.z.string().optional(),
    durationSeconds: zod_1.z.number().max(60).optional(),
    vehicleId: zod_1.z.string().uuid().optional(),
});
exports.IncidentConfirmationSchema = zod_1.z.object({
    incidentId: zod_1.z.string().uuid(),
    decision: zod_1.z.enum(["confirm", "dismiss"]),
    notes: zod_1.z.string().optional(),
});
// --- Solver & Proposals ---
exports.OptimizationJobRequestSchema = zod_1.z.object({
    planId: zod_1.z.string().uuid(),
    incidentId: zod_1.z.string().uuid().optional(),
    timeLimitSeconds: zod_1.z.number().int().positive().default(10),
    weights: zod_1.z
        .object({
        cost: zod_1.z.number().default(1.0),
        churn: zod_1.z.number().default(5.0),
        disjunctionPenalty: zod_1.z.number().default(1000.0),
    })
        .optional(),
});
exports.ProposalApprovalSchema = zod_1.z.object({
    proposalId: zod_1.z.string().uuid(),
    proposalVersion: zod_1.z.number().int().positive(),
    decision: zod_1.z.enum(["approve", "reject"]),
    rejectionReason: zod_1.z.string().optional(),
});
// --- Voice & Notifications (ElevenLabs) ---
exports.CustomerNotificationSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    orderId: zod_1.z.string().uuid(),
    customerPhone: zod_1.z.string(),
    customerName: zod_1.z.string(),
    revisedEta: zod_1.z.string().datetime(),
    status: exports.NotificationStatusSchema,
    messageText: zod_1.z.string(),
    audioUrl: zod_1.z.string().url().optional(),
    sentAt: zod_1.z.string().datetime().optional(),
});
exports.GenerateAudioNotificationSchema = zod_1.z.object({
    notificationId: zod_1.z.string().uuid(),
    voiceId: zod_1.z.string().optional(),
    model: zod_1.z.string().default("eleven_multilingual_v2"),
});
exports.FleetBriefingSchema = zod_1.z.object({
    planId: zod_1.z.string().uuid(),
    shift: zod_1.z.enum(["morning", "afternoon", "evening"]),
    briefingText: zod_1.z.string().max(1000),
    audioUrl: zod_1.z.string().url().optional(),
    wordCount: zod_1.z.number().int().max(120),
    generatedAt: zod_1.z.string().datetime(),
});
// --- Health ---
exports.SystemHealthSchema = zod_1.z.object({
    status: zod_1.z.enum(["healthy", "degraded", "unhealthy"]),
    timestamp: zod_1.z.string().datetime(),
    version: zod_1.z.string(),
});
