import { z } from "zod";
export declare const MemberRoleSchema: z.ZodEnum<["admin", "dispatcher", "driver", "viewer"]>;
export type MemberRole = z.infer<typeof MemberRoleSchema>;
export declare const VehicleStatusSchema: z.ZodEnum<["available", "en_route", "delayed", "broken_down", "maintenance"]>;
export type VehicleStatus = z.infer<typeof VehicleStatusSchema>;
export declare const DeliveryStatusSchema: z.ZodEnum<["pending", "assigned", "in_transit", "completed", "failed", "cancelled"]>;
export type DeliveryStatus = z.infer<typeof DeliveryStatusSchema>;
export declare const IncidentTypeSchema: z.ZodEnum<["breakdown", "road_closure", "traffic_delay", "urgent_order", "weather", "other"]>;
export type IncidentType = z.infer<typeof IncidentTypeSchema>;
export declare const IncidentStatusSchema: z.ZodEnum<["draft", "submitted", "under_assessment", "confirmed", "dismissed", "replanning", "awaiting_approval", "applying", "resolved", "failed", "cancelled"]>;
export type IncidentStatus = z.infer<typeof IncidentStatusSchema>;
export declare const ComparisonClassSchema: z.ZodEnum<["KEPT", "MOVED", "BROKEN"]>;
export type ComparisonClass = z.infer<typeof ComparisonClassSchema>;
export declare const BrokenReasonCodeSchema: z.ZodEnum<["CAPACITY_EXCEEDED", "NO_AVAILABLE_VEHICLE", "TIME_WINDOW_INFEASIBLE", "LOCATION_UNREACHABLE", "ROAD_CLOSURE", "OPTIMIZATION_LIMIT", "OTHER"]>;
export type BrokenReasonCode = z.infer<typeof BrokenReasonCodeSchema>;
export declare const JobStatusSchema: z.ZodEnum<["queued", "running", "succeeded", "failed", "timed_out", "cancelled"]>;
export type JobStatus = z.infer<typeof JobStatusSchema>;
export declare const NotificationStatusSchema: z.ZodEnum<["pending", "sent", "delivered", "failed", "simulated_sent", "manual_contacted"]>;
export type NotificationStatus = z.infer<typeof NotificationStatusSchema>;
export declare const CoordinatesSchema: z.ZodObject<{
    latitude: z.ZodNumber;
    longitude: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    latitude: number;
    longitude: number;
}, {
    latitude: number;
    longitude: number;
}>;
export type Coordinates = z.infer<typeof CoordinatesSchema>;
export declare const LocationSchema: z.ZodObject<{
    id: z.ZodString;
    code: z.ZodOptional<z.ZodString>;
    name: z.ZodString;
    address: z.ZodString;
    latitude: z.ZodNumber;
    longitude: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    latitude: number;
    longitude: number;
    id: string;
    name: string;
    address: string;
    code?: string | undefined;
}, {
    latitude: number;
    longitude: number;
    id: string;
    name: string;
    address: string;
    code?: string | undefined;
}>;
export type Location = z.infer<typeof LocationSchema>;
export declare const VehicleSchema: z.ZodObject<{
    id: z.ZodString;
    code: z.ZodString;
    name: z.ZodString;
    driverName: z.ZodOptional<z.ZodString>;
    maxWeightKg: z.ZodNumber;
    maxVolumeM3: z.ZodNumber;
    currentWeightKg: z.ZodDefault<z.ZodNumber>;
    currentVolumeM3: z.ZodDefault<z.ZodNumber>;
    status: z.ZodEnum<["available", "en_route", "delayed", "broken_down", "maintenance"]>;
    currentLatitude: z.ZodOptional<z.ZodNumber>;
    currentLongitude: z.ZodOptional<z.ZodNumber>;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    code: string;
    status: "available" | "en_route" | "delayed" | "broken_down" | "maintenance";
    id: string;
    name: string;
    maxWeightKg: number;
    maxVolumeM3: number;
    currentWeightKg: number;
    currentVolumeM3: number;
    updatedAt: string;
    driverName?: string | undefined;
    currentLatitude?: number | undefined;
    currentLongitude?: number | undefined;
}, {
    code: string;
    status: "available" | "en_route" | "delayed" | "broken_down" | "maintenance";
    id: string;
    name: string;
    maxWeightKg: number;
    maxVolumeM3: number;
    updatedAt: string;
    driverName?: string | undefined;
    currentWeightKg?: number | undefined;
    currentVolumeM3?: number | undefined;
    currentLatitude?: number | undefined;
    currentLongitude?: number | undefined;
}>;
export type Vehicle = z.infer<typeof VehicleSchema>;
export declare const UpdateVehiclePositionSchema: z.ZodObject<{
    latitude: z.ZodNumber;
    longitude: z.ZodNumber;
    timestamp: z.ZodString;
}, "strip", z.ZodTypeAny, {
    latitude: number;
    longitude: number;
    timestamp: string;
}, {
    latitude: number;
    longitude: number;
    timestamp: string;
}>;
export type UpdateVehiclePosition = z.infer<typeof UpdateVehiclePositionSchema>;
export declare const OrderSchema: z.ZodObject<{
    id: z.ZodString;
    trackingNumber: z.ZodString;
    customerId: z.ZodString;
    locationId: z.ZodString;
    weightKg: z.ZodNumber;
    volumeM3: z.ZodNumber;
    windowStart: z.ZodString;
    windowEnd: z.ZodString;
    serviceDurationSeconds: z.ZodDefault<z.ZodNumber>;
    priority: z.ZodDefault<z.ZodEnum<["standard", "high", "urgent"]>>;
    status: z.ZodEnum<["pending", "assigned", "in_transit", "completed", "failed", "cancelled"]>;
}, "strip", z.ZodTypeAny, {
    status: "pending" | "assigned" | "in_transit" | "completed" | "failed" | "cancelled";
    id: string;
    trackingNumber: string;
    customerId: string;
    locationId: string;
    weightKg: number;
    volumeM3: number;
    windowStart: string;
    windowEnd: string;
    serviceDurationSeconds: number;
    priority: "standard" | "high" | "urgent";
}, {
    status: "pending" | "assigned" | "in_transit" | "completed" | "failed" | "cancelled";
    id: string;
    trackingNumber: string;
    customerId: string;
    locationId: string;
    weightKg: number;
    volumeM3: number;
    windowStart: string;
    windowEnd: string;
    serviceDurationSeconds?: number | undefined;
    priority?: "standard" | "high" | "urgent" | undefined;
}>;
export type Order = z.infer<typeof OrderSchema>;
export declare const CreateOrderSchema: z.ZodObject<Omit<{
    id: z.ZodString;
    trackingNumber: z.ZodString;
    customerId: z.ZodString;
    locationId: z.ZodString;
    weightKg: z.ZodNumber;
    volumeM3: z.ZodNumber;
    windowStart: z.ZodString;
    windowEnd: z.ZodString;
    serviceDurationSeconds: z.ZodDefault<z.ZodNumber>;
    priority: z.ZodDefault<z.ZodEnum<["standard", "high", "urgent"]>>;
    status: z.ZodEnum<["pending", "assigned", "in_transit", "completed", "failed", "cancelled"]>;
}, "status" | "id"> & {
    status: z.ZodOptional<z.ZodEnum<["pending", "assigned", "in_transit", "completed", "failed", "cancelled"]>>;
}, "strip", z.ZodTypeAny, {
    trackingNumber: string;
    customerId: string;
    locationId: string;
    weightKg: number;
    volumeM3: number;
    windowStart: string;
    windowEnd: string;
    serviceDurationSeconds: number;
    priority: "standard" | "high" | "urgent";
    status?: "pending" | "assigned" | "in_transit" | "completed" | "failed" | "cancelled" | undefined;
}, {
    trackingNumber: string;
    customerId: string;
    locationId: string;
    weightKg: number;
    volumeM3: number;
    windowStart: string;
    windowEnd: string;
    status?: "pending" | "assigned" | "in_transit" | "completed" | "failed" | "cancelled" | undefined;
    serviceDurationSeconds?: number | undefined;
    priority?: "standard" | "high" | "urgent" | undefined;
}>;
export type CreateOrder = z.infer<typeof CreateOrderSchema>;
export declare const IncidentCreateSchema: z.ZodObject<{
    type: z.ZodEnum<["breakdown", "road_closure", "traffic_delay", "urgent_order", "weather", "other"]>;
    severity: z.ZodDefault<z.ZodEnum<["low", "medium", "high", "critical"]>>;
    description: z.ZodString;
    vehicleId: z.ZodOptional<z.ZodString>;
    routeId: z.ZodOptional<z.ZodString>;
    locationId: z.ZodOptional<z.ZodString>;
    reportedAt: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: "breakdown" | "road_closure" | "traffic_delay" | "urgent_order" | "weather" | "other";
    severity: "high" | "low" | "medium" | "critical";
    description: string;
    locationId?: string | undefined;
    vehicleId?: string | undefined;
    routeId?: string | undefined;
    reportedAt?: string | undefined;
}, {
    type: "breakdown" | "road_closure" | "traffic_delay" | "urgent_order" | "weather" | "other";
    description: string;
    locationId?: string | undefined;
    severity?: "high" | "low" | "medium" | "critical" | undefined;
    vehicleId?: string | undefined;
    routeId?: string | undefined;
    reportedAt?: string | undefined;
}>;
export type IncidentCreate = z.infer<typeof IncidentCreateSchema>;
export declare const IncidentVoiceSubmitSchema: z.ZodObject<{
    audioBase64: z.ZodOptional<z.ZodString>;
    durationSeconds: z.ZodOptional<z.ZodNumber>;
    vehicleId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    vehicleId?: string | undefined;
    audioBase64?: string | undefined;
    durationSeconds?: number | undefined;
}, {
    vehicleId?: string | undefined;
    audioBase64?: string | undefined;
    durationSeconds?: number | undefined;
}>;
export type IncidentVoiceSubmit = z.infer<typeof IncidentVoiceSubmitSchema>;
export declare const IncidentConfirmationSchema: z.ZodObject<{
    incidentId: z.ZodString;
    decision: z.ZodEnum<["confirm", "dismiss"]>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    incidentId: string;
    decision: "confirm" | "dismiss";
    notes?: string | undefined;
}, {
    incidentId: string;
    decision: "confirm" | "dismiss";
    notes?: string | undefined;
}>;
export type IncidentConfirmation = z.infer<typeof IncidentConfirmationSchema>;
export declare const OptimizationJobRequestSchema: z.ZodObject<{
    planId: z.ZodString;
    incidentId: z.ZodOptional<z.ZodString>;
    timeLimitSeconds: z.ZodDefault<z.ZodNumber>;
    weights: z.ZodOptional<z.ZodObject<{
        cost: z.ZodDefault<z.ZodNumber>;
        churn: z.ZodDefault<z.ZodNumber>;
        disjunctionPenalty: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        cost: number;
        churn: number;
        disjunctionPenalty: number;
    }, {
        cost?: number | undefined;
        churn?: number | undefined;
        disjunctionPenalty?: number | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    planId: string;
    timeLimitSeconds: number;
    incidentId?: string | undefined;
    weights?: {
        cost: number;
        churn: number;
        disjunctionPenalty: number;
    } | undefined;
}, {
    planId: string;
    incidentId?: string | undefined;
    timeLimitSeconds?: number | undefined;
    weights?: {
        cost?: number | undefined;
        churn?: number | undefined;
        disjunctionPenalty?: number | undefined;
    } | undefined;
}>;
export type OptimizationJobRequest = z.infer<typeof OptimizationJobRequestSchema>;
export declare const ProposalApprovalSchema: z.ZodObject<{
    proposalId: z.ZodString;
    proposalVersion: z.ZodNumber;
    decision: z.ZodEnum<["approve", "reject"]>;
    rejectionReason: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    decision: "approve" | "reject";
    proposalId: string;
    proposalVersion: number;
    rejectionReason?: string | undefined;
}, {
    decision: "approve" | "reject";
    proposalId: string;
    proposalVersion: number;
    rejectionReason?: string | undefined;
}>;
export type ProposalApproval = z.infer<typeof ProposalApprovalSchema>;
export declare const CustomerNotificationSchema: z.ZodObject<{
    id: z.ZodString;
    orderId: z.ZodString;
    customerPhone: z.ZodString;
    customerName: z.ZodString;
    revisedEta: z.ZodString;
    status: z.ZodEnum<["pending", "sent", "delivered", "failed", "simulated_sent", "manual_contacted"]>;
    messageText: z.ZodString;
    audioUrl: z.ZodOptional<z.ZodString>;
    sentAt: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: "pending" | "failed" | "sent" | "delivered" | "simulated_sent" | "manual_contacted";
    id: string;
    orderId: string;
    customerPhone: string;
    customerName: string;
    revisedEta: string;
    messageText: string;
    audioUrl?: string | undefined;
    sentAt?: string | undefined;
}, {
    status: "pending" | "failed" | "sent" | "delivered" | "simulated_sent" | "manual_contacted";
    id: string;
    orderId: string;
    customerPhone: string;
    customerName: string;
    revisedEta: string;
    messageText: string;
    audioUrl?: string | undefined;
    sentAt?: string | undefined;
}>;
export type CustomerNotification = z.infer<typeof CustomerNotificationSchema>;
export declare const GenerateAudioNotificationSchema: z.ZodObject<{
    notificationId: z.ZodString;
    voiceId: z.ZodOptional<z.ZodString>;
    model: z.ZodDefault<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    notificationId: string;
    model: string;
    voiceId?: string | undefined;
}, {
    notificationId: string;
    voiceId?: string | undefined;
    model?: string | undefined;
}>;
export type GenerateAudioNotification = z.infer<typeof GenerateAudioNotificationSchema>;
export declare const FleetBriefingSchema: z.ZodObject<{
    planId: z.ZodString;
    shift: z.ZodEnum<["morning", "afternoon", "evening"]>;
    briefingText: z.ZodString;
    audioUrl: z.ZodOptional<z.ZodString>;
    wordCount: z.ZodNumber;
    generatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    shift: "morning" | "afternoon" | "evening";
    planId: string;
    briefingText: string;
    wordCount: number;
    generatedAt: string;
    audioUrl?: string | undefined;
}, {
    shift: "morning" | "afternoon" | "evening";
    planId: string;
    briefingText: string;
    wordCount: number;
    generatedAt: string;
    audioUrl?: string | undefined;
}>;
export type FleetBriefing = z.infer<typeof FleetBriefingSchema>;
export declare const SystemHealthSchema: z.ZodObject<{
    status: z.ZodEnum<["healthy", "degraded", "unhealthy"]>;
    timestamp: z.ZodString;
    version: z.ZodString;
}, "strip", z.ZodTypeAny, {
    status: "healthy" | "degraded" | "unhealthy";
    timestamp: string;
    version: string;
}, {
    status: "healthy" | "degraded" | "unhealthy";
    timestamp: string;
    version: string;
}>;
export type SystemHealth = z.infer<typeof SystemHealthSchema>;
