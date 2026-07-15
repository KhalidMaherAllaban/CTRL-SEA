# Docker

Docker assets are intentionally kept close to their services:

- Frontend Dockerfile: `ctrl-sea-frontend/Dockerfile`
- Backend Dockerfile: `ctrl-sea-backend/Dockerfile`
- Compose file: `docker-compose.yml`

Run the full stack from the repository root:

```bash
docker compose up --build
```

Generated build output, local environments, logs, and dependency directories are excluded through `.gitignore` and service `.dockerignore` files.
