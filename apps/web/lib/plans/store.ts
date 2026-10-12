/**
 * In-Memory Plan, Fleet & Order State Store
 * Manages live delivery plans, real travel time matrix computation,
 * OR-Tools VRPTW optimization execution, and disruption lifecycle.
 */

import { buildTravelTimeMatrix, MatrixLocation } from "@/lib/optimizer/matrix-generator";
import { dispatchOptimization, OptimizeVehicle, OptimizeStop, OptimizationResult } from "@/lib/optimizer/client";

export interface StoredOrder {
  id: string;
  orderReference: string;
  customerName: string;
  deliveryAddress: string;
  latitude: number;
  longitude: number;
  weightKg: number;
  volumeM3: number;
  timeWindowStart: string; // "HH:MM"
  timeWindowEnd: string;   // "HH:MM"
  serviceDurationMinutes: number;
  priority: "STANDARD" | "EXPRESS" | "CRITICAL";
  status: "PENDING" | "IN_TRANSIT" | "DELIVERED" | "STUCKED" | "CANCELED";
  assignedVehicleId?: string | null;
  assignedSequence?: number;
  eta?: string;
  isCompleted?: boolean;
}

export interface StoredRouteStop {
  stopNumber: number;
  type: "DEPOT_DEPARTURE" | "DELIVERY" | "DEPOT_END";
  orderRef?: string;
  orderId?: string;
  locationName: string;
  address?: string;
  lat: number;
  lng: number;
  eta: string;
  departure: string;
  waitingMinutes: number;
  serviceMinutes: number;
  cumulativeWeightKg: number;
  cumulativeVolumeM3: number;
  status: "PENDING" | "IN_TRANSIT" | "DELIVERED" | "STUCKED" | "COMPLETED";
}

export interface StoredRoute {
  vehicleId: string;
  vehicleCode: string;
  vehicleName: string;
  driverName: string;
  stopsCount: number;
  weightUtilizationPercent: number;
  volumeUtilizationPercent: number;
  totalWeightKg: number;
  totalVolumeM3: number;
  distanceKm: number;
  durationMinutes: number;
  fuelConsumedLiters: number;
  co2EmittedKg: number;
  fuelEfficiencyKmPerL: number;
  isFailed?: boolean;
  failureTimeMinutes?: number;
  routeGeometry?: number[][];
  stops: StoredRouteStop[];
}

export interface StoredPlan {
  id: string;
  planName: string;
  status: "DRAFT" | "OPTIMIZING" | "ACTIVE" | "COMPLETED";
  activeVersionNumber: number;
  depot: {
    id: string;
    name: string;
    lat: number;
    lng: number;
  };
  totalOrders: number;
  totalVehicles: number;
  totalDistanceKm: number;
  totalDurationMinutes: number;
  totalFuelLiters: number;
  totalCo2Kg: number;
  orders: StoredOrder[];
  fleet?: any[];
  routes: StoredRoute[];
  unassignedOrders: Array<{ orderId: string; reason: string }>;
  matrix?: {
    duration_matrix_seconds: number[][];
    distance_matrix_meters: number[][];
  };
  createdAt: string;
  optimizedAt?: string;
}

export const FLEET_UNITS = [
  {
    id: "VH-001",
    vehicleCode: "TRK-01",
    name: "Truck Alpha",
    driverName: "Alex Vance",
    capacityWeightKg: 1500,
    capacityVolumeM3: 14.0,
    fuelEfficiencyKmPerL: 5.4,
    fuelType: "Ultra-Low Sulfur Diesel",
    emissionFactorKgPerL: 2.68,
    shiftStartMinutes: 480, // 08:00 AM
    shiftEndMinutes: 1080,  // 06:00 PM
  },
  {
    id: "VH-002",
    vehicleCode: "TRK-02",
    name: "Truck Beta",
    driverName: "Marcus Sterling",
    capacityWeightKg: 1200,
    capacityVolumeM3: 11.5,
    fuelEfficiencyKmPerL: 6.8,
    fuelType: "Electric Equivalent",
    emissionFactorKgPerL: 0.85,
    shiftStartMinutes: 480,
    shiftEndMinutes: 1080,
  },
  {
    id: "VH-003",
    vehicleCode: "VAN-03",
    name: "Van Gamma",
    driverName: "Elena Rostova",
    capacityWeightKg: 1800,
    capacityVolumeM3: 13.0,
    fuelEfficiencyKmPerL: 5.8,
    fuelType: "Flex-Fuel Hybrid",
    emissionFactorKgPerL: 2.15,
    shiftStartMinutes: 510, // 08:30 AM
    shiftEndMinutes: 1050,  // 05:30 PM
  },
];

