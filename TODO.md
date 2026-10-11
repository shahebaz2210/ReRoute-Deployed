# DispatchX (ReRoute / VORTEXA 3.0) — Project TODO

> **Generated from:** PRD.md, Design.md, TRD.md, Appflow.md  
> **UI Reference:** DispatchX Dashboard & Plan Schedule mockups (see bottom of file)  
> **Status:** `[ ]` = Not started · `[~]` = In progress · `[x]` = Done  
> **Rule:** Each task is atomic — complete one before starting the next. No overlapping dependencies.

---

## Phase 1 — Project Foundation & Infrastructure (Tasks 1–65)

### 1.1 Repository & Tooling Setup

| # | Task | Source | Status |
|---|---|---|---|
| 1 | Initialize monorepo root with `package.json`, `.gitignore`, `.editorconfig`, `README.md` | TRD §4 | `[x]` |
| 2 | Create directory scaffold: `apps/web/`, `services/optimizer/`, `packages/contracts/`, `packages/database/`, `infra/docker/`, `infra/migrations/` | TRD §4 | `[x]` |
| 3 | Initialize `apps/web/` as Next.js 15 App Router project with TypeScript 5.x strict mode | TRD §3 | `[x]` |
| 4 | Install and configure Tailwind CSS v4 in `apps/web/` | TRD §3, Design §14 | `[x]` |
| 5 | Install `lucide-react` icon library | Design §2.1 | `[x]` |
| 6 | Add Google Fonts (Inter 400/500/600, JetBrains Mono 500/600) to layout | Design §6 | `[x]` |
| 7 | Initialize `services/optimizer/` as Python 3.12 project with `pyproject.toml`, FastAPI, Pydantic, OR-Tools | TRD §3, §10 | `[x]` |
| 8 | Create `packages/contracts/` with shared Zod schemas for request/response types | TRD §3, §12.1 | `[x]` |
| 9 | Create `.env.example` documenting all required environment variables (including `ELEVENLABS_API_KEY`, ElevenLabs voice IDs, DB, Valhalla) | TRD §14 | `[x]` |
| 10 | Create Zod validation schemas for server-side env config (including ElevenLabs credentials) | TRD §14.3 | `[x]` |
| 11 | Create Zod validation schemas for client-side env config | TRD §14.3 | `[x]` |
| 12 | Pin all dependency versions and commit lockfiles | TRD STK-1 | `[x]` |

### 1.2 Docker & Dev Environment

| # | Task | Source | Status |
|---|---|---|---|
| 13 | Write `docker-compose.yml`: Next.js app, PostgreSQL 16 + PostGIS, Python optimizer worker | TRD §21.1 | `[x]` |
| 14 | Add Valhalla service to docker-compose with bounded geographic extract | TRD §21.1 | `[x]` |
| 15 | Add optional Photon geocoder service | TRD §21.1 | `[x]` |
| 16 | Add optional MinIO (object storage) service | TRD §21.1 | `[x]` |
| 17 | Verify `docker compose up` brings up all services | NFR-OBS-05 | `[x]` |

### 1.3 Database Foundation

| # | Task | Source | Status |
|---|---|---|---|
| 18 | Configure Drizzle ORM in `packages/database/` | TRD §3 | `[x]` |
| 19 | Migration 001: enable PostGIS extension | TRD §5.5 | `[x]` |
| 20 | Migration 002: define all PostgreSQL enums (member_role, vehicle_status, delivery_status, incident_type, incident_status, plan_status, job_status, comparison_class, notification_status) | TRD §5.3 | `[x]` |
| 21 | Implement UUIDv7 generation function (application-side) | TRD DB-1 | `[x]` |
| 22 | Migration 003: `organizations` table | TRD §5.2 #1 | `[x]` |
| 23 | Migration 004: `memberships` table (user ↔ org ↔ role) | TRD §5.2 #2 | `[x]` |
| 24 | Migration 005: `locations` table with PostGIS point, GiST index | TRD §5.2 #3 | `[x]` |
| 25 | Migration 006: `vehicles` table with CHECK constraints | TRD §5.2 #4 | `[x]` |
| 26 | Migration 007: `customers` table | TRD §5.2 #5 | `[x]` |
| 27 | Migration 008: `orders` table with CHECK constraints (weight>0, window_start<window_end) | TRD §5.2 #6 | `[x]` |
| 28 | Migration 009: `route_plans` table (versioned, status) | TRD §5.2 #7 | `[x]` |
| 29 | Migration 010: `route_stops` table with unique constraints | TRD §5.2 #8 | `[x]` |
| 30 | Migration 011: `delivery_events` table (append-only) | TRD §5.2 #9 | `[x]` |
| 31 | Migration 012: `incidents` table | TRD §5.2 #10 | `[x]` |
| 32 | Migration 013: `optimization_jobs` table | TRD §5.2 #11 | `[x]` |
| 33 | Migration 014: `plan_diffs` table (KEPT/MOVED/BROKEN) | TRD §5.2 #12 | `[x]` |
| 34 | Migration 015: `customer_notifications` table | TRD §5.2 #13 | `[x]` |
| 35 | Migration 016: `fleet_briefings` table | TRD §5.2 #14 | `[x]` |
| 36 | Migration 017: `audit_events` table (append-only) | TRD §5.2 #15 | `[x]` |
| 37 | Migration 018: `idempotency_records` table | TRD §5.2 #16 | `[x]` |
| 38 | Migration 019: `vehicle_positions` table | PRD §5.1 | `[x]` |
| 39 | Migration 020: `incident_approvals` table | PRD §5.1 | `[x]` |
| 40 | Migration 021: `plan_versions` table | PRD §5.1 | `[x]` |
| 41 | Migration 022: `optimization_metrics` table | PRD §5.1 | `[x]` |
| 42 | Migration 023: `delivery_change_records` table | PRD §5.1 | `[x]` |
| 43 | Migration 024: `generated_audio` table | PRD §5.1 | `[x]` |
| 44 | Migration 025: road network tables — `location_nodes` + `road_edges` | PRD §5.1 | `[x]` |
| 45 | Add all foreign key constraints across tables | TRD DB-6 | `[x]` |
| 46 | Add tenant-scoped composite foreign keys | TRD §5.5 | `[x]` |
| 47 | Add operational query indexes | TRD §5.5 | `[x]` |
| 48 | Add immutability triggers on `audit_events` and `delivery_events` | TRD §6.3 | `[x]` |
| 49 | Add state-transition enforcement triggers | TRD ST-4 | `[x]` |
| 50 | Verify all migrations apply cleanly | TRD Phase 1 | `[x]` |

