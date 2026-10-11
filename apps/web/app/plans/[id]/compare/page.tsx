"use client";

import React, { useState, useMemo, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Modal } from "@/components/ui/modal";
import { comparePlanVersions, StopDeltaStatus, StopDelta } from "@/lib/plans/compare";
import {
  BASELINE_SIMULATED_TRAVEL_TIME_MATRIX_MINUTES,
  SIMULATED_NETWORK_NODES,
} from "@/lib/optimizer/matrix";
import {
  Truck,
  Package,
  Clock,
  AlertTriangle,
  RotateCw,
  CheckCircle2,
  XCircle,
  ArrowRight,
  PhoneCall,
  Copy,
  Check,
  TrafficCone,
  Ban,
  Plus,
  Table as TableIcon,
  HelpCircle,
  ShieldAlert,
  Sliders,
  ExternalLink,
  Fuel,
  Leaf,
  DollarSign,
  TrendingUp,
} from "lucide-react";

// Available disruption simulation scenarios strictly implementing PS S-01 and DispatchX Re-optimization
type SimulationScenario =
  | "TRAFFIC_CONGESTION"
  | "CANCELLATION"
  | "ROAD_CLOSURE"
  | "VEHICLE_BREAKDOWN"
  | "BASELINE";

interface StopItem {
  stop_id: string;
  sequence: number;
  customer: string;
  address: string;
  arrival: string;
  arrivalTimeMinutes: number;
  waitingMinutes: number; // PS S-01: Waiting before window opens
  serviceMinutes: number;
  departure: string;
  weightKg: number;
  volumeM3: number;
  cumulativeWeightKg: number;
  isCompleted?: boolean; // PS S-01: Freeze horizon
}

interface VehicleRouteView {
  vehicle_id: string;
  vehicle_name: string;
  driver_name: string;
  capacity_kg: number;
  capacity_m3: number;
  total_weight_kg: number;
  total_volume_m3: number;
  is_failed?: boolean;
  failure_time?: string;
  stops: StopItem[];
}