// In-Memory store singleton
const globalStore = globalThis as unknown as {
  __dispatchx_plans_store?: Map<string, StoredPlan>;
};

if (!globalStore.__dispatchx_plans_store) {
  globalStore.__dispatchx_plans_store = new Map<string, StoredPlan>();
}

export const plansStore: Map<string, StoredPlan> = globalStore.__dispatchx_plans_store;

function parseTimeToMinutes(t: string): number {
  const parts = t.split(":").map(Number);
  if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    return parts[0] * 60 + parts[1];
  }
  return 540; // 09:00 AM fallback
}

function formatMinutesToTime(mins: number): string {
  const h = Math.floor(mins / 60) % 24;
  const m = Math.floor(mins % 60);
  const ampm = h >= 12 ? "PM" : "AM";
  const displayH = h % 12 === 0 ? 12 : h % 12;
  return `${String(displayH).padStart(2, "0")}:${String(m).padStart(2, "0")} ${ampm}`;
}

export const DEFAULT_SEED_ORDERS = [
  {
    orderReference: "ORD-PN-101",
    customerName: "Cummins India Engine Hub",
    deliveryAddress: "Kothrud Industrial Area, Pune",
    latitude: 18.5074,
    longitude: 73.8077,
    weightKg: 420,
    volumeM3: 2.8,
    timeWindowStart: "08:30",
    timeWindowEnd: "11:30",
    serviceDurationMinutes: 15,
    priority: "STANDARD",
  },
  {
    orderReference: "ORD-PN-102",
    customerName: "Deccan Gymkhana Retail Express",
    deliveryAddress: "FC Road, Deccan Gymkhana, Pune",
    latitude: 18.5167,
    longitude: 73.8415,
    weightKg: 280,
    volumeM3: 1.6,
    timeWindowStart: "09:00",
    timeWindowEnd: "12:00",
    serviceDurationMinutes: 15,
    priority: "EXPRESS",
  },
  {
    orderReference: "ORD-PN-103",
    customerName: "Shivaji Nagar Metro Logistics",
    deliveryAddress: "Near Pune Railway Station, Shivaji Nagar, Pune",
    latitude: 18.5314,
    longitude: 73.8446,
    weightKg: 350,
    volumeM3: 2.1,
    timeWindowStart: "10:00",
    timeWindowEnd: "14:00",
    serviceDurationMinutes: 15,
    priority: "STANDARD",
  },
  {
    orderReference: "ORD-PN-104",
    customerName: "Serum Institute Cargo Gate",
    deliveryAddress: "Solapur Road, Hadapsar, Pune",
    latitude: 18.5089,
    longitude: 73.9259,
    weightKg: 650,
    volumeM3: 4.2,
    timeWindowStart: "08:00",
    timeWindowEnd: "11:00",
    serviceDurationMinutes: 20,
    priority: "CRITICAL",
  },
  {
    orderReference: "ORD-PN-105",
    customerName: "Magarpatta Cybercity Tech Hub",
    deliveryAddress: "Magarpatta City, Hadapsar, Pune",
    latitude: 18.5147,
    longitude: 73.9298,
    weightKg: 310,
    volumeM3: 1.9,
    timeWindowStart: "09:30",
    timeWindowEnd: "12:30",
    serviceDurationMinutes: 15,
    priority: "STANDARD",
  },
  {
    orderReference: "ORD-PN-106",
    customerName: "EON Free Zone IT Deliveries",
    deliveryAddress: "Kharadi Knowledge Park, Pune",
    latitude: 18.5515,
    longitude: 73.9349,
    weightKg: 490,
    volumeM3: 3.0,
    timeWindowStart: "11:00",
    timeWindowEnd: "15:00",
    serviceDurationMinutes: 20,
    priority: "EXPRESS",
  },
  {
    orderReference: "ORD-PN-107",
    customerName: "Pune Central Rail Freight Depot",
    deliveryAddress: "Raja Bahadur Mill Road, Pune",
    latitude: 18.5284,
    longitude: 73.8739,
    weightKg: 780,
    volumeM3: 5.1,
    timeWindowStart: "08:30",
    timeWindowEnd: "12:00",
    serviceDurationMinutes: 20,
    priority: "STANDARD",
  },
  {
    orderReference: "ORD-PN-108",
    customerName: "Yerawada Commerzone Express",
    deliveryAddress: "Samrat Ashok Path, Yerawada, Pune",
    latitude: 18.5529,
    longitude: 73.8796,
    weightKg: 260,
    volumeM3: 1.7,
    timeWindowStart: "10:00",
    timeWindowEnd: "14:00",
    serviceDurationMinutes: 15,
    priority: "STANDARD",
  },
  {
    orderReference: "ORD-PN-109",
    customerName: "Viman Nagar Air Cargo Hub",
    deliveryAddress: "Near Pune International Airport, Viman Nagar, Pune",
    latitude: 18.5679,
    longitude: 73.9143,
    weightKg: 540,
    volumeM3: 3.6,
    timeWindowStart: "11:00",
    timeWindowEnd: "15:30",
    serviceDurationMinutes: 15,
    priority: "CRITICAL",
  },
];

