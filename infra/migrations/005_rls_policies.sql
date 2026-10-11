-- Migration 005: Row-Level Security (RLS) & Tenant Isolation (Tasks 51-55, TRD §6)

-- 1. Create app_runtime role if not exists (Task 51)
DO $$ BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'app_runtime') THEN
        CREATE ROLE app_runtime WITH LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;
    END IF;
END $$;

-- 2. Tenant & Session Context Setter Functions (Task 55)
CREATE OR REPLACE FUNCTION set_tenant_context(p_tenant_id UUID, p_user_id VARCHAR DEFAULT NULL, p_role VARCHAR DEFAULT 'dispatcher')
RETURNS void AS $$
BEGIN
    PERFORM set_config('app.current_tenant_id', p_tenant_id::TEXT, true);
    IF p_user_id IS NOT NULL THEN
        PERFORM set_config('app.current_user_id', p_user_id, true);
    END IF;
    IF p_role IS NOT NULL THEN
        PERFORM set_config('app.current_user_role', p_role, true);
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_current_tenant_id()
RETURNS UUID AS $$
BEGIN
    RETURN NULLIF(current_setting('app.current_tenant_id', true), '')::UUID;
END;
$$ LANGUAGE plpgsql STABLE;

-- 3. Enable and Force RLS on all Tenant Tables (Task 52)
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations FORCE ROW LEVEL SECURITY;

ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships FORCE ROW LEVEL SECURITY;

ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations FORCE ROW LEVEL SECURITY;

ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles FORCE ROW LEVEL SECURITY;

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers FORCE ROW LEVEL SECURITY;

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders FORCE ROW LEVEL SECURITY;

ALTER TABLE route_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_plans FORCE ROW LEVEL SECURITY;

ALTER TABLE route_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_stops FORCE ROW LEVEL SECURITY;

ALTER TABLE delivery_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_events FORCE ROW LEVEL SECURITY;

ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents FORCE ROW LEVEL SECURITY;

ALTER TABLE optimization_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE optimization_jobs FORCE ROW LEVEL SECURITY;

ALTER TABLE plan_diffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_diffs FORCE ROW LEVEL SECURITY;

ALTER TABLE customer_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_notifications FORCE ROW LEVEL SECURITY;

ALTER TABLE fleet_briefings ENABLE ROW LEVEL SECURITY;
ALTER TABLE fleet_briefings FORCE ROW LEVEL SECURITY;

ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_events FORCE ROW LEVEL SECURITY;

ALTER TABLE idempotency_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE idempotency_records FORCE ROW LEVEL SECURITY;

ALTER TABLE vehicle_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_positions FORCE ROW LEVEL SECURITY;

ALTER TABLE incident_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_approvals FORCE ROW LEVEL SECURITY;

ALTER TABLE plan_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_versions FORCE ROW LEVEL SECURITY;

ALTER TABLE optimization_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE optimization_metrics FORCE ROW LEVEL SECURITY;

ALTER TABLE delivery_change_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_change_records FORCE ROW LEVEL SECURITY;

ALTER TABLE generated_audio ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_audio FORCE ROW LEVEL SECURITY;

-- 4. RLS Tenant Isolation Policies (Task 53, Task 54)
-- Helper function to check if system worker bypass is active
CREATE OR REPLACE FUNCTION is_system_worker()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN COALESCE(current_setting('app.is_system_worker', true), 'false') = 'true';
END;
$$ LANGUAGE plpgsql STABLE;

-- Macro policy: Tenant Matches OR System Worker
CREATE POLICY tenant_isolation_orgs ON organizations
FOR ALL USING (id = get_current_tenant_id() OR is_system_worker());

CREATE POLICY tenant_isolation_memberships ON memberships
FOR ALL USING (organization_id = get_current_tenant_id() OR is_system_worker());

CREATE POLICY tenant_isolation_locations ON locations
FOR ALL USING (organization_id = get_current_tenant_id() OR is_system_worker());

CREATE POLICY tenant_isolation_vehicles ON vehicles
FOR ALL USING (organization_id = get_current_tenant_id() OR is_system_worker());

CREATE POLICY tenant_isolation_customers ON customers
FOR ALL USING (organization_id = get_current_tenant_id() OR is_system_worker());

CREATE POLICY tenant_isolation_orders ON orders
FOR ALL USING (organization_id = get_current_tenant_id() OR is_system_worker());

CREATE POLICY tenant_isolation_route_plans ON route_plans
FOR ALL USING (organization_id = get_current_tenant_id() OR is_system_worker());

CREATE POLICY tenant_isolation_route_stops ON route_stops
FOR ALL USING (organization_id = get_current_tenant_id() OR is_system_worker());

CREATE POLICY tenant_isolation_delivery_events ON delivery_events
FOR SELECT USING (organization_id = get_current_tenant_id() OR is_system_worker());

CREATE POLICY tenant_isolation_delivery_events_insert ON delivery_events
FOR INSERT WITH CHECK (organization_id = get_current_tenant_id() OR is_system_worker());

CREATE POLICY tenant_isolation_incidents ON incidents
FOR ALL USING (organization_id = get_current_tenant_id() OR is_system_worker());

CREATE POLICY tenant_isolation_optimization_jobs ON optimization_jobs
FOR ALL USING (organization_id = get_current_tenant_id() OR is_system_worker());

CREATE POLICY tenant_isolation_plan_diffs ON plan_diffs
FOR ALL USING (organization_id = get_current_tenant_id() OR is_system_worker());

CREATE POLICY tenant_isolation_customer_notifications ON customer_notifications
FOR ALL USING (organization_id = get_current_tenant_id() OR is_system_worker());

CREATE POLICY tenant_isolation_fleet_briefings ON fleet_briefings
FOR ALL USING (organization_id = get_current_tenant_id() OR is_system_worker());

CREATE POLICY tenant_isolation_audit_events_select ON audit_events
FOR SELECT USING (organization_id = get_current_tenant_id() OR is_system_worker());

CREATE POLICY tenant_isolation_audit_events_insert ON audit_events
FOR INSERT WITH CHECK (organization_id = get_current_tenant_id() OR is_system_worker());

CREATE POLICY tenant_isolation_idempotency_records ON idempotency_records
FOR ALL USING (organization_id = get_current_tenant_id() OR is_system_worker());

CREATE POLICY tenant_isolation_vehicle_positions ON vehicle_positions
FOR ALL USING (organization_id = get_current_tenant_id() OR is_system_worker());

CREATE POLICY tenant_isolation_incident_approvals ON incident_approvals
FOR ALL USING (organization_id = get_current_tenant_id() OR is_system_worker());

CREATE POLICY tenant_isolation_plan_versions ON plan_versions
FOR ALL USING (organization_id = get_current_tenant_id() OR is_system_worker());

CREATE POLICY tenant_isolation_optimization_metrics ON optimization_metrics
FOR ALL USING (organization_id = get_current_tenant_id() OR is_system_worker());

CREATE POLICY tenant_isolation_delivery_change_records ON delivery_change_records
FOR ALL USING (organization_id = get_current_tenant_id() OR is_system_worker());

CREATE POLICY tenant_isolation_generated_audio ON generated_audio
FOR ALL USING (organization_id = get_current_tenant_id() OR is_system_worker());

-- 5. Permissions: Grant app_runtime least privilege access
GRANT USAGE ON SCHEMA public TO app_runtime;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_runtime;
-- Revoke DELETE and UPDATE on immutable audit and delivery event tables
REVOKE UPDATE, DELETE ON audit_events FROM app_runtime;
REVOKE UPDATE, DELETE ON delivery_events FROM app_runtime;
