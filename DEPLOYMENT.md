# Deployment Guide (Free Tier with Dynamic Git-Push Auto-Deploy)

This project (DispatchX / ReRoute) consists of:
1. **Frontend / Cockpit Web App**: Next.js 16 (App Router, React 19, Tailwind CSS) in `apps/web`.
2. **Backend Optimization Worker**: FastAPI + Google OR-Tools in `services/optimizer`.
3. **Database**: PostgreSQL with PostGIS extensions.

Below is the step-by-step setup using **100% free hosting platforms** that automatically re-build and redeploy on every `git push` to your GitHub repository (`shahebaz2210/ReRoute-Deployed`).

---

## 1. Database (Free Serverless PostgreSQL + PostGIS)

Recommended Platform: **[Neon.tech](https://neon.tech)** or **[Supabase](https://supabase.com)** (Free Tier)

1. Create a free account on **Neon** or **Supabase**.
2. Create a new PostgreSQL project named `dispatchx`.
3. Enable PostGIS:
   - In SQL Editor, run:
     ```sql
     CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
     CREATE EXTENSION IF NOT EXISTS postgis;
     ```
4. Copy your connection string (`DATABASE_URL`), formatted like:
   ```
   postgresql://user:password@ep-sample-pooler.us-east-2.aws.neon.tech/dispatchx?sslmode=require
   ```

---

## 2. Backend Engine (FastAPI + OR-Tools Optimizer)

Recommended Platform: **[Render.com](https://render.com)** (Free Tier Web Service)

Render automatically pulls code from your GitHub repo and triggers a rolling redeployment whenever you push commits to `main`.

### Option A: Using Render Blueprint (Automatic)
1. Log in to [Render](https://dashboard.render.com/).
2. Click **New +** -> **Blueprint**.
3. Select your repository `shahebaz2210/ReRoute-Deployed`.
4. Render will read the included `render.yaml` and configure the service automatically!
5. Click **Apply**.

### Option B: Manual Web Service Setup
1. Click **New +** -> **Web Service**.
2. Connect `shahebaz2210/ReRoute-Deployed`.
3. Settings:
   - **Name**: `dispatchx-optimizer`
   - **Root Directory**: `services/optimizer`
   - **Environment / Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type**: Free
4. Add Environment Variables:
   - `PYTHON_VERSION`: `3.12.0`
   - `OPTIMIZER_WORKER_SECRET`: Any random secret (e.g. `dispatchx-internal-optimizer-secret-2026`)
5. Click **Create Web Service**.
6. Once deployed, copy your Render service URL (e.g., `https://dispatchx-optimizer.onrender.com`).

---

## 3. Frontend Cockpit (Next.js 16 Web Application)

Recommended Platform: **[Vercel](https://vercel.com)** (Free Hobby Tier)

Vercel provides native zero-config support for Next.js, Edge network distribution, and automatic instant builds on every `git push`.

1. Go to [Vercel Dashboard](https://vercel.com/dashboard) and click **Add New...** -> **Project**.
2. Import `shahebaz2210/ReRoute-Deployed`.
3. In the configuration screen:
   - **Framework Preset**: Next.js
   - **Root Directory**: Click "Edit" and choose `apps/web` (or leave as root with `npm run build --workspace=apps/web`)
   - Enable: "Include files outside the root directory in the Build Step"
4. Expand **Environment Variables** and add:
   - `DATABASE_URL`: Your database connection URL from Neon/Supabase.
   - `OPTIMIZER_BASE_URL`: Your backend URL from Render (e.g., `https://dispatchx-optimizer.onrender.com`).
   - `OPTIMIZER_WORKER_SECRET`: Same secret configured in Render.
   - `AUTH_SECRET`: A secure random string (at least 32 characters).
   - `NEXT_PUBLIC_APP_NAME`: `DispatchX`
   - `NEXT_PUBLIC_MAP_STYLE_URL`: `https://demotiles.maplibre.org/style.json`
5. Click **Deploy**.

---

## 4. Continuous Integration & Dynamic Updates

Both **Vercel** and **Render** are directly integrated with GitHub webhooks:
- Whenever you make changes locally:
  ```bash
  git add .
  git commit -m "update: feature improvements"
  git push origin main
  ```
- **Vercel** automatically rebuilds and publishes the updated frontend in ~30 seconds.
- **Render** automatically pulls the latest commit, re-runs requirements, and updates the backend worker.