/**
 * Creates or stages a new plan with real uploaded orders.
 * Strictly enforces that every vehicle shares the same starting location (Dispatcher's Central Depot Center).
 */
export function createPlan(
  planId: string,
  planName: string,
  ordersInput: any[],
  vehicleIds?: string[],
  customVehicles?: any[],
  depotCoords?: { id?: string; latitude: number; longitude: number }
): StoredPlan {
  const effectiveOrders = ordersInput && ordersInput.length > 0 ? ordersInput : DEFAULT_SEED_ORDERS;

  // Central Depot Center (Default: Swargate Multimodal Central Depot, Pune: 18.5018° N, 73.8586° E)
  let avgLat = depotCoords?.latitude || 18.5018;
  let avgLng = depotCoords?.longitude || 73.8586;

  if (!depotCoords) {
    const validCoords = effectiveOrders.filter((o) => typeof o.latitude === "number" && typeof o.longitude === "number");
    if (validCoords.length > 0) {
      avgLat = validCoords.reduce((sum, o) => sum + o.latitude, 0) / validCoords.length;
      avgLng = validCoords.reduce((sum, o) => sum + o.longitude, 0) / validCoords.length;
    }
  }

  const depot = {
    id: depotCoords?.id || "DEPOT-PUNE-SWARGATE",
    name: "Swargate Central Logistics Hub, Pune",
    lat: avgLat,
    lng: avgLng,
  };

  const storedFleet = customVehicles && customVehicles.length > 0
    ? customVehicles.map((v, i) => ({
        id: v.vehicleId || `VH-${String(i + 1).padStart(3, "0")}`,
        vehicleCode: v.vehicleCode || v.vehicleId || `TRK-${String(i + 1).padStart(2, "0")}`,
        name: v.vehicleType || `Fleet Vehicle #${i + 1}`,
        driverName: v.driverName || `Driver #${i + 1}`,
        capacityWeightKg: Number(v.weightCapacityKg) || 1500,
        capacityVolumeM3: Number(v.volumeCapacityM3) || 14.0,
        fuelEfficiencyKmPerL: Number(v.fuelEfficiencyKmPerL) || 5.4,
        fuelType: v.fuelType || "Ultra-Low Sulfur Diesel",
        emissionFactorKgPerL: 2.68,
        shiftStartMinutes: parseTimeToMinutes(v.shiftStartTime || "08:00"),
        shiftEndMinutes: parseTimeToMinutes(v.shiftEndTime || "18:00"),
      }))
    : FLEET_UNITS;

  const storedOrders: StoredOrder[] = effectiveOrders.map((o, idx) => ({
    id: o.orderReference || o.id || `ORD-${1000 + idx}`,
    orderReference: o.orderReference || o.id || `ORD-${1000 + idx}`,
    customerName: o.customerName || `Customer #${idx + 1}`,
    deliveryAddress: o.deliveryAddress || `${o.latitude?.toFixed(4)}, ${o.longitude?.toFixed(4)}`,
    latitude: Number(o.latitude),
    longitude: Number(o.longitude),
    weightKg: Number(o.weightKg) || 100,
    volumeM3: Number(o.volumeM3) || 0.8,
    timeWindowStart: o.timeWindowStart || "08:30",
    timeWindowEnd: o.timeWindowEnd || "17:30",
    serviceDurationMinutes: Number(o.serviceDurationMinutes) || 15,
    priority: o.priority || "STANDARD",
    status: "PENDING",
  }));

  const plan: StoredPlan = {
    id: planId,
    planName: planName || "Daily Logistics Route Plan",
    status: "DRAFT",
    activeVersionNumber: 1,
    depot,
    totalOrders: storedOrders.length,
    totalVehicles: storedFleet.length,
    totalDistanceKm: 0,
    totalDurationMinutes: 0,
    totalFuelLiters: 0,
    totalCo2Kg: 0,
    orders: storedOrders,
    fleet: storedFleet,
    routes: [],
    unassignedOrders: [],
    createdAt: new Date().toISOString(),
  };

  plansStore.set(planId, plan);
  return plan;
}

