---
description: Git commands for pushing to GitHub (PowerShell)
---

# Git Push Workflow

PowerShell doesn't support `&&` chain operator. Run commands separately.

## Quick Push (Copy-Paste Ready)

```powershell
# Stage all changes
git add -A

# Commit with message
git commit -m "Your commit message here"

# Push to remote
git push origin main
```

## Check Status First

```powershell
git status
```

## If you need to pull first

```powershell
git pull origin main
```

## Force push (use with caution)

```powershell
git push origin main --force
```
