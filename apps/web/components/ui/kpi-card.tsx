"use client";

import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface KPICardProps {
  label: string;
  value: string | number;
  unit?: string;
  delta?: {
    value: string | number;
    trend: "up" | "down" | "neutral";
    isPositive?: boolean;
    periodLabel?: string;
  };
  icon?: React.ReactNode;
  subtitle?: string;
  className?: string;
}

export function KPICard({ label, value, unit, delta, icon, subtitle, className }: KPICardProps) {
  const getTrendColor = () => {
    if (!delta) return "";
    if (delta.trend === "neutral") return "text-neutral-500";
    const isGood = delta.isPositive !== undefined ? delta.isPositive : delta.trend === "up";
    return isGood ? "text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60" : "text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200/60";
  };

  const getTrendIcon = () => {
    if (!delta) return null;
    if (delta.trend === "up") return <TrendingUp className="h-3 w-3" />;
    if (delta.trend === "down") return <TrendingDown className="h-3 w-3" />;
    return <Minus className="h-3 w-3" />;
  };

  return (
    <div
      className={cn(
        "flex flex-col p-5 rounded-2xl border border-neutral-200/80 bg-white text-[#272A30] shadow-2xs transition-all hover:shadow-xs",
        className
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
          {label}
        </span>
        {icon && (
          <div className="h-8 w-8 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-600">
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-1.5 my-1">
        <span className="text-3xl font-bold font-mono tracking-tight text-[#272A30] tabular-nums">
          {value}
        </span>
        {unit && <span className="text-xs text-neutral-400 font-mono font-medium">{unit}</span>}
      </div>

      {(delta || subtitle) && (
        <div className="flex items-center gap-2 mt-2 text-xs">
          {delta && (
            <span className={cn("inline-flex items-center gap-1 font-semibold text-[11px] tabular-nums", getTrendColor())}>
              {getTrendIcon()}
              {delta.value}
            </span>
          )}
          {delta?.periodLabel && (
            <span className="text-neutral-400 text-[11px]">{delta.periodLabel}</span>
          )}
          {subtitle && !delta && (
            <span className="text-neutral-500 text-xs font-normal">{subtitle}</span>
          )}
        </div>
      )}
    </div>
  );
}
