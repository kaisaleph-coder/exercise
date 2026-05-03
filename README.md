# Workout Logger PWA

This repo is the foundation for a private, login-protected, Android-installable workout logging PWA. It is designed to replace an Excel workout workbook while preserving source-row audit data and using cleaner app-calculated volume rules.

## What Is Built

Phase 1 plus tested foundations are in place:

1. Monorepo with `apps/web` and typed packages.
2. Next.js App Router PWA shell with routes for login, dashboard, workout, program, progression, import, analytics, devices, and settings.
3. PWA manifest, service worker, and icon placeholders.
4. Supabase client adapter and PowerSync status adapter.
5. Supabase SQL migration with tables, enums, indexes, triggers, seed muscle groups, and RLS policies.
6. Tested TypeScript modules for importer rules, volume/analytics, progression recommendations, sync conflicts, export sheet modeling, and workout timer/reorder state.
7. Beginner setup docs and required documentation scaffolding.
8. Dependency audit cleanup: current install reports zero vulnerabilities.

## How To Run It

Run these commands in this folder:

```powershell
cd E:\workout-pwa
npm.cmd install
copy .env.example .env.local
npm.cmd run dev
```

Then open:

```text
http://localhost:3000/dashboard
```

If you use a terminal where `npm` works normally, `npm install` and `npm run dev` are also fine. On this Windows machine, `npm.cmd` avoids a PowerShell script policy issue.

## How To Test It

Run unit tests:

```powershell
cd E:\workout-pwa
npm.cmd test
```

Run a production build:

```powershell
cd E:\workout-pwa
npm.cmd run build
```

The current verified result is:

```text
6 test files passed
25 tests passed
Next.js production build passed
```

## Environment Variables

Copy `.env.example` to `.env.local`.

```text
NEXT_PUBLIC_SUPABASE_URL
```

Your Supabase project URL.

```text
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

Your public Supabase anon key. Do not use a service-role key in the browser.

```text
NEXT_PUBLIC_POWERSYNC_URL
```

Your PowerSync instance URL after setup.

```text
NEXT_PUBLIC_USE_LOCAL_MOCKS=true
```

Keep this as `true` until Supabase and PowerSync are connected.

## Database Setup

1. Create a Supabase project.
2. Open Supabase SQL Editor.
3. Copy and run:

```text
packages/db/migrations/0001_initial_schema.sql
```

4. Confirm the `muscle_groups` table contains Chest, Back, Shoulders, Biceps, Triceps, Core, and Legs.
5. Add your Supabase URL and anon key to `.env.local`.

## What To Review

1. Open every app route and confirm the layout matches your expected workflow.
2. Review `packages/db/migrations/0001_initial_schema.sql` before running it in Supabase.
3. Review importer tests in `packages/importer/tests/importer.test.ts`.
4. Confirm bodyweight/calisthenics are excluded from resistance volume.
5. Confirm unilateral volume is doubled only in analytics, not by changing the logged load.
6. Review Git setup steps in `docs/git-setup.md` before the first commit.

## Common Errors And Fixes

### `npm` is blocked in PowerShell

Use:

```powershell
npm.cmd install
```

### Missing `.env.local`

Create it:

```powershell
copy .env.example .env.local
```

### Supabase is not connected yet

Keep:

```text
NEXT_PUBLIC_USE_LOCAL_MOCKS=true
```

The app will run in local demo mode.

### Package install is slow or fails

Check your internet connection and rerun:

```powershell
npm.cmd install
```

### npm audit warnings

The current dependency tree reports zero vulnerabilities with:

```powershell
npm.cmd audit --audit-level=moderate
```

Do not run `npm audit fix --force` casually because it can introduce breaking dependency upgrades.

### ExcelJS is not installed yet

The current export package builds the required workbook model, but the real ExcelJS parser/writer will be added during the importer/export implementation phase. This avoids carrying an unused dependency with a vulnerable transitive `uuid` package before the app actually needs it.
