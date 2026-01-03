# MetaNews — Industry Standards Audit

**Auditor:** Gemini Agent  
**Date:** 2026-01-03  
**Target:** Implementation State & Specifications  

---

## Executive Summary

The MetaNews codebase has advanced significantly from a concept to a **production-ready architecture**. The specifications in `GEMINI.md` are comprehensive, and the implementation of `docker-compose.yml`, `db/schema.sql`, and `n8n` workflows reflects modern engineering standards.

However, several critical gaps remain before this can be considered "Enterprise Ready," particularly in **Security Hardening**, **frontend implementation**, and **observability**.

| Category | Score (0-100) | Status | Key Insight |
|----------|---------------|--------|-------------|
| **Architecture** | 92 | 🟢 Excellent | Microservices + Event-driven is the correct choice. |
| **Database** | 88 | 🟢 Good | PG + pgvector is solid. Indexing is well-planned. |
| **Automation** | 85 | 🟢 Good | n8n workflows are well-structured but complex. |
| **Security** | 60 | 🟡 Warning | Basic auth exists, but deeper hardening is missing. |
| **Observability** | 40 | 🔴 Critical | No logging aggregation or metrics pipeline implemented. |
| **Code Quality** | 75 | 🟡 Average | SQL is clean; JSON workflows are hard to review. |

---

## 1. Architecture Audit

### Strengths
*   **Microservices Approach:** Separation of concerns (Ingestion, Analysis, Gatekeeping, Distribution) is excellent for scalability.
*   **Event-Driven:** Using Redis as a queue/cache between ingestion and analysis is an industry-standard pattern for high-throughput systems.
*   **Containerization:** `docker-compose` setup is clean, uses named volumes, and health checks are correctly implemented.

### Weaknesses & Risks
*   **Single Point of Failure (n8n):** If the n8n container dies, the entire intelligence pipeline stops.
    *   *Recommendation:* Run n8n in queue mode with multiple worker containers for redundancy.
*   **State Management:** `seen_urls` in Postgres is good for persistence, but high-volume writes might lock the table.
    *   *Recommendation:* Move high-frequency deduplication entirely to Redis, persisting only "hits" to Postgres.

---

## 2. Database Schema Audit (`db/schema.sql`)

### Strengths
*   **Vector Search:** Correct usage of `ivfflat` index for embeddings.
*   **Indexing:** Composite indexes (e.g., `category` + `severity` + `published_at`) are perfectly targeted for the feed query patterns.
*   **Audit Logging:** `event_audit` trigger is a great compliance feature.
*   **Enums:** Usage of ENUM types ensures data integrity.

### Critical Gaps
1.  **Partitioning:** The `events` table will grow rapidly (10k+ rows/day).
    *   *Recommendation:* Implement declarative partitioning by `published_at` (monthly) to maintain query performance over time.
2.  **Backup Strategy:** No automated backup container or cron job is defined.
    *   *Recommendation:* Add a `pg_dump` sidecar container to `docker-compose`.

---

## 3. Automation Audit (`n8n-workflows/`)

### WF-01 Ingestion
*   **Logic:** The `SplitInBatches` -> `Route` -> `Fetch` pattern is robust.
*   **Resilience:** Retry logic (3 tries) and Circuit Breaker (5 failures) are implemented correctly.
*   **Issue:** The "Normalize" code block is a massive JavaScript function.
    *   *Recommendation:* Move complex normalization logic to a dedicated external service or library if it grows, as n8n code nodes are hard to unit test.

### Security in Workflows
*   Credentials are correctly abstracted.
*   **Risk:** `Start` nodes are exposed. Ensure n8n is not accessible publicly without auth (covered by Nginx, but verify).

---

## 4. Security Audit

### Current State
*   `N8N_BASIC_AUTH` is enabled.
*   Secrets are in `.env`.
*   Nginx is set up for SSL.

### Missing Controls (Critical)
1.  **Secrets Management:** Secrets are stored in a plaintext `.env` file on disk.
    *   *Standard:* Use Docker Swarm Secrets or a Vault for production.
2.  **Network Isolation:** All containers share one bridge network.
    *   *Standard:* Isolate the Database and Redis on a `backend` network, accessible only by n8n and API. Frontend should only talk to API/n8n.
3.  **Rate Limiting:** Nginx config is not visible but assumed basic.
    *   *Standard:* Implement strict rate limiting on the API and n8n webhook endpoints using Nginx or a dedicated gateway.

---

## 5. Observability & Monitoring

**Score: 40/100 (Failing)**

The current setup relies on `docker logs`. This is insufficient for a "Bloomberg-style" platform.

### Requirements for Production
1.  **Centralized Logging:** Deploy a **Loki** + **Promtail** stack to ingest logs from all containers.
2.  **Metrics:** Expose n8n metrics to **Prometheus**.
3.  **Tracing:** Trace the lifecycle of an event (Ingest -> AI -> DB -> Alert). Currently, if an event is dropped, it's hard to know *why* without digging through raw logs.

---

## 6. Recommendations & Roadmap

### Immediate Fixes (Priority 1)
1.  **Database Partitioning:** Implement before the table gets too big.
2.  **Network Segregation:** Update `docker-compose.yml` to use `frontend-net` and `backend-net`.
3.  **Log Rotation:** Configure Docker logging driver to prevent disk exhaustion.

### Short-Term Enhancements (Priority 2)
1.  **Observability Stack:** Add Grafana/Prometheus/Loki to the compose file.
2.  **Unit Tests for Workflows:** Export n8n workflow logic to independent JS files and test them.

### Long-Term Vision
1.  **Kubernetes Migration:** When scaling beyond a single VPS, move to K8s.
2.  **Custom Ingestion Service:** Replace n8n HTTP polling with a Go/Rust service for lower latency and higher throughput.

---

**Verdict:** The system is **Architecturally Sound** but **Operationally Immature**. It is ready for MVP deployment but not for high-value commercial SLA.