### 1.4 Row-Level Security

| # | Task | Source | Status |
|---|---|---|---|
| 51 | Create non-owner DB role for runtime (no BYPASSRLS) | TRD RLS-3 | `[x]` |
| 52 | Create separate migration role | TRD RLS-4 | `[x]` |
| 53 | Enable and FORCE RLS on all tenant-scoped tables | TRD RLS-1 | `[x]` |
| 54 | Write SELECT/INSERT/UPDATE/DELETE RLS policies per entity per role | TRD RLS-2 | `[x]` |
| 55 | Implement transaction-local tenant/user context setting | TRD RLS-5 | `[x]` |
| 56 | Write RLS tests (including UUID-guessing cross-tenant attempts) | TRD RLS-6 | `[x]` |

### 1.5 Seed Data

| # | Task | Source | Status |
|---|---|---|---|
| 57 | Seed: demo organization, dispatcher user, manager user | PRD US-01 | `[x]` |
| 58 | Seed: demo depot + location nodes (landmarks, intersections) | PRD §5.1 | `[x]` |
| 59 | Seed: demo road edges with distances and travel times | PRD §9.3 | `[x]` |
| 60 | Seed: `DEMO-A` fixture (3 vehicles, 12 orders, all feasible) | PRD §10.1 | `[x]` |
| 61 | Seed: `DEMO-B` fixture (V2 breakdown, spare capacity) | PRD §10.1 | `[x]` |
| 62 | Seed: `DEMO-C` fixture (V2 breakdown, insufficient capacity) | PRD §10.1 | `[x]` |
| 63 | Seed: `DEMO-D` (road closure) and `DEMO-E` (urgent order) | PRD §10.1 | `[x]` |
| 64 | Make seed scripts idempotent | NFR-OBS-06 | `[x]` |
| 65 | Precompute travel-time matrix for demo road network | PRD §9.3 | `[x]` |

---

## Phase 2 — Authentication & Authorization (Tasks 66–75)

| # | Task | Source | Status |
|---|---|---|---|
| 66 | Implement `POST /api/v1/auth/login` endpoint | PRD US-01 | `[x]` |
| 67 | Implement session: HttpOnly, Secure, SameSite=Lax cookie; rotate session ID | PRD AC-01.1 | `[x]` |
| 68 | Implement idle expiry (30 min) and absolute expiry (8 h) | PRD AC-01.4 | `[x]` |
| 69 | Implement CSRF protection (`X-CSRF-Token` header on mutations) | PRD AC-01.5 | `[x]` |
| 70 | Implement rate limiting: 5 failures/15 min → 429 with Retry-After | PRD AC-01.3 | `[x]` |
| 71 | Implement generic "Invalid email or password" error | PRD AC-01.2 | `[x]` |
| 72 | Implement `POST /api/v1/auth/logout` | PRD E-02 | `[x]` |
| 73 | Implement RBAC middleware (DISPATCHER, MANAGER) | PRD §1.3 | `[x]` |
| 74 | Write audit events: AUTH_LOGIN_SUCCESS, AUTH_LOGIN_FAILURE | PRD AC-01.1 | `[x]` |
| 75 | Write auth tests: login, invalid creds, lockout, session expiry, CSRF | PRD AC-01 | `[x]` |

---

## Phase 3 — Design System & UI Foundation (Tasks 76–104)

### 3.1 Design Tokens

| # | Task | Source | Status |
|---|---|---|---|
| 76 | Create `globals.css` with all CSS custom properties (light mode) | Design §3, §13 | `[x]` |
| 77 | Add dark mode CSS custom properties under `.dark` | Design §4, §13 | `[x]` |
| 78 | Add typography CSS custom properties | Design §6, §13 | `[x]` |
| 79 | Configure Tailwind with custom tokens, fonts, spacing, radius, breakpoints | Design §7, §8, §14 | `[x]` |
| 80 | Implement dark mode toggle (light/dark/system) | Design §2.1 | `[x]` |

### 3.2 Base Components

| # | Task | Source | Status |
|---|---|---|---|
| 81 | Build `Button` (Primary/Secondary/Outline/Ghost/Danger/Icon; sm/default/lg/xl; all states) | Design §9.1 | `[x]` |
| 82 | Build `Input` (text, search with debounce, textarea; focus/error/disabled states) | Design §9.3 | `[x]` |
| 83 | Build `Select` (custom popover, native on mobile) | Design §9.3 | `[x]` |
| 84 | Build `Checkbox` and `RadioGroup` | Design §9.3 | `[x]` |
| 85 | Build `Toggle` (`role="switch"`, visible On/Off text) | Design §9.3 | `[x]` |
| 86 | Build `StatusBadge` (all 12 logistics statuses from Design §5) | Design §5 | `[x]` |
| 87 | Build `Alert` (success/warning/destructive/info variants) | Design §2.2 | `[x]` |
| 88 | Build `KPICard` (label, tabular-nums value, optional delta) | Design §9.4 | `[x]` |
| 89 | Build `Modal` / `Dialog` (focus trap, aria-modal, sm/md/lg sizes, Esc, focus restore) | Appflow §F.2 | `[x]` |
| 90 | Build `Drawer` (400px/480px; full-screen <640px; focus trap) | Appflow §F.2 | `[x]` |
| 91 | Build `Popover` (shadow-popover, trap-less, arrow nav) | Design §8.2 | `[x]` |
| 92 | Build `Toast` (max 3 visible, hover pauses timer, success/info/warning/error) | Appflow §F.3 | `[x]` |
| 93 | Build `Skeleton` loader (1.2s shimmer, disabled under reduced-motion) | Design §2.2 | `[x]` |
| 94 | Build `DataTable` (12px uppercase headers, 36px rows, sortable, sticky header) | Design §6, §9.4 | `[x]` |
| 95 | Build `Breadcrumb` component | Appflow §C.1 | `[x]` |
| 96 | Build empty state component (24px icon, heading, cause, optional action) | Design §2.2 | `[x]` |

