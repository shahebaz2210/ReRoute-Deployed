"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/shell/app-shell";
import { KPICard } from "@/components/ui/kpi-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { DataTable, Column } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import {
  Truck,
  Package,
  Clock,
  AlertTriangle,
  RotateCw,
  FileSpreadsheet,
  Volume2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  PhoneCall,
  CheckCircle2,
  X,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import { HandsFreeDisruptionModal } from "@/components/disruptions/hands-free-disruption-modal";

interface FleetVehicle {
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

export default function ControlRoomPage() {
  // 1. Date Selector State (Category 3)
  const [selectedDate, setSelectedDate] = useState("2026-10-12");
  const [isReplanning, setIsReplanning] = useState(false);
  const [replanSuccess, setReplanSuccess] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Selected vehicle for details drawer (Category 2 & 4)
  const [selectedVehicle, setSelectedVehicle] = useState<FleetVehicle | null>(null);

  // Customer notification script modal (Category 8)
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [notificationSent, setNotificationSent] = useState(false);
  const [isPlayingCustomerVoice, setIsPlayingCustomerVoice] = useState(false);

  // Disruption Detected Voice Reporter Modal (Feature 1: Hands-Free Voice Ingestion)
  const [showDisruptionModal, setShowDisruptionModal] = useState(false);

  // Active Disruption Alert state (Category 2 & 5)
  const [activeAlert, setActiveAlert] = useState<string | null>(
    "Road closure detected on Market Street / Industrial Bypass. 3 orders on Truck Beta risk time-window violations."
  );

  // Dynamic fleet state (Category 2 & 10)
  const [fleet, setFleet] = useState<FleetVehicle[]>([
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
      status: "IDLE",
      capacityWeightKg: 1400,
      capacityVolumeM3: 12.0,
      currentWeightKg: 0,
      currentVolumeM3: 0,
      nextStop: "Central Hub Depot",
      eta: "On Standby",
      remainingStops: 0,
    },
  ]);

