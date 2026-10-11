-- Migration 001: Enable PostGIS extension (TRD §5.5)
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