### 3.3 Application Shell

| # | Task | Source | Status |
|---|---|---|---|
| 97 | Build `AppShell`: 56px header + collapsible 240px/64px sidebar + fluid content | Design §2.1, §7.3 | `[x]` |
| 98 | Build sidebar: Dashboard, Orders, Fleet, Route Optimization, Plan Schedule, Live Monitor, Disruptions (badge), Analytics, Settings | UI mockups | `[x]` |
| 99 | Implement `aria-current="page"` + active indicator on sidebar | Appflow §C.1 | `[x]` |
| 100 | Build header: logo, depot selector, date/shift, connection state, theme toggle, user menu | UI mockups | `[x]` |
| 101 | Implement mobile layout: sidebar → drawer below 768px | Appflow §C.1 | `[x]` |
| 102 | Implement skip link "Skip to main content" | NFR-A11Y-03 | `[x]` |
| 103 | Implement route-change focus management (focus to `<h1>`, update document.title) | Appflow §C.4 | `[x]` |
| 104 | Build connectivity banner (offline/online state) | Appflow OV-17 | `[x]` |


---

## Phase 4 — Core CRUD APIs (Tasks 105–123)

### 4.1 Fleet & Vehicle

| # | Task | Source | Status |
|---|---|---|---|
| 105 | `GET /api/v1/fleet` — list vehicles with pagination/filters | TRD §12 | `[x]` |
| 106 | `PATCH /api/v1/fleet/:id/position` — update vehicle position | TRD §12 | `[x]` |
| 107 | Build Fleet Overview page: vehicle list, status badges, capacity bars, search/sort | Appflow R-06 | `[x]` |
| 108 | Build Vehicle Detail page: capacity, route, position, stops | Appflow R-07 | `[x]` |
| 109 | Build `FleetStatusCard` component | Design §9.4 | `[x]` |

### 4.2 Orders

| # | Task | Source | Status |
|---|---|---|---|
| 110 | `GET /api/v1/orders` — list deliveries | TRD §12 | `[x]` |
| 111 | `POST /api/v1/orders` — create delivery with Zod validation | TRD §12 | `[x]` |
| 112 | `PATCH /api/v1/orders/:id` — update permitted fields | TRD §12 | `[x]` |
| 113 | Implement all validation rules (weight/volume>0, windows, unique ref, ORDER_EXCEEDS_ALL_VEHICLES) | PRD DM-01..07 | `[x]` |

### 4.3 Plan Creation

| # | Task | Source | Status |
|---|---|---|---|
| 114 | `POST /api/v1/plans` — create plan from orders + vehicles | PRD US-02 | `[x]` |
| 115 | Implement CSV upload: parse, validate, reject on error | PRD US-03 | `[x]` |
| 116 | CSV hardening: reject >2MB, formula injection chars | PRD AC-03.3 | `[x]` |
| 117 | `GET /api/v1/plans/{id}` — full plan with active version | PRD E-04 | `[x]` |
| 118 | `GET /api/v1/plans` — paginated plan list | PRD E-22 | `[x]` |
| 119 | `GET /api/v1/plans/{id}/versions/{n}` — specific version | PRD E-14 | `[x]` |
| 120 | Build Create Delivery Plan page: form, CSV upload, sample loader | PRD Screen 2 | `[x]` |
| 121 | Build Planning Data Review page: parsed rows, warnings, "Generate plan" button | PRD Screen 3 | `[x]` |
| 122 | Per-row error display with code, row#, field, message | PRD US-03 | `[x]` |
| 123 | Validation summary with focus management | PRD US-03 | `[x]` |

---

## Phase 5 — Map & Routing Integration (Tasks 124–135)

| # | Task | Source | Status |
|---|---|---|---|
| 124 | Install and configure MapLibre GL JS | TRD §9.1 | `[x]` |
| 125 | Set up OpenStreetMap tiles with permanent visible attribution | TRD OSM-1 | `[x]` |
| 126 | Render vehicle markers (28px circles, fill by state) | Design §9.4 | `[x]` |
| 127 | Render delivery stop markers (24px numbered circles by state) | Design §9.4 | `[x]` |
| 128 | Render route lines: committed (solid), proposed (dashed), completed (thin) | Design §5 | `[x]` |
| 129 | Render blocked roads (destructive with X marker) | Design §5 | `[x]` |
| 130 | Render incident locations on map | TRD §9.1 | `[x]` |
| 131 | Build map controls: zoom, recenter, legend | Design §8.2 | `[x]` |
| 132 | Implement Valhalla routing adapter: route geometry, travel-time matrices | TRD §9.3 | `[x]` |
| 133 | Implement matrix validation (ordering, missing results, unreachable) | TRD VAL-2 | `[x]` |
| 134 | Implement fallback to precomputed demo matrix with "offline" label | PRD AC-19.4 | `[x]` |
| 135 | Implement Photon geocoder adapter (optional) | TRD §9.4 | `[x]` |

---

## Phase 6 — Optimization Engine (Tasks 136–169)

### 6.1 FastAPI Worker

| # | Task | Source | Status |
|---|---|---|---|
| 136 | Create FastAPI app with health/ready endpoints | TRD §10.1 | `[x]` |
| 137 | Implement shared-secret auth between web app and worker | TRD SEC-13 | `[x]` |
| 138 | Implement Pydantic input models (snapshot: plan, vehicles, orders, matrices, weights) | TRD §10.1 | `[x]` |
| 139 | Implement Pydantic output models (assignments, ETAs, metrics, unassigned) | TRD §10.1 | `[x]` |

### 6.2 OR-Tools Solver

