# ReRoute / VORTEXA 3.0: Design System & UI/UX Specification

**Adaptive Fleet & Delivery Replanning** · Single source of truth for the dispatcher (desktop) and driver (mobile) interfaces
Stack assumed: **React 18 + TypeScript + Tailwind CSS 3.4 + lucide-react**, shadcn/ui-style component architecture.

> **How to read this document.**
> Items tagged **[REQ]** come from the project brief and are mandatory. Items tagged **[OPT]** are design recommendations the team may change.
> All colors are given as HEX (canonical) and HSL (computed from the HEX, 1-decimal precision). Contrast ratios in Section 15 are computed from the HEX values, not estimated.
> All sample data in mockups is **synthetic** and labelled as such. Nothing in this document implies a backend capability that is not part of the project.

---

## Table of Contents

1. [Product Design Overview and User Roles](#1-product-design-overview-and-user-roles)
2. [Visual Aesthetic and Design Principles](#2-visual-aesthetic-and-design-principles)
3. [Light Mode Color Tokens](#3-light-mode-color-tokens)
4. [Dark Mode Color Tokens](#4-dark-mode-color-tokens)
5. [Semantic Logistics Status Mapping](#5-semantic-logistics-status-mapping)
6. [Typography Matrix](#6-typography-matrix)
7. [Spacing and Grid Tokens](#7-spacing-and-grid-tokens)
8. [Radius and Elevation Tokens](#8-radius-and-elevation-tokens)
9. [Component Interaction State Specifications](#9-component-interaction-state-specifications)
10. [Dispatcher Dashboard Component Guidelines](#10-dispatcher-dashboard-component-guidelines)
11. [Driver Dashboard Component Guidelines](#11-driver-dashboard-component-guidelines)
12. [Incident Reporting and Approval Workflow](#12-incident-reporting-and-approval-workflow)
13. [CSS Variable Implementation](#13-css-variable-implementation)
14. [Tailwind Configuration](#14-tailwind-configuration)
15. [Accessibility Checklist](#15-accessibility-checklist)
16. [Responsive Design Guidance](#16-responsive-design-guidance)
17. [Component Naming Conventions](#17-component-naming-conventions)
18. [Design Implementation Acceptance Checklist](#18-design-implementation-acceptance-checklist)

---

## 1. Product Design Overview and User Roles

ReRoute helps a logistics team keep deliveries on track when the morning plan breaks: truck breakdowns, road closures, urgent same-day orders, delays. It re-plans only the remaining work, **keeps completed deliveries untouched**, starts remaining routes from the vehicles' current positions, respects capacity and time windows, and shows every affected order as **KEPT, MOVED or BROKEN** with a reason. **The dispatcher stays in control: nothing changes until they explicitly approve.**

### 1.1 Roles **[REQ]**

| | Dispatcher | Driver |
|---|---|---|
| Device | Desktop-first (design target 1440 x 900, usable from 1024) | Mobile-first (design target 390 x 844, supports 360 to 430) |
| Scope | Entire fleet | Own vehicle, own route, own orders only |
| Primary jobs | Watch the map and routes, handle disruptions, approve or reject replans, review before/after, trigger customer voice updates, play fleet debrief | See current delivery, follow route, report a disruption by voice or text, see approved route changes |
| Can approve fleet re-optimization | **Yes** | **No** |
| Can reassign deliveries between vehicles | Only through an approved replan | **No** |
| Metrics shown | Fleet-wide | Driver-specific only. **Never company-wide metrics.** |

### 1.2 Core operational workflow (shown consistently across the UI) **[REQ]**

```
1 Monitor active routes
2 Receive disruption (text or voice)
3 Extract incident type, vehicle, location, time, order info
4 Validate location against known delivery-map locations
5 Unknown location -> request clarification (never guess or substitute)
6 Present extracted incident to dispatcher for explicit approval
7 Re-optimize ONLY after approval
8 Preserve completed deliveries; start remaining routes from current positions
9 Enforce capacity and time-window constraints
10 Show KEPT / MOVED / BROKEN with explanations
11 Generate customer voice updates for affected deliveries
12 Present audio fleet debrief
```

**Rule of truth:** an unapproved route change is always labelled **Proposed** (dashed lines, violet *Awaiting Approval* treatment). It is never styled as active or completed. Only an approved and validated plan uses the solid *Approved Replan* treatment.

### 1.3 Out of scope **[REQ]**
No AI Control Tower, no generic "AI insights" dashboard, no unrelated analytics modules, no duplicate alert surfaces. Each alert appears once, in the incident panel, with a small count badge in the navigation.

### 1.4 Map note **[OPT]**
The brief asks for a live fleet map. If the project rules forbid live mapping or GPS services, render the same components over an **offline node graph** (Canvas/SVG) using the `--map-*` tokens. All marker, route and overlay specs in this document are renderer-agnostic. Positions shown are whatever the backend reports. Do not fabricate movement in the UI.

---

## 2. Visual Aesthetic and Design Principles

**Direction: Precision Data-Dense Slate.** A calm, high-legibility control-room interface, not a marketing site.

| Principle | What it means in practice |
|---|---|
| **Slate foundation, restrained color** | Neutral slate surfaces. Blue (`--primary`) marks interaction and the active vehicle. Green = success/kept. Amber = warning/delay. Red = critical/failure. Violet is reserved for **Awaiting Approval**. Teal marks **Approved Replan**. |
| **Status is never color alone** | Every status shows an icon **and** a text label (Section 5). |
| **Hierarchy through weight and position, not size** | Headings are modest (max 24px page title). Data (IDs, ETAs) uses tabular monospace. |
| **Dense but readable** | 13px table cells, 36px rows (32px compact), 12px uppercase table headers, generous 12px cell padding horizontally. |
| **Interactive vs informational is explicit** | Controls have borders or fills and hover states. Status badges are flat, have no hover state and are non-focusable. A badge never looks like a button. |
| **Subtle depth** | 1px borders do most of the work. Shadows only on floating layers (popover, modal, map controls). |
| **No decoration** | No gradients, glassmorphism, glows, hero illustrations or AI-themed art. Empty states use a single 24px icon and plain text. |

### 2.1 Shared navigation and design language **[REQ]**
- Same tokens, icons (lucide-react, 1.5px stroke at 16/20/24px), type and status vocabulary on desktop and mobile.
- Dispatcher: left sidebar (240px, collapsible to 64px) with *Fleet Overview*, *Active Routes*, *Incidents* (count badge), *Plan Comparison*, *Customer Updates*. Top header 56px with date/shift, connection state, theme toggle, user menu.
- Driver: no sidebar. Header (56px + safe area) with route ID and shift status. Sticky bottom action bar with *Report disruption* and *Navigate*.
- Dark mode: user-selectable (`light`, `dark`, `system`). Default `system`.

### 2.2 Cross-cutting states **[REQ]**
| State | Visual rule |
|---|---|
| **Empty** | Centered 24px icon in `--muted-foreground`, one-line heading (`card-title`), one-line cause/next step (`body-sm`), optional single action. Example: *"No active disruptions. All routes are on plan."* |
| **Loading** | Skeleton blocks in `--surface-secondary` with a 1.2s shimmer (disabled under reduced motion, then static). Tables show 6 skeleton rows. Never show a spinner over stale data without a label. |
| **Error** | Inline `Alert` (`destructive-subtle`), icon + plain-language message + **Retry**. Explain what did not happen (for example *"Re-optimization did not finish. Your current plan is unchanged."*). |
| **Offline** | Persistent header pill `WifiOff` + *"Offline: showing last known data"*. Mutating actions (Approve, Send) are disabled with a tooltip explaining why. |
| **Stale data** | If the last update is older than the configured threshold (**[OPT]** default 60 s), the affected panel shows an amber `Timer` chip *"Updated 3 min ago"* and its timestamp turns `--warning-subtle-foreground`. Approval is blocked on stale incidents (see Section 12). |
| **Solver timeout/failure** | Distinct from infeasible orders. Message: *"Optimization did not finish (timeout). This does not mean deliveries are impossible. Current plan unchanged."* Uses `destructive` styling, not the BROKEN orange. |

---

## 3. Light Mode Color Tokens

HEX is canonical. HSL = `hsl(H, S%, L%)`, derived from HEX. Dark values are in Section 4 under the same CSS variable.


**Background and surfaces**

| Token | CSS variable | HEX | HSL | Intended use |
|---|---|---|---|---|
| Background Canvas | `--background` | `#F8FAFC` | `hsl(210, 40%, 98%)` | App canvas behind all panels |
| Surface Primary | `--surface` | `#FFFFFF` | `hsl(0, 0%, 100%)` | Main panels, sidebar, table body |
| Surface Secondary | `--surface-secondary` | `#F1F5F9` | `hsl(210, 40%, 96.1%)` | Table header, zebra rows, inset areas (alias `--muted`) |
| Surface Elevated | `--surface-elevated` | `#FFFFFF` | `hsl(0, 0%, 100%)` | Raised panels, sticky bars, map side panels |
| Surface Card | `--card` | `#FFFFFF` | `hsl(0, 0%, 100%)` | KPI and fleet cards |
| Surface Popover | `--popover` | `#FFFFFF` | `hsl(0, 0%, 100%)` | Menus, tooltips, select lists, toasts |
| Surface Input | `--surface-input` | `#FFFFFF` | `hsl(0, 0%, 100%)` | Input, select, textarea background |
| Surface Hover | `--surface-hover` | `#EEF2F7` | `hsl(213.3, 36%, 95.1%)` | Row, menu item and ghost-button hover |

**Text**

| Token | CSS variable | HEX | HSL | Intended use |
|---|---|---|---|---|
| Text Primary | `--foreground` | `#0F172A` | `hsl(222.2, 47.4%, 11.2%)` | Headings, values, table cells |
| Text Secondary | `--text-secondary` | `#475569` | `hsl(215.3, 19.3%, 34.5%)` | Supporting text, descriptions |
| Text Muted | `--muted-foreground` | `#526179` | `hsl(216.9, 19.2%, 39.8%)` | Captions, helper text, timestamps |
| Text Disabled | `--text-disabled` | `#94A3B8` | `hsl(215, 20.2%, 65.1%)` | Disabled controls (exempt from contrast, never used for information) |
| Text Inverse | `--text-inverse` | `#FFFFFF` | `hsl(0, 0%, 100%)` | Text on solid dark/light fills |
| Text Link | `--text-link` | `#1D4ED8` | `hsl(224.3, 76.3%, 48%)` | Inline links |

**Brand and accents**

| Token | CSS variable | HEX | HSL | Intended use |
|---|---|---|---|---|
| Brand Primary | `--primary` | `#2563EB` | `hsl(221.2, 83.2%, 53.3%)` | Primary actions, active vehicle, selection |
| Brand Primary Foreground | `--primary-foreground` | `#FFFFFF` | `hsl(0, 0%, 100%)` | Text/icons on Brand Primary |
| Brand Primary Hover | `--primary-hover` | `#1D4ED8` | `hsl(224.3, 76.3%, 48%)` | Primary hover |
| Brand Primary Active | `--primary-active` | `#1E40AF` | `hsl(225.9, 70.7%, 40.2%)` | Primary pressed |
| Brand Secondary | `--secondary` | `#DBEAFE` | `hsl(214.3, 94.6%, 92.7%)` | Selected rows, secondary buttons, soft brand fills |
| Brand Secondary Foreground | `--secondary-foreground` | `#1E3A8A` | `hsl(224.4, 64.3%, 32.9%)` | Text on Brand Secondary |
| Accent Highlight | `--accent` | `#0F766E` | `hsl(175.3, 77.4%, 26.1%)` | Approved replan, optimization result highlights |
| Accent Foreground | `--accent-foreground` | `#FFFFFF` | `hsl(0, 0%, 100%)` | Text on Accent |
| Focus Ring | `--ring` | `#2563EB` | `hsl(221.2, 83.2%, 53.3%)` | `:focus-visible` outline |

**Semantic status colors**

| Token | CSS variable | HEX | HSL | Intended use |
|---|---|---|---|---|
| Success | `--success` | `#15803D` | `hsl(142.4, 71.8%, 29.2%)` | Solid fill: Completed, healthy, valid |
| Success Foreground | `--success-foreground` | `#FFFFFF` | `hsl(0, 0%, 100%)` | Text/icon on solid success |
| Success Subtle Background | `--success-subtle` | `#DCFCE7` | `hsl(140.6, 84.2%, 92.5%)` | Badge/alert background for success |
| Success Subtle Foreground | `--success-subtle-foreground` | `#166534` | `hsl(142.8, 64.2%, 24.1%)` | Text/icon on success subtle background |
| Success Border | `--success-border` | `#86EFAC` | `hsl(141.7, 76.6%, 73.1%)` | Border for success badges and alerts |
| Warning | `--warning` | `#B45309` | `hsl(26, 90.5%, 37.1%)` | Solid fill: Delay, attention needed, caution |
| Warning Foreground | `--warning-foreground` | `#FFFFFF` | `hsl(0, 0%, 100%)` | Text/icon on solid warning |
| Warning Subtle Background | `--warning-subtle` | `#FEF3C7` | `hsl(48, 96.5%, 88.8%)` | Badge/alert background for warning |
| Warning Subtle Foreground | `--warning-subtle-foreground` | `#92400E` | `hsl(22.7, 82.5%, 31.4%)` | Text/icon on warning subtle background |
| Warning Border | `--warning-border` | `#FCD34D` | `hsl(45.9, 96.7%, 64.5%)` | Border for warning badges and alerts |
| Destructive / Critical | `--destructive` | `#DC2626` | `hsl(0, 72.2%, 50.6%)` | Solid fill: Critical failure, invalid report, destructive action |
| Destructive / Critical Foreground | `--destructive-foreground` | `#FFFFFF` | `hsl(0, 0%, 100%)` | Text/icon on solid destructive |
| Destructive / Critical Subtle Background | `--destructive-subtle` | `#FEE2E2` | `hsl(0, 93.3%, 94.1%)` | Badge/alert background for destructive |
| Destructive / Critical Subtle Foreground | `--destructive-subtle-foreground` | `#991B1B` | `hsl(0, 70%, 35.3%)` | Text/icon on destructive subtle background |
| Destructive / Critical Border | `--destructive-border` | `#FCA5A5` | `hsl(0, 93.5%, 81.8%)` | Border for destructive badges and alerts |
| Informative | `--info` | `#0369A1` | `hsl(201.3, 96.3%, 32.2%)` | Solid fill: Informational notices, in-progress help text |
| Informative Foreground | `--info-foreground` | `#FFFFFF` | `hsl(0, 0%, 100%)` | Text/icon on solid info |
| Informative Subtle Background | `--info-subtle` | `#E0F2FE` | `hsl(204, 93.8%, 93.7%)` | Badge/alert background for info |
| Informative Subtle Foreground | `--info-subtle-foreground` | `#075985` | `hsl(201, 90%, 27.5%)` | Text/icon on info subtle background |
| Informative Border | `--info-border` | `#7DD3FC` | `hsl(199.4, 95.5%, 73.9%)` | Border for info badges and alerts |
| Pending | `--pending` | `#475569` | `hsl(215.3, 19.3%, 34.5%)` | Solid fill: Waiting, not yet started or not yet resolved |
| Pending Foreground | `--pending-foreground` | `#FFFFFF` | `hsl(0, 0%, 100%)` | Text/icon on solid pending |
| Pending Subtle Background | `--pending-subtle` | `#F1F5F9` | `hsl(210, 40%, 96.1%)` | Badge/alert background for pending |
| Pending Subtle Foreground | `--pending-subtle-foreground` | `#475569` | `hsl(215.3, 19.3%, 34.5%)` | Text/icon on pending subtle background |
| Pending Border | `--pending-border` | `#CBD5E1` | `hsl(212.7, 26.8%, 83.9%)` | Border for pending badges and alerts |
| Neutral | `--neutral` | `#64748B` | `hsl(215.4, 16.3%, 46.9%)` | Solid fill: Inactive, archived, no state |
| Neutral Foreground | `--neutral-foreground` | `#FFFFFF` | `hsl(0, 0%, 100%)` | Text/icon on solid neutral |
| Neutral Subtle Background | `--neutral-subtle` | `#E2E8F0` | `hsl(214.3, 31.8%, 91.4%)` | Badge/alert background for neutral |
| Neutral Subtle Foreground | `--neutral-subtle-foreground` | `#334155` | `hsl(215.3, 25%, 26.7%)` | Text/icon on neutral subtle background |
| Neutral Border | `--neutral-border` | `#CBD5E1` | `hsl(212.7, 26.8%, 83.9%)` | Border for neutral badges and alerts |
| Destructive Hover | `--destructive-hover` | `#B91C1C` | `hsl(0, 73.7%, 41.8%)` | Danger button hover |
| Destructive Active | `--destructive-active` | `#991B1B` | `hsl(0, 70%, 35.3%)` | Danger button pressed |

**Borders and dividers**

| Token | CSS variable | HEX | HSL | Intended use |
|---|---|---|---|---|
| Border Subtle | `--border-subtle` | `#E2E8F0` | `hsl(214.3, 31.8%, 91.4%)` | Card edges, quiet separation |
| Border Default | `--border` | `#CBD5E1` | `hsl(212.7, 26.8%, 83.9%)` | Table lines, panel borders |
| Border Strong | `--border-strong` | `#94A3B8` | `hsl(215, 20.2%, 65.1%)` | Emphasized separators, drag handles |
| Border Input (control boundary) | `--input` | `#7A8AA0` | `hsl(214.7, 16.7%, 55.3%)` | Input/select/checkbox boundary (meets 3:1 non-text contrast) |
| Border Active | `--border-active` | `#2563EB` | `hsl(221.2, 83.2%, 53.3%)` | Selected card/row, active tab |
| Border Focus | `--border-focus` | `#2563EB` | `hsl(221.2, 83.2%, 53.3%)` | Focused control border (paired with ring) |
| Divider | `--divider` | `#E8EDF3` | `hsl(212.7, 31.4%, 93.1%)` | Hairlines inside tables/lists |

**Map**

| Token | CSS variable | HEX | HSL | Intended use |
|---|---|---|---|---|
| Map Canvas | `--map-canvas` | `#EAF0F6` | `hsl(210, 40%, 94.1%)` | Node-graph/map background |
| Map Edge | `--map-edge` | `#B6C2D2` | `hsl(214.3, 23.7%, 76.9%)` | Unselected road edges |
| Map Node | `--map-node` | `#64748B` | `hsl(215.4, 16.3%, 46.9%)` | Network nodes and depot outline |

**Overlay (alpha token)**

| Token | CSS variable | HEX (base) | HSL | Alpha | Use |
|---|---|---|---|---|---|
| Surface Overlay | `--overlay` + `--overlay-alpha` | `#0F172A` | `hsl(222.2, 47.4%, 11.2%)` | 0.50 | Modal/drawer scrim |


> **Text hierarchy note.** The brief suggests ~100% / 70% / 45% opacity for text levels. Opacity-based text fails contrast on tinted surfaces, so this system uses **explicit solid tokens** (`--foreground`, `--text-secondary`, `--muted-foreground`) whose ratios are verified in Section 15.

---

## 4. Dark Mode Color Tokens

Dark mode uses lighter surfaces for higher elevation (instead of heavy shadows), a lighter blue primary with dark text, and desaturated subtle backgrounds.


**Background and surfaces**

| Token | CSS variable | HEX | HSL | Intended use |
|---|---|---|---|---|
| Background Canvas | `--background` | `#0B1120` | `hsl(222.9, 48.8%, 8.4%)` | App canvas behind all panels |
| Surface Primary | `--surface` | `#0F172A` | `hsl(222.2, 47.4%, 11.2%)` | Main panels, sidebar, table body |
| Surface Secondary | `--surface-secondary` | `#151F33` | `hsl(220, 41.7%, 14.1%)` | Table header, zebra rows, inset areas (alias `--muted`) |
| Surface Elevated | `--surface-elevated` | `#1A2540` | `hsl(222.6, 42.2%, 17.6%)` | Raised panels, sticky bars, map side panels |
| Surface Card | `--card` | `#121B31` | `hsl(222.6, 46.3%, 13.1%)` | KPI and fleet cards |
| Surface Popover | `--popover` | `#1A2540` | `hsl(222.6, 42.2%, 17.6%)` | Menus, tooltips, select lists, toasts |
| Surface Input | `--surface-input` | `#0B1426` | `hsl(220, 55.1%, 9.6%)` | Input, select, textarea background |
| Surface Hover | `--surface-hover` | `#1E293B` | `hsl(217.2, 32.6%, 17.5%)` | Row, menu item and ghost-button hover |

**Text**

| Token | CSS variable | HEX | HSL | Intended use |
|---|---|---|---|---|
| Text Primary | `--foreground` | `#F1F5F9` | `hsl(210, 40%, 96.1%)` | Headings, values, table cells |
| Text Secondary | `--text-secondary` | `#CBD5E1` | `hsl(212.7, 26.8%, 83.9%)` | Supporting text, descriptions |
| Text Muted | `--muted-foreground` | `#94A3B8` | `hsl(215, 20.2%, 65.1%)` | Captions, helper text, timestamps |
| Text Disabled | `--text-disabled` | `#64748B` | `hsl(215.4, 16.3%, 46.9%)` | Disabled controls (exempt from contrast, never used for information) |
| Text Inverse | `--text-inverse` | `#0B1120` | `hsl(222.9, 48.8%, 8.4%)` | Text on solid dark/light fills |
| Text Link | `--text-link` | `#93C5FD` | `hsl(211.7, 96.4%, 78.4%)` | Inline links |

**Brand and accents**

| Token | CSS variable | HEX | HSL | Intended use |
|---|---|---|---|---|
| Brand Primary | `--primary` | `#60A5FA` | `hsl(213.1, 93.9%, 67.8%)` | Primary actions, active vehicle, selection |
| Brand Primary Foreground | `--primary-foreground` | `#0B1120` | `hsl(222.9, 48.8%, 8.4%)` | Text/icons on Brand Primary |
| Brand Primary Hover | `--primary-hover` | `#93C5FD` | `hsl(211.7, 96.4%, 78.4%)` | Primary hover |
| Brand Primary Active | `--primary-active` | `#BFDBFE` | `hsl(213.3, 96.9%, 87.3%)` | Primary pressed |
| Brand Secondary | `--secondary` | `#14264D` | `hsl(221.1, 58.8%, 19%)` | Selected rows, secondary buttons, soft brand fills |
| Brand Secondary Foreground | `--secondary-foreground` | `#BFDBFE` | `hsl(213.3, 96.9%, 87.3%)` | Text on Brand Secondary |
| Accent Highlight | `--accent` | `#2DD4BF` | `hsl(172.5, 66%, 50.4%)` | Approved replan, optimization result highlights |
| Accent Foreground | `--accent-foreground` | `#04201E` | `hsl(175.7, 77.8%, 7.1%)` | Text on Accent |
| Focus Ring | `--ring` | `#60A5FA` | `hsl(213.1, 93.9%, 67.8%)` | `:focus-visible` outline |

**Semantic status colors**

| Token | CSS variable | HEX | HSL | Intended use |
|---|---|---|---|---|
| Success | `--success` | `#22C55E` | `hsl(142.1, 70.6%, 45.3%)` | Solid fill: Completed, healthy, valid |
| Success Foreground | `--success-foreground` | `#052E16` | `hsl(144.9, 80.4%, 10%)` | Text/icon on solid success |
| Success Subtle Background | `--success-subtle` | `#0F2A1D` | `hsl(151.1, 47.4%, 11.2%)` | Badge/alert background for success |
| Success Subtle Foreground | `--success-subtle-foreground` | `#86EFAC` | `hsl(141.7, 76.6%, 73.1%)` | Text/icon on success subtle background |
| Success Border | `--success-border` | `#166534` | `hsl(142.8, 64.2%, 24.1%)` | Border for success badges and alerts |
| Warning | `--warning` | `#F59E0B` | `hsl(37.7, 92.1%, 50.2%)` | Solid fill: Delay, attention needed, caution |
| Warning Foreground | `--warning-foreground` | `#1C1304` | `hsl(37.5, 75%, 6.3%)` | Text/icon on solid warning |
| Warning Subtle Background | `--warning-subtle` | `#2B1E08` | `hsl(37.7, 68.6%, 10%)` | Badge/alert background for warning |
| Warning Subtle Foreground | `--warning-subtle-foreground` | `#FCD34D` | `hsl(45.9, 96.7%, 64.5%)` | Text/icon on warning subtle background |
| Warning Border | `--warning-border` | `#92400E` | `hsl(22.7, 82.5%, 31.4%)` | Border for warning badges and alerts |
| Destructive / Critical | `--destructive` | `#EF4444` | `hsl(0, 84.2%, 60.2%)` | Solid fill: Critical failure, invalid report, destructive action |
| Destructive / Critical Foreground | `--destructive-foreground` | `#1F0707` | `hsl(0, 63.2%, 7.5%)` | Text/icon on solid destructive |
| Destructive / Critical Subtle Background | `--destructive-subtle` | `#2D1111` | `hsl(0, 45.2%, 12.2%)` | Badge/alert background for destructive |
| Destructive / Critical Subtle Foreground | `--destructive-subtle-foreground` | `#FCA5A5` | `hsl(0, 93.5%, 81.8%)` | Text/icon on destructive subtle background |
| Destructive / Critical Border | `--destructive-border` | `#991B1B` | `hsl(0, 70%, 35.3%)` | Border for destructive badges and alerts |
| Informative | `--info` | `#38BDF8` | `hsl(198.4, 93.2%, 59.6%)` | Solid fill: Informational notices, in-progress help text |
| Informative Foreground | `--info-foreground` | `#04202E` | `hsl(200, 84%, 9.8%)` | Text/icon on solid info |
| Informative Subtle Background | `--info-subtle` | `#0C2535` | `hsl(203.4, 63.1%, 12.7%)` | Badge/alert background for info |
| Informative Subtle Foreground | `--info-subtle-foreground` | `#7DD3FC` | `hsl(199.4, 95.5%, 73.9%)` | Text/icon on info subtle background |
| Informative Border | `--info-border` | `#075985` | `hsl(201, 90%, 27.5%)` | Border for info badges and alerts |
| Pending | `--pending` | `#94A3B8` | `hsl(215, 20.2%, 65.1%)` | Solid fill: Waiting, not yet started or not yet resolved |
| Pending Foreground | `--pending-foreground` | `#0B1120` | `hsl(222.9, 48.8%, 8.4%)` | Text/icon on solid pending |
| Pending Subtle Background | `--pending-subtle` | `#1E293B` | `hsl(217.2, 32.6%, 17.5%)` | Badge/alert background for pending |
| Pending Subtle Foreground | `--pending-subtle-foreground` | `#CBD5E1` | `hsl(212.7, 26.8%, 83.9%)` | Text/icon on pending subtle background |
| Pending Border | `--pending-border` | `#475569` | `hsl(215.3, 19.3%, 34.5%)` | Border for pending badges and alerts |
| Neutral | `--neutral` | `#64748B` | `hsl(215.4, 16.3%, 46.9%)` | Solid fill: Inactive, archived, no state |
| Neutral Foreground | `--neutral-foreground` | `#FFFFFF` | `hsl(0, 0%, 100%)` | Text/icon on solid neutral |
| Neutral Subtle Background | `--neutral-subtle` | `#1B2436` | `hsl(220, 33.3%, 15.9%)` | Badge/alert background for neutral |
| Neutral Subtle Foreground | `--neutral-subtle-foreground` | `#94A3B8` | `hsl(215, 20.2%, 65.1%)` | Text/icon on neutral subtle background |
| Neutral Border | `--neutral-border` | `#334155` | `hsl(215.3, 25%, 26.7%)` | Border for neutral badges and alerts |
| Destructive Hover | `--destructive-hover` | `#F87171` | `hsl(0, 90.6%, 70.8%)` | Danger button hover |
| Destructive Active | `--destructive-active` | `#FCA5A5` | `hsl(0, 93.5%, 81.8%)` | Danger button pressed |

**Borders and dividers**

| Token | CSS variable | HEX | HSL | Intended use |
|---|---|---|---|---|
| Border Subtle | `--border-subtle` | `#1E293B` | `hsl(217.2, 32.6%, 17.5%)` | Card edges, quiet separation |
| Border Default | `--border` | `#2A3650` | `hsl(221.1, 31.1%, 23.9%)` | Table lines, panel borders |
| Border Strong | `--border-strong` | `#475569` | `hsl(215.3, 19.3%, 34.5%)` | Emphasized separators, drag handles |
| Border Input (control boundary) | `--input` | `#64748B` | `hsl(215.4, 16.3%, 46.9%)` | Input/select/checkbox boundary (meets 3:1 non-text contrast) |
| Border Active | `--border-active` | `#60A5FA` | `hsl(213.1, 93.9%, 67.8%)` | Selected card/row, active tab |
| Border Focus | `--border-focus` | `#60A5FA` | `hsl(213.1, 93.9%, 67.8%)` | Focused control border (paired with ring) |
| Divider | `--divider` | `#172033` | `hsl(220.7, 37.8%, 14.5%)` | Hairlines inside tables/lists |

**Map**

| Token | CSS variable | HEX | HSL | Intended use |
|---|---|---|---|---|
| Map Canvas | `--map-canvas` | `#0E1626` | `hsl(220, 46.2%, 10.2%)` | Node-graph/map background |
| Map Edge | `--map-edge` | `#33425E` | `hsl(219.1, 29.7%, 28.4%)` | Unselected road edges |
| Map Node | `--map-node` | `#94A3B8` | `hsl(215, 20.2%, 65.1%)` | Network nodes and depot outline |

**Overlay (alpha token)**

| Token | CSS variable | HEX (base) | HSL | Alpha | Use |
|---|---|---|---|---|---|
| Surface Overlay | `--overlay` + `--overlay-alpha` | `#020617` | `hsl(228.6, 84%, 4.9%)` | 0.70 | Modal/drawer scrim |


---

## 5. Semantic Logistics Status Mapping

Every status is expressed as **label + icon + color** (never color alone). Use the `StatusBadge` component (Section 17). Hex values below are used for the fg / bg / border triplet of the badge.

| Status | Label (always shown) | Icon (lucide-react) | Border | Light fg / bg / border | Dark fg / bg / border | Meaning |
|---|---|---|---|---|---|---|
| `delivered` | **Delivered** | `CheckCircle2` | solid | `#166534` / `#DCFCE7` / `#86EFAC` | `#86EFAC` / `#0F2A1D` / `#166534` | Order completed. Immutable during replanning. |
| `pending` | **Pending** | `Clock` | dashed | `#475569` / `#F1F5F9` / `#CBD5E1` | `#CBD5E1` / `#1E293B` / `#475569` | Assigned, not yet delivered. Not a failure. |
| `failed` | **Failed Delivery** | `PackageX` | solid | `#9F1239` / `#FFE4E6` / `#FDA4AF` | `#FDA4AF` / `#2E1020` / `#9F1239` | Delivery attempted and failed. Tracked separately from pending. |
| `active-vehicle` | **Active Vehicle** | `Truck` | solid | `#1D4ED8` / `#DBEAFE` / `#93C5FD` | `#93C5FD` / `#14264D` / `#1E40AF` | Vehicle on shift and moving on its route. |
| `delayed-route` | **Delayed Route** | `Timer` | solid | `#92400E` / `#FEF3C7` / `#FCD34D` | `#FCD34D` / `#2B1E08` / `#92400E` | Route ETA beyond planned time or window risk. |
| `disruption` | **Disruption** | `TriangleAlert` | solid | `#991B1B` / `#FEE2E2` / `#FCA5A5` | `#FCA5A5` / `#2D1111` / `#991B1B` | Reported or confirmed incident affecting operations. |
| `awaiting-approval` | **Awaiting Approval** | `ShieldQuestion` | solid | `#5B21B6` / `#EDE9FE` / `#C4B5FD` | `#C4B5FD` / `#221546` / `#5B21B6` | Needs explicit dispatcher decision. Nothing has changed yet. |
| `approved-replan` | **Approved Replan** | `ShieldCheck` | solid | `#115E59` / `#CCFBF1` / `#5EEAD4` | `#5EEAD4` / `#0B2B29` / `#115E59` | Dispatcher-approved plan, committed after validation. |
| `kept` | **KEPT** | `Equal` | solid | `#166534` / `#DCFCE7` / `#86EFAC` | `#86EFAC` / `#0F2A1D` / `#166534` | Same vehicle, unchanged planned time. |
| `moved` | **MOVED** | `ArrowLeftRight` | solid | `#1D4ED8` / `#DBEAFE` / `#93C5FD` | `#93C5FD` / `#14264D` / `#1E40AF` | Vehicle or planned time changed. |
| `broken` | **BROKEN** | `Unlink` | solid | `#9A3412` / `#FFEDD5` / `#FDBA74` | `#FDBA74` / `#2B1708` / `#9A3412` | Left unassigned with an operational reason. |
| `unassigned` | **Unassigned Order** | `CircleDashed` | dashed | `#9A3412` / `#FFEDD5` / `#FDBA74` | `#FDBA74` / `#2B1708` / `#9A3412` | Order currently has no vehicle (same color family as BROKEN). |

**Distinctions that must stay visible**

| Pair | Rule |
|---|---|
| **Pending vs Failed Delivery** | Pending = slate, dashed border, `Clock`. Failed = rose, solid, `PackageX`. A pending order is **never** counted or colored as failed. |
| **Pending vs Unassigned vs BROKEN** | Pending = has a vehicle, not delivered yet. Unassigned/BROKEN = **no vehicle** (orange family, `CircleDashed`/`Unlink`). BROKEN is the plan-comparison label for an order that ended unassigned, with a reason. |
| **Disruption vs Failed Delivery** | Disruption (red, `TriangleAlert`) is an operational incident. Failed Delivery (rose, `PackageX`) is the outcome of a delivery attempt. |
| **Awaiting Approval vs Approved Replan** | Violet + `ShieldQuestion` + dashed route lines (not applied) versus teal + `ShieldCheck` + solid route lines (committed). |
| **Delivered** | Green, immutable. Never shown as MOVED or BROKEN in the comparison. They appear in a separate *Completed (locked)* group with a `Lock` icon. |

**Map and route colors [REQ for meaning, OPT for exact styling]**
| Element | Style |
|---|---|
| Committed route line | 3px solid `--primary` |
| Proposed route line | 3px **dashed** (`6 4`) `--status-awaiting-approval` |
| Completed route segment | 2px solid `--border-strong` |
| Blocked road / closed edge | 3px solid `--destructive` with an `X` midpoint marker |
| Unassigned order stop | Orange diamond marker with label, no route attached |

---

## 6. Typography Matrix

**Fonts (Google Fonts)**
- **Inter**: UI, tables, mobile. Weights 400, 500, 600. Enable `font-feature-settings: "cv11", "ss01"` and `font-variant-numeric: tabular-nums` for numerals in tables and KPIs.
- **JetBrains Mono**: order IDs, route IDs, vehicle IDs, timestamps, tabular metrics. Weights 500, 600.

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@500;600&display=swap" rel="stylesheet">
```

**Scale logic.** Root = 16px. Dense UI uses a 12 / 13 / 14px ladder (tables, labels, badges). Headings use a 16 / 18 / 24 / 30 / 36px display ladder (approximately x1.125 to x1.33 per step). All line heights are multiples of 4px. The scale is intentionally not strictly geometric because dense tables need the 12/13/14 steps. On screens narrower than 640px, `input-text` and `body` use 16px (Section 16).

| Token | Element / use | Family | Size (rem) | Size (px) | Line height | Letter spacing | Weight |
|---|---|---|---|---|---|---|---|
| `display` | Empty-state / login hero only | Inter | 2.25 | 36 | 2.5rem (40px) | -0.02em | 600 |
| `page-title` | Page title (one per screen) | Inter | 1.5 | 24 | 2rem (32px) | -0.015em | 600 |
| `section` | Section heading, dialog title | Inter | 1.125 | 18 | 1.75rem (28px) | -0.01em | 600 |
| `card-title` | Card heading, panel title | Inter | 1 | 16 | 1.5rem (24px) | -0.005em | 600 |
| `body-lg` | Driver body copy, delivery instructions | Inter | 1 | 16 | 1.5rem (24px) | 0 | 400 |
| `body` | Default desktop body text | Inter | 0.875 | 14 | 1.25rem (20px) | 0 | 400 |
| `body-sm` | Secondary descriptions, alerts | Inter | 0.8125 | 13 | 1.25rem (20px) | 0 | 400 |
| `label` | Form labels, tab labels | Inter | 0.8125 | 13 | 1rem (16px) | 0.005em | 500 |
| `caption` | Captions, helper text, timestamps | Inter | 0.75 | 12 | 1rem (16px) | 0.01em | 400 |
| `th` | Table header (uppercase) | Inter | 0.75 | 12 | 1rem (16px) | 0.04em | 600 |
| `td` | Table cell (dense) | Inter | 0.8125 | 13 | 1.25rem (20px) | 0 | 400 |
| `kpi` | KPI value (tabular-nums) | Inter | 1.875 | 30 | 2.25rem (36px) | -0.02em | 600 |
| `kpi-label` | KPI label | Inter | 0.75 | 12 | 1rem (16px) | 0.02em | 500 |
| `button` | Button text | Inter | 0.875 | 14 | 1.25rem (20px) | 0 | 500 |
| `input-text` | Input text (16px on mobile to prevent iOS zoom) | Inter | 0.875 | 14 | 1.25rem (20px) | 0 | 400 |
| `badge` | Status badge text | Inter | 0.75 | 12 | 1rem (16px) | 0.01em | 500 |
| `mono-metric` | Order/route/vehicle IDs, timestamps, table numerics | JetBrains Mono | 0.8125 | 13 | 1.25rem (20px) | 0 | 500 |
| `mono-lg` | Driver ETA and current order ID (glanceable) | JetBrains Mono | 1.5 | 24 | 2rem (32px) | -0.01em | 600 |

---

## 7. Spacing and Grid Tokens

**Baseline: 4px.** Rem values assume a 16px root.

| Token | px | rem |
|---|---|---|
| `space-1` | 4 | 0.25 |
| `space-2` | 8 | 0.5 |
| `space-3` | 12 | 0.75 |
| `space-4` | 16 | 1 |
| `space-5` | 20 | 1.25 |
| `space-6` | 24 | 1.5 |
| `space-7` | 28 | 1.75 |
| `space-8` | 32 | 2 |
| `space-9` | 36 | 2.25 |
| `space-10` | 40 | 2.5 |
| `space-11` | 44 | 2.75 |
| `space-12` | 48 | 3 |
| `space-13` | 52 | 3.25 |
| `space-14` | 56 | 3.5 |
| `space-15` | 60 | 3.75 |
| `space-16` | 64 | 4 |

### 7.1 Semantic spacing tokens **[REQ for grid, OPT for specific values]**

| Purpose | Token / value |
|---|---|
| Component internal padding (compact / default / roomy) | `space-2` 8px / `space-3` 12px / `space-4` 16px |
| Form field vertical rhythm (label to input / field to field) | `space-1.5`(6px) / `space-4` 16px |
| Button padding (sm / default / lg) | `px-3 py-1.5` / `px-4 py-2` / `px-5 py-2.5` |
| Card padding (desktop / mobile) | `space-4` 16px (KPI), `space-5` 20px (panels) / `space-4` 16px |
| Table cell padding | `px-3` 12px horizontal, `py-2` 8px (row height 36px), compact `py-1.5` (32px) |
| Section spacing | `space-6` 24px between panels, `space-8` 32px between page sections |
| Desktop content gutter | 24px (`--gutter-desktop`) |
| Mobile gutter and safe area | 16px + `env(safe-area-inset-*)` (`--gutter-mobile`, `--safe-*`) |
| Dialog padding | 24px (`space-6`); header/footer separated by `--divider` |
| Sidebar width | 240px expanded, 64px collapsed |
| Header height | 56px (+ `--safe-top` on mobile) |

### 7.2 Breakpoints

| Name | Min width | Use |
|---|---|---|
| (base) | 0 | Phone, driver layout |
| `sm` | 640px | Large phone / small tablet |
| `md` | 768px | Tablet |
| `lg` | 1024px | Small desktop, sidebar visible |
| `xl` | 1280px | Full dispatcher layout (map + rail) |
| `2xl` | 1536px | Wide desktop |
| `3xl` | 1920px | Control-room display |

### 7.3 Layout dimensions

| Layout | Specification |
|---|---|
| **Dispatcher workspace** | Fluid width (no max-width). 240px sidebar + fluid content. 12-column grid, 16px gap, 24px gutters. |
| **KPI grid** | `grid-cols-2` (base) / `md:grid-cols-3` / `xl:grid-cols-5`. Card min-height 88px. Five KPIs: Active vehicles, Delivered, Pending, Active disruptions, Fleet delay (min). |
| **Fleet map and route table split** (`xl+`) | Row 1: map fills remaining width (min 480px) and **right rail 400px** (Incidents and approvals). Map min-height 420px, height `clamp(420px, 52vh, 720px)`. Row 2: *Active Fleet Routes* table, full width. |
| **`lg` to `xl`** | Rail becomes a 400px right drawer (toggle in header). Map and table stack. |
| **Below `lg`** (tablet) | Tabs: *Map*, *Routes*, *Incidents*. One panel visible at a time. |
| **Incident reporting panel** | 400px (rail), full-height sheet on mobile. |
| **Before/after comparison table** | Min width 960px inside its own `overflow-x-auto` container (page never scrolls horizontally). Sticky header and sticky first column (Order). Under `md`: card list. |
| **Driver mobile dashboard** | Single column, 16px gutters, content max-width 480px centered on larger phones. Bottom action bar 72px + `--safe-bottom`. |
| **Dialog widths** | `sm` 400px (confirmations), `md` **560px (incident approval)**, `lg` 720px (comparison detail). Mobile: bottom sheet, max-height `90dvh`. |
| **Drawer widths** | 400px (incidents), 480px (customer voice preview). Mobile: full width. |

---

## 8. Radius and Elevation Tokens

### 8.1 Radius

| Token | px | Used for |
|---|---|---|
| `rounded-none` | 0 | Table cells, full-bleed map, dividers |
| `rounded-sm` | 4 | Checkbox, small tags, inline code |
| `rounded-md` | 6 | Buttons (default), inputs, selects, table-action chips |
| `rounded-lg` | 8 | Cards, KPI cards, panels, alerts, tooltips (`--radius`) |
| `rounded-xl` | 12 | Dialogs, drawers, popovers, driver current-delivery card |
| `rounded-2xl` | 16 | Mobile bottom sheets (top corners only) |
| `rounded-full` | 9999 | Status badges, vehicle markers, voice button, toggles, avatars |

### 8.2 Elevation

Light mode uses soft slate shadows. Dark mode uses **lighter surfaces plus a 1px inner top highlight** (`inset 0 1px 0 rgb(255 255 255 / .04)`), with deeper black shadows only on floating layers.

| Level | Token | Used for | Light value | Dark value |
|---|---|---|---|---|
| Elevation 0 | `shadow-e0` | Canvas, flat panels (border only) | `none` | `none` |
| Elevation 1 | `shadow-e1` | Cards, KPI cards, sticky header | `0 1px 2px 0 rgb(15 23 42 / 0.06), inset 0 1px 0 0 rgb(255 255 255 / 0.6)` | `0 1px 2px 0 rgb(0 0 0 / 0.35), inset 0 1px 0 0 rgb(255 255 255 / 0.04)` |
| Elevation 2 | `shadow-e2` | Raised panels, hovered cards, dropdown triggers | `0 2px 4px -1px rgb(15 23 42 / 0.08), 0 1px 2px 0 rgb(15 23 42 / 0.06)` | `0 2px 6px -1px rgb(0 0 0 / 0.45), inset 0 1px 0 0 rgb(255 255 255 / 0.05)` |
| Elevation 3 | `shadow-e3` | Side drawers, bottom sheets | `0 8px 16px -4px rgb(15 23 42 / 0.12), 0 2px 4px -2px rgb(15 23 42 / 0.08)` | `0 8px 20px -4px rgb(0 0 0 / 0.55), inset 0 1px 0 0 rgb(255 255 255 / 0.06)` |
| Popover | `shadow-popover` | Menus, tooltips, toasts, select lists | `0 8px 24px -6px rgb(15 23 42 / 0.16), 0 0 0 1px rgb(15 23 42 / 0.04)` | `0 8px 24px -6px rgb(0 0 0 / 0.6), 0 0 0 1px rgb(255 255 255 / 0.06)` |
| Modal | `shadow-modal` | Dialogs (incident approval) | `0 20px 40px -12px rgb(15 23 42 / 0.24), 0 0 0 1px rgb(15 23 42 / 0.04)` | `0 24px 48px -12px rgb(0 0 0 / 0.7), 0 0 0 1px rgb(255 255 255 / 0.08)` |
| Floating map controls | `shadow-map-control` | Zoom, recenter, legend | `0 2px 6px 0 rgb(15 23 42 / 0.18), 0 0 0 1px rgb(15 23 42 / 0.06)` | `0 2px 8px 0 rgb(0 0 0 / 0.55), 0 0 0 1px rgb(255 255 255 / 0.08)` |

**Layering rule:** canvas (`--background`) < panels (`--surface`, e0 + 1px `--border-subtle`) < raised (`--surface-elevated`, e1/e2) < floating (`--popover`, popover/modal shadow) < overlay (`--overlay`).

---

## 9. Component Interaction State Specifications

All transitions: `background-color, border-color, box-shadow, color` at `--duration-base` (150ms) with `--ease-standard`. Pressed states use `--duration-fast` (100ms). Under `prefers-reduced-motion: reduce`, durations collapse to 0.01ms and pulses/shimmers stop.

### 9.1 Buttons

**Sizes**

| Size | Min height | Padding | Radius | Use |
|---|---|---|---|---|
| `sm` | 32px | `px-3` | `md` | Dense table actions (desktop only) |
| `default` | 36px | `px-4 py-2` | `md` | Desktop default |
| `lg` | 44px | `px-5 py-2.5` | `lg` | Mobile default, dialogs on touch |
| `xl` | 56px | `px-6` | `lg` | Driver primary actions |
| `icon` | 36 x 36 (44 x 44 on touch) | `p-0` | `md` | Icon-only (**requires** `aria-label`) |

**Variants** (token names; focus-visible is identical for all: `outline-none ring-2 ring-ring ring-offset-2 ring-offset-background`)

| Variant | Background | Foreground | Border | Hover | Active | Disabled | Loading |
|---|---|---|---|---|---|---|---|
| **Primary** | `primary` | `primary-foreground` | transparent | bg `primary-hover` | bg `primary-active` | bg `surface-secondary`, fg `text-disabled`, border `border-subtle` | Spinner replaces icon, label kept, `aria-busy`, pointer-events none |
| **Secondary** | `secondary` | `secondary-foreground` | transparent | border `border-active` + `shadow-1` | border `border-active`, no shadow | as Primary | same |
| **Outline** | `surface` | `foreground` | `input` | bg `surface-hover` | bg `surface-secondary` | as Primary | same |
| **Ghost** | transparent | `text-secondary` | transparent | bg `surface-hover`, fg `foreground` | bg `surface-secondary` | fg `text-disabled` | same |
| **Danger** | `destructive` | `destructive-foreground` | transparent | bg `destructive-hover` | bg `destructive-active` | as Primary | same |
| **Icon-only** | as Ghost | `text-secondary` | transparent | as Ghost | as Ghost | as Ghost | Spinner |
| **Voice / Radio** | see 9.2 | | | | | | |

> **Approve and Re-optimize** uses **Primary** at `lg` size, never Danger. Destructive actions (Reject) use **Outline** with `destructive-subtle-foreground` text to avoid looking like the main action.

### 9.2 Voice / Radio control **[REQ]**

Never indicate recording unless the browser reports it (`MediaRecorder.state === "recording"`). The visual is driven only by actual state.

| State | Visual | Label (always visible) | Behavior / announcement |
|---|---|---|---|
| **Idle** | Circle 72px (`rounded-full`), bg `primary`, `Mic` icon | "Report disruption" | Tap to start. Hint: "Only report when it is safe to do so." |
| **Requesting permission** | Same, spinner ring | "Allow microphone…" | Waits for browser prompt. `aria-live="polite"`. |
| **Recording** | bg `destructive`, `Square` (stop) icon, ring pulse (static ring under reduced motion), elapsed timer in mono | "Recording 0:07, tap to stop" | `aria-live="assertive"` on start and stop. Auto-stop at 30 s. |
| **Processing** | bg `surface-secondary`, spinner | "Reading your report…" | Disabled. `aria-busy="true"`. |
| **Success** | bg `success`, `Check` icon | "Report sent for review" + short summary of what was understood | Shows **validated location chip** or clarification request. Auto-returns to Idle after 5 s or on tap. |
| **Needs clarification** | bg `warning-subtle`, `HelpCircle` | "Location not recognized: please repeat or type it" | Text fallback focused. **Never auto-substitutes a location.** |
| **Error** | bg `destructive-subtle`, `MicOff` | "Couldn't record. Try again or type your report." | Offers *Type instead* button. |
| **Permission denied** | bg `surface-secondary`, `MicOff` | "Microphone blocked. Use text report." | Link to browser help. Text form opens. |

### 9.3 Form controls

Common rules: height 36px desktop / 44px mobile, `rounded-md`, 1px border `input`, bg `surface-input`, text `foreground`, placeholder `muted-foreground`. Label above (`label` token), required marked with text "(required)" not just an asterisk. Helper text `caption` in `muted-foreground`.

| Control | Spec |
|---|---|
| **Focus-visible** | `ring-2 ring-ring ring-offset-2 ring-offset-background`, border `border-focus` |
| **Validation (error)** | Border `destructive`, `CircleAlert` 16px icon inside/next to field, message in `destructive-subtle-foreground` (`caption`), `aria-invalid="true"`, `aria-describedby` to message |
| **Disabled** | bg `surface-secondary`, text `text-disabled`, cursor `not-allowed`, no hover |
| **Text input** | Left icon optional. 16px font on mobile. |
| **Search input** | `Search` icon left, clear (`X`) button right (44px touch target on mobile), `role="search"` on container, debounce 200ms |
| **Select** | Custom popover list (`popover` bg, `shadow-popover`), option height 36px, selected shows `Check`. Native `<select>` on mobile. |
| **Textarea** | min 3 rows, resize vertical, character hint in caption when limited |
| **Checkbox** | 16px box, `rounded-sm`, checked bg `primary` with white check. Label click area >= 24px high (44px on mobile) |
| **Radio group** | 16px circle, grouped in `fieldset` + `legend`, arrow-key navigation |
| **Toggle** | 36 x 20 track (`rounded-full`), `role="switch"`, state text "On/Off" visible beside it |
| **Date/time** | Native `datetime-local` / `time` inputs, mono font, 24-hour display, with explicit timezone note in helper text |
| **Voice transcript field** | Textarea, **editable before submission**, header "Transcript (check before sending)", shows the source badge (`Mic` Voice or `Keyboard` Typed). It is a draft, never auto-submitted. |

### 9.4 Operational components

| Component | Specification |
|---|---|
| **KPI card** | `card` bg, 1px `border-subtle`, `rounded-lg`, padding 16px. Label (`kpi-label`, `muted-foreground`) top, value (`kpi`, tabular-nums) below, optional delta row (`caption`) with icon + text. No sparklines. |
| **Fleet status card** | Vehicle ID (mono) + `StatusBadge` (vehicle state), driver name, route progress bar, next stop + ETA (mono), capacity usage "420 / 800 kg". Whole card is a button (focus ring) that selects the vehicle on the map. |
| **Vehicle marker** | 28px circle (`rounded-full`), 2px white (`surface`) outline, `Truck` icon 16px. Fill by state: active `primary`, delayed `warning`, broken-down `destructive` (+ `Wrench`), off-duty `neutral`. Selected: 3px `ring` halo. Label chip with vehicle ID (mono, 12px) on hover/selection. |
| **Route line** | Committed: 3px solid. Proposed: 3px dashed. Completed segment: 2px `border-strong`. Closed road: `destructive` with X marker. |
| **Stop marker** | 24px numbered circle. Upcoming: outline `border-strong`. Current: filled `primary` + halo. Completed: `status-delivered` + `Check`. Failed: `status-failed` + `X`. Unassigned: orange diamond. |
| **Delivery status badge** | Height 22px, `rounded-full`, `px-2`, icon 12px + label (`badge` token), colors from Section 5. Non-interactive. |
| **Incident alert** | Left 4px bar in status color, `*-subtle` bg, icon + title + one-line summary + timestamp (mono) + primary action ("Review"). One per incident. |
| **Approval dialog** | See 9.5 and Section 12. |
| **Route comparison table** | See Section 10.5. |
| **Progress indicator** | Linear: 8px height, `rounded-full`, track `surface-secondary`, fill `primary` (delivery) or `accent` (replan). `role="progressbar"` with `aria-valuenow/min/max` and a visible "7 of 12 (58%)" label. |
| **Timeline** | Vertical list, 24px node column, 2px connector in `border`, nodes by state (completed check / current halo / upcoming outline). Each item: time (mono), event, detail. |
| **Notification (toast)** | `popover` bg, `shadow-popover`, 360px max, bottom-right desktop / top (below header) mobile. Icon + title + message + dismiss. `role="status"` (`role="alert"` for errors). Auto-dismiss 6s for success only, **never** for errors or approvals. |
| **Customer voice preview** | Row: `Play/Pause` icon button (44px), 4px scrubber, duration (mono), transcript toggle. Status chip: *Draft*, *Audio ready*, *Reviewed*, *Sent*, *Failed*. Always shows text **"Audio preview: no call placed"** unless a telephony provider confirmed a call. |
| **Fleet audio debrief player** | Button "Play Fleet Debrief" (Outline, `Volume2`). Expands to inline player with play/pause, 10 s progress, transcript below (always available), counts of KEPT / MOVED / BROKEN. |
| **Empty state** | See Section 2.2. |
| **Skeleton loader** | Rounded blocks matching final dimensions. `aria-hidden`, container `aria-busy`. |
| **Error message** | `Alert` destructive-subtle + Retry. Never show raw stack traces or codes without explanation. |
| **Offline indicator** | Header pill (`neutral-subtle`, `WifiOff`). |

### 9.5 Incident confirmation dialog (hierarchy) **[REQ]**

Modal, 560px, `rounded-xl`, `shadow-modal`, scrim `--overlay`. Focus is trapped. Initial focus goes to the **dialog title**, **not** the approve button. `Esc` and the Cancel button both close without side effects. **Enter never submits approval unless the Approve button itself is focused.**

| Order | Element | Style |
|---|---|---|
| 1 | Title "Review disruption" + status badge *Awaiting Approval* (violet) | `section` token |
| 2 | **Incident type** with icon (e.g. *Vehicle breakdown*) | `card-title`, status icon |
| 3 | Key facts grid: **Vehicle** (mono), **Validated location** (chip with `MapPin` and node name), **Incident time** (mono, local time) | Label `caption` muted, value `body` / `mono-metric` |
| 4 | **Affected orders** list (order ID mono, customer reference, window, current status) with the *Completed (locked)* subgroup | Max 6 rows, then "+N more" |
| 5 | **Validation result** panel | Success: `success-subtle` "Vehicle, orders and location verified". Warning/Failure: `warning-subtle` / `destructive-subtle` listing each failed check |
| 6 | **Consequence note** | "Approving starts re-optimization automatically. Completed deliveries stay unchanged. Routes start from current vehicle positions. No separate 'Optimize' step is needed." (`body-sm`) |
| 7 | Footer: **Cancel** (Ghost) · **Request clarification** (Outline) · **Reject** (Outline, destructive text) · **Approve and Re-optimize** (Primary, right-most) | Approve disabled whenever validation failed, data is stale, or the incident version changed |

**Clarification required variant:** validation panel is `destructive-subtle` with e.g. *"Location 'N99' is not in the delivery map."*, location chip shows `HelpCircle` and "Unverified". **Approve and Re-optimize is disabled.** *Request clarification* is the Primary action. No suggested replacement is applied automatically. If candidate locations are offered **[OPT]**, they appear as an unselected list the dispatcher must choose from, and the selection is recorded in the audit log.

---

## 10. Dispatcher Dashboard Component Guidelines

### 10.1 Screen priorities **[REQ]**
Visual weight, in order: **(1) live fleet map, (2) active routes, (3) disruptions needing attention, (4) pending approvals.** Everything else is secondary.

```
+--------+------------------------------------------------------------------+
| SIDEBAR| HEADER 56px: date/shift . connection state . theme . user        |
| 240px  +------------------------------------------------------------------+
|        | KPI: Active vehicles | Delivered | Pending | Disruptions | Delay  |
| Fleet  +-----------------------------------------------+------------------+
| Routes |                                               | INCIDENTS RAIL   |
| Incid. |            FLEET MAP                          | 400px            |
| Compare|     (vehicles, routes, stops, disruptions)    | - Awaiting       |
| Updates|                                               |   approval (1)   |
|        |                                               | - Clarification  |
|        |                                               | - Report form    |
|        +-----------------------------------------------+------------------+
|        | ACTIVE FLEET ROUTES table (full width)                           |
+--------+------------------------------------------------------------------+
```
*Wireframe is schematic. Sample labels in mockups must be marked "Sample data".*

### 10.2 Fleet overview KPIs
| KPI | Definition | Note |
|---|---|---|
| Active vehicles | Vehicles with state `ACTIVE` / total on shift | Broken-down count shown as a caption in `destructive-subtle-foreground` |
| Delivered | Orders with status Delivered | Immutable |
| Pending | Assigned, not delivered, not failed | Never includes Failed or Unassigned |
| Active disruptions | Incidents in `PENDING_REVIEW`, `NEEDS_CLARIFICATION`, `APPROVED`, `REPLANNING` | Click opens the rail |
| Fleet delay | Sum of positive (planned ETA minus window or plan) delay, in minutes | Label the exact definition in a tooltip |

### 10.3 Active Fleet Routes table
Columns: **Vehicle** (mono + state badge) · **Driver** · **Route ID** (mono) · **Progress** (bar + "7/12") · **Next stop** · **ETA** (mono) · **Load** (kg used/capacity) · **Status** · **Actions** (icon buttons with `aria-label`).
Row height 36px (32px compact toggle). Sticky header. Row hover `surface-hover`. Selected row: 3px left bar `border-active` + `secondary` bg. Selecting a row highlights its route on the map and vice-versa. Broken-down vehicle rows show `destructive` left bar and remaining stops struck-through only when a **committed** plan removed them.

### 10.4 Incident panel (rail)
Sections in order: *Awaiting approval* (violet), *Needs clarification* (amber), *Active replans* (teal, with progress), *Recently resolved* (collapsed). The **report form** sits at the bottom with tabs *Type* / *Voice*. Each incident appears **once**.

### 10.5 Before-versus-after comparison **[REQ]**

Shown only after a plan is **committed**. A `Proposed` / `Committed` badge is always visible in the header.

| Column | Content |
|---|---|
| Order | Mono ID, customer reference |
| Previous vehicle / New vehicle | Mono; arrow icon between when different |
| Previous ETA / New ETA | Mono, 24h; delta chip (`+35 min` in `warning-subtle`, `-5 min` in `success-subtle`) |
| Wait | Mono "18 min" when arrival is before window opening |
| Status | `StatusBadge` KEPT / MOVED / BROKEN |
| Reason | Plain language ("Vehicle breakdown (Truck 1)", "Remaining capacity 40 kg is below parcel 65 kg") |
| Customer update | Voice preview control state |

Filters (segmented control with counts): **All · KEPT · MOVED · BROKEN**. Active filter has `secondary` bg + `border-active`. `aria-pressed`. Row tint: 3px left bar in the status color only (no full-row color). Completed deliveries sit in a collapsed **Completed (locked)** group with `Lock` icon and are never counted in the filters.

Summary strip above the table: counts per status, fleet delay before/after, unassigned orders list.

**Solver failure vs infeasible:** a failed or timed-out run shows the destructive *"Optimization did not finish"* alert and **no** BROKEN rows. BROKEN rows appear only in a committed plan.

### 10.6 Customer communication controls
Per affected order: *Generate message* → *Preview* (text + audio player) → *Mark reviewed* → *Send call* (enabled only if telephony is configured, otherwise replaced by the text *"Audio preview only: no call will be placed"*). The status chip shows exactly what happened: **Draft, Audio ready, Reviewed, Call placed, Failed**. Audio ready is **never** labelled as a call.

### 10.7 Fleet debrief
`Play Fleet Debrief` appears in the comparison summary strip after a committed plan. States: idle, generating, playing, error (transcript still shown).

### 10.8 Dense table rules
Header: `th` token on `surface-secondary`, 1px bottom `border`. Cells: `td`; IDs/times/numbers in `mono-metric`, right-aligned numerics, left-aligned text. Zebra off by default. Truncate with ellipsis plus `title`/tooltip, never wrap IDs. Keyboard: arrow keys move between rows (`role="grid"` only if cells are interactive, otherwise a standard `<table>`).

### 10.9 Map overlays
Floating map controls (zoom, recenter, legend) use `popover` bg, `rounded-lg`, `shadow-map-control`, 36px buttons. Legend is collapsible and uses the same icons and labels as Section 5. Disruption markers: 32px red triangle (`TriangleAlert`) with white outline plus a label chip. Selected-vehicle info popover: ID, driver, next stop, ETA, load.

---

## 11. Driver Dashboard Component Guidelines

### 11.1 Layout **[REQ]**
Single column, mobile-first. 16px gutters + safe-area. Sticky header (route ID + shift status). Sticky bottom bar (72px + safe bottom): **Report disruption (voice)** primary circle, **Type report** secondary, **Navigate** secondary.

```
+--------------------------------+
| Route R-07 (mono)   Shift: On  |  header
| Driver . Vehicle T-1 (sample)  |
+--------------------------------+
| KPI row (driver only)          |
| Assigned 12 | Delivered 5      |
| Pending 6   | Failed 1         |
| Route 42% . 18.4 km left       |
| Est. completion 15:20          |
+--------------------------------+
| Progress  [#####-------] 5/12  |
+--------------------------------+
| CURRENT DELIVERY               |
| ORD-104 (mono)                 |
| Destination . Instructions     |
| ETA 10:20 (mono-lg)            |
| [ Navigate ]                   |
+--------------------------------+
| MY ROUTE  completed / current  |
|  / upcoming stops              |
+--------------------------------+
| (notification: route updated)  |
+--------------------------------+
| ( MIC )  [Type]  [Navigate]    |  sticky bar
+--------------------------------+
```

### 11.2 Driver KPIs **[REQ]**
Calculated **only** from this driver's assigned orders and route.

| KPI | Formula |
|---|---|
| Total assigned | Orders currently assigned to this driver's route |
| Delivered | Assigned orders with status Delivered |
| Failed | Assigned orders with status Failed Delivery. **Tracked separately.** |
| Pending / undelivered | Assigned − Delivered − Failed. **Not** treated as failed. |
| Route completion % | Delivered ÷ (Assigned) × 100, shown with the "5 of 12" fraction |
| Remaining distance | Sum of remaining leg distances on the current route, from the plan (hide the KPI if unavailable) |
| Est. completion time | Planned ETA of the last stop, shown only when available |

Do **not** show fleet-wide metrics, other drivers, other vehicles or company totals on this screen.

### 11.3 Current delivery card
`rounded-xl`, `card` bg, 1px `border-active`. Contents: order ID (`mono-lg`), destination, delivery instructions (`body-lg`, max 3 lines + expand), ETA (`mono-lg`), time window (mono), **Navigate** (xl button). Mark-delivered / mark-failed actions are **[OPT]**. If used, each needs a confirmation step and a reason for failed.

### 11.4 My Route list
Three groups: *Completed* (collapsed by default, check icon), *Current* (highlighted), *Upcoming* (outline numbers). Each stop: sequence, order ID (mono), area name, ETA (mono), status badge. After an **approved** replan, changed stops show a `MOVED`-style chip *"Updated"* with previous ETA struck through, for the first view only.

### 11.5 Route-change notification **[REQ]**
A persistent in-app card (not an auto-dismissing toast): *"Route updated by dispatch at 10:42"* + summary (stops added/removed, first changed stop) + **View new route** button. Only approved and committed plans trigger it. No notification for proposals.

### 11.6 Reporting
- **Voice** (primary): the 72px control from Section 9.2. After success show a **short** summary only ("Truck breakdown near Sector 4, noted"), never a long transcript.
- **Text alternative**: bottom sheet with incident type segmented control (*Breakdown, Road blocked, Delay*), location field with validation, optional note. Max 3 inputs.
- **Submission status**: `Received` → `Checked` → `With dispatcher` → `Approved` / `Rejected` / `Need more info`, shown as a 4-step compact timeline. Location validation feedback is inline: ✔ "Location verified: Sector 4" or ✖ "Location not recognized. Please repeat or choose from the list" with no auto-substitution.
- The driver **cannot** approve replans or reassign deliveries. No such controls exist in this view.

### 11.7 Safe-driving rules **[REQ]**
- Voice reporting needs **one tap to start, one tap to stop**. No reading of transcripts, no multi-field forms while the vehicle is moving.
- Caption under the mic: *"Report only when it is safe to do so."*
- If the vehicle is flagged moving **[OPT]**, hide the text form behind a *"I am stopped"* confirmation.
- No auto-playing audio while navigating except dispatcher-approved route announcements the driver has enabled.
- Minimum touch target 48px (primary 72px), minimum text 16px, contrast >= 7:1 for current delivery text where possible (`foreground` on `card` already meets this).

---

## 12. Incident Reporting and Approval Workflow

### 12.1 State models **[REQ]**

| Model | States (in order) | Visual |
|---|---|---|
| **Order** | `PENDING` · `DELIVERED` · `FAILED` · `UNASSIGNED` (optional `CANCELLED`) | Section 5 |
| **Route** | `PLANNED` · `ACTIVE` · `DELAYED` · `COMPLETED` · `REPLAN_PROPOSED` | slate · blue · amber · green · violet |
| **Vehicle** | `AVAILABLE` · `ACTIVE` · `BROKEN_DOWN` · `OFF_DUTY` | neutral · blue · red · neutral |
| **Incident** | `RECEIVED` · `NEEDS_CLARIFICATION` · `REJECTED` · `PENDING_REVIEW` · `APPROVED` · `REPLANNING` · `RESOLVED` · `FAILED` | slate · amber · neutral · violet · teal · teal (progress) · green · red |
| **Approval** | `AWAITING` · `APPROVED` · `REJECTED` · `CLARIFICATION_REQUESTED` · `STALE` | violet · teal · neutral · amber · amber |
| **Customer comm.** | `NOT_REQUIRED` · `DRAFT` · `AUDIO_READY` · `REVIEWED` · `CALL_PLACED` · `FAILED` | neutral · slate · blue · blue · green · red |

Rules: completed deliveries are immutable in every state. An incident stays `PENDING_REVIEW` until a dispatcher decides. `CALL_PLACED` is displayed only when a provider confirms it.

### 12.2 Flow

```
Report received (text/voice)
  -> [voice] transcript shown to submitter for check
  -> fields extracted (type, vehicle, location, time, order info)
  -> validation vs known vehicles, orders, locations, latest state
        |-- unknown/ambiguous  -> NEEDS_CLARIFICATION -> ask reporter -> back to start
        |-- invalid            -> REJECTED with reason
        '-- valid              -> PENDING_REVIEW (violet, Awaiting Approval)
              -> Dispatcher: Approve / Reject / Request clarification
                   '-- Approve -> REPLANNING (starts automatically; no "Optimize" button)
                          -> validated plan committed -> RESOLVED
                          -> comparison table (KEPT/MOVED/BROKEN)
                          -> customer voice drafts, driver route-update notice
                          -> fleet debrief available
```

### 12.3 UI behaviour
- **Dispatcher sees** the parsed incident as *extracted and unverified* until validation completes. Provenance caption: *"Extracted from voice report, checked against fleet records."*
- **Approve** is disabled when: validation failed, location unverified, incident data is **stale**, or the incident/fleet version changed since the dialog opened (show *"Fleet state changed. Review again."* and refresh).
- **After approval:** the dialog closes, the rail item shows *Replanning…* with an indeterminate-then-determinate progress bar and a live-region message. Performance target (**[OPT]**): under 2 s on the demo dataset. Show elapsed time, **do not** promise it.
- **Timeout/failure:** destructive alert, *"Optimization did not finish. Current plan unchanged,"* with *Retry*. Does **not** mark orders BROKEN.
- **Reject:** requires an optional reason, records it, returns to monitoring.
- **Proposed vs committed:** proposed plans are only visible inside the review/approval context (dashed). The main map and tables always show the committed plan.

---

## 13. CSS Variable Implementation

Colors are stored as **HSL triplets** (`H S% L%`) so they work with `hsl(var(--x))` and Tailwind opacity modifiers. Values are generated from the HEX tables above. HEX is canonical, and HSL is computed from it at 1-decimal precision.
`--input` is the **control border** color (shadcn convention). The input **background** is `--surface-input`.
Toggle dark mode by adding `class="dark"` to `<html>`.

```css
:root {
  color-scheme: light;
  /* Background and surfaces */
  --background: 210 40% 98%;
  --surface: 0 0% 100%;
  --surface-secondary: 210 40% 96.1%;
  --surface-elevated: 0 0% 100%;
  --card: 0 0% 100%;
  --popover: 0 0% 100%;
  --surface-input: 0 0% 100%;
  --surface-hover: 213.3 36% 95.1%;
  /* Text */
  --foreground: 222.2 47.4% 11.2%;
  --text-secondary: 215.3 19.3% 34.5%;
  --muted-foreground: 216.9 19.2% 39.8%;
  --text-disabled: 215 20.2% 65.1%;
  --text-inverse: 0 0% 100%;
  --text-link: 224.3 76.3% 48%;
  /* Brand and accents */
  --primary: 221.2 83.2% 53.3%;
  --primary-foreground: 0 0% 100%;
  --primary-hover: 224.3 76.3% 48%;
  --primary-active: 225.9 70.7% 40.2%;
  --secondary: 214.3 94.6% 92.7%;
  --secondary-foreground: 224.4 64.3% 32.9%;
  --accent: 175.3 77.4% 26.1%;
  --accent-foreground: 0 0% 100%;
  --ring: 221.2 83.2% 53.3%;
  /* Semantic status colors */
  --success: 142.4 71.8% 29.2%;
  --success-foreground: 0 0% 100%;
  --success-subtle: 140.6 84.2% 92.5%;
  --success-subtle-foreground: 142.8 64.2% 24.1%;
  --success-border: 141.7 76.6% 73.1%;
  --warning: 26 90.5% 37.1%;
  --warning-foreground: 0 0% 100%;
  --warning-subtle: 48 96.5% 88.8%;
  --warning-subtle-foreground: 22.7 82.5% 31.4%;
  --warning-border: 45.9 96.7% 64.5%;
  --destructive: 0 72.2% 50.6%;
  --destructive-foreground: 0 0% 100%;
  --destructive-subtle: 0 93.3% 94.1%;
  --destructive-subtle-foreground: 0 70% 35.3%;
  --destructive-border: 0 93.5% 81.8%;
  --info: 201.3 96.3% 32.2%;
  --info-foreground: 0 0% 100%;
  --info-subtle: 204 93.8% 93.7%;
  --info-subtle-foreground: 201 90% 27.5%;
  --info-border: 199.4 95.5% 73.9%;
  --pending: 215.3 19.3% 34.5%;
  --pending-foreground: 0 0% 100%;
  --pending-subtle: 210 40% 96.1%;
  --pending-subtle-foreground: 215.3 19.3% 34.5%;
  --pending-border: 212.7 26.8% 83.9%;
  --neutral: 215.4 16.3% 46.9%;
  --neutral-foreground: 0 0% 100%;
  --neutral-subtle: 214.3 31.8% 91.4%;
  --neutral-subtle-foreground: 215.3 25% 26.7%;
  --neutral-border: 212.7 26.8% 83.9%;
  --destructive-hover: 0 73.7% 41.8%;
  --destructive-active: 0 70% 35.3%;
  /* Borders and dividers */
  --border-subtle: 214.3 31.8% 91.4%;
  --border: 212.7 26.8% 83.9%;
  --border-strong: 215 20.2% 65.1%;
  --input: 214.7 16.7% 55.3%;
  --border-active: 221.2 83.2% 53.3%;
  --border-focus: 221.2 83.2% 53.3%;
  --divider: 212.7 31.4% 93.1%;
  /* Map */
  --map-canvas: 210 40% 94.1%;
  --map-edge: 214.3 23.7% 76.9%;
  --map-node: 215.4 16.3% 46.9%;
  /* Aliases */
  --muted: var(--surface-secondary);
  --card-foreground: var(--foreground);
  --popover-foreground: var(--foreground);
  /* Logistics status (fg / bg / border) */
  --status-delivered: 142.8 64.2% 24.1%;
  --status-delivered-bg: 140.6 84.2% 92.5%;
  --status-delivered-border: 141.7 76.6% 73.1%;
  --status-pending: 215.3 19.3% 34.5%;
  --status-pending-bg: 210 40% 96.1%;
  --status-pending-border: 212.7 26.8% 83.9%;
  --status-failed: 343.4 79.7% 34.7%;
  --status-failed-bg: 355.6 100% 94.7%;
  --status-failed-border: 352.6 95.7% 81.8%;
  --status-active-vehicle: 224.3 76.3% 48%;
  --status-active-vehicle-bg: 214.3 94.6% 92.7%;
  --status-active-vehicle-border: 211.7 96.4% 78.4%;
  --status-delayed-route: 22.7 82.5% 31.4%;
  --status-delayed-route-bg: 48 96.5% 88.8%;
  --status-delayed-route-border: 45.9 96.7% 64.5%;
  --status-disruption: 0 70% 35.3%;
  --status-disruption-bg: 0 93.3% 94.1%;
  --status-disruption-border: 0 93.5% 81.8%;
  --status-awaiting-approval: 263.4 69.3% 42.2%;
  --status-awaiting-approval-bg: 251.4 91.3% 95.5%;
  --status-awaiting-approval-border: 252.5 94.7% 85.1%;
  --status-approved-replan: 176.1 69.4% 21.8%;
  --status-approved-replan-bg: 167.2 85.5% 89.2%;
  --status-approved-replan-border: 170.6 76.9% 64.3%;
  --status-kept: 142.8 64.2% 24.1%;
  --status-kept-bg: 140.6 84.2% 92.5%;
  --status-kept-border: 141.7 76.6% 73.1%;
  --status-moved: 224.3 76.3% 48%;
  --status-moved-bg: 214.3 94.6% 92.7%;
  --status-moved-border: 211.7 96.4% 78.4%;
  --status-broken: 15 79.1% 33.7%;
  --status-broken-bg: 34.3 100% 91.8%;
  --status-broken-border: 30.7 97.2% 72.4%;
  --status-unassigned: 15 79.1% 33.7%;
  --status-unassigned-bg: 34.3 100% 91.8%;
  --status-unassigned-border: 30.7 97.2% 72.4%;
  /* Shadows */
  --shadow-0: none;
  --shadow-1: 0 1px 2px 0 rgb(15 23 42 / 0.06), inset 0 1px 0 0 rgb(255 255 255 / 0.6);
  --shadow-2: 0 2px 4px -1px rgb(15 23 42 / 0.08), 0 1px 2px 0 rgb(15 23 42 / 0.06);
  --shadow-3: 0 8px 16px -4px rgb(15 23 42 / 0.12), 0 2px 4px -2px rgb(15 23 42 / 0.08);
  --shadow-popover: 0 8px 24px -6px rgb(15 23 42 / 0.16), 0 0 0 1px rgb(15 23 42 / 0.04);
  --shadow-modal: 0 20px 40px -12px rgb(15 23 42 / 0.24), 0 0 0 1px rgb(15 23 42 / 0.04);
  --shadow-map-control: 0 2px 6px 0 rgb(15 23 42 / 0.18), 0 0 0 1px rgb(15 23 42 / 0.06);
  --overlay: 222.2 47.4% 11.2%;
  --overlay-alpha: 0.5;

  /* Typography families */
  --font-sans: "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  /* Type scale */
  --fs-display: 2.25rem;
  --lh-display: 2.5rem;
  --ls-display: -0.02em;
  --fw-display: 600;
  --fs-page-title: 1.5rem;
  --lh-page-title: 2rem;
  --ls-page-title: -0.015em;
  --fw-page-title: 600;
  --fs-section: 1.125rem;
  --lh-section: 1.75rem;
  --ls-section: -0.01em;
  --fw-section: 600;
  --fs-card-title: 1rem;
  --lh-card-title: 1.5rem;
  --ls-card-title: -0.005em;
  --fw-card-title: 600;
  --fs-body-lg: 1rem;
  --lh-body-lg: 1.5rem;
  --ls-body-lg: 0;
  --fw-body-lg: 400;
  --fs-body: 0.875rem;
  --lh-body: 1.25rem;
  --ls-body: 0;
  --fw-body: 400;
  --fs-body-sm: 0.8125rem;
  --lh-body-sm: 1.25rem;
  --ls-body-sm: 0;
  --fw-body-sm: 400;
  --fs-label: 0.8125rem;
  --lh-label: 1rem;
  --ls-label: 0.005em;
  --fw-label: 500;
  --fs-caption: 0.75rem;
  --lh-caption: 1rem;
  --ls-caption: 0.01em;
  --fw-caption: 400;
  --fs-th: 0.75rem;
  --lh-th: 1rem;
  --ls-th: 0.04em;
  --fw-th: 600;
  --fs-td: 0.8125rem;
  --lh-td: 1.25rem;
  --ls-td: 0;
  --fw-td: 400;
  --fs-kpi: 1.875rem;
  --lh-kpi: 2.25rem;
  --ls-kpi: -0.02em;
  --fw-kpi: 600;
  --fs-kpi-label: 0.75rem;
  --lh-kpi-label: 1rem;
  --ls-kpi-label: 0.02em;
  --fw-kpi-label: 500;
  --fs-button: 0.875rem;
  --lh-button: 1.25rem;
  --ls-button: 0;
  --fw-button: 500;
  --fs-input-text: 0.875rem;
  --lh-input-text: 1.25rem;
  --ls-input-text: 0;
  --fw-input-text: 400;
  --fs-badge: 0.75rem;
  --lh-badge: 1rem;
  --ls-badge: 0.01em;
  --fw-badge: 500;
  --fs-mono-metric: 0.8125rem;
  --lh-mono-metric: 1.25rem;
  --ls-mono-metric: 0;
  --fw-mono-metric: 500;
  --fs-mono-lg: 1.5rem;
  --lh-mono-lg: 2rem;
  --ls-mono-lg: -0.01em;
  --fw-mono-lg: 600;
  /* Spacing (4px grid) */
  --space-1: 0.25rem; /* 4px */
  --space-2: 0.5rem; /* 8px */
  --space-3: 0.75rem; /* 12px */
  --space-4: 1rem; /* 16px */
  --space-5: 1.25rem; /* 20px */
  --space-6: 1.5rem; /* 24px */
  --space-7: 1.75rem; /* 28px */
  --space-8: 2rem; /* 32px */
  --space-9: 2.25rem; /* 36px */
  --space-10: 2.5rem; /* 40px */
  --space-11: 2.75rem; /* 44px */
  --space-12: 3rem; /* 48px */
  --space-13: 3.25rem; /* 52px */
  --space-14: 3.5rem; /* 56px */
  --space-15: 3.75rem; /* 60px */
  --space-16: 4rem; /* 64px */
  /* Layout */
  --sidebar-width: 15rem;            /* 240px */
  --sidebar-width-collapsed: 4rem;   /* 64px */
  --header-height: 3.5rem;           /* 56px */
  --gutter-desktop: 1.5rem;          /* 24px */
  --gutter-mobile: 1rem;             /* 16px */
  --rail-width: 25rem;               /* 400px incident rail */
  --safe-top: env(safe-area-inset-top, 0px);
  --safe-bottom: env(safe-area-inset-bottom, 0px);
  --safe-left: env(safe-area-inset-left, 0px);
  --safe-right: env(safe-area-inset-right, 0px);
  /* Radius */
  --radius: 0.5rem;                  /* 8px = rounded-lg */
  --radius-none: 0;
  --radius-sm: 0.25rem;              /* 4px */
  --radius-md: 0.375rem;             /* 6px */
  --radius-lg: 0.5rem;               /* 8px */
  --radius-xl: 0.75rem;              /* 12px */
  --radius-2xl: 1rem;                /* 16px */
  --radius-full: 9999px;
  /* Focus ring */
  --ring-width: 2px;
  --ring-offset: 2px;
  --ring-offset-color: var(--background);
  /* Motion */
  --duration-fast: 100ms;
  --duration-base: 150ms;
  --duration-slow: 250ms;
  --ease-standard: cubic-bezier(0.2, 0, 0, 1);
  --ease-exit: cubic-bezier(0.4, 0, 1, 1);

}

.dark {
  color-scheme: dark;
  /* Background and surfaces */
  --background: 222.9 48.8% 8.4%;
  --surface: 222.2 47.4% 11.2%;
  --surface-secondary: 220 41.7% 14.1%;
  --surface-elevated: 222.6 42.2% 17.6%;
  --card: 222.6 46.3% 13.1%;
  --popover: 222.6 42.2% 17.6%;
  --surface-input: 220 55.1% 9.6%;
  --surface-hover: 217.2 32.6% 17.5%;
  /* Text */
  --foreground: 210 40% 96.1%;
  --text-secondary: 212.7 26.8% 83.9%;
  --muted-foreground: 215 20.2% 65.1%;
  --text-disabled: 215.4 16.3% 46.9%;
  --text-inverse: 222.9 48.8% 8.4%;
  --text-link: 211.7 96.4% 78.4%;
  /* Brand and accents */
  --primary: 213.1 93.9% 67.8%;
  --primary-foreground: 222.9 48.8% 8.4%;
  --primary-hover: 211.7 96.4% 78.4%;
  --primary-active: 213.3 96.9% 87.3%;
  --secondary: 221.1 58.8% 19%;
  --secondary-foreground: 213.3 96.9% 87.3%;
  --accent: 172.5 66% 50.4%;
  --accent-foreground: 175.7 77.8% 7.1%;
  --ring: 213.1 93.9% 67.8%;
  /* Semantic status colors */
  --success: 142.1 70.6% 45.3%;
  --success-foreground: 144.9 80.4% 10%;
  --success-subtle: 151.1 47.4% 11.2%;
  --success-subtle-foreground: 141.7 76.6% 73.1%;
  --success-border: 142.8 64.2% 24.1%;
  --warning: 37.7 92.1% 50.2%;
  --warning-foreground: 37.5 75% 6.3%;
  --warning-subtle: 37.7 68.6% 10%;
  --warning-subtle-foreground: 45.9 96.7% 64.5%;
  --warning-border: 22.7 82.5% 31.4%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 0 63.2% 7.5%;
  --destructive-subtle: 0 45.2% 12.2%;
  --destructive-subtle-foreground: 0 93.5% 81.8%;
  --destructive-border: 0 70% 35.3%;
  --info: 198.4 93.2% 59.6%;
  --info-foreground: 200 84% 9.8%;
  --info-subtle: 203.4 63.1% 12.7%;
  --info-subtle-foreground: 199.4 95.5% 73.9%;
  --info-border: 201 90% 27.5%;
  --pending: 215 20.2% 65.1%;
  --pending-foreground: 222.9 48.8% 8.4%;
  --pending-subtle: 217.2 32.6% 17.5%;
  --pending-subtle-foreground: 212.7 26.8% 83.9%;
  --pending-border: 215.3 19.3% 34.5%;
  --neutral: 215.4 16.3% 46.9%;
  --neutral-foreground: 0 0% 100%;
  --neutral-subtle: 220 33.3% 15.9%;
  --neutral-subtle-foreground: 215 20.2% 65.1%;
  --neutral-border: 215.3 25% 26.7%;
  --destructive-hover: 0 90.6% 70.8%;
  --destructive-active: 0 93.5% 81.8%;
  /* Borders and dividers */
  --border-subtle: 217.2 32.6% 17.5%;
  --border: 221.1 31.1% 23.9%;
  --border-strong: 215.3 19.3% 34.5%;
  --input: 215.4 16.3% 46.9%;
  --border-active: 213.1 93.9% 67.8%;
  --border-focus: 213.1 93.9% 67.8%;
  --divider: 220.7 37.8% 14.5%;
  /* Map */
  --map-canvas: 220 46.2% 10.2%;
  --map-edge: 219.1 29.7% 28.4%;
  --map-node: 215 20.2% 65.1%;
  /* Aliases */
  --muted: var(--surface-secondary);
  --card-foreground: var(--foreground);
  --popover-foreground: var(--foreground);
  /* Logistics status (fg / bg / border) */
  --status-delivered: 141.7 76.6% 73.1%;
  --status-delivered-bg: 151.1 47.4% 11.2%;
  --status-delivered-border: 142.8 64.2% 24.1%;
  --status-pending: 212.7 26.8% 83.9%;
  --status-pending-bg: 217.2 32.6% 17.5%;
  --status-pending-border: 215.3 19.3% 34.5%;
  --status-failed: 352.6 95.7% 81.8%;
  --status-failed-bg: 328 48.4% 12.2%;
  --status-failed-border: 343.4 79.7% 34.7%;
  --status-active-vehicle: 211.7 96.4% 78.4%;
  --status-active-vehicle-bg: 221.1 58.8% 19%;
  --status-active-vehicle-border: 225.9 70.7% 40.2%;
  --status-delayed-route: 45.9 96.7% 64.5%;
  --status-delayed-route-bg: 37.7 68.6% 10%;
  --status-delayed-route-border: 22.7 82.5% 31.4%;
  --status-disruption: 0 93.5% 81.8%;
  --status-disruption-bg: 0 45.2% 12.2%;
  --status-disruption-border: 0 70% 35.3%;
  --status-awaiting-approval: 252.5 94.7% 85.1%;
  --status-awaiting-approval-bg: 255.9 53.8% 17.8%;
  --status-awaiting-approval-border: 263.4 69.3% 42.2%;
  --status-approved-replan: 170.6 76.9% 64.3%;
  --status-approved-replan-bg: 176.2 59.3% 10.6%;
  --status-approved-replan-border: 176.1 69.4% 21.8%;
  --status-kept: 141.7 76.6% 73.1%;
  --status-kept-bg: 151.1 47.4% 11.2%;
  --status-kept-border: 142.8 64.2% 24.1%;
  --status-moved: 211.7 96.4% 78.4%;
  --status-moved-bg: 221.1 58.8% 19%;
  --status-moved-border: 225.9 70.7% 40.2%;
  --status-broken: 30.7 97.2% 72.4%;
  --status-broken-bg: 25.7 68.6% 10%;
  --status-broken-border: 15 79.1% 33.7%;
  --status-unassigned: 30.7 97.2% 72.4%;
  --status-unassigned-bg: 25.7 68.6% 10%;
  --status-unassigned-border: 15 79.1% 33.7%;
  /* Shadows */
  --shadow-0: none;
  --shadow-1: 0 1px 2px 0 rgb(0 0 0 / 0.35), inset 0 1px 0 0 rgb(255 255 255 / 0.04);
  --shadow-2: 0 2px 6px -1px rgb(0 0 0 / 0.45), inset 0 1px 0 0 rgb(255 255 255 / 0.05);
  --shadow-3: 0 8px 20px -4px rgb(0 0 0 / 0.55), inset 0 1px 0 0 rgb(255 255 255 / 0.06);
  --shadow-popover: 0 8px 24px -6px rgb(0 0 0 / 0.6), 0 0 0 1px rgb(255 255 255 / 0.06);
  --shadow-modal: 0 24px 48px -12px rgb(0 0 0 / 0.7), 0 0 0 1px rgb(255 255 255 / 0.08);
  --shadow-map-control: 0 2px 8px 0 rgb(0 0 0 / 0.55), 0 0 0 1px rgb(255 255 255 / 0.08);
  --overlay: 228.6 84% 4.9%;
  --overlay-alpha: 0.7;
}
```

```css
/* base.css: global defaults */
@layer base {
  html { font-family: var(--font-sans); font-size: 100%; -webkit-text-size-adjust: 100%; }
  body { background: hsl(var(--background)); color: hsl(var(--foreground)); font-size: var(--fs-body); line-height: var(--lh-body); font-feature-settings: "cv11", "ss01"; }
  :where(table, .tabular) { font-variant-numeric: tabular-nums; }
  *:focus-visible { outline: none; box-shadow: 0 0 0 var(--ring-offset) hsl(var(--background)), 0 0 0 calc(var(--ring-offset) + var(--ring-width)) hsl(var(--ring)); }
  ::selection { background: hsl(var(--secondary)); color: hsl(var(--secondary-foreground)); }
  @media (max-width: 639.98px) { input, select, textarea { font-size: 1rem; } }
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; scroll-behavior: auto !important; }
  }
}
```

---

## 14. Tailwind Configuration

**Assumed version: Tailwind CSS 3.4.x** with a JavaScript/TypeScript config file (`tailwind.config.ts`), `darkMode: ['class']`, and CSS variables as the single source of color. This is the shadcn/ui-compatible approach. **Do not mix this with Tailwind v4's CSS-first `@theme` configuration.** If the team upgrades to v4, move the variables into `@theme` and drop this file.

```ts
// tailwind.config.ts  (Tailwind CSS 3.4.x, class-based dark mode, CSS-variable colors)
import type { Config } from 'tailwindcss';

// All colors read HSL triplets from CSS variables (Section 13), so opacity modifiers work: bg-primary/10
const c = (name: string) => `hsl(var(--${name}) / <alpha-value>)`;

const config: Config = {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    screens: {
      sm: '640px', md: '768px', lg: '1024px', xl: '1280px', '2xl': '1536px', '3xl': '1920px',
    },
    extend: {
      colors: {
        background: c('background'),
        foreground: c('foreground'),
        surface: {
          DEFAULT: c('surface'), secondary: c('surface-secondary'), elevated: c('surface-elevated'),
          input: c('surface-input'), hover: c('surface-hover'),
        },
        card: { DEFAULT: c('card'), foreground: c('card-foreground') },
        popover: { DEFAULT: c('popover'), foreground: c('popover-foreground') },
        overlay: 'hsl(var(--overlay) / var(--overlay-alpha))',
        muted: { DEFAULT: c('muted'), foreground: c('muted-foreground') },
        fg: { secondary: c('text-secondary'), disabled: c('text-disabled'), inverse: c('text-inverse'), link: c('text-link') },
        primary: { DEFAULT: c('primary'), foreground: c('primary-foreground'), hover: c('primary-hover'), active: c('primary-active') },
        secondary: { DEFAULT: c('secondary'), foreground: c('secondary-foreground') },
        accent: { DEFAULT: c('accent'), foreground: c('accent-foreground') },
        border: { DEFAULT: c('border'), subtle: c('border-subtle'), strong: c('border-strong'), active: c('border-active'), focus: c('border-focus') },
        input: c('input'),
        divider: c('divider'),
        ring: c('ring'),
        success: { DEFAULT: c('success'), foreground: c('success-foreground'), subtle: c('success-subtle'), 'subtle-foreground': c('success-subtle-foreground'), border: c('success-border') },
        warning: { DEFAULT: c('warning'), foreground: c('warning-foreground'), subtle: c('warning-subtle'), 'subtle-foreground': c('warning-subtle-foreground'), border: c('warning-border') },
        destructive: { DEFAULT: c('destructive'), foreground: c('destructive-foreground'), subtle: c('destructive-subtle'), 'subtle-foreground': c('destructive-subtle-foreground'), border: c('destructive-border'), hover: c('destructive-hover'), active: c('destructive-active') },
        info: { DEFAULT: c('info'), foreground: c('info-foreground'), subtle: c('info-subtle'), 'subtle-foreground': c('info-subtle-foreground'), border: c('info-border') },
        pending: { DEFAULT: c('pending'), foreground: c('pending-foreground'), subtle: c('pending-subtle'), 'subtle-foreground': c('pending-subtle-foreground'), border: c('pending-border') },
        neutral: { DEFAULT: c('neutral'), foreground: c('neutral-foreground'), subtle: c('neutral-subtle'), 'subtle-foreground': c('neutral-subtle-foreground'), border: c('neutral-border') },
        map: { canvas: c('map-canvas'), edge: c('map-edge'), node: c('map-node') },
        // text-status-kept  bg-status-kept-bg  border-status-kept-border
        status: {
          'delivered': { DEFAULT: c('status-delivered'), bg: c('status-delivered-bg'), border: c('status-delivered-border') },
          'pending': { DEFAULT: c('status-pending'), bg: c('status-pending-bg'), border: c('status-pending-border') },
          'failed': { DEFAULT: c('status-failed'), bg: c('status-failed-bg'), border: c('status-failed-border') },
          'active-vehicle': { DEFAULT: c('status-active-vehicle'), bg: c('status-active-vehicle-bg'), border: c('status-active-vehicle-border') },
          'delayed-route': { DEFAULT: c('status-delayed-route'), bg: c('status-delayed-route-bg'), border: c('status-delayed-route-border') },
          'disruption': { DEFAULT: c('status-disruption'), bg: c('status-disruption-bg'), border: c('status-disruption-border') },
          'awaiting-approval': { DEFAULT: c('status-awaiting-approval'), bg: c('status-awaiting-approval-bg'), border: c('status-awaiting-approval-border') },
          'approved-replan': { DEFAULT: c('status-approved-replan'), bg: c('status-approved-replan-bg'), border: c('status-approved-replan-border') },
          'kept': { DEFAULT: c('status-kept'), bg: c('status-kept-bg'), border: c('status-kept-border') },
          'moved': { DEFAULT: c('status-moved'), bg: c('status-moved-bg'), border: c('status-moved-border') },
          'broken': { DEFAULT: c('status-broken'), bg: c('status-broken-bg'), border: c('status-broken-border') },
          'unassigned': { DEFAULT: c('status-unassigned'), bg: c('status-unassigned-bg'), border: c('status-unassigned-border') },
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      fontSize: {
        'display': ['2.25rem', { lineHeight: '2.5rem', letterSpacing: '-0.02em', fontWeight: '600' }],
        'page-title': ['1.5rem', { lineHeight: '2rem', letterSpacing: '-0.015em', fontWeight: '600' }],
        'section': ['1.125rem', { lineHeight: '1.75rem', letterSpacing: '-0.01em', fontWeight: '600' }],
        'card-title': ['1rem', { lineHeight: '1.5rem', letterSpacing: '-0.005em', fontWeight: '600' }],
        'body-lg': ['1rem', { lineHeight: '1.5rem', letterSpacing: '0', fontWeight: '400' }],
        'body': ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '0', fontWeight: '400' }],
        'body-sm': ['0.8125rem', { lineHeight: '1.25rem', letterSpacing: '0', fontWeight: '400' }],
        'label': ['0.8125rem', { lineHeight: '1rem', letterSpacing: '0.005em', fontWeight: '500' }],
        'caption': ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.01em', fontWeight: '400' }],
        'th': ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.04em', fontWeight: '600' }],
        'td': ['0.8125rem', { lineHeight: '1.25rem', letterSpacing: '0', fontWeight: '400' }],
        'kpi': ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '-0.02em', fontWeight: '600' }],
        'kpi-label': ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.02em', fontWeight: '500' }],
        'button': ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '0', fontWeight: '500' }],
        'input-text': ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '0', fontWeight: '400' }],
        'badge': ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.01em', fontWeight: '500' }],
        'mono-metric': ['0.8125rem', { lineHeight: '1.25rem', letterSpacing: '0', fontWeight: '500' }],
        'mono-lg': ['1.5rem', { lineHeight: '2rem', letterSpacing: '-0.01em', fontWeight: '600' }],
      },
      // Tailwind's default spacing is already a 4px scale (1 = 0.25rem ... 16 = 4rem). Only layout tokens are added.
      spacing: {
        sidebar: '15rem', 'sidebar-collapsed': '4rem', header: '3.5rem', rail: '25rem',
        touch: '2.75rem', 'touch-lg': '3rem', 'touch-xl': '3.5rem', 'voice': '4.5rem',
        'safe-top': 'env(safe-area-inset-top, 0px)', 'safe-bottom': 'env(safe-area-inset-bottom, 0px)',
      },
      borderRadius: {
        none: '0', sm: 'var(--radius-sm)', md: 'var(--radius-md)', lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)', '2xl': 'var(--radius-2xl)', full: '9999px',
      },
      boxShadow: {
        e0: 'var(--shadow-0)', e1: 'var(--shadow-1)', e2: 'var(--shadow-2)', e3: 'var(--shadow-3)',
        popover: 'var(--shadow-popover)', modal: 'var(--shadow-modal)', 'map-control': 'var(--shadow-map-control)',
      },
      ringWidth: { DEFAULT: '2px' },
      ringOffsetWidth: { DEFAULT: '2px' },
      transitionDuration: { fast: '100ms', DEFAULT: '150ms', slow: '250ms' },
      transitionTimingFunction: { DEFAULT: 'cubic-bezier(0.2, 0, 0, 1)' },
      keyframes: {
        shimmer: { '100%': { transform: 'translateX(100%)' } },
        'ring-pulse': { '0%': { boxShadow: '0 0 0 0 hsl(var(--destructive) / 0.45)' }, '100%': { boxShadow: '0 0 0 14px hsl(var(--destructive) / 0)' } },
      },
      animation: { shimmer: 'shimmer 1.2s infinite', 'ring-pulse': 'ring-pulse 1.4s ease-out infinite' },
    },
  },
  plugins: [],
};

export default config;
```

### 14.1 Recommended utility patterns **[OPT]**

| Pattern | Classes |
|---|---|
| Focus ring (all interactive) | `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background` |
| Primary button | `inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-4 text-button text-primary-foreground transition-colors hover:bg-primary-hover active:bg-primary-active disabled:pointer-events-none disabled:bg-surface-secondary disabled:text-fg-disabled` |
| Card | `rounded-lg border border-border-subtle bg-card p-4 shadow-e1` |
| Table header cell | `bg-surface-secondary px-3 py-2 text-left text-th uppercase text-muted-foreground border-b border-border` |
| Table cell | `px-3 py-2 text-td text-foreground border-b border-divider` |
| Mono ID | `font-mono text-mono-metric tabular-nums` |
| Status badge | `inline-flex h-[22px] items-center gap-1 rounded-full border px-2 text-badge bg-status-kept-bg text-status-kept border-status-kept-border` (replace `kept`; pending/unassigned use `border-dashed`) |
| Input | `h-9 w-full rounded-md border border-input bg-surface-input px-3 text-input-text text-foreground placeholder:text-muted-foreground max-sm:h-11 max-sm:text-body-lg` |
| Dialog panel | `rounded-xl border border-border bg-popover p-6 shadow-modal` |
| Safe-area bottom bar | `fixed inset-x-0 bottom-0 h-[calc(4.5rem+env(safe-area-inset-bottom))] pb-safe-bottom px-4` |

---

## 15. Accessibility Checklist

Target: **WCAG 2.2 AA**. **[REQ]** unless stated.

### 15.1 Verified contrast (computed from the tokens in Sections 3 to 5)

| Pair | Light ratio | Dark ratio | Requirement |
|---|---|---|---|
| Text Primary (`foreground` on `background`) | 17.06:1 | 17.19:1 | 4.5:1 |
| Text Primary (`foreground` on `surface`) | 17.85:1 | 16.30:1 | 4.5:1 |
| Text Secondary (`text-secondary` on `surface`) | 7.58:1 | 12.02:1 | 4.5:1 |
| Text Secondary (`text-secondary` on `surface-secondary`) | 6.92:1 | 11.09:1 | 4.5:1 |
| Text Muted (`muted-foreground` on `background`) | 6.00:1 | 7.34:1 | 4.5:1 |
| Text Muted (`muted-foreground` on `surface-hover`) | 5.58:1 | 5.71:1 | 4.5:1 |
| Text Link (`text-link` on `surface`) | 6.70:1 | 9.90:1 | 4.5:1 |
| Primary label (`primary-foreground` on `primary`) | 5.17:1 | 7.41:1 | 4.5:1 |
| Primary hover label (`primary-foreground` on `primary-hover`) | 6.70:1 | 10.44:1 | 4.5:1 |
| Primary active label (`primary-foreground` on `primary-active`) | 8.72:1 | 13.25:1 | 4.5:1 |
| Secondary label (`secondary-foreground` on `secondary`) | 8.49:1 | 10.45:1 | 4.5:1 |
| Accent label (`accent-foreground` on `accent`) | 5.47:1 | 9.17:1 | 4.5:1 |
| Success solid (`success-foreground` on `success`) | 5.02:1 | 6.54:1 | 4.5:1 |
| Warning solid (`warning-foreground` on `warning`) | 5.02:1 | 8.55:1 | 4.5:1 |
| Destructive solid (`destructive-foreground` on `destructive`) | 4.83:1 | 5.11:1 | 4.5:1 |
| Info solid (`info-foreground` on `info`) | 5.93:1 | 7.83:1 | 4.5:1 |
| Success subtle (`success-subtle-foreground` on `success-subtle`) | 6.49:1 | 10.92:1 | 4.5:1 |
| Warning subtle (`warning-subtle-foreground` on `warning-subtle`) | 6.37:1 | 11.27:1 | 4.5:1 |
| Destructive subtle (`destructive-subtle-foreground` on `destructive-subtle`) | 6.80:1 | 9.22:1 | 4.5:1 |
| Info subtle (`info-subtle-foreground` on `info-subtle`) | 6.59:1 | 9.46:1 | 4.5:1 |
| KEPT badge (`status-kept` on `status-kept-bg`) | 6.49:1 | 10.92:1 | 4.5:1 |
| MOVED badge (`status-moved` on `status-moved-bg`) | 5.49:1 | 8.23:1 | 4.5:1 |
| BROKEN badge (`status-broken` on `status-broken-bg`) | 6.38:1 | 10.13:1 | 4.5:1 |
| Awaiting Approval badge (`status-awaiting-approval` on `status-awaiting-approval-bg`) | 7.57:1 | 9.00:1 | 4.5:1 |
| Input border (non-text, 3:1) (`input` on `surface-input`) | 3.52:1 | 3.86:1 | 3:1 |
| Focus ring (non-text, 3:1) (`ring` on `background`) | 4.94:1 | 7.41:1 | 3:1 |

All text pairs listed meet 4.5:1 and all non-text boundaries meet 3:1 in both themes. Disabled text (`--text-disabled`) is exempt and is never used to convey information.

### 15.2 Checklist

- [ ] **Text contrast** >= 4.5:1 (body), >= 3:1 for text 24px+ or 19px+ bold. Never rely on opacity for text color.
- [ ] **Non-text contrast** >= 3:1: input borders, focus rings, icons that carry meaning, selected states, chart/map markers.
- [ ] **Not color alone:** every status has an icon **and** a text label. Route proposed vs committed also differs by line style (dashed vs solid).
- [ ] **Keyboard:** all functionality operable by keyboard. Logical tab order. No keyboard traps (dialogs trap focus intentionally and return it to the trigger on close). `Esc` closes dialogs, drawers and popovers. Table rows selectable with Enter/Space.
- [ ] **Visible focus** (`:focus-visible`): 2px ring + 2px offset on every interactive element. Focus is never hidden under sticky headers (`scroll-padding-top: 4rem`).
- [ ] **Screen-reader labels:** icon-only buttons have `aria-label`. Map markers have accessible names ("Vehicle T-1, active, next stop ORD-104"). Provide a **table view alternative** to the map for the same data.
- [ ] **Status announcements:** `aria-live="polite"` for replanning progress, new incident and plan committed. `aria-live="assertive"` / `role="alert"` for errors and recording start/stop. Don't announce every vehicle movement.
- [ ] **Reduced motion:** honor `prefers-reduced-motion` (pulses, shimmer, map pan animations off).
- [ ] **Touch targets:** minimum **24 x 24 CSS px** (WCAG 2.2 AA 2.5.8). Recommended **44 x 44**. Driver primary controls **48 to 72px**. Spacing between adjacent targets >= 8px.
- [ ] **Clear errors:** say what happened, what is unchanged and what to do (WCAG 3.3.1, 3.3.3). Errors are associated with their fields.
- [ ] **Redundant entry (3.3.7):** do not ask the driver or dispatcher to re-enter data already provided in the same flow.
- [ ] **Consistent help/navigation (3.2.6, 3.2.3):** same locations for help, theme toggle and navigation on every screen.
- [ ] **Responsive text scaling:** use `rem`. Layout survives 200% zoom and 400% reflow at 320 CSS px without horizontal page scroll (tables scroll inside their container).
- [ ] **Voice feedback:** recording state is visible **and** announced. Timer shown. Stop is a single obvious control. A text alternative always exists.
- [ ] **Safe driver interactions:** one-tap voice, no long transcripts, no complex forms while moving, caution text visible.
- [ ] **Language:** `<html lang>` set. Times shown in 24-hour format with timezone context where ambiguous.
- [ ] **Audio:** every audio output (customer call preview, debrief) has a visible transcript and playback controls. No autoplay.

---

## 16. Responsive Design Guidance

| Viewport | Dispatcher layout | Driver layout |
|---|---|---|
| **Base (< 640)** | Not primary. Single column, tabs (*Map, Routes, Incidents*), tables become cards | **Primary.** Single column, sticky header and bottom bar, 16px gutters + safe areas, 16px minimum text |
| **sm (640+)** | As base, 2-column KPI | Content centered, max-width 480px |
| **md (768+)** | Tabs, 3-column KPI, comparison as scrollable table | Same as sm |
| **lg (1024+)** | Sidebar visible (collapsible), map + table stacked, rail as drawer | Not intended |
| **xl (1280+)** | **Full layout:** KPI strip, map + 400px rail, routes table below | n/a |
| **2xl / 3xl** | Map grows, table gains optional columns (load, driver). Do not increase font sizes. Increase map area. | n/a |

Rules:
- Use CSS grid/flex with `min-w-0` to prevent overflow. Wide tables live in `overflow-x-auto` regions with visible scroll affordance.
- Inputs are 16px on small screens (avoids iOS zoom). Use `dvh` units for full-height sheets and keep primary actions above the on-screen keyboard.
- Tokens are **identical** across breakpoints. Only component size variants (`default` to `lg`/`xl`) and layout change.
- Test in both themes at 360, 390, 430, 768, 1024, 1440 and 1920px widths.

---

## 17. Component Naming Conventions

| Area | Convention | Examples |
|---|---|---|
| React components | PascalCase, domain-first | `FleetMap`, `ActiveRoutesTable`, `IncidentReviewDialog`, `PlanComparisonTable`, `StatusBadge`, `VoiceReportButton`, `CustomerVoicePreview`, `FleetDebriefPlayer`, `DriverKpiRow`, `CurrentDeliveryCard`, `MyRouteList` |
| Primitives (UI kit) | Plain names in `components/ui/` | `Button`, `Input`, `Select`, `Dialog`, `Sheet`, `Toast`, `Skeleton`, `Alert` |
| Props for status | A single union type | `status: 'delivered' \| 'pending' \| 'failed' \| 'unassigned' \| 'kept' \| 'moved' \| 'broken' \| ...` (the `key` column in Section 5) |
| CSS variables | kebab-case, semantic (not hue-based) | `--surface-elevated`, `--status-kept-bg`, never `--blue-500` in components |
| Tailwind color classes | Semantic | `bg-surface`, `text-fg-secondary`, `border-border-subtle`, `text-status-moved` |
| Files | PascalCase component files, kebab-case for utilities | `PlanComparisonTable.tsx`, `format-eta.ts` |
| Folders | Feature-based | `features/dispatcher/`, `features/driver/`, `features/incidents/`, `features/plan-comparison/`, `features/voice/` |
| Test ids | `data-testid="kebab-case"` | `incident-approve-button`, `diff-filter-broken` |
| Enums (UI) | UPPER_SNAKE matching backend state names | `PENDING_REVIEW`, `NEEDS_CLARIFICATION` |
| Icons | lucide-react, imported by name from `components/icons.ts` | The icon names in Section 5 |

---

## 18. Design Implementation Acceptance Checklist

**Foundations**
- [ ] CSS variables and Tailwind config match this document exactly (values and names). `class="dark"` toggling works and persists with a `system` default.
- [ ] Inter and JetBrains Mono load with `display=swap`. IDs, times and numeric metrics use mono + tabular numbers.
- [ ] All contrast ratios in Section 15.1 are reproduced in a visual QA pass in both themes.

**Dispatcher**
- [ ] Map, active routes, incidents and pending approvals dominate the layout. No AI control tower, no generic insights, no duplicate alerts.
- [ ] Incident appears once, flows through *Needs clarification / Awaiting approval / Replanning / Resolved*.
- [ ] Approval dialog follows the hierarchy in 9.5. **Approve and Re-optimize** is never auto-triggered, never default-focused, and disabled on invalid, unverified or stale incidents.
- [ ] Approval starts re-optimization **automatically**, with no extra "Optimize" button.
- [ ] Proposed plans are dashed/violet and never presented as active. Only approved, validated plans render as committed.
- [ ] Comparison table shows previous/new vehicle, previous/new ETA, wait, status, reason. Filters All/KEPT/MOVED/BROKEN with counts. Completed deliveries are in a separate locked group.
- [ ] Solver timeout/failure is visually distinct from BROKEN (infeasible) orders and never creates BROKEN rows.
- [ ] Customer voice preview distinguishes *Audio ready* from *Call placed*, and shows a transcript.
- [ ] *Play Fleet Debrief* is available after a committed plan and has a transcript.

**Driver**
- [ ] Only the driver's own route, orders and KPIs appear. No fleet-wide metrics.
- [ ] KPIs: assigned, delivered, pending, **failed (separate)**, completion %, remaining distance and ETA when available.
- [ ] Pending is never styled or counted as failed. Unassigned orders are not listed as route stops.
- [ ] Voice control: 72px, honest recording state, one tap start/stop, text alternative, safety caption.
- [ ] Unknown location shows clarification feedback. Nothing is guessed or substituted.
- [ ] Route-change notification appears only after dispatcher-approved, committed plans, and the new stop order and ETAs are visible.

**Cross-cutting**
- [ ] Empty, loading, error, offline and stale states implemented for every data panel.
- [ ] No color-only status. Every status has icon + label.
- [ ] Keyboard-only and screen-reader pass on the approval dialog, voice control and comparison table.
- [ ] `prefers-reduced-motion` verified. 200% zoom and 320px reflow verified.
- [ ] All mockups and demo data are labelled **Sample data**. No invented live data or backend features.
