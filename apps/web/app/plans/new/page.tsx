"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { DataTable, Column } from "@/components/ui/data-table";
import { IngestionResult, IngestionRowError, ParsedOrderRow } from "@/lib/ingestion/plan-parser";
import {
  FileSpreadsheet,
  Upload,
  AlertTriangle,
  CheckCircle,
  FileCheck,
  ArrowRight,
  Download,
  Info,
} from "lucide-react";

export default function CreatePlanPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [ingestionResult, setIngestionResult] = useState<IngestionResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = async (file: File) => {
    setSelectedFile(file);
    setIsUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/v1/plans/upload", {
        method: "POST",
        body: formData,
      });

      const data: IngestionResult = await res.json();
      setIngestionResult(data);

      if (data.success) {
        sessionStorage.setItem("dispatchx-staged-plan", JSON.stringify(data));
      }
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setIsUploading(false);
    }
  };

  const loadSampleBenchmark = () => {
    const csvContent = `order_id,customer_name,delivery_address,latitude,longitude,weight_kg,volume_m3,time_window_start,time_window_end,priority
ORD-1001,Astra Tech Labs,12 Innovation Way,51.515,-0.12,240,1.2,08:30,11:30,STANDARD
ORD-1002,BioGen Research,45 Medical Sciences Park,51.522,-0.115,450,2.5,09:00,12:00,EXPRESS
ORD-1003,Apex Logistics Depot,88 Cargo Terminal Road,51.53,-0.105,1200,6.8,10:00,14:00,STANDARD
ORD-1004,Vortex Quantum Hub,101 Silicon Quay,51.505,-0.13,380,1.9,11:00,15:00,CRITICAL
ORD-1005,St. Jude Hospital Supply,14 Healthcare Ave,51.518,-0.125,520,3.1,08:00,10:30,CRITICAL
ORD-1006,Nova Distribution Centre,9 North Circular Gate,51.54,-0.09,950,5.2,13:00,17:00,STANDARD`;

    const blob = new Blob([csvContent], { type: "text/csv" });
    const file = new File([blob], "DEMO_BENCHMARK_PLAN.csv", { type: "text/csv" });
    handleFileChange(file);
  };

  const loadCorruptedSample = () => {
    const csvContent = `order_id,customer_name,delivery_address,latitude,longitude,weight_kg,volume_m3,time_window_start,time_window_end,priority
ORD-2001,=cmd|' /C calc'!A0,12 Toxic Row,51.515,-0.12,240,1.2,08:30,11:30,STANDARD
ORD-2002,Negative Load Co,45 Bad Road,51.522,-0.115,-50,0.5,09:00,12:00,STANDARD
ORD-2003,Overweight Giant,88 Steel Yard,51.53,-0.105,8500,45.0,10:00,14:00,STANDARD
ORD-2004,Backwards Clock,101 Time Warp,51.505,-0.13,300,1.5,16:00,09:00,STANDARD`;

    const blob = new Blob([csvContent], { type: "text/csv" });
    const file = new File([blob], "INVALID_TEST_PLAN.csv", { type: "text/csv" });
    handleFileChange(file);
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
      render: (r) => <span className="font-mono text-xs">{r.column}</span>,
    },
    {
      key: "code",
      header: "Diagnostic Code",
      width: "220px",
      render: (r) => (
        <span className="px-2 py-0.5 rounded bg-[var(--destructive-subtle)] text-[var(--destructive-subtle-foreground)] font-mono text-[11px] font-semibold border border-[var(--destructive-border)]">
          {r.code}
        </span>
      ),
    },
    {
      key: "message",
      header: "Validation Rule Violation",
    },
  ];

  const validColumns: Column<ParsedOrderRow>[] = [
    {
      key: "orderReference",
      header: "Order Ref",
      render: (r) => <span className="font-mono font-semibold text-[var(--primary)]">{r.orderReference}</span>,
    },
    {
      key: "customerName",
      header: "Customer & Destination",
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
      render: (r) => (
        <span className="font-mono text-xs">
          {r.weightKg} kg · {r.volumeM3} m³
        </span>
      ),
    },
    {
      key: "timeWindowStart",
      header: "Time Window",
      render: (r) => (
        <span className="font-mono text-xs text-[var(--text-secondary)]">
          {r.timeWindowStart} – {r.timeWindowEnd}
        </span>
      ),
    },
    {
      key: "priority",
      header: "Priority",
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

  return (
    <AppShell>
      <div className="flex flex-col gap-6 max-w-6xl mx-auto">
        <Breadcrumb
          items={[
            { label: "Dashboard", href: "/" },
            { label: "Route Optimization", href: "/plans" },
            { label: "New Delivery Plan Ingestion", isCurrent: true },
          ]}
        />

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
              Delivery Plan Excel / CSV Ingestion
            </h1>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
              Upload multi-stop delivery commitments with hard weight, volumetric, and time-window constraint validation.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Download className="h-3.5 w-3.5" />}
              onClick={loadSampleBenchmark}
            >
              Load Benchmark Plan
            </Button>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<AlertTriangle className="h-3.5 w-3.5 text-[var(--warning)]" />}
              onClick={loadCorruptedSample}
            >
              Test Error Ingestion
            </Button>
          </div>
        </div>

        {/* Drag and drop upload zone */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-[var(--border)] hover:border-[var(--primary)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] rounded-xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv, .xlsx, .xls"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) handleFileChange(e.target.files[0]);
            }}
          />
          <div className="p-3.5 rounded-full bg-[var(--primary)]/10 text-[var(--primary)]">
            <FileSpreadsheet className="h-8 w-8" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-[var(--foreground)]">
              Drop Excel (.xlsx, .xls) or CSV file here, or browse
            </h3>
            <p className="text-xs text-[var(--muted-foreground)] mt-1">
              Supports delivery orders up to 2 MB with automatic formula-injection security scanning.
            </p>
          </div>
          <Button variant="primary" size="sm" isLoading={isUploading} leftIcon={<Upload className="h-4 w-4" />}>
            Select Delivery Plan File
          </Button>
        </div>

        {/* Ingestion Diagnostics and Summary */}
        {ingestionResult && (
          <div className="flex flex-col gap-5 animate-in fade-in duration-200">
            {ingestionResult.success ? (
              <Alert
                variant="success"
                title="Delivery Plan Validated Successfully"
              >
                All {ingestionResult.validRows.length} delivery commitments meet fleet capacity limits and time-window feasibility.
                Total payload: <strong>{ingestionResult.summary.totalWeightKg} kg</strong> (
                {ingestionResult.summary.totalVolumeM3} m³).
              </Alert>
            ) : (
              <Alert
                variant="destructive"
                title={`Ingestion Rejected: ${ingestionResult.errors.length} Constraint Violations Found`}
              >
                Please correct the flagged row issues in your spreadsheet before committing to route optimization.
              </Alert>
            )}

            {/* Error table if errors exist */}
            {ingestionResult.errors.length > 0 && (
              <div className="flex flex-col gap-2">
                <h3 className="text-sm font-semibold text-[var(--destructive)]">
                  Diagnostic Error Log ({ingestionResult.errors.length} errors)
                </h3>
                <DataTable
                  columns={errorColumns}
                  data={ingestionResult.errors}
                  keyExtractor={(r) => `${r.rowNumber}-${r.code}`}
                />
              </div>
            )}

            {/* Valid rows preview */}
            {ingestionResult.validRows.length > 0 && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-[var(--foreground)]">
                    Validated Order Commitments ({ingestionResult.validRows.length} orders)
                  </h3>
                  {ingestionResult.success && (
                    <Button
                      variant="primary"
                      size="sm"
                      rightIcon={<ArrowRight className="h-4 w-4" />}
                      onClick={() => router.push("/plans/review")}
                    >
                      Proceed to Route Optimization
                    </Button>
                  )}
                </div>
                <DataTable
                  columns={validColumns}
                  data={ingestionResult.validRows}
                  keyExtractor={(r) => r.orderReference}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
