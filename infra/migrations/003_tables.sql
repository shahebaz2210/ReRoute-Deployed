-- Migration 003: Core Tables and Constraints (Tasks 22-35, TRD §5.2)

-- 1. Organizations
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Memberships
CREATE TABLE IF NOT EXISTS memberships (
    id UUID PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    role member_role NOT NULL DEFAULT 'dispatcher',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_memberships_org_user UNIQUE (organization_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_memberships_org_role ON memberships(organization_id, role);

-- 3. Locations (with PostGIS Point & GiST index)
CREATE TABLE IF NOT EXISTS locations (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    code VARCHAR(50),
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    geom geometry(Point, 4326) GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)) STORED,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_locations_geom ON locations USING GIST(geom);
CREATE INDEX IF NOT EXISTS idx_locations_org ON locations(organization_id);

-- 4. Vehicles (Capacity and CHECK constraints)
CREATE TABLE IF NOT EXISTS vehicles (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    driver_name VARCHAR(255),
    max_weight_kg DOUBLE PRECISION NOT NULL CHECK (max_weight_kg > 0),
    max_volume_m3 DOUBLE PRECISION NOT NULL CHECK (max_volume_m3 > 0),
    current_weight_kg DOUBLE PRECISION NOT NULL DEFAULT 0 CHECK (current_weight_kg >= 0),
    current_volume_m3 DOUBLE PRECISION NOT NULL DEFAULT 0 CHECK (current_volume_m3 >= 0),
    status vehicle_status NOT NULL DEFAULT 'available',
    current_latitude DOUBLE PRECISION,
    current_longitude DOUBLE PRECISION,
    position_updated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_vehicles_org_code UNIQUE (organization_id, code)
);
CREATE INDEX IF NOT EXISTS idx_vehicles_org_status ON vehicles(organization_id, status);

-- 5. Customers
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    notification_consent BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_customers_org ON customers(organization_id);

-- 6. Orders
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    tracking_number VARCHAR(100) NOT NULL,
    customer_id UUID NOT NULL REFERENCES customers(id),
    location_id UUID NOT NULL REFERENCES locations(id),
    weight_kg DOUBLE PRECISION NOT NULL CHECK (weight_kg > 0),
    volume_m3 DOUBLE PRECISION NOT NULL CHECK (volume_m3 > 0),
    window_start TIMESTAMPTZ NOT NULL,
    window_end TIMESTAMPTZ NOT NULL,
    service_duration_seconds INTEGER NOT NULL DEFAULT 300 CHECK (service_duration_seconds >= 0),
    priority VARCHAR(50) NOT NULL DEFAULT 'standard',
    status delivery_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_orders_org_tracking UNIQUE (organization_id, tracking_number),
    CONSTRAINT chk_orders_window CHECK (window_start < window_end)
);
CREATE INDEX IF NOT EXISTS idx_orders_org_status ON orders(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_window ON orders(window_start, window_end);

-- 7. Route Plans
CREATE TABLE IF NOT EXISTS route_plans (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    version INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1),
    operating_date VARCHAR(10) NOT NULL,
    status plan_status NOT NULL DEFAULT 'draft',
    approved_by VARCHAR(255),
    approved_at TIMESTAMPTZ,
    activated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_route_plans_org_date ON route_plans(organization_id, operating_date);
CREATE INDEX IF NOT EXISTS idx_route_plans_status ON route_plans(status);

-- 8. Route Stops
CREATE TABLE IF NOT EXISTS route_stops (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES route_plans(id) ON DELETE CASCADE,
    vehicle_id UUID NOT NULL REFERENCES vehicles(id),
    order_id UUID NOT NULL REFERENCES orders(id),
    sequence_index INTEGER NOT NULL CHECK (sequence_index >= 0),
    planned_arrival TIMESTAMPTZ NOT NULL,
    planned_departure TIMESTAMPTZ,
    actual_arrival TIMESTAMPTZ,
    status delivery_status NOT NULL DEFAULT 'assigned',
    CONSTRAINT uq_stops_plan_veh_seq UNIQUE (plan_id, vehicle_id, sequence_index)
);
CREATE INDEX IF NOT EXISTS idx_route_stops_veh_arr ON route_stops(vehicle_id, planned_arrival);

-- 9. Delivery Events (Append-Only)
CREATE TABLE IF NOT EXISTS delivery_events (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES orders(id),
    stop_id UUID REFERENCES route_stops(id),
    vehicle_id UUID REFERENCES vehicles(id),
    event_type VARCHAR(50) NOT NULL,
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_delivery_events_order_time ON delivery_events(order_id, created_at);

-- 10. Incidents
CREATE TABLE IF NOT EXISTS incidents (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES route_plans(id),
    type incident_type NOT NULL,
    status incident_status NOT NULL DEFAULT 'draft',
    severity VARCHAR(50) NOT NULL DEFAULT 'medium',
    description TEXT NOT NULL,
    vehicle_id UUID REFERENCES vehicles(id),
    location_id UUID REFERENCES locations(id),
    extracted_data JSONB,
    reported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    confirmed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_incidents_org_status ON incidents(organization_id, status);

-- 11. Optimization Jobs
CREATE TABLE IF NOT EXISTS optimization_jobs (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES route_plans(id),
    incident_id UUID REFERENCES incidents(id),
    status job_status NOT NULL DEFAULT 'queued',
    solver_status VARCHAR(100),
    latency_ms INTEGER,
    input_snapshot JSONB,
    proposal_result JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_opt_jobs_plan_status ON optimization_jobs(plan_id, status);

-- 12. Plan Diffs
CREATE TABLE IF NOT EXISTS plan_diffs (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES route_plans(id),
    order_id UUID NOT NULL REFERENCES orders(id),
    comparison_class comparison_class NOT NULL,
    old_vehicle_id UUID REFERENCES vehicles(id),
    new_vehicle_id UUID REFERENCES vehicles(id),
    old_arrival TIMESTAMPTZ,
    new_arrival TIMESTAMPTZ,
    broken_reason VARCHAR(100),
    explanation TEXT
);
CREATE INDEX IF NOT EXISTS idx_plan_diffs_plan_order ON plan_diffs(plan_id, order_id);

-- 13. Customer Notifications
CREATE TABLE IF NOT EXISTS customer_notifications (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES orders(id),
    status notification_status NOT NULL DEFAULT 'pending',
    revised_eta TIMESTAMPTZ,
    message_text TEXT NOT NULL,
    audio_url TEXT,
    idempotency_key VARCHAR(255) UNIQUE,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_cust_notif_org_order ON customer_notifications(organization_id, order_id);

-- 14. Fleet Briefings
CREATE TABLE IF NOT EXISTS fleet_briefings (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES route_plans(id),
    shift VARCHAR(50) NOT NULL,
    briefing_text TEXT NOT NULL,
    audio_url TEXT,
    word_count INTEGER NOT NULL CHECK (word_count <= 120),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_briefings_plan ON fleet_briefings(plan_id);

-- 15. Audit Events (Append-Only)
CREATE TABLE IF NOT EXISTS audit_events (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    actor_id VARCHAR(255) NOT NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID NOT NULL,
    before_state JSONB,
    after_state JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_events_org_created ON audit_events(organization_id, created_at);

-- 16. Idempotency Records
CREATE TABLE IF NOT EXISTS idempotency_records (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    key VARCHAR(255) NOT NULL,
    request_hash VARCHAR(255) NOT NULL,
    response_json JSONB,
    status_code INTEGER,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_idempotency_org_key UNIQUE (organization_id, key)
);