| # | Task | Source | Status |
|---|---|---|---|
| 140 | Build OR-Tools VRPTW model: nodes per order + start/end per vehicle | PRD §6.5 | `[x]` |
| 141 | Implement weight capacity dimension (OPT-H01) | PRD §6.2 | `[x]` |
| 142 | Implement volume capacity dimension (OPT-H02) | PRD §6.2 | `[x]` |
| 143 | Implement time dimension with windows, waiting times (OPT-H04) | PRD §6.2 | `[x]` |
| 144 | Implement vehicle availability constraints (OPT-H03) | PRD §6.2 | `[x]` |
| 145 | Implement service duration per stop and ETA computation | PRD FR-007 | `[x]` |
| 146 | Implement return-to-depot constraint (OPT-H11) | PRD §6.2 | `[x]` |
| 147 | Implement tier-1 objective: disjunction penalty per order by priority | PRD §6.3 | `[x]` |
| 148 | Implement tier-2 disruption penalty (replan only) | PRD §6.3 | `[x]` |
| 149 | Implement tier-3 operating cost objective with configurable weights | PRD §6.3 | `[x]` |
| 150 | Implement integer scaling (seconds, meters, kg×100, m³×1000) | PRD §6.3 | `[x]` |
| 151 | Configure solver: PATH_CHEAPEST_ARC, GUIDED_LOCAL_SEARCH, fixed seed, time limit | PRD §6.5 | `[x]` |
| 152 | Implement deterministic input ordering (sort by ID) | PRD §6.5 | `[x]` |
| 153 | Compute and store `input_hash` for reproducibility | PRD §6.5 | `[x]` |

### 6.3 Post-Solve & Results

| # | Task | Source | Status |
|---|---|---|---|
| 154 | Implement post-solve validator: re-check OPT-H01–H11 on candidate | PRD §6.2 | `[x]` |
| 155 | Implement pre-solve feasibility screen (per-order capacity, window, reachability) | PRD §6.2 | `[x]` |
| 156 | Implement reason codes for unassigned orders with numeric evidence | PRD US-15 | `[x]` |
| 157 | Implement metrics: distance, duration, fuel est, cost est, CO2 est, utilization | PRD §5.1 | `[x]` |
| 158 | Implement fuel/cost model | PRD §6.3 | `[x]` |
| 159 | Label all fuel/cost/CO2 as "estimates" | PRD FR-020 | `[x]` |

### 6.4 Job Queue & API

| # | Task | Source | Status |
|---|---|---|---|
| 160 | Implement PostgreSQL job queue (SELECT FOR UPDATE SKIP LOCKED) | TRD §7.1 | `[x]` |
| 161 | `POST /api/v1/plans/{id}/optimize` → 202 with job_id | PRD E-05 | `[x]` |
| 162 | `GET /api/v1/jobs/{jobId}` — job status | PRD E-06 | `[x]` |
| 163 | `POST /api/v1/jobs/{jobId}/cancel` | PRD E-07 | `[x]` |
| 164 | Implement job status transitions (QUEUED→RUNNING→SUCCEEDED etc.) | PRD §5.1 | `[x]` |
| 165 | Implement 409 JOB_IN_PROGRESS guard | PRD AC-04.3 | `[x]` |
| 166 | Implement single-concurrency-per-plan job queue | PRD AC-20.3 | `[x]` |
| 167 | Implement timeout: return incumbent if found, else TIMED_OUT | PRD AC-19.1/2 | `[x]` |
| 168 | On crash: FAILED, return incident to PENDING_CONFIRMATION | PRD AC-19.3 | `[x]` |
| 169 | On success: create plan_version, store routes/stops/metrics | PRD US-04 | `[x]` |

---

## Phase 7 — Plan View & Results UI (Tasks 170–178)

| # | Task | Source | Status |
|---|---|---|---|
| 170 | Build Optimization Results page: metrics, per-vehicle routes, unassigned list | PRD Screen 4 | `[x]` |
| 171 | Build optimization progress states (queued→solving→done) with aria-live | PRD US-04 | `[x]` |
| 172 | Build infeasible/timed-out/failed panels with reasons and retry | PRD US-19 | `[x]` |
| 173 | Build Active Fleet & Delivery Plan page | PRD Screen 5 | `[x]` |
| 174 | Build fleet table: Vehicle ID, Driver, Status, Load Util, Stops, Next Dest, ETA, SLA, Actions | UI mockups | `[x]` |
| 175 | Build KPI summary strip (5 KPIs from mockup) | UI mockups | `[x]` |
| 176 | Build per-vehicle route table (sequence, ETA, wait, service, window, load) | PRD US-05 | `[x]` |
| 177 | Implement Manager read-only view (no write controls) | PRD AC-05.2 | `[x]` |
| 178 | Build plan list page | Appflow R-08 | `[x]` |

---

## Phase 8 — Incident Reporting & Validation (Tasks 179–209)

### 8.1 Text Incidents

| # | Task | Source | Status |
|---|---|---|---|
| 179 | `POST /api/v1/plans/{id}/incidents` with Idempotency-Key | PRD US-06 | `[x]` |
| 180 | Implement LLM extraction adapter (text → structured JSON) | PRD §9.1 | `[x]` |
| 181 | Implement LLM prompt: untrusted data wrapping, system prompt not editable | PRD INT-LLM-02 | `[x]` |
| 182 | Implement data minimization for LLM (no customer PII) | PRD INT-LLM-06 | `[x]` |
| 183 | Implement LLM response validation (schema check → retry → EXTRACTION_FAILED) | PRD INT-LLM-01 | `[x]` |
| 184 | Implement prompt injection protection | PRD AC-06.2 | `[x]` |
| 185 | Implement deterministic entity resolution (vehicle, location against gazetteer) | TRD §8.2 | `[x]` |
| 186 | Implement location validation: unknown → NEEDS_CLARIFICATION; never guess | TRD INC-1/2 | `[x]` |
| 187 | `POST /api/v1/incidents/{id}/clarify` — field clarification | PRD E-11 | `[x]` |
| 188 | `POST /api/v1/incidents/{id}/validate` — re-validate after edits | PRD E-10 | `[x]` |
| 189 | Implement confidence thresholds (STT<0.80, LLM<0.75 → NEEDS_CLARIFICATION) | PRD §9.1 | `[x]` |
| 190 | Implement LLM fallback: 502 → structured form pre-filled with raw text | PRD AC-06.3 | `[x]` |

