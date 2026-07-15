# CTRL SEA Frontend

Next.js 15 enterprise UI for the CTRL SEA Maritime Intelligence Platform.

## Quick Start

```bash
npm install
copy .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Environment

```env
NEXT_PUBLIC_API_URL=/api
BACKEND_API_URL=http://127.0.0.1:8000/api
```

The maritime experience uses ArcGIS-powered components for the login globe and geospatial command experience. Configure `ARCGIS_API_KEY` only when your ArcGIS organization, basemap, or hosted services require one.

Protected App Router pages are guarded by Next middleware and then authorized by FastAPI HTTP-only cookie sessions. Power BI reports are configured by the backend and rendered through the responsive `PowerBIContainer` and `PowerBIReportViewer` components.

## Deployment On Vercel

1. Import this folder as the Vercel project root.
2. Keep `NEXT_PUBLIC_API_URL=/api` and set `BACKEND_API_URL` to the backend `/api` URL.
3. Build command: `npm run build`.
