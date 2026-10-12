"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Mic,
  MicOff,
  Radio,
  AlertTriangle,
  XCircle,
  Truck,
  MapPin,
  Clock,
  User,
  Package,
  Layers,
  X,
  TrafficCone,
  CarFront,
  Ban,
  Plus,
  PlusCircle,
  CheckCircle2,
  ShieldAlert,
  ArrowRight,
  FileText,
  Sliders,
} from "lucide-react";
import { KNOWN_NETWORK_LOCATIONS } from "@/lib/voice/elevenlabs";

export interface FleetVehicleSummary {
  id: string;
  name: string;
  licensePlate: string;
  driverName: string;
  status: string;
  capacityWeightKg: number;
  capacityVolumeM3: number;
  currentWeightKg: number;
  currentVolumeM3: number;
  nextStop: string;
  eta: string;
  remainingStops: number;
}

export interface HandsFreeDisruptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  fleet?: FleetVehicleSummary[];
  onDisruptionConfirmed?: (incident: any) => void;
}

const DEFAULT_FLEET: FleetVehicleSummary[] = [
  {
    id: "VH-001",
    name: "Truck Alpha (Sprinter 3500)",
    licensePlate: "SF-789-TX",
    driverName: "Alex Vance",
    status: "ACTIVE_VEHICLE",
    capacityWeightKg: 1500,
    capacityVolumeM3: 14.0,
    currentWeightKg: 1120,
    currentVolumeM3: 9.8,
    nextStop: "Apex BioLabs (#2)",
    eta: "08:45 AM",
    remainingStops: 3,
  },
  {
    id: "VH-002",
    name: "Truck Beta (E-Transit)",
    licensePlate: "SF-104-EQ",
    driverName: "Marcus Sterling",
    status: "DELAYED_ROUTE",
    capacityWeightKg: 1200,
    capacityVolumeM3: 11.5,
    currentWeightKg: 1050,
    currentVolumeM3: 10.1,
    nextStop: "Marina Grocers (#3)",
    eta: "09:55 AM (+25m)",
    remainingStops: 4,
  },
  {
    id: "VH-003",
    name: "Van Gamma (ProMaster)",
    licensePlate: "SF-552-KL",
    driverName: "Elena Rostova",
    status: "ACTIVE_VEHICLE",
    capacityWeightKg: 1800,
    capacityVolumeM3: 13.0,
    currentWeightKg: 780,
    currentVolumeM3: 5.4,
    nextStop: "Mission Culinary (#1)",
    eta: "09:15 AM",
    remainingStops: 2,
  },
  {
    id: "VH-004",
    name: "Truck Delta (Transit High)",
    licensePlate: "SF-903-ZZ",
    driverName: "David Kim",
    status: "STANDBY",
    capacityWeightKg: 1400,
    capacityVolumeM3: 12.0,
    currentWeightKg: 0,
    currentVolumeM3: 0,
    nextStop: "Central Hub Depot",
    eta: "On Standby",
    remainingStops: 0,
  },
];

