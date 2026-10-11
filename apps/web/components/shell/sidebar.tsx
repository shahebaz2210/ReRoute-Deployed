"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Truck,
  Route,
  CalendarDays,
  Activity,
  AlertTriangle,
  BarChart3,
  Settings,
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
  { label: "Audit Trail", href: "/audit", icon: CalendarDays },
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
      className={`h-[calc(100vh-3.5rem)] border-r border-[var(--border)] bg-[var(--surface)] flex flex-col justify-between py-4 transition-all duration-200 select-none ${
        isCollapsed ? "w-16 items-center px-2" : "w-60 px-3"
      } ${className}`}
    >
      <div className="flex flex-col gap-1 w-full">
        <div className={`px-3 mb-2 text-[10px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider ${isCollapsed ? "sr-only" : ""}`}>
          Control Room
        </div>
        {NAV_ITEMS.map((item) => {
          const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onItemClick}
              aria-current={isActive ? "page" : undefined}
              className={`relative flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? "bg-[var(--secondary)] text-[var(--secondary-foreground)] font-semibold shadow-2xs"
                  : "text-[var(--text-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)]"
              } ${isCollapsed ? "justify-center p-2.5" : ""}`}
              title={isCollapsed ? item.label : undefined}
            >
              {/* Active Indicator Bar */}
              {isActive && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r bg-[var(--primary)]" />
              )}
              <Icon className="h-4 w-4 shrink-0" />
              {!isCollapsed && <span className="flex-1 truncate">{item.label}</span>}
              {!isCollapsed && item.badge && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    item.badgeVariant === "danger"
                      ? "bg-[var(--destructive-subtle)] text-[var(--destructive-subtle-foreground)] border border-[var(--destructive-border)]"
                      : "bg-[var(--primary)]/10 text-[var(--primary)]"
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
        <div className="px-3 pt-3 border-t border-[var(--border-subtle)]">
          <div className="p-2.5 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border-subtle)] text-[11px] text-[var(--muted-foreground)]">
            <span className="font-semibold text-[var(--foreground)] block mb-0.5">SLO Engine Active</span>
            <span className="block font-mono text-[10px]">99.8% on-time replans</span>
          </div>
        </div>
      )}
    </aside>
  );
}