/**
 * Executes dynamic OR-Tools VRPTW route optimization with real travel time matrix.
 */
export async function optimizePlan(
  planId: string,
  options?: {
    disruption?: any;
    vehicle_id?: string;
  }
): Promise<StoredPlan> {
  let plan = plansStore.get(planId);
  if (!plan) {
    // If not found, create a baseline plan from seeded sample data
    plan = createPlan(planId, "DispatchX Scheduled Plan", []);
  }

  plan.status = "OPTIMIZING";
  const activeFleet = plan.fleet && plan.fleet.length > 0 ? plan.fleet : FLEET_UNITS;

  // Build real matrix locations: [Depot, Order1, Order2, ...]
  const matrixLocations: MatrixLocation[] = [
    {
      id: plan.depot.id,
      name: plan.depot.name,
      lat: plan.depot.lat,
      lng: plan.depot.lng,
    },
    ...plan.orders.map((o) => ({
      id: o.id,
      name: o.customerName,
      lat: o.latitude,
      lng: o.longitude,
    })),
  ];

  // Optional disruption delays
  const roadClosureDelays: any[] = [];
  if (options?.disruption && options.disruption.incidentType === "ROAD_CLOSURE") {
    roadClosureDelays.push({
      fromId: options.disruption.from || plan.depot.id,
      toId: options.disruption.to || plan.orders[0]?.id,
      additionalDelaySeconds: (options.disruption.delayMinutes || 40) * 60,
    });
  }

  // 1. Generate real travel time and distance matrix from coordinates
  const generatedMatrix = buildTravelTimeMatrix(matrixLocations, roadClosureDelays);
  plan.matrix = {
    duration_matrix_seconds: generatedMatrix.duration_matrix_seconds,
    distance_matrix_meters: generatedMatrix.distance_matrix_meters,
  };

  // 2. Prepare vehicles for OR-Tools optimization
  const vehiclesPayload: OptimizeVehicle[] = activeFleet.map((v) => {
    let failureTime: number | undefined = undefined;
    if (
      options?.disruption &&
      (options.disruption.incidentType === "BREAKDOWN" || options.disruption.incidentType === "VEHICLE_BREAKDOWN") &&
      options.vehicle_id === v.id
    ) {
      failureTime = options.disruption.failureTimeMinutes || 585; // 09:45 AM
    }

    return {
      id: v.id,
      name: v.vehicleCode,
      capacity_kg: v.capacityWeightKg,
      capacity_m3: v.capacityVolumeM3,
      depot_id: plan.depot.id,
      max_shift_minutes: v.shiftEndMinutes - v.shiftStartMinutes,
      failure_time_minutes: failureTime,
    };
  });

  // 3. Prepare orders for OR-Tools optimization
  // If an order is cancelled, we skip it completely!
  let ordersToOptimize = plan.orders;
  if (options?.disruption && options.disruption.incidentType === "CANCELLATION") {
    const cancelledId = options.disruption.from || options.disruption.locationName;
    ordersToOptimize = ordersToOptimize.filter(
      (o) => !cancelledId.includes(o.id) && !cancelledId.includes(o.orderReference)
    );
  }

  const stopsPayload: OptimizeStop[] = ordersToOptimize.map((o) => ({
    id: o.id,
    name: o.customerName,
    lat: o.latitude,
    lng: o.longitude,
    weight_kg: o.weightKg,
    volume_m3: o.volumeM3,
    time_window_start_minutes: parseTimeToMinutes(o.timeWindowStart),
    time_window_end_minutes: parseTimeToMinutes(o.timeWindowEnd),
    service_duration_minutes: o.serviceDurationMinutes || 15,
    is_completed: o.isCompleted || false,
    assigned_vehicle_id: o.assignedVehicleId || undefined,
  }));

  // 4. Dispatch to Python Google OR-Tools microservice (or local solver)
  const optimizationPayload = {
    plan_id: plan.id,
    vehicles: vehiclesPayload,
    stops: stopsPayload,
    depot: {
      id: plan.depot.id,
      name: plan.depot.name,
      lat: plan.depot.lat,
      lng: plan.depot.lng,
    },
    duration_matrix_seconds: generatedMatrix.duration_matrix_seconds,
    distance_matrix_meters: generatedMatrix.distance_matrix_meters,
    simulated_travel_time_matrix_minutes: generatedMatrix.duration_matrix_seconds.map((row) =>
      row.map((sec) => Math.round(sec / 60))
    ),
    time_limit_seconds: 5,
  };

  const solution: OptimizationResult = await dispatchOptimization(optimizationPayload);

  // 5. Transform solution routes into rich vehicle manifests
  const routes: StoredRoute[] = [];
  let totalDistanceKm = 0;
  let totalDurationMinutes = 0;
  let totalFuelLiters = 0;
  let totalCo2Kg = 0;

  solution.routes.forEach((solRoute) => {
    const fleetConfig = activeFleet.find((u) => u.id === solRoute.vehicle_id) || activeFleet[0];
    const stops: StoredRouteStop[] = [];

    // Depot departure stop
    stops.push({
      stopNumber: 1,
      type: "DEPOT_DEPARTURE",
      locationName: plan.depot.name,
      lat: plan.depot.lat,
      lng: plan.depot.lng,
      eta: formatMinutesToTime(solRoute.start_time_minutes || 480),
      departure: formatMinutesToTime(solRoute.start_time_minutes || 480),
      waitingMinutes: 0,
      serviceMinutes: 0,
      cumulativeWeightKg: 0,
      cumulativeVolumeM3: 0,
      status: "COMPLETED",
    });

    // Delivery stops
    solRoute.stops.forEach((st, idx) => {
      const orderDef = plan.orders.find((o) => o.id === st.stop_id);
      const isDelivered = orderDef?.isCompleted || idx === 0;

      stops.push({
        stopNumber: idx + 2,
        type: "DELIVERY",
        orderId: st.stop_id,
        orderRef: orderDef?.orderReference || st.stop_id,
        locationName: orderDef?.customerName || `Stop #${idx + 1}`,
        address: orderDef?.deliveryAddress,
        lat: orderDef?.latitude || plan.depot.lat,
        lng: orderDef?.longitude || plan.depot.lng,
        eta: formatMinutesToTime(st.arrival_time_minutes),
        departure: formatMinutesToTime(st.departure_time_minutes),
        waitingMinutes: st.waiting_time_minutes,
        serviceMinutes: st.departure_time_minutes - st.service_start_minutes,
        cumulativeWeightKg: st.cumulative_weight_kg,
        cumulativeVolumeM3: st.cumulative_volume_m3,
        status: isDelivered ? "DELIVERED" : idx === 1 ? "IN_TRANSIT" : "PENDING",
      });

      // Update individual order status
      if (orderDef) {
        orderDef.assignedVehicleId = solRoute.vehicle_id;
        orderDef.assignedSequence = idx + 1;
        orderDef.eta = formatMinutesToTime(st.arrival_time_minutes);
        orderDef.status = isDelivered ? "DELIVERED" : idx === 1 ? "IN_TRANSIT" : "PENDING";
      }
    });

    const routeDistance = solRoute.total_distance_km;
    const routeDuration = solRoute.total_duration_minutes;
    const routeFuel = routeDistance / fleetConfig.fuelEfficiencyKmPerL;
    const routeCo2 = routeFuel * fleetConfig.emissionFactorKgPerL;

    totalDistanceKm += routeDistance;
    totalDurationMinutes += routeDuration;
    totalFuelLiters += routeFuel;
    totalCo2Kg += routeCo2;

    routes.push({
      vehicleId: solRoute.vehicle_id,
      vehicleCode: fleetConfig.vehicleCode,
      vehicleName: fleetConfig.name,
      driverName: fleetConfig.driverName,
      stopsCount: stops.length,
      weightUtilizationPercent: Math.round(
        (solRoute.total_weight_kg / fleetConfig.capacityWeightKg) * 100
      ),
      volumeUtilizationPercent: Math.round(
        (solRoute.total_volume_m3 / fleetConfig.capacityVolumeM3) * 100
      ),
      totalWeightKg: solRoute.total_weight_kg,
      totalVolumeM3: solRoute.total_volume_m3,
      distanceKm: Math.round(routeDistance * 10) / 10,
      durationMinutes: Math.round(routeDuration),
      fuelConsumedLiters: Math.round(routeFuel * 10) / 10,
      co2EmittedKg: Math.round(routeCo2 * 10) / 10,
      fuelEfficiencyKmPerL: fleetConfig.fuelEfficiencyKmPerL,
      isFailed: solRoute.is_failed,
      failureTimeMinutes: solRoute.failure_time_minutes,
      routeGeometry: (solRoute as any).route_geometry,
      stops,
    });
  });

  // Handle unassigned orders
  const unassigned: Array<{ orderId: string; reason: string }> = [];
  solution.unassigned_stop_ids.forEach((stopId) => {
    const reason = solution.unassigned_reasons[stopId] || "CAPACITY_OR_TIME_WINDOW_MISSED";
    unassigned.push({ orderId: stopId, reason });
    const orderDef = plan.orders.find((o) => o.id === stopId);
    if (orderDef) {
      orderDef.status = "STUCKED";
      orderDef.assignedVehicleId = null;
    }
  });

  // If cancellation disruption, mark the order as CANCELED
  if (options?.disruption && options.disruption.incidentType === "CANCELLATION") {
    const cancelledId = options.disruption.from || options.disruption.locationName;
    plan.orders.forEach((o) => {
      if (cancelledId.includes(o.id) || cancelledId.includes(o.orderReference)) {
        o.status = "CANCELED";
        o.assignedVehicleId = null;
      }
    });
  }

  plan.status = "ACTIVE";
  plan.activeVersionNumber = (plan.activeVersionNumber || 1) + 1;
  plan.routes = routes;
  plan.unassignedOrders = unassigned;
  plan.totalDistanceKm = Math.round(totalDistanceKm * 10) / 10;
  plan.totalDurationMinutes = Math.round(totalDurationMinutes);
  plan.totalFuelLiters = Math.round(totalFuelLiters * 10) / 10;
  plan.totalCo2Kg = Math.round(totalCo2Kg * 10) / 10;
  plan.optimizedAt = new Date().toISOString();

  plansStore.set(planId, plan);
  return plan;
}