### 8.2 Voice Incidents

| # | Task | Source | Status |
|---|---|---|---|
| 191 | `POST /api/v1/plans/{id}/incidents/voice` (multipart, ≤5MB, ≤60s) | PRD US-07 | `[x]` |
| 192 | Implement STT adapter with ElevenLabs (Scribe / Speech-to-Text) provider integration | TRD VOX-2 | `[x]` |
| 193 | Implement audio validation (413 >5MB, 415 unsupported MIME) | PRD AC-07.3 | `[x]` |
| 194 | Implement audio retention: delete after transcription | PRD US-07 | `[x]` |
| 195 | Implement STT fallback: 502 → "type the incident instead" | PRD AC-07.2 | `[x]` |
| 196 | Build Report Incident page: text, mic, form fallback | PRD Screen 6 | `[x]` |
| 197 | Build voice recording UI (8 states from Design §9.2) | Design §9.2 | `[x]` |
| 198 | Implement recording controls: push-to-talk, timer, auto-stop 30s | PRD US-07 | `[x]` |
| 199 | Build transcript review: editable textarea, source badge | Design §9.3 | `[x]` |

### 8.3 Incident Confirmation & Approval

| # | Task | Source | Status |
|---|---|---|---|
| 200 | `POST /api/v1/incidents/{id}/approve` → 202 with job_id | PRD US-09 | `[x]` |
| 201 | `POST /api/v1/incidents/{id}/reject` → store reason | PRD US-09 | `[x]` |
| 202 | Implement approval guards (only PENDING_CONFIRMATION) | PRD AC-08.1 | `[x]` |
| 203 | Implement idempotent approval (same key → same response) | PRD AC-20.1/2 | `[x]` |
| 204 | Store approval record: decision, actor (from session), edits | PRD AC-09.3 | `[x]` |
| 205 | Implement VEHICLE_ALREADY_UNAVAILABLE guard | PRD AC-20.5 | `[x]` |
| 206 | Build Incident Confirmation Modal: fields, validation, confidence, Approve/Reject | PRD Screen 7 | `[x]` |
| 207 | Implement focus trap, Esc behavior, Approve disabled until approvable | Appflow OV-08 | `[x]` |
| 208 | Build location clarification UI (candidates, selection) | PRD US-08 | `[x]` |
| 209 | Build ambiguous location UI (multiple candidates) | PRD AC-08.2 | `[x]` |

---

## Phase 9 — Dynamic Re-optimization (Tasks 210–233)

### 9.1 Replan Engine

| # | Task | Source | Status |
|---|---|---|---|
| 210 | Build replan state snapshot (freeze completed, read positions, collect pending, apply overlays) | PRD §6.4 | `[x]` |
| 211 | Implement completed-stop freezing (OPT-H07) | PRD OPT-R04 | `[x]` |
| 212 | Implement in-progress stop handling (frozen + service time → start time) | PRD §5.2 | `[x]` |
| 213 | Implement vehicle start from current position (OPT-H08) | PRD OPT-H08 | `[x]` |
| 214 | Implement vehicle breakdown: BROKEN_DOWN, return pending to pool (OPT-R01) | PRD US-10 | `[x]` |
| 215 | Implement road closure: remove edges, recompute matrix (OPT-R06) | PRD US-11 | `[x]` |
| 216 | Implement delay multiplier on affected arcs (OPT-R07) | PRD US-11 | `[x]` |
| 217 | Implement urgent order insertion (OPT-R08) | PRD US-12 | `[x]` |
| 218 | Implement stability warm start (previous routes as initial solution) (OPT-R11) | PRD OPT-R11 | `[x]` |
| 219 | Implement overlay accumulation across incidents (OPT-R09) | PRD OPT-R09 | `[x]` |

### 9.2 Versioning & Comparison

| # | Task | Source | Status |
|---|---|---|---|
| 220 | Create new PlanVersion on successful reoptimization; previous → SUPERSEDED | PRD US-10 | `[x]` |
| 221 | `GET /api/v1/plans/{id}/compare?from=&to=` — KEPT/MOVED/BROKEN | PRD US-16 | `[x]` |
| 222 | Implement KEPT classification (same vehicle + ETA delta ≤ tolerance) | PRD §5.2 | `[x]` |
| 223 | Implement MOVED classification (diff vehicle or ETA > tolerance + reason) | PRD §5.2 | `[x]` |
| 224 | Implement BROKEN classification (unassigned + reason + evidence) | PRD §5.2 | `[x]` |
| 225 | Persist delivery change records per version transition | PRD §5.1 | `[x]` |
| 226 | Flag urgent orders as `is_new = true` | PRD §5.2 | `[x]` |

### 9.3 Replan UI

| # | Task | Source | Status |
|---|---|---|---|
| 227 | Build Re-optimization Progress page: status, time, outcome, retry/cancel | PRD Screen 8 | `[x]` |
| 228 | Implement progress phases (queued→solving→validating→done) with role="status" | PRD US-04 | `[x]` |
| 229 | Build failure panel: "Current plan unchanged", retry options | PRD US-19 | `[x]` |
| 230 | Build Before-vs-After Comparison page: counts, per-order rows, ETAs, deltas, reasons | PRD Screen 9 | `[x]` |
| 231 | Implement KEPT/MOVED/BROKEN with text + icon + color (never color alone) | NFR-A11Y-07 | `[x]` |
| 232 | Implement sortable/filterable comparison table | PRD Screen 9 | `[x]` |
| 233 | Build metrics deltas panel (before/after with "estimate" labels) | PRD FR-020 | `[x]` |

---

## Phase 10 — Atomic Route Activation (Tasks 234–241)

