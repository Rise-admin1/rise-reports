# Installation & Release Guide

## Prerequisites

- Node.js and npm
- Xcode (iOS Simulator) for local native runs
- Expo account and EAS CLI for cloud builds (`npm i -g eas-cli` or use `npx eas`)
- Apple Developer account and App Store Connect access (iOS submit)

This app is **iOS-only** for the documented release workflow.

---

## 1. Clone

```bash
git clone https://github.com/Rise-admin1/rise-reports.git
cd rise-reports
```

---

## 2. Install & local iOS run

```bash
npm install
```

The API base URL is hardcoded in `services/api.ts` as `https://future.funyula.com/api`. There is no env / sample.env file for this project.

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

## 3. EAS Build (`production`, iOS)

```bash
eas login
```

The EAS project is already linked via `app.json` / `eas.json`.

```bash
eas build --platform ios --profile production
```

When complete, download artifacts from the Expo / EAS dashboard.

---

## 4. EAS Submit — iOS

After a successful iOS production build:

```bash
eas submit --platform ios --profile production
```

This uses the iOS fields in `eas.json` under `submit.production` (`appleId`, `ascAppId`, `appleTeamId`).

Then finish the App Store Connect listing and submit for review if anything remains incomplete.
