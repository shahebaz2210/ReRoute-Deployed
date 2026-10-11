"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/shell/app-shell";
import { KPICard } from "@/components/ui/kpi-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { DataTable, Column } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import {
  Truck,
  Package,
  Clock,
  AlertTriangle,
  RotateCw,
  FileSpreadsheet,
  Calendar,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  X,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import { HandsFreeDisruptionModal } from "@/components/disruptions/hands-free-disruption-modal";
import { FleetMap, GeoMarker, GeoRoute } from "@/components/map/fleet-map";

interface FleetVehicle {
  id: string;
  name: string;
  licensePlate: string;
  driverName: string;
  status: string;
  capacityWeightKg: number;
  capacityVolumeM3: number;
  currentWeightKg: number;
  currentVolumeM3: number;
  nextStop: string;
  eta: string;
  remainingStops: number;
}

export default function ControlRoomPage() {
  // 1. Date Selector State (Category 3)
  const [selectedDate, setSelectedDate] = useState("2026-10-12");
  const [isReplanning, setIsReplanning] = useState(false);
  const [replanSuccess, setReplanSuccess] = useState(false);

  // Selected vehicle for details drawer (Category 2 & 4)
  const [selectedVehicle, setSelectedVehicle] = useState<FleetVehicle | null>(null);

  // Disruption Detected Voice Reporter Modal (Feature 1: Hands-Free Voice Ingestion)
  const [showDisruptionModal, setShowDisruptionModal] = useState(false);

  // Dynamic fleet state (Pune, Maharashtra Network)
  const [fleet, setFleet] = useState<FleetVehicle[]>([
    {
      id: "VH-001",
      name: "Truck Alpha (Tata Ultra 1918.T)",
      licensePlate: "MH-12-TRK-01",
      driverName: "Alex Vance",
      status: "ACTIVE_VEHICLE",
      capacityWeightKg: 2500,
      capacityVolumeM3: 18.0,
      currentWeightKg: 2120,
      currentVolumeM3: 14.8,
      nextStop: "Kothrud Industrial Park (#1)",
      eta: "08:45 AM",
      remainingStops: 3,
    },
    {
      id: "VH-002",
      name: "Truck Beta (Tata Ace EV)",
      licensePlate: "MH-12-TRK-02",
      driverName: "Marcus Sterling",
      status: "ACTIVE_VEHICLE",
      capacityWeightKg: 1200,
      capacityVolumeM3: 10.5,
      currentWeightKg: 1050,
      currentVolumeM3: 9.1,
      nextStop: "Magarpatta Cybercity (#2)",
      eta: "09:20 AM",
      remainingStops: 4,
    },
    {
      id: "VH-003",
      name: "Van Gamma (Ashok Leyland BADA DOST)",
      licensePlate: "MH-12-VAN-03",
      driverName: "Elena Rostova",
      status: "ACTIVE_VEHICLE",
      capacityWeightKg: 1800,
      capacityVolumeM3: 14.0,
      currentWeightKg: 780,
      currentVolumeM3: 6.4,
      nextStop: "Viman Nagar Distribution Hub (#3)",
      eta: "09:15 AM",
      remainingStops: 2,
    },
    {
      id: "VH-004",
      name: "Truck Delta (Eicher Pro 3015)",
      licensePlate: "MH-12-TRK-04",
      driverName: "David Kim",
      status: "IDLE",
      capacityWeightKg: 2800,
      capacityVolumeM3: 19.0,
      currentWeightKg: 0,
      currentVolumeM3: 0,
      nextStop: "Swargate Central Depot (Standby)",
      eta: "On Standby",
      remainingStops: 0,
    },
  ]);

  // Central Depot: Swargate Multimodal Hub & Depot Center, Pune (18.5018° N, 73.8586° E)
  const PUNE_DEPOT = {
    id: "DEPOT-PUNE-SWARGATE",
    name: "Swargate Central Logistics Hub, Pune",
    lat: 18.5018,
    lng: 73.8586,
  };

  const dashboardGeoMarkers: GeoMarker[] = [
    // Central Depot in Swargate, Pune
    {
      id: "M-DEPOT",
      type: "DEPOT",
      lat: PUNE_DEPOT.lat,
      lng: PUNE_DEPOT.lng,
      label: "Swargate Central Depot (Pune)",
      sublabel: "Dispatcher Workplace (18.5018° N, 73.8586° E)",
      status: "COMPLETED",
      stopNumber: 0,
    },
    // Vehicle 1 Stops (Blue: #2563EB matching route color)
    {
      id: "STOP-PN-1",
      type: "STOP",
      lat: 18.5074,
      lng: 73.8077,
      label: "Kothrud Industrial Park",
      sublabel: "Order ORD-PN-101 (Cummins India Hub)",
      orderRef: "ORD-PN-101",
      color: "#2563EB",
      stopNumber: 1,
      status: "DELIVERED",
    },
    {
      id: "STOP-PN-2",
      type: "STOP",
      lat: 18.5167,
      lng: 73.8415,
      label: "Deccan Gymkhana Commercial Center",
      sublabel: "Order ORD-PN-102 (Retail Express)",
      orderRef: "ORD-PN-102",
      color: "#2563EB",
      stopNumber: 2,
      status: "PENDING",
    },
    {
      id: "STOP-PN-3",
      type: "STOP",
      lat: 18.5314,
      lng: 73.8446,
      label: "Shivaji Nagar Tech Hub",
      sublabel: "Order ORD-PN-103 (Metro Logistics)",
      orderRef: "ORD-PN-103",
      color: "#2563EB",
      stopNumber: 3,
      status: "PENDING",
    },
    // Vehicle 1 Live Pin (Blue: #2563EB matching route color)
    {
      id: "V-TRK-01",
      type: "VEHICLE",
      lat: 18.5120,
      lng: 73.8240,
      label: "Truck Alpha (MH-12-TRK-01)",
      vehicleCode: "TRK-01",
      color: "#2563EB",
      status: "ACTIVE_VEHICLE",
    },

    // Vehicle 2 Stops (Emerald Green: #10B981 matching route color)
    {
      id: "STOP-PN-4",
      type: "STOP",
      lat: 18.5089,
      lng: 73.9259,
      label: "Hadapsar Industrial Complex",
      sublabel: "Order ORD-PN-104 (Serum Institute Cargo)",
      orderRef: "ORD-PN-104",
      color: "#10B981",
      stopNumber: 1,
      status: "DELIVERED",
    },
    {
      id: "STOP-PN-5",
      type: "STOP",
      lat: 18.5147,
      lng: 73.9298,
      label: "Magarpatta Cybercity",
      sublabel: "Order ORD-PN-105 (Accenture Tech Hub)",
      orderRef: "ORD-PN-105",
      color: "#10B981",
      stopNumber: 2,
      status: "PENDING",
    },
    {
      id: "STOP-PN-6",
      type: "STOP",
      lat: 18.5515,
      lng: 73.9349,
      label: "Kharadi EON Free Zone",
      sublabel: "Order ORD-PN-106 (Global Infotech)",
      orderRef: "ORD-PN-106",
      color: "#10B981",
      stopNumber: 3,
      status: "PENDING",
    },
    // Vehicle 2 Live Pin (Green: #10B981 matching route color)
    {
      id: "V-TRK-02",
      type: "VEHICLE",
      lat: 18.5110,
      lng: 73.9270,
      label: "Truck Beta (MH-12-TRK-02)",
      vehicleCode: "TRK-02",
      color: "#10B981",
      status: "ACTIVE_VEHICLE",
    },

    // Vehicle 3 Stops (Purple: #8B5CF6 matching route color)
    {
      id: "STOP-PN-7",
      type: "STOP",
      lat: 18.5284,
      lng: 73.8739,
      label: "Pune Railway Freight Yard",
      sublabel: "Order ORD-PN-107 (Central Rail Cargo)",
      orderRef: "ORD-PN-107",
      color: "#8B5CF6",
      stopNumber: 1,
      status: "DELIVERED",
    },
    {
      id: "STOP-PN-8",
      type: "STOP",
      lat: 18.5529,
      lng: 73.8796,
      label: "Yerawada Business Bay",
      sublabel: "Order ORD-PN-108 (Commerzone IT)",
      orderRef: "ORD-PN-108",
      color: "#8B5CF6",
      stopNumber: 2,
      status: "PENDING",
    },
    {
      id: "STOP-PN-9",
      type: "STOP",
      lat: 18.5679,
      lng: 73.9143,
      label: "Viman Nagar Distribution Hub",
      sublabel: "Order ORD-PN-109 (Airport Logistics)",
      orderRef: "ORD-PN-109",
      color: "#8B5CF6",
      stopNumber: 3,
      status: "PENDING",
    },
    // Vehicle 3 Live Pin (Purple: #8B5CF6 matching route color)
    {
      id: "V-VAN-03",
      type: "VEHICLE",
      lat: 18.5400,
      lng: 73.8760,
      label: "Van Gamma (MH-12-VAN-03)",
      vehicleCode: "VAN-03",
      color: "#8B5CF6",
      status: "ACTIVE_VEHICLE",
    },
  ];

  const dashboardGeoRoutes: GeoRoute[] = [
    {
      id: "R-TRK-01",
      vehicleCode: "TRK-01",
      driverName: "Alex Vance",
      color: "#2563EB",
      coordinates: [
        [PUNE_DEPOT.lat, PUNE_DEPOT.lng],
        [18.5074, 73.8077],
        [18.5167, 73.8415],
        [18.5314, 73.8446],
        [PUNE_DEPOT.lat, PUNE_DEPOT.lng],
      ],
      distanceKm: 28.4,
      stopsCount: 3,
    },
    {
      id: "R-TRK-02",
      vehicleCode: "TRK-02",
      driverName: "Marcus Sterling",
      color: "#10B981",
      coordinates: [
        [PUNE_DEPOT.lat, PUNE_DEPOT.lng],
        [18.5089, 73.9259],
        [18.5147, 73.9298],
        [18.5515, 73.9349],
        [PUNE_DEPOT.lat, PUNE_DEPOT.lng],
      ],
      distanceKm: 34.2,
      stopsCount: 3,
    },
    {
      id: "R-VAN-03",
      vehicleCode: "VAN-03",
      driverName: "Elena Rostova",
      color: "#8B5CF6",
      coordinates: [
        [PUNE_DEPOT.lat, PUNE_DEPOT.lng],
        [18.5284, 73.8739],
        [18.5529, 73.8796],
        [18.5679, 73.9143],
        [PUNE_DEPOT.lat, PUNE_DEPOT.lng],
      ],
      distanceKm: 31.6,
      stopsCount: 3,
    },
  ];

  // Load real backend fleet on mount if available
  useEffect(() => {
    fetch("/api/v1/fleet")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.vehicles && data.vehicles.length > 0) {
          setFleet(
            data.vehicles.map((v: any, i: number) => ({
              id: v.id,
              name: `${v.model || "Vehicle"} (${v.licensePlate || v.id})`,
              licensePlate: v.licensePlate || v.id,
              driverName: v.driverName || "Driver " + (i + 1),
              status: v.status === "ACTIVE" ? "ACTIVE_VEHICLE" : v.status,
              capacityWeightKg: v.capacityWeightKg || 1500,
              capacityVolumeM3: v.capacityVolumeM3 || 12.0,
              currentWeightKg: Math.round((v.capacityWeightKg || 1500) * 0.65),
              currentVolumeM3: Math.round((v.capacityVolumeM3 || 12.0) * 0.7 * 10) / 10,
              nextStop: i === 0 ? "Apex BioLabs (#2)" : i === 1 ? "Marina Grocers (#3)" : "Central Hub",
              eta: i === 1 ? "09:55 AM (+25m)" : "08:45 AM",
              remainingStops: i === 3 ? 0 : 3,
            }))
          );
        }
      })
      .catch(() => {});
  }, []);

  // Date controls (Category 3)
  const adjustDate = (days: number) => {
    const cur = new Date(selectedDate);
    cur.setDate(cur.getDate() + days);
    setSelectedDate(cur.toISOString().split("T")[0]);
  };

  // Re-optimization Trigger (Category 6)
  const handleReoptimize = async () => {
    setIsReplanning(true);
    try {
      const res = await fetch("/api/v1/plans/PLAN-SF-2026-10-12/optimize", { method: "POST" });
      await res.json();
      setReplanSuccess(true);
      setTimeout(() => setReplanSuccess(false), 4000);
    } catch {
      // Graceful fallback
    } finally {
      setIsReplanning(false);
    }
  };

  const fleetColumns: Column<FleetVehicle>[] = [
    {
      key: "id",
      header: "Vehicle ID",
      sortable: true,
      render: (row) => {
        const vehicleColor =
          row.id === "VH-001" ? "#2563EB" :
          row.id === "VH-002" ? "#10B981" :
          row.id === "VH-003" ? "#8B5CF6" : "#F59E0B";

        return (
          <div className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full shrink-0 shadow-2xs border border-white"
              style={{ backgroundColor: vehicleColor }}
              title={`Matching route color: ${vehicleColor}`}
            />
            <button
              onClick={() => setSelectedVehicle(row)}
              className="font-mono font-bold hover:underline text-left text-xs"
              style={{ color: vehicleColor }}
            >
              {row.id}
            </button>
          </div>
        );
      },
    },
    {
      key: "name",
      header: "Vehicle & Driver",
      render: (row) => {
        const vehicleColor =
          row.id === "VH-001" || row.licensePlate?.includes("TRK-01") || row.name?.includes("TRK-01") || row.name?.includes("Alpha")
            ? "#2563EB"
            : row.id === "VH-002" || row.licensePlate?.includes("TRK-02") || row.name?.includes("TRK-02") || row.name?.includes("Beta")
            ? "#10B981"
            : row.id === "VH-003" || row.licensePlate?.includes("VAN-03") || row.name?.includes("VAN-03") || row.name?.includes("Gamma")
            ? "#8B5CF6"
            : "#F59E0B";

        return (
          <div className="flex items-start gap-2.5">
            <div
              className="p-1.5 rounded-lg text-white shrink-0 mt-0.5 shadow-2xs"
              style={{ backgroundColor: vehicleColor }}
            >
              <Truck className="h-3.5 w-3.5" />
            </div>
            <div>
              <div className="font-semibold text-foreground text-xs">{row.name}</div>
              <div className="text-[11px] text-muted">
                Driver: <span className="font-medium text-foreground">{row.driverName}</span> • Plate:{" "}
                <span className="font-mono font-bold text-foreground">{row.licensePlate}</span>
              </div>
            </div>
          </div>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge status={row.status} size="sm" />,
    },
    {
      key: "capacityWeightKg",
      header: "Load Utilization",
      render: (row) => {
        const pct = Math.round((row.currentWeightKg / row.capacityWeightKg) * 100);
        return (
          <div className="w-36">
            <div className="flex justify-between text-[11px] font-mono mb-1">
              <span>{row.currentWeightKg} / {row.capacityWeightKg} kg</span>
              <span className="font-bold">{pct}%</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full ${pct > 85 ? "bg-amber-500" : "bg-primary"}`}
                style={{ width: `${Math.min(pct, 100)}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      key: "nextStop",
      header: "Next Stop / Sequence",
      render: (row) => (
        <div>
          <div className="text-xs font-medium text-foreground">{row.nextStop}</div>
          <div className="text-[11px] text-muted">{row.remainingStops} stops remaining</div>
        </div>
      ),
    },
    {
      key: "eta",
      header: "Estimated Arrival",
      align: "right",
      render: (row) => (
        <span className={`font-mono text-xs font-bold ${row.eta.includes("+") ? "text-amber-600" : "text-foreground"}`}>
          {row.eta}
        </span>
      ),
    },
  ];

  return (
    <AppShell>
      <div className="flex flex-col gap-6 max-w-7xl mx-auto">
        {/* Header Action Bar with Date Selector (Category 1 & 3) */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-border">
          <div>
            <div className="text-xs font-semibold text-muted tracking-wider uppercase mb-1">
              Control Room Cockpit • Real-Time Operations
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Fleet Operations & Schedule Tracking
            </h1>
            <p className="text-xs text-muted mt-0.5">
              Autonomous human-in-the-loop dynamic logistics dispatching and disruption recovery.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* 1. Create new route plan */}
            <Link href="/plans/new">
              <Button
                variant="primary"
                size="sm"
                leftIcon={<FileSpreadsheet className="h-4 w-4" />}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
              >
                Create new route plan
              </Button>
            </Link>

            {/* 2. Disruptions */}
            <Link href="/disruptions">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<AlertTriangle className="h-4 w-4 text-amber-500" />}
              >
                Disruptions
              </Button>
            </Link>

            {/* 3. Disruption Detected (Feature 1: Hands-Free Voice Ingestion & Location Guardrail) */}
            <Button
              variant="danger"
              size="sm"
              leftIcon={<AlertTriangle className="h-4 w-4" />}
              className="bg-rose-600 hover:bg-rose-700 text-white font-semibold cursor-pointer shadow-xs animate-pulse"
              onClick={() => setShowDisruptionModal(true)}
            >
              Disruption Detected
            </Button>
          </div>
        </div>

        {/* Replan Success Alert with Before/After Diff Link (Category 6 & 7) */}
        {replanSuccess && (
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-sm flex items-center justify-between">
            <div className="flex items-center gap-3 text-emerald-800 dark:text-emerald-200">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              <div>
                <span className="font-bold">Re-optimization proposal generated!</span> Vehicle routes balanced and time windows audited.
              </div>
            </div>
            <Link href="/plans/PLAN-SF-2026-10-12/compare">
              <Button size="sm" variant="primary" className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
                Inspect Side-by-Side Diff (KEPT / MOVED / BROKEN) →
              </Button>
            </Link>
          </div>
        )}

        {/* Real-time KPI Matrix (Category 2) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            label="Active Fleet Units"
            value="3 / 4"
            unit="VEHICLES"
            icon={<Truck className="h-4 w-4" />}
            subtitle="3 on route, 1 idle reserve"
          />

          <KPICard
            label="Deliveries On Plan"
            value="4 / 5"
            unit="ORDERS"
            icon={<Package className="h-4 w-4" />}
            delta={{
              value: "80.0%",
              trend: "up",
              periodLabel: "shift progress rate",
            }}
          />

          <KPICard
            label="Avg On-Time SLA"
            value="98.2%"
            unit="SLA"
            icon={<Clock className="h-4 w-4" />}
            delta={{
              value: "+1.4%",
              trend: "up",
              periodLabel: "vs benchmark",
            }}
          />

          <KPICard
            label="Active Disruptions"
            value="0"
            unit="INCIDENTS"
            icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />}
            delta={{
              value: "Normal Operations",
              trend: "up",
              periodLabel: "all routes clear",
            }}
          />
        </div>

        {/* Active Fleet Live GPS Tracking & Route Map (Central Depot: Swargate, Pune) */}
        <div className="bg-card border border-border rounded-xl p-4 shadow-xs space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <h2 className="text-base font-bold text-foreground">
                  Active Fleet Live GPS & Route Tracking Map
                </h2>
                <span className="text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  📍 Central Depot: Swargate, Pune (18.5018° N, 73.8586° E)
                </span>
              </div>
              <p className="text-xs text-muted mt-1">
                Real-time active vehicle telemetry, delivery stop sequences, and color-matched route corridors radiating from Swargate Multimodal Central Depot.
              </p>
            </div>

            {/* Color-matched Fleet Route Badges & Legends */}
            <div className="flex items-center gap-2 flex-wrap shrink-0">
              <div className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400">
                <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB]" />
                <Truck className="w-3.5 h-3.5 text-[#2563EB]" />
                <span>TRK-01 (Truck Alpha)</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
                <Truck className="w-3.5 h-3.5 text-[#10B981]" />
                <span>TRK-02 (Truck Beta)</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400">
                <span className="w-2.5 h-2.5 rounded-full bg-[#8B5CF6]" />
                <Truck className="w-3.5 h-3.5 text-[#8B5CF6]" />
                <span>VAN-03 (Van Gamma)</span>
              </div>
            </div>
          </div>

          <FleetMap
            geoMarkers={dashboardGeoMarkers}
            geoRoutes={dashboardGeoRoutes}
            centerLat={18.5018}
            centerLng={73.8586}
            zoom={12}
            className="w-full h-[460px] rounded-lg border border-border overflow-hidden"
          />
        </div>

        {/* Today's Schedule Delivery Progress Bar (Category 2) */}
        <div className="bg-card border border-border rounded-xl p-4 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-foreground">Today's Shift Delivery Progress ({selectedDate})</span>
            <span className="text-primary font-mono">1 Completed • 1 Out for Delivery • 2 Assigned • 1 Pending</span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-muted overflow-hidden flex">
            <div className="bg-emerald-500 h-full w-[25%]" title="Completed: 25%" />
            <div className="bg-primary h-full w-[25%]" title="Out for delivery: 25%" />
            <div className="bg-blue-400 h-full w-[35%]" title="Assigned: 35%" />
            <div className="bg-muted-foreground/30 h-full w-[15%]" title="Pending: 15%" />
          </div>
          <div className="flex items-center justify-between text-[11px] text-muted font-mono pt-1">
            <span>Shift Started: 08:00 AM</span>
            <span>Target Completion: 02:00 PM (On Schedule)</span>
          </div>
        </div>

        {/* Fleet Operational Table with Row Click Inspection (Category 2 & 10) */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-foreground">
                Active Vehicle Fleet & Schedule
              </h2>
              <p className="text-xs text-muted">
                Click any vehicle to view driver assignment, remaining sequence, and capacity gauge.
              </p>
            </div>
            <Link href="/fleet" className="text-xs font-semibold text-primary hover:underline">
              View Fleet Overview →
            </Link>
          </div>

          <DataTable
            columns={fleetColumns}
            data={fleet}
            keyExtractor={(row) => row.id}
          />
        </div>

        {/* Vehicle Details Drawer/Modal (Category 2, 4, 10) */}
        {selectedVehicle && (
          <div className="fixed inset-0 z-50 bg-[#2D3139]/35 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-xl max-w-lg w-full p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
                    🚚
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">{selectedVehicle.name}</h3>
                    <p className="text-xs text-muted font-mono">
                      {selectedVehicle.id} • Plate: {selectedVehicle.licensePlate}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedVehicle(null)}
                  className="text-muted hover:text-foreground text-sm font-bold p-1"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-2 border-b border-border/50">
                  <span className="text-muted">Assigned Driver:</span>
                  <span className="font-semibold text-foreground">{selectedVehicle.driverName}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border/50">
                  <span className="text-muted">Operational Status:</span>
                  <StatusBadge status={selectedVehicle.status} size="sm" />
                </div>
                <div className="flex justify-between py-2 border-b border-border/50">
                  <span className="text-muted">Next Immediate Stop:</span>
                  <span className="font-semibold text-primary">{selectedVehicle.nextStop}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border/50">
                  <span className="text-muted">Estimated Arrival (ETA):</span>
                  <span className="font-mono font-bold text-foreground">{selectedVehicle.eta}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border/50">
                  <span className="text-muted">Remaining Stops on Shift:</span>
                  <span className="font-bold text-foreground">{selectedVehicle.remainingStops} stops</span>
                </div>
                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between text-muted">
                    <span>Weight Capacity Utilization:</span>
                    <span className="font-mono font-bold text-foreground">
                      {selectedVehicle.currentWeightKg} / {selectedVehicle.capacityWeightKg} kg (
                      {Math.round((selectedVehicle.currentWeightKg / selectedVehicle.capacityWeightKg) * 100)}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="bg-primary h-full"
                      style={{
                        width: `${Math.round((selectedVehicle.currentWeightKg / selectedVehicle.capacityWeightKg) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-3">
                <Button variant="outline" onClick={() => setSelectedVehicle(null)} className="w-1/2">
                  Close Details
                </Button>
                <Link href={`/fleet`} className="w-1/2">
                  <Button variant="primary" className="w-full">
                    Manage Fleet Units
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}



        {/* Hands-Free Voice Disruption Reporter Modal (Feature 1: Inbound) */}
        <HandsFreeDisruptionModal
          isOpen={showDisruptionModal}
          fleet={fleet}
          onClose={() => setShowDisruptionModal(false)}
          onDisruptionConfirmed={() => {
            setReplanSuccess(true);
          }}
        />
      </div>
    </AppShell>
  );
}
