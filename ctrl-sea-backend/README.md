# CTRL SEA Backend

FastAPI service for the CTRL SEA Maritime Intelligence Platform.

## Stack

- FastAPI
- SQLAlchemy 2.x
- Pydantic Settings
- JWT authentication
- Pandas CSV ingestion
- SQL Server via `pyodbc`

## Quick Start

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload
```

API docs are available at `http://localhost:8000/docs`.

Authentication tokens are issued only through secure HTTP-only cookies. Access tokens default to 30 minutes and are rotated through the refresh endpoint.

## Local Authentication

User registration creates analyst accounts. Optional development admin seeding is disabled by default and uses the `SEED_ADMIN_*` environment variables when explicitly enabled.

Run the auth smoke test while the API is running:

```bash
python -m scripts.auth_smoke_test
```

The legacy SQLite reset helper refuses to run against SQL Server and is not part of the warehouse workflow.

```bash
python -m scripts.reset_dev_db
```

## SQL Server

The warehouse must already exist. `sql/schema.sql` validates the required tables without modifying them. Configure `DATABASE_URL`:

```env
DATABASE_URL=mssql+pyodbc://@localhost\SQLEXPRESS/ITI_Graduation_PortWatch?driver=ODBC+Driver+18+for+SQL+Server&trusted_connection=yes&TrustServerCertificate=yes
```

## Deployment On Render

The default `localhost\SQLEXPRESS` Windows Authentication connection cannot work from a remote Render container. Use these steps only after providing a reachable SQL Server endpoint and supported service identity.

1. Create a Render Web Service from this folder.
2. Build command: `pip install -r requirements.txt`
3. Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Add environment variables from `.env.example`.
5. Keep `runtime.txt` at Python 3.12 for stable Pandas and SQL Server ODBC wheels.
