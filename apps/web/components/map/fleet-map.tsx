"use client";

import React, { useState } from "react";
import {
  Truck,
  MapPin,
  AlertOctagon,
  X,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Layers,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export interface MapMarker {
  id: string;
  type: "VEHICLE" | "STOP" | "INCIDENT" | "BLOCKED_ROAD";
  x: number; // 0 to 100 percentage for scalable SVG grid
  y: number; // 0 to 100 percentage
  label: string;
  status?: string;
  vehicleCode?: string;
  orderRef?: string;
  stopNumber?: number;
}

export interface RouteLine {
  id: string;
  type: "COMMITTED" | "PROPOSED" | "COMPLETED";
  color: string;
  points: { x: number; y: number }[];
}

interface FleetMapProps {
  markers?: MapMarker[];
  routes?: RouteLine[];
  onMarkerClick?: (marker: MapMarker) => void;
  className?: string;
}

const DEFAULT_MARKERS: MapMarker[] = [
  // Depot
  { id: "M-DEPOT", type: "STOP", x: 15, y: 30, label: "Central Hub Depot", status: "DELIVERED", stopNumber: 0 },
  // TRK-01 stops & vehicle
  { id: "M-TRK01", type: "VEHICLE", x: 38, y: 42, label: "Truck Alpha (TRK-01)", vehicleCode: "TRK-01", status: "ACTIVE_VEHICLE" },
  { id: "M-STOP-1", type: "STOP", x: 28, y: 35, label: "Astra Tech Labs", orderRef: "ORD-1001", stopNumber: 1, status: "DELIVERED" },
  { id: "M-STOP-2", type: "STOP", x: 45, y: 48, label: "BioGen Research", orderRef: "ORD-1002", stopNumber: 2, status: "PENDING" },
  { id: "M-STOP-3", type: "STOP", x: 55, y: 32, label: "Vortex Quantum", orderRef: "ORD-1004", stopNumber: 3, status: "PENDING" },
  // TRK-02 stops & vehicle & incident
  { id: "M-TRK02", type: "VEHICLE", x: 62, y: 68, label: "Truck Beta (TRK-02)", vehicleCode: "TRK-02", status: "DELAYED_ROUTE" },
  { id: "M-STOP-4", type: "STOP", x: 40, y: 75, label: "Apex Logistics", orderRef: "ORD-1003", stopNumber: 1, status: "DELIVERED" },
  { id: "M-INCIDENT", type: "INCIDENT", x: 52, y: 70, label: "Road Closure (Bypass)", status: "DISRUPTION" },
  { id: "M-BLOCKED", type: "BLOCKED_ROAD", x: 50, y: 72, label: "Roadblock Barrier", status: "FAILED" },
];

const DEFAULT_ROUTES: RouteLine[] = [
  // TRK-01 Committed solid route (Task 128)
  {
    id: "R-TRK01",
    type: "COMMITTED",
    color: "#2563EB",
    points: [{ x: 15, y: 30 }, { x: 28, y: 35 }, { x: 38, y: 42 }, { x: 45, y: 48 }, { x: 55, y: 32 }],
  },
  // TRK-02 Proposed dashed replan route (Task 128)
  {
    id: "R-TRK02",
    type: "PROPOSED",
    color: "#7C3AED",
    points: [{ x: 15, y: 30 }, { x: 40, y: 75 }, { x: 62, y: 68 }, { x: 75, y: 80 }],
  },
];

export function FleetMap({
  markers = DEFAULT_MARKERS,
  routes = DEFAULT_ROUTES,
  onMarkerClick,
  className = "",
}: FleetMapProps) {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showLegend, setShowLegend] = useState(true);
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);

  const handleZoomIn = () => setZoomLevel((z) => Math.min(z + 0.25, 2.5));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(z - 0.25, 0.75));
  const handleRecenter = () => setZoomLevel(1);

  return (
    <div
      className={`relative w-full h-[540px] rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--map-canvas)] shadow-xs select-none ${className}`}
    >
      {/* Scalable Vector Map Canvas */}
      <div
        className="w-full h-full relative transition-transform duration-200 ease-out origin-center"
        style={{ transform: `scale(${zoomLevel})` }}
      >
        <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            {/* Road network grid patterns */}
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="var(--border-subtle)" strokeWidth="0.8" opacity="0.4" />
            </pattern>
          </defs>

          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Render Route Polylines (Task 128) */}
          {routes.map((route) => {
            const pathData = route.points.reduce((acc, pt, idx) => {
              const cmd = idx === 0 ? "M" : "L";
              return `${acc} ${cmd} ${pt.x}% ${pt.y}%`;
            }, "");

            const isProposed = route.type === "PROPOSED";

            return (
              <path
                key={route.id}
                d={pathData}
                fill="none"
                stroke={route.color}
                strokeWidth={isProposed ? "3.5" : "3"}
                strokeDasharray={isProposed ? "6 6" : undefined}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.85"
              />
            );
          })}
        </svg>

        {/* Map Interactive Markers (Tasks 126, 127, 129, 130) */}
        {markers.map((marker) => {
          const isSelected = selectedMarker?.id === marker.id;

          // 1. Vehicle Markers (28px circle, fill by state - Task 126)
          if (marker.type === "VEHICLE") {
            const isDelayed = marker.status === "DELAYED_ROUTE";
            const bgClass = isDelayed ? "bg-[var(--warning)]" : "bg-[var(--primary)]";

            return (
              <div
                key={marker.id}
                onClick={() => {
                  setSelectedMarker(marker);
                  if (onMarkerClick) onMarkerClick(marker);
                }}
                className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform hover:scale-125 z-20 group"
                style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
              >
                <div
                  className={`w-7 h-7 rounded-full ${bgClass} text-white flex items-center justify-center shadow-md border-2 border-white`}
                >
                  <Truck className="h-4 w-4" />
                </div>
                <div className="hidden group-hover:block absolute left-1/2 -translate-x-1/2 bottom-8 bg-[var(--surface-elevated)] border border-[var(--border)] px-2 py-1 rounded shadow-lg text-[10px] whitespace-nowrap font-semibold">
                  {marker.label}
                </div>
              </div>
            );
          }

          // 2. Delivery Stop Markers (24px numbered circle by state - Task 127)
          if (marker.type === "STOP") {
            const isDelivered = marker.status === "DELIVERED";
            const bgClass = isDelivered ? "bg-[var(--success)]" : "bg-[var(--surface-elevated)]";
            const textClass = isDelivered ? "text-white" : "text-[var(--foreground)]";

            return (
              <div
                key={marker.id}
                onClick={() => {
                  setSelectedMarker(marker);
                  if (onMarkerClick) onMarkerClick(marker);
                }}
                className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform hover:scale-125 z-10 group"
                style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
              >
                <div
                  className={`w-6 h-6 rounded-full ${bgClass} ${textClass} border-2 border-[var(--border-strong)] flex items-center justify-center font-mono text-[11px] font-bold shadow-xs`}
                >
                  {marker.stopNumber ?? "#"}
                </div>
                <div className="hidden group-hover:block absolute left-1/2 -translate-x-1/2 bottom-7 bg-[var(--surface-elevated)] border border-[var(--border)] px-2 py-1 rounded shadow-lg text-[10px] whitespace-nowrap font-medium">
                  {marker.label} {marker.orderRef ? `(${marker.orderRef})` : ""}
                </div>
              </div>
            );
          }

          // 3. Incident Location Marker (Task 130)
          if (marker.type === "INCIDENT") {
            return (
              <div
                key={marker.id}
                onClick={() => {
                  setSelectedMarker(marker);
                  if (onMarkerClick) onMarkerClick(marker);
                }}
                className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-30 animate-bounce group"
                style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
              >
                <div className="w-8 h-8 rounded-full bg-[var(--destructive)] text-white flex items-center justify-center shadow-lg border-2 border-white">
                  <AlertOctagon className="h-4 w-4" />
                </div>
                <div className="hidden group-hover:block absolute left-1/2 -translate-x-1/2 bottom-9 bg-[var(--surface-elevated)] border border-[var(--destructive-border)] px-2 py-1 rounded shadow-lg text-[10px] whitespace-nowrap text-[var(--destructive)] font-bold">
                  {marker.label}
                </div>
              </div>
            );
          }

          // 4. Blocked Road Marker (destructive with X marker - Task 129)
          if (marker.type === "BLOCKED_ROAD") {
            return (
              <div
                key={marker.id}
                className="absolute -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none"
                style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
              >
                <div className="w-6 h-6 rounded-md bg-[var(--destructive)] text-white flex items-center justify-center shadow-md">
                  <X className="h-4 w-4 stroke-[3]" />
                </div>
              </div>
            );
          }

          return null;
        })}
      </div>

      {/* Map Controls: Zoom, Recenter, Legend Toggle (Task 131) */}
      <div className="absolute top-3 right-3 z-30 flex flex-col gap-1.5 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg p-1 shadow-sm">
        <button
          type="button"
          onClick={handleZoomIn}
          className="p-1.5 hover:bg-[var(--surface-hover)] rounded text-[var(--foreground)] cursor-pointer"
          aria-label="Zoom in"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={handleZoomOut}
          className="p-1.5 hover:bg-[var(--surface-hover)] rounded text-[var(--foreground)] cursor-pointer"
          aria-label="Zoom out"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={handleRecenter}
          className="p-1.5 hover:bg-[var(--surface-hover)] rounded text-[var(--foreground)] cursor-pointer"
          aria-label="Recenter map"
        >
          <Maximize2 className="h-4 w-4" />
        </button>
      </div>

      {/* Map Legend Overlay (Task 131) */}
      {showLegend && (
        <div className="absolute bottom-6 left-3 z-30 bg-[var(--surface-elevated)]/95 backdrop-blur-xs border border-[var(--border)] rounded-lg p-3 shadow-md text-xs flex flex-col gap-1.5 min-w-[200px]">
          <div className="flex items-center justify-between pb-1 border-b border-[var(--border-subtle)]">
            <span className="font-semibold text-[11px] text-[var(--foreground)]">Map Symbol Legend</span>
            <button
              type="button"
              onClick={() => setShowLegend(false)}
              className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] cursor-pointer"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full bg-[var(--primary)] shrink-0" />
            <span>Active Vehicle (28px)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full bg-[var(--success)] shrink-0" />
            <span>Delivered Stop (24px)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full border border-[var(--border-strong)] bg-white shrink-0" />
            <span>Pending Stop</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-0.5 bg-[#2563EB] shrink-0" />
            <span>Committed Route (Solid)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-0.5 border-b border-dashed border-[#7C3AED] shrink-0" />
            <span>Proposed Replan (Dashed)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full bg-[var(--destructive)] shrink-0" />
            <span>Incident / Road Closure</span>
          </div>
        </div>
      )}

      {/* Permanent OpenStreetMap Attribution (Task 125, TRD OSM-1) */}
      <div className="absolute bottom-1 right-2 z-30 text-[10px] text-[var(--muted-foreground)] bg-[var(--surface)]/80 px-2 py-0.5 rounded pointer-events-auto">
        © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" className="underline hover:text-[var(--primary)]">OpenStreetMap</a> contributors · MapLibre GL
      </div>
    </div>
  );
}
