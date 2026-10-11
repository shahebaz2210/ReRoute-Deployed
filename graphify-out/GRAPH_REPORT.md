# Graph Report - Vortexa 3.0  (2026-10-11)

## Corpus Check
- 129 files · ~101,422 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 9 file(s) not represented in the graph (top: (none) 3, .example 1, .ico 1)

## Summary
- 782 nodes · 1226 edges · 61 communities (53 shown, 8 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 21 edges (avg confidence: 0.94)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4757a159`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- react
- next
- schemas.ts
- web/package.json
- schema.ts
- header.tsx
- package.json
- plan-parser.ts
- database/package.json
- compilerOptions
- fleet/route.ts
- fleet/page.tsx
- contracts/package.json
- compilerOptions
- compilerOptions
- login/route.ts
- Control Room Dashboard Cockpit
- selection-controls.tsx
- DispatchX (ReRoute / VORTEXA 3.0) — Project TODO
- models.py
- skeleton.tsx
- mock-data.ts
- dispatchx-optimizer
- ⚡ DispatchX (VORTEXA 3.0 / ReRoute)
- users.ts
- D. Mermaid Flowcharts
- auth.test.ts
- E. Screen-by-Screen Interaction Matrix
- session.ts
- src/env.ts
- Appflow.md
- A. Document Control and Product Boundaries
- zod
- J. Core Logistics Domain Invariants
- 📊 DispatchX — Implementation Status & Progress Tracker
- C. Global Application Shell and Navigation
- B. Sitemap and Route Topology
- I. Network, Retry, and Re-authentication Protocols
- drivers/route.ts
- Q. Unresolved Decisions and Assumptions
- F. Modal, Drawer, Popover, and Toast Registry
- G. Frontend State Model and Ownership
- H. Optimistic UI Protocols and Rollback
- L. Observability and Analytics
- web/README.md
- AGENTS.md
- docker/README.md
- migrations/README.md
- optimizer/README.md
- Phase 1 — Project Foundation & Infrastructure (Tasks 1–65)
- Phase 19 — Testing (Tasks 311–338)
- Phase 6 — Optimization Engine (Tasks 136–169)
- Phase 13 — Notifications & Briefings (Tasks 255–272)
- Phase 8 — Incident Reporting & Validation (Tasks 179–209)
- Phase 9 — Dynamic Re-optimization (Tasks 210–233)
- Phase 3 — Design System & UI Foundation (Tasks 76–104)
- UI Reference — Design Inspiration
- uuid.ts
- metrics.ts
- audit-logger.ts

## God Nodes (most connected - your core abstractions)
1. `next` - 44 edges
2. `react` - 37 edges
3. `lucide-react` - 30 edges
4. `AppShell()` - 29 edges
5. `Button` - 28 edges
6. `DispatchX (ReRoute / VORTEXA 3.0) — Project TODO` - 24 edges
7. `StatusBadge()` - 17 edges
8. `compilerOptions` - 16 edges
9. `solve_vrptw()` - 16 edges
10. `DataTable()` - 14 edges

## Surprising Connections (you probably didn't know these)
- `3.3 Application Shell` --references--> `AppShell()`  [INFERRED]
  TODO.md → apps/web/components/shell/app-shell.tsx
- `3.2 Base Components` --references--> `Toggle()`  [INFERRED]
  TODO.md → apps/web/components/ui/selection-controls.tsx
- `3.2 Base Components` --references--> `RadioGroup()`  [INFERRED]
  TODO.md → apps/web/components/ui/selection-controls.tsx
- `4.1 Fleet & Vehicle` --references--> `FleetStatusCard()`  [INFERRED]
  TODO.md → apps/web/components/fleet/fleet-status-card.tsx
- `3.2 Base Components` --references--> `Popover()`  [INFERRED]
  TODO.md → apps/web/components/ui/popover.tsx

## Import Cycles
- None detected.

## Communities (61 total, 8 thin omitted)

### Community 0 - "react"
Cohesion: 0.07
Nodes (66): AuditEntry, AuditTrailPage(), DisruptionsPage(), Incident, VehicleDetailContent(), VehicleDetailPage(), OrderItem, OrdersPage() (+58 more)

### Community 1 - "next"
Cohesion: 0.08
Nodes (4): GLOBAL_DISRUPTIONS_STORE, PlatformDisruption, nextConfig, next

### Community 2 - "schemas.ts"
Cohesion: 0.04
Nodes (47): BrokenReasonCode, BrokenReasonCodeSchema, ComparisonClass, ComparisonClassSchema, Coordinates, CoordinatesSchema, CreateOrder, CreateOrderSchema (+39 more)

### Community 3 - "web/package.json"
Cohesion: 0.05
Nodes (39): eslintConfig, dependencies, bcryptjs, @dispatchx/contracts, lucide-react, next, react, react-dom (+31 more)

### Community 4 - "schema.ts"
Cohesion: 0.06
Nodes (31): comparisonClassEnum, customerNotifications, customers, deliveryChangeRecords, deliveryEvents, deliveryStatusEnum, fleetBriefings, generatedAudio (+23 more)

### Community 5 - "header.tsx"
Cohesion: 0.10
Nodes (20): inter, jetbrainsMono, metadata, RootLayout(), Header(), HeaderProps, Theme, ThemeContext (+12 more)

### Community 6 - "package.json"
Cohesion: 0.10
Nodes (20): description, devDependencies, prettier, typescript, vitest, engines, node, npm (+12 more)

### Community 7 - "plan-parser.ts"
Cohesion: 0.17
Nodes (12): CreateOrderSchema, inMemoryOrders, OrderRecord, POST(), FLEET_MAX_VOLUME_M3, FLEET_MAX_WEIGHT_KG, FORMULA_INJECTION_CHARS, hasFormulaInjection() (+4 more)

### Community 8 - "database/package.json"
Cohesion: 0.10
Nodes (18): dependencies, drizzle-orm, postgres, devDependencies, drizzle-kit, typescript, typescript, main (+10 more)

### Community 9 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 10 - "fleet/route.ts"
Cohesion: 0.24
Nodes (5): db, sql, vehicles, drizzle-orm, postgres

### Community 11 - "fleet/page.tsx"
Cohesion: 0.14
Nodes (16): FleetOverviewPage(), FleetStatusCard(), FleetVehicle, Input, InputProps, SearchInput(), SearchInputProps, Textarea (+8 more)

### Community 12 - "contracts/package.json"
Cohesion: 0.14
Nodes (13): dependencies, zod, devDependencies, typescript, typescript, main, name, private (+5 more)

### Community 13 - "compilerOptions"
Cohesion: 0.18
Nodes (10): compilerOptions, declaration, esModuleInterop, forceConsistentCasingInFileNames, module, moduleResolution, skipLibCheck, strict (+2 more)

### Community 14 - "compilerOptions"
Cohesion: 0.18
Nodes (10): compilerOptions, declaration, esModuleInterop, forceConsistentCasingInFileNames, module, moduleResolution, skipLibCheck, strict (+2 more)

### Community 15 - "login/route.ts"
Cohesion: 0.31
Nodes (6): LoginRequestSchema, POST(), recordAuditEvent(), AttemptRecord, checkLoginRateLimit(), loginAttempts

### Community 16 - "Control Room Dashboard Cockpit"
Cohesion: 0.40
Nodes (6): Design System & UI Tokens, Control Room Dashboard Cockpit, Product Requirements Document (PRD), Excel & CSV Plan Ingestion Engine, Technical Requirements Document (TRD), Valhalla Routing & Distance Matrix

### Community 17 - "selection-controls.tsx"
Cohesion: 0.25
Nodes (7): Checkbox, CheckboxProps, RadioGroup(), RadioGroupProps, RadioOption, Toggle(), ToggleProps

### Community 18 - "DispatchX (ReRoute / VORTEXA 3.0) — Project TODO"
Cohesion: 0.12
Nodes (15): DispatchX (ReRoute / VORTEXA 3.0) — Project TODO, Phase 10 — Atomic Route Activation (Tasks 234–241), Phase 11 — Dashboard (Tasks 242–248), Phase 12 — Plan Schedule View (Tasks 249–254), Phase 14 — Audit & History (Tasks 273–276), Phase 15 — Error & Edge-Case States (Tasks 277–287), Phase 16 — Accessibility (Tasks 288–296), Phase 17 — Observability (Tasks 297–303) (+7 more)

### Community 19 - "models.py"
Cohesion: 0.10
Nodes (16): health_check(), optimize(), MetricEstimates, ObjectiveWeights, OptimizationRequest, OptimizationResponse, OrderInput, PriorityEnum (+8 more)

### Community 20 - "skeleton.tsx"
Cohesion: 0.67
Nodes (3): Skeleton(), SkeletonProps, TableSkeletonRows()

### Community 21 - "mock-data.ts"
Cohesion: 0.06
Nodes (36): POST(), POST(), planLockVersions, jobQueue, POST(), POST(), POST(), Disruption (+28 more)

### Community 24 - "⚡ DispatchX (VORTEXA 3.0 / ReRoute)"
Cohesion: 0.17
Nodes (11): Autonomous, Human-in-the-Loop Dynamic Logistics Dispatch & Disruption Recovery, ⚡ DispatchX (VORTEXA 3.0 / ReRoute), 📌 Executive Summary, 🏃 Getting Started, Installation & Development Run, 🚀 Key Web Application Pages, 📄 License, Prerequisites (+3 more)

### Community 25 - "users.ts"
Cohesion: 0.39
Nodes (6): hashPassword(), verifyPassword(), authenticateCredentials(), DEMO_USERS, findUserByEmail(), bcryptjs

### Community 26 - "D. Mermaid Flowcharts"
Cohesion: 0.17
Nodes (12): D1. Authentication and Onboarding, D2. Primary Operational Workflow, D3. Incident Lifecycle State Machine, D4. Optimization Job State Machine, D4b. Proposal, Approval, Application, and Notification State Machines, D4c. Per-Edge Guards and Invalid Transitions (D4, D4b, notification machine), D5. Exception and Network Recovery, D6. State Synchronization (+4 more)

### Community 27 - "auth.test.ts"
Cohesion: 0.27
Nodes (8): hasPermission(), hasRequiredRole(), Permission, ROLE_HIERARCHY, ROLE_PERMISSIONS, SessionData, UserRecord, MemberRole

### Community 28 - "E. Screen-by-Screen Interaction Matrix"
Cohesion: 0.20
Nodes (10): E.1 Global, Auth, and Shell, E.2 Dashboard (R-04), E.3 Fleet and Vehicle (R-06, R-07), E.4 Plans and Routes (R-08, R-09, R-10), E.5 Incident Reporting (R-12) — Form and Voice, E.6 Incident List and Detail (R-11, R-13), E.7 Proposal Review and Approval (R-14), E.8 Communications (R-15) (+2 more)

### Community 29 - "session.ts"
Cohesion: 0.32
Nodes (8): POST(), GET(), clearSession(), createSession(), getSession(), sessions, signToken(), verifyToken()

### Community 30 - "src/env.ts"
Cohesion: 0.25
Nodes (5): env, ClientEnv, ClientEnvSchema, ServerEnv, ServerEnvSchema

### Community 31 - "Appflow.md"
Cohesion: 0.22
Nodes (8): K. Accessibility and Responsive Behavior, M. QA Acceptance Criteria, N. Traceability Matrix, O. Consistency and Completeness Audit, P. Repository Verification Checklist, ReRoute — Appflow.md, Status Legend, Table of Contents

### Community 32 - "A. Document Control and Product Boundaries"
Cohesion: 0.22
Nodes (9): A.1 Purpose and Audience, A.2 Scope and Non-Goals, A.3 Terminology and Domain Entities, A.4 Lifecycle Separations (normative), A.5 Existing Implementation vs Proposed Behavior, A.6 Actors and Permissions, A.7 System Boundaries and External Integrations, A.8 Core Invariants (must never be violated) (+1 more)

### Community 33 - "zod"
Cohesion: 0.17
Nodes (5): PositionUpdateSchema, UpdateOrderSchema, CreatePlanRequestSchema, demoPlans, zod

### Community 34 - "J. Core Logistics Domain Invariants"
Cohesion: 0.25
Nodes (8): J.1 Completed Deliveries, J.2 Vehicle Capacity, J.3 Customer Delivery Windows, J.4 Human Approval, J.5 Dynamic Replanning and Concurrent Incidents, J.6 Voice and Notifications, J.7 Performance Target (Not a Guarantee), J. Core Logistics Domain Invariants

### Community 36 - "📊 DispatchX — Implementation Status & Progress Tracker"
Cohesion: 0.40
Nodes (4): 📊 DispatchX — Implementation Status & Progress Tracker, 🏆 Key Architectural Milestones Delivered, 📈 Overall Progress Snapshot, 📑 Phase-by-Phase Breakdown

### Community 37 - "C. Global Application Shell and Navigation"
Cohesion: 0.33
Nodes (6): C.1 Shell Components, C.2 Navigation Matrix (valid outgoing destinations), C.3 State Retention Across Navigation, C.4 Keyboard and Focus, C.5 Navigation During Special States, C. Global Application Shell and Navigation

### Community 38 - "B. Sitemap and Route Topology"
Cohesion: 0.40
Nodes (5): B.1 URL Tree, B.2 Common Route Attributes, B.3 Route Table, B.4 Route Behavior Rules, B. Sitemap and Route Topology

### Community 39 - "I. Network, Retry, and Re-authentication Protocols"
Cohesion: 0.40
Nodes (5): I.1 Standard Behavior Table, I.2 Backoff Policy (Proposed), I.3 Ambiguous Timeout After Approve/Apply, I.4 Re-authentication Protocol, I. Network, Retry, and Re-authentication Protocols

### Community 41 - "Q. Unresolved Decisions and Assumptions"
Cohesion: 0.50
Nodes (4): Assumptions Made (due to no repository), Contradictions Between Requirements and Existing Code, Open Decisions, Q. Unresolved Decisions and Assumptions

### Community 42 - "F. Modal, Drawer, Popover, and Toast Registry"
Cohesion: 0.50
Nodes (4): F.1 Overlay Catalog, F.2 Overlay Behavior Standards, F.3 Toast Registry (non-critical feedback only), F. Modal, Drawer, Popover, and Toast Registry

### Community 43 - "G. Frontend State Model and Ownership"
Cohesion: 0.50
Nodes (4): G.1 State Ownership Matrix, G.2 Identifier Relationships, G.3 Required Invariants (client + server), G. Frontend State Model and Ownership

### Community 44 - "H. Optimistic UI Protocols and Rollback"
Cohesion: 0.50
Nodes (4): H.1 Policy Table, H.2 Mandatory Sequence for Every Provisional Mutation, H.3 Why Whole-Cache Rollback Is Unsafe, H. Optimistic UI Protocols and Rollback

### Community 45 - "L. Observability and Analytics"
Cohesion: 0.50
Nodes (4): L.1 Events, L.2 Rules, L.3 Operational Measures, L. Observability and Analytics

### Community 46 - "web/README.md"
Cohesion: 0.50
Nodes (3): Deploy on Vercel, Getting Started, Learn More

### Community 51 - "Phase 1 — Project Foundation & Infrastructure (Tasks 1–65)"
Cohesion: 0.33
Nodes (6): 1.1 Repository & Tooling Setup, 1.2 Docker & Dev Environment, 1.3 Database Foundation, 1.4 Row-Level Security, 1.5 Seed Data, Phase 1 — Project Foundation & Infrastructure (Tasks 1–65)

### Community 52 - "Phase 19 — Testing (Tasks 311–338)"
Cohesion: 0.40
Nodes (5): 19.1 Unit Tests, 19.2 Integration Tests, 19.3 E2E Tests (Playwright), 19.4 Performance Benchmarks, Phase 19 — Testing (Tasks 311–338)

### Community 53 - "Phase 6 — Optimization Engine (Tasks 136–169)"
Cohesion: 0.40
Nodes (5): 6.1 FastAPI Worker, 6.2 OR-Tools Solver, 6.3 Post-Solve & Results, 6.4 Job Queue & API, Phase 6 — Optimization Engine (Tasks 136–169)

### Community 54 - "Phase 13 — Notifications & Briefings (Tasks 255–272)"
Cohesion: 0.50
Nodes (4): 13.1 Customer Voice Updates, 13.2 Fleet Briefing, 13.3 Communications, Phase 13 — Notifications & Briefings (Tasks 255–272)

### Community 55 - "Phase 8 — Incident Reporting & Validation (Tasks 179–209)"
Cohesion: 0.50
Nodes (4): 8.1 Text Incidents, 8.2 Voice Incidents, 8.3 Incident Confirmation & Approval, Phase 8 — Incident Reporting & Validation (Tasks 179–209)

### Community 56 - "Phase 9 — Dynamic Re-optimization (Tasks 210–233)"
Cohesion: 0.50
Nodes (4): 9.1 Replan Engine, 9.2 Versioning & Comparison, 9.3 Replan UI, Phase 9 — Dynamic Re-optimization (Tasks 210–233)

### Community 57 - "Phase 3 — Design System & UI Foundation (Tasks 76–104)"
Cohesion: 0.67
Nodes (3): 3.1 Design Tokens, 3.3 Application Shell, Phase 3 — Design System & UI Foundation (Tasks 76–104)

### Community 58 - "UI Reference — Design Inspiration"
Cohesion: 0.67
Nodes (3): Dashboard Reference, Plan Schedule Reference, UI Reference — Design Inspiration

### Community 59 - "uuid.ts"
Cohesion: 0.24
Nodes (5): RFC-9562, DEMO_IDS, DEMO_LOCATIONS, generateUuidV7, uuidv7()

### Community 60 - "metrics.ts"
Cohesion: 0.39
Nodes (5): GET(), getTelemetrySpans(), recordSpan(), spanBuffer, TelemetrySpan

## Knowledge Gaps
- **17 isolated node(s):** `@dispatchx/contracts`, `react-dom`, `@tailwindcss/turbopack`, `@types/bcryptjs`, `@types/node` (+12 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 483 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `react`, `zod`, `web/package.json`, `header.tsx`, `plan-parser.ts`, `drivers/route.ts`, `fleet/route.ts`, `fleet/page.tsx`, `login/route.ts`, `mock-data.ts`, `metrics.ts`, `session.ts`?**
  _High betweenness centrality (0.327) - this node is a cross-community bridge._
- **What connects `@dispatchx/contracts`, `react-dom`, `@tailwindcss/turbopack` to the rest of the system?**
  _17 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `react` be split into smaller, more focused modules?**
  _Cohesion score 0.06825619448340346 - nodes in this community are weakly interconnected._
- **Why does `zod` connect `zod` to `schemas.ts`, `plan-parser.ts`, `contracts/package.json`, `login/route.ts`, `src/env.ts`?**
  _High betweenness centrality (0.086) - this node is a cross-community bridge._
- **Should `next` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._
- **Why does `DispatchX (ReRoute / VORTEXA 3.0) — Project TODO` connect `DispatchX (ReRoute / VORTEXA 3.0) — Project TODO` to `fleet/page.tsx`, `Phase 1 — Project Foundation & Infrastructure (Tasks 1–65)`, `Phase 19 — Testing (Tasks 311–338)`, `Phase 6 — Optimization Engine (Tasks 136–169)`, `Phase 13 — Notifications & Briefings (Tasks 255–272)`, `Phase 8 — Incident Reporting & Validation (Tasks 179–209)`, `Phase 9 — Dynamic Re-optimization (Tasks 210–233)`, `Phase 3 — Design System & UI Foundation (Tasks 76–104)`, `UI Reference — Design Inspiration`?**
  _High betweenness centrality (0.083) - this node is a cross-community bridge._
- **Should `schemas.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.041666666666666664 - nodes in this community are weakly interconnected._