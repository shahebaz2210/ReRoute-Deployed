"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/shell/app-shell";
import { Button } from "@/components/ui/button";
import { DataTable, Column } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { Route, Plus, FileSpreadsheet, Eye } from "lucide-react";

interface PlanItem {
  id: string;
  planName: string;
  status: string;
  activeVersionNumber: number;
  totalOrders: number;
  totalVehicles: number;
  totalDistanceKm: number;
  createdAt: string;
}

export default function PlansListPage() {
  const [plans, setPlans] = useState<PlanItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v1/plans")
      .then((res) => res.json())
      .then((data) => {
        if (data.data) setPlans(data.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  }, []);

  const columns: Column<PlanItem>[] = [
    {
      key: "id",
      header: "Plan Reference",
      sortable: true,
      render: (r) => <span className="font-mono font-semibold text-[var(--primary)]">{r.id.slice(0, 18)}...</span>,
    },
    {
      key: "planName",
      header: "Plan Name",
      render: (r) => <span className="font-semibold text-[var(--foreground)]">{r.planName}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (r) => <StatusBadge status={r.status === "ACTIVE" ? "APPROVED_REPLAN" : "PENDING"} customLabel={r.status} size="sm" />,
    },
    {
      key: "totalOrders",
      header: "Deliveries",
      align: "right",
      render: (r) => <span className="font-mono text-xs">{r.totalOrders} stops</span>,
    },
    {
      key: "totalVehicles",
      header: "Vehicles",
      align: "right",
      render: (r) => <span className="font-mono text-xs">{r.totalVehicles} units</span>,
    },
    {
      key: "activeVersionNumber",
      header: "Version",
      align: "center",
      render: (r) => <span className="font-mono text-xs px-2 py-0.5 rounded bg-[var(--surface-secondary)]">v{r.activeVersionNumber}</span>,
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (r) => (
        <Link href={`/plans/${r.id}`}>
          <Button variant="outline" size="sm" leftIcon={<Eye className="h-3.5 w-3.5" />}>
            View Plan
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <AppShell>
      <div className="flex flex-col gap-6 max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
              Delivery Plans & Route Manifests
            </h1>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
              Active and historical multi-vehicle route optimization plans.
            </p>
          </div>

          <Link href="/plans/new">
            <Button variant="primary" size="sm" leftIcon={<Plus className="h-4 w-4" />}>
              Create New Plan (Excel/CSV)
            </Button>
          </Link>
        </div>

        <DataTable
          columns={columns}
          data={plans}
          keyExtractor={(r) => r.id}
          isLoading={isLoading}
        />
      </div>
    </AppShell>
  );
}
