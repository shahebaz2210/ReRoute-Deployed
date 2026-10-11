"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { DataTable, Column } from "@/components/ui/data-table";
import {
  IngestionResult,
  IngestionRowError,
  ParsedOrderRow,
  VehiclesIngestionResult,
} from "@/lib/ingestion/plan-parser";
import { FleetMap, GeoMarker } from "@/components/map/fleet-map";
import {
  FileSpreadsheet,
  Upload,
  AlertTriangle,
  CheckCircle,
  FileCheck,
  Download,
  Info,
  Truck,
  Cpu,
  Building2,
  MapPin,
  Clock,
  Fuel,
  Weight,
} from "lucide-react";

export default function CreatePlanPage() {
  const router = useRouter();
  const ordersInputRef = useRef<HTMLInputElement>(null);
  const vehiclesInputRef = useRef<HTMLInputElement>(null);

  const [ordersFile, setOrdersFile] = useState<File | null>(null);
  const [vehiclesFile, setVehiclesFile] = useState<File | null>(null);

  const [ordersResult, setOrdersResult] = useState<IngestionResult | null>(null);
  const [vehiclesResult, setVehiclesResult] = useState<VehiclesIngestionResult | null>(null);
  const [depotCenter, setDepotCenter] = useState<{ id: string; latitude: number; longitude: number } | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const executeUpload = async (newOrdersFile: File | null, newVehiclesFile: File | null) => {
    setIsUploading(true);
    setGeneralError(null);

    const formData = new FormData();
    if (newOrdersFile) formData.append("ordersFile", newOrdersFile);
    if (newVehiclesFile) formData.append("vehiclesFile", newVehiclesFile);

    try {
      const res = await fetch("/api/v1/plans/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.ordersResult) setOrdersResult(data.ordersResult);
      if (data.vehiclesResult) setVehiclesResult(data.vehiclesResult);
      if (data.depotCenter) setDepotCenter(data.depotCenter);

      if (data.ordersResult?.success && data.vehiclesResult?.success) {
        sessionStorage.setItem("dispatchx-staged-plan", JSON.stringify(data));
      }
    } catch (err: unknown) {
      console.error("Upload error:", err);
      setGeneralError("An unexpected network error occurred while processing plan files.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleOrdersSelect = (file: File) => {
    setOrdersFile(file);
    executeUpload(file, vehiclesFile);
  };

  const handleVehiclesSelect = (file: File) => {
    setVehiclesFile(file);
    executeUpload(ordersFile, file);
  };

  // 1. Pune Swargate Benchmark (Default Central Depot: 18.5018° N, 73.8586° E)
  const loadPuneBenchmark = () => {
    const ordersCsv = `order_id,customer_name,delivery_address,latitude,longitude,weight_kg,volume_m3,time_window_start,time_window_end,priority
ORD-PN-101,Cummins India Engine Hub,Kothrud Industrial Area Pune,18.5074,73.8077,420,2.8,08:30,11:30,STANDARD
ORD-PN-102,Deccan Gymkhana Retail Express,FC Road Deccan Gymkhana Pune,18.5167,73.8415,280,1.6,09:00,12:00,EXPRESS
ORD-PN-103,Shivaji Nagar Metro Logistics,Shivaji Nagar Pune,18.5314,73.8446,350,2.1,10:00,14:00,STANDARD
ORD-PN-104,Serum Institute Cargo Gate,Solapur Road Hadapsar Pune,18.5089,73.9259,650,4.2,08:00,11:00,CRITICAL
ORD-PN-105,Magarpatta Cybercity Tech Hub,Magarpatta City Hadapsar Pune,18.5147,73.9298,310,1.9,09:30,12:30,STANDARD
ORD-PN-106,EON Free Zone IT Deliveries,Kharadi Knowledge Park Pune,18.5515,73.9349,490,3.0,11:00,15:00,EXPRESS
ORD-PN-107,Pune Central Rail Freight Depot,Raja Bahadur Mill Road Pune,18.5284,73.8739,780,5.1,08:30,12:00,STANDARD
ORD-PN-108,Yerawada Commerzone Express,Samrat Ashok Path Yerawada Pune,18.5529,73.8796,260,1.7,10:00,14:00,STANDARD
ORD-PN-109,Viman Nagar Air Cargo Hub,Viman Nagar Pune,18.5679,73.9143,540,3.6,11:00,15:30,CRITICAL`;

    const vehiclesCsv = `vehicle_id,vehicle_code,vehicle_type,weight_capacity,volume_capacity,fuel_efficiency,fuel_efficiency_unit,shift_start_time,shift_end_time,start_location,start_latitude,start_longitude
VH-001,MH-12-TRK-01,Tata Ultra 1918.T Truck,2500,18.0,5.2,km_per_litre,08:00,18:00,DEPOT-PUNE-SWARGATE,18.5018,73.8586
VH-002,MH-12-TRK-02,Tata Ace EV Electric,1200,10.5,6.8,km_per_litre,08:00,18:00,DEPOT-PUNE-SWARGATE,18.5018,73.8586
VH-003,MH-12-VAN-03,Ashok Leyland BADA DOST Cargo,1800,14.0,5.8,km_per_litre,08:30,17:30,DEPOT-PUNE-SWARGATE,18.5018,73.8586`;

    const oFile = new File([new Blob([ordersCsv], { type: "text/csv" })], "orders_pune.csv", { type: "text/csv" });
    const vFile = new File([new Blob([vehiclesCsv], { type: "text/csv" })], "vehicles_pune.csv", { type: "text/csv" });
    setOrdersFile(oFile);
    setVehiclesFile(vFile);
    executeUpload(oFile, vFile);
  };

  // 2. Mumbai India Benchmark
  const loadMumbaiBenchmark = () => {
    const ordersCsv = `order_id,customer_name,delivery_address,latitude,longitude,weight_kg,volume_m3,time_window_start,time_window_end,priority
ORD-IN-1001,Tata Consultancy Services Hub,Hiranandani Business Park Powai Mumbai,19.1176,72.9060,240,1.2,08:30,11:30,STANDARD
ORD-IN-1002,Reliance Retail Logistics Center,MIDC Andheri East Mumbai,19.1197,72.8468,450,2.5,09:00,12:00,EXPRESS
ORD-IN-1003,Bharat Petroleum Wadala Terminal,Sewri-Wadala Road Mumbai,19.0178,72.8562,920,5.8,10:00,14:00,STANDARD
ORD-IN-1004,Godrej & Boyce Industrial Complex,Pirojshanagar Vikhroli Mumbai,19.1009,72.9295,380,1.9,11:00,15:00,CRITICAL
ORD-IN-1005,Apollo MedSkills Healthcare,Sector 11 CBD Belapur Navi Mumbai,19.0222,73.0416,520,3.1,08:00,10:30,CRITICAL
ORD-IN-1006,Mahindra Auto Logistics Hub,Akurli Road Kandivali East Mumbai,19.2062,72.8534,850,4.8,13:00,17:00,STANDARD`;

    const vehiclesCsv = `vehicle_id,vehicle_code,vehicle_type,weight_capacity,volume_capacity,fuel_efficiency,fuel_efficiency_unit,shift_start_time,shift_end_time,start_location,start_latitude,start_longitude
VH-IN-01,MH-01-TRK,Tata Ultra 1918.T Truck,2500,18.0,5.2,km_per_litre,08:00,18:00,DEPOT-MUMBAI-BKC,19.0760,72.8777
VH-IN-02,MH-02-EV,Tata Ace EV Electric,1200,10.5,6.8,km_per_litre,08:00,18:00,DEPOT-MUMBAI-BKC,19.0760,72.8777
VH-IN-03,MH-03-HYB,Ashok Leyland BADA DOST Cargo,1800,14.0,5.8,km_per_litre,08:30,17:30,DEPOT-MUMBAI-BKC,19.0760,72.8777`;

    const oFile = new File([new Blob([ordersCsv], { type: "text/csv" })], "orders_mumbai.csv", { type: "text/csv" });
    const vFile = new File([new Blob([vehiclesCsv], { type: "text/csv" })], "vehicles_mumbai.csv", { type: "text/csv" });
    setOrdersFile(oFile);
    setVehiclesFile(vFile);
    executeUpload(oFile, vFile);
  };

  // 2. Bengaluru India Benchmark
  const loadBengaluruBenchmark = () => {
    const ordersCsv = `order_id,customer_name,delivery_address,latitude,longitude,weight_kg,volume_m3,time_window_start,time_window_end,priority
ORD-BLR-01,Infosys Electronic City Campus,Hosur Road Electronic City Bengaluru,12.8452,77.6602,320,1.8,08:30,11:30,STANDARD
ORD-BLR-02,Flipkart Fulfillment Hub,Outer Ring Road Bellandur Bengaluru,12.9279,77.6771,650,3.5,09:00,12:00,EXPRESS
ORD-BLR-03,Wipro Technologies Park,Sarjapur Road Doddakannelli Bengaluru,12.9121,77.6835,480,2.6,10:00,14:00,STANDARD
ORD-BLR-04,Manyata Embassy Tech Park,Nagavara Hebbal Bengaluru,13.0475,77.6200,520,2.9,11:00,15:00,CRITICAL
ORD-BLR-05,International Tech Park Bangalore,ITPB Whitefield Bengaluru,12.9866,77.7381,750,4.2,08:00,11:00,CRITICAL`;

    const vehiclesCsv = `vehicle_id,vehicle_code,vehicle_type,weight_capacity,volume_capacity,fuel_efficiency,fuel_efficiency_unit,shift_start_time,shift_end_time,start_location,start_latitude,start_longitude
VH-KA-01,KA-01-TRK,Eicher Pro 3015 Truck,2800,19.0,5.4,km_per_litre,08:00,18:00,DEPOT-BLR-CENTRAL,12.9716,77.5946
VH-KA-02,KA-02-EV,Mahindra Treo Zor Electric,1000,9.0,7.2,km_per_litre,08:00,18:00,DEPOT-BLR-CENTRAL,12.9716,77.5946
VH-KA-03,KA-03-HYB,Tata 407 Gold SFC,1900,13.5,6.0,km_per_litre,08:30,17:30,DEPOT-BLR-CENTRAL,12.9716,77.5946`;

    const oFile = new File([new Blob([ordersCsv], { type: "text/csv" })], "orders_bengaluru.csv", { type: "text/csv" });
    const vFile = new File([new Blob([vehiclesCsv], { type: "text/csv" })], "vehicles_bengaluru.csv", { type: "text/csv" });
    setOrdersFile(oFile);
    setVehiclesFile(vFile);
    executeUpload(oFile, vFile);
  };

  // 3. Negative Test: Multi-Depot Violation (Mumbai vs Pune)
  const loadMultiDepotViolation = () => {
    const ordersCsv = `order_id,customer_name,delivery_address,latitude,longitude,weight_kg,volume_m3,time_window_start,time_window_end,priority
ORD-IN-1001,Tata Consultancy Services Hub,Hiranandani Business Park Powai Mumbai,19.1176,72.9060,240,1.2,08:30,11:30,STANDARD
ORD-IN-1002,Reliance Retail Logistics Center,MIDC Andheri East Mumbai,19.1197,72.8468,450,2.5,09:00,12:00,EXPRESS`;

    // Intentional rule violation: vehicle 2 is stationed in Pune (18.5204, 73.8567) instead of Mumbai Central Depot
    const vehiclesWithDifferentDepots = `vehicle_id,vehicle_code,vehicle_type,weight_capacity,volume_capacity,fuel_efficiency,fuel_efficiency_unit,shift_start_time,shift_end_time,start_location,start_latitude,start_longitude
VH-IN-01,MH-01-TRK,Tata Ultra 1918.T Truck,2500,18.0,5.2,km_per_litre,08:00,18:00,DEPOT-MUMBAI-BKC,19.0760,72.8777
VH-IN-02,MH-02-EV,Tata Ace EV Electric,1200,10.5,6.8,km_per_litre,08:00,18:00,DEPOT-PUNE-MIDC,18.5204,73.8567`;

    const oFile = new File([new Blob([ordersCsv], { type: "text/csv" })], "orders.csv", { type: "text/csv" });
    const vFile = new File([new Blob([vehiclesWithDifferentDepots], { type: "text/csv" })], "vehicles_invalid_depots.csv", { type: "text/csv" });

    setOrdersFile(oFile);
    setVehiclesFile(vFile);
    executeUpload(oFile, vFile);
  };

  const errorColumns: Column<IngestionRowError>[] = [
    {
      key: "rowNumber",
      header: "Row #",
      width: "80px",
      render: (r) => <span className="font-mono font-bold text-[var(--destructive)]">#{r.rowNumber}</span>,
    },
    {
      key: "column",
      header: "Column / Field",
      width: "150px",
      render: (r) => <span className="font-mono text-xs font-semibold">{r.column}</span>,
    },
    {
      key: "code",
      header: "Diagnostic Code",
      width: "240px",
      render: (r) => (
        <span className="px-2 py-0.5 rounded bg-[var(--destructive-subtle)] text-[var(--destructive-subtle-foreground)] font-mono text-[11px] font-semibold border border-[var(--destructive-border)]">
          {r.code}
        </span>
      ),
    },
    {
      key: "message",
      header: "Validation Rule Violation",
      render: (r) => <span className="text-xs text-[var(--foreground)]">{r.message}</span>,
    },
  ];

  const validOrderColumns: Column<ParsedOrderRow>[] = [
    {
      key: "orderReference",
      header: "Order Ref",
      width: "120px",
      render: (r) => <span className="font-mono font-semibold text-[var(--primary)]">{r.orderReference}</span>,
    },
    {
      key: "customerName",
      header: "Customer & Destination (India)",
      render: (r) => (
        <div>
          <div className="font-semibold text-[var(--foreground)]">{r.customerName}</div>
          <div className="text-[11px] text-[var(--muted-foreground)] truncate max-w-xs">{r.deliveryAddress}</div>
        </div>
      ),
    },
    {
      key: "weightKg",
      header: "Weight / Vol",
      align: "right",
      width: "130px",
      render: (r) => (
        <span className="font-mono text-xs">
          {r.weightKg} kg · {r.volumeM3} m³
        </span>
      ),
    },
    {
      key: "timeWindowStart",
      header: "SLA Time Window",
      width: "140px",
      render: (r) => (
        <span className="font-mono text-xs text-[var(--text-secondary)]">
          {r.timeWindowStart} – {r.timeWindowEnd}
        </span>
      ),
    },
    {
      key: "priority",
      header: "Priority",
      width: "110px",
      render: (r) => (
        <span
          className={`text-[11px] px-2 py-0.5 rounded font-mono font-bold ${
            r.priority === "CRITICAL"
              ? "bg-[var(--destructive-subtle)] text-[var(--destructive-subtle-foreground)]"
              : r.priority === "EXPRESS"
              ? "bg-[var(--primary)]/10 text-[var(--primary)]"
              : "bg-[var(--surface-secondary)] text-[var(--text-secondary)]"
          }`}
        >
          {r.priority}
        </span>
      ),
    },
  ];

  const isBothReady =
    ordersResult?.success &&
    vehiclesResult?.success &&
    ordersResult.validRows.length > 0 &&
    vehiclesResult.validRows.length > 0;

  // Build GeoMarkers for India Preview Map
  const previewGeoMarkers: GeoMarker[] = React.useMemo(() => {
    const list: GeoMarker[] = [];
    if (depotCenter) {
      list.push({
        id: "PREVIEW-DEPOT",
        type: "DEPOT",
        lat: depotCenter.latitude,
        lng: depotCenter.longitude,
        label: depotCenter.id,
        sublabel: "Central Depot Center (India Workplace)",
        stopNumber: 0,
      });
    }

    if (ordersResult?.validRows) {
      ordersResult.validRows.forEach((o, idx) => {
        list.push({
          id: `PREVIEW-ORD-${o.orderReference}`,
          type: "STOP",
          lat: o.latitude,
          lng: o.longitude,
          label: o.customerName,
          sublabel: o.deliveryAddress,
          orderRef: o.orderReference,
          stopNumber: idx + 1,
          status: "PENDING",
        });
      });
    }

    return list;
  }, [depotCenter, ordersResult]);

  return (
    <AppShell>
      <div className="flex flex-col gap-6 max-w-6xl mx-auto pb-12">
        <Breadcrumb
          items={[
            { label: "Dashboard", href: "/" },
            { label: "Route Optimization", href: "/plans" },
            { label: "India Plan Ingestion (Dual CSV)", isCurrent: true },
          ]}
        />

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
              Create Plan: Dual CSV Ingestion (India Fleet)
            </h1>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
              Requires both <strong className="text-[var(--foreground)]">orders.csv</strong> and{" "}
              <strong className="text-[var(--foreground)]">vehicles.csv</strong>. All vehicles share strictly one Central Depot Center in India.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              id="load-pune-btn"
              variant="primary"
              size="sm"
              leftIcon={<Download className="h-3.5 w-3.5" />}
              onClick={loadPuneBenchmark}
            >
              Load Pune (Swargate) Fleet
            </Button>
            <Button
              id="load-mumbai-btn"
              variant="outline"
              size="sm"
              leftIcon={<Download className="h-3.5 w-3.5" />}
              onClick={loadMumbaiBenchmark}
            >
              Load Mumbai Fleet
            </Button>
            <Button
              id="load-bengaluru-btn"
              variant="outline"
              size="sm"
              leftIcon={<Download className="h-3.5 w-3.5" />}
              onClick={loadBengaluruBenchmark}
            >
              Load Bengaluru Fleet
            </Button>
            <Button
              id="test-violation-btn"
              variant="secondary"
              size="sm"
              leftIcon={<AlertTriangle className="h-3.5 w-3.5 text-[var(--warning)]" />}
              onClick={loadMultiDepotViolation}
            >
              Test Multi-Depot Violation
            </Button>
          </div>
        </div>

        {/* Dispatcher Workplace & Single Depot Rule Notice */}
        <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] flex items-start gap-3 shadow-2xs">
          <div className="p-2 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] shrink-0">
            <Building2 className="h-5 w-5" />
          </div>
          <div className="text-xs space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-[var(--foreground)]">
                Dispatcher Workplace Policy: Strictly One Central Depot Center
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300">
                Single Depot Enforced (India)
              </span>
            </div>
            <p className="text-[var(--muted-foreground)] leading-relaxed">
              Every vehicle row in <code className="px-1 py-0.5 rounded bg-[var(--surface-secondary)] font-mono text-[11px]">vehicles.csv</code> must start and return to the dispatcher's single designated depot center. Mismatched depot coordinates across vehicles are rejected automatically.
            </p>
          </div>
        </div>

        {generalError && (
          <Alert variant="destructive" title="Ingestion Notice">
            {generalError}
          </Alert>
        )}

        {/* Dual Compulsory File Upload Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 1. Compulsory Orders CSV Dropzone */}
          <div
            id="orders-dropzone"
            onClick={() => ordersInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 relative ${
              ordersResult?.success
                ? "border-emerald-500/60 bg-emerald-50/20 dark:bg-emerald-950/10"
                : ordersResult?.errors && ordersResult.errors.length > 0
                ? "border-[var(--destructive)] bg-[var(--destructive-subtle)]/20"
                : "border-[var(--border)] hover:border-[var(--primary)] bg-[var(--surface)] hover:bg-[var(--surface-hover)]"
            }`}
          >
            <input
              ref={ordersInputRef}
              type="file"
              accept=".csv, .xlsx, .xls"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) handleOrdersSelect(e.target.files[0]);
              }}
            />
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                Compulsory #1
              </span>
              {ordersResult?.success && (
                <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                  <CheckCircle className="h-3.5 w-3.5" /> Validated
                </span>
              )}
            </div>

            <div className="p-3 rounded-full bg-[var(--primary)]/10 text-[var(--primary)]">
              <FileSpreadsheet className="h-6 w-6" />
            </div>

            <div>
              <h3 className="text-sm font-bold text-[var(--foreground)]">
                {ordersFile ? ordersFile.name : "Upload orders.csv"}
              </h3>
              <p className="text-[11px] text-[var(--muted-foreground)] mt-0.5">
                Indian delivery locations, address, lat/lng, weight, volume, time windows & SLA.
              </p>
            </div>

            <Button
              variant={ordersResult?.success ? "outline" : "primary"}
              size="sm"
              isLoading={isUploading}
              leftIcon={<Upload className="h-3.5 w-3.5" />}
            >
              {ordersFile ? "Replace orders.csv" : "Select orders.csv"}
            </Button>
          </div>

          {/* 2. Compulsory Vehicles CSV Dropzone */}
          <div
            id="vehicles-dropzone"
            onClick={() => vehiclesInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 relative ${
              vehiclesResult?.success
                ? "border-emerald-500/60 bg-emerald-50/20 dark:bg-emerald-950/10"
                : vehiclesResult?.errors && vehiclesResult.errors.length > 0
                ? "border-[var(--destructive)] bg-[var(--destructive-subtle)]/20"
                : "border-[var(--border)] hover:border-[var(--primary)] bg-[var(--surface)] hover:bg-[var(--surface-hover)]"
            }`}
          >
            <input
              ref={vehiclesInputRef}
              type="file"
              accept=".csv, .xlsx, .xls"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) handleVehiclesSelect(e.target.files[0]);
              }}
            />
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                Compulsory #2
              </span>
              {vehiclesResult?.success && (
                <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                  <CheckCircle className="h-3.5 w-3.5" /> Validated
                </span>
              )}
            </div>

            <div className="p-3 rounded-full bg-[var(--primary)]/10 text-[var(--primary)]">
              <Truck className="h-6 w-6" />
            </div>

            <div>
              <h3 className="text-sm font-bold text-[var(--foreground)]">
                {vehiclesFile ? vehiclesFile.name : "Upload vehicles.csv"}
              </h3>
              <p className="text-[11px] text-[var(--muted-foreground)] mt-0.5">
                Indian commercial fleet units, capacities, fuel efficiencies & single depot coordinates.
              </p>
            </div>

            <Button
              variant={vehiclesResult?.success ? "outline" : "primary"}
              size="sm"
              isLoading={isUploading}
              leftIcon={<Upload className="h-3.5 w-3.5" />}
            >
              {vehiclesFile ? "Replace vehicles.csv" : "Select vehicles.csv"}
            </Button>
          </div>
        </div>

        {/* Validation Errors for Orders or Vehicles */}
        {((ordersResult?.errors && ordersResult.errors.length > 0) ||
          (vehiclesResult?.errors && vehiclesResult.errors.length > 0)) && (
          <div className="flex flex-col gap-4 animate-in fade-in duration-200">
            {ordersResult?.errors && ordersResult.errors.length > 0 && (
              <div className="flex flex-col gap-2">
                <Alert
                  variant="destructive"
                  title={`orders.csv Rejected: ${ordersResult.errors.length} Constraint Violations`}
                >
                  Please review the errors below before submitting to route optimization.
                </Alert>
                <DataTable
                  columns={errorColumns}
                  data={ordersResult.errors}
                  keyExtractor={(r) => `ord-${r.rowNumber}-${r.code}`}
                />
              </div>
            )}

            {vehiclesResult?.errors && vehiclesResult.errors.length > 0 && (
              <div className="flex flex-col gap-2">
                <Alert
                  variant="destructive"
                  title={`vehicles.csv Rejected: ${vehiclesResult.errors.length} Constraint Violations`}
                >
                  Please ensure all vehicles share the dispatcher's single central depot center location in India.
                </Alert>
                <DataTable
                  columns={errorColumns}
                  data={vehiclesResult.errors}
                  keyExtractor={(r) => `veh-${r.rowNumber}-${r.code}`}
                />
              </div>
            )}
          </div>
        )}

        {/* Identified Single Depot Center Banner (When vehicles are loaded) */}
        {depotCenter && (
          <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-50/30 dark:bg-emerald-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-600 text-white shrink-0">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-[var(--foreground)]">
                    Central Depot Center (Dispatcher Workplace): {depotCenter.id}
                  </h4>
                  <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200">
                    Single India Depot Verified
                  </span>
                </div>
                <p className="text-[11px] font-mono text-[var(--muted-foreground)]">
                  Coordinates: {depotCenter.latitude.toFixed(4)}° N, {depotCenter.longitude.toFixed(4)}° E · All {vehiclesResult?.validRows?.length || 0} fleet units stationed here.
                </p>
              </div>
            </div>

            <div className="text-right sm:text-left text-xs font-mono font-semibold px-3 py-1.5 rounded bg-[var(--surface-elevated)] border border-[var(--border)]">
              {vehiclesResult?.validRows?.length || 0} Commercial Units Stationed
            </div>
          </div>
        )}

        {/* Previews: Orders List & Fleet Detail */}
        {ordersResult?.validRows && ordersResult.validRows.length > 0 && (
          <div className="flex flex-col gap-6">
            {/* 1. Orders List Preview */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2">
                <div>
                  <h3 className="text-base font-bold text-[var(--foreground)] flex items-center gap-2">
                    <FileCheck className="h-4 w-4 text-emerald-600" />
                    1. Orders List Preview ({ordersResult.validRows.length} Indian Delivery Commitments)
                  </h3>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    Validated delivery locations, payload weights, volumes, and SLA time windows in India.
                  </p>
                </div>
                <span className="font-mono text-xs font-semibold px-2.5 py-1 rounded bg-[var(--surface-secondary)] text-[var(--foreground)]">
                  {ordersResult.summary.totalWeightKg} kg • {ordersResult.summary.totalVolumeM3} m³
                </span>
              </div>

              <DataTable
                columns={validOrderColumns}
                data={ordersResult.validRows}
                keyExtractor={(r) => r.orderReference}
              />
            </div>

            {/* 2. Fleet Detail Preview */}
            {vehiclesResult?.validRows && vehiclesResult.validRows.length > 0 && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2">
                  <div>
                    <h3 className="text-base font-bold text-[var(--foreground)] flex items-center gap-2">
                      <Truck className="h-4 w-4 text-primary" />
                      2. Fleet Detail Preview ({vehiclesResult.validRows.length} Commercial Units)
                    </h3>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      Commercial units verified with identical Central Depot Center coordinates in India.
                    </p>
                  </div>
                  <span className="font-mono text-xs font-semibold px-2.5 py-1 rounded bg-primary/10 text-primary">
                    {vehiclesResult.validRows.length} Units Stationed at Depot
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {vehiclesResult.validRows.map((v) => (
                    <div
                      key={v.vehicleId}
                      className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] flex flex-col justify-between shadow-2xs gap-3"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-xs font-mono font-bold text-primary">{v.vehicleCode}</div>
                          <h4 className="text-sm font-bold text-[var(--foreground)]">{v.vehicleType}</h4>
                          <p className="text-[11px] text-[var(--muted-foreground)]">ID: {v.vehicleId}</p>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                          Depot Verified
                        </span>
                      </div>

                      <div className="space-y-1 text-xs border-t border-[var(--border-subtle)] pt-2.5">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-[var(--muted-foreground)] flex items-center gap-1">
                            <Weight className="h-3 w-3" /> Weight Cap:
                          </span>
                          <span className="font-mono font-bold text-[var(--foreground)]">
                            {v.weightCapacityKg.toLocaleString()} kg
                          </span>
                        </div>
                        <div className="flex justify-between text-[11px]">
                          <span className="text-[var(--muted-foreground)]">Volume Cap:</span>
                          <span className="font-mono font-bold text-[var(--foreground)]">{v.volumeCapacityM3} m³</span>
                        </div>
                        <div className="flex justify-between text-[11px]">
                          <span className="text-[var(--muted-foreground)] flex items-center gap-1">
                            <Fuel className="h-3 w-3" /> Efficiency:
                          </span>
                          <span className="font-mono font-bold text-emerald-600">
                            {v.fuelEfficiencyKmPerL} km/L
                          </span>
                        </div>
                        <div className="flex justify-between text-[11px]">
                          <span className="text-[var(--muted-foreground)] flex items-center gap-1">
                            <Clock className="h-3 w-3" /> Shift:
                          </span>
                          <span className="text-[var(--foreground)] font-medium">
                            {v.shiftStartTime} – {v.shiftEndTime}
                          </span>
                        </div>
                        <div className="flex justify-between text-[11px] border-t border-[var(--border-subtle)]/60 pt-1 text-[10px]">
                          <span className="text-[var(--muted-foreground)]">Start Depot:</span>
                          <span className="font-mono text-primary font-semibold">
                            {depotCenter?.latitude.toFixed(4)}° N, {depotCenter?.longitude.toFixed(4)}° E
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. Real OpenStreetMap India Staging Preview */}
            {previewGeoMarkers.length > 0 && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-[var(--foreground)] flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-rose-500" />
                    3. India Map Preview (Depot & Staged Stops)
                  </h3>
                  <span className="text-xs text-[var(--muted-foreground)]">
                    Showing real geographic locations on OpenStreetMap India
                  </span>
                </div>
                <FleetMap
                  geoMarkers={previewGeoMarkers}
                  centerLat={depotCenter?.latitude || 18.5018}
                  centerLng={depotCenter?.longitude || 73.8586}
                  zoom={12}
                />
              </div>
            )}

            {/* 4. Optimize Route Action Bar */}
            <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface-secondary)]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Cpu className="h-5 w-5 text-primary" />
                  <h4 className="text-base font-bold text-[var(--foreground)]">
                    Execute RouteIQ Optimization Engine (India Network)
                  </h4>
                </div>
                <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                  Runs Google OR-Tools Guided Local Search with OSRM real road travel matrix across India highways and city networks, solving multi-objective vehicle assignment, time windows, fuel & CO₂.
                </p>
              </div>

              <Button
                id="optimize-route-btn"
                variant="primary"
                size="lg"
                disabled={!isBothReady}
                isLoading={isOptimizing}
                leftIcon={<Cpu className="h-4 w-4" />}
                onClick={async () => {
                  if (!isBothReady) return;
                  setIsOptimizing(true);
                  try {
                    const res = await fetch("/api/v1/plans", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        planName: `India Daily Dispatch Plan (${ordersResult.validRows.length} Orders, ${vehiclesResult.validRows.length} Fleet Units)`,
                        depotId: depotCenter?.id || "DEPOT-MUMBAI-01",
                        depotCenter: depotCenter,
                        vehicleIds: vehiclesResult.validRows.map((v) => v.vehicleId),
                        vehicles: vehiclesResult.validRows,
                        orders: ordersResult.validRows,
                      }),
                    });

                    const data = await res.json();
                    const planId = data.data?.id || "PLAN-IN-01";

                    // Trigger optimization engine
                    await fetch(`/api/v1/plans/${planId}/optimize`, { method: "POST" });
                    router.push(`/plans/${planId}`);
                  } catch (err) {
                    console.error("Optimization failed:", err);
                    router.push("/plans");
                  } finally {
                    setIsOptimizing(false);
                  }
                }}
                className="bg-[#2D3139] hover:bg-[#3E434E] text-white font-bold px-6 py-2.5 shadow-md shrink-0"
              >
                {isBothReady ? "Optimize Route (India RouteIQ)" : "Upload Both CSVs to Proceed"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
