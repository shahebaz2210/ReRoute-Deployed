"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/shell/app-shell";
import { FleetStatusCard, FleetVehicle } from "@/components/fleet/fleet-status-card";
import { SearchInput } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Truck, Plus, RefreshCw } from "lucide-react";

export default function FleetOverviewPage() {
  const [vehicles, setVehicles] = useState<FleetVehicle[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isLoading, setIsLoading] = useState(true);

  const fetchFleet = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/v1/fleet");
      const data = await res.json();
      if (data.data) {
        setVehicles(data.data);
      }
    } catch (err) {
      console.error("Failed to load fleet:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFleet();
  }, []);

  const filteredVehicles = vehicles.filter((v) => {
    const matchesSearch =
      v.vehicleCode.toLowerCase().includes(search.toLowerCase()) ||
      v.makeModel.toLowerCase().includes(search.toLowerCase()) ||
      (v.driverName && v.driverName.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === "ALL" || v.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <AppShell>
      <div className="flex flex-col gap-6 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
              Fleet Overview & Capacity
            </h1>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
              Live fleet telemetry, driver assignments, and vehicle volume/weight constraints.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
              onClick={fetchFleet}
              isLoading={isLoading}
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => alert("Add vehicle modal")}
            >
              Add Vehicle
            </Button>
          </div>
        </div>

        {/* Filter controls */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between p-3 rounded-lg border border-[var(--border)] bg-[var(--surface)]">
          <div className="w-full sm:w-72">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search vehicle code, model, driver..."
            />
          </div>

          <div className="w-full sm:w-48">
            <Select
              options={[
                { value: "ALL", label: "All Statuses" },
                { value: "AVAILABLE", label: "Available" },
                { value: "IN_TRANSIT", label: "In Transit" },
                { value: "MAINTENANCE", label: "Maintenance" },
              ]}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            />
          </div>
        </div>

        {/* Vehicle Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVehicles.map((vehicle) => (
            <FleetStatusCard key={vehicle.id} vehicle={vehicle} />
          ))}
        </div>

        {filteredVehicles.length === 0 && !isLoading && (
          <div className="p-12 text-center text-xs text-[var(--muted-foreground)] border border-dashed rounded-xl">
            No vehicles match the selected filter criteria.
          </div>
        )}
      </div>
    </AppShell>
  );
}
