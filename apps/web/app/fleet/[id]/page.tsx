"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { KPICard } from "@/components/ui/kpi-card";
import { Truck, MapPin, Fuel, Gauge, ArrowLeft, Clock, ShieldCheck } from "lucide-react";

function VehicleDetailContent() {
  const params = useParams();
  const vehicleId = (params?.id as string) || "TRK-01";

  return (
    <AppShell>
      <div className="flex flex-col gap-6 max-w-6xl mx-auto">
        <Breadcrumb
          items={[
            { label: "Dashboard", href: "/" },
            { label: "Fleet", href: "/fleet" },
            { label: `Vehicle ${vehicleId.slice(0, 8)}`, isCurrent: true },
          ]}
        />

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/fleet">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-[var(--foreground)]">
                  Truck Alpha (TRK-01)
                </h1>
                <StatusBadge status="ACTIVE_VEHICLE" size="sm" />
              </div>
              <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                Mercedes-Benz Actros 2545 · Plate: DX-2026-AA · Driver: Marcus Vance
              </p>
            </div>
          </div>
        </div>

        {/* Telemetry KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            label="Payload Weight Load"
            value="3,120 / 4,000"
            unit="KG (78%)"
            icon={<Truck className="h-4 w-4 text-[var(--primary)]" />}
          />
          <KPICard
            label="Volumetric Space"
            value="18.5 / 28.5"
            unit="M³ (65%)"
            icon={<Gauge className="h-4 w-4" />}
          />
          <KPICard
            label="Fuel Level"
            value="88%"
            unit="DIESEL"
            icon={<Fuel className="h-4 w-4" />}
          />
          <KPICard
            label="GPS Position"
            value="51.5074, -0.1278"
            unit="LAT/LNG"
            icon={<MapPin className="h-4 w-4 text-[var(--success)]" />}
          />
        </div>

        {/* Current Active Stops */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-[var(--foreground)]">
              Assigned Shift Manifest & Stops
            </h3>
            <span className="text-xs font-mono text-[var(--muted-foreground)]">Plan ID: PLN-2026-001</span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-4 p-3 rounded-lg bg-[var(--surface-secondary)] text-xs">
              <span className="font-mono font-bold text-[var(--muted-foreground)]">01</span>
              <div className="flex-1">
                <div className="font-semibold text-[var(--foreground)]">Central Logistics Depot (DEPOT-01)</div>
                <div className="text-[11px] text-[var(--muted-foreground)]">Departure · 08:00 AM</div>
              </div>
              <StatusBadge status="DELIVERED" customLabel="Completed" size="sm" />
            </div>

            <div className="flex items-center gap-4 p-3 rounded-lg bg-[var(--surface-secondary)] text-xs">
              <span className="font-mono font-bold text-[var(--muted-foreground)]">02</span>
              <div className="flex-1">
                <div className="font-semibold text-[var(--foreground)]">Astra Tech Labs (ORD-1001)</div>
                <div className="text-[11px] text-[var(--muted-foreground)]">240 kg · ETA: 08:45 AM</div>
              </div>
              <StatusBadge status="DELIVERED" size="sm" />
            </div>

            <div className="flex items-center gap-4 p-3 rounded-lg border border-[var(--primary)] bg-[var(--primary)]/5 text-xs">
              <span className="font-mono font-bold text-[var(--primary)]">03</span>
              <div className="flex-1">
                <div className="font-semibold text-[var(--foreground)]">BioGen Research (ORD-1002)</div>
                <div className="text-[11px] text-[var(--muted-foreground)]">450 kg · Next Stop · ETA: 11:45 AM</div>
              </div>
              <StatusBadge status="ACTIVE_VEHICLE" customLabel="En Route" size="sm" />
            </div>
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

