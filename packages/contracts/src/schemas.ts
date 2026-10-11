import { z } from "zod";

// --- System & Auth Enums ---
export const MemberRoleSchema = z.enum(["admin", "dispatcher", "driver", "viewer"]);
export type MemberRole = z.infer<typeof MemberRoleSchema>;

export const VehicleStatusSchema = z.enum([
  "available",
  "en_route",
  "delayed",
  "broken_down",
  "maintenance",
]);
export type VehicleStatus = z.infer<typeof VehicleStatusSchema>;

export const DeliveryStatusSchema = z.enum([
  "pending",
  "assigned",
  "in_transit",
  "completed",
  "failed",
  "cancelled",
]);
export type DeliveryStatus = z.infer<typeof DeliveryStatusSchema>;

export const IncidentTypeSchema = z.enum([
  "breakdown",
  "road_closure",
  "traffic_delay",
  "urgent_order",
  "weather",
  "other",
]);
export type IncidentType = z.infer<typeof IncidentTypeSchema>;

export const IncidentStatusSchema = z.enum([
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
export type IncidentStatus = z.infer<typeof IncidentStatusSchema>;

export const ComparisonClassSchema = z.enum(["KEPT", "MOVED", "BROKEN"]);
export type ComparisonClass = z.infer<typeof ComparisonClassSchema>;

export const BrokenReasonCodeSchema = z.enum([
  "CAPACITY_EXCEEDED",
  "NO_AVAILABLE_VEHICLE",
  "TIME_WINDOW_INFEASIBLE",
  "LOCATION_UNREACHABLE",
  "ROAD_CLOSURE",
  "OPTIMIZATION_LIMIT",
  "OTHER",
]);
export type BrokenReasonCode = z.infer<typeof BrokenReasonCodeSchema>;

export const JobStatusSchema = z.enum([
  "queued",
  "running",
  "succeeded",
  "failed",
  "timed_out",
  "cancelled",
]);
export type JobStatus = z.infer<typeof JobStatusSchema>;

export const NotificationStatusSchema = z.enum([
  "pending",
  "sent",
  "delivered",
  "failed",
  "simulated_sent",
  "manual_contacted",
]);
export type NotificationStatus = z.infer<typeof NotificationStatusSchema>;

// --- Geospatial & Location ---
export const CoordinatesSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});
export type Coordinates = z.infer<typeof CoordinatesSchema>;

export const LocationSchema = z.object({
  id: z.string().uuid(),
  code: z.string().optional(),
  name: z.string(),
  address: z.string(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});
export type Location = z.infer<typeof LocationSchema>;

// --- Fleet & Vehicles ---
export const VehicleSchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  name: z.string(),
  driverName: z.string().optional(),
  maxWeightKg: z.number().positive(),
  maxVolumeM3: z.number().positive(),
  currentWeightKg: z.number().nonnegative().default(0),
  currentVolumeM3: z.number().nonnegative().default(0),
  status: VehicleStatusSchema,
  currentLatitude: z.number().min(-90).max(90).optional(),
  currentLongitude: z.number().min(-180).max(180).optional(),
  updatedAt: z.string().datetime(),
});
export type Vehicle = z.infer<typeof VehicleSchema>;

export const UpdateVehiclePositionSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  timestamp: z.string().datetime(),
});
export type UpdateVehiclePosition = z.infer<typeof UpdateVehiclePositionSchema>;

// --- Orders & Deliveries ---
export const OrderSchema = z.object({
  id: z.string().uuid(),
  trackingNumber: z.string(),
  customerId: z.string().uuid(),
  locationId: z.string().uuid(),
  weightKg: z.number().positive(),
  volumeM3: z.number().positive(),
  windowStart: z.string().datetime(),
  windowEnd: z.string().datetime(),
  serviceDurationSeconds: z.number().int().nonnegative().default(300),
  priority: z.enum(["standard", "high", "urgent"]).default("standard"),
  status: DeliveryStatusSchema,
});
export type Order = z.infer<typeof OrderSchema>;

export const CreateOrderSchema = OrderSchema.omit({ id: true, status: true }).extend({
  status: DeliveryStatusSchema.optional(),
});
export type CreateOrder = z.infer<typeof CreateOrderSchema>;

// --- Disruption & Incidents ---
export const IncidentCreateSchema = z.object({
  type: IncidentTypeSchema,
  severity: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  description: z.string().min(3),
  vehicleId: z.string().uuid().optional(),
  routeId: z.string().uuid().optional(),
  locationId: z.string().uuid().optional(),
  reportedAt: z.string().datetime().optional(),
});
export type IncidentCreate = z.infer<typeof IncidentCreateSchema>;

export const IncidentVoiceSubmitSchema = z.object({
  audioBase64: z.string().optional(),
  durationSeconds: z.number().max(60).optional(),
  vehicleId: z.string().uuid().optional(),
});
export type IncidentVoiceSubmit = z.infer<typeof IncidentVoiceSubmitSchema>;

export const IncidentConfirmationSchema = z.object({
  incidentId: z.string().uuid(),
  decision: z.enum(["confirm", "dismiss"]),
  notes: z.string().optional(),
});
export type IncidentConfirmation = z.infer<typeof IncidentConfirmationSchema>;

// --- Solver & Proposals ---
export const OptimizationJobRequestSchema = z.object({
  planId: z.string().uuid(),
  incidentId: z.string().uuid().optional(),
  timeLimitSeconds: z.number().int().positive().default(10),
  weights: z
    .object({
      cost: z.number().default(1.0),
      churn: z.number().default(5.0),
      disjunctionPenalty: z.number().default(1000.0),
    })
    .optional(),
});
export type OptimizationJobRequest = z.infer<typeof OptimizationJobRequestSchema>;

export const ProposalApprovalSchema = z.object({
  proposalId: z.string().uuid(),
  proposalVersion: z.number().int().positive(),
  decision: z.enum(["approve", "reject"]),
  rejectionReason: z.string().optional(),
});
export type ProposalApproval = z.infer<typeof ProposalApprovalSchema>;

// --- Voice & Notifications (ElevenLabs) ---
export const CustomerNotificationSchema = z.object({
  id: z.string().uuid(),
  orderId: z.string().uuid(),
  customerPhone: z.string(),
  customerName: z.string(),
  revisedEta: z.string().datetime(),
  status: NotificationStatusSchema,
  messageText: z.string(),
  audioUrl: z.string().url().optional(),
  sentAt: z.string().datetime().optional(),
});
export type CustomerNotification = z.infer<typeof CustomerNotificationSchema>;

export const GenerateAudioNotificationSchema = z.object({
  notificationId: z.string().uuid(),
  voiceId: z.string().optional(),
  model: z.string().default("eleven_multilingual_v2"),
});
export type GenerateAudioNotification = z.infer<typeof GenerateAudioNotificationSchema>;

export const FleetBriefingSchema = z.object({
  planId: z.string().uuid(),
  shift: z.enum(["morning", "afternoon", "evening"]),
  briefingText: z.string().max(1000),
  audioUrl: z.string().url().optional(),
  wordCount: z.number().int().max(120),
  generatedAt: z.string().datetime(),
});
export type FleetBriefing = z.infer<typeof FleetBriefingSchema>;

// --- Health ---
export const SystemHealthSchema = z.object({
  status: z.enum(["healthy", "degraded", "unhealthy"]),
  timestamp: z.string().datetime(),
  version: z.string(),
});
export type SystemHealth = z.infer<typeof SystemHealthSchema>;
