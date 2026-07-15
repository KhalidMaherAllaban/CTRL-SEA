# Render or Railway Backend Deployment

Service root: `ctrl-sea-backend`

Start command:

```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

Required environment variables:

```text
ENVIRONMENT=production
DATABASE_URL=your-production-sqlalchemy-url
JWT_SECRET=generate-a-strong-secret-of-at-least-32-characters
CORS_ORIGINS=https://your-frontend.example.com
FRONTEND_URL=https://your-frontend.example.com
POWER_BI_REPORTS_JSON=[]
```

Optional integrations:

```text
GOOGLE_OAUTH_CLIENT_ID=
GOOGLE_OAUTH_CLIENT_SECRET=
GOOGLE_OAUTH_REDIRECT_URI=
```

Make sure the hosted backend can reach SQL Server over the network and that ODBC Driver 18 is available in the runtime image.