| # | Task | Source | Status |
|---|---|---|---|
| 234 | `POST /api/v1/proposals/{id}/activate` — atomic DB transaction | TRD §13 | `[x]` |
| 235 | Implement activation: BEGIN→lock→verify version→verify approved→verify feasible→verify completed unchanged→SUPERSEDE old→ACTIVATE new→audit→COMMIT | TRD §13 | `[x]` |
| 236 | Implement stale rejection: 409 STALE_PLAN_VERSION | TRD ACT-2 | `[x]` |
| 237 | Implement concurrent activation rejection | TRD ACT-4 | `[x]` |
| 238 | Implement full rollback on any failed check | TRD ACT-1 | `[x]` |
| 239 | Implement queued approval during active replan (QUEUED_BEHIND_JOB) | PRD AC-20.3 | `[x]` |
| 240 | Implement stale base version: discard STALE, re-queue against latest | PRD AC-20.4 | `[x]` |
| 241 | Write concurrency tests: stale, concurrent, idempotent, queued | PRD US-20 | `[x]` |

---

## Phase 11 — Dashboard (Tasks 242–248)

| # | Task | Source | Status |
|---|---|---|---|
| 242 | Build Dashboard page: fleet overview, KPIs, incidents, routes summary | PRD Screen 5 | `[x]` |
| 243 | Build KPI grid (5 cards): Delivered, Active Fleet, SLA Rate, Load Util, Incidents | UI mockups | `[x]` |
| 244 | Build Active Routes tab bar: All, Active Routes, Deliveries, Disruptions, SLA Risk | UI mockups | `[x]` |
| 245 | Build AI Copilot panel: NL disruption input, detected disruption card, "Analyze Query" | UI mockups | `[x]` |
| 246 | Build route optimization banner: proposed reroute, savings, "Approve & Push" | UI mockups | `[x]` |
| 247 | Implement shift selector (Morning/Afternoon/Evening tabs) | UI mockups | `[x]` |
| 248 | Build Dispatch Engine status indicator (bottom-left) | UI mockups | `[x]` |

---

## Phase 12 — Plan Schedule View (Tasks 249–254)

| # | Task | Source | Status |
|---|---|---|---|
| 249 | Build Plan Schedule page: live timetable, monthly/weekly/daily toggle | UI mockups | `[x]` |
| 250 | Build Daily Shift Manifest: Morning/Afternoon/Evening sections | UI mockups | `[x]` |
| 251 | Build per-route row: vehicle, driver, stops, payload bars, SLA, telemetry, actions | UI mockups | `[x]` |
| 252 | Build Weekly Fleet Schedule Matrix: 7-day grid, order counts, health status | UI mockups | `[x]` |
| 253 | Implement shift status badges (Active Execution, Scheduled, Planned) | UI mockups | `[x]` |
| 254 | Implement "Create Plan" and "Pre-Dispatch All" actions | UI mockups | `[x]` |

---

## Phase 13 — Notifications & Briefings (Tasks 255–272)

### 13.1 Customer Voice Updates

| # | Task | Source | Status |
|---|---|---|---|
| 255 | Implement TTS adapter with ElevenLabs (Text-to-Speech API, dynamic voice synthesis) | TRD VOX-2 | `[x]` |
| 256 | `POST /api/v1/notifications` — generate text + audio via ElevenLabs from template + solver data | PRD US-17 | `[x]` |
| 257 | Implement message template: order ref, revised ETA, reason; optional LLM rephrase with ETA validation | PRD AC-17.1 | `[x]` |
| 258 | Implement audio storage with `expires_at` | TRD §16.3 | `[x]` |
| 259 | `GET /api/v1/notifications/{id}` — signed audio URL | PRD E-17 | `[x]` |
| 260 | `POST /api/v1/notifications/{id}/simulate-send` → SIMULATED_SENT | PRD E-18 | `[x]` |
| 261 | Implement TTS fallback: 502 / quota → text still returned | PRD AC-17.3 | `[x]` |
| 262 | Build Customer Voice Preview page: text, audio, "Preview only — no call placed" | PRD Screen 10 | `[x]` |
| 263 | Build accessible audio player (play/pause/seek, transcript, no autoplay) | NFR-A11Y-08 | `[x]` |
| 264 | Implement "simulate send" with SIMULATED label | PRD §2.1 | `[x]` |

### 13.2 Fleet Briefing

| # | Task | Source | Status |
|---|---|---|---|
| 265 | `POST /api/v1/plans/{id}/briefing` — generate structured text & ElevenLabs audio briefing from persisted data | PRD US-18 | `[x]` |
| 266 | Validate briefing: every number from stored data only | PRD AC-18.2 | `[x]` |
| 267 | Enforce ≤120 words | PRD AC-18.1 | `[x]` |
| 268 | Build Fleet Briefing page: facts, text, audio player with transcript (ElevenLabs generated voice) | PRD Screen 11 | `[x]` |

### 13.3 Communications

| # | Task | Source | Status |
|---|---|---|---|
| 269 | Build Communications page: notification list, channel/status filters | Appflow R-15 | `[x]` |
| 270 | Implement retry for failed notifications (per-row + batch) | Appflow E.8 | `[x]` |
| 271 | Implement "Mark contacted manually" (auditable, requires note) | Appflow E.8 | `[x]` |
| 272 | Implement customer PII masking by default | Appflow §J.6 | `[x]` |

---

## Phase 14 — Audit & History (Tasks 273–276)

| # | Task | Source | Status |
|---|---|---|---|
| 273 | `GET /api/v1/audit-events` — paginated, filterable | TRD §12 | `[x]` |
| 274 | Audit events for: login, plan creation, optimization, approval, activation, notification | PRD FR-023 | `[x]` |
| 275 | Build Audit History page: timeline with actor, action, timestamp, entity links | TRD §2.3 | `[x]` |
| 276 | Structured JSON audit logs with correlation_id, plan_id, job_id | NFR-OBS-01 | `[x]` |

---

## Phase 15 — Error & Edge-Case States (Tasks 277–287)

