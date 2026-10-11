"use client";

import React, { useState, useMemo, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { comparePlanVersions, StopDeltaStatus } from "@/lib/plans/compare";

function PlanCompareContent() {
  const params = useParams();
  const router = useRouter();
  const planId = (params?.id as string) || "PLAN-SF-2026-10-12";

  const [activeFilter, setActiveFilter] = useState<StopDeltaStatus | "ALL">("ALL");

  // Demo baseline & target plan simulation
  const comparison = useMemo(() => {
    const baseRoutes = [
      {
        vehicle_id: "VH-001 (SF-789-TX)",
        stops: [
          { stop_id: "ORD-9901", sequence: 1, arrival: "08:45 AM", customer: "Apex BioLabs" },
          { stop_id: "ORD-9902", sequence: 2, arrival: "09:30 AM", customer: "Marina Grocers" },
          { stop_id: "ORD-9903", sequence: 3, arrival: "10:15 AM", customer: "Mission Culinary" },
          { stop_id: "ORD-9904", sequence: 4, arrival: "11:20 AM", customer: "Presidio Diagnostic" },
        ],
      },
      {
        vehicle_id: "VH-002 (SF-104-EQ)",
        stops: [
          { stop_id: "ORD-9905", sequence: 1, arrival: "08:50 AM", customer: "BayTech Robotics" },
          { stop_id: "ORD-9906", sequence: 2, arrival: "09:40 AM", customer: "SOMA Digital Media" },
          { stop_id: "ORD-9907", sequence: 3, arrival: "10:35 AM", customer: "Transbay Cleaners" },
        ],
      },
    ];

    const targetRoutes = [
      {
        vehicle_id: "VH-001 (SF-789-TX)",
        stops: [
          { stop_id: "ORD-9901", sequence: 1, arrival: "08:45 AM", customer: "Apex BioLabs" },
          { stop_id: "ORD-9903", sequence: 2, arrival: "09:40 AM", customer: "Mission Culinary" }, // MOVED sequence
          { stop_id: "ORD-9904", sequence: 3, arrival: "10:45 AM", customer: "Presidio Diagnostic" }, // MOVED sequence
        ],
      },
      {
        vehicle_id: "VH-002 (SF-104-EQ)",
        stops: [
          { stop_id: "ORD-9905", sequence: 1, arrival: "08:50 AM", customer: "BayTech Robotics" },
          { stop_id: "ORD-9902", sequence: 2, arrival: "09:55 AM", customer: "Marina Grocers" }, // MOVED from VH-001 to VH-002
          { stop_id: "ORD-9906", sequence: 3, arrival: "10:45 AM", customer: "SOMA Digital Media" },
          { stop_id: "ORD-9907", sequence: 4, arrival: "11:30 AM", customer: "Transbay Cleaners" },
        ],
      },
    ];

    return comparePlanVersions(baseRoutes, targetRoutes);
  }, []);

  const filteredStops = useMemo(() => {
    if (activeFilter === "ALL") return comparison.stop_deltas;
    return comparison.stop_deltas.filter((s) => s.status === activeFilter);
  }, [comparison, activeFilter]);

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Top Header & Breadcrumb */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border">
          <div>
            <div className="text-xs font-semibold text-muted tracking-wider uppercase mb-1">
              Plan Optimization / Version Diff
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              Compare Plan Versions: V{comparison.baseline_version} vs V{comparison.target_version}
            </h1>
            <p className="text-sm text-muted mt-1">
              Review re-routing reassignments, sequence swaps, and operational delta before live deployment.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => router.push(`/plans/${planId}`)}>
              Back to Plan
            </Button>
            <Button
              variant="primary"
              onClick={() => router.push(`/disruptions`)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
            >
              Approve & Deploy V{comparison.target_version}
            </Button>
          </div>
        </div>

        {/* Delta Metric Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="bg-card border border-border rounded-lg p-3">
            <div className="text-xs text-muted font-medium">Total Stops</div>
            <div className="text-xl font-bold text-foreground mt-0.5">{comparison.total_stops}</div>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 rounded-lg p-3">
            <div className="text-xs text-emerald-800 dark:text-emerald-300 font-medium">Kept (Unchanged)</div>
            <div className="text-xl font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">
              {comparison.kept_count}
            </div>
          </div>
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/40 rounded-lg p-3">
            <div className="text-xs text-blue-800 dark:text-blue-300 font-medium">Moved (Reassigned)</div>
            <div className="text-xl font-bold text-blue-700 dark:text-blue-400 mt-0.5">
              {comparison.moved_count}
            </div>
          </div>
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-lg p-3">
            <div className="text-xs text-amber-800 dark:text-amber-300 font-medium">Broken (Unassigned)</div>
            <div className="text-xl font-bold text-amber-700 dark:text-amber-400 mt-0.5">
              {comparison.broken_count}
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-3">
            <div className="text-xs text-muted font-medium">Distance Delta</div>
            <div className="text-xl font-bold text-emerald-600 mt-0.5">{comparison.distance_delta_km} km</div>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-2 border-b border-border pb-2">
          <button
            onClick={() => setActiveFilter("ALL")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeFilter === "ALL"
                ? "bg-primary text-primary-foreground"
                : "text-muted hover:text-foreground hover:bg-card"
            }`}
          >
            All Stops ({comparison.total_stops})
          </button>
          <button
            onClick={() => setActiveFilter("KEPT")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeFilter === "KEPT"
                ? "bg-emerald-600 text-white"
                : "text-muted hover:text-foreground hover:bg-card"
            }`}
          >
            Kept ({comparison.kept_count})
          </button>
          <button
            onClick={() => setActiveFilter("MOVED")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeFilter === "MOVED"
                ? "bg-blue-600 text-white"
                : "text-muted hover:text-foreground hover:bg-card"
            }`}
          >
            Moved ({comparison.moved_count})
          </button>
          <button
            onClick={() => setActiveFilter("BROKEN")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeFilter === "BROKEN"
                ? "bg-amber-600 text-white"
                : "text-muted hover:text-foreground hover:bg-card"
            }`}
          >
            Broken ({comparison.broken_count})
          </button>
        </div>

        {/* Stop Diffs Table */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/40 border-b border-border text-xs text-muted font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Stop / Customer</th>
                  <th className="py-3 px-4">Baseline (V{comparison.baseline_version})</th>
                  <th className="py-3 px-4">Re-plan (V{comparison.target_version})</th>
                  <th className="py-3 px-4">Reason & Justification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredStops.map((stop) => (
                  <tr key={stop.stop_id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-4">
                      {stop.status === "KEPT" && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                          KEPT
                        </span>
                      )}
                      {stop.status === "MOVED" && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                          MOVED
                        </span>
                      )}
                      {stop.status === "BROKEN" && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                          BROKEN
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-foreground">{stop.customer_name}</div>
                      <div className="text-xs text-muted font-mono">{stop.stop_id}</div>
                    </td>
                    <td className="py-3 px-4">
                      {stop.baseline_vehicle ? (
                        <div>
                          <div className="text-xs font-medium text-foreground">{stop.baseline_vehicle}</div>
                          <div className="text-xs text-muted">
                            Stop #{stop.baseline_sequence} • {stop.baseline_arrival}
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-muted italic">None</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {stop.new_vehicle ? (
                        <div>
                          <div className="text-xs font-medium text-blue-600 dark:text-blue-400">
                            {stop.new_vehicle}
                          </div>
                          <div className="text-xs text-muted">
                            Stop #{stop.new_sequence} • {stop.new_arrival}
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-amber-600 font-medium">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs text-muted max-w-xs">{stop.reason}</td>
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

export default function PlanComparePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted">Loading plan comparison...</div>}>
      <PlanCompareContent />
    </Suspense>
  );
}
