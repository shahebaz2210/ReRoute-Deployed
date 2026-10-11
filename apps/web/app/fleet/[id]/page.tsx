"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { KPICard } from "@/components/ui/kpi-card";
import {
  Truck,
  MapPin,
  Fuel,
  Gauge,
  ArrowLeft,
  Clock,
  ShieldCheck,
  Leaf,
  DollarSign,
  TrendingUp,
  Activity,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Navigation,
} from "lucide-react";

interface StopDetail {
  seq: number;
  orderRef?: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  eta: string;
  waitingMinutes: number;
  serviceMinutes: number;
  departure: string;
  weightKg: number;
  volumeM3: number;
  status: "DELIVERED" | "IN_TRANSIT" | "STUCKED" | "PENDING";
}

interface VehicleFleetDetail {
  id: string;
  code: string;
  name: string;
  model: string;
  plate: string;
  driver: string;
  status: "ACTIVE_VEHICLE" | "DELAYED_ROUTE" | "IDLE" | "MAINTENANCE";
  currentLat: number;
  currentLng: number;
  locationName: string;
  heading: string;
  speedKmh: number;
  // Multi-objective metrics
  maxWeightKg: number;
  currentWeightKg: number;
  maxVolumeM3: number;
  currentVolumeM3: number;
  fuelType: string;
  fuelEfficiencyKmPerL: number;
  estFuelLiters: number;
  fuelCostUsd: number;
  fuelSavedPercent: number;
  estCo2Kg: number;
  co2SavedKg: number;
  totalDistanceKm: number;
  totalDurationMins: number;
  onTimeReliabilityPct: number;
  stops: StopDetail[];
}

