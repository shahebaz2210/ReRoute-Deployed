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
import dynamic from "next/dynamic";
import type { GeoMarker, GeoRoute } from "@/components/map/fleet-map";

const FleetMap = dynamic(
  () => import("@/components/map/fleet-map").then((mod) => mod.FleetMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[520px] rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)] flex items-center justify-center text-xs text-[var(--muted-foreground)]">
        Loading interactive map...
      </div>
    ),
  }
);
import { FLEET_ROUTE_PALETTE } from "@/lib/plans/store";

interface FleetVehicle {
  id: string;
  name: string;
  licensePlate: string;
  driverName: string;
  status: string;
  color?: string;
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
  const [activePlan, setActivePlan] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Selected vehicle for details drawer (Category 2 & 4)
  const [selectedVehicle, setSelectedVehicle] = useState<FleetVehicle | null>(null);

  // Disruption Detected Voice Reporter Modal (Feature 1: Hands-Free Voice Ingestion)
  const [showDisruptionModal, setShowDisruptionModal] = useState(false);

  // Dynamic fleet state (Pune, Maharashtra Network)
  const [fleet, setFleet] = useState<FleetVehicle[]>([]);

  // Function to load real backend active plan and fleet
  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch active plan (reflects latest uploaded orders and optimized routes)
      const planRes = await fetch("/api/v1/plans?active=true");
      const planJson = await planRes.json();
      const plan = planJson.data || null;
      if (plan) {
        setActivePlan(plan);
      }

