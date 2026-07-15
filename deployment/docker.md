# Docker Deployment

From the repository root:

```bash
cp .env.example .env
cp ctrl-sea-backend/.env.example ctrl-sea-backend/.env
docker compose up --build
```

Default local endpoints:

- Frontend: `http://127.0.0.1:3000`
- Backend: `http://127.0.0.1:8000`

For production, set a real `DATABASE_URL`, strong `JWT_SECRET`, explicit `CORS_ORIGINS`, and provider-managed secrets.
