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
  const [depot, setDepot] = useState("DEPOT-CENTRAL");

  const handleLogout = async () => {
    try {
      await fetch("/api/v1/auth/logout", { method: "POST" });
      window.location.href = "/";
    } catch {
      window.location.reload();
    }
  };

  return (
    <header className="h-14 border-b border-[var(--border)] bg-[var(--surface-elevated)] px-4 flex items-center justify-between z-30 sticky top-0 shadow-xs">
      <div className="flex items-center gap-3">
        {/* Mobile menu trigger */}
        <button
          type="button"
          onClick={onOpenMobileDrawer}
          className="md:hidden p-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] rounded-lg hover:bg-[var(--surface-hover)] cursor-pointer"
          aria-label="Open mobile navigation"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Desktop sidebar toggle button */}
        <button
          type="button"
          onClick={onToggleSidebar}
          className="hidden md:flex p-1.5 text-[var(--muted-foreground)] hover:text-[var(--foreground)] rounded-lg hover:bg-[var(--surface-hover)] cursor-pointer"
          aria-label="Toggle sidebar collapse"
        >
          <Layers className="h-4 w-4" />
        </button>

        {/* Logo and Brand */}
        <Link href="/" className="flex items-center gap-2 font-bold text-sm tracking-tight text-[var(--foreground)]">
          <div className="h-7 w-7 rounded-lg bg-[var(--primary)] flex items-center justify-center text-white shadow-xs">
            <Radio className="h-4 w-4" />
          </div>
          <span>Dispatch<span className="text-[var(--primary)]">X</span></span>
          <span className="hidden sm:inline-block text-[10px] px-1.5 py-0.5 rounded bg-[var(--surface-secondary)] border border-[var(--border)] text-[var(--muted-foreground)] font-mono uppercase">
            v3.0
          </span>
        </Link>

        {/* Depot Selector */}
        <div className="hidden lg:flex items-center gap-1.5 ml-4 pl-4 border-l border-[var(--border-subtle)] text-xs text-[var(--muted-foreground)]">
          <Building2 className="h-3.5 w-3.5 text-[var(--primary)]" />
          <select
            value={depot}
            onChange={(e) => setDepot(e.target.value)}
            className="bg-transparent text-xs font-semibold text-[var(--foreground)] focus:outline-none cursor-pointer"
            aria-label="Select depot facility"
          >
            <option value="DEPOT-CENTRAL">Central Hub (DEPOT-01)</option>
            <option value="DEPOT-NORTH">North Logistics Park (DEPOT-02)</option>
            <option value="DEPOT-EAST">East Coast Terminal (DEPOT-03)</option>
          </select>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Date / Shift */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[var(--surface-secondary)] text-xs text-[var(--text-secondary)] font-mono">
          <Calendar className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
          <span>Morning Shift 06:00 - 14:00</span>
        </div>

        {/* Live status badge */}
        <div className="hidden md:flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[var(--success-subtle)] text-[11px] font-medium text-[var(--success-subtle-foreground)] border border-[var(--success-border)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--success)] animate-pulse" />
          <span>Live Engine</span>
        </div>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* User Menu */}
        <Popover
          align="right"
          trigger={
            <button
              type="button"
              className="flex items-center gap-2 p-1 pl-2 rounded-lg border border-[var(--border)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
              aria-label="User profile and menu"
            >
              <div className="h-6 w-6 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center font-bold text-xs">
                {user?.name ? user.name[0].toUpperCase() : "D"}
              </div>
              <span className="text-xs font-medium text-[var(--foreground)] hidden lg:inline">
                {user?.name || "Dispatcher"}
              </span>
            </button>
          }
        >
          <div className="flex flex-col gap-2">
            <div className="border-b border-[var(--border-subtle)] pb-2">
              <p className="text-xs font-semibold text-[var(--foreground)]">{user?.name || "Dispatcher One"}</p>
              <p className="text-[11px] text-[var(--muted-foreground)] truncate">{user?.email || "dispatch@vortexa.logistics"}</p>
              <div className="flex items-center gap-1 mt-1 text-[10px] text-[var(--primary)] font-mono font-medium">
                <Shield className="h-3 w-3" />
                <span>ROLE: {user?.role || "DISPATCHER"}</span>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="w-full justify-start text-[var(--destructive)] hover:text-[var(--destructive)] hover:bg-[var(--destructive-subtle)] text-xs gap-2"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign Out
            </Button>
          </div>
        </Popover>
      </div>
    </header>
  );
}
