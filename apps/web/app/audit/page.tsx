"use client";

import React, { useState } from "react";
import { AppShell } from "@/components/shell/app-shell";
import { Button } from "@/components/ui/button";

interface AuditEntry {
  id: string;
  timestamp: string;
  actor: "DISPATCHER" | "SYSTEM_OPTIMIZER" | "DRIVER_VOICE" | "SYSTEM_INGESTION";
  action: string;
  target: string;
  details: string;
  hash: string;
  verified: boolean;
}

export default function AuditTrailPage() {
  const [actorFilter, setActorFilter] = useState<string>("ALL");

  const [logs] = useState<AuditEntry[]>([
    {
      id: "AUD-1049",
      timestamp: "2026-10-12 11:32:15 UTC",
      actor: "DISPATCHER",
      action: "PLAN_ACTIVATE",
      target: "PLAN-SF-2026-10-12 (V2)",
      details: "Approved dynamic re-plan after road closure on Market St. Optimistic lock verified.",
      hash: "e7b9...c31a",
      verified: true,
    },
    {
      id: "AUD-1048",
      timestamp: "2026-10-12 11:31:40 UTC",
      actor: "SYSTEM_OPTIMIZER",
      action: "OR_TOOLS_SOLVE",
      target: "VRPTW-JOB-8841",
      details: "Re-optimized 2 vehicles, 7 active stops. Objective cost: $142.50. Solver runtime: 184ms.",
      hash: "82df...aa09",
      verified: true,
    },
    {
      id: "AUD-1047",
      timestamp: "2026-10-12 11:30:12 UTC",
      actor: "DRIVER_VOICE",
      action: "VOICE_INCIDENT_REPORT",
      target: "VH-001 (Alex Vance)",
      details: "ElevenLabs transcribed voice report: 'Major road closure on Market St, +30m delay'.",
      hash: "551e...f982",
      verified: true,
    },
    {
      id: "AUD-1046",
      timestamp: "2026-10-12 08:15:00 UTC",
      actor: "DISPATCHER",
      action: "PLAN_ACTIVATE",
      target: "PLAN-SF-2026-10-12 (V1)",
      details: "Initial baseline dispatch plan activated for San Francisco fleet.",
      hash: "3b21...440c",
      verified: true,
    },
    {
      id: "AUD-1045",
      timestamp: "2026-10-12 07:45:20 UTC",
      actor: "SYSTEM_INGESTION",
      action: "PLAN_IMPORT_EXCEL",
      target: "orders_2026_10_12.xlsx",
      details: "Ingested 12 orders, 0 formula injections detected, 12 rows validated against constraints.",
      hash: "19a4...68fe",
      verified: true,
    },
  ]);

  const filtered = actorFilter === "ALL" ? logs : logs.filter((l) => l.actor === actorFilter);

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dispatchx_audit_log_${Date.now()}.json`;
    a.click();
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border">
          <div>
            <div className="text-xs font-semibold text-muted tracking-wider uppercase mb-1">
              Compliance & Governance
            </div>
            <h1 className="text-2xl font-bold text-foreground">Immutable Audit Trail</h1>
            <p className="text-sm text-muted mt-1">
              Cryptographically verified record of all dispatch actions, optimizations, and voice incidents.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={exportJSON}>
              Export Audit JSON
            </Button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2">
          {["ALL", "DISPATCHER", "SYSTEM_OPTIMIZER", "DRIVER_VOICE", "SYSTEM_INGESTION"].map((actor) => (
            <button
              key={actor}
              onClick={() => setActorFilter(actor)}
              className={`text-xs px-3 py-1.5 rounded-md font-semibold transition-colors ${
                actorFilter === actor
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted border border-border hover:text-foreground"
              }`}
            >
              {actor.replace(/_/g, " ")}
            </button>
          ))}
        </div>

        {/* Audit Log Table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/40 border-b border-border text-xs text-muted font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Event ID / Hash</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Target Entity</th>
                  <th className="py-3 px-4">Operational Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((entry) => (
                  <tr key={entry.id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-mono text-xs font-bold text-foreground">{entry.id}</div>
                      <div className="font-mono text-[10px] text-muted flex items-center gap-1 mt-0.5">
                        <span className="text-emerald-500">🔒</span> {entry.hash}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs text-muted font-mono whitespace-nowrap">
                      {entry.timestamp}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs px-2 py-0.5 rounded font-semibold bg-muted text-foreground">
                        {entry.actor}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs font-semibold text-primary">
                      {entry.action}
                    </td>
                    <td className="py-3 px-4 text-xs font-medium text-foreground">
                      {entry.target}
                    </td>
                    <td className="py-3 px-4 text-xs text-muted max-w-md">
                      {entry.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
