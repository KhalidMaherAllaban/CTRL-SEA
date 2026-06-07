# CTRL SEA Architecture

CTRL SEA is organized as a frontend application, backend API, and analytics-oriented data model.

## Boundaries

- Frontend owns user experience, dashboard composition, client-side auth state, charts, and map rendering.
- Backend owns authentication, API contracts, data access, service orchestration, and operational health checks.
- Database owns durable maritime intelligence entities and facts.

## Data Model

The SQL schema follows a star-schema pattern with dimensions for dates, countries, ports, vessels, chokepoints, routes, industries, scenarios, hazards, and disruption events. Fact tables capture daily port metrics, congestion, chokepoint activity, trade flows, climate risk, trade risk, disruptions, spillover, and supply-chain dependency.

## Deployment Pattern

Use Vercel/Netlify for frontend hosting and Render/Railway or another container platform for the FastAPI backend. Use provider-managed secrets for all environment variables.