export const FLEET_ROUTE_PALETTE = [
  "#2563EB", // 1. Royal Blue
  "#16A34A", // 2. Emerald Green
  "#9333EA", // 3. Purple
  "#EA580C", // 4. Orange
  "#0891B2", // 5. Cyan
  "#DC2626", // 6. Red
  "#D97706", // 7. Amber
  "#4F46E5", // 8. Indigo
  "#059669", // 9. Teal
  "#C026D3", // 10. Fuchsia Pink
  "#0284C7", // 11. Sky Blue
  "#CA8A04", // 12. Mustard Yellow
];

export function getActivePlan(): StoredPlan {
  const allStoredPlans = Array.from(plansStore.values());
  if (allStoredPlans.length > 0) {
    return allStoredPlans[allStoredPlans.length - 1];
  }

  // Initialize baseline default Pune plan if none in memory yet
  const defaultPlanId = "PLAN-SF-2026-10-12";
  const defaultPlan = createPlan(defaultPlanId, "Morning Dispatch Schedule (Swargate Pune Hub)", DEFAULT_SEED_ORDERS);

  const depot = defaultPlan.depot;
  const o = defaultPlan.orders;

  const baselineRoutes: StoredRoute[] = [
    {
      vehicleId: "VH-001",
      vehicleCode: "TRK-01",
      vehicleName: "Truck Alpha (Tata Ultra 1918.T)",
      driverName: "Alex Vance",
      stopsCount: 4,
      weightUtilizationPercent: 74,
      volumeUtilizationPercent: 71,
      totalWeightKg: 1050,
      totalVolumeM3: 6.5,
      distanceKm: 34.2,
      durationMinutes: 145,
      fuelConsumedLiters: 6.6,
      co2EmittedKg: 17.7,
      fuelEfficiencyKmPerL: 5.2,
      stops: [
        {
          stopNumber: 1,
          type: "DEPOT_DEPARTURE",
          locationName: depot.name,
          lat: depot.lat,
          lng: depot.lng,
          eta: "08:00 AM",
          departure: "08:00 AM",
          waitingMinutes: 0,
          serviceMinutes: 0,
          cumulativeWeightKg: 0,
          cumulativeVolumeM3: 0,
          status: "COMPLETED",
        },
        {
          stopNumber: 2,
          type: "DELIVERY",
          orderId: o[0]?.id || "ORD-PN-101",
          orderRef: o[0]?.orderReference || "ORD-PN-101",
          locationName: o[0]?.customerName || "Cummins India Engine Hub",
          address: o[0]?.deliveryAddress || "Kothrud Industrial Area, Pune",
          lat: o[0]?.latitude || 18.5074,
          lng: o[0]?.longitude || 73.8077,
          eta: "08:45 AM",
          departure: "09:00 AM",
          waitingMinutes: 0,
          serviceMinutes: 15,
          cumulativeWeightKg: 420,
          cumulativeVolumeM3: 2.8,
          status: "DELIVERED",
        },
        {
          stopNumber: 3,
          type: "DELIVERY",
          orderId: o[1]?.id || "ORD-PN-102",
          orderRef: o[1]?.orderReference || "ORD-PN-102",
          locationName: o[1]?.customerName || "Deccan Gymkhana Retail Express",
          address: o[1]?.deliveryAddress || "FC Road, Deccan Gymkhana, Pune",
          lat: o[1]?.latitude || 18.5167,
          lng: o[1]?.longitude || 73.8415,
          eta: "09:25 AM",
          departure: "09:40 AM",
          waitingMinutes: 0,
          serviceMinutes: 15,
          cumulativeWeightKg: 700,
          cumulativeVolumeM3: 4.4,
          status: "IN_TRANSIT",
        },
        {
          stopNumber: 4,
          type: "DELIVERY",
          orderId: o[2]?.id || "ORD-PN-103",
          orderRef: o[2]?.orderReference || "ORD-PN-103",
          locationName: o[2]?.customerName || "Shivaji Nagar Metro Logistics",
          address: o[2]?.deliveryAddress || "Shivaji Nagar, Pune",
          lat: o[2]?.latitude || 18.5314,
          lng: o[2]?.longitude || 73.8446,
          eta: "10:10 AM",
          departure: "10:25 AM",
          waitingMinutes: 0,
          serviceMinutes: 15,
          cumulativeWeightKg: 1050,
          cumulativeVolumeM3: 6.5,
          status: "PENDING",
        },
      ],
    },
    {
      vehicleId: "VH-002",
      vehicleCode: "TRK-02",
      vehicleName: "Truck Beta (Tata Ace EV)",
      driverName: "Marcus Sterling",
      stopsCount: 3,
      weightUtilizationPercent: 82,
      volumeUtilizationPercent: 78,
      totalWeightKg: 960,
      totalVolumeM3: 6.1,
      distanceKm: 28.5,
      durationMinutes: 130,
      fuelConsumedLiters: 4.2,
      co2EmittedKg: 3.6,
      fuelEfficiencyKmPerL: 6.8,
      stops: [
        {
          stopNumber: 1,
          type: "DEPOT_DEPARTURE",
          locationName: depot.name,
          lat: depot.lat,
          lng: depot.lng,
          eta: "08:00 AM",
          departure: "08:00 AM",
          waitingMinutes: 0,
          serviceMinutes: 0,
          cumulativeWeightKg: 0,
          cumulativeVolumeM3: 0,
          status: "COMPLETED",
        },
        {
          stopNumber: 2,
          type: "DELIVERY",
          orderId: o[3]?.id || "ORD-PN-104",
          orderRef: o[3]?.orderReference || "ORD-PN-104",
          locationName: o[3]?.customerName || "Serum Institute Cargo Gate",
          address: o[3]?.deliveryAddress || "Solapur Road, Hadapsar, Pune",
          lat: o[3]?.latitude || 18.5089,
          lng: o[3]?.longitude || 73.9259,
          eta: "08:50 AM",
          departure: "09:10 AM",
          waitingMinutes: 0,
          serviceMinutes: 20,
          cumulativeWeightKg: 650,
          cumulativeVolumeM3: 4.2,
          status: "DELIVERED",
        },
        {
          stopNumber: 3,
          type: "DELIVERY",
          orderId: o[4]?.id || "ORD-PN-105",
          orderRef: o[4]?.orderReference || "ORD-PN-105",
          locationName: o[4]?.customerName || "Magarpatta Cybercity Tech Hub",
          address: o[4]?.deliveryAddress || "Magarpatta City, Hadapsar, Pune",
          lat: o[4]?.latitude || 18.5147,
          lng: o[4]?.longitude || 73.9298,
          eta: "09:30 AM",
          departure: "09:45 AM",
          waitingMinutes: 0,
          serviceMinutes: 15,
          cumulativeWeightKg: 960,
          cumulativeVolumeM3: 6.1,
          status: "IN_TRANSIT",
        },
      ],
    },
    {
      vehicleId: "VH-003",
      vehicleCode: "VAN-03",
      vehicleName: "Van Gamma (Ashok Leyland BADA DOST)",
      driverName: "Elena Rostova",
      stopsCount: 4,
      weightUtilizationPercent: 72,
      volumeUtilizationPercent: 68,
      totalWeightKg: 1030,
      totalVolumeM3: 6.6,
      distanceKm: 42.1,
      durationMinutes: 160,
      fuelConsumedLiters: 7.3,
      co2EmittedKg: 15.7,
      fuelEfficiencyKmPerL: 5.8,
      stops: [
        {
          stopNumber: 1,
          type: "DEPOT_DEPARTURE",
          locationName: depot.name,
          lat: depot.lat,
          lng: depot.lng,
          eta: "08:30 AM",
          departure: "08:30 AM",
          waitingMinutes: 0,
          serviceMinutes: 0,
          cumulativeWeightKg: 0,
          cumulativeVolumeM3: 0,
          status: "COMPLETED",
        },
        {
          stopNumber: 2,
          type: "DELIVERY",
          orderId: o[5]?.id || "ORD-PN-106",
          orderRef: o[5]?.orderReference || "ORD-PN-106",
          locationName: o[5]?.customerName || "EON Free Zone IT Deliveries",
          address: o[5]?.deliveryAddress || "Kharadi Knowledge Park, Pune",
          lat: o[5]?.latitude || 18.5515,
          lng: o[5]?.longitude || 73.9349,
          eta: "09:15 AM",
          departure: "09:35 AM",
          waitingMinutes: 0,
          serviceMinutes: 20,
          cumulativeWeightKg: 490,
          cumulativeVolumeM3: 3.0,
          status: "DELIVERED",
        },
        {
          stopNumber: 3,
          type: "DELIVERY",
          orderId: o[7]?.id || "ORD-PN-108",
          orderRef: o[7]?.orderReference || "ORD-PN-108",
          locationName: o[7]?.customerName || "Yerawada Commerzone Express",
          address: o[7]?.deliveryAddress || "Samrat Ashok Path, Yerawada, Pune",
          lat: o[7]?.latitude || 18.5529,
          lng: o[7]?.longitude || 73.8796,
          eta: "10:05 AM",
          departure: "10:20 AM",
          waitingMinutes: 0,
          serviceMinutes: 15,
          cumulativeWeightKg: 750,
          cumulativeVolumeM3: 4.7,
          status: "PENDING",
        },
        {
          stopNumber: 4,
          type: "DELIVERY",
          orderId: o[8]?.id || "ORD-PN-109",
          orderRef: o[8]?.orderReference || "ORD-PN-109",
          locationName: o[8]?.customerName || "Viman Nagar Air Cargo Hub",
          address: o[8]?.deliveryAddress || "Viman Nagar, Pune",
          lat: o[8]?.latitude || 18.5679,
          lng: o[8]?.longitude || 73.9143,
          eta: "10:45 AM",
          departure: "11:00 AM",
          waitingMinutes: 0,
          serviceMinutes: 15,
          cumulativeWeightKg: 1030,
          cumulativeVolumeM3: 6.6,
          status: "PENDING",
        },
      ],
    },
  ];

  defaultPlan.routes = baselineRoutes;
  defaultPlan.status = "ACTIVE";
  defaultPlan.totalDistanceKm = 104.8;
  defaultPlan.totalDurationMinutes = 435;
  defaultPlan.totalFuelLiters = 18.1;
  defaultPlan.totalCo2Kg = 37.0;
  plansStore.set(defaultPlanId, defaultPlan);
  return defaultPlan;
}

export function getPlan(planId: string): StoredPlan | null {
  if (planId === "latest" || planId === "active") {
    return getActivePlan();
  }
  return plansStore.get(planId) || null;
}
