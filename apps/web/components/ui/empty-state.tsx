"use client";

import React from "react";
import { LucideIcon, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 md:p-12 text-center rounded-2xl border border-dashed border-neutral-300 bg-white/50 dark:border-neutral-800 dark:bg-neutral-900/30",
        className
      )}
    >
      <div className="p-3.5 rounded-2xl bg-neutral-100 border border-neutral-200/80 text-neutral-500 mb-3.5 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-400">
        <Icon className="h-6 w-6 stroke-[1.5]" />
      </div>
      <h4 className="text-sm font-semibold text-[#272A30] dark:text-neutral-100 mb-1">{title}</h4>
      <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm mb-4 leading-relaxed">{description}</p>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
