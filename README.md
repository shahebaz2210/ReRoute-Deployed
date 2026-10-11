<div align="center">

# ⚡ DispatchX (VORTEXA 3.0 / ReRoute)
### Autonomous, Human-in-the-Loop Dynamic Logistics Dispatch & Disruption Recovery

[![Next.js 16](https://img.shields.io/badge/Frontend-Next.js_16_Turbopack-black?logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI_Python_3.12-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![OR-Tools](https://img.shields.io/badge/Optimization-Google_OR--Tools-4285F4?logo=google)](https://developers.google.com/optimization)
[![PostGIS](https://img.shields.io/badge/Spatial_DB-PostgreSQL_16_%2B_PostGIS-336791?logo=postgresql)](https://postgis.net/)
[![ElevenLabs](https://img.shields.io/badge/Voice_AI-ElevenLabs_TTS_%2F_STT-FF5A5F)](https://elevenlabs.io/)
[![Valhalla](https://img.shields.io/badge/Routing-Valhalla_OSM-008080)](https://valhalla.github.io/valhalla/)
[![Graphify](https://img.shields.io/badge/Knowledge_Graph-774_Nodes_|_1236_Edges-8A2BE2)](https://github.com/safishamsi/graphify)

*High-precision, resilient fleet operations platform for real-time delivery management, automated disruption recovery, and human-in-the-loop dispatching.*

---

</div>

## 📌 Executive Summary

Modern urban logistics networks face constant disruptions: vehicle breakdowns, emergency road closures, last-minute order additions, and severe traffic congestion.

**DispatchX** delivers a complete, self-healing dispatch loop built as a **100% responsive web application** for both Dispatchers and Drivers:

1. **Excel & CSV Ingestion Engine:** Dispatchers upload daily delivery schedules (`.xlsx` or `.csv`) with strict validation (capacity bounds, time windows, coordinate fences, and automated formula injection sanitization `=,+,-,@`).
2. **Google OR-Tools VRPTW Solver:** Resolves multi-vehicle routing problems with hard constraints (vehicle weight and volume limits, driver shift boundaries, and delivery time windows) with resilient TypeScript local solver fallback.
3. **ElevenLabs Voice Incident Reporting:** Drivers report roadblocks or breakdowns verbally with hands-on-wheel via Web Speech/ElevenLabs. The system extracts disruption metadata (`type`, `severity`, `delay`, `location`) in real time.
4. **Human-in-the-Loop Re-optimization & Visual Diff:** Computes freeze horizons, preserves already delivered cargo, reassigns orphaned stops, and renders side-by-side plan diffs (`KEPT` green, `MOVED` blue, `BROKEN` orange) before activation.
5. **Atomic Concurrency Control:** Enforces optimistic version locking to prevent split-brain fleet updates.
6. **Driver Web Terminal & Proof of Delivery (POD):** Fully responsive web portal with touch signature signoff, photo attachment simulation, and audio shift briefings via ElevenLabs TTS.
7. **Immutable Audit Trail:** Cryptographically hashed timeline of all fleet updates and dispatches, exportable to JSON.

---

## 🏗️ System Architecture

```mermaid
flowchart TB
  subgraph WebWorkspace ["🖥️ 100% Web Applications (Next.js 16)"]
    ControlRoom["Dispatcher Cockpit (/, /fleet, /orders, /monitor)"]
    PlanCompare["Plan Diff & Version Comparison (/plans/[id]/compare)"]
    Disruptions["Disruption Approval Panel (/disruptions)"]
    DriverWeb["Driver Web Terminal & POD (/driver)"]
    AuditTrail["Immutable Audit Trail (/audit)"]
  end

  subgraph VoiceServices ["🎙️ ElevenLabs Voice Ecosystem"]
    STT["Speech-to-Text Incident Extraction"]
    TTS["Driver Audio Briefings & Customer ETA Alerts"]
  end

  subgraph OptimizationEngines ["⚡ Hybrid VRPTW Solver"]
    FastAPI["FastAPI Solver Microservice (POST /optimize)"]
    ORTools["Google OR-Tools VRPTW Engine"]
    LocalFallback["Resilient Built-in TypeScript VRPTW Engine"]
  end

  subgraph RoutingSpatial ["🗺️ Routing & Maps"]
    Valhalla["Valhalla OSM Routing Adapter"]
    FleetMap["Interactive FleetMap (Leaflet / OSM)"]
  end

  DriverWeb -- "Voice Incident Audio/Transcript" --> STT
  STT -- "Structured Disruption Event" --> Disruptions
  Disruptions -- "Trigger Re-plan" --> OptimizationEngines
  OptimizationEngines --> PlanCompare
  PlanCompare -- "Approve & Deploy" --> ControlRoom
  ControlRoom -- "Spoken Shift Briefing" --> TTS
```

---

## 🚀 Key Web Application Pages

| URL Route | Interface Name | Purpose & Capabilities |
|---|---|---|
| `/` | **Operations Dashboard** | Fleet status KPIs, active vehicles, disruption alert banners, quick action shortcuts |
| `/monitor` | **Live Telemetry & Fleet Map** | Interactive Leaflet map with vehicle markers, stop pins, route polylines, and road closures |
| `/fleet` | **Fleet & Drivers** | Vehicle capacity tracking (weight/volume), driver shift timers, status filters |
| `/orders` | **Orders & Cargo** | Order manifest, customer delivery addresses, time windows, weight/volume metrics |
| `/plans/new` | **Plan Ingestion** | Drag-and-drop Excel/CSV upload with validation rules and error diagnostic tables |
| `/plans/[id]/compare`| **Plan Version Comparison** | Side-by-side plan diff with `KEPT` (green), `MOVED` (blue), `BROKEN` (orange) categorization |
| `/disruptions` | **Disruptions & Approvals**| Active incidents, AI re-routing recommendations, and one-click dispatch approval |
| `/driver` | **Driver Web Portal** | Hands-free ElevenLabs voice incident reporting, turn-by-turn stop manifest, digital POD modal |
| `/audit` | **Immutable Audit Trail** | Cryptographically verified log of all dispatch actions, optimizations, and exports |

---

## 🛠️ Technology Stack

- **Frontend & Web Core:** Next.js 16 (App Router, Turbopack, React 19, TypeScript)
- **Styling & Design System:** Custom semantic tokens (Dark/Light mode support, WCAG AA contrast)
- **Maps & GIS:** Leaflet, OpenStreetMap tiles, Valhalla routing matrix adapter
- **Optimization:** Google OR-Tools (Python 3.12) & TypeScript heuristic VRPTW solver
- **Voice Intelligence:** ElevenLabs API (Voice ID integration, STT parsing, TTS synthesis)
- **Testing:** Vitest (20/20 unit/integration tests passing)
- **Context Engineering:** Graphify Knowledge Graph (774 nodes, 1,236 edges, 51 communities)

---

## 🏃 Getting Started

### Prerequisites
- Node.js 20+
- Python 3.11+
- Git

### Installation & Development Run
```bash
# Clone the repository
git clone https://github.com/shahebaz2210/Vortexa-3.0.git
cd Vortexa-3.0

# Install dependencies
npm install

# Run the Web Application
cd apps/web
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to access the Dispatcher Cockpit, or [http://localhost:3000/driver](http://localhost:3000/driver) for the Driver Portal.

### Running Test Suite
```bash
cd apps/web
npx vitest run
```

---

## 📄 License
MIT License. Built for the DispatchX / VORTEXA 3.0 Platform.
