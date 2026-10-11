"use client";

import React, { useState, useEffect, Suspense } from "react";
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
} from "lucide-react";

function PlanDetailContent() {
  const params = useParams();
  const planId = (params?.id as string) || "PLN-01";
  const [plan, setPlan] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"ROUTES" | "COMPARISON">("ROUTES");

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
              Optimized via OR-Tools VRPTW · Depot: Central Hub (DEPOT-01)
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
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <KPICard
            label="Total Deliveries"
            value={plan?.totalOrders || 12}
            unit="ORDERS"
            icon={<Package className="h-4 w-4" />}
          />
          <KPICard
            label="Vehicles Deployed"
            value={plan?.totalVehicles || 3}
            unit="UNITS"
            icon={<Truck className="h-4 w-4" />}
          />
          <KPICard
            label="Total Distance"
            value={plan?.totalDistanceKm || "142.6"}
            unit="KM"
            icon={<Clock className="h-4 w-4" />}
          />
          <KPICard
            label="Est. Duration"
            value="6h 20m"
            unit="TIME"
            icon={<Clock className="h-4 w-4 text-[var(--success)]" />}
          />
        </div>

        {/* Routes by vehicle */}
        <div className="flex flex-col gap-4">
          <h2 className="text-base font-semibold text-[var(--foreground)]">
            Vehicle Stop Schedules & Manifests
          </h2>

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
                      <h4 className="font-bold text-sm text-[var(--foreground)]">{route.vehicleCode}</h4>
                      <p className="text-[11px] text-[var(--muted-foreground)]">Driver: {route.driverName}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-semibold text-[var(--primary)]">{route.weightUtilizationPercent}% Load</span>
                    <p className="text-[10px] text-[var(--muted-foreground)]">{route.distanceKm} km · {route.stopsCount} stops</p>
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

