# Development Log

## 2026-01-05 (Audit Fixes & Hardening)

### n8n Pipeline Stabilization
- **WF-01:** Processes all RSS items, uses SHA-256 source_hash, and posts to internal webhook URL.
- **WF-02:** Fixed Redis cache usage, added retry routing, stricter validation, and improved verification merge logic.
- **WF-03:** Uses promoted_at for tier gating, posts to distribution via internal webhook, and returns full event payloads.
- **WF-04:** Escapes HTML, normalizes summary/entities, and writes alert logs with full fields.

### Config & Security Hardening
- Aligned env/compose (N8N_INTERNAL_URL, Telegram channels, Redis auth) and clarified .env guidance.
- Hardened Nginx headers and OCSP resolver configuration.
- Enforced free-tier delay at the DB query layer and normalized JSON arrays in backend.

### Documentation
- Updated GETTING-STARTED, DEPLOY, CHECKLIST, and N8N-IMPORT-GUIDE to match the new env variables and workflow wiring.
- Added CODEX.md audit report with prioritized fixes.

## 2026-01-05 (Production Deployment)

### n8n Workflows - Production Ready
- **WF-01 Ingestion:** Created with 13 curated RSS feeds (news, crypto, tech, security)
  - Al Jazeera, BBC, NYT, Guardian, DW (global news)
  - CNBC, MarketWatch (markets)
  - Cointelegraph, CoinDesk (crypto)
  - TechCrunch, The Verge (tech)
  - The Record, The Hacker News (security)
- **WF-02 Intelligence:** Fixed for latest n8n (LangChain googleGemini nodes)
  - Models: `gemini-2.5-flash-lite` (10 RPM), `gemini-2.5-flash` (5 RPM)
  - Optimized for free tier rate limits
- **Deployment:** Successfully running on Ubuntu VPS (94.16.122.69)
  - Frontend: Port 3005
  - n8n: Port 5678
  - All services healthy

### Repository Cleanup
- Consolidated audit files → single `AUDIT.md`
- Removed redundant docs (`AUDITgemini.md`, `WORK.md`, `SUMMARY.md`)
- Cleaned up temporary scripts

## 2026-01-03 (Agent Session - Optimization)

### Configuration Updates
- **Free Tier Enforcement:** Modified `n8n-workflows/WF-02-intelligence.json` to replace `GPT-4o` with `Gemini 1.5 Pro` for verification. This ensures the entire AI pipeline runs on Google's free tier.
- **Environment:** Updated `.env` to disable OpenAI/Anthropic keys and configure `CORS_ORIGINS` and `WEBHOOK_URL` for `earngrid.xyz` and the production IP.
- **Documentation:** Updated `GEMINI.md` to reflect the "All-Gemini" architecture and cost savings ($0.00/event).

## 2026-01-03 (Agent Session - Continued)

### Frontend Development
- **Dynamic Feed:** Refactored `frontend/app/feed/page.tsx` to fetch real data from PostgreSQL using `lib/db.ts`.
- **Filtering:** Implemented server-side category filtering via URL search params.
- **Components:** Verified `EventCard` integration.
- **Cleanup:** Removed static mock data to ensure the system is "Real-time" ready.

### Next Steps
- Verify the `events` table is populated (requires running the n8n ingestion workflow).
- Implement the "Alerts" configuration UI.
- Set up real-time updates (polling or WebSocket).

## 2026-01-03 (Agent Session - Initial)

### Frontend Scaffolding
- Initialized Next.js 14 project structure in `frontend/`.
- Created Dockerfile for production-ready frontend build.
- Installed dependencies: React, Tailwind CSS, Recharts, Framer Motion, Lucide React.
- Configured TypeScript, Tailwind, and PostCSS.
- Created base UI components: `Card`, `Button`, `Badge`.
- Implemented `layout.tsx` and `page.tsx` with a modern landing page design.

### Infrastructure
- Verified `docker-compose.yml` aligns with the new frontend.
- Validated `db/schema.sql` and `n8n-workflows/`.
