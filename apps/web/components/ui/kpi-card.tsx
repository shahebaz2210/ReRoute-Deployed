"use client";

import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export interface KPICardProps {
  label: string;
  value: string | number;
  unit?: string;
  delta?: {
    value: string | number;
    trend: "up" | "down" | "neutral";
    isPositive?: boolean; // e.g. delay down is positive
    periodLabel?: string;
  };
  icon?: React.ReactNode;
  subtitle?: string;
  className?: string;
}

export function KPICard({ label, value, unit, delta, icon, subtitle, className = "" }: KPICardProps) {
  const getTrendColor = () => {
    if (!delta) return "";
    if (delta.trend === "neutral") return "text-[var(--text-secondary)]";
    const isGood = delta.isPositive !== undefined ? delta.isPositive : delta.trend === "up";
    return isGood ? "text-[var(--success)]" : "text-[var(--destructive)]";
  };

  const getTrendIcon = () => {
    if (!delta) return null;
    if (delta.trend === "up") return <TrendingUp className="h-3.5 w-3.5" />;
    if (delta.trend === "down") return <TrendingDown className="h-3.5 w-3.5" />;
    return <Minus className="h-3.5 w-3.5" />;
  };

  return (
    <div
      className={`flex flex-col p-4 rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-xs transition-shadow hover:shadow-sm ${className}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
          {label}
        </span>
        {icon && <span className="text-[var(--muted-foreground)]">{icon}</span>}
      </div>

      <div className="flex items-baseline gap-1.5 my-1">
        <span className="text-2xl font-bold font-mono tracking-tight text-[var(--foreground)] tabular-nums">
          {value}
        </span>
        {unit && <span className="text-xs text-[var(--muted-foreground)] font-mono">{unit}</span>}
      </div>

      {(delta || subtitle) && (
        <div className="flex items-center gap-2 mt-1 text-xs">
          {delta && (
            <span className={`inline-flex items-center gap-1 font-semibold tabular-nums ${getTrendColor()}`}>
              {getTrendIcon()}
              {delta.value}
            </span>
          )}
          {delta?.periodLabel && (
            <span className="text-[var(--muted-foreground)]">{delta.periodLabel}</span>
          )}
          {subtitle && !delta && (
            <span className="text-[var(--muted-foreground)]">{subtitle}</span>
          )}
        </div>
      )}
    </div>
  );
}
