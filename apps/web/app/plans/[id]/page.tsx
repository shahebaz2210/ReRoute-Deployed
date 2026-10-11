"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { KPICard } from "@/components/ui/kpi-card";
import { Alert } from "@/components/ui/alert";
import {
  CheckCircle,
  Truck,
  Package,
  Clock,
  ArrowRight,
  ShieldAlert,
  Volume2,
  Share2,
  Fuel,
} from "lucide-react";
import { FleetMap, GeoMarker, GeoRoute } from "@/components/map/fleet-map";

function buildMapData(plan: any): { geoMarkers: GeoMarker[]; geoRoutes: GeoRoute[] } {
  if (!plan) return { geoMarkers: [], geoRoutes: [] };

  const geoMarkers: GeoMarker[] = [];
  const geoRoutes: GeoRoute[] = [];
  const palette = ["#2563EB", "#10B981", "#8B5CF6", "#F59E0B", "#EC4899"];

  // 1. Central Depot Center Marker in India
  if (plan.depot && typeof plan.depot.lat === "number" && typeof plan.depot.lng === "number") {
    geoMarkers.push({
      id: "M-DEPOT",
      type: "DEPOT",
      lat: plan.depot.lat,
      lng: plan.depot.lng,
      label: plan.depot.name || "Central Logistics Hub (India)",
      sublabel: `Dispatcher Workplace (${plan.depot.lat.toFixed(4)}° N, ${plan.depot.lng.toFixed(4)}° E)`,
      status: "COMPLETED",
      stopNumber: 0,
    });
  }

  // 2. Build Vehicle Routes and Stop Markers
  (plan.routes || []).forEach((r: any, rIdx: number) => {
    const color = palette[rIdx % palette.length];
    const coords: [number, number][] = [];

    // Departure from Central Depot
    if (plan.depot && typeof plan.depot.lat === "number") {
      coords.push([plan.depot.lat, plan.depot.lng]);
    }

    (r.stops || []).forEach((st: any) => {
      if (typeof st.lat === "number" && typeof st.lng === "number") {
        coords.push([st.lat, st.lng]);

        if (st.type === "DELIVERY") {
          geoMarkers.push({
            id: `M-${r.vehicleId}-${st.stopNumber}`,
            type: "STOP",
            lat: st.lat,
            lng: st.lng,
            label: st.locationName || `Stop #${st.stopNumber}`,
            sublabel: st.address,
            orderRef: st.orderRef,
            stopNumber: st.stopNumber,
            status: st.status,
          });
        }
      }
    });

    // Return to Central Depot
    if (plan.depot && typeof plan.depot.lat === "number") {
      coords.push([plan.depot.lat, plan.depot.lng]);
    }

    if (coords.length > 1) {
      geoRoutes.push({
        id: `R-${r.vehicleId}`,
        vehicleCode: r.vehicleCode,
        driverName: r.driverName,
        color,
        coordinates: coords,
        distanceKm: r.distanceKm,
        stopsCount: r.stopsCount,
      });

      // Commercial vehicle marker at current position
      const vehicleLat = coords[1] ? coords[1][0] : plan.depot.lat;
      const vehicleLng = coords[1] ? coords[1][1] : plan.depot.lng;

      geoMarkers.push({
        id: `V-${r.vehicleId}`,
        type: "VEHICLE",
        lat: vehicleLat + 0.001 * (rIdx === 0 ? 1 : -1),
        lng: vehicleLng + 0.001 * (rIdx === 0 ? -1 : 1),
        label: `${r.vehicleCode} (${r.driverName})`,
        vehicleCode: r.vehicleCode,
        status: r.isFailed ? "DELAYED_ROUTE" : "ACTIVE_VEHICLE",
      });
    }
  });

  return { geoMarkers, geoRoutes };
}

