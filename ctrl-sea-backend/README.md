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

## Local Auth Credentials

In `development`, startup seeds the first local admin if the user table is empty:

```text
Email: admin@ctrlsea.com
Password: Admin12345!
```

Registered users are promoted to `admin` only when they are the first user in an empty database. Later users become `analyst`.

Run the auth smoke test while the API is running:

```bash
python -m scripts.auth_smoke_test
```

Safely recreate a corrupted local SQLite database with a timestamped backup:

```bash
python -m scripts.reset_dev_db
```

## SQL Server

Create the warehouse using `sql/schema.sql`, then set `DATABASE_URL`:

```env
DATABASE_URL=mssql+pyodbc://USER:PASSWORD@SERVER/ctrl_sea?driver=ODBC+Driver+18+for+SQL+Server&TrustServerCertificate=yes
```

## Deployment On Render

1. Create a Render Web Service from this folder.
2. Build command: `pip install -r requirements.txt`
3. Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Add environment variables from `.env.example`.
5. Keep `runtime.txt` at Python 3.12 for stable Pandas and SQL Server ODBC wheels.
