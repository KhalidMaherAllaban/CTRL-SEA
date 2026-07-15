# Environment Configuration

## Backend

- `DATABASE_URL`: SQLAlchemy SQL Server URL. The default uses Windows Authentication against `localhost\SQLEXPRESS/ITI_Graduation_PortWatch`.
- `JWT_SECRET`: minimum 32 characters in production.
- `ACCESS_TOKEN_EXPIRE_MINUTES`: short-lived access cookie lifetime; default 30.
- `REFRESH_TOKEN_EXPIRE_DAYS`: refresh lifetime; default 14.
- `AUTH_COOKIE_SECURE`: automatically forced on in production.
- `AUTH_COOKIE_SAMESITE`: `lax`, `strict`, or `none`.
- `CORS_ORIGINS`: comma-separated allowed frontend origins.
- `POWER_BI_REPORTS_JSON`: JSON array containing `id`, `title`, `description`, `embed_url`, `workspace`, optional `pages`, and optional `page_labels`.
- `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`, `GOOGLE_OAUTH_REDIRECT_URI`: optional Google sign-in configuration.
- `SEED_ADMIN_*`: development-only optional identity seeding. Production disables it.

Never place secrets in `NEXT_PUBLIC_*` variables. Do not commit `.env` or `.env.local`.

## Frontend

- `NEXT_PUBLIC_API_URL`: browser API prefix; normally `/api`.
- `BACKEND_API_URL`: server-side rewrite target.
- `NEXT_PUBLIC_SITE_URL`: canonical frontend URL used for metadata.
- `ARCGIS_API_KEY`: optional ArcGIS API key when your ArcGIS organization or services require one.

No Mapbox token is required. Do not put private ArcGIS, Power BI, OpenAI, Google, or database credentials in browser-readable variables.