const VEHICLE_DATA_STORE: Record<string, VehicleFleetDetail> = {
  "VH-001": {
    id: "VH-001",
    code: "TRK-01",
    name: "Truck Alpha",
    model: "Mercedes-Benz Sprinter 3500",
    plate: "SF-789-TX",
    driver: "Alex Vance",
    status: "ACTIVE_VEHICLE",
    currentLat: 37.7749,
    currentLng: -122.4194,
    locationName: "SOMA Arterial Corridor / 4th & Market St",
    heading: "North-East (45°)",
    speedKmh: 38,
    maxWeightKg: 1500,
    currentWeightKg: 1120,
    maxVolumeM3: 14.0,
    currentVolumeM3: 9.8,
    fuelType: "Ultra-Low Sulfur Diesel",
    fuelEfficiencyKmPerL: 5.4,
    estFuelLiters: 17.5,
    fuelCostUsd: 28.88,
    fuelSavedPercent: 18.2,
    estCo2Kg: 46.9,
    co2SavedKg: 11.2,
    totalDistanceKm: 94.5,
    totalDurationMins: 225,
    onTimeReliabilityPct: 100,
    stops: [
      {
        seq: 0,
        name: "Central Logistics Hub (DEPOT-SF-01)",
        address: "700 Pennsylvania Ave, San Francisco",
        lat: 37.7602,
        lng: -122.3925,
        eta: "08:00 AM",
        waitingMinutes: 0,
        serviceMinutes: 15,
        departure: "08:15 AM",
        weightKg: 0,
        volumeM3: 0,
        status: "DELIVERED",
      },
      {
        seq: 1,
        orderRef: "ORD-1001",
        name: "Astra Tech Labs",
        address: "185 Berry St, Suite 400, SF",
        lat: 37.7765,
        lng: -122.3934,
        eta: "08:35 AM",
        waitingMinutes: 0,
        serviceMinutes: 10,
        departure: "08:45 AM",
        weightKg: 240,
        volumeM3: 1.2,
        status: "DELIVERED",
      },
      {
        seq: 2,
        orderRef: "ORD-1002",
        name: "BioGen Research",
        address: "45 Medical Sciences Park, SF",
        lat: 37.7850,
        lng: -122.4050,
        eta: "09:10 AM",
        waitingMinutes: 0,
        serviceMinutes: 15,
        departure: "09:25 AM",
        weightKg: 450,
        volumeM3: 2.5,
        status: "IN_TRANSIT",
      },
      {
        seq: 3,
        orderRef: "ORD-1005",
        name: "St. Jude Hospital Supply",
        address: "14 Healthcare Ave, Medical District",
        lat: 37.7645,
        lng: -122.4410,
        eta: "10:15 AM",
        waitingMinutes: 5,
        serviceMinutes: 20,
        departure: "10:40 AM",
        weightKg: 430,
        volumeM3: 6.1,
        status: "PENDING",
      },
      {
        seq: 4,
        name: "Central Logistics Hub (DEPOT Return)",
        address: "700 Pennsylvania Ave, San Francisco",
        lat: 37.7602,
        lng: -122.3925,
        eta: "11:45 AM",
        waitingMinutes: 0,
        serviceMinutes: 10,
        departure: "11:55 AM",
        weightKg: 0,
        volumeM3: 0,
        status: "PENDING",
      },
    ],
  },
  "VH-002": {
    id: "VH-002",
    code: "TRK-02",
    name: "Truck Beta",
    model: "Ford E-Transit Electric High-Roof",
    plate: "SF-104-EQ",
    driver: "Marcus Sterling",
    status: "DELAYED_ROUTE",
    currentLat: 37.785,
    currentLng: -122.405,
    locationName: "Industrial Bypass / Node 3 ➔ Node 7 (Road Detour)",
    heading: "West (270°)",
    speedKmh: 14,
    maxWeightKg: 1200,
    currentWeightKg: 1050,
    maxVolumeM3: 11.5,
    currentVolumeM3: 10.1,
    fuelType: "Battery Electric (89 kWh)",
    fuelEfficiencyKmPerL: 6.8, // Electric equiv km/L
    estFuelLiters: 12.1,
    fuelCostUsd: 14.50,
    fuelSavedPercent: 24.5,
    estCo2Kg: 16.4,
    co2SavedKg: 28.5,
    totalDistanceKm: 82.0,
    totalDurationMins: 265,
    onTimeReliabilityPct: 92,
    stops: [
      {
        seq: 0,
        name: "Central Logistics Hub (DEPOT-SF-01)",
        address: "700 Pennsylvania Ave, San Francisco",
        lat: 37.7602,
        lng: -122.3925,
        eta: "08:15 AM",
        waitingMinutes: 0,
        serviceMinutes: 15,
        departure: "08:30 AM",
        weightKg: 0,
        volumeM3: 0,
        status: "DELIVERED",
      },
      {
        seq: 1,
        orderRef: "ORD-1003",
        name: "Apex Logistics Depot",
        address: "88 Cargo Terminal Road, Bayview",
        lat: 37.7345,
        lng: -122.385,
        eta: "09:40 AM (+25m)",
        waitingMinutes: 0,
        serviceMinutes: 25,
        departure: "10:05 AM",
        weightKg: 1050,
        volumeM3: 10.1,
        status: "STUCKED",
      },
      {
        seq: 2,
        name: "Central Logistics Hub (DEPOT Return)",
        address: "700 Pennsylvania Ave, San Francisco",
        lat: 37.7602,
        lng: -122.3925,
        eta: "11:15 AM",
        waitingMinutes: 0,
        serviceMinutes: 10,
        departure: "11:25 AM",
        weightKg: 0,
        volumeM3: 0,
        status: "PENDING",
      },
    ],
  },
  "VH-003": {
    id: "VH-003",
    code: "VAN-03",
    name: "Van Gamma",
    model: "Ram ProMaster 2500 Cargo",
    plate: "SF-552-KL",
    driver: "Elena Rostova",
    status: "ACTIVE_VEHICLE",
    currentLat: 37.76,
    currentLng: -122.42,
    locationName: "Mission Commercial Arterial / 16th St",
    heading: "South (180°)",
    speedKmh: 42,
    maxWeightKg: 1800,
    currentWeightKg: 780,
    maxVolumeM3: 13.0,
    currentVolumeM3: 5.4,
    fuelType: "Clean Flex-Fuel EcoDiesel",
    fuelEfficiencyKmPerL: 5.8,
    estFuelLiters: 13.8,
    fuelCostUsd: 22.75,
    fuelSavedPercent: 15.6,
    estCo2Kg: 36.9,
    co2SavedKg: 9.8,
    totalDistanceKm: 78.4,
    totalDurationMins: 185,
    onTimeReliabilityPct: 100,
    stops: [
      {
        seq: 0,
        name: "Central Logistics Hub (DEPOT-SF-01)",
        address: "700 Pennsylvania Ave, San Francisco",
        lat: 37.7602,
        lng: -122.3925,
        eta: "08:30 AM",
        waitingMinutes: 0,
        serviceMinutes: 15,
        departure: "08:45 AM",
        weightKg: 0,
        volumeM3: 0,
        status: "DELIVERED",
      },
      {
        seq: 1,
        orderRef: "ORD-1004",
        name: "Vortex Quantum Hub",
        address: "101 Silicon Quay, Financial Hub",
        lat: 37.792,
        lng: -122.398,
        eta: "09:15 AM",
        waitingMinutes: 0,
        serviceMinutes: 15,
        departure: "09:30 AM",
        weightKg: 380,
        volumeM3: 1.9,
        status: "IN_TRANSIT",
      },
      {
        seq: 2,
        name: "Central Logistics Hub (DEPOT Return)",
        address: "700 Pennsylvania Ave, San Francisco",
        lat: 37.7602,
        lng: -122.3925,
        eta: "10:45 AM",
        waitingMinutes: 0,
        serviceMinutes: 10,
        departure: "10:55 AM",
        weightKg: 0,
        volumeM3: 0,
        status: "PENDING",
      },
    ],
  },
};

