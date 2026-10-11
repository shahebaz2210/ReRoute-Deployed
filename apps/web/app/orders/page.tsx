"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/shell/app-shell";
import { DataTable, Column } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { SearchInput } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Package, Plus, RefreshCw } from "lucide-react";

interface OrderItem {
  id: string;
  orderReference: string;
  customerName: string;
  deliveryAddress: string;
  weightKg: number;
  volumeM3: number;
  timeWindowStart: string;
  timeWindowEnd: string;
  status: string;
  priority: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/v1/orders");
      const data = await res.json();
      if (data.data) setOrders(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const counts = {
    all: orders.length,
    inTransit: orders.filter((o) => o.status === "IN_TRANSIT").length,
    delivered: orders.filter((o) => o.status === "DELIVERED").length,
    stucked: orders.filter((o) => o.status === "STUCKED" || o.status === "STUCK").length,
    canceled: orders.filter((o) => o.status === "CANCELED" || o.status === "CANCELLED").length,
  };

  const filtered = orders.filter((o) => {
    const matchesSearch =
      o.orderReference.toLowerCase().includes(search.toLowerCase()) ||
      o.customerName.toLowerCase().includes(search.toLowerCase()) ||
      o.deliveryAddress.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "IN_TRANSIT" && o.status === "IN_TRANSIT") ||
      (statusFilter === "DELIVERED" && o.status === "DELIVERED") ||
      (statusFilter === "STUCKED" && (o.status === "STUCKED" || o.status === "STUCK")) ||
      (statusFilter === "CANCELED" && (o.status === "CANCELED" || o.status === "CANCELLED"));

    return matchesSearch && matchesStatus;
  });

  const columns: Column<OrderItem>[] = [
    {
      key: "orderReference",
      header: "Order Ref",
      sortable: true,
      render: (r) => <span className="font-mono font-semibold text-[var(--primary)]">{r.orderReference}</span>,
    },
    {
      key: "customerName",
      header: "Customer",
      render: (r) => <span className="font-semibold text-[var(--foreground)]">{r.customerName}</span>,
    },
    {
      key: "deliveryAddress",
      header: "Destination Address",
      render: (r) => <span className="text-xs text-[var(--text-secondary)]">{r.deliveryAddress}</span>,
    },
    {
      key: "weightKg",
      header: "Payload",
      align: "right",
      render: (r) => <span className="font-mono text-xs">{r.weightKg} kg · {r.volumeM3} m³</span>,
    },
    {
      key: "timeWindowStart",
      header: "Window",
      render: (r) => <span className="font-mono text-xs">{r.timeWindowStart} – {r.timeWindowEnd}</span>,
    },
    {
      key: "status",
      header: "Live Status",
      render: (r) => <StatusBadge status={r.status} size="sm" />,
    },
  ];

  return (
    <AppShell>
      <div className="flex flex-col gap-6 max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
              Delivery Commitments & Orders
            </h1>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
              Live manifest tracking: In Transit, Delivered, Stucked (Traffic/Disruptions), and Canceled.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchOrders} isLoading={isLoading}>
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
            <Button variant="primary" size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={() => alert("Create order commitment")}>
              Add Order
            </Button>
          </div>
        </div>

        {/* Status Filter Badges / Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-[var(--border)] pb-3">
          <button
            onClick={() => setStatusFilter("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              statusFilter === "ALL"
                ? "bg-[#2D3139] text-white shadow-xs"
                : "bg-[var(--surface-secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }`}
          >
            <span>All Orders</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">{counts.all}</span>
          </button>

          <button
            onClick={() => setStatusFilter("IN_TRANSIT")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              statusFilter === "IN_TRANSIT"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900"
            }`}
          >
            <span>🚚 In Transit</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-500/20">{counts.inTransit}</span>
          </button>

          <button
            onClick={() => setStatusFilter("DELIVERED")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              statusFilter === "DELIVERED"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-900"
            }`}
          >
            <span>✅ Delivered</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500/20">{counts.delivered}</span>
          </button>

          <button
            onClick={() => setStatusFilter("STUCKED")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              statusFilter === "STUCKED"
                ? "bg-amber-600 text-white shadow-xs"
                : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200/60 dark:border-amber-900"
            }`}
          >
            <span>⚠️ Stucked / Delayed</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/20">{counts.stucked}</span>
          </button>

          <button
            onClick={() => setStatusFilter("CANCELED")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              statusFilter === "CANCELED"
                ? "bg-slate-700 text-white shadow-xs"
                : "bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300 border border-slate-200 dark:border-slate-800"
            }`}
          >
            <span>❌ Canceled</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-500/20">{counts.canceled}</span>
          </button>
        </div>

        <div className="w-full sm:w-80">
          <SearchInput value={search} onChange={setSearch} placeholder="Search order ref, customer, address..." />
        </div>

        <DataTable
          columns={columns}
          data={filtered}
          keyExtractor={(r) => r.id}
          isLoading={isLoading}
        />
      </div>
    </AppShell>
  );
}
