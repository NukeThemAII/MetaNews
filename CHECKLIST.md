# Pre-Deployment Checklist

**Before deploying to VPS, verify:**

## ✅ Code Review

- [x] **Feed UI** connected to PostgreSQL (no more mock data)
- [x] **Server-side rendering** with Next.js App Router
- [x] **Category filtering** via URL params
- [x] **Database queries** typed and optimized
- [x] **Docker configuration** complete
- [x] **Network segregation** (frontend-net / backend-net)

## ✅ Required for VPS

### 1. Environment Variables
Copy `.env.example` → `.env` and fill in:
- `GEMINI_API_KEY` (for AI classification)
- `OPENAI_API_KEY` (for verification)
- `TELEGRAM_BOT_TOKEN` (for alerts)
- `N8N_ENCRYPTION_KEY` (generate: `openssl rand -hex 32`)
- `N8N_BASIC_AUTH_PASSWORD` (secure password)
- `DB_POSTGRESDB_PASSWORD` (secure password)

### 2. Domain (Recommended)
- Point `metanews.yourdomain.com` → VPS IP
- Point `n8n.yourdomain.com` → VPS IP (for admin access)

### 3. SSL Certificates
After deployment, run:
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get certificates
sudo certbot --nginx -d metanews.yourdomain.com -d n8n.yourdomain.com
```

## ⚠️ Known Limitations

1. **Feed will be empty** until n8n workflows are activated and run
2. **No authentication yet** — anyone can access the feed
3. **No Stripe integration** — payment system not implemented
4. **No real-time updates** — requires manual refresh

## 🚀 Deployment Steps

See `DEPLOY.md` for detailed instructions.

Quick version:
```bash
git clone https://github.com/NukeThemAII/MetaNews.git
cd MetaNews
cp .env.example .env
# Edit .env with real values
docker compose up -d
```

## 🔍 Post-Deployment Verification

```bash
# Check all containers running
docker compose ps

# Should see 6 containers:
# - metanews-n8n
# - metanews-postgres
# - metanews-redis
# - metanews-frontend
# - metanews-nginx
# - metanews-backup

# Test endpoints
curl -I http://localhost:3000       # Frontend
curl -I http://localhost:5678       # n8n
```

## 📝 Next Steps After Deployment

1. Import n8n workflows from `n8n-workflows/`
2. Activate workflows in n8n UI
3. Wait for first ingestion cycle (2 minutes)
4. Verify events in database: `docker compose exec postgres psql -U metanews -c "SELECT COUNT(*) FROM events;"`
5. Check feed at `http://your-vps-ip:3000/feed`
