# Azure App Service Deployment

Recommended production layout:

- Frontend: Azure Static Web Apps, Azure App Service, or Vercel.
- Backend: Azure App Service for Containers using `ctrl-sea-backend/Dockerfile`.
- Database: Azure SQL Database or reachable SQL Server instance.

Backend app settings:

```text
ENVIRONMENT=production
DATABASE_URL=your-azure-sql-sqlalchemy-url
JWT_SECRET=generate-a-strong-secret-of-at-least-32-characters
CORS_ORIGINS=https://your-frontend-domain
FRONTEND_URL=https://your-frontend-domain
AUTH_COOKIE_SAMESITE=none
```

When frontend and backend are on different domains, use HTTPS only and confirm cookie settings in the browser.
