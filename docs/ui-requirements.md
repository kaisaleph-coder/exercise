# UI Requirements

## What Was Built

The web app includes routes for:

1. `/login`
2. `/dashboard`
3. `/workout/today`
4. `/program`
5. `/progression`
6. `/import`
7. `/analytics`
8. `/devices`
9. `/settings`

The shell includes the persistent timer ribbon, workout notes, collapsible workout exercises, set completion, complete-exercise-to-rest behavior, program day reorder controls, progression skip toggle, import review warnings, device conflict resolver, and exercise database grouped by muscle group.

## How To Run It

```powershell
cd E:\workout-pwa
npm.cmd run dev
```

## How To Test It

Open `http://localhost:3000/dashboard`, then click through every route.

## What To Review

Compare the live screens to `prototype/index.html`. The current app is a production scaffold, not final visual polish.

## Common Errors And Fixes

If the timer ribbon does not appear, click Start workout first and keep the Settings ribbon toggle enabled.
