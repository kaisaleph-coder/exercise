# Troubleshooting

## Install Problems

Run commands from:

```powershell
cd E:\workout-pwa
```

Use `npm.cmd` on Windows PowerShell:

```powershell
npm.cmd install
```

## App Will Not Start

Run:

```powershell
npm.cmd run dev
```

Then open:

```text
http://localhost:3000/dashboard
```

## Tests Will Not Run

Run:

```powershell
npm.cmd test
```

If dependencies are missing, rerun `npm.cmd install`.

## Supabase Is Not Ready

Keep this in `.env.local`:

```text
NEXT_PUBLIC_USE_LOCAL_MOCKS=true
```

## Import Workbook Missing

Place the private workbook at:

```text
data/source/Exercises - Final.xlsx
```

Do not commit it to GitHub.

Check that Git is ignoring it:

```powershell
git status --short --ignored data/source
```

You should see the workbook with `!!`, which means it is ignored.
