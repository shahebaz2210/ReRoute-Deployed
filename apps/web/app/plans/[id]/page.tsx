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
import dynamic from "next/dynamic";
import type { GeoMarker, GeoRoute } from "@/components/map/fleet-map";

const FleetMap = dynamic(
  () => import("@/components/map/fleet-map").then((mod) => mod.FleetMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[400px] rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)] flex items-center justify-center text-xs text-[var(--muted-foreground)]">
        Loading interactive map...
      </div>
    ),
  }
);
import { FLEET_ROUTE_PALETTE } from "@/lib/plans/store";

function buildMapData(plan: any): { geoMarkers: GeoMarker[]; geoRoutes: GeoRoute[] } {
  if (!plan) return { geoMarkers: [], geoRoutes: [] };

  const geoMarkers: GeoMarker[] = [];
  const geoRoutes: GeoRoute[] = [];
  const palette = FLEET_ROUTE_PALETTE;

  // 1. Central Depot Center Marker in India
  const depotLat = plan.depot?.lat ?? plan.depot?.latitude ?? 18.5018;
  const depotLng = plan.depot?.lng ?? plan.depot?.longitude ?? 73.8586;
  const depotName = plan.depot?.name || "Central Logistics Hub (India)";

  geoMarkers.push({
    id: "M-DEPOT",
    type: "DEPOT",
    lat: depotLat,
    lng: depotLng,
    label: depotName,
    sublabel: `Dispatcher Workplace (${depotLat.toFixed(4)}° N, ${depotLng.toFixed(4)}° E)`,
    status: "COMPLETED",
    stopNumber: 0,
  });

  // Determine effective routes: if plan.routes is empty but orders exist, create draft routes
  let effectiveRoutes = plan.routes;
  if ((!effectiveRoutes || effectiveRoutes.length === 0) && plan.orders && plan.orders.length > 0) {
    // Generate draft partition across 3 vehicles so route lines and stop markers are visible
    const vehicles = plan.fleet && plan.fleet.length > 0 ? plan.fleet : [
      { id: "VH-001", vehicleCode: "TRK-01", driverName: "Alex Vance" },
      { id: "VH-002", vehicleCode: "TRK-02", driverName: "Marcus Sterling" },
      { id: "VH-003", vehicleCode: "VAN-03", driverName: "Elena Rostova" },
    ];
    effectiveRoutes = vehicles.map((v: any, vIdx: number) => {
      const assignedOrders = plan.orders.filter((_: any, oIdx: number) => oIdx % vehicles.length === vIdx);
      return {
        vehicleId: v.id,
        vehicleCode: v.vehicleCode || v.id,
        driverName: v.driverName || `Driver #${vIdx + 1}`,
        distanceKm: 25.0 + vIdx * 8.5,
        stopsCount: assignedOrders.length + 1,
        stops: [
          {
            stopNumber: 1,
            type: "DEPOT_DEPARTURE",
            locationName: depotName,
            lat: depotLat,
            lng: depotLng,
            status: "COMPLETED",
          },
          ...assignedOrders.map((o: any, oIdx: number) => {
            // Ensure unique spread if order lat/lng is identical to depot
            let oLat = Number(o.latitude ?? o.lat);
            let oLng = Number(o.longitude ?? o.lng);
            if (isNaN(oLat) || isNaN(oLng) || (Math.abs(oLat - depotLat) < 1e-4 && Math.abs(oLng - depotLng) < 1e-4)) {
              oLat = depotLat + 0.018 * Math.sin((oIdx + 1 + vIdx * 3) * 1.4);
              oLng = depotLng + 0.022 * Math.cos((oIdx + 1 + vIdx * 3) * 1.4);
            }
            return {
              stopNumber: oIdx + 2,
              type: "DELIVERY",
              orderRef: o.orderReference || o.id,
              locationName: o.customerName || `Stop #${oIdx + 1}`,
              address: o.deliveryAddress,
              lat: oLat,
              lng: oLng,
              status: "PENDING",
            };
          }),
        ],
      };
    });
  }

  // 2. Build Vehicle Routes and Stop Markers
  (effectiveRoutes || []).forEach((r: any, rIdx: number) => {
    const color = palette[rIdx % palette.length];
    const coords: [number, number][] = [];

    const addCoord = (lat: number, lng: number) => {
      if (typeof lat !== "number" || typeof lng !== "number" || isNaN(lat) || isNaN(lng)) return;
      const last = coords[coords.length - 1];
      if (!last || Math.abs(last[0] - lat) > 1e-5 || Math.abs(last[1] - lng) > 1e-5) {
        coords.push([lat, lng]);
      }
    };

    // Always start at depot
    addCoord(depotLat, depotLng);

    (r.stops || []).forEach((st: any, stIdx: number) => {
      let stLat = Number(st.lat ?? st.latitude);
      let stLng = Number(st.lng ?? st.longitude);

      if (typeof stLat === "number" && typeof stLng === "number" && !isNaN(stLat) && !isNaN(stLng)) {
        // If stop coordinates are identical to depot, spread them so they form a visible road route
        if (st.type === "DELIVERY" && Math.abs(stLat - depotLat) < 1e-4 && Math.abs(stLng - depotLng) < 1e-4) {
          stLat = depotLat + 0.016 * Math.sin((stIdx + 1 + rIdx * 3) * 1.35);
          stLng = depotLng + 0.022 * Math.cos((stIdx + 1 + rIdx * 3) * 1.35);
        }

        addCoord(stLat, stLng);

        if (st.type === "DELIVERY") {
          geoMarkers.push({
            id: `M-${r.vehicleId}-${st.stopNumber || stIdx + 1}`,
            type: "STOP",
            lat: stLat,
            lng: stLng,
            label: st.locationName || `Stop #${st.stopNumber || stIdx + 1}`,
            sublabel: st.address,
            orderRef: st.orderRef,
            color,
            stopNumber: st.stopNumber || stIdx + 1,
            status: st.status,
          });
        }
      }
    });

    // Return to Central Depot
    addCoord(depotLat, depotLng);

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
      const vehicleLat = coords[1] ? coords[1][0] : depotLat;
      const vehicleLng = coords[1] ? coords[1][1] : depotLng;

      geoMarkers.push({
        id: `V-${r.vehicleId}`,
        type: "VEHICLE",
        lat: vehicleLat + 0.001 * (rIdx % 2 === 0 ? 1 : -1),
        lng: vehicleLng + 0.001 * (rIdx % 2 === 0 ? -1 : 1),
        label: `${r.vehicleCode || r.vehicleId} (${r.driverName || "Driver"})`,
        vehicleCode: r.vehicleCode || r.vehicleId,
        color,
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
            {plan?.routes?.map((route: any, rIdx: number) => {
              const color = FLEET_ROUTE_PALETTE[rIdx % FLEET_ROUTE_PALETTE.length];
              return (
                <div
                  key={route.vehicleId}
                  className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 flex flex-col gap-3 shadow-xs"
                >
                  <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="p-1.5 rounded-lg text-white shadow-2xs"
                        style={{ backgroundColor: color }}
                      >
                        <Truck className="h-4 w-4" />
                      </div>
                      <div>
                        <Link
                          href={`/fleet/${route.vehicleId}`}
                          className="font-bold text-sm hover:underline flex items-center gap-1"
                          style={{ color }}
                        >
                          <span>{route.vehicleCode}</span>
                          <ArrowRight className="h-3 w-3 opacity-60" />
                        </Link>
                        <p className="text-[11px] text-[var(--muted-foreground)]">Driver: {route.driverName}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-mono font-semibold" style={{ color }}>{route.weightUtilizationPercent}% Load</span>
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
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs"
                            style={{ backgroundColor: color }}
                          />
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
              );
            })}
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

