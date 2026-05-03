# Start Here For Novice Users

This guide assumes you are new to Node, Supabase, environment variables, and PWAs.

## Step 1: Open The Project Folder

Open a PowerShell terminal and run:

```powershell
cd E:\workout-pwa
```

## Step 2: Install The App Tools

Run:

```powershell
npm.cmd install
```

This downloads the app’s required packages into a folder named `node_modules`.

## Step 3: Create Your Local Settings File

Run:

```powershell
copy .env.example .env.local
```

For now, leave this line set to true:

```text
NEXT_PUBLIC_USE_LOCAL_MOCKS=true
```

That lets you try the app before Supabase and PowerSync are connected.

## Step 4: Start The App

Run:

```powershell
npm.cmd run dev
```

Wait until the terminal shows a local web address, usually:

```text
http://localhost:3000
```

Open:

```text
http://localhost:3000/dashboard
```

## Step 5: Try The Main Screens

1. Open Dashboard.
2. Click Start workout.
3. Open Workout.
4. Complete a set.
5. Complete an exercise and confirm the rest timer appears.
6. Open Program and reorder a day.
7. Open Progression and toggle skip progression.
8. Open Import Review and resolve warnings.
9. Open Analytics and review the export sheet count.
10. Open Devices and try the conflict resolver buttons.
11. Open Settings and review exercise metadata.

## Step 6: Run Tests

Stop the dev server with `Ctrl+C`, then run:

```powershell
npm.cmd test
```

You should see all tests pass.

## Step 7: Build The App

Run:

```powershell
npm.cmd run build
```

This checks that the app can compile for production.

## Step 8: Set Up Supabase Later

When you are ready:

1. Create a Supabase project.
2. Open the SQL Editor.
3. Run the migration in:

```text
packages/db/migrations/0001_initial_schema.sql
```

4. Copy your Supabase URL and anon key into `.env.local`.
5. Change local mocks only after Supabase and PowerSync are ready.

## Step 9: Add The Excel Workbook Later

Do not commit your private workbook to GitHub.

When import work begins, put it here:

```text
data/source/Exercises - Final(2).xlsx
```

## Common Beginner Fixes

If `npm` is blocked, use `npm.cmd`.

If the app says Supabase is not configured, keep local mock mode on.

If the browser says the site cannot be reached, make sure `npm.cmd run dev` is still running.

If install fails, rerun `npm.cmd install` from `E:\workout-pwa`.
