# Graph Report - Vortexa Deployed  (2026-10-11)

## Corpus Check
- 146 files · ~116,122 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 9 file(s) not represented in the graph (top: (none) 3, .example 1, .ico 1)

## Summary
- 873 nodes · 1318 edges · 64 communities (46 shown, 18 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 27 edges (avg confidence: 0.94)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `6323f7b9`
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
- audit-logger.ts
- schemas.d.ts
- contracts/package.json
- compilerOptions
- compilerOptions
- Deployment Guide (Free Tier with Dynamic Git-Push Auto-Deploy)
- Control Room Dashboard Cockpit
- selection-controls.tsx
- DispatchX (ReRoute / VORTEXA 3.0) — Project TODO
- models.py
- skeleton.tsx
- mock-data.ts
- dispatchx-optimizer
- ⚡ DispatchX (VORTEXA 3.0 / ReRoute)
- fleet-map.tsx
- D. Mermaid Flowcharts
- valhalla.ts
- E. Screen-by-Screen Interaction Matrix
- disruptions/route.ts
- src/env.ts
- Appflow.md
- A. Document Control and Product Boundaries
- zod
- J. Core Logistics Domain Invariants
- drizzle-orm
- 📊 DispatchX — Implementation Status & Progress Tracker
- C. Global Application Shell and Navigation
- B. Sitemap and Route Topology
- I. Network, Retry, and Re-authentication Protocols
- uuid.js
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
- schema.js
- position/route.ts
- orders/[id]/route.ts
- env.js
- client.d.ts
- uuid.d.ts
- uuid.ts
- metrics.ts

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
- `4.1 Fleet & Vehicle` --references--> `FleetStatusCard()`  [INFERRED]
  TODO.md → apps/web/components/fleet/fleet-status-card.tsx
- `3.3 Application Shell` --references--> `AppShell()`  [INFERRED]
  TODO.md → apps/web/components/shell/app-shell.tsx
- `3.2 Base Components` --references--> `Toggle()`  [INFERRED]
  TODO.md → apps/web/components/ui/selection-controls.tsx
- `3.2 Base Components` --references--> `RadioGroup()`  [INFERRED]
  TODO.md → apps/web/components/ui/selection-controls.tsx
- `3.2 Base Components` --references--> `Popover()`  [INFERRED]
  TODO.md → apps/web/components/ui/popover.tsx

## Import Cycles
- None detected.

## Communities (64 total, 18 thin omitted)

### Community 0 - "react"
Cohesion: 0.06
Nodes (73): AuditEntry, AuditTrailPage(), DisruptionsPage(), Incident, VehicleDetailContent(), VehicleDetailPage(), FleetOverviewPage(), OrderItem (+65 more)

### Community 1 - "next"
Cohesion: 0.05
Nodes (32): LoginRequestSchema, POST(), POST(), GET(), DriverRecord, DRIVERS_STORE, recordAuditEvent(), hashPassword() (+24 more)

### Community 2 - "schemas.ts"
Cohesion: 0.04
Nodes (47): BrokenReasonCode, BrokenReasonCodeSchema, ComparisonClass, ComparisonClassSchema, Coordinates, CoordinatesSchema, CreateOrder, CreateOrderSchema (+39 more)

### Community 3 - "web/package.json"
Cohesion: 0.05
Nodes (41): eslintConfig, dependencies, bcryptjs, @dispatchx/contracts, @dispatchx/database, lucide-react, next, react (+33 more)

### Community 4 - "schema.ts"
Cohesion: 0.06
Nodes (33): comparisonClassEnum, deliveryStatusEnum, incidentStatusEnum, incidentTypeEnum, jobStatusEnum, memberRoleEnum, notificationStatusEnum, organizations (+25 more)

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

### Community 10 - "audit-logger.ts"
Cohesion: 0.18
Nodes (3): RecordAuditEventParams, db, sql

### Community 11 - "schemas.d.ts"
Cohesion: 0.08
Nodes (24): BrokenReasonCode, ComparisonClass, Coordinates, CreateOrder, CustomerNotification, DeliveryStatus, FleetBriefing, GenerateAudioNotification (+16 more)

### Community 12 - "contracts/package.json"
Cohesion: 0.14
Nodes (13): dependencies, zod, devDependencies, typescript, typescript, main, name, private (+5 more)

### Community 13 - "compilerOptions"
Cohesion: 0.18
Nodes (10): compilerOptions, declaration, esModuleInterop, forceConsistentCasingInFileNames, module, moduleResolution, skipLibCheck, strict (+2 more)

### Community 14 - "compilerOptions"
Cohesion: 0.18
Nodes (10): compilerOptions, declaration, esModuleInterop, forceConsistentCasingInFileNames, module, moduleResolution, skipLibCheck, strict (+2 more)

### Community 15 - "Deployment Guide (Free Tier with Dynamic Git-Push Auto-Deploy)"
Cohesion: 0.25
Nodes (7): 1. Database (Free Serverless PostgreSQL + PostGIS), 2. Backend Engine (FastAPI + OR-Tools Optimizer), 3. Frontend Cockpit (Next.js 16 Web Application), 4. Continuous Integration & Dynamic Updates, Deployment Guide (Free Tier with Dynamic Git-Push Auto-Deploy), Option A: Using Render Blueprint (Automatic), Option B: Manual Web Service Setup

### Community 16 - "Control Room Dashboard Cockpit"
Cohesion: 0.40
Nodes (6): Design System & UI Tokens, Control Room Dashboard Cockpit, Product Requirements Document (PRD), Excel & CSV Plan Ingestion Engine, Technical Requirements Document (TRD), Valhalla Routing & Distance Matrix

### Community 17 - "selection-controls.tsx"
Cohesion: 0.25
Nodes (7): Checkbox, CheckboxProps, RadioGroup(), RadioGroupProps, RadioOption, Toggle(), ToggleProps

### Community 18 - "DispatchX (ReRoute / VORTEXA 3.0) — Project TODO"
Cohesion: 0.04
Nodes (47): 13.1 Customer Voice Updates, 13.2 Fleet Briefing, 13.3 Communications, 19.1 Unit Tests, 19.2 Integration Tests, 19.3 E2E Tests (Playwright), 19.4 Performance Benchmarks, 3.1 Design Tokens (+39 more)

### Community 19 - "models.py"
Cohesion: 0.10
Nodes (16): health_check(), optimize(), MetricEstimates, ObjectiveWeights, OptimizationRequest, OptimizationResponse, OrderInput, PriorityEnum (+8 more)

### Community 20 - "skeleton.tsx"
Cohesion: 0.67
Nodes (3): Skeleton(), SkeletonProps, TableSkeletonRows()

### Community 21 - "mock-data.ts"
Cohesion: 0.07
Nodes (31): POST(), POST(), planLockVersions, jobQueue, POST(), POST(), POST(), Disruption (+23 more)

### Community 24 - "⚡ DispatchX (VORTEXA 3.0 / ReRoute)"
Cohesion: 0.17
Nodes (11): Autonomous, Human-in-the-Loop Dynamic Logistics Dispatch & Disruption Recovery, ⚡ DispatchX (VORTEXA 3.0 / ReRoute), 📌 Executive Summary, 🏃 Getting Started, Installation & Development Run, 🚀 Key Web Application Pages, 📄 License, Prerequisites (+3 more)

### Community 25 - "fleet-map.tsx"
Cohesion: 0.29
Nodes (5): DEFAULT_MARKERS, DEFAULT_ROUTES, FleetMapProps, MapMarker, RouteLine

### Community 26 - "D. Mermaid Flowcharts"
Cohesion: 0.17
Nodes (12): D1. Authentication and Onboarding, D2. Primary Operational Workflow, D3. Incident Lifecycle State Machine, D4. Optimization Job State Machine, D4b. Proposal, Approval, Application, and Notification State Machines, D4c. Per-Edge Guards and Invalid Transitions (D4, D4b, notification machine), D5. Exception and Network Recovery, D6. State Synchronization (+4 more)

### Community 27 - "valhalla.ts"
Cohesion: 0.38
Nodes (5): DEMO_FALLBACK_MATRIX, fetchTravelTimeMatrix(), LatLng, MatrixResponse, RouteGeometry

### Community 28 - "E. Screen-by-Screen Interaction Matrix"
Cohesion: 0.20
Nodes (10): E.1 Global, Auth, and Shell, E.2 Dashboard (R-04), E.3 Fleet and Vehicle (R-06, R-07), E.4 Plans and Routes (R-08, R-09, R-10), E.5 Incident Reporting (R-12) — Form and Voice, E.6 Incident List and Detail (R-11, R-13), E.7 Proposal Review and Approval (R-14), E.8 Communications (R-15) (+2 more)

### Community 30 - "src/env.ts"
Cohesion: 0.22
Nodes (5): env, ClientEnv, ClientEnvSchema, ServerEnv, ServerEnvSchema

### Community 31 - "Appflow.md"
Cohesion: 0.22
Nodes (8): K. Accessibility and Responsive Behavior, M. QA Acceptance Criteria, N. Traceability Matrix, O. Consistency and Completeness Audit, P. Repository Verification Checklist, ReRoute — Appflow.md, Status Legend, Table of Contents

### Community 32 - "A. Document Control and Product Boundaries"
Cohesion: 0.22
Nodes (9): A.1 Purpose and Audience, A.2 Scope and Non-Goals, A.3 Terminology and Domain Entities, A.4 Lifecycle Separations (normative), A.5 Existing Implementation vs Proposed Behavior, A.6 Actors and Permissions, A.7 System Boundaries and External Integrations, A.8 Core Invariants (must never be violated) (+1 more)

### Community 33 - "zod"
Cohesion: 0.18
Nodes (6): CreatePlanRequestSchema, demoPlans, ClientEnv, ServerEnv, zod_1, zod

### Community 34 - "J. Core Logistics Domain Invariants"
Cohesion: 0.25
Nodes (8): J.1 Completed Deliveries, J.2 Vehicle Capacity, J.3 Customer Delivery Windows, J.4 Human Approval, J.5 Dynamic Replanning and Concurrent Incidents, J.6 Voice and Notifications, J.7 Performance Target (Not a Guarantee), J. Core Logistics Domain Invariants

### Community 35 - "drizzle-orm"
Cohesion: 0.40
Nodes (4): postgres_1, postgres_js_1, schema, drizzle-orm

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

### Community 51 - "schema.js"
Cohesion: 0.08
Nodes (13): customers(), incidents(), locations(), memberships(), orders(), vehicles(), pg_core_1, 1.1 Repository & Tooling Setup (+5 more)

### Community 59 - "uuid.ts"
Cohesion: 0.24
Nodes (5): DEMO_IDS, DEMO_LOCATIONS, generateUuidV7, RFC-9562, uuidv7()

### Community 60 - "metrics.ts"
Cohesion: 0.39
Nodes (5): GET(), getTelemetrySpans(), recordSpan(), spanBuffer, TelemetrySpan

## Knowledge Gaps
- **20 isolated node(s):** `@dispatchx/contracts`, `@dispatchx/database`, `react-dom`, `@tailwindcss/turbopack`, `@types/bcryptjs` (+15 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 557 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **18 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `react`, `zod`, `web/package.json`, `header.tsx`, `plan-parser.ts`, `audit-logger.ts`, `position/route.ts`, `mock-data.ts`, `orders/[id]/route.ts`, `metrics.ts`, `disruptions/route.ts`?**
  _High betweenness centrality (0.329) - this node is a cross-community bridge._
- **What connects `@dispatchx/contracts`, `@dispatchx/database`, `react-dom` to the rest of the system?**
  _20 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `react` be split into smaller, more focused modules?**
  _Cohesion score 0.06309454474859251 - nodes in this community are weakly interconnected._
- **Why does `zod` connect `zod` to `next`, `schemas.ts`, `plan-parser.ts`, `schemas.d.ts`, `contracts/package.json`, `position/route.ts`, `orders/[id]/route.ts`, `env.js`, `src/env.ts`?**
  _High betweenness centrality (0.129) - this node is a cross-community bridge._
- **Should `next` be split into smaller, more focused modules?**
  _Cohesion score 0.051587301587301584 - nodes in this community are weakly interconnected._
- **Why does `drizzle-orm` connect `drizzle-orm` to `database/package.json`, `audit-logger.ts`, `schema.js`, `schema.ts`?**
  _High betweenness centrality (0.098) - this node is a cross-community bridge._
- **Should `schemas.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.041666666666666664 - nodes in this community are weakly interconnected._