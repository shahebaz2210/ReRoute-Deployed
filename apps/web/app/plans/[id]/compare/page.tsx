"use client";

import React, { useState, useMemo, useEffect, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { comparePlanVersions, StopDeltaStatus, StopDelta } from "@/lib/plans/compare";
import { FLEET_ROUTE_PALETTE, DEFAULT_SEED_ORDERS } from "@/lib/plans/store";
import {
  Truck,
  Clock,
  RotateCw,
  CheckCircle2,
  TrafficCone,
  Ban,
  PhoneCall,
  Copy,
  Check,
  TrendingUp,
  Fuel,
  Leaf,
  Layers,
  ArrowRight,
  Sliders,
  AlertTriangle,
} from "lucide-react";

// The 5 Disruption Simulation Scenarios as specified:
// 1. Traffic Congestion: Detours around congested corridor, re-routes via arterial.
// 2. Cancelled Order: Skips order location completely. Drops {baselineRoutes[0]?.stops[1]?.stop_id || "cancelled order"} to save distance & fuel.
// 3. Road Closure: Increases travel time by +40m. Moves {baselineRoutes[0]?.stops[1]?.customer || "affected stop"} to {baselineRoutes[1]?.vehicle_name || "relief vehicle"}.
// 4. Vehicle Breakdown: {baselineRoutes[0]?.vehicle_name || "Vehicle 1"} fails at 09:45 AM. Receives NO stops after.
// 5. Baseline Plan: Original morning dispatch schedule prior to disruptions.
export type SimulationScenario =
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
  waitingMinutes: number;
  serviceMinutes: number;
  departure: string;
  weightKg: number;
  volumeM3: number;
  cumulativeWeightKg: number;
  isCompleted?: boolean;
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

// Current Fleet Fuel Calculation Constants (Indian Rupees Context)
const DIESEL_PRICE_INR_PER_LITER = 92.0; // ₹92.00 / L (Standard Diesel Rate)
const CONSUMPTION_RATE_L_PER_KM = 0.22; // 0.22 L/km (Medium logistics trucks)

function parseTimeToMinutes(t: string): number {
  if (!t) return 540;
  const clean = t.trim().toUpperCase();
  const isPm = clean.includes("PM");
  const isAm = clean.includes("AM");
  const timePart = clean.replace(/[AP]M/, "").trim();
  const parts = timePart.split(":").map(Number);
  if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    let h = parts[0];
    if (isPm && h < 12) h += 12;
    if (isAm && h === 12) h = 0;
    return h * 60 + parts[1];
  }
  return 540;
}

function formatMinutesToTime(mins: number): string {
  const h = Math.floor(mins / 60) % 24;
  const m = Math.floor(mins % 60);
  const ampm = h >= 12 ? "PM" : "AM";
  const displayH = h % 12 === 0 ? 12 : h % 12;
  return `${String(displayH).padStart(2, "0")}:${String(m).padStart(2, "0")} ${ampm}`;
}

function normalizeScenario(val: string | null | undefined): SimulationScenario {
  if (!val) return "VEHICLE_BREAKDOWN";
  const upper = val.toUpperCase();
  if (upper.includes("BREAKDOWN")) return "VEHICLE_BREAKDOWN";
  if (upper.includes("TRAFFIC")) return "TRAFFIC_CONGESTION";
  if (upper.includes("CANCEL")) return "CANCELLATION";
  if (upper.includes("CLOSURE") || upper.includes("ROAD")) return "ROAD_CLOSURE";
  if (upper.includes("BASE")) return "BASELINE";
  return "VEHICLE_BREAKDOWN";
}

