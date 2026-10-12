"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import {
  Building2,
  Calendar,
  Radio,
  User,
  LogOut,
  Menu,
  Shield,
  Layers,
  Search,
} from "lucide-react";
import { Popover } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

export interface HeaderProps {
  onToggleSidebar?: () => void;
  onOpenMobileDrawer?: () => void;
  user?: {
    name: string;
    email: string;
    role: string;
  } | null;
}

export function Header({ onToggleSidebar, onOpenMobileDrawer, user }: HeaderProps) {
  const [depot, setDepot] = useState("DEPOT-SWARGATE");

  const handleLogout = async () => {
    try {
      await fetch("/api/v1/auth/logout", { method: "POST" });
      window.location.href = "/";
    } catch {
      window.location.reload();
    }
  };

  return (
    <header className="h-15 border-b border-[var(--border)] bg-[var(--surface-elevated)] px-4 sm:px-6 flex items-center justify-between z-30 sticky top-0 shadow-2xs">
      <div className="flex items-center gap-3">
        {/* Mobile menu trigger */}
        <button
          type="button"
          onClick={onOpenMobileDrawer}
          className="md:hidden p-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] rounded-xl hover:bg-[var(--surface-hover)] cursor-pointer"
          aria-label="Open mobile navigation"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Desktop sidebar toggle button */}
        <button
          type="button"
          onClick={onToggleSidebar}
          className="hidden md:flex p-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] rounded-xl hover:bg-[var(--surface-hover)] cursor-pointer transition-colors"
          aria-label="Toggle sidebar collapse"
        >
          <Layers className="h-4 w-4" />
        </button>

        {/* Logo and Brand */}
        <Link href="/" className="flex items-center gap-2.5 font-extrabold text-base tracking-tight text-[var(--foreground)]">
          <div className="h-8 w-8 rounded-xl bg-[var(--primary)] flex items-center justify-center text-[var(--primary-foreground)] shadow-xs">
            <Radio className="h-4 w-4" />
          </div>
          <span className="font-extrabold tracking-tight">
            Dispatch<span className="text-[var(--muted-foreground)]">X</span>
          </span>
          <span className="hidden sm:inline-block text-[10px] px-2 py-0.5 rounded-full bg-[var(--surface-secondary)] border border-[var(--border)] text-[var(--muted-foreground)] font-mono font-semibold uppercase">
            v3.0
          </span>
        </Link>

        {/* Depot Selector */}
        <div className="hidden lg:flex items-center gap-2 ml-4 pl-4 border-l border-[var(--border)] text-xs text-[var(--muted-foreground)]">
          <Building2 className="h-3.5 w-3.5 text-[var(--foreground)]" />
          <select
            value={depot}
            onChange={(e) => setDepot(e.target.value)}
            className="bg-transparent text-xs font-semibold text-[var(--foreground)] focus:outline-none cursor-pointer"
            aria-label="Select depot facility"
          >
            <option value="DEPOT-SWARGATE">Swargate Central Hub (Pune)</option>
            <option value="DEPOT-BKC">Mumbai Central Hub (BKC)</option>
            <option value="DEPOT-BLR">Bengaluru Central Hub</option>
            <option value="DEPOT-DELHI">Delhi NCR Cargo Terminal</option>
          </select>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Date / Shift Pill */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--surface-secondary)] text-xs text-[var(--foreground)] font-medium">
          <Calendar className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
          <span>Morning Shift 06:00 - 14:00</span>
        </div>

        {/* Live status badge */}
        <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-full bg-[var(--success-subtle)] text-[11px] font-semibold text-[var(--success-subtle-foreground)] border border-[var(--success-border)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--success)] animate-pulse" />
          <span>Operational</span>
        </div>

        <ThemeToggle />

        {/* User Account Menu */}
        <Popover
          trigger={
            <button
              type="button"
              className="flex items-center gap-2 p-1.5 pl-2.5 rounded-xl border border-[var(--border)] hover:bg-[var(--surface-hover)] text-xs font-semibold transition-colors cursor-pointer"
            >
              <div className="h-6 w-6 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] flex items-center justify-center font-bold text-xs">
                {user?.name ? user.name[0].toUpperCase() : "D"}
              </div>
              <span className="hidden sm:inline font-semibold text-[var(--foreground)]">
                {user?.name || "Dispatcher"}
              </span>
            </button>
          }
        >
          <div className="w-56 p-2 flex flex-col gap-1 text-xs">
            <div className="px-3 py-2 border-b border-[var(--border)] mb-1">
              <span className="font-bold text-[var(--foreground)] block">
                {user?.name || "Marcus Sterling"}
              </span>
              <span className="text-[11px] text-[var(--muted-foreground)] block">
                {user?.email || "dispatcher@dispatchx.io"}
              </span>
              <span className="inline-block mt-1 font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-[var(--surface-secondary)] text-[var(--foreground)]">
                {user?.role || "DISPATCHER"}
              </span>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold cursor-pointer w-full text-left"
            >
              <LogOut className="h-4 w-4" />
              <span>Log out</span>
            </button>
          </div>
        </Popover>
      </div>
    </header>
  );
}
