# Architecture

## What Was Built

The project uses a monorepo:

```text
apps/web       Next.js PWA
packages/db    Supabase schema, migrations, RLS notes
packages/importer
packages/analytics
packages/progression
packages/sync
packages/export
packages/shared
```

Supabase Postgres/Auth/RLS is the system of record. PowerSync is the planned offline-first sync layer. Local mock adapters let the app run before external services are configured.

## Phase 2 Additions

Phase 2 adds shared Zod schemas, canonical seed constants, demo exercise seed constants, and a local mock store. These make the app testable before Supabase and PowerSync are connected.

## How To Run It

```powershell
cd E:\workout-pwa
npm.cmd run dev
```

## How To Test It

```powershell
npm.cmd test
npm.cmd run build
```

## What To Review

Review `apps/web/components/app-shell.tsx` for the first usable app shell and `packages/db/migrations/0001_initial_schema.sql` before creating tables in Supabase.

Review `packages/shared/src/index.ts` for canonical seed values and `packages/sync/src/index.ts` for local mock records.

## Common Errors And Fixes

If Supabase is not ready, keep `NEXT_PUBLIC_USE_LOCAL_MOCKS=true`.
