-- =============================================================================
-- MetaNews Database Schema
-- =============================================================================
-- PostgreSQL 16 + pgvector
-- Run: psql -d metanews -f schema.sql
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Extensions
-- -----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";        -- Fuzzy text search
CREATE EXTENSION IF NOT EXISTS "vector";         -- Vector embeddings

-- -----------------------------------------------------------------------------
-- Enums
-- -----------------------------------------------------------------------------
CREATE TYPE event_category AS ENUM (
    'War', 'Market', 'Disaster', 'Tech', 'Policy', 'Crypto', 'Energy', 'Other'
);

CREATE TYPE market_impact AS ENUM (
    'none', 'low', 'medium', 'high'
);

CREATE TYPE user_tier AS ENUM (
    'free', 'premium', 'enterprise'
);

CREATE TYPE subscription_status AS ENUM (
    'active', 'canceled', 'past_due', 'paused'
);

CREATE TYPE source_type AS ENUM (
    'rss', 'api', 'telegram', 'twitter', 'scraper'
);

-- -----------------------------------------------------------------------------
-- Sources Table - Data source management
-- -----------------------------------------------------------------------------
CREATE TABLE sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    type source_type NOT NULL,
    reliability_score DECIMAL(3,2) DEFAULT 0.5 CHECK (reliability_score BETWEEN 0 AND 1),
    fetch_interval INTEGER DEFAULT 120,          -- Seconds between fetches
    last_fetch TIMESTAMPTZ,
    last_success TIMESTAMPTZ,
    consecutive_failures INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    config JSONB DEFAULT '{}'::jsonb,            -- Source-specific config
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- Events Table - Core intelligence events
-- -----------------------------------------------------------------------------
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_id UUID REFERENCES sources(id) ON DELETE SET NULL,
    source_hash VARCHAR(64) UNIQUE NOT NULL,     -- SHA-256 of source URL
    
    -- Content
    title TEXT NOT NULL,
    alert TEXT,                                  -- One-sentence urgent alert
    summary JSONB NOT NULL,                      -- ["What", "Why", "Next"]
    raw_content TEXT,                            -- Original content for reference
    
    -- Classification
    category event_category NOT NULL,
    severity INTEGER NOT NULL CHECK (severity BETWEEN 0 AND 100),
    confidence DECIMAL(3,2) NOT NULL CHECK (confidence BETWEEN 0 AND 1),
    market_impact market_impact DEFAULT 'none',
    
    -- Entities & Location
    entities JSONB DEFAULT '[]'::jsonb,          -- ["$BTC", "BlackRock", etc]
    geo JSONB,                                   -- {"lat": 48.37, "lon": 31.16}
    
    -- AI/ML
    embedding VECTOR(768),                       -- For semantic search
    
    -- Metadata
    source_url TEXT,
    published_at TIMESTAMPTZ NOT NULL,
    ingested_at TIMESTAMPTZ DEFAULT NOW(),
    promoted_at TIMESTAMPTZ,                     -- When sent to premium feed
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- Users Table - User accounts
-- -----------------------------------------------------------------------------
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),                  -- NULL if OAuth-only
    
    -- External IDs
    telegram_id BIGINT UNIQUE,
    stripe_customer_id VARCHAR(255),
    
    -- Subscription
    tier user_tier DEFAULT 'free',
    
    -- Preferences
    preferences JSONB DEFAULT '{
        "categories": ["War", "Market", "Crypto"],
        "min_severity": 40,
        "notifications": {
            "telegram": true,
            "email": false,
            "push": false
        },
        "timezone": "UTC"
    }'::jsonb,
    
    -- Tracking
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- Subscriptions Table - Payment subscriptions
-- -----------------------------------------------------------------------------
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Stripe
    stripe_subscription_id VARCHAR(255) UNIQUE,
    stripe_price_id VARCHAR(255),
    
    -- Status
    plan VARCHAR(50) NOT NULL,                   -- 'monthly', 'yearly'
    status subscription_status NOT NULL DEFAULT 'active',
    
    -- Billing period
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancel_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- Alerts Table - Sent notifications
-- -----------------------------------------------------------------------------
CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Delivery
    channel VARCHAR(20) NOT NULL,                -- 'telegram', 'email', 'push'
    status VARCHAR(20) DEFAULT 'pending',        -- 'pending', 'sent', 'failed'
    
    -- Tracking
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    error_message TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- Event Audit Table - Change tracking
-- -----------------------------------------------------------------------------
CREATE TABLE event_audit (
    id BIGSERIAL PRIMARY KEY,
    event_id UUID REFERENCES events(id) ON DELETE SET NULL,
    action VARCHAR(20) NOT NULL,                 -- 'created', 'updated', 'promoted', 'deleted'
    actor VARCHAR(50),                           -- 'system', 'n8n', user_id
    changes JSONB,                               -- {"field": {"old": x, "new": y}}
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- Seen URLs Table - Deduplication cache
-- -----------------------------------------------------------------------------
CREATE TABLE seen_urls (
    hash VARCHAR(64) PRIMARY KEY,
    url TEXT NOT NULL,
    source_id UUID REFERENCES sources(id) ON DELETE CASCADE,
    seen_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours'
);

-- =============================================================================
-- Indexes
-- =============================================================================

-- Events - Query optimization
CREATE INDEX idx_events_category ON events(category);
CREATE INDEX idx_events_severity ON events(severity DESC);
CREATE INDEX idx_events_confidence ON events(confidence DESC);
CREATE INDEX idx_events_market_impact ON events(market_impact);
CREATE INDEX idx_events_published_at ON events(published_at DESC);
CREATE INDEX idx_events_created_at ON events(created_at DESC);

-- Composite indexes for common queries
CREATE INDEX idx_events_feed ON events(category, severity DESC, published_at DESC)
    WHERE confidence >= 0.5;

CREATE INDEX idx_events_premium ON events(severity DESC, published_at DESC)
    WHERE severity >= 80 AND confidence >= 0.5;

-- Full-text search
CREATE INDEX idx_events_title_fts ON events 
    USING gin(to_tsvector('english', title));

CREATE INDEX idx_events_entities_gin ON events 
    USING gin(entities jsonb_path_ops);

-- Vector similarity search
CREATE INDEX idx_events_embedding ON events 
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

-- Sources
CREATE INDEX idx_sources_active ON sources(is_active, type);
CREATE INDEX idx_sources_last_fetch ON sources(last_fetch);

-- Users
CREATE INDEX idx_users_tier ON users(tier);
CREATE INDEX idx_users_telegram ON users(telegram_id) WHERE telegram_id IS NOT NULL;

-- Subscriptions
CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_period_end ON subscriptions(current_period_end);

-- Alerts
CREATE INDEX idx_alerts_event ON alerts(event_id);
CREATE INDEX idx_alerts_user ON alerts(user_id);
CREATE INDEX idx_alerts_status ON alerts(status, created_at);

-- Seen URLs - TTL cleanup
CREATE INDEX idx_seen_urls_expires ON seen_urls(expires_at);

-- =============================================================================
-- Functions
-- =============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables
CREATE TRIGGER sources_updated_at
    BEFORE UPDATE ON sources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Audit trigger for events
CREATE OR REPLACE FUNCTION audit_event_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO event_audit (event_id, action, actor)
        VALUES (NEW.id, 'created', 'system');
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO event_audit (event_id, action, actor, changes)
        VALUES (
            NEW.id, 
            'updated', 
            'system',
            jsonb_build_object(
                'severity', jsonb_build_object('old', OLD.severity, 'new', NEW.severity),
                'confidence', jsonb_build_object('old', OLD.confidence, 'new', NEW.confidence)
            )
        );
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO event_audit (event_id, action, actor)
        VALUES (OLD.id, 'deleted', 'system');
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER events_audit
    AFTER INSERT OR UPDATE OR DELETE ON events
    FOR EACH ROW EXECUTE FUNCTION audit_event_changes();

-- Cleanup expired seen_urls
CREATE OR REPLACE FUNCTION cleanup_expired_urls()
RETURNS void AS $$
BEGIN
    DELETE FROM seen_urls WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- Initial Data
-- =============================================================================

-- Default sources
INSERT INTO sources (name, url, type, reliability_score, fetch_interval, config) VALUES
    ('GDELT Events', 'https://api.gdeltproject.org/api/v2/doc/doc', 'api', 0.85, 120, 
     '{"mode": "artlist", "format": "json", "maxrecords": 50}'::jsonb),
    ('ReliefWeb', 'https://api.reliefweb.int/v1/reports', 'api', 0.90, 300,
     '{"appname": "metanews", "limit": 20}'::jsonb),
    ('CoinDesk RSS', 'https://www.coindesk.com/arc/outboundfeeds/rss/', 'rss', 0.75, 180, '{}'::jsonb),
    ('Yahoo Finance', 'https://finance.yahoo.com/news/rssindex', 'rss', 0.70, 120, '{}'::jsonb),
    ('FAA Notams', 'https://www.faa.gov/air_traffic/publications/notices', 'scraper', 0.95, 600, '{}'::jsonb)
ON CONFLICT DO NOTHING;

-- =============================================================================
-- Maintenance
-- =============================================================================

-- Schedule cleanup (run via pg_cron or n8n)
-- SELECT cleanup_expired_urls();

-- Vacuum recommendations
COMMENT ON TABLE events IS 'Run VACUUM ANALYZE weekly. Partitioned by published_at (monthly) for scale.';
COMMENT ON TABLE seen_urls IS 'Cleanup via cleanup_expired_urls() or scheduled job. 24h TTL.';

-- =============================================================================
-- PARTITIONING (Run after initial data load for existing tables)
-- =============================================================================
-- For high-volume deployments (10k+ events/day), convert events to partitioned table.
-- This must be done on an empty or migrated table.

-- Example: Create partitioned version
-- DROP TABLE events; -- Only if migrating!
-- CREATE TABLE events (
--     ... same columns as above ...
-- ) PARTITION BY RANGE (published_at);

-- Create monthly partitions
-- CREATE TABLE events_2026_01 PARTITION OF events
--     FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
-- CREATE TABLE events_2026_02 PARTITION OF events
--     FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
-- ... etc

-- Auto-create partitions with pg_partman extension:
-- CREATE EXTENSION pg_partman;
-- SELECT partman.create_parent('public.events', 'published_at', 'native', 'monthly');

