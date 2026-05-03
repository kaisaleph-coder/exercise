# Git Setup

The GitHub repository URL is:

```text
https://github.com/kaisaleph-coder/exercise.git
```

## What Is Still Needed

1. Initialize this folder as a Git repo.
2. Set a Git author name and email.
3. Add the GitHub URL as the `origin` remote.
4. Make the first commit.
5. Push to GitHub.

## Commands

Run these from:

```powershell
cd E:\workout-pwa
```

Initialize the repo:

```powershell
git init
```

Set your Git author identity for this repo:

```powershell
git config user.name "Your Name"
git config user.email "your-email@example.com"
```

Add the GitHub remote:

```powershell
git remote add origin https://github.com/kaisaleph-coder/exercise.git
```

Create the first commit:

```powershell
git add .
git commit -m "Build workout PWA foundation"
```

Push to GitHub:

```powershell
git branch -M main
git push -u origin main
```

## Authentication

GitHub CLI is not installed on this machine, but Git Credential Manager is configured through Git for Windows. When you push, a browser login window may open. Sign in to the GitHub account that has access to the repo.

## Do Not Commit Private Files

The `.gitignore` already excludes:

```text
.env
.env.local
data/source/*.xlsx
data/exports/*.xlsx
```

Keep your real workbook, Supabase secrets, and exported workout backups out of Git.
