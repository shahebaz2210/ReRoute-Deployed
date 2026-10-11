-- Migration 002: Define all PostgreSQL enums (TRD §5.3)

DO $$ BEGIN
    CREATE TYPE member_role AS ENUM ('admin', 'dispatcher', 'driver', 'viewer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE vehicle_status AS ENUM ('available', 'en_route', 'delayed', 'broken_down', 'maintenance');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE delivery_status AS ENUM ('pending', 'assigned', 'in_transit', 'completed', 'failed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE incident_type AS ENUM ('breakdown', 'road_closure', 'traffic_delay', 'urgent_order', 'weather', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE incident_status AS ENUM ('draft', 'submitted', 'under_assessment', 'confirmed', 'dismissed', 'replanning', 'awaiting_approval', 'applying', 'resolved', 'failed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE plan_status AS ENUM ('draft', 'solving', 'proposed', 'active', 'superseded');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE job_status AS ENUM ('queued', 'running', 'succeeded', 'failed', 'timed_out', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE comparison_class AS ENUM ('KEPT', 'MOVED', 'BROKEN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE notification_status AS ENUM ('pending', 'sent', 'delivered', 'failed', 'simulated_sent', 'manual_contacted');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
