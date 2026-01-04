# n8n Workflow Import Guide

## Quick Import Steps

### 1. Import All Workflows

**From n8n Dashboard:**

1. Click **"Workflows"** in the left sidebar (home icon)
2. Click the **"+"** button (top right) → Select **"Import from file"**
3. Navigate to your server's workflow directory or upload from local:
   ```bash
   # If on VPS, workflows are at:
   /path/to/MetaNews/n8n-workflows/
   ```
4. Import **all 4 files** one by one:
   - `WF-01-ingestion.json`
   - `WF-02-intelligence.json`
   - `WF-03-gatekeeper.json`
   - `WF-04-distribution.json`

**Alternative (Easier):** Upload from your local machine:
1. Download the 4 JSON files from GitHub
2. Use n8n's import dialog to upload each file

---

## 2. Configure Credentials

After importing, you need to set up credentials for each workflow.

### Required Credentials:

#### A. **Google Gemini API** (for WF-02)
1. Go to **Settings** (bottom left) → **Credentials**
2. Click **"+ Add Credential"**
3. Search for **"Google** Gemini"**
4. Enter your **API Key** from `.env` file
5. Name it: `Google Gemini` (must match workflow reference)

> **Note:** The workflows use latest Gemini models:
> - `gemini-flash-lite-latest` (fast classification)
> - `gemini-pro-latest` (verification for high severity)

#### B. **PostgreSQL** (for WF-03, WF-04)
1. Add new credential → **"Postgres"**
2. Configure:
   ```
   Host: postgres (container name)
   Database: metanews
   User: metanews
   Password: (from your .env DB_POSTGRESDB_PASSWORD)
   Port: 5432
   SSL: Disable (internal network)
   ```
3. Name it: `Postgres`

#### C. **Redis** (for WF-02)
1. Add new credential → **"Redis"**
2. Configure:
   ```
   Host: redis
   Port: 6379
   Password: (leave empty if not set in .env)
   Database Number: 0
   ```
3. Name it: `Redis`

#### D. **Telegram Bot** (for WF-04, optional)
1. Get bot token from [@BotFather](https://t.me/BotFather)
2. Add credential → **"Telegram"**
3. Enter bot token
4. Name it: `Telegram`

---

## 3. Activate Workflows

### Order matters! Activate in this sequence:

1. **WF-03 Gatekeeper** (must be ready to receive from WF-02)
2. **WF-02 Intelligence** (must be ready to receive from WF-01)
3. **WF-01 Ingestion** (starts the pipeline)
4. **WF-04 Distribution** (optional, for Telegram alerts)

**How to activate:**
1. Open each workflow
2. Toggle the **"Active"** switch (top right, next to Save button)
3. Verify it shows **"Active"** status

---

## 4. Test First Run

After activating WF-01, it will run on a cron schedule (every 2 minutes).

**To test immediately:**
1. Open **WF-01 Ingestion**
2. Click **"Execute Workflow"** button (play icon)
3. Watch the execution panel for results

**Check logs:**
```bash
# View n8n logs
docker compose logs -f n8n

# Check if events are in database
docker compose exec postgres psql -U metanews -c "SELECT COUNT(*) FROM events;"
```

---

## 5. Verify Feed

After workflows run successfully:
1. Wait ~2-5 minutes for first ingestion cycle
2. Refresh your feed: http://94.16.122.69:3005/feed
3. Events should appear!

---

## Troubleshooting

### "Credential not found" error
- Credential names in JSON must **exactly match** what you created
- Default expected names:
  - `Google Gemini` (for Gemini API)
  - `Postgres` (for database)
  - `Redis` (for cache)

### Workflows don't trigger
- Check that WF-01 is **Active** (toggle in top right)
- Verify cron schedule is set (every 2 minutes)
- Check n8n logs: `docker compose logs n8n`

### No events in database
- Check WF-02 credentials (Gemini API key valid?)
- Verify PostgreSQL connection
- Check source URLs are accessible from VPS

### Database connection fails
- From n8n container, PostgreSQL host should be: `postgres` (not `localhost`)
- Port: `5432`
- Make sure containers are on same network

---

## Quick Command Reference

```bash
# View all logs
docker compose logs -f

# Restart n8n if needed
docker compose restart n8n

# Check database
docker compose exec postgres psql -U metanews -c "SELECT id, title, severity FROM events LIMIT 5;"

# Check workflow executions
# (Use n8n UI: Executions tab)
```
