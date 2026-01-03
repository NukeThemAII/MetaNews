# MetaNews Roadmap

## Phase 1: Foundation ✅
*Target: Week 1*

- [x] Core documentation (GEMINI.md)
- [x] Environment configuration (.env.example)
- [x] Docker Compose setup
- [x] Database schema with indexes
- [x] n8n workflow exports (4 workflows)
- [x] Technical audit

---

## Phase 2: Core Pipelines
*Target: Week 2-3*

### Ingestion
- [ ] Test WF-01 with live RSS feeds
- [ ] Add GDELT API connector
- [ ] Implement source health monitoring
- [ ] Add rate limiting

### Intelligence  
- [ ] Configure Gemini API credentials
- [ ] Configure OpenAI credentials
- [ ] Test AI classification accuracy
- [ ] Calibrate severity scoring
- [ ] Tune semantic cache TTL

### Distribution
- [ ] Create Telegram bot (@BotFather)
- [ ] Set up premium/free channels
- [ ] Test delivery flow end-to-end

---

## Phase 3: Frontend MVP
*Target: Week 3-4*

### Setup
- [ ] Initialize Next.js app
- [ ] Configure Tailwind CSS
- [ ] Set up database connection

### Pages
- [ ] Landing page (marketing)
- [ ] Live feed UI
- [ ] Event detail view
- [ ] Authentication (NextAuth)

### Features
- [ ] Real-time updates (WebSocket)
- [ ] Category filtering
- [ ] Severity sorting
- [ ] Search functionality

---

## Phase 4: Payments & Scale
*Target: Week 5+*

### Monetization
- [ ] Stripe integration
- [ ] Subscription tiers
- [ ] Payment webhooks
- [ ] Invoice system

### Operations
- [ ] Prometheus metrics
- [ ] Grafana dashboards
- [ ] Sentry error tracking
- [ ] Automated backups
- [ ] SSL/TLS setup

### Performance
- [ ] Database partitioning (by date)
- [ ] Read replicas
- [ ] CDN for frontend
- [ ] Load testing

---

## Future Ideas

### Near-Term
- [ ] Email digest (daily/weekly)
- [ ] Mobile push notifications
- [ ] Custom alert rules
- [ ] Watchlist for entities

### Long-Term
- [ ] Predictive analytics
- [ ] API access (B2B)
- [ ] Mobile app
- [ ] Historical data export

---

## Completed

| Date | Task |
|------|------|
| 2026-01-03 | Repository redesign, infrastructure files, n8n workflows |
| 2026-01-03 | Technical audit (AUDIT.md) |
| 2025-12-XX | Initial spec (GEMINI.md v1) |
