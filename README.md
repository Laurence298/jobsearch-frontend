# JobTracker frontend

React/Vite frontend for JobTrackerServer.

On mobile, each profile has four bottom tabs (Jobs, Resumes, Search, Settings)
and an expandable taskbar for switching profiles, notifications, and account actions.
Resume-first setup accepts text, PDF, or DOCX uploads. Resume layout preferences
and per-job overrides require the matching JobTrackerServer API and migration.

## Development

Run `npm install` and `npm run dev`. Browser API requests use `/api` by default;
the Vite dev server forwards them to `http://localhost:8000`. If the backend is
on another host, set `VITE_DEV_API_TARGET=http://<host>:8000` in `.env` and keep
`VITE_API_BASE_URL=/api` (or leave it unset).

## Docker deployment

The frontend container uses `API_BASE_URL=/api` by default. Its Nginx proxies
`/api/*` over the `shared-proxy` Docker network to `jobtracker-app:8000`,
stripping `/api` before forwarding. Both Compose stacks must join that network.
Rebuild/redeploy the frontend after changing `nginx.conf` or the startup script.

Use `/api` for the browser URL even when the frontend is served over HTTPS.
An `http://10.x.x.x:8000` browser URL can be blocked by mixed-content, CORS, or
private-network restrictions even when the backend's `/health` endpoint responds.
The backend's `ROOT_PATH=/api` setting supports the proxied path.