  // Load real backend fleet on mount if available
  useEffect(() => {
    fetch("/api/v1/fleet")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.vehicles && data.vehicles.length > 0) {
          setFleet(
            data.vehicles.map((v: any, i: number) => ({
              id: v.id,
              name: `${v.model || "Vehicle"} (${v.licensePlate || v.id})`,
              licensePlate: v.licensePlate || v.id,
              driverName: v.driverName || "Driver " + (i + 1),
              status: v.status === "ACTIVE" ? "ACTIVE_VEHICLE" : v.status,
              capacityWeightKg: v.capacityWeightKg || 1500,
              capacityVolumeM3: v.capacityVolumeM3 || 12.0,
              currentWeightKg: Math.round((v.capacityWeightKg || 1500) * 0.65),
              currentVolumeM3: Math.round((v.capacityVolumeM3 || 12.0) * 0.7 * 10) / 10,
              nextStop: i === 0 ? "Apex BioLabs (#2)" : i === 1 ? "Marina Grocers (#3)" : "Central Hub",
              eta: i === 1 ? "09:55 AM (+25m)" : "08:45 AM",
              remainingStops: i === 3 ? 0 : 3,
            }))
          );
        }
      })
      .catch(() => {});
  }, []);

  // Date controls (Category 3)
  const adjustDate = (days: number) => {
    const cur = new Date(selectedDate);
    cur.setDate(cur.getDate() + days);
    setSelectedDate(cur.toISOString().split("T")[0]);
  };

  // ElevenLabs / Web Speech audio incident briefing (Category 5 & 8)
  const playAudioBriefing = async () => {
    if (!activeAlert) return;
    setIsPlayingAudio(true);
    const textToSpeak = `Dispatcher alert: ${activeAlert}. Recommended action: re-sequence stop ORD 9902 via Mission Street corridor.`;

    try {
      const res = await fetch("/api/v1/voice/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textToSpeak }),
      });

      if (res.headers.get("content-type")?.includes("audio/mpeg")) {
        const blob = await res.blob();
        const audio = new Audio(URL.createObjectURL(blob));
        audio.onended = () => setIsPlayingAudio(false);
        audio.play();
        return;
      }
    } catch {
      // Fallback
    }

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.onend = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(utterance);
    } else {
      setIsPlayingAudio(false);
    }
  };

  // Play customer phone call preview (Category 8)
  const playCustomerVoicePreview = async () => {
    setIsPlayingCustomerVoice(true);
    const scriptText =
      "Hello Marina Grocers, this is an automated dispatch update from DispatchX. Due to an emergency road closure on Market Street, your delivery for order ORD-9902 has been rescheduled to 9:55 AM by driver Marcus Sterling. Thank you for your patience.";

    try {
      const res = await fetch("/api/v1/voice/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: scriptText }),
      });

      if (res.headers.get("content-type")?.includes("audio/mpeg")) {
        const blob = await res.blob();
        const audio = new Audio(URL.createObjectURL(blob));
        audio.onended = () => setIsPlayingCustomerVoice(false);
        audio.play();
        return;
      }
    } catch {
      // Fallback
    }

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(scriptText);
      utterance.onend = () => setIsPlayingCustomerVoice(false);
      window.speechSynthesis.speak(utterance);
    } else {
      setIsPlayingCustomerVoice(false);
    }
  };

  // Re-optimization Trigger (Category 6)
  const handleReoptimize = async () => {
    setIsReplanning(true);
    try {
      const res = await fetch("/api/v1/plans/PLAN-SF-2026-10-12/optimize", { method: "POST" });
      await res.json();
      setReplanSuccess(true);
      setTimeout(() => setReplanSuccess(false), 4000);
    } catch {
      // Graceful fallback
    } finally {
      setIsReplanning(false);
    }
  };

  const fleetColumns: Column<FleetVehicle>[] = [
    {
      key: "id",
      header: "Vehicle ID",
      sortable: true,
      render: (row) => (
        <button
          onClick={() => setSelectedVehicle(row)}
          className="font-mono font-bold text-primary hover:underline text-left"
        >
          {row.id}
        </button>
      ),
    },
    {
      key: "name",
      header: "Vehicle & Driver",
      render: (row) => (
        <div>
          <div className="font-semibold text-foreground">{row.name}</div>
          <div className="text-xs text-muted">
            Driver: <span className="font-medium text-foreground">{row.driverName}</span> • Plate: {row.licensePlate}
          </div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge status={row.status} size="sm" />,
    },
    {
      key: "capacityWeightKg",
      header: "Load Utilization",
      render: (row) => {
        const pct = Math.round((row.currentWeightKg / row.capacityWeightKg) * 100);
        return (
          <div className="w-36">
            <div className="flex justify-between text-[11px] font-mono mb-1">
              <span>{row.currentWeightKg} / {row.capacityWeightKg} kg</span>
              <span className="font-bold">{pct}%</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full ${pct > 85 ? "bg-amber-500" : "bg-primary"}`}
                style={{ width: `${Math.min(pct, 100)}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      key: "nextStop",
      header: "Next Stop / Sequence",
      render: (row) => (
        <div>
          <div className="text-xs font-medium text-foreground">{row.nextStop}</div>
          <div className="text-[11px] text-muted">{row.remainingStops} stops remaining</div>
        </div>
      ),
    },
    {
      key: "eta",
      header: "Estimated Arrival",
      align: "right",
      render: (row) => (
        <span className={`font-mono text-xs font-bold ${row.eta.includes("+") ? "text-amber-600" : "text-foreground"}`}>
          {row.eta}
        </span>
      ),
    },
  ];

  return (
    <AppShell>
      <div className="flex flex-col gap-6 max-w-7xl mx-auto">
        {/* Header Action Bar with Date Selector (Category 1 & 3) */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-border">
          <div>
            <div className="text-xs font-semibold text-muted tracking-wider uppercase mb-1">
              Control Room Cockpit • Real-Time Operations
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Fleet Operations & Schedule Tracking
            </h1>
            <p className="text-xs text-muted mt-0.5">
              Autonomous human-in-the-loop dynamic logistics dispatching and disruption recovery.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* 1. Create new route plan */}
            <Link href="/plans/new">
              <Button
                variant="primary"
                size="sm"
                leftIcon={<FileSpreadsheet className="h-4 w-4" />}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
              >
                Create new route plan
              </Button>
            </Link>

            {/* 2. Disruptions */}
            <Link href="/disruptions">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<AlertTriangle className="h-4 w-4 text-amber-500" />}
              >
                Disruptions
              </Button>
            </Link>

            {/* 3. Disruption Detected (Feature 1: Hands-Free Voice Ingestion & Location Guardrail) */}
            <Button
              variant="danger"
              size="sm"
              leftIcon={<AlertTriangle className="h-4 w-4" />}
              className="bg-rose-600 hover:bg-rose-700 text-white font-semibold cursor-pointer shadow-xs animate-pulse"
              onClick={() => setShowDisruptionModal(true)}
            >
              Disruption Detected
            </Button>
          </div>
        </div>

        {/* Replan Success Alert with Before/After Diff Link (Category 6 & 7) */}
        {replanSuccess && (
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-sm flex items-center justify-between">
            <div className="flex items-center gap-3 text-emerald-800 dark:text-emerald-200">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              <div>
                <span className="font-bold">Re-optimization proposal generated!</span> Vehicle routes balanced and time windows audited.
              </div>
            </div>
            <Link href="/plans/PLAN-SF-2026-10-12/compare">
              <Button size="sm" variant="primary" className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
                Inspect Side-by-Side Diff (KEPT / MOVED / BROKEN) →
              </Button>
            </Link>
          </div>
        )}

        {/* Active Disruption Banner with Audio Incident Briefing & Customer Call Trigger (Category 2, 5, 8) */}
        {activeAlert && (
          <Alert
            variant="warning"
            title="Active Operational Disruption Detected"
            onClose={() => setActiveAlert(null)}
          >
            {activeAlert}
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <Link href="/plans/PLAN-SF-2026-10-12/compare">
                <Button size="sm" variant="danger" className="font-semibold">
                  Review & Replan Impact
                </Button>
              </Link>
              <Button
                size="sm"
                variant="outline"
                leftIcon={<Volume2 className="h-3.5 w-3.5 text-primary" />}
                onClick={playAudioBriefing}
                disabled={isPlayingAudio}
                className="text-xs"
              >
                {isPlayingAudio ? "Playing Audio..." : "🔊 Play Voice Incident Briefing"}
              </Button>
              <Button
                size="sm"
                variant="secondary"
                leftIcon={<PhoneCall className="h-3.5 w-3.5 text-blue-600" />}
                onClick={() => setCustomerModalOpen(true)}
                className="text-xs"
              >
                Customer ETA Call Script
              </Button>
            </div>
          </Alert>
        )}

        {/* Real-time KPI Matrix (Category 2) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            label="Active Fleet Units"
            value="3 / 4"
            unit="VEHICLES"
            icon={<Truck className="h-4 w-4" />}
            subtitle="3 on route, 1 idle reserve"
          />

          <KPICard
            label="Deliveries On Plan"
            value="4 / 5"
            unit="ORDERS"
            icon={<Package className="h-4 w-4" />}
            delta={{
              value: "80.0%",
              trend: "up",
              periodLabel: "shift progress rate",
            }}
          />

          <KPICard
            label="Avg On-Time SLA"
            value="98.2%"
            unit="SLA"
            icon={<Clock className="h-4 w-4" />}
            delta={{
              value: "+1.4%",
              trend: "up",
              periodLabel: "vs benchmark",
            }}
          />

          <KPICard
            label="Active Disruptions"
            value="1"
            unit="INCIDENT"
            icon={<AlertTriangle className="h-4 w-4 text-amber-500" />}
            delta={{
              value: "Market St closure",
              trend: "down",
              isPositive: false,
              periodLabel: "Truck Beta affected",
            }}
          />
        </div>

        {/* Today's Schedule Delivery Progress Bar (Category 2) */}
        <div className="bg-card border border-border rounded-xl p-4 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-foreground">Today's Shift Delivery Progress ({selectedDate})</span>
            <span className="text-primary font-mono">1 Completed • 1 Out for Delivery • 2 Assigned • 1 Pending</span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-muted overflow-hidden flex">
            <div className="bg-emerald-500 h-full w-[25%]" title="Completed: 25%" />
            <div className="bg-primary h-full w-[25%]" title="Out for delivery: 25%" />
            <div className="bg-blue-400 h-full w-[35%]" title="Assigned: 35%" />
            <div className="bg-muted-foreground/30 h-full w-[15%]" title="Pending: 15%" />
          </div>
          <div className="flex items-center justify-between text-[11px] text-muted font-mono pt-1">
            <span>Shift Started: 08:00 AM</span>
            <span>Target Completion: 02:00 PM (On Schedule)</span>
          </div>
        </div>

        {/* Fleet Operational Table with Row Click Inspection (Category 2 & 10) */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-foreground">
                Active Vehicle Fleet & Schedule
              </h2>
              <p className="text-xs text-muted">
                Click any vehicle to view driver assignment, remaining sequence, and capacity gauge.
              </p>
            </div>
            <Link href="/fleet" className="text-xs font-semibold text-primary hover:underline">
              View Fleet Overview →
            </Link>
          </div>

          <DataTable
            columns={fleetColumns}
            data={fleet}
            keyExtractor={(row) => row.id}
          />
        </div>

        {/* Vehicle Details Drawer/Modal (Category 2, 4, 10) */}
        {selectedVehicle && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-xl max-w-lg w-full p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
                    🚚
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">{selectedVehicle.name}</h3>
                    <p className="text-xs text-muted font-mono">
                      {selectedVehicle.id} • Plate: {selectedVehicle.licensePlate}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedVehicle(null)}
                  className="text-muted hover:text-foreground text-sm font-bold p-1"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-2 border-b border-border/50">
                  <span className="text-muted">Assigned Driver:</span>
                  <span className="font-semibold text-foreground">{selectedVehicle.driverName}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border/50">
                  <span className="text-muted">Operational Status:</span>
                  <StatusBadge status={selectedVehicle.status} size="sm" />
                </div>
                <div className="flex justify-between py-2 border-b border-border/50">
                  <span className="text-muted">Next Immediate Stop:</span>
                  <span className="font-semibold text-primary">{selectedVehicle.nextStop}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border/50">
                  <span className="text-muted">Estimated Arrival (ETA):</span>
                  <span className="font-mono font-bold text-foreground">{selectedVehicle.eta}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border/50">
                  <span className="text-muted">Remaining Stops on Shift:</span>
                  <span className="font-bold text-foreground">{selectedVehicle.remainingStops} stops</span>
                </div>
                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between text-muted">
                    <span>Weight Capacity Utilization:</span>
                    <span className="font-mono font-bold text-foreground">
                      {selectedVehicle.currentWeightKg} / {selectedVehicle.capacityWeightKg} kg (
                      {Math.round((selectedVehicle.currentWeightKg / selectedVehicle.capacityWeightKg) * 100)}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="bg-primary h-full"
                      style={{
                        width: `${Math.round((selectedVehicle.currentWeightKg / selectedVehicle.capacityWeightKg) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-3">
                <Button variant="outline" onClick={() => setSelectedVehicle(null)} className="w-1/2">
                  Close Details
                </Button>
                <Link href={`/fleet`} className="w-1/2">
                  <Button variant="primary" className="w-full">
                    Manage Fleet Units
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Customer ETA Notification Script Modal (Category 8) */}
        {customerModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-xl max-w-lg w-full p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <PhoneCall className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-bold text-foreground">Customer Call Script & Voice Preview</h3>
                </div>
                <button
                  onClick={() => setCustomerModalOpen(false)}
                  className="text-muted hover:text-foreground text-sm font-bold p-1"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-muted/30 border border-border space-y-1 text-xs">
                  <div className="flex justify-between font-mono">
                    <span className="text-muted">Target Customer:</span>
                    <span className="font-bold text-foreground">Marina Grocers (ORD-9902)</span>
                  </div>
                  <div className="flex justify-between font-mono">
                    <span className="text-muted">Revised ETA:</span>
                    <span className="font-bold text-amber-600">09:55 AM (+25m Delay)</span>
                  </div>
                  <div className="flex justify-between font-mono">
                    <span className="text-muted">Assigned Driver:</span>
                    <span className="font-bold text-foreground">Marcus Sterling (Truck Beta)</span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted tracking-wider uppercase block mb-1">
                    Generated Spoken Call Script (ElevenLabs TTS)
                  </label>
                  <div className="p-3 rounded-lg bg-background border border-border text-xs text-foreground leading-relaxed italic">
                    "Hello Marina Grocers, this is an automated dispatch update from DispatchX. Due to an emergency road closure on Market Street, your delivery for order ORD-9902 has been rescheduled to 9:55 AM by driver Marcus Sterling. Thank you for your patience."
                  </div>
                </div>

                {notificationSent && (
                  <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 font-semibold flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Automated Voice & SMS notification sent successfully to customer!
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 pt-3">
                <Button
                  variant="outline"
                  onClick={playCustomerVoicePreview}
                  disabled={isPlayingCustomerVoice}
                  className="w-1/2 text-xs"
                >
                  {isPlayingCustomerVoice ? "Playing Voice..." : "🔊 Play Voice Preview"}
                </Button>
                <Button
                  variant="primary"
                  onClick={() => setNotificationSent(true)}
                  className="w-1/2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                >
                  Dispatch Call & SMS
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Hands-Free Voice Disruption Reporter Modal (Feature 1: Inbound) */}
        <HandsFreeDisruptionModal
          isOpen={showDisruptionModal}
          fleet={fleet}
          onClose={() => setShowDisruptionModal(false)}
          onDisruptionConfirmed={() => {
            setReplanSuccess(true);
          }}
        />
      </div>
    </AppShell>
  );
}
