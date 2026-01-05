# MetaNews - Industry Standard Audit

Date: 2026-01-05
Scope: /root/MetaNews (docker-compose, n8n workflows, database schema, frontend, nginx, docs)
Method: Static review only. No runtime execution, no traffic tests, no security scanning.

## Executive Summary

Overall status: Not production-ready. The core n8n pipeline is miswired, the ingestion webhook is hard-coded to an external domain, and several configuration/documentation mismatches will prevent a clean deploy. Security posture is decent at the network layer, but webhook exposure, secrets handling, and missing access controls create material risk.

Strengths:
- Clear modular architecture (n8n -> Postgres -> Next -> Nginx).
- Network segregation and health checks in Docker Compose.
- Solid database schema and indexing strategy.
- Backup container with retention policy.

Blocking issues:
- Workflow chaining is broken (Execute Workflow vs Webhook Trigger and invalid workflowId).
- Ingestion only processes the first item per feed.
- Hard-coded external webhook URL for WF-01.
- Environment variable mismatches for DB and Telegram.

## Architecture Overview (As Implemented)

Ingestion (RSS) -> WF-01 (n8n) -> WF-02 (Gemini) -> WF-03 (filter + DB insert) -> WF-04 (Telegram)
Frontend (Next.js) reads Postgres directly -> Nginx reverse proxy.

## n8n Workflow Logic Review

### WF-01 Ingestion (n8n-workflows/WF-01-ingestion.json)
Intended logic: cron -> fetch RSS -> normalize -> dedupe -> trigger WF-02.
Issues:
- Normalization uses $input.first(), so only the first RSS item per feed is ingested.
- Webhook URL is hard-coded to http://earngrid.xyz:8082, which leaks data and breaks local deploys.
- HTTP Request sends JSON.stringify($json) into jsonBody. This likely sends a string, not a JSON object.
- source_hash uses a weak, non-SHA hash, contradicting schema expectations and increasing collisions.

### WF-02 Intelligence (n8n-workflows/WF-02-intelligence.json)
Intended logic: semantic cache -> Gemini classify -> validate -> optional verification -> cache -> trigger WF-03.
Issues:
- Cache logic references cached_result, but Redis get returns value. Cache path never hits.
- needs_retry is set but there is no routing to Gemini Pro Retry.
- Validation failure still flows to gatekeeper without analysis, which can break downstream logic.
- Execute Workflow uses workflowId from $('variables') which does not exist.
- Execute Workflow expects a workflow with an Execute Workflow Trigger, but WF-03 uses Webhook Trigger.

### WF-03 Gatekeeper (n8n-workflows/WF-03-gatekeeper.json)
Intended logic: quality gate -> DB insert -> immediate or delayed distribution.
Issues:
- Execute Workflow calls WF-04 by workflowId "WF-04-distribution" which is not a valid workflow ID.
- Execute Workflow requires the target workflow to start with Execute Workflow Trigger. WF-04 uses Webhook Trigger.
- Insert is plain "insert". No handling for duplicate source_hash, so unique conflicts can break the flow.
- Extra fields (is_critical, is_verified, delay_minutes) are computed but not stored in the schema.

### WF-04 Distribution (n8n-workflows/WF-04-distribution.json)
Intended logic: format -> route to premium/free -> log alerts -> DM premium users.
Issues:
- chatId uses TELEGRAM_PREMIUM_CHANNEL and TELEGRAM_FREE_CHANNEL, but .env.example only defines TELEGRAM_CHAT_ID.
- Log inserts expect channel/status/sent_at fields but the payload does not include them, causing insert failures.
- Error Trigger is defined in the same workflow; it does not catch errors here.
- Uses HTML parse mode without sanitizing event data. Malformed content can break messages.

## Findings (By Severity)

### Critical
- Broken workflow chaining: WF-02 and WF-03/04 use Execute Workflow nodes but the target workflows are Webhook Trigger based and workflowId values are invalid or missing. Pipeline stops after WF-02. Files: `n8n-workflows/WF-02-intelligence.json`, `n8n-workflows/WF-03-gatekeeper.json`, `n8n-workflows/WF-04-distribution.json`.
- Hard-coded external webhook URL: WF-01 posts to http://earngrid.xyz:8082, which breaks local deploys and risks data exfiltration. File: `n8n-workflows/WF-01-ingestion.json`.
- Ingestion processes only first RSS item per feed due to $input.first(). This dramatically reduces coverage. File: `n8n-workflows/WF-01-ingestion.json`.

