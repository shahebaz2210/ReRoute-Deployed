"use client";

import React from "react";
import Link from "next/link";
import { Truck, Fuel, Gauge } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";

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
    <div className="flex flex-col p-5 rounded-2xl border border-neutral-200/80 bg-white dark:border-neutral-800 dark:bg-neutral-900 hover:border-[#2D3139] transition-all shadow-2xs gap-3.5">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200">
            <Truck className="h-5 w-5" />
          </div>
          <div>
            <Link
              href={`/fleet/${vehicle.id || vehicle.vehicleCode}`}
              className="text-sm font-bold text-[#272A30] dark:text-neutral-50 tracking-tight hover:text-primary hover:underline"
            >
              {vehicle.vehicleCode}
            </Link>
            <p className="text-[11px] text-neutral-500 font-normal">{vehicle.makeModel}</p>
          </div>
        </div>
        <StatusBadge status={vehicle.status} size="sm" />
      </div>

      <div className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400">
        <span className="font-mono bg-neutral-100 dark:bg-neutral-800 px-2.5 py-0.5 rounded-lg border border-neutral-200/60 dark:border-neutral-700 text-[11px] font-semibold">
          {vehicle.licensePlate}
        </span>
        {vehicle.driverName && (
          <span className="truncate text-xs">Driver: <strong className="text-neutral-900 dark:text-neutral-100 font-semibold">{vehicle.driverName}</strong></span>
        )}
      </div>

      {/* Payload Capacity Progress */}
      <div className="flex flex-col gap-1.5 pt-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-neutral-500 text-[11px] font-medium">Capacity Utilization</span>
          <span className="font-mono font-bold text-neutral-900 dark:text-neutral-100 text-[11px] tabular-nums">
            {currentLoad.toLocaleString()} / {vehicle.maxWeightKg.toLocaleString()} kg ({loadPercent}%)
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              loadPercent > 90
                ? "bg-red-500"
                : loadPercent > 75
                ? "bg-amber-500"
                : "bg-[#2D3139] dark:bg-neutral-100"
            )}
            style={{ width: `${loadPercent}%` }}
          />
        </div>
      </div>

      {/* Telemetry Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-neutral-100 dark:border-neutral-800 text-[11px] text-neutral-500">
        <div className="flex items-center gap-1.5 font-mono">
          <Fuel className="h-3 w-3 text-neutral-700 dark:text-neutral-300" />
          <span>{vehicle.fuelPercent ?? 85}% Fuel</span>
        </div>
        <div className="flex items-center gap-1.5 font-mono">
          <Gauge className="h-3 w-3 text-neutral-400" />
          <span>{(vehicle.odometerKm ?? 45000).toLocaleString()} km</span>
        </div>
        <Link
          href={`/fleet/${vehicle.id}`}
          className="text-neutral-900 dark:text-neutral-100 font-semibold hover:underline text-xs"
        >
          Details →
        </Link>
      </div>
    </div>
  );
}