| # | Task | Source | Status |
|---|---|---|---|
| 277 | Build Login page (error summary, lockout message, spinner) | PRD Screen 1 | `[x]` |
| 278 | Build session-expired overlay (OV-15): preserve data, re-auth in place | Appflow OV-15 | `[x]` |
| 279 | Build 403 access-denied page | Appflow R-19 | `[x]` |
| 280 | Build 404 not-found page (in-shell) | Appflow R-20 | `[x]` |
| 281 | Build 409 conflict handling: refetch, show diff, require decision | Appflow §D5 | `[x]` |
| 282 | Build INFEASIBLE state: constraints explained, unassigned orders with reasons | PRD US-15 | `[x]` |
| 283 | Build TIMED_OUT state: "Current plan unchanged" with retry | PRD US-19 | `[x]` |
| 284 | Build empty states for all screens | Design §2.2 | `[x]` |
| 285 | Build stale-data indicator (amber chip "Updated X min ago") | Design §2.2 | `[x]` |
| 286 | Build unsaved-changes dialog (OV-14) | Appflow OV-14 | `[x]` |
| 287 | Build persistent "Demo / Simulated positions" label | PRD §8 | `[x]` |

---

## Phase 16 — Accessibility (Tasks 288–296)

| # | Task | Source | Status |
|---|---|---|---|
| 288 | Semantic HTML: `<header>`, `<nav>`, `<main>`, single `<h1>` per page | NFR-A11Y-02 | `[x]` |
| 289 | Real `<table>` with `<th scope>`, captions for data tables | NFR-A11Y-02 | `[x]` |
| 290 | Full keyboard: visible focus ring ≥3:1 contrast, ≥2px | NFR-A11Y-03 | `[x]` |
| 291 | Modal focus trap + Esc + focus return | NFR-A11Y-03 | `[x]` |
| 292 | Form labels, `aria-describedby`, `aria-invalid`, focusable error summary | NFR-A11Y-04 | `[x]` |
| 293 | Status announcements: `role="status"` / `aria-live`, `role="alert"` for errors | NFR-A11Y-05 | `[x]` |
| 294 | Verify contrast ≥4.5:1 text, ≥3:1 UI components | NFR-A11Y-06 | `[x]` |
| 295 | Responsive ≥1024px desktop, 768–1023px tablet; touch targets ≥44px | NFR-A11Y-09 | `[x]` |
| 296 | Run axe-core on all screens: zero critical violations | PRD §10.1 | `[x]` |

---

## Phase 17 — Observability (Tasks 297–303)

| # | Task | Source | Status |
|---|---|---|---|
| 297 | Structured JSON logging (request_id, job_id, plan_version, tenant) | NFR-OBS-01 | `[x]` |
| 298 | Metrics: optimization_job_duration_ms, solver_duration_ms, matrix_duration_ms | TRD §19.1 | `[x]` |
| 299 | Metrics: job_failure_total, unassigned_deliveries_total | TRD §19.1 | `[x]` |
| 300 | Metrics: incident_validation_rejection, activation_conflict | TRD §19.1 | `[x]` |
| 301 | Metrics: voice_transcription_duration, voice_generation_duration, notification_failure | TRD §19.1 | `[x]` |
| 302 | Error reporting: error IDs to users, diagnostics only in logs | NFR-OBS-03 | `[x]` |
| 303 | Verify no secrets/tokens/raw audio/customer PII in logs | TRD SEC-12 | `[x]` |

---

## Phase 18 — Security Hardening (Tasks 304–310)

| # | Task | Source | Status |
|---|---|---|---|
| 304 | Zod strict field allowlists on every mutation endpoint | TRD SEC-4 | `[x]` |
| 305 | Private audio storage with short-lived signed URLs | TRD SEC-6 | `[x]` |
| 306 | Idempotency-key handling on all create/approve/reject/optimize/notify calls | PRD §7.2 | `[x]` |
| 307 | Verify DB runtime role: no superuser, no BYPASSRLS | TRD SEC-14 | `[x]` |
| 308 | Verify internal networking: DB and worker not public | TRD SEC-10 | `[x]` |
| 309 | Run dependency security scans (npm audit, pip-audit) | TRD SEC-9 | `[x]` |
| 310 | Verify phone numbers encrypted/masked (E.164) | PRD DM-07 | `[x]` |

---

## Phase 19 — Testing (Tasks 311–338)

### 19.1 Unit Tests

| # | Task | Source | Status |
|---|---|---|---|
| 311 | Solver: capacity, time windows, availability, frozen stops | TRD §20 | `[x]` |
| 312 | Pre-solve feasibility + post-solve validator | PRD §6.2 | `[x]` |
| 313 | KEPT/MOVED/BROKEN classification logic | TRD §20 #8 | `[x]` |
| 314 | Reason code generation with numeric evidence | PRD US-15 | `[x]` |
| 315 | Integer scaling and rounding rules | PRD §6.3 | `[x]` |
| 316 | Incident extraction schema validation | PRD §7.3 | `[x]` |
| 317 | Idempotency logic | TRD §20 #10 | `[x]` |
| 318 | State machine transitions (incident, plan, job, notification) | TRD §7 | `[x]` |

### 19.2 Integration Tests

| # | Task | Source | Status |
|---|---|---|---|
| 319 | Plan creation + optimization flow + versioning | TRD §20 | `[x]` |
| 320 | Vehicle breakdown prevents new assignments | TRD §20 #1 | `[x]` |
| 321 | Completed deliveries remain fixed after replan | TRD §20 #2 | `[x]` |
| 322 | Unapproved incidents cannot activate route | TRD §20 #6 | `[x]` |
| 323 | Stale proposals cannot overwrite newer plans | TRD §20 #9 | `[x]` |
| 324 | Duplicate requests → no duplicate jobs | TRD §20 #10 | `[x]` |
| 325 | Failed optimization → no plan change | TRD §20 #16 | `[x]` |
| 326 | Cross-tenant UUID-guessing denied by RLS | TRD §20 #13 | `[x]` |
| 327 | Audit events for approvals and activation | TRD §20 #14 | `[x]` |

