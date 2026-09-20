# ResQSync

Single GitHub repository containing separate deployment targets.

## Deployment layout

- `frontend/` -> deploy this directory on Vercel.
- `backend/` + root Railway files -> deploy on Railway.
- `database/` -> MySQL schema/setup.
- `hardware_examples/` -> hardware integration examples.
- `tests/` -> backend tests.

## Backend URL

Frontend is configured to call:

https://resqsync-backend-production.up.railway.app

## Vercel

Create a Vercel project from this GitHub repository and set:

**Root Directory:** `frontend`

No frontend build command is required.

## Railway

Keep the Railway service pointed at the repository root so the existing `Procfile`,
`requirements.txt`, and backend layout continue to work.

## CORS

On Railway, set the backend environment variable:

`RESQ_CORS_ORIGINS=https://YOUR-PROJECT.vercel.app`

If using a custom domain, include it as an additional comma-separated origin.

After changing environment variables, redeploy/restart the Railway service.
