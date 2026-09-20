# ResQSync — Vercel deployment

This package is prepared to run the ResQSync frontend and Flask API on the same
Vercel deployment.

## 1. Database

The Flask API uses MySQL. Vercel does not provide a persistent MySQL server, so
use an external MySQL-compatible database and import:

`database/resqsync.sql`

Set these Vercel environment variables:

- `RESQ_DB_HOST`
- `RESQ_DB_PORT` (usually `3306`)
- `RESQ_DB_USER`
- `RESQ_DB_PASSWORD`
- `RESQ_DB_NAME` (usually `resqsync`)

Optional:
- `RESQ_HARDWARE_KEY`
- `RESQ_GPS_STALE_SECONDS`
- `RESQ_NODE_TIMEOUT_SECONDS`
- `RESQ_CORRIDOR_RADIUS_M`
- `RESQ_ROUTE_DETOUR_FACTOR`
- `RESQ_DEFAULT_SPEED_KMH`

## 2. Deploy

Upload this folder/repository to Vercel and deploy with the project root set to
the folder containing `vercel.json`.

The frontend uses a same-origin API, so production requests go to:

`/api/...`

The Vercel Python function is:

`api/index.py`

## 3. Important architecture note

Vercel's Python runtime is serverless. The existing ResQSync design already uses
HTTP polling rather than a persistent WebSocket server, so the dashboard can
work through Vercel's function runtime.

Hardware devices can POST to:

`https://YOUR-DOMAIN/api/hardware/vehicle`

and

`https://YOUR-DOMAIN/api/hardware/node`

If `RESQ_HARDWARE_KEY` is configured, send the expected hardware authentication
header used by the existing backend.

## 4. Local development

The original Flask development workflow remains available:

```bash
cd backend
pip install -r requirements.txt
python -m flask --app app run --host 127.0.0.1 --port 5000
```

For local frontend development, serve the project root with a static HTTP server.

## 5. Production security

The original project intentionally has `REQUIRE_AUTH: false`. This package keeps
that behavior so the existing demo works, but it should not be treated as
production authentication. Add real authentication/authorization before exposing
control endpoints to the public internet.

Also configure a strong `RESQ_HARDWARE_KEY` and restrict database access to the
provider/network you use.
