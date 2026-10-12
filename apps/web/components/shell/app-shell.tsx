"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Header } from "./header";
import { Sidebar } from "./sidebar";
import { SkipLink } from "./skip-link";
import { ConnectivityBanner } from "./connectivity-banner";
import { Drawer } from "@/components/ui/drawer";

export interface AppShellProps {
  children: React.ReactNode;
  user?: {
    name: string;
    email: string;
    role: string;
  } | null;
}

export function AppShell({ children, user }: AppShellProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const pathname = usePathname();

  // Route-change focus management: focus to <h1> and update document.title (Task 103)
  useEffect(() => {
    // Focus to primary h1 heading after navigation
    const heading = document.querySelector("h1");
    if (heading) {
      heading.setAttribute("tabIndex", "-1");
      heading.focus();
    }

    // Set page title nicely based on route
    const seg = pathname.split("/")[1] || "dashboard";
    const titleFormatted = seg.charAt(0).toUpperCase() + seg.slice(1);
    document.title = `${titleFormatted} | DispatchX Logistics ReRoute`;
  }, [pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)] text-[var(--foreground)] antialiased">
      <SkipLink />
      <ConnectivityBanner />

      <Header
        onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        onOpenMobileDrawer={() => setIsMobileDrawerOpen(true)}
        user={user}
      />

      <div className="flex-1 flex min-h-0 relative items-start">
        {/* Desktop Sidebar (Collapsible 240px / 64px) - Sticks with scroll up down */}
        <div className="hidden md:block shrink-0 sticky top-15 h-[calc(100vh-3.75rem)] z-20 self-start">
          <Sidebar isCollapsed={isSidebarCollapsed} className="h-full" />
        </div>

        {/* Mobile Navigation Drawer (<768px) */}
        <Drawer
          isOpen={isMobileDrawerOpen}
          onClose={() => setIsMobileDrawerOpen(false)}
          title="Navigation"
          side="left"
          width="400px"
        >
          <Sidebar
            isCollapsed={false}
            onItemClick={() => setIsMobileDrawerOpen(false)}
            className="h-auto border-none w-full p-0"
          />
        </Drawer>

        {/* Fluid Main Content */}
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 focus:outline-none"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
