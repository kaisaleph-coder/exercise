# Novice Setup Guide

This guide is for a nontechnical user. The final app repository should expand this file with exact commands after Codex creates the code.

## Things you may need

- A private GitHub repository or local project folder.
- Node.js LTS.
- A Supabase account/project.
- Codex access.
- Your private Excel workbook.

## Important safety rules

- Keep the repository private.
- Do not upload `.env` files to GitHub.
- Do not share Supabase service-role keys.
- Do not commit the Excel workbook unless the repository is private and you intentionally want it there.

## Expected local commands

Codex should confirm the exact commands. They will generally look like:

```bash
npm install
cp .env.example .env.local
npm run dev
npm test
```

## Where to place the workbook

```text
data/source/Exercises - Final(2).xlsx
```

## What to review first

1. Login works.
2. Dashboard loads.
3. Workout logger opens.
4. Timer ribbon appears after starting a workout.
5. Import review flags data before commit.
6. Analytics are separated into resistance and bodyweight/calisthenics.
# Current Setup

Use the root `START_HERE_FOR_NOVICE.md` first. The current commands are:

```powershell
cd E:\workout-pwa
npm.cmd install
copy .env.example .env.local
npm.cmd run dev
```