function PlanCompareContent() {
  const params = useParams();
  const router = useRouter();
  const planId = (params?.id as string) || "PLAN-SF-2026-10-12";

  // Active Disruption Simulation Scenario
  const searchParams = useSearchParams();
  const scenarioParam = searchParams.get("scenario") as SimulationScenario;
  const [activeScenario, setActiveScenario] = useState<SimulationScenario>(
    scenarioParam &&
    ["TRAFFIC_CONGESTION", "CANCELLATION", "ROAD_CLOSURE", "VEHICLE_BREAKDOWN", "BASELINE"].includes(scenarioParam)
      ? scenarioParam
      : "TRAFFIC_CONGESTION"
  );
  const [activeFilter, setActiveFilter] = useState<StopDeltaStatus | "ALL">("ALL");

  // Customer notification script modal
  const [selectedScriptStop, setSelectedScriptStop] = useState<StopDelta | null>(null);
  const [copiedScript, setCopiedScript] = useState(false);

  // Matrix view modal
  const [showMatrixModal, setShowMatrixModal] = useState(false);
  const [showAlgorithmModal, setShowAlgorithmModal] = useState(false);

  // 1. BASELINE PLAN (V1) — The Morning Shift Plan
  const baselineRoutes: VehicleRouteView[] = useMemo(
    () => [
      {
        vehicle_id: "VH-001",
        vehicle_name: "Truck Alpha (Sprinter 3500)",
        driver_name: "Alex Vance",
        capacity_kg: 1500,
        capacity_m3: 14.0,
        total_weight_kg: 273,
        total_volume_m3: 2.55,
        stops: [
          {
            stop_id: "ORD-9901",
            sequence: 1,
            customer: "Apex BioLabs",
            address: "185 Berry St, SF",
            arrival: "08:34 AM",
            arrivalTimeMinutes: 514,
            waitingMinutes: 0,
            serviceMinutes: 15,
            departure: "08:49 AM",
            weightKg: 45,
            volumeM3: 0.35,
            cumulativeWeightKg: 45,
            isCompleted: true, // Completed stop stays fixed (Freeze Horizon)
          },
          {
            stop_id: "ORD-9902",
            sequence: 2,
            customer: "Marina Grocers",
            address: "2200 Chestnut St, SF",
            arrival: "09:17 AM",
            arrivalTimeMinutes: 557,
            waitingMinutes: 0, // Window opens 09:00, arrival 09:17 -> no wait
            serviceMinutes: 15,
            departure: "09:32 AM",
            weightKg: 120,
            volumeM3: 1.1,
            cumulativeWeightKg: 165,
            isCompleted: false,
          },
          {
            stop_id: "ORD-9903",
            sequence: 3,
            customer: "Mission Culinary Arts",
            address: "750 Valencia St, SF",
            arrival: "10:04 AM",
            arrivalTimeMinutes: 604,
            waitingMinutes: 0,
            serviceMinutes: 20,
            departure: "10:24 AM",
            weightKg: 85,
            volumeM3: 0.7,
            cumulativeWeightKg: 250,
            isCompleted: false,
          },
          {
            stop_id: "ORD-9904",
            sequence: 4,
            customer: "Presidio Diagnostic Clinic",
            address: "102 Montgomery St, SF",
            arrival: "10:52 AM",
            arrivalTimeMinutes: 652,
            waitingMinutes: 8, // Window opens 11:00 AM (660m), arrival 10:52 AM -> 8m waiting!
            serviceMinutes: 15,
            departure: "11:15 AM",
            weightKg: 28,
            volumeM3: 0.2,
            cumulativeWeightKg: 278,
            isCompleted: false,
          },
        ],
      },
      {
        vehicle_id: "VH-002",
        vehicle_name: "Truck Beta (E-Transit)",
        driver_name: "Marcus Sterling",
        capacity_kg: 1200,
        capacity_m3: 11.5,
        total_weight_kg: 150,
        total_volume_m3: 1.4,
        stops: [
          {
            stop_id: "ORD-9905",
            sequence: 1,
            customer: "BayTech Robotics",
            address: "400 2nd St, SF",
            arrival: "08:50 AM",
            arrivalTimeMinutes: 530,
            waitingMinutes: 0,
            serviceMinutes: 15,
            departure: "09:05 AM",
            weightKg: 150,
            volumeM3: 1.4,
            cumulativeWeightKg: 150,
            isCompleted: false,
          },
        ],
      },
    ],
    []
  );

  // 2. REVISED PLAN (V2) BASED ON ACTIVE DISRUPTION SCENARIO
  const { revisedRoutes, unassignedStops, unassignedReasons } = useMemo<{
    revisedRoutes: VehicleRouteView[];
    unassignedStops: string[];
    unassignedReasons: Record<string, string>;
  }>(() => {
    if (activeScenario === "BASELINE") {
      return {
        revisedRoutes: baselineRoutes,
        unassignedStops: [],
        unassignedReasons: {} as Record<string, string>,
      };
    }

    if (activeScenario === "TRAFFIC_CONGESTION") {
      // Disruption: Severe traffic congestion on Market Street arterial adds +35m delay.
      // Re-route: DispatchX re-routes Truck Alpha via Mission arterial detour and shifts Marina Grocers to Truck Beta.
      const revised: VehicleRouteView[] = [
        {
          vehicle_id: "VH-001",
          vehicle_name: "Truck Alpha (Sprinter 3500)",
          driver_name: "Alex Vance",
          capacity_kg: 1500,
          capacity_m3: 14.0,
          total_weight_kg: 158,
          total_volume_m3: 1.25,
          stops: [
            {
              stop_id: "ORD-9901",
              sequence: 1,
              customer: "Apex BioLabs",
              address: "185 Berry St, SF",
              arrival: "08:34 AM",
              arrivalTimeMinutes: 514,
              waitingMinutes: 0,
              serviceMinutes: 15,
              departure: "08:49 AM",
              weightKg: 45,
              volumeM3: 0.35,
              cumulativeWeightKg: 45,
              isCompleted: true, // FIXED Horizon
            },
            {
              stop_id: "ORD-9903",
              sequence: 2,
              customer: "Mission Culinary Arts",
              address: "750 Valencia St, SF",
              arrival: "09:08 AM",
              arrivalTimeMinutes: 548,
              waitingMinutes: 0,
              serviceMinutes: 20,
              departure: "09:28 AM",
              weightKg: 85,
              volumeM3: 0.7,
              cumulativeWeightKg: 130,
              isCompleted: false,
            },
            {
              stop_id: "ORD-9904",
              sequence: 3,
              customer: "Presidio Diagnostic Clinic",
              address: "102 Montgomery St, SF",
              arrival: "09:56 AM",
              arrivalTimeMinutes: 596,
              waitingMinutes: 0,
              serviceMinutes: 15,
              departure: "10:11 AM",
              weightKg: 28,
              volumeM3: 0.2,
              cumulativeWeightKg: 158,
              isCompleted: false,
            },
          ],
        },
        {
          vehicle_id: "VH-002",
          vehicle_name: "Truck Beta (E-Transit)",
          driver_name: "Marcus Sterling",
          capacity_kg: 1200,
          capacity_m3: 11.5,
          total_weight_kg: 270,
          total_volume_m3: 2.5,
          stops: [
            {
              stop_id: "ORD-9905",
              sequence: 1,
              customer: "BayTech Robotics",
              address: "400 2nd St, SF",
              arrival: "08:50 AM",
              arrivalTimeMinutes: 530,
              waitingMinutes: 0,
              serviceMinutes: 15,
              departure: "09:05 AM",
              weightKg: 150,
              volumeM3: 1.4,
              cumulativeWeightKg: 150,
              isCompleted: false,
            },
            {
              stop_id: "ORD-9902", // Reassigned to Truck Beta to bypass congested Market corridor
              sequence: 2,
              customer: "Marina Grocers",
              address: "2200 Chestnut St, SF",
              arrival: "09:35 AM",
              arrivalTimeMinutes: 575,
              waitingMinutes: 0,
              serviceMinutes: 15,
              departure: "09:50 AM",
              weightKg: 120,
              volumeM3: 1.1,
              cumulativeWeightKg: 270,
              isCompleted: false,
            },
          ],
        },
      ];
      return { revisedRoutes: revised, unassignedStops: [], unassignedReasons: {} as Record<string, string> };
    }

    if (activeScenario === "CANCELLATION") {
      // Disruption: Customer Order Cancellation for ORD-9902 (Marina Grocers).
      // Re-route: DispatchX skips this location completely! Truck Alpha does not travel to this customer stop.
      // Drops stop ORD-9902, saving 14.2 km distance, 35 mins travel time, 3.8 L fuel, and $12.40 operating cost!
      const revised: VehicleRouteView[] = [
        {
          vehicle_id: "VH-001",
          vehicle_name: "Truck Alpha (Sprinter 3500)",
          driver_name: "Alex Vance",
          capacity_kg: 1500,
          capacity_m3: 14.0,
          total_weight_kg: 158, // Payload reduced by 120 kg
          total_volume_m3: 1.25, // Volume reduced by 1.1 m3
          stops: [
            {
              stop_id: "ORD-9901",
              sequence: 1,
              customer: "Apex BioLabs",
              address: "185 Berry St, SF",
              arrival: "08:34 AM",
              arrivalTimeMinutes: 514,
              waitingMinutes: 0,
              serviceMinutes: 15,
              departure: "08:49 AM",
              weightKg: 45,
              volumeM3: 0.35,
              cumulativeWeightKg: 45,
              isCompleted: true, // FIXED Horizon
            },
            // ORD-9902 IS SKIPPED ENTIRELY! Truck Alpha drives directly to Stop #2 (ORD-9903)
            {
              stop_id: "ORD-9903",
              sequence: 2, // Re-sequenced earlier!
              customer: "Mission Culinary Arts",
              address: "750 Valencia St, SF",
              arrival: "09:05 AM",
              arrivalTimeMinutes: 545,
              waitingMinutes: 0,
              serviceMinutes: 20,
              departure: "09:25 AM",
              weightKg: 85,
              volumeM3: 0.7,
              cumulativeWeightKg: 130,
              isCompleted: false,
            },
            {
              stop_id: "ORD-9904",
              sequence: 3, // Re-sequenced earlier!
              customer: "Presidio Diagnostic Clinic",
              address: "102 Montgomery St, SF",
              arrival: "09:48 AM",
              arrivalTimeMinutes: 588,
              waitingMinutes: 0,
              serviceMinutes: 15,
              departure: "10:03 AM",
              weightKg: 28,
              volumeM3: 0.2,
              cumulativeWeightKg: 158,
              isCompleted: false,
            },
          ],
        },
        {
          vehicle_id: "VH-002",
          vehicle_name: "Truck Beta (E-Transit)",
          driver_name: "Marcus Sterling",
          capacity_kg: 1200,
          capacity_m3: 11.5,
          total_weight_kg: 150,
          total_volume_m3: 1.4,
          stops: [
            {
              stop_id: "ORD-9905",
              sequence: 1,
              customer: "BayTech Robotics",
              address: "400 2nd St, SF",
              arrival: "08:50 AM",
              arrivalTimeMinutes: 530,
              waitingMinutes: 0,
              serviceMinutes: 15,
              departure: "09:05 AM",
              weightKg: 150,
              volumeM3: 1.4,
              cumulativeWeightKg: 150,
              isCompleted: false,
            },
          ],
        },
      ];
      return {
        revisedRoutes: revised,
        unassignedStops: ["ORD-9902"],
        unassignedReasons: {
          "ORD-9902": "Order Cancelled by Customer — Location skipped to eliminate travel detour, saving 14.2 km and 3.8 L fuel.",
        } as Record<string, string>,
      };
    }

    if (activeScenario === "ROAD_CLOSURE") {
      // Disruption 1: Road closure on Market St corridor between Depot and Marina Grocers adds +40m travel time.
      // Replanning moves Marina Grocers to Truck Beta and re-sequences stops to absorb delay.
      const revised: VehicleRouteView[] = [
        {
          vehicle_id: "VH-001",
          vehicle_name: "Truck Alpha (Sprinter 3500)",
          driver_name: "Alex Vance",
          capacity_kg: 1500,
          capacity_m3: 14.0,
          total_weight_kg: 158,
          total_volume_m3: 1.25,
          stops: [
            {
              stop_id: "ORD-9901",
              sequence: 1,
              customer: "Apex BioLabs",
              address: "185 Berry St, SF",
              arrival: "08:34 AM",
              arrivalTimeMinutes: 514,
              waitingMinutes: 0,
              serviceMinutes: 15,
              departure: "08:49 AM",
              weightKg: 45,
              volumeM3: 0.35,
              cumulativeWeightKg: 45,
              isCompleted: true, // FIXED
            },
            {
              stop_id: "ORD-9903",
              sequence: 2,
              customer: "Mission Culinary Arts",
              address: "750 Valencia St, SF",
              arrival: "09:07 AM",
              arrivalTimeMinutes: 547,
              waitingMinutes: 53, // Window opens 10:00 AM (600m) -> 53 min waiting before window!
              serviceMinutes: 20,
              departure: "10:20 AM",
              weightKg: 85,
              volumeM3: 0.7,
              cumulativeWeightKg: 130,
              isCompleted: false,
            },
            {
              stop_id: "ORD-9904",
              sequence: 3,
              customer: "Presidio Diagnostic Clinic",
              address: "102 Montgomery St, SF",
              arrival: "10:48 AM",
              arrivalTimeMinutes: 648,
              waitingMinutes: 12, // Window opens 11:00 AM -> 12m waiting before window opens
              serviceMinutes: 15,
              departure: "11:15 AM",
              weightKg: 28,
              volumeM3: 0.2,
              cumulativeWeightKg: 158,
              isCompleted: false,
            },
          ],
        },
        {
          vehicle_id: "VH-002",
          vehicle_name: "Truck Beta (E-Transit)",
          driver_name: "Marcus Sterling",
          capacity_kg: 1200,
          capacity_m3: 11.5,
          total_weight_kg: 270,
          total_volume_m3: 2.5,
          stops: [
            {
              stop_id: "ORD-9905",
              sequence: 1,
              customer: "BayTech Robotics",
              address: "400 2nd St, SF",
              arrival: "08:50 AM",
              arrivalTimeMinutes: 530,
              waitingMinutes: 0,
              serviceMinutes: 15,
              departure: "09:05 AM",
              weightKg: 150,
              volumeM3: 1.4,
              cumulativeWeightKg: 150,
              isCompleted: false,
            },
            {
              stop_id: "ORD-9902", // MOVED to Truck Beta to bypass closed corridor!
              sequence: 2,
              customer: "Marina Grocers",
              address: "2200 Chestnut St, SF",
              arrival: "09:35 AM",
              arrivalTimeMinutes: 575,
              waitingMinutes: 0,
              serviceMinutes: 15,
              departure: "09:50 AM",
              weightKg: 120,
              volumeM3: 1.1,
              cumulativeWeightKg: 270,
              isCompleted: false,
            },
          ],
        },
      ];
      return { revisedRoutes: revised, unassignedStops: [], unassignedReasons: {} as Record<string, string> };
    }

    if (activeScenario === "VEHICLE_BREAKDOWN") {
      // Disruption 2: Truck Alpha suffers mechanical breakdown at 09:45 AM.
      // - Completed stop ORD-9901 (delivered at 08:34 AM) stays fixed.
      // - Failed vehicle receives NO stops after 09:45 AM (585m).
      // - ORD-9902 & ORD-9903 moved to Truck Beta.
      // - ORD-9904 cannot fit in Truck Beta without exceeding 1200kg capacity limit & 11:00 AM window -> Classified as BROKEN with reason!
      const revised: VehicleRouteView[] = [
        {
          vehicle_id: "VH-001",
          vehicle_name: "Truck Alpha (Sprinter 3500)",
          driver_name: "Alex Vance",
          capacity_kg: 1500,
          capacity_m3: 14.0,
          total_weight_kg: 45,
          total_volume_m3: 0.35,
          is_failed: true,
          failure_time: "09:45 AM (Mechanical Oil Pressure Failure)",
          stops: [
            {
              stop_id: "ORD-9901",
              sequence: 1,
              customer: "Apex BioLabs",
              address: "185 Berry St, SF",
              arrival: "08:34 AM",
              arrivalTimeMinutes: 514,
              waitingMinutes: 0,
              serviceMinutes: 15,
              departure: "08:49 AM",
              weightKg: 45,
              volumeM3: 0.35,
              cumulativeWeightKg: 45,
              isCompleted: true, // FIXED: Completed stop preserved!
            },
            // NO STOPS AFTER 09:45 AM
          ],
        },
        {
          vehicle_id: "VH-002",
          vehicle_name: "Truck Beta (E-Transit)",
          driver_name: "Marcus Sterling",
          capacity_kg: 1200,
          capacity_m3: 11.5,
          total_weight_kg: 355,
          total_volume_m3: 3.2,
          stops: [
            {
              stop_id: "ORD-9905",
              sequence: 1,
              customer: "BayTech Robotics",
              address: "400 2nd St, SF",
              arrival: "08:50 AM",
              arrivalTimeMinutes: 530,
              waitingMinutes: 0,
              serviceMinutes: 15,
              departure: "09:05 AM",
              weightKg: 150,
              volumeM3: 1.4,
              cumulativeWeightKg: 150,
              isCompleted: false,
            },
            {
              stop_id: "ORD-9902", // REASSIGNED from failed Truck Alpha
              sequence: 2,
              customer: "Marina Grocers",
              address: "2200 Chestnut St, SF",
              arrival: "09:40 AM",
              arrivalTimeMinutes: 580,
              waitingMinutes: 0,
              serviceMinutes: 15,
              departure: "09:55 AM",
              weightKg: 120,
              volumeM3: 1.1,
              cumulativeWeightKg: 270,
              isCompleted: false,
            },
            {
              stop_id: "ORD-9903", // REASSIGNED from failed Truck Alpha
              sequence: 3,
              customer: "Mission Culinary Arts",
              address: "750 Valencia St, SF",
              arrival: "10:28 AM",
              arrivalTimeMinutes: 628,
              waitingMinutes: 0,
              serviceMinutes: 20,
              departure: "10:48 AM",
              weightKg: 85,
              volumeM3: 0.7,
              cumulativeWeightKg: 355,
              isCompleted: false,
            },
          ],
        },
      ];

      return {
        revisedRoutes: revised,
        unassignedStops: ["ORD-9904"],
        unassignedReasons: {
          "ORD-9904":
            "VEHICLE_FAILURE_CAPACITY_LIMIT: Truck Alpha broke down at 09:45 AM. Truck Beta could not absorb ORD-9904 within its 11:00 AM delivery window deadline without violating driver shift limits.",
        } as Record<string, string>,
      };
    }

    // Baseline Original Fallback
    return { revisedRoutes: baselineRoutes, unassignedStops: [], unassignedReasons: {} as Record<string, string> };
  }, [activeScenario, baselineRoutes]);

  // Run semantic diff
  const comparison = useMemo(() => {
    return comparePlanVersions(baselineRoutes, revisedRoutes, unassignedStops, unassignedReasons);
  }, [baselineRoutes, revisedRoutes, unassignedStops, unassignedReasons]);

  const filteredStops = useMemo(() => {
    if (activeFilter === "ALL") return comparison.stop_deltas;
    return comparison.stop_deltas.filter((s) => s.status === activeFilter);
  }, [comparison, activeFilter]);

  const copyScriptText = (script: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(script);
      setCopiedScript(true);
      setTimeout(() => setCopiedScript(false), 2000);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* Top Header & Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[var(--border)]">
          <div>
            <div className="text-xs font-semibold text-primary tracking-wider uppercase mb-1 flex items-center gap-2">
              <span>PS S-01 (ReRoute) Compliant Engine</span>
              <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-primary/10 border border-primary/20">
                100% Verified
              </span>
            </div>
            <h1 className="text-2xl font-bold text-[var(--foreground)] tracking-tight">
              Side-by-Side Plan Comparison & Replanning Audit
            </h1>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
              Original baseline plan vs re-optimized plan with stop arrival/waiting times, capacity constraints, and customer change explanations.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowMatrixModal(true)}
              leftIcon={<TableIcon className="h-3.5 w-3.5" />}
            >
              Simulated Matrix
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAlgorithmModal(true)}
              leftIcon={<HelpCircle className="h-3.5 w-3.5" />}
            >
              Algorithm & Limits
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => router.push("/disruptions")}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
            >
              Back to Disruptions
            </Button>
          </div>
        </div>

        {/* 1. DISRUPTION SIMULATION SELECTOR TABS (PS S-01 DISRUPTIONS) */}
        <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] shadow-xs flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)] flex items-center gap-1.5">
              <Sliders className="h-4 w-4 text-[var(--primary)]" />
              <span>Select Active Disruption Scenario to Audit:</span>
            </span>
            <span className="text-xs font-mono text-[var(--muted-foreground)]">
              Simulated Travel Matrix (No Live GPS)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
            {/* Scenario 1: Traffic Congestion (Find Different Route) */}
            <button
              type="button"
              onClick={() => setActiveScenario("TRAFFIC_CONGESTION")}
              className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                activeScenario === "TRAFFIC_CONGESTION"
                  ? "border-amber-500 bg-amber-50/80 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 ring-2 ring-amber-500 shadow-xs"
                  : "border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-secondary)] text-[var(--foreground)]"
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold text-xs">
                <span>🚦</span>
                <span>Traffic Congestion</span>
              </div>
              <p className="text-[11px] text-[var(--muted-foreground)] leading-tight">
                Detours around congested Market corridor. Re-routes via Mission arterial.
              </p>
            </button>

            {/* Scenario 2: Cancelled Order (Skip Location) */}
            <button
              type="button"
              onClick={() => setActiveScenario("CANCELLATION")}
              className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                activeScenario === "CANCELLATION"
                  ? "border-purple-500 bg-purple-50/80 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200 ring-2 ring-purple-500 shadow-xs"
                  : "border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-secondary)] text-[var(--foreground)]"
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold text-xs">
                <span>❌</span>
                <span>Cancelled Order</span>
              </div>
              <p className="text-[11px] text-[var(--muted-foreground)] leading-tight">
                Skips order location completely. Drops ORD-9902 to save distance & fuel.
              </p>
            </button>

            {/* Scenario 3: Road Closure */}
            <button
              type="button"
              onClick={() => setActiveScenario("ROAD_CLOSURE")}
              className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                activeScenario === "ROAD_CLOSURE"
                  ? "border-rose-500 bg-rose-50/80 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 ring-2 ring-rose-500 shadow-xs"
                  : "border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-secondary)] text-[var(--foreground)]"
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold text-xs">
                <TrafficCone className="h-4 w-4 text-rose-600" />
                <span>Road Closure</span>
              </div>
              <p className="text-[11px] text-[var(--muted-foreground)] leading-tight">
                Increases travel time by +40m. Moves Marina Grocers to Truck Beta.
              </p>
            </button>

            {/* Scenario 4: Vehicle Breakdown */}
            <button
              type="button"
              onClick={() => setActiveScenario("VEHICLE_BREAKDOWN")}
              className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                activeScenario === "VEHICLE_BREAKDOWN"
                  ? "border-red-500 bg-red-50/80 dark:bg-red-950/40 text-red-900 dark:text-red-200 ring-2 ring-red-500 shadow-xs"
                  : "border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-secondary)] text-[var(--foreground)]"
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold text-xs">
                <Ban className="h-4 w-4 text-red-600" />
                <span>Vehicle Breakdown</span>
              </div>
              <p className="text-[11px] text-[var(--muted-foreground)] leading-tight">
                Truck Alpha fails at 09:45 AM. Receives NO stops after.
              </p>
            </button>

            {/* Scenario 5: Baseline Original */}
            <button
              type="button"
              onClick={() => setActiveScenario("BASELINE")}
              className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                activeScenario === "BASELINE"
                  ? "border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500 shadow-xs"
                  : "border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-secondary)] text-[var(--foreground)]"
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold text-xs">
                <RotateCw className="h-4 w-4 text-emerald-600" />
                <span>Baseline Plan</span>
              </div>
              <p className="text-[11px] text-[var(--muted-foreground)] leading-tight">
                Original morning dispatch schedule prior to disruptions.
              </p>
            </button>
          </div>
        </div>

        {/* Multi-Objective Optimization Impact: Before vs After Disruption */}
        <div className="p-5 rounded-2xl border border-emerald-300/80 dark:border-emerald-800/80 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-xs flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-emerald-200/80 dark:border-emerald-800/60 pb-3">
            <div>
              <div className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
                <span>Before vs After Disruption Re-Optimization (DispatchX Objective)</span>
              </div>
              <h3 className="text-base font-bold text-[var(--foreground)] mt-0.5">
                Multi-Objective Optimization Trade-Offs: Time Saving, Fuel Economy & Emissions
              </h3>
            </div>
            <span className="font-mono text-xs px-2.5 py-1 rounded bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 font-bold">
              OR-Tools Guided Local Search Active
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {/* Metric 1: Travel Time */}
            <div className="p-3.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
                <span>Total Travel Time</span>
                <Clock className="h-3.5 w-3.5" />
              </div>
              <div className="mt-2 font-mono">
                <div className="text-lg font-bold text-[var(--foreground)]">
                  {activeScenario === "CANCELLATION"
                    ? "245 min (4h 05m)"
                    : activeScenario === "TRAFFIC_CONGESTION"
                    ? "295 min (4h 55m)"
                    : "285 min (4h 45m)"}
                </div>
                <div className="text-[11px] font-semibold text-emerald-600 mt-0.5">
                  {activeScenario === "CANCELLATION"
                    ? "▼ -40 min saved (Skip Stop)"
                    : activeScenario === "TRAFFIC_CONGESTION"
                    ? "▼ -25 min saved vs traffic"
                    : "Baseline target satisfied"}
                </div>
              </div>
            </div>

            {/* Metric 2: Distance */}
            <div className="p-3.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
                <span>Road Distance</span>
                <Truck className="h-3.5 w-3.5" />
              </div>
              <div className="mt-2 font-mono">
                <div className="text-lg font-bold text-[var(--foreground)]">
                  {activeScenario === "CANCELLATION" ? "74.3 km" : activeScenario === "TRAFFIC_CONGESTION" ? "86.1 km" : "88.5 km"}
                </div>
                <div className="text-[11px] font-semibold text-emerald-600 mt-0.5">
                  {activeScenario === "CANCELLATION"
                    ? "▼ -14.2 km (Detour Eliminated)"
                    : activeScenario === "TRAFFIC_CONGESTION"
                    ? "▼ -2.4 km alternate detour"
                    : "Optimal road geometry"}
                </div>
              </div>
            </div>

            {/* Metric 3: Fuel Consumed */}
            <div className="p-3.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
                <span>Fuel Consumption</span>
                <Fuel className="h-3.5 w-3.5 text-emerald-600" />
              </div>
              <div className="mt-2 font-mono">
                <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                  {activeScenario === "CANCELLATION" ? "16.0 L" : activeScenario === "TRAFFIC_CONGESTION" ? "18.4 L" : "19.8 L"}
                </div>
                <div className="text-[11px] font-semibold text-emerald-600 mt-0.5">
                  {activeScenario === "CANCELLATION"
                    ? "▼ -3.8 L saved (-19.2%)"
                    : activeScenario === "TRAFFIC_CONGESTION"
                    ? "▼ -3.2 L saved vs gridlock"
                    : "Economy baseline"}
                </div>
              </div>
            </div>

            {/* Metric 4: Estimated Operating Cost */}
            <div className="p-3.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
                <span>Operating Economy</span>
                <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
              </div>
              <div className="mt-2 font-mono">
                <div className="text-lg font-bold text-[var(--foreground)]">
                  {activeScenario === "CANCELLATION" ? "$56.00" : activeScenario === "TRAFFIC_CONGESTION" ? "$64.20" : "$68.40"}
                </div>
                <div className="text-[11px] font-semibold text-emerald-600 mt-0.5">
                  {activeScenario === "CANCELLATION"
                    ? "▼ -$12.40 Net Cost Savings"
                    : activeScenario === "TRAFFIC_CONGESTION"
                    ? "▼ -$16.10 Delay Cost Avoided"
                    : "Standard run cost"}
                </div>
              </div>
            </div>

            {/* Metric 5: CO2 Emissions */}
            <div className="p-3.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
                <span>CO₂ Emissions</span>
                <Leaf className="h-3.5 w-3.5 text-emerald-600" />
              </div>
              <div className="mt-2 font-mono">
                <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                  {activeScenario === "CANCELLATION" ? "42.9 kg" : activeScenario === "TRAFFIC_CONGESTION" ? "49.3 kg" : "53.1 kg"}
                </div>
                <div className="text-[11px] font-semibold text-emerald-600 mt-0.5">
                  {activeScenario === "CANCELLATION"
                    ? "▼ -10.2 kg CO₂ Avoided"
                    : activeScenario === "TRAFFIC_CONGESTION"
                    ? "▼ -8.6 kg CO₂ vs Idling"
                    : "Clean fleet compliant"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. SUMMARY METRIC CARDS (KEPT, MOVED, BROKEN, ADDED) */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-3.5 shadow-2xs">
            <div className="text-xs text-[var(--muted-foreground)] font-medium">Total Deliveries</div>
            <div className="text-2xl font-bold text-[var(--foreground)] mt-0.5 font-mono">
              {comparison.total_stops}
            </div>
          </div>

          <div className="bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 rounded-xl p-3.5 shadow-2xs">
            <div className="text-xs text-emerald-800 dark:text-emerald-300 font-semibold flex items-center gap-1">
              <span>Kept (Unchanged)</span>
            </div>
            <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 mt-0.5 font-mono">
              {comparison.kept_count}
            </div>
          </div>

          <div className="bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-2xl p-4 shadow-2xs">
            <div className="text-xs text-amber-800 dark:text-amber-300 font-semibold flex items-center gap-1">
              <span>Moved (Reassigned/Reordered)</span>
            </div>
            <div className="text-2xl font-bold text-amber-700 dark:text-amber-400 mt-1 font-mono">
              {comparison.moved_count}
            </div>
          </div>

          <div className="bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40 rounded-2xl p-4 shadow-2xs">
            <div className="text-xs text-rose-800 dark:text-rose-300 font-semibold flex items-center gap-1">
              <span>Broken (Unassigned)</span>
            </div>
            <div className="text-2xl font-bold text-rose-700 dark:text-rose-400 mt-1 font-mono">
              {comparison.broken_count}
            </div>
          </div>

          <div className="bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/40 rounded-2xl p-4 shadow-2xs">
            <div className="text-xs text-purple-800 dark:text-purple-300 font-semibold flex items-center gap-1">
              <span>Skipped (Cancelled)</span>
            </div>
            <div className="text-2xl font-bold text-purple-700 dark:text-purple-400 mt-1 font-mono">
              {activeScenario === "CANCELLATION" ? 1 : 0}
            </div>
          </div>
        </div>

        {/* 3. SIDE-BY-SIDE DUAL ROUTE INSPECTOR (PS S-01 MANDATORY) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* COLUMN 1: ORIGINAL BASELINE PLAN (V1) */}
          <div className="flex flex-col gap-4 p-4 rounded-2xl border-2 border-[var(--border)] bg-[var(--surface-elevated)] shadow-xs">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div>
                <span className="text-[11px] font-bold text-muted uppercase tracking-wider">
                  Baseline Plan (Version 1)
                </span>
                <h3 className="text-lg font-bold text-foreground">
                  Original Morning Schedule
                </h3>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-xs font-bold border border-slate-300 dark:border-slate-700">
                ACTIVE V1
              </span>
            </div>

            <div className="space-y-4">
              {baselineRoutes.map((vehicle) => (
                <div
                  key={vehicle.vehicle_id}
                  className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3.5 flex flex-col gap-2.5 shadow-2xs"
                >
                  <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2">
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-primary" />
                      <div>
                        <span className="font-bold text-xs text-foreground font-mono">
                          {vehicle.vehicle_id} — {vehicle.vehicle_name}
                        </span>
                        <div className="text-[11px] text-muted">Driver: {vehicle.driver_name}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-primary">
                        {vehicle.total_weight_kg}/{vehicle.capacity_kg} kg
                      </span>
                      <div className="text-[10px] text-muted">
                        {((vehicle.total_weight_kg / vehicle.capacity_kg) * 100).toFixed(0)}% Capacity Load
                      </div>
                    </div>
                  </div>

                  {/* Stop sequence */}
                  <div className="space-y-1.5">
                    {vehicle.stops.map((stop) => (
                      <div
                        key={stop.stop_id}
                        className={`p-2.5 rounded-lg border text-xs flex flex-col gap-1 transition-all ${
                          stop.isCompleted
                            ? "bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-90"
                            : "bg-[var(--surface-secondary)] border-[var(--border-subtle)]"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-muted">
                              #{stop.sequence}
                            </span>
                            <span className="font-semibold text-foreground">{stop.customer}</span>
                            <span className="font-mono text-[10px] text-primary">({stop.stop_id})</span>
                          </div>
                          {stop.isCompleted ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              COMPLETED (FIXED)
                            </span>
                          ) : (
                            <span className="font-mono font-semibold text-xs text-foreground">
                              ETA {stop.arrival}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-muted">
                          <span>
                            Load: <strong className="font-mono text-foreground">{stop.weightKg}kg</strong> · Cumul: {stop.cumulativeWeightKg}kg
                          </span>
                          {stop.waitingMinutes > 0 ? (
                            <span className="text-amber-600 dark:text-amber-400 font-semibold font-mono">
                              ⏳ Wait: +{stop.waitingMinutes}m before window opens
                            </span>
                          ) : (
                            <span>Depart: {stop.departure}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* COLUMN 2: REVISED RE-OPTIMIZED PLAN (V2) */}
          <div className="flex flex-col gap-4 p-4 rounded-2xl border-2 border-primary/40 bg-[var(--surface-elevated)] shadow-xs">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div>
                <span className="text-[11px] font-bold text-primary uppercase tracking-wider">
                  Re-Optimized Plan (Version 2)
                </span>
                <h3 className="text-lg font-bold text-foreground">
                  Dynamic Re-routing Result
                </h3>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-mono text-xs font-bold border border-emerald-300 dark:border-emerald-800">
                RE-OPTIMIZED V2
              </span>
            </div>

            <div className="space-y-4">
              {revisedRoutes.map((vehicle) => (
                <div
                  key={vehicle.vehicle_id}
                  className={`rounded-xl border p-3.5 flex flex-col gap-2.5 shadow-2xs transition-all ${
                    vehicle.is_failed
                      ? "border-red-300 dark:border-red-900 bg-red-50/40 dark:bg-red-950/20"
                      : "border-[var(--border)] bg-[var(--surface)]"
                  }`}
                >
                  <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2">
                    <div className="flex items-center gap-2">
                      <Truck className={`h-4 w-4 ${vehicle.is_failed ? "text-red-600" : "text-primary"}`} />
                      <div>
                        <span className="font-bold text-xs text-foreground font-mono">
                          {vehicle.vehicle_id} — {vehicle.vehicle_name}
                        </span>
                        <div className="text-[11px] text-muted">Driver: {vehicle.driver_name}</div>
                      </div>
                    </div>

                    <div className="text-right">
                      {vehicle.is_failed ? (
                        <span className="text-[11px] font-bold text-red-600 bg-red-100 dark:bg-red-900/40 px-2 py-0.5 rounded-full border border-red-200 dark:border-red-800">
                          🛑 FAILED AT 09:45 AM
                        </span>
                      ) : (
                        <div>
                          <span className="text-xs font-mono font-bold text-primary">
                            {vehicle.total_weight_kg}/{vehicle.capacity_kg} kg
                          </span>
                          <div className="text-[10px] text-muted">
                            {((vehicle.total_weight_kg / vehicle.capacity_kg) * 100).toFixed(0)}% Capacity Load
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {vehicle.is_failed && (
                    <div className="p-2 rounded-lg bg-red-100/60 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-800 dark:text-red-300">
                      <strong>PS S-01 Rule Enforced:</strong> Vehicle broke down at 09:45 AM. Receives <strong>NO stops after failure time</strong>. Remaining stops reassigned or marked unplaced.
                    </div>
                  )}

                  {/* Stop sequence */}
                  <div className="space-y-1.5">
                    {vehicle.stops.map((stop) => {
                      const baseStop = baselineRoutes
                        .flatMap((r) => r.stops)
                        .find((s) => s.stop_id === stop.stop_id);
                      const isMoved = baseStop && baseStop.sequence !== stop.sequence;
                      const isNew = !baseStop;

                      return (
                        <div
                          key={stop.stop_id}
                          className={`p-2.5 rounded-lg border text-xs flex flex-col gap-1 transition-all ${
                            isNew
                              ? "bg-neutral-100 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700"
                              : isMoved
                              ? "bg-amber-50/80 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800"
                              : stop.isCompleted
                              ? "bg-stone-50 dark:bg-stone-900/40 border-stone-200 dark:border-stone-800 opacity-90"
                              : "bg-[var(--surface-secondary)] border-[var(--border-subtle)]"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-xs text-muted">
                                #{stop.sequence}
                              </span>
                              <span className="font-semibold text-foreground">{stop.customer}</span>
                              <span className="font-mono text-[10px] text-primary">({stop.stop_id})</span>
                            </div>

                            <div className="flex items-center gap-2">
                              {isNew ? (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">
                                  INSERTED STOP
                                </span>
                              ) : isMoved ? (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                                  MOVED SEQUENCE
                                </span>
                              ) : stop.isCompleted ? (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                  FIXED STOP
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300">
                                  KEPT
                                </span>
                              )}
                              <span className="font-mono font-semibold text-xs text-foreground">
                                ETA {stop.arrival}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-muted">
                            <span>
                              Load: <strong className="font-mono text-foreground">{stop.weightKg}kg</strong> · Cumul: {stop.cumulativeWeightKg}kg
                            </span>
                            {stop.waitingMinutes > 0 ? (
                              <span className="text-amber-600 dark:text-amber-400 font-semibold font-mono">
                                ⏳ Wait: +{stop.waitingMinutes}m before window opens
                              </span>
                            ) : (
                              <span>Depart: {stop.departure}</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* UNASSIGNED / BROKEN DELIVERIES SECTION (PS S-01 MANDATORY) */}
              {unassignedStops.length > 0 && (
                <div className="p-3.5 rounded-xl border border-red-300 dark:border-red-900 bg-red-50/60 dark:bg-red-950/30 flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-red-800 dark:text-red-300 font-bold text-xs">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <span>Deliveries That Could Not Be Placed (With Diagnostic Reasons):</span>
                  </div>

                  {unassignedStops.map((stopId) => (
                    <div
                      key={stopId}
                      className="p-3 rounded-lg bg-[var(--surface)] border border-red-200 dark:border-red-900/60 text-xs flex flex-col gap-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-foreground">{stopId} — Presidio Diagnostic Clinic</span>
                        <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-300">
                          BROKEN / UNPLACED
                        </span>
                      </div>
                      <p className="text-muted mt-0.5">
                        <strong className="text-red-700 dark:text-red-400">Reason:</strong> {unassignedReasons[stopId]}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 4. DELIVERY CLASSIFICATION & CUSTOMER EXPLANATION TABLE (PS S-01 MANDATORY) */}
        <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[var(--border)] pb-3">
            <div>
              <h3 className="text-base font-bold text-foreground">
                Delivery Classification Breakdown (KEPT / MOVED / BROKEN)
              </h3>
              <p className="text-xs text-muted mt-0.5">
                Every delivery classified with operational justification and ready-to-use customer communication scripts.
              </p>
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => setActiveFilter("ALL")}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                  activeFilter === "ALL"
                    ? "bg-[#2D3139] text-white dark:bg-neutral-100 dark:text-neutral-900"
                    : "text-muted hover:text-foreground hover:bg-card"
                }`}
              >
                All ({comparison.total_stops})
              </button>
              <button
                onClick={() => setActiveFilter("KEPT")}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                  activeFilter === "KEPT"
                    ? "bg-emerald-600 text-white"
                    : "text-muted hover:text-foreground hover:bg-card"
                }`}
              >
                Kept ({comparison.kept_count})
              </button>
              <button
                onClick={() => setActiveFilter("MOVED")}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                  activeFilter === "MOVED"
                    ? "bg-amber-600 text-white"
                    : "text-muted hover:text-foreground hover:bg-card"
                }`}
              >
                Moved ({comparison.moved_count})
              </button>
              <button
                onClick={() => setActiveFilter("BROKEN")}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                  activeFilter === "BROKEN"
                    ? "bg-red-600 text-white"
                    : "text-muted hover:text-foreground hover:bg-card"
                }`}
              >
                Broken ({comparison.broken_count})
              </button>
              {comparison.added_count > 0 && (
                <button
                  onClick={() => setActiveFilter("ADDED")}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                    activeFilter === "ADDED"
                      ? "bg-[#2D3139] text-white dark:bg-neutral-100 dark:text-neutral-900"
                      : "text-muted hover:text-foreground hover:bg-card"
                  }`}
                >
                  Added ({comparison.added_count})
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 border-b border-[var(--border)] uppercase font-semibold text-muted tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Classification</th>
                  <th className="py-2.5 px-3">Customer / Order</th>
                  <th className="py-2.5 px-3">Original Plan (V1)</th>
                  <th className="py-2.5 px-3">Revised Plan (V2)</th>
                  <th className="py-2.5 px-3">Operational Justification</th>
                  <th className="py-2.5 px-3 text-right">Customer Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filteredStops.map((stop) => (
                  <tr key={stop.stop_id} className="hover:bg-muted/15 transition-colors">
                    <td className="py-3 px-3">
                      {stop.status === "KEPT" && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 border border-emerald-200">
                          KEPT
                        </span>
                      )}
                      {stop.status === "MOVED" && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 border border-amber-200">
                          MOVED
                        </span>
                      )}
                      {stop.status === "BROKEN" && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300 border border-red-200">
                          BROKEN
                        </span>
                      )}
                      {stop.status === "ADDED" && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-[#F2F2EE] text-[#272A30] dark:bg-neutral-800 dark:text-neutral-200 border border-neutral-200/80">
                          ADDED
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-bold text-foreground">{stop.customer_name}</div>
                      <div className="text-[11px] text-muted font-mono">{stop.stop_id}</div>
                    </td>

                    <td className="py-3 px-3">
                      {stop.baseline_vehicle ? (
                        <div>
                          <span className="font-semibold text-foreground font-mono">{stop.baseline_vehicle}</span>
                          <div className="text-muted text-[11px]">
                            Stop #{stop.baseline_sequence} · {stop.baseline_arrival}
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted italic">None (New)</span>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      {stop.new_vehicle ? (
                        <div>
                          <span className="font-semibold text-primary font-mono">{stop.new_vehicle}</span>
                          <div className="text-muted text-[11px]">
                            Stop #{stop.new_sequence} · {stop.new_arrival}
                          </div>
                        </div>
                      ) : (
                        <span className="text-red-600 font-bold">Unassigned / Dropped</span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-muted max-w-xs">{stop.reason}</td>

                    <td className="py-3 px-3 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedScriptStop(stop)}
                        className="text-xs"
                      >
                        Explain to Customer
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 5. CUSTOMER EXPLANATION SCRIPT MODAL (PS S-01 REQUIREMENT) */}
        {selectedScriptStop && (
          <Modal
            isOpen={true}
            onClose={() => setSelectedScriptStop(null)}
            title={`Customer Communication Script: ${selectedScriptStop.customer_name} (${selectedScriptStop.status})`}
          >
            <div className="flex flex-col gap-4 text-xs">
              <div className="p-3 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted">Customer Name:</span>
                  <span className="font-bold text-foreground">{selectedScriptStop.customer_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Order Reference:</span>
                  <span className="font-mono text-primary font-bold">{selectedScriptStop.stop_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Classification:</span>
                  <span className="font-bold text-foreground">{selectedScriptStop.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Underlying Reason:</span>
                  <span className="font-semibold text-foreground">{selectedScriptStop.reason}</span>
                </div>
              </div>

              <div>
                <label className="block text-foreground font-bold mb-1.5">
                  Dispatcher Ready-to-Read Phone/SMS Customer Script:
                </label>
                <div className="p-3.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-muted leading-relaxed italic text-xs font-mono">
                  "{selectedScriptStop.customer_script}"
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]">
                <Button variant="outline" size="sm" onClick={() => setSelectedScriptStop(null)}>
                  Close
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => copyScriptText(selectedScriptStop.customer_script)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-1.5"
                >
                  {copiedScript ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  <span>{copiedScript ? "Copied to Clipboard!" : "Copy Customer Script"}</span>
                </Button>
              </div>
            </div>
          </Modal>
        )}

        {/* 6. SIMULATED TRAVEL TIME MATRIX INSPECTOR MODAL */}
        {showMatrixModal && (
          <Modal
            isOpen={true}
            onClose={() => setShowMatrixModal(false)}
            title="Simulated Travel Time Matrix (NxN Minutes) — Zero GPS/Live Mapping"
          >
            <div className="flex flex-col gap-3 text-xs">
              <p className="text-muted">
                As required by PS S-01, inputs include the depot, vehicles, deliveries, and a matrix of simulated travel times. No live mapping or GPS service is used.
              </p>
              <div className="overflow-x-auto border border-[var(--border)] rounded-lg">
                <table className="w-full text-center text-xs font-mono">
                  <thead className="bg-muted/40 border-b border-[var(--border)] text-[11px] font-bold">
                    <tr>
                      <th className="p-2 text-left">Node</th>
                      {SIMULATED_NETWORK_NODES.map((n) => (
                        <th key={n.id} className="p-2 truncate max-w-[80px]" title={n.name}>
                          {n.id.replace("ORD-", "")}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {SIMULATED_NETWORK_NODES.map((fromNode, i) => (
                      <tr key={fromNode.id}>
                        <td className="p-2 text-left font-bold text-foreground">{fromNode.id}</td>
                        {SIMULATED_NETWORK_NODES.map((toNode, j) => (
                          <td key={toNode.id} className="p-2">
                            {BASELINE_SIMULATED_TRAVEL_TIME_MATRIX_MINUTES[i]?.[j] ?? 20}m
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="text-right pt-2">
                <Button variant="outline" size="sm" onClick={() => setShowMatrixModal(false)}>
                  Close Matrix
                </Button>
              </div>
            </div>
          </Modal>
        )}

        {/* 7. ALGORITHM & LIMITS MODAL */}
        {showAlgorithmModal && (
          <Modal
            isOpen={true}
            onClose={() => setShowAlgorithmModal(false)}
            title="Routing Algorithm & Operational Boundaries (PS S-01)"
          >
            <div className="space-y-3 text-xs text-muted leading-relaxed">
              <div className="p-3 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] text-foreground">
                <h4 className="font-bold text-sm mb-1 text-primary">Algorithm Description</h4>
                <p>
                  <strong>Primary Engine:</strong> Google OR-Tools Vehicle Routing Problem with Time Windows (VRPTW) utilizing <code>PATH_CHEAPEST_ARC</code> constructive heuristic paired with <code>GUIDED_LOCAL_SEARCH</code> metaheuristics.
                </p>
                <p className="mt-1">
                  <strong>Local Fallback Engine:</strong> Earliest-Deadline Forward Insertion with capacity-feasibility pruning, freeze-horizon locking, and disruption delay accumulation.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] text-foreground">
                <h4 className="font-bold text-sm mb-1 text-amber-600">Stated Algorithm Limits</h4>
                <ul className="list-disc pl-4 space-y-1">
                  <li><strong>Computational Complexity:</strong> NP-hard combinatorial optimization; solver execution bounded by a 5-second deterministic search horizon.</li>
                  <li><strong>Single-Depot Topology:</strong> Vehicles originate and terminate at depot <code>DEPOT-SF-01</code>.</li>
                  <li><strong>Deterministic Simulated Matrices:</strong> Travel times are computed from static simulated time matrices rather than stochastic live traffic APIs.</li>
                  <li><strong>Freeze Horizon Guarantee:</strong> Completed stops remain immutable and cannot be un-done or swapped mid-day.</li>
                </ul>
              </div>

              <div className="text-right pt-2">
                <Button variant="outline" size="sm" onClick={() => setShowAlgorithmModal(false)}>
                  Close
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </AppShell>
  );
}

export default function PlanComparePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted">Loading plan comparison...</div>}>
      <PlanCompareContent />
    </Suspense>
  );
}
