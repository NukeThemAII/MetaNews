# MetaNews

**Real-time OSINT & Market Intelligence — signal only.**

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![n8n](https://img.shields.io/badge/automation-n8n-orange.svg)](https://n8n.io)
[![PostgreSQL](https://img.shields.io/badge/database-PostgreSQL-blue.svg)](https://postgresql.org)

MetaNews is an autonomous intelligence platform that monitors global events, markets, incidents, and technology in near real-time, filters noise using AI, and delivers only what materially matters.

> Signal over noise. Speed over comfort. Facts over opinion.

---

## ✨ Features

- **Live OSINT Ingestion** — Wars, disasters, incidents from trusted sources
- **Market-Moving Alerts** — Stocks, crypto, commodities
- **AI-Scored Events** — Severity (0-100) + Confidence (0-1)
- **Tiered Access** — Free delayed feed + Premium real-time alerts
- **Telegram Bot** — Instant notifications for premium users
- **Semantic Search** — Find related events using embeddings

---

## 🏗️ Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Sources   │────▶│    n8n      │────▶│  PostgreSQL │
│ RSS/API/TG  │     │  Workflows  │     │  + pgvector │
└─────────────┘     └──────┬──────┘     └──────┬──────┘
                           │                   │
                    ┌──────▼──────┐     ┌──────▼──────┐
                    │  Gemini +   │     │   Next.js   │
                    │   GPT-4o    │     │   Frontend  │
                    └─────────────┘     └─────────────┘
```

---

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- API keys: Gemini, OpenAI, Telegram Bot

### Installation

```bash
# Clone repository
git clone https://github.com/NukeThemAII/MetaNews.git
cd MetaNews

# Configure environment
cp .env.example .env
# Edit .env with your API keys

# Start services
docker compose up -d

# Check status
docker compose ps
```

### Import Workflows

1. Open n8n at `http://localhost:5678`
2. Login with credentials from `.env`
3. Go to **Workflows → Import**
4. Import files from `n8n-workflows/`:
   - `WF-01-ingestion.json`
   - `WF-02-intelligence.json`
   - `WF-03-gatekeeper.json`
   - `WF-04-distribution.json`
5. Configure credentials (PostgreSQL, Redis, Gemini, etc.)
6. Activate workflows

---

## 📁 Project Structure

```
MetaNews/
├── .env.example          # Environment template
├── docker-compose.yml    # Full stack configuration
├── db/
│   └── schema.sql        # Database schema
├── n8n-workflows/        # Importable workflow JSONs
│   ├── WF-01-ingestion.json
│   ├── WF-02-intelligence.json
│   ├── WF-03-gatekeeper.json
│   └── WF-04-distribution.json
├── frontend/             # Next.js application (TBD)
├── nginx/                # Reverse proxy config (TBD)
├── GEMINI.md             # Full specification
├── AUDIT.md              # Technical audit
├── TODO.md               # Roadmap
└── LOG.md                # Development log
```

---

## 🛠️ Tech Stack

| Component | Technology |
|-----------|------------|
| Automation | n8n Community Edition |
| AI Models | Gemini 1.5 Flash, GPT-4o |
| Database | PostgreSQL 16 + pgvector |
| Cache | Redis 7 |
| Frontend | Next.js 14, Tailwind CSS |
| Infra | Docker, Nginx |

---

## 📊 Scoring System

| Severity | Meaning | Action |
|----------|---------|--------|
| 80-100 | Market-moving | Instant alert |
| 60-79 | Significant | Premium feed |
| 40-59 | Moderate | Free feed (delayed) |
| 0-39 | Low | Discarded |

Events with confidence < 0.5 are automatically discarded.

---

## 📚 Documentation

- **[GEMINI.md](GEMINI.md)** — Full build specification
- **[AUDIT.md](AUDIT.md)** — Technical audit & recommendations
- **[TODO.md](TODO.md)** — Roadmap & tasks

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Log your work in `LOG.md`
5. Submit a pull request

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgments

- [n8n](https://n8n.io) — Workflow automation
- [GDELT Project](https://gdeltproject.org) — Global event data
- [pgvector](https://github.com/pgvector/pgvector) — Vector similarity search
