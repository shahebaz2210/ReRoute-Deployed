# DispatchX Database Migrations

Numbered, deterministic SQL and Drizzle migrations for PostgreSQL 16 + PostGIS:
- `001_postgis.sql`: Enable PostGIS spatial extensions
- `002_enums.sql`: System domain enums
- Subsequent table definitions with GiST spatial indexes and check constraints.
