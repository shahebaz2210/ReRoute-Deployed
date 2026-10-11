"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "info" | "warning" | "error";

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  toast: (options: Omit<ToastItem, "id">) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = ({ type, title, message, duration = 4000 }: Omit<ToastItem, "id">) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => {
      // Keep max 3 visible (Design §F.3)
      const next = [...prev, { id, type, title, message, duration }];
      return next.slice(-3);
    });
  };

  const dismiss = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      <div
        aria-live="polite"
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
      >
        {toasts.map((t) => (
          <ToastCard key={t.id} item={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused || !item.duration) return;

    const timer = setTimeout(() => {
      onDismiss();
    }, item.duration);

    return () => clearTimeout(timer);
  }, [isPaused, item.duration, onDismiss]);

  const icons = {
    success: <CheckCircle2 className="h-4 w-4 text-[var(--success)]" />,
    info: <Info className="h-4 w-4 text-[var(--info)]" />,
    warning: <AlertTriangle className="h-4 w-4 text-[var(--warning)]" />,
    error: <AlertCircle className="h-4 w-4 text-[var(--destructive)]" />,
  };

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="pointer-events-auto flex items-start gap-3 p-3 rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] shadow-lg animate-in slide-in-from-bottom-2 fade-in duration-150 transition-all"
    >
      <span className="shrink-0 mt-0.5">{icons[item.type]}</span>
      <div className="flex-1">
        <h5 className="text-xs font-semibold text-[var(--foreground)]">{item.title}</h5>
        {item.message && <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">{item.message}</p>}
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)] cursor-pointer"
        aria-label="Dismiss toast"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}
