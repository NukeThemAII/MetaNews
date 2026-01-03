# MetaNews — Technical Audit & Recommendations

**Audit Date:** 2026-01-03  
**Auditor:** Gemini Agent  
**Scope:** Repository state, architecture, n8n patterns, industry standards

---

## Executive Summary

MetaNews is in **early specification stage** with strong conceptual foundations but minimal implementation. The `GEMINI.md` spec is well-structured. This audit identifies gaps, optimizations, and industry-standard patterns to accelerate production readiness.

| Area | Status | Priority |
|------|--------|----------|
| Core Spec | ✅ Solid | — |
| n8n Workflows | ⚠️ Skeleton only | High |
| Database Schema | ⚠️ Missing indexes | Medium |
| Frontend | ❌ Not started | High |
| Security | ⚠️ Not addressed | Critical |
| Observability | ❌ Missing | High |
| DevOps | ⚠️ Incomplete | Medium |

---

## 1. Repository Structure Analysis

### Current State

```
MetaNews/
├── GEMINI.md      # Master spec (excellent)
├── README.md      # Basic overview
├── TODO.md        # Task list
├── LOG.md         # Empty dev log
└── n8n.json       # Workflow skeleton (not importable)
```

### Issues Found

1. **`n8n.json` is not valid n8n export format**  
   The current file is a high-level description, not an importable workflow. n8n requires specific node structure.

2. **No `.env.example`** — README references it but doesn't exist.

3. **No `docker-compose.yml`** — GEMINI.md mentions Docker but no compose file exists.

4. **No frontend code** — Next.js app not scaffolded.

### Recommendations

```diff
+ Add .env.example with all required variables
+ Add docker-compose.yml for full stack
+ Add /frontend directory with Next.js scaffold
+ Add /n8n-workflows directory with actual exportable JSON
+ Add /db directory with schema.sql and migrations
+ Add .github/workflows for CI/CD
```

---

## 2. n8n Workflow Audit

### Industry Best Practices (2024/2025)

| Best Practice | Current Status | Recommendation |
|---------------|----------------|----------------|
| Modular workflows | ❌ | Split into 4+ focused sub-workflows |
| Error handling | ❌ | Add Error Trigger nodes, retry logic |
| Queue mode (Redis) | Mentioned | Implement for production scale |
| PostgreSQL backend | Mentioned | Required for production |
| Version control | ⚠️ | Export workflows as JSON to Git |
| Environment separation | ❌ | Add staging/production configs |
| Batch processing | ❌ | Use SplitInBatches for large feeds |

### Workflow Improvements

#### WF-01: Ingestion (Watcher)
```yaml
Current Issues:
  - No rate limiting for external APIs
  - No backoff strategy for failures
  - Missing content normalization pipeline

Recommended Additions:
  - Add HTTP Request retry with exponential backoff
  - Add RateLimiter node or custom Function
  - Add data validation before Redis check
  - Add source_quality scoring per feed
  - Add circuit breaker pattern for failing sources
```

#### WF-02: Intelligence (Analyst)
```yaml
Current Issues:
  - Dual-LLM (Gemini + GPT) adds latency and cost
  - No caching for repeated content patterns
  - No fallback if one LLM fails

Recommended Pattern:
  1. Use Gemini Flash for initial classification (fast/cheap)
  2. GPT-5.2 only for severity >= 60 events (cost optimization)
  3. Add semantic cache (Redis + embedding similarity)
  4. Implement structured output validation (Pydantic-style)
  5. Add LLM fallback chain (Gemini → GPT → Claude)
```

#### WF-03: Gatekeeper (Filter)
```yaml
Current Issues:
  - Static thresholds may miss important edge cases
  - No feedback loop for threshold calibration

Recommended Additions:
  - Add dynamic thresholds per category
  - Add anomaly detection for unusual patterns
  - Log discarded events for analysis
  - Add override mechanism for manual review queue
```

#### WF-04: Distribution
```yaml
Current Issues:
  - No message queuing for high volume
  - No delivery confirmation tracking
  - No template versioning

Recommended Additions:
  - Add message queue (Redis/RabbitMQ)
  - Add delivery status tracking
  - Add A/B testing for alert formats
  - Add user preference routing
```

---

## 3. Database Schema Improvements

### Current Schema Issues

```sql
-- Missing: Indexes for common queries
-- Missing: Full-text search support
-- Missing: Audit/history tables
-- Missing: User/subscription tables
-- Missing: Source management tables
```

### Recommended Schema Additions