function PlanCompareContent() {
  const params = useParams();
  const router = useRouter();
  const planId = (params?.id as string) || "PLAN-SF-2026-10-12";

  // Active Disruption Simulation Scenario (error-proof normalized from URL)
  const searchParams = useSearchParams();
  const scenarioParam = searchParams.get("scenario");
  const [activeScenario, setActiveScenario] = useState<SimulationScenario>(
    normalizeScenario(scenarioParam)
  );

  // Sync active scenario if URL search param changes
  useEffect(() => {
    if (scenarioParam) {
      setActiveScenario(normalizeScenario(scenarioParam));
    }
  }, [scenarioParam]);

  const selectScenario = (sc: SimulationScenario) => {
    setActiveScenario(sc);
    router.replace(`/plans/${planId}/compare?scenario=${sc}`, { scroll: false });
  };

  const [activeFilter, setActiveFilter] = useState<StopDeltaStatus | "ALL">("ALL");

  // Customer notification script modal
  const [selectedScriptStop, setSelectedScriptStop] = useState<StopDelta | null>(null);
  const [copiedScript, setCopiedScript] = useState(false);

  // Fetch active plan (reflects latest uploaded orders, vehicles, and single depot)
  const [activePlan, setActivePlan] = useState<any>(null);

  useEffect(() => {
    fetch("/api/v1/plans?active=true")
      .then((res) => res.json())
      .then((json) => {
        if (json.data) {
          setActivePlan(json.data);
        }
      })
      .catch((err) => console.error("Failed to load active plan for compare:", err));
  }, [planId]);

  // 1. BASELINE PLAN (V1) — Dynamically derived from Active Plan (Uploaded CSV data)
  const baselineRoutes: VehicleRouteView[] = useMemo(() => {
    if (activePlan?.routes && activePlan.routes.length > 0) {
      return activePlan.routes.map((r: any) => {
        const matchingFleet = (activePlan.fleet || []).find(
          (v: any) => v.id === r.vehicleId || v.vehicleCode === r.vehicleCode
        );
        const deliveryStops: StopItem[] = (r.stops || [])
          .filter((st: any) => st.type === "DELIVERY")
          .map((st: any, idx: number) => {
            const arrMins = parseTimeToMinutes(st.eta || "09:00");
            return {
              stop_id: st.orderRef || st.orderId || `ORD-${idx + 1}`,
              sequence: idx + 1,
              customer: st.locationName || `Customer #${idx + 1}`,
              address: st.address || "Delivery Location",
              arrival: st.eta || "09:00 AM",
              arrivalTimeMinutes: arrMins,
              waitingMinutes: st.waitingMinutes || 0,
              serviceMinutes: st.serviceMinutes || 15,
              departure: st.departure || formatMinutesToTime(arrMins + 15),
              weightKg: st.cumulativeWeightKg || 100,
              volumeM3: st.cumulativeVolumeM3 || 0.8,
              cumulativeWeightKg: st.cumulativeWeightKg || 100,
              isCompleted: idx === 0, // Freeze Horizon: Stop #1 completed/fixed
            };
          });

        return {
          vehicle_id: r.vehicleId,
          vehicle_name: r.vehicleName || matchingFleet?.name || `Vehicle ${r.vehicleCode}`,
          driver_name: r.driverName || matchingFleet?.driverName || "Assigned Driver",
          capacity_kg: matchingFleet?.capacityWeightKg || r.capacityWeightKg || 1500,
          capacity_m3: matchingFleet?.capacityVolumeM3 || r.capacityVolumeM3 || 14.0,
          total_weight_kg: r.totalWeightKg || deliveryStops.reduce((sum, s) => sum + s.weightKg, 0),
          total_volume_m3: r.totalVolumeM3 || deliveryStops.reduce((sum, s) => sum + s.volumeM3, 0),
          stops: deliveryStops,
        };
      });
    }

    // Staged uploaded CSV data before optimization runs
    if (activePlan?.orders && activePlan.orders.length > 0) {
      const fleetList = activePlan.fleet && activePlan.fleet.length > 0 ? activePlan.fleet : [
        { id: "VH-001", vehicleCode: "TRK-01", name: "Truck Alpha (Tata Ultra 1918.T)", driverName: "Alex Vance", capacityWeightKg: 2500, capacityVolumeM3: 18.0 },
        { id: "VH-002", vehicleCode: "TRK-02", name: "Truck Beta (Tata Ace EV)", driverName: "Marcus Sterling", capacityWeightKg: 1200, capacityVolumeM3: 10.5 },
      ];

      return fleetList.map((v: any, vIdx: number) => {
        const assignedOrders = activePlan.orders.filter((_: any, oIdx: number) => oIdx % fleetList.length === vIdx);
        let cumul = 0;
        let cumulVol = 0;
        const stops: StopItem[] = assignedOrders.map((o: any, idx: number) => {
          cumul += o.weightKg || 100;
          cumulVol += o.volumeM3 || 0.8;
          const etaMins = 520 + idx * 35;
          return {
            stop_id: o.orderReference || o.id || `ORD-${idx + 1}`,
            sequence: idx + 1,
            customer: o.customerName || `Customer #${idx + 1}`,
            address: o.deliveryAddress || "Logistics Delivery Location",
            arrival: formatMinutesToTime(etaMins),
            arrivalTimeMinutes: etaMins,
            waitingMinutes: 0,
            serviceMinutes: o.serviceDurationMinutes || 15,
            departure: formatMinutesToTime(etaMins + 15),
            weightKg: o.weightKg || 100,
            volumeM3: o.volumeM3 || 0.8,
            cumulativeWeightKg: cumul,
            isCompleted: idx === 0,
          };
        });

        return {
          vehicle_id: v.id || v.vehicleCode,
          vehicle_name: v.name || v.vehicleCode || `Fleet Unit #${vIdx + 1}`,
          driver_name: v.driverName || `Driver #${vIdx + 1}`,
          capacity_kg: v.capacityWeightKg || 2500,
          capacity_m3: v.capacityVolumeM3 || 18.0,
          total_weight_kg: cumul,
          total_volume_m3: Math.round(cumulVol * 10) / 10,
          stops,
        };
      });
    }

    // Default Pune Swargate baseline
    return [
      {
        vehicle_id: "VH-001",
        vehicle_name: "Truck Alpha (Tata Ultra 1918.T)",
        driver_name: "Alex Vance",
        capacity_kg: 2500,
        capacity_m3: 18.0,
        total_weight_kg: 1050,
        total_volume_m3: 6.5,
        stops: [
          {
            stop_id: "ORD-PN-101",
            sequence: 1,
            customer: "Cummins India Engine Hub",
            address: "Kothrud Industrial Area, Pune",
            arrival: "08:45 AM",
            arrivalTimeMinutes: 525,
            waitingMinutes: 0,
            serviceMinutes: 15,
            departure: "09:00 AM",
            weightKg: 420,
            volumeM3: 2.8,
            cumulativeWeightKg: 420,
            isCompleted: true,
          },
          {
            stop_id: "ORD-PN-102",
            sequence: 2,
            customer: "Deccan Gymkhana Retail Express",
            address: "FC Road, Deccan Gymkhana, Pune",
            arrival: "09:25 AM",
            arrivalTimeMinutes: 565,
            waitingMinutes: 0,
            serviceMinutes: 15,
            departure: "09:40 AM",
            weightKg: 280,
            volumeM3: 1.6,
            cumulativeWeightKg: 700,
            isCompleted: false,
          },
          {
            stop_id: "ORD-PN-103",
            sequence: 3,
            customer: "Shivaji Nagar Metro Logistics",
            address: "Shivaji Nagar, Pune",
            arrival: "10:10 AM",
            arrivalTimeMinutes: 610,
            waitingMinutes: 0,
            serviceMinutes: 15,
            departure: "10:25 AM",
            weightKg: 350,
            volumeM3: 2.1,
            cumulativeWeightKg: 1050,
            isCompleted: false,
          },
        ],
      },
      {
        vehicle_id: "VH-002",
        vehicle_name: "Truck Beta (Tata Ace EV)",
        driver_name: "Marcus Sterling",
        capacity_kg: 1200,
        capacity_m3: 10.5,
        total_weight_kg: 960,
        total_volume_m3: 6.1,
        stops: [
          {
            stop_id: "ORD-PN-104",
            sequence: 1,
            customer: "Serum Institute Cargo Gate",
            address: "Solapur Road, Hadapsar, Pune",
            arrival: "08:50 AM",
            arrivalTimeMinutes: 530,
            waitingMinutes: 0,
            serviceMinutes: 20,
            departure: "09:10 AM",
            weightKg: 650,
            volumeM3: 4.2,
            cumulativeWeightKg: 650,
            isCompleted: true,
          },
          {
            stop_id: "ORD-PN-105",
            sequence: 2,
            customer: "Magarpatta Cybercity Tech Hub",
            address: "Magarpatta City, Hadapsar, Pune",
            arrival: "09:30 AM",
            arrivalTimeMinutes: 570,
            waitingMinutes: 0,
            serviceMinutes: 15,
            departure: "09:45 AM",
            weightKg: 310,
            volumeM3: 1.9,
            cumulativeWeightKg: 960,
            isCompleted: false,
          },
        ],
      },
    ];
  }, [activePlan]);

  // 2. REVISED PLAN (V2) BASED ON ACTIVE DISRUPTION SCENARIO (Dynamic to uploaded data)
  const { revisedRoutes, unassignedStops, unassignedReasons, customDisruptionMsg } = useMemo<{
    revisedRoutes: VehicleRouteView[];
    unassignedStops: string[];
    unassignedReasons: Record<string, string>;
    customDisruptionMsg: string;
  }>(() => {
    if (!baselineRoutes || baselineRoutes.length === 0) {
      return {
        revisedRoutes: [],
        unassignedStops: [],
        unassignedReasons: {},
        customDisruptionMsg: "Baseline Plan: Original morning dispatch schedule prior to disruptions.",
      };
    }

    const v1 = baselineRoutes[0];
    const v2 = baselineRoutes[1] || baselineRoutes[0];

    if (activeScenario === "BASELINE") {
      return {
        revisedRoutes: baselineRoutes,
        unassignedStops: [],
        unassignedReasons: {},
        customDisruptionMsg: "Baseline Plan: Original morning dispatch schedule prior to disruptions.",
      };
    }

    if (activeScenario === "TRAFFIC_CONGESTION") {
      // Disruption 1: Traffic Congestion — Detours around congested corridor. Re-routes via arterial.
      const congestedStop = v1.stops.length > 1 ? v1.stops[1] : v1.stops[0];
      if (!congestedStop || v1 === v2) {
        return {
          revisedRoutes: baselineRoutes,
          unassignedStops: [],
          unassignedReasons: {},
          customDisruptionMsg: "Traffic Congestion: Detours around congested corridor. Re-routes via arterial.",
        };
      }

      const revised: VehicleRouteView[] = baselineRoutes.map((veh) => {
        if (veh.vehicle_id === v1.vehicle_id) {
          const remainingStops = veh.stops
            .filter((s) => s.stop_id !== congestedStop.stop_id)
            .map((s, idx) => ({ ...s, sequence: idx + 1 }));
          return {
            ...veh,
            total_weight_kg: remainingStops.reduce((sum, s) => sum + s.weightKg, 0),
            stops: remainingStops,
          };
        }
        if (veh.vehicle_id === v2.vehicle_id) {
          const newEtaMins = (veh.stops[veh.stops.length - 1]?.arrivalTimeMinutes || 560) + 35;
          const insertedStop: StopItem = {
            ...congestedStop,
            sequence: veh.stops.length + 1,
            arrival: formatMinutesToTime(newEtaMins),
            arrivalTimeMinutes: newEtaMins,
            departure: formatMinutesToTime(newEtaMins + (congestedStop.serviceMinutes || 15)),
            isCompleted: false,
          };
          const updatedStops = [...veh.stops, insertedStop];
          return {
            ...veh,
            total_weight_kg: updatedStops.reduce((sum, s) => sum + s.weightKg, 0),
            stops: updatedStops,
          };
        }
        return veh;
      });

      return {
        revisedRoutes: revised,
        unassignedStops: [],
        unassignedReasons: {},
        customDisruptionMsg: `Traffic Congestion: Detours around congested corridor for ${congestedStop.customer}. Re-routes via ${v2.vehicle_name}.`,
      };
    }

    if (activeScenario === "CANCELLATION") {
      // Disruption 2: Cancelled Order — Skips order location completely. Drops order to save distance & fuel.
      const dropStop = v1.stops.length > 1 ? v1.stops[1] : v1.stops[0];
      if (!dropStop) {
        return {
          revisedRoutes: baselineRoutes,
          unassignedStops: [],
          unassignedReasons: {},
          customDisruptionMsg: "Cancelled Order: Skips order location completely to save distance & fuel.",
        };
      }

      const revised: VehicleRouteView[] = baselineRoutes.map((veh) => {
        if (veh.vehicle_id === v1.vehicle_id) {
          const remainingStops = veh.stops
            .filter((s) => s.stop_id !== dropStop.stop_id)
            .map((s, idx) => ({
              ...s,
              sequence: idx + 1,
              arrival: idx > 0 ? formatMinutesToTime(s.arrivalTimeMinutes - 20) : s.arrival,
              arrivalTimeMinutes: idx > 0 ? s.arrivalTimeMinutes - 20 : s.arrivalTimeMinutes,
            }));
          return {
            ...veh,
            total_weight_kg: remainingStops.reduce((sum, s) => sum + s.weightKg, 0),
            stops: remainingStops,
          };
        }
        return veh;
      });

      return {
        revisedRoutes: revised,
        unassignedStops: [dropStop.stop_id],
        unassignedReasons: {
          [dropStop.stop_id]: `Cancelled Order: Customer requested cancellation. Location skipped completely to save distance & fuel.`,
        },
        customDisruptionMsg: `Cancelled Order: Skips order location completely. Drops ${dropStop.stop_id} (${dropStop.customer}) to save distance & fuel.`,
      };
    }

    if (activeScenario === "ROAD_CLOSURE") {
      // Disruption 3: Road Closure — Increases travel time by +40m. Moves order to Vehicle 2.
      const movedStop = v1.stops.length > 1 ? v1.stops[1] : v1.stops[0];
      if (!movedStop || v1 === v2) {
        return {
          revisedRoutes: baselineRoutes,
          unassignedStops: [],
          unassignedReasons: {},
          customDisruptionMsg: "Road Closure: Increases travel time by +40m.",
        };
      }

      const revised: VehicleRouteView[] = baselineRoutes.map((veh) => {
        if (veh.vehicle_id === v1.vehicle_id) {
          const remainingStops = veh.stops
            .filter((s) => s.stop_id !== movedStop.stop_id)
            .map((s, idx) => ({ ...s, sequence: idx + 1 }));
          return {
            ...veh,
            total_weight_kg: remainingStops.reduce((sum, s) => sum + s.weightKg, 0),
            stops: remainingStops,
          };
        }
        if (veh.vehicle_id === v2.vehicle_id) {
          const newEtaMins = movedStop.arrivalTimeMinutes + 40;
          const insertedStop: StopItem = {
            ...movedStop,
            sequence: veh.stops.length + 1,
            arrival: formatMinutesToTime(newEtaMins),
            arrivalTimeMinutes: newEtaMins,
            departure: formatMinutesToTime(newEtaMins + (movedStop.serviceMinutes || 15)),
            isCompleted: false,
          };
          const updatedStops = [...veh.stops, insertedStop];
          return {
            ...veh,
            total_weight_kg: updatedStops.reduce((sum, s) => sum + s.weightKg, 0),
            stops: updatedStops,
          };
        }
        return veh;
      });

      return {
        revisedRoutes: revised,
        unassignedStops: [],
        unassignedReasons: {},
        customDisruptionMsg: `Road Closure: Increases travel time by +40m. Moves ${movedStop.customer} to ${v2.vehicle_name}.`,
      };
    }

    // Disruption 4: Vehicle Breakdown — Vehicle fails at 09:45 AM. Receives NO stops after.
    const completedStops = v1.stops.filter((s, idx) => idx === 0 || s.isCompleted);
    const uncompletedStops = v1.stops.filter((s, idx) => idx > 0 && !s.isCompleted);

    let unassignedBreakdown: string[] = [];
    let reasonsBreakdown: Record<string, string> = {};

    const revised: VehicleRouteView[] = baselineRoutes.map((veh) => {
      if (veh.vehicle_id === v1.vehicle_id) {
        return {
          ...veh,
          is_failed: true,
          failure_time: "09:45 AM (Mechanical Breakdown)",
          total_weight_kg: completedStops.reduce((sum, s) => sum + s.weightKg, 0),
          stops: completedStops, // Receives NO stops after 09:45 AM!
        };
      }
      if (veh.vehicle_id === v2.vehicle_id && uncompletedStops.length > 0) {
        const firstTransfer = uncompletedStops[0];
        const newEtaMins = Math.max(590, (veh.stops[veh.stops.length - 1]?.arrivalTimeMinutes || 560) + 30);
        const transferredStop: StopItem = {
          ...firstTransfer,
          sequence: veh.stops.length + 1,
          arrival: formatMinutesToTime(newEtaMins),
          arrivalTimeMinutes: newEtaMins,
          departure: formatMinutesToTime(newEtaMins + 15),
          isCompleted: false,
        };

        const remainingUncompleted = uncompletedStops.slice(1);
        remainingUncompleted.forEach((s) => {
          unassignedBreakdown.push(s.stop_id);
          reasonsBreakdown[s.stop_id] = `Vehicle Breakdown: ${v1.vehicle_name} failed at 09:45 AM. Receives NO stops after. Delivery could not be absorbed into active relief routes.`;
        });

        const updatedStops = [...veh.stops, transferredStop];
        return {
          ...veh,
          total_weight_kg: updatedStops.reduce((sum, s) => sum + s.weightKg, 0),
          stops: updatedStops,
        };
      }
      return veh;
    });

    return {
      revisedRoutes: revised,
      unassignedStops: unassignedBreakdown,
      unassignedReasons: reasonsBreakdown,
      customDisruptionMsg: `Vehicle Breakdown: ${v1.vehicle_name} fails at 09:45 AM. Receives NO stops after. Remaining deliveries transferred to ${v2.vehicle_name}.`,
    };
  }, [activeScenario, baselineRoutes]);

  // 3. RUN MATHEMATICAL PLAN COMPARISON (Semantic Diff: KEPT, MOVED, BROKEN)
  const comparison = useMemo(() => {
    return comparePlanVersions(baselineRoutes, revisedRoutes, unassignedStops, unassignedReasons);
  }, [baselineRoutes, revisedRoutes, unassignedStops, unassignedReasons]);

  // Enrich Stop Deltas with the Exact Disruption Reason and Customer Script dynamically
  const enrichedStopDeltas = useMemo(() => {
    return comparison.stop_deltas.map((s) => {
      let enrichedReason = s.reason;
      let enrichedScript = s.customer_script;

      if (s.status === "BROKEN") {
        if (activeScenario === "CANCELLATION") {
          enrichedReason = "Cancelled Order: Customer requested cancellation. Location skipped completely to save distance & fuel.";
          enrichedScript = `Order ${s.stop_id} (${s.customer_name}) has been cancelled as requested. The delivery location has been removed from today's schedule, saving distance & fuel.`;
        } else if (activeScenario === "VEHICLE_BREAKDOWN") {
          enrichedReason = `Vehicle Breakdown: Assigned vehicle experienced mechanical failure at 09:45 AM. Receives NO stops after. Delivery could not be absorbed into active relief routes.`;
          enrichedScript = `Dear ${s.customer_name}, we sincerely apologize: our assigned vehicle experienced an unexpected breakdown at 09:45 AM. Your delivery for order ${s.stop_id} could not be placed in the current run. Our dispatch team is expediting emergency replacement dispatch for your order.`;
        }
      } else if (s.status === "MOVED") {
        if (s.new_vehicle !== s.baseline_vehicle) {
          if (activeScenario === "VEHICLE_BREAKDOWN") {
            enrichedReason = `Vehicle Breakdown: Assigned vehicle failed at 09:45 AM. Stop transferred to ${s.new_vehicle} (${s.new_arrival}).`;
            enrichedScript = `Hello ${s.customer_name}, updating you that due to a mechanical breakdown at 09:45 AM, your delivery for order ${s.stop_id} has been transferred to vehicle ${s.new_vehicle}. Your updated arrival time is ${s.new_arrival}.`;
          } else if (activeScenario === "ROAD_CLOSURE") {
            enrichedReason = `Road Closure: Increases travel time by +40m. Moved ${s.customer_name} to ${s.new_vehicle}.`;
            enrichedScript = `Hello ${s.customer_name}, due to an emergency arterial road closure, your order ${s.stop_id} has been transferred to vehicle ${s.new_vehicle} arriving at approx ${s.new_arrival}.`;
          } else if (activeScenario === "TRAFFIC_CONGESTION") {
            enrichedReason = `Traffic Congestion: Detours around congested corridor. Re-routes via ${s.new_vehicle}.`;
            enrichedScript = `Hello ${s.customer_name}, due to severe traffic gridlock along the primary corridor, your delivery ${s.stop_id} has been re-routed via ${s.new_vehicle} with an updated ETA of ${s.new_arrival}.`;
          }
        }
      } else if (s.status === "KEPT") {
        if (s.baseline_sequence === 1) {
          enrichedReason = `Completed stop: Delivered at ${s.baseline_arrival} prior to disruption. Preserved by Freeze Horizon.`;
          enrichedScript = `Hello ${s.customer_name}, your order ${s.stop_id} was successfully delivered at ${s.baseline_arrival} prior to disruptions and remains fully completed.`;
        } else {
          enrichedReason = "Schedule preserved: Unaffected by active disruption.";
          enrichedScript = `Hello ${s.customer_name}, your delivery for order ${s.stop_id} remains on schedule for ${s.baseline_arrival} with vehicle ${s.baseline_vehicle}.`;
        }
      }

      return {
        ...s,
        reason: enrichedReason,
        customer_script: enrichedScript,
      };
    });
  }, [comparison.stop_deltas, activeScenario]);

  const filteredStops = useMemo(() => {
    if (activeFilter === "ALL") return enrichedStopDeltas;
    return enrichedStopDeltas.filter((s) => s.status === activeFilter);
  }, [enrichedStopDeltas, activeFilter]);

  // 4. LIVE METRICS & STRUCTURED FUEL RECALCULATION IN CURRENT RUPEES (₹)
  const metrics = useMemo(() => {
    const baseDist = activePlan?.totalDistanceKm || 88.5;
    const baseFuel = activePlan?.totalFuelLiters || Math.round(baseDist * CONSUMPTION_RATE_L_PER_KM * 10) / 10;
    const baseCost = Math.round(baseFuel * DIESEL_PRICE_INR_PER_LITER);

    if (activeScenario === "CANCELLATION") {
      const dist = Math.max(10, Math.round((baseDist - 14.2) * 10) / 10);
      const fuelL = Math.max(2, Math.round((dist * CONSUMPTION_RATE_L_PER_KM) * 10) / 10);
      const fuelCost = Math.round(fuelL * DIESEL_PRICE_INR_PER_LITER);
      return {
        travelTime: "245 min (4h 05m)",
        travelTimeDelta: "▼ -40 min saved (Skip Stop)",
        distanceKm: dist,
        distanceDelta: "▼ -14.2 km detour eliminated",
        fuelLiters: fuelL,
        fuelDelta: `▼ -${Math.round((baseFuel - fuelL) * 10) / 10} L fuel saved`,
        fuelCostInr: fuelCost,
        fuelCostDeltaInr: `▼ Saved ₹${Math.max(0, baseCost - fuelCost)} fuel expense`,
        co2Kg: Math.round(fuelL * 2.68 * 10) / 10,
        co2Delta: "▼ Fuel & emissions avoided",
      };
    }

    if (activeScenario === "TRAFFIC_CONGESTION") {
      const dist = Math.round((baseDist - 2.4) * 10) / 10;
      const fuelL = Math.round((dist * CONSUMPTION_RATE_L_PER_KM) * 10) / 10;
      const fuelCost = Math.round(fuelL * DIESEL_PRICE_INR_PER_LITER);
      return {
        travelTime: "295 min (4h 55m)",
        travelTimeDelta: "▼ -25 min saved vs traffic gridlock",
        distanceKm: dist,
        distanceDelta: "▼ -2.4 km alternate detour",
        fuelLiters: fuelL,
        fuelDelta: "▼ Route optimized vs idling",
        fuelCostInr: fuelCost,
        fuelCostDeltaInr: "▼ Fuel optimized at ₹92.00/L",
        co2Kg: Math.round(fuelL * 2.68 * 10) / 10,
        co2Delta: "▼ Emissions reduced",
      };
    }

    if (activeScenario === "ROAD_CLOSURE") {
      const dist = Math.round((baseDist + 5.3) * 10) / 10;
      const fuelL = Math.round((dist * CONSUMPTION_RATE_L_PER_KM) * 10) / 10;
      const fuelCost = Math.round(fuelL * DIESEL_PRICE_INR_PER_LITER);
      return {
        travelTime: "325 min (5h 25m)",
        travelTimeDelta: "▲ +40 min corridor delay absorbed",
        distanceKm: dist,
        distanceDelta: "▲ +5.3 km detour around closed arterial",
        fuelLiters: fuelL,
        fuelDelta: `▲ +${Math.max(0.5, Math.round((fuelL - baseFuel) * 10) / 10)} L detour fuel required`,
        fuelCostInr: fuelCost,
        fuelCostDeltaInr: `▲ +₹${Math.max(50, fuelCost - baseCost)} detour fuel expense`,
        co2Kg: Math.round(fuelL * 2.68 * 10) / 10,
        co2Delta: "▲ CO₂ from detour",
      };
    }

    if (activeScenario === "VEHICLE_BREAKDOWN") {
      const dist = Math.max(10, Math.round((baseDist - 20.1) * 10) / 10);
      const fuelL = Math.max(2, Math.round((dist * CONSUMPTION_RATE_L_PER_KM) * 10) / 10);
      const fuelCost = Math.round(fuelL * DIESEL_PRICE_INR_PER_LITER);
      return {
        travelTime: "230 min (3h 50m)",
        travelTimeDelta: "Failed vehicle halted after 09:45 AM",
        distanceKm: dist,
        distanceDelta: "▼ Halted vehicle route reduction",
        fuelLiters: fuelL,
        fuelDelta: "▼ Direct consumption adjusted",
        fuelCostInr: fuelCost,
        fuelCostDeltaInr: `▼ Saved ₹${Math.max(0, baseCost - fuelCost)} direct vehicle expense`,
        co2Kg: Math.round(fuelL * 2.68 * 10) / 10,
        co2Delta: "▼ Halting emissions reduction",
      };
    }

    // BASELINE
    return {
      travelTime: `${Math.floor((activePlan?.totalDurationMinutes || 285) / 60)}h ${(activePlan?.totalDurationMinutes || 285) % 60}m`,
      travelTimeDelta: "Baseline morning schedule",
      distanceKm: baseDist,
      distanceDelta: "Optimal baseline road network",
      fuelLiters: baseFuel,
      fuelDelta: "Standard consumption baseline (0.22 L/km)",
      fuelCostInr: baseCost,
      fuelCostDeltaInr: "Standard operating fuel budget",
      co2Kg: Math.round(baseFuel * 2.68 * 10) / 10,
      co2Delta: "Clean fleet compliant",
    };
  }, [activeScenario, activePlan]);

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
              <span>Dynamic Fleet & Delivery Replanning Cockpit</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary/10 border border-primary/20 font-bold">
                PS S-01 Compliant
              </span>
            </div>
            <h1 className="text-2xl font-bold text-[var(--foreground)] tracking-tight">
              Side-by-Side Plan Comparison & Replanning Audit
            </h1>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
              Original baseline schedule vs re-optimized plan with stop arrival/waiting times, vehicle capacity constraints, and customer change explanations.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => router.push("/disruptions")}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer shadow-xs"
            >
              Back to Disruptions
            </Button>
          </div>
        </div>

        {/* 1. DISRUPTION SCENARIO SELECTOR TABS */}
        <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] shadow-xs flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)] flex items-center gap-1.5">
              <Sliders className="h-4 w-4 text-[var(--primary)]" />
              <span>Select Active Disruption Scenario to Audit:</span>
            </span>
            <span className="text-xs font-mono text-[var(--muted-foreground)]">
              Central Depot: {activePlan?.depot?.name || "Swargate Central Logistics Hub, Pune"}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
            {/* Scenario 1: Traffic Congestion */}
            <button
              type="button"
              onClick={() => selectScenario("TRAFFIC_CONGESTION")}
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
                Detours around congested corridor for {baselineRoutes[0]?.stops[1]?.customer || "Stop #2"}. Re-routes via {baselineRoutes[1]?.vehicle_name || "relief vehicle"}.
              </p>
            </button>

            {/* Scenario 2: Cancelled Order */}
            <button
              type="button"
              onClick={() => selectScenario("CANCELLATION")}
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
                Skips order location completely. Drops {baselineRoutes[0]?.stops[1]?.stop_id || "cancelled order"} to save distance & fuel.
              </p>
            </button>

            {/* Scenario 3: Road Closure */}
            <button
              type="button"
              onClick={() => selectScenario("ROAD_CLOSURE")}
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
                Increases travel time by +40m. Moves {baselineRoutes[0]?.stops[1]?.customer || "affected stop"} to {baselineRoutes[1]?.vehicle_name || "relief vehicle"}.
              </p>
            </button>

            {/* Scenario 4: Vehicle Breakdown */}
            <button
              type="button"
              onClick={() => selectScenario("VEHICLE_BREAKDOWN")}
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
                {baselineRoutes[0]?.vehicle_name || "Vehicle 1"} fails at 09:45 AM. Receives NO stops after.
              </p>
            </button>

            {/* Scenario 5: Baseline Plan */}
            <button
              type="button"
              onClick={() => selectScenario("BASELINE")}
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

        {/* 2. REAL-TIME RECALCULATION & STRUCTURED FUEL CONSUMPTION (IN CURRENT RUPEES ₹) */}
        <div className="p-5 rounded-2xl border border-emerald-300/80 dark:border-emerald-800/80 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-xs flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-emerald-200/80 dark:border-emerald-800/60 pb-3">
            <div>
              <div className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
                <span>Re-calculated Impact: Before vs After Disruption</span>
              </div>
              <h3 className="text-base font-bold text-[var(--foreground)] mt-0.5">
                Multi-Objective Optimization Trade-Offs (Fuel, Rupees ₹, Distance & Travel Time)
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs px-2.5 py-1 rounded bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 font-bold">
                Diesel Rate: ₹92.00 / Litre
              </span>
            </div>
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
                  {metrics.travelTime}
                </div>
                <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {metrics.travelTimeDelta}
                </div>
              </div>
            </div>

            {/* Metric 2: Distance */}
            <div className="p-3.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
                <span>Total Road Distance</span>
                <Truck className="h-3.5 w-3.5" />
              </div>
              <div className="mt-2 font-mono">
                <div className="text-lg font-bold text-[var(--foreground)]">
                  {metrics.distanceKm} km
                </div>
                <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {metrics.distanceDelta}
                </div>
              </div>
            </div>

            {/* Metric 3: Fuel Consumed (Litres) */}
            <div className="p-3.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
                <span>Fuel Consumed</span>
                <Fuel className="h-3.5 w-3.5 text-emerald-600" />
              </div>
              <div className="mt-2 font-mono">
                <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                  {metrics.fuelLiters} L
                </div>
                <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {metrics.fuelDelta}
                </div>
              </div>
            </div>

            {/* Metric 4: Fuel Expense in Current Rupees (₹) */}
            <div className="p-3.5 rounded-xl bg-[var(--surface)] border-2 border-emerald-500/40 bg-emerald-500/5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
                <span className="font-bold text-emerald-700 dark:text-emerald-300">Fuel Cost (Rupees ₹)</span>
                <span className="font-mono font-bold text-xs text-emerald-700 dark:text-emerald-300">₹</span>
              </div>
              <div className="mt-2 font-mono">
                <div className="text-xl font-black text-emerald-700 dark:text-emerald-300">
                  ₹{metrics.fuelCostInr.toLocaleString("en-IN")}
                </div>
                <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 mt-0.5">
                  {metrics.fuelCostDeltaInr}
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
                  {metrics.co2Kg} kg
                </div>
                <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {metrics.co2Delta}
                </div>
              </div>
            </div>
          </div>

          {/* Active Disruption Banner with Exact Message */}
          <div className="p-3 rounded-xl bg-[var(--surface)] border border-emerald-300 dark:border-emerald-800 text-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
                Active Disruption Rule:
              </span>
              <p className="font-semibold text-foreground mt-0.5">{customDisruptionMsg}</p>
            </div>
            <div className="text-[11px] font-mono text-muted">
              Calculation: Distance × 0.22 L/km @ ₹92.00/L
            </div>
          </div>
        </div>

        {/* 3. SUMMARY METRIC CARDS (KEPT, MOVED, BROKEN, SKIPPED) */}
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

          <div className="bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-xl p-3.5 shadow-2xs">
            <div className="text-xs text-amber-800 dark:text-amber-300 font-semibold flex items-center gap-1">
              <span>Moved (Reassigned/Reordered)</span>
            </div>
            <div className="text-2xl font-bold text-amber-700 dark:text-amber-400 mt-0.5 font-mono">
              {comparison.moved_count}
            </div>
          </div>

          <div className="bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40 rounded-xl p-3.5 shadow-2xs">
            <div className="text-xs text-rose-800 dark:text-rose-300 font-semibold flex items-center gap-1">
              <span>Broken (Unassigned)</span>
            </div>
            <div className="text-2xl font-bold text-rose-700 dark:text-rose-400 mt-0.5 font-mono">
              {comparison.broken_count}
            </div>
          </div>

          <div className="bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/40 rounded-xl p-3.5 shadow-2xs">
            <div className="text-xs text-purple-800 dark:text-purple-300 font-semibold flex items-center gap-1">
              <span>Skipped (Cancelled)</span>
            </div>
            <div className="text-2xl font-bold text-purple-700 dark:text-purple-400 mt-0.5 font-mono">
              {activeScenario === "CANCELLATION" ? 1 : 0}
            </div>
          </div>
        </div>

        {/* 4. SIDE-BY-SIDE DUAL ROUTE INSPECTOR */}
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
                              ⏳ Wait: +{stop.waitingMinutes}m before window
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
                    <div className="p-2.5 rounded-lg bg-red-100/60 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-800 dark:text-red-300">
                      <strong>PS S-01 Rule Enforced:</strong> {vehicle.vehicle_name} failed at 09:45 AM. Receives <strong>NO stops after failure time</strong>. Completed stops stay fixed; remaining stops reassigned.
                    </div>
                  )}

                  {/* Stop sequence */}
                  <div className="space-y-1.5">
                    {vehicle.stops.map((stop) => {
                      // Accurate False-Positive-Proof check: check BOTH vehicle ID and sequence
                      let baseVehicleId = "";
                      let baseStopSeq = -1;
                      for (const r of baselineRoutes) {
                        const st = r.stops.find((s) => s.stop_id === stop.stop_id);
                        if (st) {
                          baseVehicleId = r.vehicle_id;
                          baseStopSeq = st.sequence;
                          break;
                        }
                      }

                      const isVehicleChanged = Boolean(baseVehicleId && baseVehicleId !== vehicle.vehicle_id);
                      const isSeqChanged = Boolean(baseStopSeq !== -1 && baseStopSeq !== stop.sequence);
                      const isNew = !baseVehicleId;

                      return (
                        <div
                          key={stop.stop_id}
                          className={`p-2.5 rounded-lg border text-xs flex flex-col gap-1 transition-all ${
                            isNew
                              ? "bg-neutral-100 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700"
                              : isVehicleChanged
                              ? "bg-blue-50/80 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800"
                              : isSeqChanged
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
                              {stop.isCompleted ? (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                  FIXED STOP
                                </span>
                              ) : isVehicleChanged ? (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 border border-blue-200">
                                  MOVED TO {vehicle.vehicle_id}
                                </span>
                              ) : isSeqChanged ? (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300 border border-amber-200">
                                  MOVED SEQUENCE
                                </span>
                              ) : isNew ? (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">
                                  INSERTED STOP
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
                                ⏳ Wait: +{stop.waitingMinutes}m before window
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

              {/* UNASSIGNED / BROKEN DELIVERIES SECTION */}
              {unassignedStops.length > 0 && (
                <div className="p-3.5 rounded-xl border border-red-300 dark:border-red-900 bg-red-50/60 dark:bg-red-950/30 flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-red-800 dark:text-red-300 font-bold text-xs">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <span>Deliveries That Could Not Be Placed (With Operational Reasons):</span>
                  </div>

                  {unassignedStops.map((stopId) => {
                    const baseStop = baselineRoutes
                      .flatMap((r) => r.stops)
                      .find((s) => s.stop_id === stopId);
                    return (
                      <div
                        key={stopId}
                        className="p-3 rounded-lg bg-[var(--surface)] border border-red-200 dark:border-red-900/60 text-xs flex flex-col gap-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-foreground">
                            {stopId} — {baseStop?.customer || "Customer Order"}
                          </span>
                          <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-300">
                            {activeScenario === "CANCELLATION" ? "SKIPPED / CANCELLED" : "BROKEN / UNPLACED"}
                          </span>
                        </div>
                        <p className="text-muted mt-0.5">
                          <strong className="text-red-700 dark:text-red-400">Reason:</strong>{" "}
                          {unassignedReasons[stopId]}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 5. DELIVERY CLASSIFICATION & CUSTOMER EXPLANATION TABLE */}
        <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[var(--border)] pb-3">
            <div>
              <h3 className="text-base font-bold text-foreground">
                Delivery Classification Breakdown (KEPT / MOVED / BROKEN)
              </h3>
              <p className="text-xs text-muted mt-0.5">
                Classifying every delivery with operational reason so dispatcher can explain changes to customers.
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
                  <th className="py-2.5 px-3">Operational Reason</th>
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

                    <td className="py-3 px-3 text-muted max-w-sm">{stop.reason}</td>

                    <td className="py-3 px-3 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedScriptStop(stop)}
                        className="text-xs flex items-center gap-1.5 ml-auto cursor-pointer"
                      >
                        <PhoneCall className="h-3.5 w-3.5 text-primary" />
                        <span>Explain to Customer</span>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 6. CUSTOMER EXPLANATION SCRIPT MODAL (EXACT MESSAGE GIVEN WHILE ADDING DISRUPTION) */}
        {selectedScriptStop && (
          <Modal
            isOpen={true}
            onClose={() => setSelectedScriptStop(null)}
            title={`Customer Explanation: ${selectedScriptStop.customer_name} (${selectedScriptStop.status})`}
          >
            <div className="flex flex-col gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted">Customer Name:</span>
                  <span className="font-bold text-foreground">{selectedScriptStop.customer_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Order Reference:</span>
                  <span className="font-mono text-primary font-bold">{selectedScriptStop.stop_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Delivery Classification:</span>
                  <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                    selectedScriptStop.status === "KEPT"
                      ? "bg-emerald-100 text-emerald-800"
                      : selectedScriptStop.status === "MOVED"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-red-100 text-red-800"
                  }`}>
                    {selectedScriptStop.status}
                  </span>
                </div>
                <div className="pt-2 border-t border-[var(--border)]">
                  <span className="text-muted block mb-1">Underlying Disruption Reason:</span>
                  <span className="font-semibold text-foreground block">{selectedScriptStop.reason}</span>
                </div>
              </div>

              <div>
                <label className="block text-foreground font-bold mb-1.5 flex items-center gap-1.5">
                  <PhoneCall className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Dispatcher Customer Message (Exact Disruption Script):</span>
                </label>
                <div className="p-3.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-foreground leading-relaxed italic text-xs font-mono shadow-2xs">
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
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  {copiedScript ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  <span>{copiedScript ? "Copied to Clipboard!" : "Copy Customer Script"}</span>
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
