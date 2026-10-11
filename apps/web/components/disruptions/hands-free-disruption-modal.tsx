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
} from "lucide-react";

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
  const activeFleet = fleet && fleet.length > 0 ? fleet : DEFAULT_FLEET;
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(activeFleet[0]?.id || "VH-001");
  const [disruptionType, setDisruptionType] = useState<"ROAD_CLOSURE" | "TRAFFIC_CONGESTION" | "CANCELLATION">("ROAD_CLOSURE");
  const [isRecording, setIsRecording] = useState(false);
  const [disruptionReason, setDisruptionReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [guardrailError, setGuardrailError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);

  const selectedVehicle =
    activeFleet.find((v) => v.id === selectedVehicleId) || activeFleet[0];

  // Initialize Speech Recognition if browser supports it
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onstart = () => {
          setIsRecording(true);
        };

        recognition.onresult = (event: any) => {
          const current = event.resultIndex;
          const text = event.results[current][0].transcript;
          setDisruptionReason(text);
        };

        recognition.onerror = () => {
          setIsRecording(false);
        };

        recognition.onend = () => {
          setIsRecording(false);
        };

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

  const speakAudioFeedback = async (text: string) => {
    try {
      const res = await fetch("/api/v1/voice/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (res.headers.get("content-type")?.includes("audio/mpeg")) {
        const blob = await res.blob();
        const audio = new Audio(URL.createObjectURL(blob));
        audio.play();
        return;
      }
    } catch {
      // Fallback
    }

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleAddDisruption = async () => {
    if (!disruptionReason.trim()) return;

    setIsSubmitting(true);
    setGuardrailError(null);

    try {
      // 1. NLP parse voice/text to extract locations and test location guardrail
      const transcribeRes = await fetch("/api/v1/voice/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: disruptionReason,
          vehicle_id: selectedVehicle.id,
          disruption_type: disruptionType,
        }),
      });

      const parsedData = await transcribeRes.json();

      if (parsedData.guardrailRejected) {
        // Enforce Location Guardrail Rejection (PS S-01 constraint)
        const reason =
          parsedData.voiceFeedback || "Location unrecognized, please state a valid sector.";
        setGuardrailError(reason);
        speakAudioFeedback(reason);
        setIsSubmitting(false);
        return;
      }

      const incident = parsedData.incident || {};

      // 2. Add directly to Disruptions Page (/api/v1/disruptions)
      await fetch("/api/v1/disruptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          incidentType: disruptionType,
          vehicleCode: `${selectedVehicle.id} (${selectedVehicle.name})`,
          driverName: selectedVehicle.driverName,
          locationName: incident.from && incident.to
            ? `${incident.from} ➔ ${incident.to}`
            : incident.from || selectedVehicle.nextStop || "Active Corridor",
          description: disruptionReason,
          delayMinutes: incident.delay_min || (disruptionType === "CANCELLATION" ? 0 : disruptionType === "TRAFFIC_CONGESTION" ? 35 : 60),
          from: incident.from,
          to: incident.to,
        }),
      });

      // 3. Trigger OR-Tools replan in background
      fetch("/api/v1/plans/PLAN-SF-2026-10-12/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          disruption: incident,
          vehicle_id: selectedVehicle.id,
        }),
      }).catch(() => {});

      if (onDisruptionConfirmed) {
        onDisruptionConfirmed(incident);
      }

      // 4. Directly take to Disruptions Page
      onClose();
      router.push("/disruptions");
    } catch (err: any) {
      setGuardrailError("Failed to add disruption. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-xl bg-[var(--surface-elevated)] border border-[var(--border)] rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[var(--border)] flex items-center justify-between bg-[var(--surface-secondary)]/50">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-500/20 shadow-xs">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--foreground)] tracking-tight">
                Disruption Detected
              </h2>
              <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                Select active fleet vehicle, choose disruption type, and provide reason via text or voice.
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
        <div className="p-5 flex flex-col gap-4.5 overflow-y-auto">
          {/* 1. Current Active Fleet Detail & Selector */}
          <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)]/40 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--foreground)] uppercase tracking-wider flex items-center gap-1.5">
                <Truck className="h-4 w-4 text-[var(--primary)]" />
                <span>Select Active Fleet Vehicle:</span>
              </span>
              <span className="text-[11px] font-mono font-medium text-[var(--muted-foreground)]">
                {activeFleet.length} Vehicles In Fleet
              </span>
            </div>

            {/* Vehicle Selector Dropdown */}
            <select
              value={selectedVehicleId}
              onChange={(e) => {
                setSelectedVehicleId(e.target.value);
                setGuardrailError(null);
              }}
              className="w-full p-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-xs font-semibold text-[var(--foreground)] focus:ring-2 focus:ring-[var(--primary)] focus:outline-none cursor-pointer"
              aria-label="Select fleet vehicle"
            >
              {activeFleet.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.id} — {v.name} • Driver: {v.driverName} ({v.licensePlate})
                </option>
              ))}
            </select>

            {/* Current Active Fleet Detail Display Card */}
            {selectedVehicle && (
              <div className="p-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-[var(--primary)]">
                      {selectedVehicle.id}
                    </span>
                    <span className="text-xs font-semibold text-[var(--foreground)]">
                      {selectedVehicle.name}
                    </span>
                    <span className="text-[11px] font-mono px-1.5 py-0.2 rounded bg-[var(--surface-secondary)] border border-[var(--border)] text-[var(--muted-foreground)]">
                      {selectedVehicle.licensePlate}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    {selectedVehicle.status.replace(/_/g, " ")}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 border-t border-[var(--border-subtle)] text-xs">
                  <div className="flex items-center gap-1.5 text-[var(--muted-foreground)]">
                    <User className="h-3.5 w-3.5 text-[var(--primary)]" />
                    <span>Driver: <strong className="text-[var(--foreground)]">{selectedVehicle.driverName}</strong></span>
                  </div>

                  <div className="flex items-center gap-1.5 text-[var(--muted-foreground)]">
                    <Package className="h-3.5 w-3.5 text-blue-500" />
                    <span>Payload: <strong className="text-[var(--foreground)] font-mono">{selectedVehicle.currentWeightKg}/{selectedVehicle.capacityWeightKg}kg</strong></span>
                  </div>

                  <div className="flex items-center gap-1.5 text-[var(--muted-foreground)] col-span-2 sm:col-span-1">
                    <MapPin className="h-3.5 w-3.5 text-amber-500" />
                    <span className="truncate">Next: <strong className="text-[var(--foreground)]">{selectedVehicle.nextStop}</strong></span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 2. Disruption Type Options */}
          <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)]/40 flex flex-col gap-2.5">
            <span className="text-xs font-semibold text-[var(--foreground)] uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="h-4 w-4 text-[var(--primary)]" />
              <span>Disruption Type Option:</span>
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {/* Option A: Road Closures & Blockages */}
              <button
                type="button"
                onClick={() => setDisruptionType("ROAD_CLOSURE")}
                className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                  disruptionType === "ROAD_CLOSURE"
                    ? "border-rose-500 bg-rose-50/80 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 ring-1 ring-rose-500"
                    : "border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] hover:border-rose-400/50"
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <TrafficCone className="h-4 w-4 text-rose-600" />
                  <span>Road Closures & Blockages</span>
                </div>
                <p className="text-[11px] text-[var(--muted-foreground)] leading-tight">
                  Flooding, bridge closed, street blockages (+delay on segment)
                </p>
              </button>

              {/* Option B: Severe Traffic Congestion */}
              <button
                type="button"
                onClick={() => setDisruptionType("TRAFFIC_CONGESTION")}
                className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                  disruptionType === "TRAFFIC_CONGESTION"
                    ? "border-amber-500 bg-amber-50/80 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 ring-1 ring-amber-500"
                    : "border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] hover:border-amber-400/50"
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <CarFront className="h-4 w-4 text-amber-600" />
                  <span>Severe Traffic Congestion</span>
                </div>
                <p className="text-[11px] text-[var(--muted-foreground)] leading-tight">
                  High-density congestion, accident standstill (+25-45m)
                </p>
              </button>

              {/* Option C: Delivery Cancellations */}
              <button
                type="button"
                onClick={() => setDisruptionType("CANCELLATION")}
                className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                  disruptionType === "CANCELLATION"
                    ? "border-purple-500 bg-purple-50/80 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200 ring-1 ring-purple-500"
                    : "border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] hover:border-purple-400/50"
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <Ban className="h-4 w-4 text-purple-600" />
                  <span>Delivery Cancellations</span>
                </div>
                <p className="text-[11px] text-[var(--muted-foreground)] leading-tight">
                  Customer cancelled, closed store, remove delivery from route
                </p>
              </button>
            </div>
          </div>

          {/* 3. Reason of Disruptions Input (Text or Voice) */}
          <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)]/40 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--foreground)] uppercase tracking-wider flex items-center gap-1.5">
                <Radio className="h-4 w-4 text-rose-500" />
                <span>Reason of Disruption (Input as Text or Voice):</span>
              </span>

              {/* Voice Radio In / Mic Button */}
              <button
                type="button"
                onClick={toggleRecording}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isRecording
                    ? "bg-rose-600 text-white animate-pulse"
                    : "bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90"
                }`}
                aria-label="Toggle voice microphone input"
              >
                {isRecording ? (
                  <>
                    <MicOff className="h-3.5 w-3.5" />
                    <span>Listening... (Tap to finish)</span>
                  </>
                ) : (
                  <>
                    <Mic className="h-3.5 w-3.5" />
                    <span>Radio In / Mic</span>
                  </>
                )}
              </button>
            </div>

            {/* Textarea for Text input or Spoken Audio Transcript */}
            <textarea
              rows={3}
              placeholder={
                disruptionType === "ROAD_CLOSURE"
                  ? "Speak or type road closure reason (e.g., 'Major waterlogging between Node 3 and Node 7. Traffic is halted for at least an hour.')..."
                  : disruptionType === "TRAFFIC_CONGESTION"
                  ? "Speak or type traffic congestion reason (e.g., 'Severe gridlock on Market St near 4th St. 40 minutes travel delay expected.')..."
                  : "Speak or type cancellation reason (e.g., 'Customer at Marina Grocers cancelled order ORD-9902. Skip stop and recalculate.')..."
              }
              value={disruptionReason}
              onChange={(e) => {
                setDisruptionReason(e.target.value);
                setGuardrailError(null);
              }}
              className="w-full p-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-xs text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:ring-2 focus:ring-[var(--primary)] focus:outline-none resize-none"
            />

            {/* Location Guardrail Rejection Notice if applicable */}
            {guardrailError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 flex flex-col gap-1 text-xs">
                <div className="flex items-center gap-1.5 font-bold">
                  <XCircle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0" />
                  <span>Location Guardrail Rejection (PS S-01 Rule):</span>
                </div>
                <p className="pl-5 text-xs font-semibold">"{guardrailError}"</p>
                <p className="pl-5 text-[11px] text-rose-600 dark:text-rose-400">
                  Policy: Unknown locations cannot be guessed. Please state a valid sector.
                </p>
              </div>
            )}

            {/* Direct Add Disruption Action Button */}
            <div className="flex items-center justify-between pt-2 border-t border-[var(--border-subtle)]">
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                className="text-xs"
              >
                Cancel
              </Button>

              <Button
                variant="primary"
                size="sm"
                isLoading={isSubmitting}
                disabled={!disruptionReason.trim()}
                onClick={handleAddDisruption}
                className="bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs flex items-center gap-1.5"
              >
                <Plus className="h-4 w-4" />
                <span>Add Disruption</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