```sql
-- Performance indexes
CREATE INDEX idx_events_category ON events(category);
CREATE INDEX idx_events_severity ON events(severity DESC);
CREATE INDEX idx_events_published ON events(published_at DESC);
CREATE INDEX idx_events_created ON events(created_at DESC);
CREATE INDEX idx_events_market_impact ON events(market_impact);

-- Composite indexes for common queries
CREATE INDEX idx_events_category_severity 
  ON events(category, severity DESC) 
  WHERE confidence >= 0.5;

-- Full-text search
CREATE INDEX idx_events_title_fts ON events USING gin(to_tsvector('english', title));

-- GiST index for geo queries
CREATE INDEX idx_events_geo ON events USING gist(
  ST_MakePoint((geo->>'lon')::float, (geo->>'lat')::float)
);

-- Source management table (NEW)
CREATE TABLE sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'rss', 'api', 'telegram'
  reliability_score DECIMAL(3,2) DEFAULT 0.5,
  last_fetch TIMESTAMPTZ,
  fetch_interval INTEGER DEFAULT 120, -- seconds
  is_active BOOLEAN DEFAULT true,
  config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User & subscription tables (for paywall)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  telegram_id BIGINT UNIQUE,
  tier VARCHAR(20) DEFAULT 'free', -- 'free', 'premium', 'enterprise'
  stripe_customer_id VARCHAR(255),
  preferences JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  plan VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit log for compliance
CREATE TABLE event_audit (
  id BIGSERIAL PRIMARY KEY,
  event_id UUID REFERENCES events(id),
  action VARCHAR(20) NOT NULL, -- 'created', 'updated', 'promoted', 'deleted'
  changes JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 4. Security Audit

> [!CAUTION]
> **No security measures are currently documented or implemented.**

### Critical Security Requirements

| Area | Requirement | Status |
|------|-------------|--------|
| API Keys | Environment variables | ❌ Not documented |
| Credentials | Encrypted storage | ❌ Not implemented |
| RBAC | Role-based access | ❌ Missing |
| TLS/SSL | All traffic encrypted | ❌ Not configured |
| Rate Limiting | API protection | ❌ Missing |
| Input Validation | Prevent injection | ❌ Not implemented |
| Audit Logging | Track all access | ❌ Missing |

### Recommended Security Implementation

```yaml
# .env.example (CREATE THIS)
# n8n
N8N_ENCRYPTION_KEY=          # 32-char random string
N8N_BASIC_AUTH_USER=
N8N_BASIC_AUTH_PASSWORD=

# Database
DB_HOST=postgres
DB_PORT=5432
DB_NAME=metanews
DB_USER=
DB_PASSWORD=                  # Use secrets manager

# LLM APIs
GEMINI_API_KEY=
OPENAI_API_KEY=

# Telegram
TELEGRAM_BOT_TOKEN=

# Payments
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Redis
REDIS_URL=redis://redis:6379

# Security
JWT_SECRET=
CORS_ORIGINS=https://metanews.app
```

---

## 5. Observability & Monitoring

### Current State: **None**

### Recommended Stack

```mermaid
graph LR
    n8n -->|metrics| Prometheus
    NextJS -->|traces| Prometheus
    Prometheus --> Grafana
    n8n -->|logs| Loki
    Grafana -->|alerts| PagerDuty/Slack
```

### Key Metrics to Track

```yaml
Ingestion:
  - events_ingested_total (counter)
  - events_deduplicated_total (counter)
  - source_fetch_duration_seconds (histogram)
  - source_error_rate (gauge per source)

AI Processing:
  - llm_latency_seconds (histogram per model)
  - llm_token_usage_total (counter)
  - llm_cost_usd (counter)
  - schema_validation_failures (counter)

Distribution:
  - alerts_sent_total (counter)
  - telegram_delivery_success_rate (gauge)
  - premium_vs_free_ratio (gauge)

Business:
  - active_premium_users (gauge)
  - mrr_usd (gauge)
  - churn_rate (gauge)
```

---

## 6. LangChain / AI Orchestration

### Current Spec Analysis

The GEMINI.md specifies:
- Gemini Flash → GPT-5.2 verification chain
- LangChain via n8n Advanced AI

### Industry Best Practices (2024/2025)

| Practice | Recommendation |
|----------|----------------|
| Cost optimization | Use cheaper models for classification, expensive for synthesis |
| Caching | Semantic cache for similar content (Redis + embeddings) |
| Fallbacks | Chain of fallback models (Gemini → GPT → Claude) |
| Structured output | Use Pydantic/JSON schema validation |
| Observability | LangSmith or custom tracing |
| Version control | Version prompts separately from code |

### Recommended AI Pipeline

```mermaid
graph TD
    Input[Raw Event] --> Classify[Gemini Flash: Classify]
    Classify -->|severity < 40| Discard[Discard]
    Classify -->|40-79| Cache{Semantic Cache?}
    Classify -->|>= 80| Priority[Priority Queue]
    Cache -->|hit| Output[Output]
    Cache -->|miss| Analyze[GPT-5.2: Deep Analysis]
    Priority --> Analyze
    Analyze --> Validate{Schema Valid?}
    Validate -->|yes| Output
    Validate -->|no| Retry[Retry w/ Correction]
    Retry --> Analyze
```

### Cost Optimization Model

```yaml
Current (per event):
  Gemini Flash: ~$0.0001 (classifier)
  GPT-5.2: ~$0.003 (analyzer)
  Total: ~$0.0031/event

