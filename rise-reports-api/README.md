# rise-reports-api

Express BFF + auth API for the rise-reports Expo app.

## What it does

- App roles: `SUPER_ADMIN`, `ADMIN`, `USER`
- Account management (Super Admin)
- Session auth (Bearer tokens)
- Local task CRUD (shared visibility for all authenticated roles; assignees are app accounts)
- Proxies report/scheduling calls to upstream backends
- Does **not** proxy Vault (Expo still talks to mch-mp Vault directly)

## Setup

1. Copy `.env.example` to `.env`
2. Set `DATABASE_URL` and `SHADOW_DATABASE_URL`
3. Adjust upstream URLs if needed
4. Install and migrate:

```bash
npm install
npx prisma migrate dev --name init
npm run seed
npm run dev
```

API default: `http://localhost:4100`

## Key routes

- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `GET|POST|PATCH|DELETE /api/users` (Super Admin)
- Tasks (any authenticated role):
  - `GET /api/rise-reports/task-assignees`
  - `GET /api/rise-reports/get-tasks`
  - `POST /api/rise-reports/create-task`
  - `POST /api/rise-reports/update-task`
  - `DELETE /api/rise-reports/delete-task`
- Proxied: `/api/rise-reports/reports`, `/api/volunteer/*`, `/api/scheduling/*`, `/api/rise/*`