### High
- Frontend DB env mismatch: `frontend/lib/db.ts` expects DB_USER/DB_PASSWORD/DB_HOST/DB_PORT/DB_NAME, but `.env.example` defines DB_POSTGRESDB_* and DATABASE_URL uses unexpanded variables. This can fail DB connections in production. Files: `frontend/lib/db.ts`, `.env.example`, `docker-compose.yml`.
- Redis auth mismatch: .env supports REDIS_PASSWORD, but redis container does not set requirepass. If a password is set, n8n will fail to connect. Files: `.env.example`, `docker-compose.yml`.
- Alerts logging likely fails due to missing channel/status/sent_at fields in the payload. Files: `n8n-workflows/WF-04-distribution.json`, `db/schema.sql`.
- Cache logic never hits and retry path is not wired, leading to unnecessary Gemini calls and fragile error handling. File: `n8n-workflows/WF-02-intelligence.json`.
- Webhooks are unauthenticated. Anyone can post to /webhook/ and create events or trigger AI costs. Files: `nginx/nginx.conf`, n8n webhook triggers.

### Medium
- source_hash is a weak hash and does not match schema comment (SHA-256). Collisions can cause false dedupe or insert failures. Files: `n8n-workflows/WF-01-ingestion.json`, `db/schema.sql`.
- Free/premium gating is not enforced in the web feed. Events are inserted immediately; the frontend shows them without delay. Files: `n8n-workflows/WF-03-gatekeeper.json`, `frontend/lib/db.ts`, `frontend/app/feed/page.tsx`.
- N8N_SECURE_COOKIE defaults to false and N8N_HOST/WEBHOOK_URL values are likely incorrect for production. Files: `.env.example`, `docker-compose.yml`.
- Docker images are not pinned (n8nio/n8n:latest, nginx:alpine). This risks breaking changes on rebuild. File: `docker-compose.yml`.
- Nginx security headers are incomplete (no HSTS) and CSP allows unsafe-inline/unsafe-eval. File: `nginx/nginx.conf`.
- ssl_stapling_verify is enabled without a resolver, which can cause warnings or failures. File: `nginx/nginx.conf`.

### Low
- sources table and seen_urls table are unused by workflows, creating drift between schema and implementation. Files: `db/schema.sql`, `n8n-workflows/WF-01-ingestion.json`.
- Embeddings are defined but never generated. File: `db/schema.sql`.
- Documentation mismatches: GEMINI.md and N8N-IMPORT-GUIDE describe features and model names not present in workflows. Files: `GEMINI.md`, `N8N-IMPORT-GUIDE.md`.
- Frontend lacks error boundaries and loading states for DB failures. Files: `frontend/app/feed/page.tsx`, `frontend/components/event-card.tsx`.

## Fixes and Updates (Recommended Order)

### Immediate (Blockers)
1. Replace Execute Workflow with HTTP calls to the correct webhook endpoints, or switch WF-03 and WF-04 to Execute Workflow Trigger and set valid workflow IDs.
2. Remove hard-coded webhook domain and drive URLs from WEBHOOK_URL or env variables.
3. Update WF-01 normalization to iterate over all items ($input.all()).
4. Fix Redis cache field names (use value) and wire needs_retry to Gemini Pro Retry.

### Short Term (Stability)
1. Align frontend DB env usage: use DATABASE_URL only, or update db.ts to read DB_POSTGRESDB_*.
2. Add ON CONFLICT DO NOTHING (or upsert) to events insert to handle duplicates cleanly.
3. Update WF-04 to add channel/status/sent_at fields before inserting alerts.
4. Add webhook authentication or a shared secret check at ingress.

### Hardening and Operations
1. Pin Docker images to exact versions.
2. Set N8N_SECURE_COOKIE=true and correct N8N_HOST/WEBHOOK_URL for TLS.
3. Add HSTS and tighten CSP (remove unsafe-eval in production).
4. Add Redis requirepass if REDIS_PASSWORD is set.

## Suggested Improvements

Security:
- Add an allowlist or HMAC token for webhook endpoints.
- Restrict port 5678 on the host; access n8n only via Nginx.
- Add secret rotation and vault integration once in production.

Reliability:
- Add circuit breaker and source health tracking (as described in GEMINI.md) or remove from docs.
- Add retry/backoff and error routing in workflows.
- Add alerts on workflow execution failures.

Observability:
- Add metrics for ingestion count, AI latency, cache hit rate, and alert sends.
- Enable structured logging for n8n and the Next.js server.

Product:
- Enforce free-tier delay in the feed (published_at vs available_at).
- Add an event detail page and pagination.
- Implement access control for premium features.

Documentation:
- Reconcile GEMINI.md and N8N-IMPORT-GUIDE with actual workflow models and credentials.
- Update .env.example to include TELEGRAM_PREMIUM_CHANNEL and TELEGRAM_FREE_CHANNEL (or update workflows to use TELEGRAM_CHAT_ID).

## Out of Scope / Not Verified

- Live data ingestion accuracy, AI output quality, or latency under load.
- Production SSL certificate provisioning and rotation.
- Real-world n8n credential config in your environment.

