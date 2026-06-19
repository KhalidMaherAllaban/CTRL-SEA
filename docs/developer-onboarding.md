# Developer Onboarding

## Prerequisites

- Node.js 20+
- Python 3.12+
- SQL Server Express and ODBC Driver 18
- Access to `ITI_Graduation_PortWatch`

## Start locally

```powershell
cd ctrl-sea-backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
uvicorn app.main:app --reload --port 8000
```

```powershell
cd ctrl-sea-frontend
npm install
Copy-Item .env.example .env.local
npm run dev
```

## Required checks

```powershell
cd ctrl-sea-backend
python -m compileall -q app scripts
python -m pytest -q
python -m pip check

cd ..\ctrl-sea-frontend
npm run lint
npm test
npm run build
npm audit --omit=dev
```

Do not add demo datasets, Mapbox imports, browser-readable auth tokens, or writes to `portwatch_dw`.
