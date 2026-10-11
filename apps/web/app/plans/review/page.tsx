"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { KPICard } from "@/components/ui/kpi-card";
import { DataTable, Column } from "@/components/ui/data-table";
import { IngestionResult, ParsedOrderRow } from "@/lib/ingestion/plan-parser";
import {
  Sparkles,
  Truck,
  Package,
  Layers,
  ArrowLeft,
  CheckCircle2,
  Cpu,
} from "lucide-react";

export default function PlanReviewPage() {
  const router = useRouter();
  const [stagedPlan, setStagedPlan] = useState<IngestionResult | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem("dispatchx-staged-plan");
    if (raw) {
      try {
        setStagedPlan(JSON.parse(raw));
      } catch (err) {
        console.error(err);
      }
    }
  }, []);

  const handleGeneratePlan = async () => {
    setIsOptimizing(true);
    try {
      const res = await fetch("/api/v1/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planName: stagedPlan?.fileName || "Optimized Daily Plan",
          vehicleIds: [
            "019488a0-0000-7000-8000-000000000001",
            "019488a0-0000-7000-8000-000000000002",
            "019488a0-0000-7000-8000-000000000003",
          ],
          orders: stagedPlan?.validRows || [],
        }),
      });

      const data = await res.json();
      if (data.data?.id) {
        router.push(`/plans/${data.data.id}`);
      } else {
        router.push("/plans");
      }
    } catch (err) {
      console.error("Optimization failed:", err);
    } finally {
      setIsOptimizing(false);
    }
  };

  const columns: Column<ParsedOrderRow>[] = [
    {
      key: "orderReference",
      header: "Ref",
      render: (r) => <span className="font-mono font-bold text-[var(--primary)]">{r.orderReference}</span>,
    },
    {
      key: "customerName",
      header: "Customer & Stop Address",
      render: (r) => (
        <div>
          <div className="font-medium text-[var(--foreground)]">{r.customerName}</div>
          <div className="text-[11px] text-[var(--muted-foreground)]">{r.deliveryAddress}</div>
        </div>
      ),
    },
    {
      key: "weightKg",
      header: "Payload",
      align: "right",
      render: (r) => <span className="font-mono">{r.weightKg} kg</span>,
    },
    {
      key: "volumeM3",
      header: "Volume",
      align: "right",
      render: (r) => <span className="font-mono">{r.volumeM3} m³</span>,
    },
    {
      key: "timeWindowStart",
      header: "Time Window",
      render: (r) => (
        <span className="font-mono text-xs">{r.timeWindowStart} – {r.timeWindowEnd}</span>
      ),
    },
    {
      key: "priority",
      header: "Priority",
      render: (r) => (
        <span className="font-mono text-[11px] font-semibold text-[var(--text-secondary)]">
          {r.priority}
        </span>
      ),
    },
  ];

  return (
    <AppShell>
      <div className="flex flex-col gap-6 max-w-6xl mx-auto">
        <Breadcrumb
          items={[
            { label: "Dashboard", href: "/" },
            { label: "Delivery Plans", href: "/plans" },
            { label: "Plan Review & Solvers", isCurrent: true },
          ]}
        />

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
                Planning Data Review
              </h1>
              <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                Staged delivery commitments ready for OR-Tools VRPTW matrix route optimization.
              </p>
            </div>
          </div>

          <Button
            variant="primary"
            size="lg"
            isLoading={isOptimizing}
            leftIcon={<Cpu className="h-4 w-4" />}
            onClick={handleGeneratePlan}
          >
            Generate Optimized Routes
          </Button>
        </div>

        {/* Plan stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <KPICard
            label="Total Deliveries"
            value={stagedPlan?.validRows.length || 6}
            unit="STOPS"
            icon={<Package className="h-4 w-4" />}
          />
          <KPICard
            label="Gross Payload"
            value={stagedPlan?.summary.totalWeightKg || 3640}
            unit="KG"
            icon={<Truck className="h-4 w-4" />}
          />
          <KPICard
            label="Fleet Allocation"
            value="3"
            unit="VEHICLES"
            icon={<Layers className="h-4 w-4" />}
            subtitle="TRK-01, TRK-02, VAN-03"
          />
        </div>

        <Alert variant="info" title="Human-in-the-Loop Safeguard">
          Generated routes will initially be staged as <strong>Proposed</strong>. You will be able to review stop sequences,
          travel distances, and time-window slacks before activating the plan for fleet execution.
        </Alert>

        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-[var(--foreground)]">
            Staged Delivery Commitments
          </h3>
          <DataTable
            columns={columns}
            data={stagedPlan?.validRows || []}
            keyExtractor={(r) => r.orderReference}
          />
        </div>
      </div>
    </AppShell>
  );
}
