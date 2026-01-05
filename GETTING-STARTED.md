# MetaNews Deployment Guide

## Production Instance

**Live Demo:** http://94.16.122.69:3005/feed  
**VPS:** Ubuntu (Docker)  
**Services:** n8n, PostgreSQL, Redis, Next.js, Nginx

## Quick Start (Local)

```bash
git clone https://github.com/NukeThemAII/MetaNews.git
cd MetaNews
cp .env.example .env
# Edit .env with your API keys and channels
# - GEMINI_API_KEY
# - TELEGRAM_BOT_TOKEN
# - TELEGRAM_PREMIUM_CHANNEL / TELEGRAM_FREE_CHANNEL
docker compose up -d
```

Visit:
- **Frontend:** http://localhost:3005
- **n8n:** http://localhost:5678

## n8n Workflow Setup

1. **Import workflows** from `n8n-workflows/`:
   - WF-01-ingestion.json (RSS feed polling)
   - WF-02-intelligence.json (AI analysis)
   - WF-03-gatekeeper.json (filtering)
   - WF-04-distribution.json (Telegram alerts)

2. **Configure credentials:**
   - Google Gemini API (free tier)
   - PostgreSQL (auto-configured)
   - Redis (auto-configured)
   - Telegram Bot _(optional)_

3. **Activate in order:**
   - WF-03 → WF-02 → WF-01 → WF-04

See [N8N-IMPORT-GUIDE.md](N8N-IMPORT-GUIDE.md) for details.

## RSS Feeds Included

**13 curated sources** (all free):
- **News:** Al Jazeera, BBC, NYT, Guardian, DW
- **Markets:** CNBC, MarketWatch
- **Crypto:** Cointelegraph, CoinDesk
- **Tech:** TechCrunch, The Verge
- **Security:** The Record, The Hacker News

## VPS Deployment

See [DEPLOY.md](DEPLOY.md) for production setup.

**Ports:**
- 8082 (HTTP)
- 8443 (HTTPS)
- 5678 (n8n - dev only)

## Architecture

```
RSS Feeds → WF-01 → Redis Cache → WF-02 (AI) → WF-03 (Filter) → PostgreSQL → Frontend
                                                                        ↓
                                                                   WF-04 (Telegram)
```

## Documentation

- [GEMINI.md](GEMINI.md) - System specification
- [AUDIT.md](AUDIT.md) - Production audit (Grade: A)
- [CHECKLIST.md](CHECKLIST.md) - Pre-deployment checklist
- [LOG.md](LOG.md) - Development changelog
- [TODO.md](TODO.md) - Roadmap

## Cost

**Monthly:** ~$7-14 (VPS only)
- AI: $0 (Gemini free tier)
- Database: $0 (self-hosted PostgreSQL)
- SSL: $0 (Let's Encrypt)

## License

MIT