### 19.3 E2E Tests (Playwright)

| # | Task | Source | Status |
|---|---|---|---|
| 328 | Full flow: login → create plan → optimize → view results | PRD §10.1 | `[x]` |
| 329 | Incident: report → approve → reoptimize → compare → accept | PRD §10.1 | `[x]` |
| 330 | Voice: record → transcript review → confirm → replan | PRD §10.1 | `[x]` |
| 331 | Notification: preview → simulate send | PRD §10.1 | `[x]` |
| 332 | Speech failure → fallback to text form | TRD §20 #12 | `[x]` |

### 19.4 Performance Benchmarks

| # | Task | Source | Status |
|---|---|---|---|
| 333 | Create BENCH-S (10 vehicles, 80 orders) | PRD §4.1 | `[x]` |
| 334 | Create BENCH-M (20 vehicles, 200 orders) | PRD §4.1 | `[x]` |
| 335 | Benchmark initial optimization on BENCH-S (target ≤10s p95) | PRD M-01 | `[x]` |
| 336 | Benchmark reoptimization on BENCH-S (target ≤2s p95) | PRD M-02 | `[x]` |
| 337 | Lighthouse CI: LCP <1.2s, INP <200ms, CLS <0.1 | NFR-PERF-01..03 | `[x]` |
| 338 | Document results in `docs/benchmarks.md` | PRD §6.5 | `[x]` |

---

## Phase 20 — CI/CD & Deployment (Tasks 339–349)

| # | Task | Source | Status |
|---|---|---|---|
| 339 | CI: formatting + linting | TRD §22 | `[x]` |
| 340 | CI: Python static checks (mypy/ruff) | TRD §22 | `[x]` |
| 341 | CI: unit tests | TRD §22 | `[x]` |
| 342 | CI: database migration tests | TRD §22 | `[x]` |
| 343 | CI: RLS + tenant-isolation tests | TRD §22 | `[x]` |
| 344 | CI: API integration tests | TRD §22 | `[x]` |
| 345 | CI: production build | TRD §22 | `[x]` |
| 346 | CI: dependency + container security scans | TRD §22 | `[x]` |
| 347 | Write production deployment documentation | TRD §25 | `[x]` |
| 348 | Write troubleshooting + operations guide | TRD §25 | `[x]` |
| 349 | Write README with `docker compose up` quickstart | TRD §25 | `[x]` |

---

## Phase 21 — Polish & Demo Readiness (Tasks 350–358)

| # | Task | Source | Status |
|---|---|---|---|
| 350 | Implement demo execution: `POST /plans/{id}/orders/{oid}/complete` | PRD E-21 | `[x]` |
| 351 | Implement simulated vehicle position updates for demo | PRD FR-008 | `[x]` |
| 352 | Label all simulated data: "SIMULATED" positions, "Demo" mode | PRD §2.1 | `[x]` |
| 353 | Verify OpenStreetMap attribution visible | TRD OSM-1 | `[x]` |
| 354 | Review all license compliance (OSM, voice, containers, deps) | TRD STK-4 | `[x]` |
| 355 | Run full acceptance suite on DEMO-A through DEMO-E | PRD §10.1 | `[x]` |
| 356 | Record manual baseline replan timing (≥3 trials) | PRD §1.5 | `[x]` |
| 357 | Final UI polish pass against Design.md tokens + responsive breakpoints | Design §18 | `[x]` |
| 358 | Final security review: no secrets in logs, CSRF, RLS, audit complete | TRD §17 | `[x]` |

---

## Summary

| Phase | Tasks | Description |
|---|---|---|
| 1 | 1–65 | Foundation: repo, Docker, DB schema, RLS, seed data |
| 2 | 66–75 | Authentication & authorization |
| 3 | 76–104 | Design system & UI foundation |
| 4 | 105–123 | CRUD APIs for fleet, orders, plans |
| 5 | 124–135 | Map & routing integration |
| 6 | 136–169 | Optimization engine (Python/OR-Tools) |
| 7 | 170–178 | Plan view & results UI |
| 8 | 179–209 | Incident reporting & validation |
| 9 | 210–233 | Dynamic re-optimization & comparison |
| 10 | 234–241 | Atomic activation & concurrency |
| 11 | 242–248 | Dashboard |
| 12 | 249–254 | Plan schedule view |
| 13 | 255–272 | Notifications & fleet briefings |
| 14 | 273–276 | Audit & history |
| 15 | 277–287 | Error & edge-case states |
| 16 | 288–296 | Accessibility |
| 17 | 297–303 | Observability & metrics |
| 18 | 304–310 | Security hardening |
| 19 | 311–338 | Testing (unit, integration, E2E, perf) |
| 20 | 339–349 | CI/CD & deployment |
| 21 | 350–358 | Polish & demo readiness |

> **Total: 358 atomic tasks across 21 phases**

---

## UI Reference — Design Inspiration

The following DispatchX mockups serve as the primary visual reference for building the dashboard and plan schedule views. These represent the target aesthetic: **precision data-dense slate** with a calm, high-legibility control-room interface.

### Dashboard Reference
- Dark sidebar with DispatchX branding and navigation icons
- Depot selector and shift window in header bar
- 5-KPI summary strip (Total Delivered, Active Fleet, On-Time SLA, Load Util, Incidents)
- Split layout: interactive map (left) + AI Copilot disruption panel (right)
- Fleet routes table with status badges, load bars, SLA windows, and action buttons
- Route optimization banner with savings estimate and "Approve & Push to Driver"
- Dispatch Engine status indicator (bottom-left corner)

### Plan Schedule Reference  
- Live Timetable toggle (Monthly/Weekly/Daily)
- Daily Shift Manifest Breakdown: Morning/Afternoon/Evening sections
- Per-route rows: driver avatar, stop count, payload capacity bars, SLA compliance, live telemetry
- Weekly Fleet Schedule Matrix: 7-day grid with order counts and health indicators
- "Create Plan" and "Pre-Dispatch All" action buttons
- Attention Required badges (HIGH SLA RISK warnings)
