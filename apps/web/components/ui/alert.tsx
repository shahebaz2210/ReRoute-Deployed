"use client";

import React from "react";
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from "lucide-react";

export type AlertVariant = "success" | "warning" | "destructive" | "info";

export interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children?: React.ReactNode;
  description?: string;
  onClose?: () => void;
  className?: string;
}

export function Alert({ variant = "info", title, children, description, onClose, className = "" }: AlertProps) {
  const configs = {
    success: {
      icon: CheckCircle2,
      containerClass: "bg-[var(--success-subtle)] border-[var(--success-border)] text-[var(--success-subtle-foreground)]",
      iconClass: "text-[var(--success)]",
    },
    warning: {
      icon: AlertTriangle,
      containerClass: "bg-[var(--warning-subtle)] border-[var(--warning-border)] text-[var(--warning-subtle-foreground)]",
      iconClass: "text-[var(--warning)]",
    },
    destructive: {
      icon: AlertCircle,
      containerClass: "bg-[var(--destructive-subtle)] border-[var(--destructive-border)] text-[var(--destructive-subtle-foreground)]",
      iconClass: "text-[var(--destructive)]",
    },
    info: {
      icon: Info,
      containerClass: "bg-[var(--info-subtle)] border-[var(--info-border)] text-[var(--info-subtle-foreground)]",
      iconClass: "text-[var(--info)]",
    },
  };

  const config = configs[variant];
  const Icon = config.icon;

  return (
    <div
      role="alert"
      className={`relative flex items-start gap-3 p-3.5 rounded-lg border text-sm transition-colors ${config.containerClass} ${className}`}
    >
      <Icon className={`h-5 w-5 shrink-0 mt-0.5 ${config.iconClass}`} />
      <div className="flex-1">
        {title && <h5 className="font-semibold mb-0.5 leading-tight">{title}</h5>}
        {(children || description) && (
          <div className="text-xs leading-relaxed">{children ?? description}</div>
        )}
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-md hover:opacity-70 transition-opacity cursor-pointer shrink-0"
          aria-label="Dismiss alert"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
