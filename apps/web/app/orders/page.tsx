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

  const filtered = orders.filter(
    (o) =>
      o.orderReference.toLowerCase().includes(search.toLowerCase()) ||
      o.customerName.toLowerCase().includes(search.toLowerCase()) ||
      o.deliveryAddress.toLowerCase().includes(search.toLowerCase())
  );

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
      header: "Status",
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
              Live manifest orders with weight, volumetric space, and time window SLA constraints.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchOrders} isLoading={isLoading}>
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
            <Button variant="primary" size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={() => alert("Create order modal")}>
              Add Order
            </Button>
          </div>
        </div>

        <div className="w-full sm:w-80">
          <SearchInput value={search} onChange={setSearch} placeholder="Search order ref, customer..." />
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
