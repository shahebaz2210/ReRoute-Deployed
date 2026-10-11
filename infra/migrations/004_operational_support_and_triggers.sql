-- Migration 004: Operational Support Tables & Immutability Triggers (Tasks 36-50)

-- 1. Vehicle Positions Telemetry Stream (Task 38)
CREATE TABLE IF NOT EXISTS vehicle_positions (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    geom geometry(Point, 4326) GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)) STORED,
    speed_mps DOUBLE PRECISION,
    heading_deg DOUBLE PRECISION,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_veh_pos_geom ON vehicle_positions USING GIST(geom);
CREATE INDEX IF NOT EXISTS idx_veh_pos_veh_time ON vehicle_positions(vehicle_id, recorded_at DESC);

-- 2. Incident Approvals (Task 39)
CREATE TABLE IF NOT EXISTS incident_approvals (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    approver_id VARCHAR(255) NOT NULL,
    decision VARCHAR(50) NOT NULL,
    notes TEXT,
    modifications JSONB,
    approved_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_inc_approvals_inc ON incident_approvals(incident_id);

-- 3. Plan Versions (Task 40)
CREATE TABLE IF NOT EXISTS plan_versions (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES route_plans(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    state_snapshot JSONB NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_plan_versions_num UNIQUE (plan_id, version_number)
);
CREATE INDEX IF NOT EXISTS idx_plan_versions_active ON plan_versions(plan_id, is_active);

-- 4. Optimization Metrics (Task 41)
CREATE TABLE IF NOT EXISTS optimization_metrics (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES optimization_jobs(id) ON DELETE CASCADE,
    total_distance_meters DOUBLE PRECISION NOT NULL,
    total_duration_seconds INTEGER NOT NULL,
    estimated_fuel_liters DOUBLE PRECISION,
    estimated_cost_usd DOUBLE PRECISION,
    estimated_co2_kg DOUBLE PRECISION,
    sla_on_time_percent DOUBLE PRECISION,
    unassigned_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_opt_metrics_job ON optimization_metrics(job_id);

-- 5. Delivery Change Records (Task 42)
CREATE TABLE IF NOT EXISTS delivery_change_records (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    old_arrival TIMESTAMPTZ,
    new_arrival TIMESTAMPTZ NOT NULL,
    reason TEXT NOT NULL,
    notified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_deliv_change_order ON delivery_change_records(order_id);

-- 6. Generated Audio (ElevenLabs Voice Artifacts) (Task 43)
CREATE TABLE IF NOT EXISTS generated_audio (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    entity_type VARCHAR(50) NOT NULL, -- notification, briefing, incident
    entity_id UUID NOT NULL,
    voice_id VARCHAR(100) NOT NULL,
    model_id VARCHAR(100) NOT NULL,
    audio_url TEXT NOT NULL,
    file_size_bytes INTEGER,
    duration_seconds DOUBLE PRECISION,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_gen_audio_entity ON generated_audio(entity_type, entity_id);

-- 7. Road Network Nodes & Edges (Task 44)
CREATE TABLE IF NOT EXISTS location_nodes (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    node_osm_id BIGINT,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    geom geometry(Point, 4326) GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)) STORED
);
CREATE INDEX IF NOT EXISTS idx_loc_nodes_geom ON location_nodes USING GIST(geom);

CREATE TABLE IF NOT EXISTS road_edges (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    source_node_id UUID NOT NULL REFERENCES location_nodes(id) ON DELETE CASCADE,
    target_node_id UUID NOT NULL REFERENCES location_nodes(id) ON DELETE CASCADE,
    distance_meters DOUBLE PRECISION NOT NULL,
    duration_seconds DOUBLE PRECISION NOT NULL,
    is_blocked BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_road_edges_source_target ON road_edges(source_node_id, target_node_id);

-- ==============================================================================
-- 8. Immutability Triggers (Task 48, TRD §6.3, INV-01)
-- ==============================================================================
CREATE OR REPLACE FUNCTION prevent_audit_and_delivery_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Disallowed: Audit events and delivery proof events are strictly immutable (INV-01)';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_immutable_audit_events ON audit_events;
CREATE TRIGGER trg_immutable_audit_events
BEFORE UPDATE OR DELETE ON audit_events
FOR EACH ROW EXECUTE FUNCTION prevent_audit_and_delivery_modification();

DROP TRIGGER IF EXISTS trg_immutable_delivery_events ON delivery_events;
CREATE TRIGGER trg_immutable_delivery_events
BEFORE UPDATE OR DELETE ON delivery_events
FOR EACH ROW EXECUTE FUNCTION prevent_audit_and_delivery_modification();

-- ==============================================================================
-- 9. State Transition Trigger (Task 49, TRD ST-4)
-- Completed deliveries can never be unassigned or cancelled
-- ==============================================================================
CREATE OR REPLACE FUNCTION enforce_completed_delivery_invariants()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status = 'completed' AND NEW.status != 'completed' THEN
        RAISE EXCEPTION 'Invariant Violation: Completed deliveries cannot transition out of completed status (INV-01)';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_order_status_invariants ON orders;
CREATE TRIGGER trg_order_status_invariants
BEFORE UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION enforce_completed_delivery_invariants();