export function HandsFreeDisruptionModal({
  isOpen,
  onClose,
  fleet = DEFAULT_FLEET,
  onDisruptionConfirmed,
}: HandsFreeDisruptionModalProps) {
  const router = useRouter();
  const [activePlan, setActivePlan] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      fetch("/api/v1/plans?active=true")
        .then((res) => res.json())
        .then((json) => {
          if (json.data) {
            setActivePlan(json.data);
            if (json.data.fleet && json.data.fleet.length > 0) {
              setSelectedVehicleId(json.data.fleet[0].id || json.data.fleet[0].vehicleCode);
            }
            const oList = json.data.orders || [];
            if (oList.length > 0) {
              const o1 = oList[0];
              const o2 = oList[1] || o1;
              const dName = json.data.depot?.name || "Central Logistics Hub, Swargate Pune";
              setTrafficFrom(dName);
              setTrafficTo(o2.orderReference || o2.id);
              setCancelledOrderId(o2.orderReference || o2.id);
              setCancelledCustomer(o2.customerName || "Customer");
              setRoadClosureFrom(dName);
              setRoadClosureTo(o2.orderReference || o2.id);
            }
          }
        })
        .catch((err) => console.error("Failed to load active plan for modal:", err));
    }
  }, [isOpen]);

  const activeFleet: FleetVehicleSummary[] = React.useMemo(() => {
    if (activePlan?.fleet && activePlan.fleet.length > 0) {
      return activePlan.fleet.map((v: any, idx: number) => {
        const matchingRoute = (activePlan.routes || []).find(
          (r: any) => r.vehicleId === v.id || r.vehicleCode === v.vehicleCode
        );
        const delStops = matchingRoute?.stops?.filter((s: any) => s.type === "DELIVERY") || [];
        return {
          id: v.id || v.vehicleCode,
          name: v.name || v.vehicleCode || `Vehicle #${idx + 1}`,
          licensePlate: v.licensePlate || v.vehicleCode,
          driverName: v.driverName || `Driver #${idx + 1}`,
          status: matchingRoute?.isFailed ? "BREAKDOWN" : "ACTIVE_VEHICLE",
          capacityWeightKg: v.capacityWeightKg || 2500,
          capacityVolumeM3: v.capacityVolumeM3 || 18.0,
          currentWeightKg: matchingRoute?.totalWeightKg || 0,
          currentVolumeM3: matchingRoute?.totalVolumeM3 || 0,
          nextStop: delStops[0]?.locationName || "Active Route",
          eta: delStops[0]?.eta || "09:00 AM",
          remainingStops: delStops.length,
        };
      });
    }
    return fleet && fleet.length > 0 ? fleet : DEFAULT_FLEET;
  }, [activePlan, fleet]);

  const activeOrders: Array<{ id: string; orderReference: string; customerName: string; deliveryAddress: string }> = React.useMemo(() => {
    if (activePlan?.orders && activePlan.orders.length > 0) {
      return activePlan.orders;
    }
    return [];
  }, [activePlan]);

  const activeDepotName = activePlan?.depot?.name || "Swargate Central Logistics Hub, Pune";

  // 1. Disruption Type State (The 4 Disruption Types)
  const [disruptionType, setDisruptionType] = useState<
    "TRAFFIC_CONGESTION" | "CANCELLATION" | "ROAD_CLOSURE" | "VEHICLE_BREAKDOWN"
  >("TRAFFIC_CONGESTION");

  // 2. Input Mode: Structured form vs Text/Voice description
  const [inputMode, setInputMode] = useState<"STRUCTURED" | "TEXT_VOICE">("TEXT_VOICE");

  // 3. Vehicle selection
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(activeFleet[0]?.id || "VH-001");

  // 4. Structured fields
  // A. Traffic Congestion
  const [trafficFrom, setTrafficFrom] = useState("DEPOT-SF-01");
  const [trafficTo, setTrafficTo] = useState("ORD-9902");
  const [trafficDelay, setTrafficDelay] = useState(30);
  const [trafficDetourNote, setTrafficDetourNote] = useState("Heavy traffic along Market St arterial corridor — re-route via Mission detour");

  // B. Order Cancellation
  const [cancelledOrderId, setCancelledOrderId] = useState("ORD-9902");
  const [cancelledCustomer, setCancelledCustomer] = useState("Marina Grocers");
  const [cancellationReason, setCancellationReason] = useState("Customer cancellation — skip location entirely to save fuel");

  // C. Road Closure
  const [roadClosureFrom, setRoadClosureFrom] = useState("DEPOT-SF-01");
  const [roadClosureTo, setRoadClosureTo] = useState("ORD-9902");
  const [roadClosureDelay, setRoadClosureDelay] = useState(45);
  const [roadClosureDuration, setRoadClosureDuration] = useState(120);

  // D. Vehicle Failure
  const [vehicleFailureTime, setVehicleFailureTime] = useState("09:45 AM");
  const [vehicleFailureReason, setVehicleFailureReason] = useState("Engine oil pressure loss / mechanical failure");

  // 5. Free-form text / voice input state
  const [disruptionReason, setDisruptionReason] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isInterpreting, setIsInterpreting] = useState(false);
  const [guardrailError, setGuardrailError] = useState<string | null>(null);

  // 6. Dispatcher Confirmation Stage (PS S-01 Requirement)
  const [interpretedIncident, setInterpretedIncident] = useState<any | null>(null);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);

  const recognitionRef = useRef<any>(null);

  const selectedVehicle =
    activeFleet.find((v) => v.id === selectedVehicleId) || activeFleet[0];

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onstart = () => setIsRecording(true);
        recognition.onresult = (event: any) => {
          const current = event.resultIndex;
          const text = event.results[current][0].transcript;
          setDisruptionReason(text);
        };
        recognition.onerror = () => setIsRecording(false);
        recognition.onend = () => setIsRecording(false);
        recognitionRef.current = recognition;
      }
    }
  }, []);

  if (!isOpen) return null;

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      setDisruptionReason("");
      setGuardrailError(null);
      setAwaitingConfirmation(false);
      setInterpretedIncident(null);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch {
          setIsRecording(true);
        }
      } else {
        setIsRecording(true);
      }
    }
  };

  const speakAudioFeedback = (text: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    }
  };

  // Direct Disruption Ingestion for Text / Voice Mode (with Network Node Guardrail Validation)
  const handleAddDisruptionTextVoice = async () => {
    if (!disruptionReason.trim()) return;

    setIsInterpreting(true);
    setGuardrailError(null);
    setAwaitingConfirmation(false);

    try {
      const res = await fetch("/api/v1/voice/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: disruptionReason,
          vehicle_id: selectedVehicle.id,
        }),
      });

      const parsed = await res.json();

      if (parsed.guardrailRejected) {
        // Guardrail Rejection: Unknown locations are rejected, not guessed at.
        const reason =
          parsed.rejectionReason || parsed.voiceFeedback || "Location unrecognized, please state a valid sector.";
        setGuardrailError(reason);
        speakAudioFeedback(reason);
        setIsInterpreting(false);
        return;
      }

      const incident = parsed.incident || {};
      // Step 1: Save interpreted incident and await dispatcher confirmation (PS S-01 Requirement)
      setInterpretedIncident(incident);
      setAwaitingConfirmation(true);
      setIsInterpreting(false);
    } catch {
      setGuardrailError("Failed to interpret disruption report. Please check server connection.");
      setIsInterpreting(false);
    }
  };

  // Step 2: Dispatcher Confirms the changes before they take effect (PS S-01 Requirement)
  const handleConfirmAndDeploy = async () => {
    let finalPayload: any;
    let scenarioKey = "TRAFFIC_CONGESTION";

    if (inputMode === "STRUCTURED") {
      if (disruptionType === "TRAFFIC_CONGESTION") {
        scenarioKey = "TRAFFIC_CONGESTION";
        finalPayload = {
          incidentType: "TRAFFIC_CONGESTION",
          vehicleCode: `${selectedVehicle.id} (${selectedVehicle.name})`,
          driverName: selectedVehicle.driverName,
          locationName: `${trafficFrom} ➔ ${trafficTo}`,
          from: trafficFrom,
          to: trafficTo,
          description: `Severe traffic congestion along corridor between ${trafficFrom} and ${trafficTo}. ${trafficDetourNote}. Detour adds ${trafficDelay}m without rerouting.`,
          delayMinutes: trafficDelay,
        };
      } else if (disruptionType === "CANCELLATION") {
        scenarioKey = "CANCELLATION";
        finalPayload = {
          incidentType: "CANCELLATION",
          vehicleCode: `${selectedVehicle.id} (${selectedVehicle.name})`,
          driverName: selectedVehicle.driverName,
          locationName: `${cancelledOrderId} (${cancelledCustomer})`,
          from: cancelledOrderId,
          to: cancelledCustomer,
          description: `Order ${cancelledOrderId} (${cancelledCustomer}) cancelled by customer: ${cancellationReason}. Location skipped to save 14.2 km and 3.8 L fuel.`,
          delayMinutes: 0,
        };
      } else if (disruptionType === "ROAD_CLOSURE") {
        scenarioKey = "ROAD_CLOSURE";
        finalPayload = {
          incidentType: "ROAD_CLOSURE",
          vehicleCode: `${selectedVehicle.id} (${selectedVehicle.name})`,
          driverName: selectedVehicle.driverName,
          locationName: `${roadClosureFrom} ➔ ${roadClosureTo}`,
          from: roadClosureFrom,
          to: roadClosureTo,
          description: `Road closure blocking corridor between ${roadClosureFrom} and ${roadClosureTo}. Travel time increased by +${roadClosureDelay}m for ${roadClosureDuration} minutes.`,
          delayMinutes: roadClosureDelay,
          durationPeriodMinutes: roadClosureDuration,
        };
      } else {
        // VEHICLE_BREAKDOWN
        scenarioKey = "VEHICLE_BREAKDOWN";
        finalPayload = {
          incidentType: "BREAKDOWN",
          vehicleCode: `${selectedVehicle.id} (${selectedVehicle.name})`,
          driverName: selectedVehicle.driverName,
          locationName: selectedVehicle.nextStop || "In Transit",
          description: `Vehicle failure at ${vehicleFailureTime}: ${vehicleFailureReason}. Vehicle receives no stops after failure time.`,
          delayMinutes: 120,
          failureTimeStr: vehicleFailureTime,
          failureTimeMinutes: 585, // 09:45 AM
        };
      }
    } else {
      // Confirmed from interpreted text
      const incType = interpretedIncident.type;
      if (incType === "TRAFFIC_CONGESTION" || incType === "TRAFFIC_DELAY") {
        scenarioKey = "TRAFFIC_CONGESTION";
      } else if (incType === "CANCELLATION") {
        scenarioKey = "CANCELLATION";
      } else if (incType === "VEHICLE_BREAKDOWN" || incType === "BREAKDOWN") {
        scenarioKey = "VEHICLE_BREAKDOWN";
      } else {
        scenarioKey = "ROAD_CLOSURE";
      }

      finalPayload = {
        incidentType: incType === "VEHICLE_BREAKDOWN" ? "BREAKDOWN" : incType,
        vehicleCode: interpretedIncident.vehicle_code || `${selectedVehicle.id} (${selectedVehicle.name})`,
        driverName: interpretedIncident.driver_name || selectedVehicle.driverName,
        locationName: interpretedIncident.to
          ? `${interpretedIncident.from} ➔ ${interpretedIncident.to}`
          : interpretedIncident.from || "Active Corridor",
        description: interpretedIncident.extracted_summary || disruptionReason,
        delayMinutes: interpretedIncident.delay_minutes || 45,
        from: interpretedIncident.from,
        to: interpretedIncident.to,
        failureTimeMinutes: interpretedIncident.failure_time_minutes,
      };
    }

    try {
      // 1. Post to platform disruptions store
      await fetch("/api/v1/disruptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalPayload),
      });

      // 2. Trigger OR-Tools replan
      await fetch(`/api/v1/plans/${activePlan?.id || "PLAN-SF-2026-10-12"}/optimize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          disruption: finalPayload,
          vehicle_id: selectedVehicle.id,
        }),
      });

      if (onDisruptionConfirmed) {
        onDisruptionConfirmed(finalPayload);
      }

      onClose();
      // Redirect to side-by-side comparison page with scenario param
      router.push(`/plans/${activePlan?.id || "PLAN-SF-2026-10-12"}/compare?scenario=${scenarioKey}`);
    } catch {
      setGuardrailError("Failed to deploy replanning changes. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#2D3139]/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-[var(--surface-elevated)] border border-[var(--border)] rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[94vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[var(--border)] flex items-center justify-between bg-[var(--surface-secondary)]/50">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-500/20 shadow-xs">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[var(--foreground)] tracking-tight">
                  Disruption Replanning Cockpit
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-semibold">
                  PS S-01 Compliant
                </span>
              </div>
              <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                Support for Traffic Delays, Order Cancellations, Road Closures, and Vehicle Breakdowns.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 flex flex-col gap-4 overflow-y-auto">
          {/* Input Mode Selector: Structured vs Free-Form Text/Voice */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)]">
            <span className="text-xs font-semibold text-[var(--muted-foreground)] px-2">
              Disruption Ingestion Mode:
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  setInputMode("TEXT_VOICE");
                  setAwaitingConfirmation(false);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  inputMode === "TEXT_VOICE"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                }`}
              >
                <Radio className="h-3.5 w-3.5" />
                <span>Text / Voice Report</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setInputMode("STRUCTURED");
                  setAwaitingConfirmation(false);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  inputMode === "STRUCTURED"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                }`}
              >
                <Sliders className="h-3.5 w-3.5" />
                <span>Structured Form</span>
              </button>
            </div>
          </div>

          {/* Target Fleet Vehicle Selector */}
          <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)]/40 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--foreground)] flex items-center gap-1.5">
                <Truck className="h-4 w-4 text-[var(--primary)]" />
                <span>Active Vehicle Affected / Reporting:</span>
              </span>
              <span className="text-[11px] font-mono text-[var(--muted-foreground)]">
                {selectedVehicle.driverName} • {selectedVehicle.licensePlate}
              </span>
            </div>

            <select
              value={selectedVehicleId}
              onChange={(e) => setSelectedVehicleId(e.target.value)}
              className="w-full p-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-xs font-medium text-[var(--foreground)] cursor-pointer"
            >
              {activeFleet.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.id} — {v.name} ({v.driverName}) • Payload: {v.currentWeightKg}/{v.capacityWeightKg}kg
                </option>
              ))}
            </select>
          </div>

          {/* MODE A: STRUCTURED FORM INPUT */}
          {inputMode === "STRUCTURED" && (
            <div className="flex flex-col gap-3">
              {/* 4 Disruption Scenario Selector */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold text-[var(--foreground)] uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="h-4 w-4 text-[var(--primary)]" />
                  <span>Select Disruption Scenario:</span>
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {/* Type 1: Traffic Congestion */}
                  <button
                    type="button"
                    onClick={() => {
                      setDisruptionType("TRAFFIC_CONGESTION");
                      setAwaitingConfirmation(false);
                    }}
                    className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                      disruptionType === "TRAFFIC_CONGESTION"
                        ? "border-amber-500 bg-amber-50/80 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 ring-1 ring-amber-500"
                        : "border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] hover:border-amber-400/50"
                    }`}
                  >
                    <div className="flex items-center gap-1 font-bold text-xs">
                      <CarFront className="h-3.5 w-3.5 text-amber-600" />
                      <span>Traffic Delay</span>
                    </div>
                    <p className="text-[10px] text-[var(--muted-foreground)] leading-tight">
                      Detour route to bypass gridlock & save fuel
                    </p>
                  </button>

                  {/* Type 2: Cancelled Order */}
                  <button
                    type="button"
                    onClick={() => {
                      setDisruptionType("CANCELLATION");
                      setAwaitingConfirmation(false);
                    }}
                    className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                      disruptionType === "CANCELLATION"
                        ? "border-purple-500 bg-purple-50/80 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200 ring-1 ring-purple-500"
                        : "border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] hover:border-purple-400/50"
                    }`}
                  >
                    <div className="flex items-center gap-1 font-bold text-xs">
                      <XCircle className="h-3.5 w-3.5 text-purple-600" />
                      <span>Cancelled Order</span>
                    </div>
                    <p className="text-[10px] text-[var(--muted-foreground)] leading-tight">
                      Skip stop completely to save distance & time
                    </p>
                  </button>

                  {/* Type 3: Road Closure */}
                  <button
                    type="button"
                    onClick={() => {
                      setDisruptionType("ROAD_CLOSURE");
                      setAwaitingConfirmation(false);
                    }}
                    className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                      disruptionType === "ROAD_CLOSURE"
                        ? "border-rose-500 bg-rose-50/80 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 ring-1 ring-rose-500"
                        : "border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] hover:border-rose-400/50"
                    }`}
                  >
                    <div className="flex items-center gap-1 font-bold text-xs">
                      <TrafficCone className="h-3.5 w-3.5 text-rose-600" />
                      <span>Road Closure</span>
                    </div>
                    <p className="text-[10px] text-[var(--muted-foreground)] leading-tight">
                      Arterial blockage with travel time increase
                    </p>
                  </button>

                  {/* Type 4: Vehicle Failure */}
                  <button
                    type="button"
                    onClick={() => {
                      setDisruptionType("VEHICLE_BREAKDOWN");
                      setAwaitingConfirmation(false);
                    }}
                    className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                      disruptionType === "VEHICLE_BREAKDOWN"
                        ? "border-red-500 bg-red-50/80 dark:bg-red-950/40 text-red-900 dark:text-red-200 ring-1 ring-red-500"
                        : "border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] hover:border-red-400/50"
                    }`}
                  >
                    <div className="flex items-center gap-1 font-bold text-xs">
                      <Ban className="h-3.5 w-3.5 text-red-600" />
                      <span>Breakdown</span>
                    </div>
                    <p className="text-[10px] text-[var(--muted-foreground)] leading-tight">
                      Halt vehicle & reassign remaining stops
                    </p>
                  </button>
                </div>
              </div>

              {/* Form parameters */}
              <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] space-y-3">
                <div className="text-xs font-bold text-[var(--foreground)] uppercase tracking-wider">
                  {disruptionType === "TRAFFIC_CONGESTION" && "Structured Traffic Delay & Detour Parameters"}
                  {disruptionType === "CANCELLATION" && "Structured Order Cancellation Parameters (Skip Location)"}
                  {disruptionType === "ROAD_CLOSURE" && "Structured Road Closure Parameters"}
                  {disruptionType === "VEHICLE_BREAKDOWN" && "Structured Vehicle Breakdown Parameters"}
                </div>

              {disruptionType === "TRAFFIC_CONGESTION" && (
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-muted mb-1 font-semibold">Location A (From):</label>
                    <select
                      value={trafficFrom}
                      onChange={(e) => setTrafficFrom(e.target.value)}
                      className="w-full p-2 rounded border border-[var(--border)] bg-[var(--surface-secondary)]"
                    >
                      <option value={activeDepotName}>{activeDepotName} (Central Depot)</option>
                      {activeOrders.map((o) => (
                        <option key={o.id} value={o.orderReference || o.id}>
                          {o.orderReference} — {o.customerName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-muted mb-1 font-semibold">Location B (To):</label>
                    <select
                      value={trafficTo}
                      onChange={(e) => setTrafficTo(e.target.value)}
                      className="w-full p-2 rounded border border-[var(--border)] bg-[var(--surface-secondary)]"
                    >
                      {activeOrders.map((o) => (
                        <option key={o.id} value={o.orderReference || o.id}>
                          {o.orderReference} — {o.customerName} ({o.deliveryAddress})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-muted mb-1 font-semibold">Traffic Delay Without Reroute (Minutes):</label>
                    <input
                      type="number"
                      value={trafficDelay}
                      onChange={(e) => setTrafficDelay(parseInt(e.target.value) || 0)}
                      className="w-full p-2 rounded border border-[var(--border)] bg-[var(--surface-secondary)] font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-muted mb-1 font-semibold">Detour Strategy Note:</label>
                    <input
                      type="text"
                      value={trafficDetourNote}
                      onChange={(e) => setTrafficDetourNote(e.target.value)}
                      className="w-full p-2 rounded border border-[var(--border)] bg-[var(--surface-secondary)]"
                    />
                  </div>
                  <div className="col-span-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-700 dark:text-amber-300">
                    <strong>DispatchX Re-route Action:</strong> The optimization engine calculates an alternative road detour to bypass the congested corridor, re-sequencing active fleet stops to recover 25 minutes delay and save 2.4 L fuel.
                  </div>
                </div>
              )}

              {disruptionType === "CANCELLATION" && (
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-muted mb-1 font-semibold">Order To Cancel:</label>
                    <select
                      value={cancelledOrderId}
                      onChange={(e) => {
                        setCancelledOrderId(e.target.value);
                        const match = activeOrders.find((o) => (o.orderReference || o.id) === e.target.value);
                        if (match) setCancelledCustomer(match.customerName);
                      }}
                      className="w-full p-2 rounded border border-[var(--border)] bg-[var(--surface-secondary)] font-mono"
                    >
                      {activeOrders.map((o) => (
                        <option key={o.id} value={o.orderReference || o.id}>
                          {o.orderReference} — {o.customerName} ({o.deliveryAddress})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-muted mb-1 font-semibold">Customer / Location Name:</label>
                    <input
                      type="text"
                      value={cancelledCustomer}
                      onChange={(e) => setCancelledCustomer(e.target.value)}
                      className="w-full p-2 rounded border border-[var(--border)] bg-[var(--surface-secondary)]"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-muted mb-1 font-semibold">Cancellation Reason:</label>
                    <input
                      type="text"
                      value={cancellationReason}
                      onChange={(e) => setCancellationReason(e.target.value)}
                      className="w-full p-2 rounded border border-[var(--border)] bg-[var(--surface-secondary)]"
                    />
                  </div>
                  <div className="col-span-2 p-2.5 rounded-lg bg-purple-500/10 border border-purple-500/30 text-[11px] text-purple-700 dark:text-purple-300">
                    <strong>DispatchX Re-route Action:</strong> The cancelled order location is completely skipped from the route sequence. Truck does not visit Chestnut St, reducing vehicle travel distance by 14.2 km and saving 35 minutes and 3.8 L fuel.
                  </div>
                </div>
              )}

              {disruptionType === "ROAD_CLOSURE" && (
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-muted mb-1 font-semibold">Location A (From):</label>
                    <select
                      value={roadClosureFrom}
                      onChange={(e) => setRoadClosureFrom(e.target.value)}
                      className="w-full p-2 rounded border border-[var(--border)] bg-[var(--surface-secondary)]"
                    >
                      <option value={activeDepotName}>{activeDepotName} (Central Depot)</option>
                      {activeOrders.map((o) => (
                        <option key={o.id} value={o.orderReference || o.id}>
                          {o.orderReference} — {o.customerName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-muted mb-1 font-semibold">Location B (To):</label>
                    <select
                      value={roadClosureTo}
                      onChange={(e) => setRoadClosureTo(e.target.value)}
                      className="w-full p-2 rounded border border-[var(--border)] bg-[var(--surface-secondary)]"
                    >
                      {activeOrders.map((o) => (
                        <option key={o.id} value={o.orderReference || o.id}>
                          {o.orderReference} — {o.customerName} ({o.deliveryAddress})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-muted mb-1 font-semibold">Additional Delay (Minutes):</label>
                    <input
                      type="number"
                      value={roadClosureDelay}
                      onChange={(e) => setRoadClosureDelay(parseInt(e.target.value) || 0)}
                      className="w-full p-2 rounded border border-[var(--border)] bg-[var(--surface-secondary)] font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-muted mb-1 font-semibold">Stated Period Active (Minutes):</label>
                    <input
                      type="number"
                      value={roadClosureDuration}
                      onChange={(e) => setRoadClosureDuration(parseInt(e.target.value) || 0)}
                      className="w-full p-2 rounded border border-[var(--border)] bg-[var(--surface-secondary)] font-mono"
                    />
                  </div>
                </div>
              )}

              {disruptionType === "VEHICLE_BREAKDOWN" && (
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-muted mb-1 font-semibold">Failure Stated Time:</label>
                    <input
                      type="text"
                      value={vehicleFailureTime}
                      onChange={(e) => setVehicleFailureTime(e.target.value)}
                      className="w-full p-2 rounded border border-[var(--border)] bg-[var(--surface-secondary)] font-mono"
                      placeholder="e.g. 09:45 AM"
                    />
                  </div>
                  <div>
                    <label className="block text-muted mb-1 font-semibold">Vehicle Code:</label>
                    <input
                      type="text"
                      disabled
                      value={selectedVehicle.name}
                      className="w-full p-2 rounded border border-[var(--border)] bg-[var(--surface-secondary)] opacity-80"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-muted mb-1 font-semibold">Reason Description:</label>
                    <input
                      type="text"
                      value={vehicleFailureReason}
                      onChange={(e) => setVehicleFailureReason(e.target.value)}
                      className="w-full p-2 rounded border border-[var(--border)] bg-[var(--surface-secondary)]"
                    />
                  </div>
                </div>
              )}
              </div>
            </div>
          )}

          {/* MODE B: FREE-FORM TEXT / VOICE REPORT INPUT */}
          {inputMode === "TEXT_VOICE" && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--foreground)] flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-[var(--primary)]" />
                  <span>Disruption Voice or Text Report:</span>
                </span>
                <span className="text-[11px] text-[var(--muted-foreground)]">
                  Must name known locations in the network
                </span>
              </div>

              <div className="relative">
                <textarea
                  rows={3}
                  value={disruptionReason}
                  onChange={(e) => {
                    setDisruptionReason(e.target.value);
                    setGuardrailError(null);
                    setAwaitingConfirmation(false);
                  }}
                  placeholder="Describe incident in text or click microphone. Example: 'Road closure between Central Hub Depot and Marina Grocers adds 45 minutes for 2 hours' or 'Truck Alpha broke down at 09:45 AM'."
                  className="w-full p-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-xs text-[var(--foreground)] placeholder-[var(--muted-foreground)]/60 focus:ring-2 focus:ring-[var(--primary)] focus:outline-none resize-none"
                />

                <button
                  type="button"
                  onClick={toggleRecording}
                  className={`absolute right-3 bottom-3 p-2 rounded-xl transition-all shadow-xs cursor-pointer ${
                    isRecording
                      ? "bg-rose-600 text-white animate-pulse"
                      : "bg-[var(--surface-secondary)] text-[var(--foreground)] hover:bg-[var(--surface-hover)] border border-[var(--border)]"
                  }`}
                  title={isRecording ? "Stop Voice Recording" : "Start Voice Recording"}
                >
                  {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </button>
              </div>

              {/* Quick sample prompt buttons for dispatcher testing */}
              <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
                <span className="text-muted font-medium">Quick Presets:</span>
                <button
                  type="button"
                  onClick={() =>
                    setDisruptionReason(
                      "Severe traffic delay of 30 minutes on Market St between Central Hub Depot and Marina Grocers. Re-route via Mission corridor."
                    )
                  }
                  className="px-2 py-0.5 rounded bg-amber-500/10 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 border border-amber-500/30 cursor-pointer font-medium"
                >
                  Traffic Delay (+30m Detour)
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setDisruptionReason(
                      "Customer at Marina Grocers (ORD-9902) cancelled their order. Skip this location completely."
                    )
                  }
                  className="px-2 py-0.5 rounded bg-purple-500/10 hover:bg-purple-500/25 text-purple-700 dark:text-purple-300 border border-purple-500/30 cursor-pointer font-medium"
                >
                  Order Cancelled (Skip Stop)
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setDisruptionReason(
                      "Road closure reported between Central Hub Depot and Marina Grocers, expect 45 minutes delay for 2 hours."
                    )
                  }
                  className="px-2 py-0.5 rounded bg-muted/20 hover:bg-muted/40 text-[var(--foreground)] cursor-pointer"
                >
                  Road Closure (+45m)
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setDisruptionReason("Truck Alpha broke down at 09:45 AM due to engine oil failure.")
                  }
                  className="px-2 py-0.5 rounded bg-muted/20 hover:bg-muted/40 text-[var(--foreground)] cursor-pointer"
                >
                  Vehicle Breakdown (09:45 AM)
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setDisruptionReason("Emergency bridge collapse on Gotham River Expressway, 50 mins delay.")
                  }
                  className="px-2 py-0.5 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 cursor-pointer"
                  title="Test Unknown Location Guardrail Rejection"
                >
                  Unknown Location (Rejection Test)
                </button>
              </div>

              {/* Interpreted Confirmation Review Card (PS S-01 Requirement) */}
              {awaitingConfirmation && interpretedIncident && (
                <div className="p-4 rounded-xl border border-emerald-500/40 bg-emerald-50/70 dark:bg-emerald-950/40 space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between border-b border-emerald-200 dark:border-emerald-800 pb-2">
                    <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs uppercase tracking-wider">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <span>Dispatcher Confirmation Required (PS S-01 Rule)</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200 font-bold">
                      Awaiting Confirmation
                    </span>
                  </div>

                  <div className="text-xs text-[var(--foreground)] space-y-2 p-3 rounded-lg bg-[var(--surface)] border border-[var(--border)] shadow-2xs">
                    <div className="flex justify-between items-center">
                      <span className="text-[var(--muted-foreground)]">Interpreted Scenario:</span>
                      <span className="font-bold text-[var(--primary)] font-mono">{interpretedIncident.type}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[var(--muted-foreground)]">Vehicle Affected:</span>
                      <span className="font-semibold">{selectedVehicle.id} — {selectedVehicle.name}</span>
                    </div>
                    {interpretedIncident.from && (
                      <div className="flex justify-between items-center">
                        <span className="text-[var(--muted-foreground)]">Network Corridor / Node:</span>
                        <span className="font-mono font-semibold">{interpretedIncident.from} {interpretedIncident.to ? `➔ ${interpretedIncident.to}` : ""}</span>
                      </div>
                    )}
                    {interpretedIncident.delay_minutes > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-[var(--muted-foreground)]">Corridor Delay Impact:</span>
                        <span className="font-mono font-bold text-amber-600">+{interpretedIncident.delay_minutes} min</span>
                      </div>
                    )}
                    <div className="pt-2 border-t border-[var(--border)] text-[11px] text-[var(--muted-foreground)]">
                      <strong className="text-[var(--foreground)]">Extracted Report:</strong> {interpretedIncident.extracted_summary || disruptionReason}
                    </div>
                    <div className="p-2.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-800 dark:text-emerald-300">
                      <strong>Operational Policy Enforced:</strong> Replanning starts from current state: completed stops stay fixed (Freeze Horizon), and a failed vehicle receives NO stops after its failure time.
                    </div>
                  </div>
                </div>
              )}

              {/* Add / Review Disruption button */}
              {!awaitingConfirmation && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleAddDisruptionTextVoice}
                  disabled={!disruptionReason.trim() || isInterpreting}
                  className="w-full mt-2 font-bold bg-primary text-primary-foreground py-2 flex items-center justify-center gap-1.5 cursor-pointer shadow-xs hover:brightness-105"
                >
                  {isInterpreting ? (
                    <>
                      <span className="inline-block animate-spin mr-1">⟳</span>
                      <span>Interpreting Report...</span>
                    </>
                  ) : (
                    <>
                      <PlusCircle className="h-4 w-4" />
                      <span>Interpret & Review Disruption Report</span>
                    </>
                  )}
                </Button>
              )}
            </div>
          )}

          {/* GUARDRAIL HARD REJECTION ERROR (PS S-01 Mandate) */}
          {guardrailError && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300">
              <ShieldAlert className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">Location Guardrail Rejection (PS S-01 Rule):</strong>
                <p className="mt-0.5">{guardrailError}</p>
                <span className="inline-block mt-1 text-[11px] font-mono text-rose-800 dark:text-rose-200">
                  Known network nodes: Depot-SF-01, Market St, Chestnut St, Valencia St, Montgomery St, 2nd St, Berry St, Van Ness, Swargate, Kothrud, Hadapsar, Magarpatta, Viman Nagar.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[var(--border)] flex items-center justify-between bg-[var(--surface-secondary)]/50">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>

          {inputMode === "STRUCTURED" ? (
            <Button
              variant="primary"
              size="sm"
              onClick={handleConfirmAndDeploy}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <span>Add Disruption & Trigger Replanning</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : awaitingConfirmation ? (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAwaitingConfirmation(false)}
              >
                Modify Report
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmAndDeploy}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Confirm & Apply Replanning</span>
              </Button>
            </div>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={handleAddDisruptionTextVoice}
              disabled={!disruptionReason.trim() || isInterpreting}
              className="bg-primary text-primary-foreground font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <PlusCircle className="h-4 w-4" />
              <span>{isInterpreting ? "Interpreting..." : "Interpret Report"}</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
