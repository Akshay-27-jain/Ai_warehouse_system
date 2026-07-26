# Database Design for AI Warehouse Optimization System

This directory contains the PostgreSQL schema, seed data, and supporting architecture documentation for the enterprise warehouse optimization platform.

## Contents
- Schema definitions: [services/api/migrations/001_create_schema.sql](../../services/api/migrations/001_create_schema.sql)
- Seed data: [services/api/migrations/002_seed_data.sql](../../services/api/migrations/002_seed_data.sql)
- ER diagram: [docs/database/er_diagram.md](er_diagram.md)
- Relationship map: [docs/database/relationships.md](relationships.md)
- Performance plan: [docs/database/performance_optimization.md](performance_optimization.md)

## Design Principles
- Fully normalized relational model
- Strong foreign key integrity
- Explicit indexes and constraints
- Auditability through dedicated audit and notification tables
- Support for forecasting, inventory, transfers, and sales workflows
