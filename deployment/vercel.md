# Vercel Frontend Deployment

Project root: `ctrl-sea-frontend`

Build command:

```bash
npm run build
```

Output is managed by Next.js.

Required environment variables:

```text
NEXT_PUBLIC_API_URL=/api
BACKEND_API_URL=https://your-backend.example.com/api
NEXT_PUBLIC_SITE_URL=https://your-frontend.example.com
ARCGIS_API_KEY=optional-if-your-ArcGIS-services-require-it
```

Use Vercel project secrets for all environment variables. Do not expose backend secrets through `NEXT_PUBLIC_*`.
