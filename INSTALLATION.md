# Installation & Release Guide

This repository contains two packages: `rise-reports-api` (BFF / auth API) and `fe-reports-expo` (Expo iOS app). App traffic (except Vault) goes through the BFF. When `EXPO_PUBLIC_APP_API_URL` is unset, the Expo app defaults to the hosted BFF at `https://rise-reports.onrender.com/api`. Running `rise-reports-api` locally is optional for development.

## Prerequisites

- Node.js and npm
- PostgreSQL (for `rise-reports-api` Prisma)
- Xcode (iOS Simulator) for local native runs
- Expo account and EAS CLI for cloud builds (`npm i -g eas-cli` or use `npx eas`)
- Apple Developer account and App Store Connect access (iOS submit)

The documented release workflow is **iOS-only**.

---

## 1. Clone

```bash
git clone https://github.com/Rise-admin1/rise-reports.git
cd rise-reports
```

---

## 2. API — `rise-reports-api`

Optional for local development — the production app default targets the hosted BFF.

```bash
cd rise-reports-api
cp .env.sample .env
```

Fill in `.env` (do not commit it). At minimum set:

- `DATABASE_URL`
- `SHADOW_DATABASE_URL`
- `PORT` (default listen port is `4100`)
- Upstream URLs and admin credentials as needed for proxied services

Then install, migrate, seed, and run:

```bash
npm install
npx prisma generate
npx prisma migrate dev
npm run seed
npm run dev
```

API default base: `http://localhost:4100` (routes under `/api/...`).

For a non-watch process: `npm start`.

---

## 3. Expo app — `fe-reports-expo`

From the repo root (or `cd ../fe-reports-expo` if you are still in the API folder):

```bash
cd fe-reports-expo
cp .env.sample .env
```

Set (or leave blank to use code defaults in `services/api.ts`):

- `EXPO_PUBLIC_APP_API_URL` — BFF base including `/api`. If unset, defaults to `https://rise-reports.onrender.com/api`. For a local BFF, set to `http://<lan-ip>:4100/api` (or `http://localhost:4100/api` only if that address reaches the BFF from the runtime).
- `EXPO_PUBLIC_VAULT_API_URL` — Vault host (not proxied by the BFF). If unset, defaults to `https://future.funyula.com/api`.

`.env` is gitignored; `.env.sample` is the template (keys only).

```bash
npm install
```

### Run on iOS Simulator

Requires Xcode and an available simulator:

```bash
npm run ios
# or
npx expo run:ios
```

### Metro only (after a native binary exists)

```bash
npm start
# or
npx expo start
```

---

## 4. EAS Build (`production`, iOS)

Run from `fe-reports-expo/` (where `app.json` / `eas.json` live):

```bash
cd fe-reports-expo
eas login
```

The EAS project is already linked via `app.json` / `eas.json`.

```bash
eas build --platform ios --profile production
```

When complete, download artifacts from the Expo / EAS dashboard.

---

## 5. EAS Submit — iOS

After a successful iOS production build, from `fe-reports-expo/`:

```bash
eas submit --platform ios --profile production
```

This uses the iOS fields in `eas.json` under `submit.production` (`appleId`, `ascAppId`, `appleTeamId`).

Then finish the App Store Connect listing and submit for review if anything remains incomplete.
