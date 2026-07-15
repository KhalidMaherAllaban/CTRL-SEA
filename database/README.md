# Database

CTRL SEA uses a SQL Server maritime analytics warehouse.

Current SQL assets live in:

- `ctrl-sea-backend/sql/schema.sql`
- `ctrl-sea-backend/sql/warehouse_performance_indexes.sql`
- `ctrl-sea-backend/migrations/`

The FastAPI backend validates connectivity at startup and uses SQLAlchemy for database access. Production deployments should use a managed SQL Server or Azure SQL instance with least-privilege credentials.
