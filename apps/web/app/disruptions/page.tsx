"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/shell/app-shell";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Alert } from "@/components/ui/alert";
import { Modal } from "@/components/ui/modal";
import { DataTable, Column } from "@/components/ui/data-table";
import {
  AlertTriangle,
  RotateCw,
  Check,
  X,
  Volume2,
  Mic,
  ArrowRight,
  Truck,
  Package,
  RefreshCw,
  Radio,
  Clock,
  MapPin,
  ExternalLink,
} from "lucide-react";

export interface Incident {
  id: string;
  incidentType: "BREAKDOWN" | "ROAD_CLOSURE" | "TRAFFIC_CONGESTION" | "CANCELLATION" | "DELAY" | "URGENT_ORDER";
  vehicleCode: string;
  driverName: string;
  locationName: string;
  description: string;
  reportedAt: string;
  status: "AWAITING_APPROVAL" | "APPROVED" | "REJECTED";
  affectedOrdersCount: number;
  delayMinutes?: number;
  from?: string;
  to?: string;
}

export default function DisruptionsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([
    {
      id: "INC-901",
      incidentType: "ROAD_CLOSURE",
      vehicleCode: "VH-002 (Truck Beta)",
      driverName: "Marcus Sterling",
      locationName: "Industrial Bypass / Node 3 ➔ Node 7",
      description: "Severe roadwork blocking northbound arterial. Detour adds 40 mins travel time.",
      reportedAt: "10:14 AM",
      status: "AWAITING_APPROVAL",
      affectedOrdersCount: 3,
      delayMinutes: 40,
    },
    {
      id: "INC-902",
      incidentType: "BREAKDOWN",
      vehicleCode: "VH-001 (Truck Alpha)",
      driverName: "Alex Vance",
      locationName: "Exit 4 Junction / Market St",
      description: "Engine oil pressure warning indicator. Safe pull-over at service bay.",
      reportedAt: "09:42 AM",
      status: "APPROVED",
      affectedOrdersCount: 2,
      delayMinutes: 120,
    },
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [isComparingReplan, setIsComparingReplan] = useState(false);

  const fetchIncidents = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/v1/disruptions");
      const json = await res.json();
      if (json.data && Array.isArray(json.data)) {
        setIncidents(json.data);
      }
    } catch (err) {
      console.warn("Using local incidents fallback:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  const handleApprove = async (incident: Incident) => {
    setIncidents((prev) =>
      prev.map((i) => (i.id === incident.id ? { ...i, status: "APPROVED" } : i))
    );
    try {
      await fetch("/api/v1/disruptions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: incident.id, status: "APPROVED" }),
      });
    } catch {
      // Local state already updated
    }
    setSelectedIncident(null);
  };

  const handleReject = async (incident: Incident) => {
    setIncidents((prev) =>
      prev.map((i) => (i.id === incident.id ? { ...i, status: "REJECTED" } : i))
    );
    try {
      await fetch("/api/v1/disruptions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: incident.id, status: "REJECTED" }),
      });
    } catch {
      // Local state already updated
    }
    setSelectedIncident(null);
  };

  const getTypeBadge = (type: Incident["incidentType"]) => {
    switch (type) {
      case "ROAD_CLOSURE":
        return (
          <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-900 flex items-center gap-1 w-fit">
            <span>🛑</span> Road Closure / Blockage
          </span>
        );
      case "TRAFFIC_CONGESTION":
        return (
          <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-900 flex items-center gap-1 w-fit">
            <span>🚦</span> Severe Traffic Congestion
          </span>
        );
      case "CANCELLATION":
        return (
          <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200 dark:border-purple-900 flex items-center gap-1 w-fit">
            <span>❌</span> Delivery Cancellation
          </span>
        );
      case "BREAKDOWN":
        return (
          <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-900 flex items-center gap-1 w-fit">
            <span>⚠️</span> Vehicle Breakdown
          </span>
        );
      default:
        return (
          <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-[var(--surface-secondary)] border border-[var(--border-subtle)] w-fit">
            {type}
          </span>
        );
    }
  };

  const columns: Column<Incident>[] = [
    {
      key: "id",
      header: "Incident ID",
      sortable: true,
      render: (r) => <span className="font-mono font-bold text-[var(--primary)]">{r.id}</span>,
    },
    {
      key: "incidentType",
      header: "Disruption Type",
      render: (r) => getTypeBadge(r.incidentType),
    },
    {
      key: "vehicleCode",
      header: "Vehicle & Driver",
      render: (r) => (
        <div>
          <div className="font-semibold text-xs text-[var(--foreground)] font-mono">{r.vehicleCode}</div>
          <div className="text-[11px] text-[var(--muted-foreground)]">{r.driverName}</div>
        </div>
      ),
    },
    {
      key: "description",
      header: "Incident Summary",
      render: (r) => (
        <div className="max-w-md">
          <div className="text-xs font-medium text-[var(--foreground)]">{r.description}</div>
          <div className="text-[11px] text-[var(--muted-foreground)] flex items-center gap-1 mt-0.5">
            <MapPin className="h-3 w-3 text-[var(--primary)]" />
            <span>Location: {r.locationName}</span>
            {r.delayMinutes ? (
              <span className="text-amber-600 font-semibold font-mono ml-1">(+{r.delayMinutes}m delay)</span>
            ) : null}
          </div>
        </div>
      ),
    },
    {
      key: "reportedAt",
      header: "Reported",
      align: "right",
      render: (r) => <span className="font-mono text-xs">{r.reportedAt}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (r) => (
        <StatusBadge
          status={
            r.status === "AWAITING_APPROVAL"
              ? "AWAITING_APPROVAL"
              : r.status === "APPROVED"
              ? "APPROVED_REPLAN"
              : "FAILED"
          }
          size="sm"
        />
      ),
    },
    {
      key: "actions",
      header: "Action",
      align: "right",
      render: (r) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSelectedIncident(r)}
        >
          Review & Replan
        </Button>
      ),
    },
  ];

  return (
    <AppShell>
      <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-12">
        <Breadcrumb
          items={[
            { label: "Dashboard", href: "/" },
            { label: "Disruptions & Incidents", isCurrent: true },
          ]}
        />

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
              Disruptions & Incident Ingestion
            </h1>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
              Live operational incident roster: Road Closures, Severe Traffic, Cancellations, and Breakdowns.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />}
              onClick={fetchIncidents}
            >
              Refresh Incidents
            </Button>
            <Link href="/">
              <Button
                variant="primary"
                size="sm"
                leftIcon={<AlertTriangle className="h-4 w-4" />}
                className="bg-rose-600 hover:bg-rose-700 text-white font-semibold"
              >
                Report New Disruption
              </Button>
            </Link>
          </div>
        </div>

        {/* Informational Alert Box */}
        <Alert
          variant="warning"
          title="Active Operational Disruption Pool"
          description="Incidents logged via the Dispatcher 'Disruption Detected' console appear here in real time. Approving an incident triggers Google OR-Tools VRPTW replanning to detour affected vehicles."
        />

        {/* Incidents Data Table */}
        <div className="border border-[var(--border)] rounded-xl bg-[var(--surface-elevated)] p-4 shadow-2xs">
          <div className="flex items-center justify-between mb-3 border-b border-[var(--border-subtle)] pb-2.5">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs uppercase tracking-wider text-[var(--foreground)]">
                Active Operational Incidents
              </span>
              <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 font-mono text-[11px] font-bold">
                {incidents.filter((i) => i.status === "AWAITING_APPROVAL").length} Awaiting Approval
              </span>
            </div>
            <span className="text-xs text-[var(--muted-foreground)]">
              Total Recorded: {incidents.length}
            </span>
          </div>

          <DataTable
            data={incidents}
            columns={columns}
            keyExtractor={(item) => item.id}
          />
        </div>

        {/* Human-in-the-Loop Incident Approval / Detail Modal */}
        {selectedIncident && (
          <Modal
            isOpen={true}
            onClose={() => setSelectedIncident(null)}
            title={`Incident Review: ${selectedIncident.id} (${selectedIncident.incidentType})`}
          >
            <div className="flex flex-col gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] space-y-2">
                <div className="flex justify-between">
                  <span className="text-[var(--muted-foreground)]">Vehicle & Driver:</span>
                  <span className="font-bold text-[var(--foreground)]">
                    {selectedIncident.vehicleCode} • {selectedIncident.driverName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted-foreground)]">Location / Corridor:</span>
                  <span className="font-bold text-[var(--foreground)] font-mono">
                    {selectedIncident.locationName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted-foreground)]">Impact Duration:</span>
                  <span className="font-bold text-amber-600 font-mono">
                    +{selectedIncident.delayMinutes || 30} minutes
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted-foreground)]">Downstream Orders Impacted:</span>
                  <span className="font-bold text-rose-600 font-mono">
                    {selectedIncident.affectedOrdersCount} Orders at Risk
                  </span>
                </div>
              </div>

              <div>
                <span className="font-semibold text-[var(--foreground)] block mb-1">
                  Reported Disruption Summary:
                </span>
                <p className="p-3 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--muted-foreground)] italic leading-relaxed">
                  "{selectedIncident.description}"
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[var(--border)] gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleReject(selectedIncident)}
                  className="text-rose-600 hover:text-rose-700"
                >
                  <X className="h-4 w-4 mr-1" />
                  Reject Incident
                </Button>

                <div className="flex items-center gap-2">
                  <Link href="/plans/PLAN-SF-2026-10-12/compare">
                    <Button
                      variant="outline"
                      size="sm"
                    >
                      Compare Route Diff (KEPT / MOVED / BROKEN)
                    </Button>
                  </Link>

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleApprove(selectedIncident)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Approve & Trigger OR-Tools Replanning
                  </Button>
                </div>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </AppShell>
  );
}
