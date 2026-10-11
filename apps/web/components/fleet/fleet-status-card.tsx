"use client";

import React from "react";
import Link from "next/link";
import { Truck, Fuel, MapPin, Gauge } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";

export interface FleetVehicle {
  id: string;
  vehicleCode: string;
  makeModel: string;
  licensePlate: string;
  maxWeightKg: number;
  maxVolumeM3: number;
  currentWeightKg?: number;
  status: string;
  fuelPercent?: number;
  odometerKm?: number;
  driverName?: string;
  currentLocationName?: string;
}

export function FleetStatusCard({ vehicle }: { vehicle: FleetVehicle }) {
  const currentLoad = vehicle.currentWeightKg ?? Math.round(vehicle.maxWeightKg * 0.75);
  const loadPercent = Math.min(100, Math.round((currentLoad / vehicle.maxWeightKg) * 100));

  return (
    <div className="flex flex-col p-4 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:border-[var(--primary)] transition-all shadow-xs gap-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)]">
            <Truck className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[var(--foreground)]">{vehicle.vehicleCode}</h4>
            <p className="text-[11px] text-[var(--muted-foreground)]">{vehicle.makeModel}</p>
          </div>
        </div>
        <StatusBadge status={vehicle.status} size="sm" />
      </div>

      <div className="flex items-center gap-3 text-xs text-[var(--text-secondary)]">
        <span className="font-mono bg-[var(--surface-secondary)] px-2 py-0.5 rounded border border-[var(--border-subtle)] text-[11px]">
          {vehicle.licensePlate}
        </span>
        {vehicle.driverName && (
          <span className="truncate">Driver: <strong className="text-[var(--foreground)]">{vehicle.driverName}</strong></span>
        )}
      </div>

      {/* Payload Capacity Progress */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[var(--muted-foreground)] text-[11px]">Capacity Load</span>
          <span className="font-mono font-medium text-[var(--foreground)] text-[11px]">
            {currentLoad.toLocaleString()} / {vehicle.maxWeightKg.toLocaleString()} kg ({loadPercent}%)
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-[var(--surface-secondary)] overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              loadPercent > 90
                ? "bg-[var(--destructive)]"
                : loadPercent > 75
                ? "bg-[var(--warning)]"
                : "bg-[var(--primary)]"
            }`}
            style={{ width: `${loadPercent}%` }}
          />
        </div>
      </div>

      {/* Telemetry Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-[var(--border-subtle)] text-[11px] text-[var(--muted-foreground)]">
        <div className="flex items-center gap-1 font-mono">
          <Fuel className="h-3 w-3 text-[var(--primary)]" />
          <span>{vehicle.fuelPercent ?? 85}% Fuel</span>
        </div>
        <div className="flex items-center gap-1 font-mono">
          <Gauge className="h-3 w-3" />
          <span>{(vehicle.odometerKm ?? 45000).toLocaleString()} km</span>
        </div>
        <Link
          href={`/fleet/${vehicle.id}`}
          className="text-[var(--primary)] font-medium hover:underline text-xs"
        >
          Details →
        </Link>
      </div>
    </div>
  );
}