function VehicleDetailContent() {
  const params = useParams();
  const rawId = (params?.id as string) || "VH-001";

  // Resolve matching base vehicle
  const vehicleKey =
    Object.keys(VEHICLE_DATA_STORE).find(
      (k) =>
        k.toLowerCase() === rawId.toLowerCase() ||
        VEHICLE_DATA_STORE[k].code.toLowerCase() === rawId.toLowerCase() ||
        rawId.includes(k) ||
        rawId.includes(VEHICLE_DATA_STORE[k].code)
    ) || "VH-001";

  const defaultVehicle = VEHICLE_DATA_STORE[vehicleKey];
  const [vehicle, setVehicle] = useState<VehicleFleetDetail>(defaultVehicle);

  useEffect(() => {
    // Attempt to enrich with active plan's real optimized routes and stops
    fetch("/api/v1/plans")
      .then((res) => res.json())
      .then(async (json) => {
        if (json.data && json.data.length > 0) {
          const latestPlanSummary = json.data[0];
          const planRes = await fetch(`/api/v1/plans/${latestPlanSummary.id}`);
          const planJson = await planRes.json();
          const activePlan = planJson.data;

          if (activePlan && activePlan.routes) {
            const matchingRoute = activePlan.routes.find(
              (r: any) =>
                r.vehicleId?.toLowerCase() === rawId.toLowerCase() ||
                r.vehicleCode?.toLowerCase() === rawId.toLowerCase() ||
                r.vehicleId?.toLowerCase() === defaultVehicle.id.toLowerCase() ||
                r.vehicleCode?.toLowerCase() === defaultVehicle.code.toLowerCase()
            );

            if (matchingRoute && matchingRoute.stops && matchingRoute.stops.length > 0) {
              const liveStops: StopDetail[] = matchingRoute.stops.map((st: any, idx: number) => ({
                seq: idx,
                orderRef: st.orderRef,
                name: st.locationName,
                address: st.address || (st.type === "DEPOT_DEPARTURE" ? "DispatchX Logistics Hub, Central Depot" : `${st.lat?.toFixed(4)}, ${st.lng?.toFixed(4)}`),
                lat: st.lat,
                lng: st.lng,
                eta: st.eta,
                waitingMinutes: st.waitingMinutes || 0,
                serviceMinutes: st.serviceMinutes || 15,
                departure: st.departure || st.eta,
                weightKg: st.cumulativeWeightKg || 0,
                volumeM3: st.cumulativeVolumeM3 || 0,
                status: st.status === "COMPLETED" ? "DELIVERED" : st.status,
              }));

              const firstActive = liveStops.find((s) => s.status === "IN_TRANSIT" || s.status === "STUCKED") || liveStops[0];

              setVehicle((prev) => ({
                ...prev,
                currentWeightKg: matchingRoute.totalWeightKg,
                currentVolumeM3: matchingRoute.totalVolumeM3,
                totalDistanceKm: matchingRoute.distanceKm,
                totalDurationMins: matchingRoute.durationMinutes,
                estFuelLiters: matchingRoute.fuelConsumedLiters,
                estCo2Kg: matchingRoute.co2EmittedKg,
                fuelCostUsd: Math.round(matchingRoute.fuelConsumedLiters * 1.65 * 100) / 100,
                currentLat: firstActive.lat,
                currentLng: firstActive.lng,
                locationName: firstActive.name,
                status: matchingRoute.isFailed
                  ? "MAINTENANCE"
                  : liveStops.some((s) => s.status === "STUCKED")
                  ? "DELAYED_ROUTE"
                  : "ACTIVE_VEHICLE",
                stops: liveStops,
              }));
            }
          }
        }
      })
      .catch((err) => console.warn("Using offline vehicle data store:", err));
  }, [rawId, defaultVehicle]);

  const weightPct = Math.round((vehicle.currentWeightKg / vehicle.maxWeightKg) * 100);
  const volumePct = Math.round((vehicle.currentVolumeM3 / vehicle.maxVolumeM3) * 100);

  return (
    <AppShell>
      <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-12">
        {/* Navigation Breadcrumb */}
        <Breadcrumb
          items={[
            { label: "Dashboard", href: "/" },
            { label: "Fleet Overview", href: "/fleet" },
            { label: `${vehicle.code} (${vehicle.name})`, isCurrent: true },
          ]}
        />

        {/* Vehicle Header & Telemetry Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] shadow-2xs">
          <div className="flex items-center gap-4">
            <Link href="/fleet">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
              <Truck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
                  {vehicle.name} <span className="font-mono text-primary">({vehicle.code})</span>
                </h1>
                <StatusBadge status={vehicle.status} size="sm" />
              </div>
              <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                {vehicle.model} • License Plate: <strong className="font-mono text-[var(--foreground)]">{vehicle.plate}</strong> • Driver: <strong className="text-[var(--foreground)]">{vehicle.driver}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] text-xs">
              <Radio className="h-4 w-4 text-emerald-500 animate-pulse" />
              <div>
                <div className="text-[10px] text-[var(--muted-foreground)] font-semibold uppercase">Telemetry Stream</div>
                <div className="font-mono font-bold text-[var(--foreground)]">Speed: {vehicle.speedKmh} km/h • {vehicle.heading}</div>
              </div>
            </div>

            <Link href="/plans/PLAN-SF-2026-10-12/compare">
              <Button variant="outline" size="sm" leftIcon={<TrendingUp className="h-3.5 w-3.5" />}>
                Re-optimization Diff
              </Button>
            </Link>
          </div>
        </div>

        {/* Live GPS Location Banner */}
        <div className="p-4 rounded-xl border border-blue-200/70 bg-blue-50/60 dark:border-blue-900/60 dark:bg-blue-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-600 text-white shrink-0">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-blue-900 dark:text-blue-200 flex items-center gap-2">
                <span>Active Vehicle GPS Location</span>
                <span className="font-mono text-[11px] px-2 py-0.2 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 font-semibold">
                  {vehicle.currentLat.toFixed(4)}° N, {Math.abs(vehicle.currentLng).toFixed(4)}° W
                </span>
              </div>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5 font-medium">
                {vehicle.locationName}
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[11px] text-blue-700 dark:text-blue-400 font-mono">
              Engine: Online • GPS Fix: High Precision
            </span>
          </div>
        </div>

        {/* Multi-Objective Function KPI Dashboard */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--foreground)] flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              Multi-Objective Function Performance (DispatchX Engine)
            </h2>
            <span className="text-xs text-[var(--muted-foreground)]">
              Multi-dimensional joint objective: Distance, Time, Fuel, CO₂, Utilization & Reliability
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Load Utilization */}
            <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] flex flex-col justify-between shadow-2xs gap-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs font-semibold text-[var(--muted-foreground)] uppercase">Load Utilization</div>
                  <div className="text-2xl font-bold font-mono text-[var(--foreground)] mt-1">{weightPct}%</div>
                </div>
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Truck className="h-5 w-5" />
                </div>
              </div>
              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex justify-between text-[11px]">
                  <span className="text-[var(--muted-foreground)]">Weight:</span>
                  <span className="font-bold text-[var(--foreground)]">{vehicle.currentWeightKg} / {vehicle.maxWeightKg} kg</span>
                </div>
                <div className="h-1.5 w-full bg-[var(--surface-secondary)] rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${weightPct}%` }} />
                </div>
                <div className="flex justify-between text-[11px] pt-1">
                  <span className="text-[var(--muted-foreground)]">Volume:</span>
                  <span className="font-bold text-[var(--foreground)]">{vehicle.currentVolumeM3} / {vehicle.maxVolumeM3} m³ ({volumePct}%)</span>
                </div>
              </div>
            </div>

            {/* 2. Fuel Efficiency */}
            <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] flex flex-col justify-between shadow-2xs gap-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs font-semibold text-[var(--muted-foreground)] uppercase">Fuel Efficiency</div>
                  <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                    {vehicle.fuelEfficiencyKmPerL} <span className="text-xs font-normal">km/L</span>
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Fuel className="h-5 w-5" />
                </div>
              </div>
              <div className="text-xs space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-[var(--muted-foreground)]">Trip Consumption:</span>
                  <span className="font-mono font-bold text-[var(--foreground)]">{vehicle.estFuelLiters} L</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-[var(--muted-foreground)]">Fuel Economy Gain:</span>
                  <span className="font-mono font-bold text-emerald-600">+{vehicle.fuelSavedPercent}% saved</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-[var(--muted-foreground)]">Est. Fuel Cost:</span>
                  <span className="font-mono font-bold text-[var(--foreground)]">${vehicle.fuelCostUsd}</span>
                </div>
              </div>
            </div>

            {/* 3. CO2 Optimization */}
            <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] flex flex-col justify-between shadow-2xs gap-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs font-semibold text-[var(--muted-foreground)] uppercase">CO₂ Optimization</div>
                  <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                    {vehicle.estCo2Kg} <span className="text-xs font-normal">kg</span>
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Leaf className="h-5 w-5" />
                </div>
              </div>
              <div className="text-xs space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-[var(--muted-foreground)]">Avoided Emissions:</span>
                  <span className="font-mono font-bold text-emerald-600">-{vehicle.co2SavedKg} kg CO₂</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-[var(--muted-foreground)]">Power Source:</span>
                  <span className="text-[10px] font-bold text-[var(--foreground)] truncate max-w-[130px]">{vehicle.fuelType}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-[var(--muted-foreground)]">Fleet Green Score:</span>
                  <span className="font-mono font-bold text-emerald-600">94 / 100</span>
                </div>
              </div>
            </div>

            {/* 4. Distance & Reliability */}
            <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] flex flex-col justify-between shadow-2xs gap-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs font-semibold text-[var(--muted-foreground)] uppercase">Distance & SLA</div>
                  <div className="text-2xl font-bold font-mono text-[var(--foreground)] mt-1">
                    {vehicle.totalDistanceKm} <span className="text-xs font-normal">km</span>
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Clock className="h-5 w-5" />
                </div>
              </div>
              <div className="text-xs space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-[var(--muted-foreground)]">Total Duration:</span>
                  <span className="font-mono font-bold text-[var(--foreground)]">{Math.floor(vehicle.totalDurationMins / 60)}h {vehicle.totalDurationMins % 60}m</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-[var(--muted-foreground)]">Time-Window SLA:</span>
                  <span className="font-mono font-bold text-emerald-600">{vehicle.onTimeReliabilityPct}% compliant</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-[var(--muted-foreground)]">Hard Constraints:</span>
                  <span className="font-mono font-bold text-emerald-600">0 Violations</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Active Optimized Route Stops */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-5 flex flex-col gap-4 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[var(--border-subtle)] pb-3">
            <div>
              <h3 className="text-base font-bold text-[var(--foreground)]">
                Active Optimized Route Sequence & Stops
              </h3>
              <p className="text-xs text-[var(--muted-foreground)]">
                OR-Tools VRPTW sequenced stops with arrival times, window wait buffers, service time, and cumulative cargo.
              </p>
            </div>
            <span className="font-mono text-xs text-[var(--primary)] font-semibold bg-[var(--primary)]/10 px-2.5 py-1 rounded-md">
              {vehicle.stops.length} Sequenced Stops
            </span>
          </div>

          <div className="space-y-3">
            {vehicle.stops.map((stop) => (
              <div
                key={stop.seq}
                className={`flex flex-col md:flex-row md:items-center justify-between p-3.5 rounded-xl border text-xs gap-3 transition-all ${
                  stop.status === "IN_TRANSIT"
                    ? "border-blue-400 bg-blue-50/50 dark:bg-blue-950/20"
                    : stop.status === "STUCKED"
                    ? "border-amber-400 bg-amber-50/50 dark:bg-amber-950/20"
                    : "border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-secondary)]"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`h-7 w-7 rounded-lg font-mono font-bold flex items-center justify-center shrink-0 ${
                      stop.seq === 0
                        ? "bg-slate-700 text-white"
                        : stop.status === "DELIVERED"
                        ? "bg-emerald-600 text-white"
                        : stop.status === "IN_TRANSIT"
                        ? "bg-blue-600 text-white animate-pulse"
                        : stop.status === "STUCKED"
                        ? "bg-amber-600 text-white"
                        : "bg-[var(--surface-secondary)] text-[var(--muted-foreground)]"
                    }`}
                  >
                    #{stop.seq}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[var(--foreground)]">{stop.name}</span>
                      {stop.orderRef && (
                        <span className="font-mono font-bold text-xs text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                          {stop.orderRef}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-[var(--muted-foreground)] mt-0.5 flex items-center gap-1">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span>{stop.address}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 flex-wrap self-end md:self-center font-mono text-[11px]">
                  {stop.weightKg > 0 && (
                    <div className="text-[var(--muted-foreground)]">
                      Payload: <strong className="text-[var(--foreground)]">{stop.weightKg} kg</strong> ({stop.volumeM3} m³)
                    </div>
                  )}

                  <div className="text-right">
                    <div className="text-[var(--foreground)] font-semibold">ETA: {stop.eta}</div>
                    <div className="text-[10px] text-[var(--muted-foreground)]">
                      Depart: {stop.departure} {stop.waitingMinutes > 0 && `(Wait ${stop.waitingMinutes}m)`}
                    </div>
                  </div>

                  <StatusBadge status={stop.status} size="sm" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

export default function VehicleDetailPage() {
  return (
    <Suspense fallback={<div className="p-8 text-xs text-[var(--muted-foreground)]">Loading vehicle details...</div>}>
      <VehicleDetailContent />
    </Suspense>
  );
}
