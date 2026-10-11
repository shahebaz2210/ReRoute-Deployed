/**
 * Centralized mock data fixtures for vehicles, orders, disruptions, and plans
 */

export interface Vehicle {
  id: string;
  licensePlate: string;
  model: string;
  capacityWeightKg: number;
  capacityVolumeM3: number;
  status: "ACTIVE" | "IDLE" | "MAINTENANCE" | "BREAKDOWN";
  currentLat: number;
  currentLng: number;
  driverName: string;
}

export interface Order {
  id: string;
  customerName: string;
  deliveryAddress: string;
  deliveryLat: number;
  deliveryLng: number;
  weightKg: number;
  volumeM3: number;
  status: "PENDING" | "ASSIGNED" | "OUT_FOR_DELIVERY" | "DELIVERED" | "FAILED";
  timeWindowStart: string;
  timeWindowEnd: string;
}

export interface Disruption {
  id: string;
  type: "ROAD_CLOSURE" | "VEHICLE_BREAKDOWN" | "TRAFFIC_DELAY" | "CUSTOMER_UNAVAILABLE" | "WEATHER";
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  vehicleId?: string;
  description: string;
  impactDurationMinutes: number;
  timestamp: string;
  status: "OPEN" | "RESOLVED" | "REVIEWING";
  recommendedAction?: string;
}

export interface Plan {
  id: string;
  name: string;
  version: number;
  status: "DRAFT" | "ACTIVE" | "SUPERSEDED" | "ARCHIVED";
  date: string;
  vehicleCount: number;
  stopCount: number;
  totalDistanceKm: number;
  totalCostUsd: number;
}

export const mockVehicles: Vehicle[] = [
  {
    id: "VH-001",
    licensePlate: "SF-789-TX",
    model: "Mercedes-Benz Sprinter 3500",
    capacityWeightKg: 1500,
    capacityVolumeM3: 14.0,
    status: "ACTIVE",
    currentLat: 37.7749,
    currentLng: -122.4194,
    driverName: "Alex Vance",
  },
  {
    id: "VH-002",
    licensePlate: "SF-104-EQ",
    model: "Ford E-Transit Electric",
    capacityWeightKg: 1200,
    capacityVolumeM3: 11.5,
    status: "ACTIVE",
    currentLat: 37.7850,
    currentLng: -122.4050,
    driverName: "Marcus Sterling",
  },
  {
    id: "VH-003",
    licensePlate: "SF-552-KL",
    model: "Ram ProMaster 2500",
    capacityWeightKg: 1800,
    capacityVolumeM3: 13.0,
    status: "ACTIVE",
    currentLat: 37.7600,
    currentLng: -122.4200,
    driverName: "Elena Rostova",
  },
  {
    id: "VH-004",
    licensePlate: "SF-903-ZZ",
    model: "Ford Transit High Roof",
    capacityWeightKg: 1400,
    capacityVolumeM3: 12.0,
    status: "IDLE",
    currentLat: 37.7700,
    currentLng: -122.4150,
    driverName: "David Kim",
  },
];

export const mockOrders: Order[] = [
  {
    id: "ORD-9901",
    customerName: "Apex BioLabs",
    deliveryAddress: "185 Berry St, Suite 400, SF",
    deliveryLat: 37.7765,
    deliveryLng: -122.3934,
    weightKg: 45,
    volumeM3: 0.35,
    status: "DELIVERED",
    timeWindowStart: "08:00",
    timeWindowEnd: "12:00",
  },
  {
    id: "ORD-9902",
    customerName: "Marina Grocers",
    deliveryAddress: "2200 Chestnut St, SF",
    deliveryLat: 37.8001,
    deliveryLng: -122.4398,
    weightKg: 120,
    volumeM3: 1.1,
    status: "OUT_FOR_DELIVERY",
    timeWindowStart: "09:00",
    timeWindowEnd: "13:00",
  },
  {
    id: "ORD-9903",
    customerName: "Mission Culinary Arts",
    deliveryAddress: "750 Valencia St, SF",
    deliveryLat: 37.7607,
    deliveryLng: -122.4216,
    weightKg: 85,
    volumeM3: 0.7,
    status: "ASSIGNED",
    timeWindowStart: "10:00",
    timeWindowEnd: "14:00",
  },
  {
    id: "ORD-9904",
    customerName: "Presidio Diagnostic Clinic",
    deliveryAddress: "102 Montgomery St, SF",
    deliveryLat: 37.7995,
    deliveryLng: -122.4578,
    weightKg: 28,
    volumeM3: 0.2,
    status: "ASSIGNED",
    timeWindowStart: "11:00",
    timeWindowEnd: "15:00",
  },
  {
    id: "ORD-9905",
    customerName: "BayTech Robotics",
    deliveryAddress: "400 2nd St, SF",
    deliveryLat: 37.7845,
    deliveryLng: -122.3976,
    weightKg: 150,
    volumeM3: 1.4,
    status: "ASSIGNED",
    timeWindowStart: "08:30",
    timeWindowEnd: "12:30",
  },
];

export const mockDisruptions: Disruption[] = [
  {
    id: "DISR-4011",
    type: "ROAD_CLOSURE",
    severity: "HIGH",
    vehicleId: "VH-001",
    description: "Emergency gas main repair on Market St between 4th & 5th. All westbound lanes closed.",
    impactDurationMinutes: 45,
    timestamp: "2026-10-12T10:14:00Z",
    status: "OPEN",
    recommendedAction: "Detour via Mission St and re-sequence ORD-9902 after ORD-9903",
  },
  {
    id: "DISR-4012",
    type: "TRAFFIC_DELAY",
    severity: "MEDIUM",
    vehicleId: "VH-002",
    description: "Multi-vehicle collision on US-101 North approaching Bay Bridge. Congestion extending 3.2 km.",
    impactDurationMinutes: 25,
    timestamp: "2026-10-12T10:28:00Z",
    status: "OPEN",
    recommendedAction: "Reroute through Embarcadero surface corridor",
  },
];

export const mockPlans: Plan[] = [
  {
    id: "PLAN-SF-2026-10-12",
    name: "San Francisco Urban Distribution V1",
    version: 1,
    status: "ACTIVE",
    date: "2026-10-12",
    vehicleCount: 4,
    stopCount: 5,
    totalDistanceKm: 68.4,
    totalCostUsd: 142.5,
  },
];
