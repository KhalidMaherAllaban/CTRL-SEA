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
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token
```

Without a Mapbox token, the map component still renders the maritime overlays on a dark fallback canvas. Add a token for the full Mapbox globe basemap.

## Deployment On Vercel

1. Import this folder as the Vercel project root.
2. Set `NEXT_PUBLIC_API_URL` to the Render backend URL plus `/api`.
3. Set `NEXT_PUBLIC_MAPBOX_TOKEN`.
4. Build command: `npm run build`.

