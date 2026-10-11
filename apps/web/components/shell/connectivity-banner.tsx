"use client";

import React, { useState, useEffect } from "react";
import { WifiOff } from "lucide-react";

export function ConnectivityBanner() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="assertive"
      className="bg-[var(--warning-subtle)] border-b border-[var(--warning-border)] px-4 py-2 text-xs text-[var(--warning-subtle-foreground)] flex items-center justify-center gap-2 font-medium z-50 sticky top-0"
    >
      <WifiOff className="h-4 w-4 shrink-0 text-[var(--warning)]" />
      <span>
        Offline: showing cached dispatch data. Actions requiring server confirmation are disabled.
      </span>
    </div>
  );
}
