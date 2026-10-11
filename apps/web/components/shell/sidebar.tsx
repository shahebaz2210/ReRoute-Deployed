"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Truck,
  Route,
  Activity,
  AlertTriangle,
  BarChart3,
  Settings,
  Radio,
  CheckCircle2,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number | string;
  badgeVariant?: "warning" | "danger" | "info";
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Orders", href: "/orders", icon: Package },
  { label: "Fleet", href: "/fleet", icon: Truck },
  { label: "Route Optimization", href: "/plans", icon: Route },
  { label: "Disruptions", href: "/disruptions", icon: AlertTriangle, badge: 2, badgeVariant: "danger" },
];

export interface SidebarProps {
  isCollapsed?: boolean;
  onItemClick?: () => void;
  className?: string;
}

export function Sidebar({ isCollapsed = false, onItemClick, className = "" }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={`h-[calc(100vh-3.75rem)] border-r border-[var(--border)] bg-[var(--surface)] flex flex-col justify-between py-5 transition-all duration-200 select-none ${
        isCollapsed ? "w-18 items-center px-2" : "w-64 px-4"
      } ${className}`}
    >
      <div className="flex flex-col gap-1 w-full">
        {!isCollapsed && (
          <div className="px-3 mb-2.5 text-[11px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider">
            Operations
          </div>
        )}

        {NAV_ITEMS.map((item) => {
          const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onItemClick}
              aria-current={isActive ? "page" : undefined}
              className={`relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? "bg-[var(--surface-secondary)] text-[var(--foreground)] font-bold shadow-2xs"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)]"
              } ${isCollapsed ? "justify-center p-2.5" : ""}`}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-[var(--foreground)]" : "text-[var(--muted-foreground)]"}`} />
              {!isCollapsed && <span className="flex-1 truncate tracking-tight">{item.label}</span>}
              {!isCollapsed && item.badge && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                    item.badgeVariant === "danger"
                      ? "bg-[var(--destructive-subtle)] text-[var(--destructive-subtle-foreground)] border border-[var(--destructive-border)]"
                      : "bg-[var(--surface-secondary)] text-[var(--foreground)] border border-[var(--border)]"
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {!isCollapsed && (
        <div className="px-1 pt-3 border-t border-[var(--border)]">
          <div className="p-3.5 rounded-2xl bg-[var(--surface-secondary)] border border-[var(--border)] flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--foreground)]">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              <span>SLO Engine Active</span>
            </div>
            <span className="text-[11px] text-[var(--muted-foreground)] leading-tight">
              99.8% on-time replanning target. Simulated travel matrix.
            </span>
          </div>
        </div>
      )}
    </aside>
  );
}
