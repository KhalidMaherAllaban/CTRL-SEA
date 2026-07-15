# Reliable local development

CTRL SEA has two supported local workflows. The Windows launcher is the default when SQL Server Express uses Windows authentication. Docker Compose is intended for a SQL Server reachable over TCP with SQL authentication.

## What startup guarantees

`start-all.bat` performs the following sequence:

1. Validates the backend `.env`, frontend `.env.local`, Python virtual environment, Node.js, and installed Next.js package.
2. Detects listeners on ports 8000 and 3000. It leaves unrelated processes alone and chooses the next free port (up to 99 ports higher).
3. Injects the selected backend URL into the frontend build and runtime environment.
4. Starts FastAPI and waits for `/health` to report `status: healthy` after SQL Server connection retries.
5. Starts Next.js only after the backend and database are ready, then checks the frontend health route.
6. Records the selected ports and owned process IDs in `.runtime/local-processes.json`.

This ordering prevents the browser from opening against a backend that has not finished starting.

## First-time Windows setup

Prerequisites:

- Python 3.12
- Node.js 22 and npm
- SQL Server or SQL Server Express with the `ITI_Graduation_PortWatch` database
- Microsoft ODBC Driver 18 for SQL Server

From the repository root:

```bat
copy ctrl-sea-backend\.env.example ctrl-sea-backend\.env
copy ctrl-sea-frontend\.env.example ctrl-sea-frontend\.env.local
py -3.12 -m venv ctrl-sea-backend\.venv
ctrl-sea-backend\.venv\Scripts\python.exe -m pip install -r ctrl-sea-backend\requirements.txt
cd ctrl-sea-frontend
npm install
cd ..
```

Review `ctrl-sea-backend/.env`. The default connection targets `localhost\SQLEXPRESS` with Windows authentication. Set a unique `JWT_SECRET`; production refuses the placeholder secret.

## Everyday workflow

Start everything from Explorer or a terminal:

```bat
start-all.bat
```

The command prints the actual frontend and backend URLs. If port 8000 is occupied, output will look similar to:

```text
Port 8000 is occupied by PID 1234; backend will use 8001.
Frontend: http://127.0.0.1:3000
Backend:  http://127.0.0.1:8001
```

The frontend proxy is already configured for that selected port. Do not edit `.env.local` to match it.

To reuse an existing frontend build while iterating on Python:

```bat
start-all.bat -SkipBuild
```

If the selected backend port changed since that build, the launcher ignores `-SkipBuild` once and rebuilds automatically so the proxy can never retain a stale port.

Stop only the processes started by the launcher:

```bat
stop-all.bat
```

## Health and recovery behavior

- Backend health: `GET http://127.0.0.1:<backend-port>/health`
- Expected payload: `{"status":"healthy","service":"ctrl-sea-api","database":"connected"}`
- Frontend health: `GET http://127.0.0.1:<frontend-port>/health`
- API reads retry three times with exponential backoff for network errors and HTTP 5xx responses.
- The browser checks backend health every five seconds. During an outage it shows **Backend Offline** and reconnects automatically instead of throwing or redirecting the user as if their session expired.
- Mutating API requests are not automatically replayed, preventing duplicate registrations, logins, ETL jobs, or simulations.

## Startup validation and logs

FastAPI validates non-empty `DATABASE_URL`, `JWT_SECRET`, and `CORS_ORIGINS` settings. At startup it retries the SQL Server connection according to:

```text
STARTUP_MAX_ATTEMPTS=8
STARTUP_RETRY_SECONDS=2
```

Runtime diagnostics are stored in:

```text
.runtime/backend.log
.runtime/backend.err.log
.runtime/frontend.log
.runtime/frontend.err.log
.runtime/startup-failures.log
.runtime/frontend-runtime.env
```

When startup fails, the launcher also prints the last 30 lines of available logs. Backend logs are JSON, so each failure has a timestamp, severity, logger, message, and exception trace.

## SQL Server troubleshooting

If health never becomes ready:

1. Open Windows Services and confirm the configured SQL Server instance is running.
2. Confirm `DATABASE_URL` names the correct instance and database.
3. Run `Get-OdbcDriver | Where-Object Name -Like '*SQL Server*18*'` and install ODBC Driver 18 if absent.
4. Check `.runtime/backend.err.log` for login, instance, certificate, or missing-database details.
5. Verify the database schema exists before starting CTRL SEA.

The API intentionally does not report healthy when SQL Server is unavailable; this keeps the frontend from presenting stale “Warehouse live” state.

## Docker Compose

Linux containers cannot use the Windows integrated-authentication URL from the normal backend `.env`. Configure SQL Server for TCP and SQL authentication, then create the root Compose environment file:

```bat
copy .env.compose.example .env
```

Edit `DOCKER_DATABASE_URL`, then run:

```bat
docker compose up --build -d
docker compose ps
docker compose logs -f backend frontend
```

Compose waits for backend `/health` before starting the frontend and restarts unhealthy processes according to Docker policy. Stop it with:

```bat
docker compose down
```

If a published host port is occupied, set `BACKEND_PORT` or `FRONTEND_PORT` in the root `.env`; container-to-container routing remains `backend:8000` and requires no frontend changes.

## Direct development servers

For hot reload in separate terminals, start the backend first and wait for health:

```powershell
cd ctrl-sea-backend
.\.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Then start the frontend:

```powershell
cd ctrl-sea-frontend
$env:BACKEND_API_URL = "http://127.0.0.1:8000/api"
npm run dev
```

The one-command launcher is preferred for routine work because it validates dependencies, handles ports, and captures logs.

## Verification

```powershell
cd ctrl-sea-backend
.\.venv\Scripts\python.exe -m pytest -q

cd ..\ctrl-sea-frontend
npm test
npm run lint
npm run build
```