With Smart Routing (estimate):
  70% discarded by classifier: $0.0001
  20% cached: $0.0001
  10% full analysis: $0.0031
  Weighted avg: ~$0.0004/event (87% savings)
```

---

## 7. Frontend Architecture

### Recommended Stack (per GEMINI.md)

```
/frontend
├── app/                    # Next.js App Router
│   ├── (public)/           # Marketing pages
│   ├── (app)/              # Authenticated app
│   ├── api/                # API routes
│   └── layout.tsx
├── components/
│   ├── feed/               # Event feed components
│   ├── charts/             # Recharts visualizations
│   └── ui/                 # Base UI components
├── lib/
│   ├── api.ts              # API client
│   ├── auth.ts             # Auth utilities
│   └── hooks/              # Custom hooks
└── styles/
    └── globals.css         # Tailwind config
```

### Key Pages Needed

| Page | Purpose | Priority |
|------|---------|----------|
| `/` | Landing page | High |
| `/feed` | Live event feed | Critical |
| `/event/[id]` | Event detail | High |
| `/map` | Geo visualization | Medium |
| `/alerts` | Alert management | Medium |
| `/pricing` | Subscription tiers | High |
| `/dashboard` | User dashboard | Medium |

---

## 8. DevOps & Deployment

### Recommended `docker-compose.yml`

```yaml
version: '3.8'

services:
  n8n:
    image: n8nio/n8n:latest
    ports:
      - "5678:5678"
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=${N8N_USER}
      - N8N_BASIC_AUTH_PASSWORD=${N8N_PASSWORD}
      - DB_TYPE=postgresdb
      - DB_POSTGRESDB_HOST=postgres
      - DB_POSTGRESDB_DATABASE=${DB_NAME}
      - DB_POSTGRESDB_USER=${DB_USER}
      - DB_POSTGRESDB_PASSWORD=${DB_PASSWORD}
      - EXECUTIONS_MODE=queue
      - QUEUE_BULL_REDIS_HOST=redis
    volumes:
      - n8n_data:/home/node/.n8n
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

  postgres:
    image: pgvector/pgvector:pg15
    environment:
      - POSTGRES_DB=${DB_NAME}
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./db/init.sql:/docker-entrypoint-initdb.d/init.sql
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    restart: unless-stopped

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/${DB_NAME}
      - NEXT_PUBLIC_API_URL=http://localhost:5678
    depends_on:
      - n8n
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/certs:/etc/nginx/certs
    depends_on:
      - frontend
      - n8n
    restart: unless-stopped

volumes:
  n8n_data:
  postgres_data:
  redis_data:
```

---

## 9. Immediate Action Items

### Phase 1: Foundation (Week 1)

- [ ] Create `.env.example` with all required variables
- [ ] Create `docker-compose.yml` 
- [ ] Create `db/schema.sql` with full schema + indexes
- [ ] Scaffold Next.js frontend
- [ ] Create actual n8n workflow exports

### Phase 2: Core (Week 2-3)

- [ ] Implement WF-01 (Ingestion) with error handling
- [ ] Implement WF-02 (Intelligence) with caching
- [ ] Implement WF-03 (Gatekeeper) 
- [ ] Build basic feed UI
- [ ] Set up Telegram bot

### Phase 3: Production (Week 4)

- [ ] Implement WF-04 (Distribution)
- [ ] Add observability (Prometheus + Grafana)
- [ ] Implement paywall (Stripe)
- [ ] Security hardening
- [ ] Deploy to VPS

---

## 10. Ideas & Enhancements

### Quick Wins

1. **RSS Aggregation Optimization** — Use n8n's built-in RSS Poll Trigger instead of manual HTTP + parse
2. **Telegram Read-Only Bridge** — Use MTProto library for real-time vs polling
3. **Event Deduplication** — Use MinHash/LSH for fuzzy matching, not just URL hash

### Medium-Term

1. **Entity Resolution Pipeline** — Link related events (e.g., multiple reports of same incident)
2. **Trending Detection** — Identify rapid severity increases across sources
3. **Source Reliability Scoring** — Track accuracy per source, weight accordingly

### Long-Term Vision

1. **Predictive Analytics** — Use historical data to predict market impact
2. **Custom Alert Rules** — Let premium users define complex alert conditions
3. **API Access** — B2B revenue stream for enterprise customers
4. **Mobile App** — Push notifications for instant alerts

---

## Appendix: Technology Reference

### n8n Node Recommendations

| Purpose | Recommended Node |
|---------|------------------|
| RSS Ingestion | RSS Read → Set (normalize) |
| Deduplication | Redis → IF (exists check) |
| AI Analysis | LangChain → AI Agent |
| Validation | Code → IF (schema check) |
| Telegram | Telegram → Send Message |
| DB Write | Postgres → Insert |

### Embedding Model for pgvector

```yaml
Recommended: text-embedding-3-small (OpenAI)
Dimensions: 768 (matches schema VECTOR(768))
Cost: $0.00002 / 1K tokens
Alternative: Gemini embedding (free tier available)
```

---

*End of Audit*
