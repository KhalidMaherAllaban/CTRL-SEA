# CTRL SEA Architecture

CTRL SEA is a Next.js command interface backed by a read-optimized FastAPI service and the `ITI_Graduation_PortWatch` SQL Server warehouse.

## Boundaries

- Frontend owns user experience, route guards, dashboard composition, charts, Power BI embedding, and browser-only Leaflet rendering.
- Backend owns HTTP-only cookie authentication, API contracts, validation, cached warehouse queries, logging, and operational health checks.
- SQL Server is the maritime source of truth. The API only creates/updates `AppUser`; warehouse tables are read-only.

## Data Model

The warehouse exposes five dimensions and nine fact tables under `portwatch_dw`. Generated SQLAlchemy mappings document those objects while optimized SQL handles large analytical aggregations.

## Deployment Pattern

The frontend can run on Vercel or another Next.js host. With the current Windows Authentication connection, the API must run where `localhost\SQLEXPRESS` and the Windows identity are available. A remote Linux deployment requires a reachable SQL Server endpoint and a supported authentication strategy.