      // 2. Fetch fleet units
      const fleetRes = await fetch("/api/v1/fleet");
      const fleetJson = await fleetRes.json();
      if (fleetJson && fleetJson.data && fleetJson.data.length > 0) {
        setFleet(
          fleetJson.data.map((v: any, idx: number) => {
            const color = v.color || FLEET_ROUTE_PALETTE[idx % FLEET_ROUTE_PALETTE.length];
            const activeRoute = plan?.routes?.find(
              (r: any) => r.vehicleId === v.id || r.vehicleCode === v.vehicleCode
            );
            const nextStopObj = activeRoute?.stops?.find(
              (s: any) => s.status === "IN_TRANSIT" || s.status === "PENDING"
            );

            return {
              id: v.id,
              name: `${v.makeModel || "Fleet Vehicle"} (${v.vehicleCode || v.id})`,
              licensePlate: v.licensePlate || v.vehicleCode || v.id,
              driverName: v.driverName || `Driver #${idx + 1}`,
              status: v.status === "ACTIVE" || v.status === "IN_TRANSIT" ? "ACTIVE_VEHICLE" : v.status,
              color,
              capacityWeightKg: v.maxWeightKg || 2500,
              capacityVolumeM3: v.maxVolumeM3 || 18.0,
              currentWeightKg: v.currentWeightKg || 0,
              currentVolumeM3: v.currentVolumeM3 || 0,
              nextStop: nextStopObj?.locationName || v.currentLocationName || "Central Logistics Hub",
              eta: nextStopObj?.eta || (v.status === "IN_TRANSIT" ? "09:30 AM" : "Standby"),
              remainingStops: v.stopsCount || (activeRoute?.stops?.length || 0),
            };
          })
        );
      }
    } catch (err) {
      console.error("Failed to load active plan & fleet:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Build GeoMarkers & GeoRoutes dynamically using the 10+ color palette, identical to Route Optimization tab
  const { dashboardGeoMarkers, dashboardGeoRoutes } = React.useMemo(() => {
    if (!activePlan) return { dashboardGeoMarkers: [], dashboardGeoRoutes: [] };

    const markers: GeoMarker[] = [];
    const routes: GeoRoute[] = [];

    // Central Depot Marker
    if (activePlan.depot && typeof activePlan.depot.lat === "number") {
      markers.push({
        id: "M-DEPOT",
        type: "DEPOT",
        lat: activePlan.depot.lat,
        lng: activePlan.depot.lng,
        label: activePlan.depot.name || "Swargate Central Depot (Pune)",
        sublabel: `Dispatcher Workplace (${activePlan.depot.lat.toFixed(4)}° N, ${activePlan.depot.lng.toFixed(4)}° E)`,
        status: "COMPLETED",
        stopNumber: 0,
      });
    }

    // Vehicle Routes and Stop Pins with matched colors
    (activePlan.routes || []).forEach((r: any, rIdx: number) => {
      const color = FLEET_ROUTE_PALETTE[rIdx % FLEET_ROUTE_PALETTE.length];
      const coords: [number, number][] = [];

      if (activePlan.depot && typeof activePlan.depot.lat === "number") {
        coords.push([activePlan.depot.lat, activePlan.depot.lng]);
      }

      (r.stops || []).forEach((st: any) => {
        if (typeof st.lat === "number" && typeof st.lng === "number") {
          coords.push([st.lat, st.lng]);

          if (st.type === "DELIVERY") {
            markers.push({
              id: `M-${r.vehicleId}-${st.stopNumber}`,
              type: "STOP",
              lat: st.lat,
              lng: st.lng,
              label: st.locationName || `Stop #${st.stopNumber}`,
              sublabel: st.address,
              orderRef: st.orderRef,
              color,
              stopNumber: st.stopNumber,
              status: st.status,
            });
          }
        }
      });

      if (activePlan.depot && typeof activePlan.depot.lat === "number") {
        coords.push([activePlan.depot.lat, activePlan.depot.lng]);
      }

      if (coords.length > 1) {
        routes.push({
          id: `R-${r.vehicleId}`,
          vehicleCode: r.vehicleCode,
          driverName: r.driverName,
          color,
          coordinates: coords,
          distanceKm: r.distanceKm,
          stopsCount: r.stopsCount,
        });

        // Vehicle marker at active location
        const vehicleLat = coords[1] ? coords[1][0] : activePlan.depot.lat;
        const vehicleLng = coords[1] ? coords[1][1] : activePlan.depot.lng;

        markers.push({
          id: `V-${r.vehicleId}`,
          type: "VEHICLE",
          lat: vehicleLat + 0.001 * (rIdx % 2 === 0 ? 1 : -1),
          lng: vehicleLng + 0.001 * (rIdx % 2 === 0 ? -1 : 1),
          label: `${r.vehicleCode} (${r.driverName})`,
          vehicleCode: r.vehicleCode,
          color,
          status: r.isFailed ? "DELAYED_ROUTE" : "ACTIVE_VEHICLE",
        });
      }
    });

    return { dashboardGeoMarkers: markers, dashboardGeoRoutes: routes };
  }, [activePlan]);

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
      const planId = activePlan?.id || "PLAN-SF-2026-10-12";
      const res = await fetch(`/api/v1/plans/${planId}/optimize`, { method: "POST" });
      await res.json();
      setReplanSuccess(true);
      await loadDashboardData();
      setTimeout(() => setReplanSuccess(false), 4000);
    } catch {
      // Graceful fallback
    } finally {
      setIsReplanning(false);
    }
  };

  // Dynamic KPIs from activePlan & fleet
  const totalVehiclesCount = fleet.length || activePlan?.totalVehicles || 4;
  const activeVehiclesCount =
    fleet.filter((v) => v.status === "ACTIVE_VEHICLE" || v.status === "IN_TRANSIT").length ||
    (dashboardGeoRoutes.length || 3);
  const totalOrdersCount = activePlan?.totalOrders || activePlan?.orders?.length || 9;
  const deliveredOrdersCount =
    (activePlan?.orders || []).filter((o: any) => o.status === "DELIVERED" || o.isCompleted).length || 4;
  const inTransitOrdersCount =
    (activePlan?.orders || []).filter((o: any) => o.status === "IN_TRANSIT").length || 2;

  const fleetColumns: Column<FleetVehicle>[] = [
    {
      key: "id",
      header: "Vehicle ID",
      sortable: true,
      render: (row: FleetVehicle) => {
        const vIdx = fleet.findIndex((v) => v.id === row.id);
        const vehicleColor = row.color || FLEET_ROUTE_PALETTE[(vIdx >= 0 ? vIdx : 0) % FLEET_ROUTE_PALETTE.length];

        return (
          <div className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full shrink-0 shadow-2xs border border-white"
              style={{ backgroundColor: vehicleColor }}
              title={`Matching route color: ${vehicleColor}`}
            />
            <button
              onClick={() => setSelectedVehicle(row)}
              className="font-mono font-bold hover:underline text-left text-xs cursor-pointer"
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
      render: (row: FleetVehicle) => {
        const vIdx = fleet.findIndex((v) => v.id === row.id);
        const vehicleColor = row.color || FLEET_ROUTE_PALETTE[(vIdx >= 0 ? vIdx : 0) % FLEET_ROUTE_PALETTE.length];

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
      render: (row: FleetVehicle) => {
        const pct = Math.min(100, Math.round((row.currentWeightKg / (row.capacityWeightKg || 2500)) * 100));
        const vIdx = fleet.findIndex((v) => v.id === row.id);
        const vehicleColor = row.color || FLEET_ROUTE_PALETTE[(vIdx >= 0 ? vIdx : 0) % FLEET_ROUTE_PALETTE.length];

        return (
          <div className="w-36 space-y-1">
            <div className="flex justify-between text-[11px] font-mono">
              <span className="text-muted">{row.currentWeightKg} / {row.capacityWeightKg} kg</span>
              <span className="font-bold text-foreground">{pct}%</span>
            </div>
            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${pct}%`,
                  backgroundColor: vehicleColor,
                }}
              />
            </div>
          </div>
        );
      },
    },
    {
      key: "nextStop",
      header: "Current / Next Stop",
      render: (row) => (
        <div className="max-w-[200px] truncate text-xs">
          <span className="font-semibold text-foreground">{row.nextStop}</span>
        </div>
      ),
    },
    {
      key: "eta",
      header: "ETA",
      render: (row) => (
        <span className="font-mono text-xs text-muted font-medium">{row.eta}</span>
      ),
    },
    {
      key: "remainingStops",
      header: "Remaining Stops",
      align: "center",
      render: (row) => (
        <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-[var(--surface-secondary)] text-[var(--foreground)]">
          {row.remainingStops} stops
        </span>
      ),
    },
  ];

  return (
    <AppShell>
      <div className="flex flex-col gap-6 max-w-7xl mx-auto">
        {/* Top Shift Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
              Control Room Cockpit • Real-Time Operations
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
              Fleet Operations & Schedule Tracking
            </h1>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
              Autonomous human-in-the-loop dynamic logistics dispatching and disruption recovery.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Link href="/plans/new">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<FileSpreadsheet className="h-4 w-4" />}
                className="border-border text-foreground hover:bg-[var(--surface-hover)] cursor-pointer"
              >
                Create new route plan
              </Button>
            </Link>

            <Link href="/plans/PLAN-SF-2026-10-12/compare">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<AlertTriangle className="h-4 w-4 text-amber-500" />}
                className="border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 cursor-pointer"
              >
                Disruptions
              </Button>
            </Link>

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
            value={`${activeVehiclesCount} / ${totalVehiclesCount}`}
            unit="VEHICLES"
            icon={<Truck className="h-4 w-4" />}
            subtitle={`${activeVehiclesCount} on route, ${Math.max(0, totalVehiclesCount - activeVehiclesCount)} idle reserve`}
          />

          <KPICard
            label="Deliveries On Plan"
            value={`${deliveredOrdersCount} / ${totalOrdersCount}`}
            unit="ORDERS"
            icon={<Package className="h-4 w-4" />}
            delta={{
              value: `${totalOrdersCount > 0 ? Math.round((deliveredOrdersCount / totalOrdersCount) * 100) : 100}%`,
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
            label="Total Planned Distance"
            value={`${activePlan?.totalDistanceKm || 104.8}`}
            unit="KM"
            icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />}
            delta={{
              value: `${activePlan?.totalFuelLiters || 18.1} L diesel`,
              trend: "up",
              periodLabel: "optimized routing",
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
                  📍 Central Depot: {activePlan?.depot?.name || "Swargate, Pune"} ({activePlan?.depot?.lat?.toFixed(4) || "18.5018"}° N, {activePlan?.depot?.lng?.toFixed(4) || "73.8586"}° E)
                </span>
              </div>
              <p className="text-xs text-muted mt-1">
                Real-time active vehicle telemetry, delivery stop sequences, and color-matched route corridors radiating from {activePlan?.depot?.name || "Swargate Central Depot"}.
              </p>
            </div>

            {/* Color-matched Fleet Route Badges & Legends (10+ distinct colors supported) */}
            <div className="flex items-center gap-2 flex-wrap shrink-0">
              {dashboardGeoRoutes.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-xl border shadow-2xs"
                  style={{
                    backgroundColor: `${r.color}15`,
                    borderColor: `${r.color}35`,
                    color: r.color,
                  }}
                >
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: r.color }} />
                  <Truck className="w-3.5 h-3.5" style={{ color: r.color }} />
                  <span>{r.vehicleCode}</span>
                </div>
              ))}
            </div>
          </div>

          <FleetMap
            geoMarkers={dashboardGeoMarkers}
            geoRoutes={dashboardGeoRoutes}
            centerLat={activePlan?.depot?.lat || 18.5018}
            centerLng={activePlan?.depot?.lng || 73.8586}
            zoom={12}
            className="w-full"
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
          <div className="fixed inset-0 z-[9999] bg-[#2D3139]/35 backdrop-blur-xs flex items-center justify-center p-4">
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
