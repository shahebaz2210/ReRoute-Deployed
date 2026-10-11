"use client";

import React from "react";
import {
  CheckCircle,
  Clock,
  AlertCircle,
  Truck,
  AlertTriangle,
  AlertOctagon,
  Clock3,
  Check,
  CheckCircle2,
  ArrowRightCircle,
  XCircle,
  HelpCircle,
} from "lucide-react";

export type LogisticsStatus =
  | "DELIVERED"
  | "PENDING"
  | "FAILED"
  | "ACTIVE_VEHICLE"
  | "DELAYED_ROUTE"
  | "DISRUPTION"
  | "AWAITING_APPROVAL"
  | "APPROVED_REPLAN"
  | "KEPT"
  | "MOVED"
  | "BROKEN"
  | "UNASSIGNED";

interface StatusConfig {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  fgVar: string;
  bgVar: string;
  borderVar: string;
}

const STATUS_CONFIGS: Record<LogisticsStatus, StatusConfig> = {
  DELIVERED: {
    label: "Delivered",
    icon: CheckCircle,
    fgVar: "var(--status-delivered)",
    bgVar: "var(--status-delivered-bg)",
    borderVar: "var(--status-delivered-border)",
  },
  PENDING: {
    label: "Pending",
    icon: Clock,
    fgVar: "var(--status-pending)",
    bgVar: "var(--status-pending-bg)",
    borderVar: "var(--status-pending-border)",
  },
  FAILED: {
    label: "Failed",
    icon: AlertCircle,
    fgVar: "var(--status-failed)",
    bgVar: "var(--status-failed-bg)",
    borderVar: "var(--status-failed-border)",
  },
  ACTIVE_VEHICLE: {
    label: "Active",
    icon: Truck,
    fgVar: "var(--status-active-vehicle)",
    bgVar: "var(--status-active-vehicle-bg)",
    borderVar: "var(--status-active-vehicle-border)",
  },
  DELAYED_ROUTE: {
    label: "Delayed",
    icon: AlertTriangle,
    fgVar: "var(--status-delayed-route)",
    bgVar: "var(--status-delayed-route-bg)",
    borderVar: "var(--status-delayed-route-border)",
  },
  DISRUPTION: {
    label: "Disruption",
    icon: AlertOctagon,
    fgVar: "var(--status-disruption)",
    bgVar: "var(--status-disruption-bg)",
    borderVar: "var(--status-disruption-border)",
  },
  AWAITING_APPROVAL: {
    label: "Awaiting Approval",
    icon: Clock3,
    fgVar: "var(--status-awaiting-approval)",
    bgVar: "var(--status-awaiting-approval-bg)",
    borderVar: "var(--status-awaiting-approval-border)",
  },
  APPROVED_REPLAN: {
    label: "Approved Replan",
    icon: Check,
    fgVar: "var(--status-approved-replan)",
    bgVar: "var(--status-approved-replan-bg)",
    borderVar: "var(--status-approved-replan-border)",
  },
  KEPT: {
    label: "KEPT",
    icon: CheckCircle2,
    fgVar: "var(--status-kept)",
    bgVar: "var(--status-kept-bg)",
    borderVar: "var(--status-kept-border)",
  },
  MOVED: {
    label: "MOVED",
    icon: ArrowRightCircle,
    fgVar: "var(--status-moved)",
    bgVar: "var(--status-moved-bg)",
    borderVar: "var(--status-moved-border)",
  },
  BROKEN: {
    label: "BROKEN",
    icon: XCircle,
    fgVar: "var(--status-broken)",
    bgVar: "var(--status-broken-bg)",
    borderVar: "var(--status-broken-border)",
  },
  UNASSIGNED: {
    label: "Unassigned",
    icon: HelpCircle,
    fgVar: "var(--status-unassigned)",
    bgVar: "var(--status-unassigned-bg)",
    borderVar: "var(--status-unassigned-border)",
  },
};

export interface StatusBadgeProps {
  status: LogisticsStatus | string;
  customLabel?: string;
  className?: string;
  size?: "sm" | "default";
}

export function StatusBadge({ status, customLabel, className = "", size = "default" }: StatusBadgeProps) {
  const normalizedKey = (status.toUpperCase().replace(/[\s-]/g, "_") as LogisticsStatus);
  const config = STATUS_CONFIGS[normalizedKey] || {
    label: status,
    icon: Clock,
    fgVar: "var(--text-secondary)",
    bgVar: "var(--surface-secondary)",
    borderVar: "var(--border)",
  };

  const IconComponent = config.icon;
  const label = customLabel || config.label;

  const sizeStyles = size === "sm" ? "px-2 py-0.5 text-[11px] gap-1" : "px-2.5 py-1 text-xs gap-1.5";
  const iconSize = size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5";

  return (
    <span
      className={`inline-flex items-center font-medium rounded-md border select-none transition-colors ${sizeStyles} ${className}`}
      style={{
        color: config.fgVar,
        backgroundColor: config.bgVar,
        borderColor: config.borderVar,
      }}
    >
      <IconComponent className={`${iconSize} shrink-0`} />
      <span>{label}</span>
    </span>
  );
}