function PlanDetailContent() {
  const params = useParams();
  const planId = (params?.id as string) || "PLN-01";
  const [plan, setPlan] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"ROUTES" | "COMPARISON">("ROUTES");
  const mapData = React.useMemo(() => buildMapData(plan), [plan]);

  useEffect(() => {
    fetch(`/api/v1/plans/${planId}`)
      .then((res) => res.json())
      .then((data) => setPlan(data.data))
      .catch((err) => console.error(err));
  }, [planId]);

  return (
    <AppShell>
      <div className="flex flex-col gap-6 max-w-7xl mx-auto">
        <Breadcrumb
          items={[
            { label: "Dashboard", href: "/" },
            { label: "Plans", href: "/plans" },
            { label: `Plan ${planId.slice(0, 8)}`, isCurrent: true },
          ]}
        />

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
                {plan?.planName || "Active Delivery Plan"}
              </h1>
              <StatusBadge status="APPROVED_REPLAN" customLabel="ACTIVE V1" size="sm" />
            </div>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
              Optimized via RouteIQ OR-Tools VRPTW · Depot: {plan?.depot?.name || "Central Logistics Hub"} ({plan?.depot?.lat?.toFixed(4) || "51.5150"}, {plan?.depot?.lng?.toFixed(4) || "-0.1200"})
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Volume2 className="h-4 w-4" />}
              onClick={() => alert("ElevenLabs: Shift Audio Briefing queued")}
            >
              Play Audio Debrief
            </Button>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Share2 className="h-4 w-4" />}
              onClick={() => alert("Exported manifest PDF/CSV")}
            >
              Export Manifest
            </Button>
          </div>
        </div>

        {/* Plan KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <KPICard
            label="Total Deliveries"
            value={plan?.totalOrders ?? 12}
            unit="ORDERS"
            icon={<Package className="h-4 w-4" />}
          />
          <KPICard
            label="Vehicles Deployed"
            value={plan?.totalVehicles ?? 3}
            unit="FLEET"
            icon={<Truck className="h-4 w-4" />}
          />
          <KPICard
            label="Total Distance"
            value={plan?.totalDistanceKm ? `${plan.totalDistanceKm}` : "142.6"}
            unit="KM"
            icon={<Clock className="h-4 w-4" />}
          />
          <KPICard
            label="Est. Fuel & CO₂"
            value={plan?.totalFuelLiters ? `${plan.totalFuelLiters} L` : "32.4 L"}
            subtitle={plan?.totalCo2Kg ? `${plan.totalCo2Kg} kg CO₂` : "86.8 kg CO₂"}
            unit="EMISSIONS"
            icon={<Fuel className="h-4 w-4 text-[var(--success)]" />}
          />
          <KPICard
            label="Est. Duration"
            value={
              plan?.totalDurationMinutes
                ? `${Math.floor(plan.totalDurationMinutes / 60)}h ${plan.totalDurationMinutes % 60}m`
                : "6h 20m"
            }
            unit="TIME"
            icon={<Clock className="h-4 w-4 text-[var(--primary)]" />}
          />
        </div>

        {/* Interactive Route Map */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-[var(--foreground)]">
              Multi-Vehicle Optimized Route Map (OSRM + OR-Tools)
            </h2>
            <span className="text-xs text-[var(--muted-foreground)]">
              Real road matrix routing from Central Depot Center ({plan?.depot?.lat?.toFixed(4) || "18.5018"}, {plan?.depot?.lng?.toFixed(4) || "73.8586"})
            </span>
          </div>
          <FleetMap
            geoMarkers={mapData.geoMarkers}
            geoRoutes={mapData.geoRoutes}
            centerLat={plan?.depot?.lat || 18.5018}
            centerLng={plan?.depot?.lng || 73.8586}
          />
        </div>

        {/* Routes by vehicle */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-[var(--foreground)]">
              Vehicle Stop Schedules & Manifests
            </h2>
            <span className="text-xs text-[var(--muted-foreground)]">
              Click vehicle ID to view active telemetry & multi-objective functions
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {plan?.routes?.map((route: any) => (
              <div
                key={route.vehicleId}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 flex flex-col gap-3 shadow-xs"
              >
                <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)]">
                      <Truck className="h-4 w-4" />
                    </div>
                    <div>
                      <Link
                        href={`/fleet/${route.vehicleId}`}
                        className="font-bold text-sm text-[var(--foreground)] hover:underline hover:text-primary flex items-center gap-1"
                      >
                        <span>{route.vehicleCode}</span>
                        <ArrowRight className="h-3 w-3 opacity-60" />
                      </Link>
                      <p className="text-[11px] text-[var(--muted-foreground)]">Driver: {route.driverName}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-semibold text-[var(--primary)]">{route.weightUtilizationPercent}% Load</span>
                    <p className="text-[10px] text-[var(--muted-foreground)]">{route.distanceKm} km · {route.fuelConsumedLiters ? `${route.fuelConsumedLiters}L fuel` : `${route.stopsCount} stops`}</p>
                  </div>
                </div>

                {/* Stops timeline */}
                <div className="space-y-2 mt-1">
                  {route.stops?.map((stop: any) => (
                    <div
                      key={stop.stopNumber}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--surface-secondary)] text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-[var(--muted-foreground)]">#{stop.stopNumber}</span>
                        <div>
                          <span className="font-medium text-[var(--foreground)]">{stop.locationName}</span>
                          {stop.orderRef && (
                            <span className="ml-2 font-mono text-[10px] text-[var(--primary)] font-semibold">{stop.orderRef}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs text-[var(--muted-foreground)]">ETA {stop.eta}</span>
                        <StatusBadge status={stop.status === "COMPLETED" ? "DELIVERED" : stop.status} size="sm" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

export default function PlanDetailPage() {
  return (
    <Suspense fallback={<div className="p-8 text-xs text-[var(--muted-foreground)]">Loading delivery plan...</div>}>
      <PlanDetailContent />
    </Suspense>
  );
}

