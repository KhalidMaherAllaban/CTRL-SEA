# Deployment Runbook

1. Validate SQL Server connectivity with `sqlcmd` and run `ctrl-sea-backend/sql/schema.sql`.
2. Install ODBC Driver 18 and backend packages from `requirements.txt`.
3. Set a production JWT secret, secure cookies, explicit CORS origins, and Power BI report metadata.
4. Run `python -m pytest -q` and `python -m pip check`.
5. Build the frontend with `npm ci && npm run build`.
6. Start FastAPI on an internal interface and proxy `/api` through Next.js or the ingress layer.
7. Verify `/health`, authentication, `/api/dashboard`, `/api/map/layers`, and logout.

## SQL Server constraint

`localhost\SQLEXPRESS` with Windows Authentication is machine-local. A cloud container cannot use that address to reach the workstation database. Production must either run the API on an authorized Windows host beside SQL Server or use a secured network SQL Server endpoint with an approved service identity.

## Rollback

Application rollback is a code/image rollback. Warehouse APIs are read-only, and `sql/schema.sql` performs validation only. Preserve the `AppUser` table when rolling back the application.
