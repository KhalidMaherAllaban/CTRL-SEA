# CTRL SEA Deployment Notes

## Local Preview Recovery

Run this from PowerShell:

```powershell
cd "C:\Users\mohamed ellaban\Documents\Codex\CTRL-SEA"
.\scripts\recover-preview.ps1
```

The script rebuilds the Next.js frontend, starts FastAPI on `127.0.0.1:8000`, starts Next.js on `127.0.0.1:3000`, creates a Cloudflare quick tunnel, verifies `/health`, and writes the public URL to `preview-url.txt`.

For automatic recovery while developing:

```powershell
.\scripts\watch-preview.ps1
```

## Temporary vs Persistent Cloudflare Tunnel

Quick tunnel URLs like `*.trycloudflare.com` are temporary. They can disappear when the process exits, the network changes, or Cloudflare rotates the temporary hostname.

For a persistent tunnel:

```powershell
cloudflared tunnel login
cloudflared tunnel create ctrl-sea
cloudflared tunnel route dns ctrl-sea app.your-domain.com
cloudflared tunnel run ctrl-sea
```

Use `cloudflared-config.example.yml` as the config template.

## Production Recommendation

- Frontend: Vercel or Netlify.
- Backend: Render or Railway.
- Set frontend `NEXT_PUBLIC_API_URL` to the deployed backend `/api` URL, or keep the same-origin `/api` rewrite if frontend and backend are proxied together.
- Set backend `CORS_ORIGINS` to the production frontend URL.
- Set backend `ENVIRONMENT=production`, a strong `JWT_SECRET`, and a persistent `DATABASE_URL`.
