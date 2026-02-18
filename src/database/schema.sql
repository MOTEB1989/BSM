-- ============================================
-- Unified AI Gateway - Database Schema
-- PostgreSQL 16+
-- ============================================

-- Providers table: Store AI provider configurations
CREATE TABLE IF NOT EXISTS gateway_providers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('openai', 'anthropic', 'google', 'kimi', 'perplexity')),
    api_url VARCHAR(255) NOT NULL,
    priority INTEGER NOT NULL DEFAULT 100,
    enabled BOOLEAN NOT NULL DEFAULT true,
    config JSONB DEFAULT '{}',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- API keys table: User API keys for gateway access
CREATE TABLE IF NOT EXISTS gateway_api_keys (
    id SERIAL PRIMARY KEY,
    key_hash VARCHAR(255) NOT NULL UNIQUE,
    key_prefix VARCHAR(20) NOT NULL,
    user_id VARCHAR(255),
    name VARCHAR(255),
    enabled BOOLEAN NOT NULL DEFAULT true,
    rate_limit INTEGER NOT NULL DEFAULT 1000,
    rate_limit_window INTEGER NOT NULL DEFAULT 3600,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP,
    expires_at TIMESTAMP
);

-- Request logs table: Track all gateway requests
CREATE TABLE IF NOT EXISTS gateway_requests (
    id BIGSERIAL PRIMARY KEY,
    request_id VARCHAR(36) NOT NULL UNIQUE,
    api_key_id INTEGER REFERENCES gateway_api_keys(id),
    provider_id INTEGER REFERENCES gateway_providers(id),
    model VARCHAR(100) NOT NULL,
    task_type VARCHAR(50),
    prompt_tokens INTEGER,
    completion_tokens INTEGER,
    total_tokens INTEGER,
    cost_usd DECIMAL(10, 6),
    duration_ms INTEGER,
    status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'error', 'cached', 'fallback')),
    error_message TEXT,
    fallback_chain TEXT[],
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Cache table: Request/response caching
CREATE TABLE IF NOT EXISTS gateway_cache (
    id BIGSERIAL PRIMARY KEY,
    cache_key VARCHAR(64) NOT NULL UNIQUE,
    prompt_hash VARCHAR(64) NOT NULL,
    model VARCHAR(100) NOT NULL,
    response JSONB NOT NULL,
    tokens_saved INTEGER,
    cost_saved_usd DECIMAL(10, 6),
    hit_count INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    last_accessed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Rate limits table: Track rate limit usage
CREATE TABLE IF NOT EXISTS gateway_rate_limits (
    id BIGSERIAL PRIMARY KEY,
    api_key_id INTEGER NOT NULL REFERENCES gateway_api_keys(id),
    window_start TIMESTAMP NOT NULL,
    request_count INTEGER NOT NULL DEFAULT 1,
    token_count INTEGER NOT NULL DEFAULT 0,
    UNIQUE(api_key_id, window_start)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_requests_api_key ON gateway_requests(api_key_id);
CREATE INDEX IF NOT EXISTS idx_requests_created_at ON gateway_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_requests_provider ON gateway_requests(provider_id);
CREATE INDEX IF NOT EXISTS idx_cache_key ON gateway_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_cache_expires ON gateway_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_cache_prompt_hash ON gateway_cache(prompt_hash);
CREATE INDEX IF NOT EXISTS idx_rate_limits_key_window ON gateway_rate_limits(api_key_id, window_start);

-- Insert default providers
INSERT INTO gateway_providers (name, type, api_url, priority, enabled) VALUES
    ('OpenAI GPT-4', 'openai', 'https://api.openai.com/v1/chat/completions', 100, true),
    ('OpenAI GPT-4o', 'openai', 'https://api.openai.com/v1/chat/completions', 90, true),
    ('OpenAI GPT-4o-mini', 'openai', 'https://api.openai.com/v1/chat/completions', 80, true),
    ('Claude 3 Opus', 'anthropic', 'https://api.anthropic.com/v1/messages', 95, true),
    ('Claude 3 Sonnet', 'anthropic', 'https://api.anthropic.com/v1/messages', 85, true),
    ('Gemini Pro', 'google', 'https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent', 75, true),
    ('Perplexity Sonar', 'perplexity', 'https://api.perplexity.ai/chat/completions', 70, true),
    ('Kimi', 'kimi', 'https://api.moonshot.cn/v1/chat/completions', 65, true)
ON CONFLICT (name) DO NOTHING;

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for auto-updating updated_at
CREATE TRIGGER update_providers_updated_at BEFORE UPDATE ON gateway_providers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create views for analytics
CREATE OR REPLACE VIEW gateway_usage_stats AS
SELECT 
    DATE_TRUNC('hour', created_at) as hour,
    provider_id,
    model,
    COUNT(*) as request_count,
    SUM(total_tokens) as total_tokens,
    SUM(cost_usd) as total_cost,
    AVG(duration_ms) as avg_duration_ms,
    COUNT(*) FILTER (WHERE status = 'success') as success_count,
    COUNT(*) FILTER (WHERE status = 'error') as error_count,
    COUNT(*) FILTER (WHERE status = 'cached') as cached_count
FROM gateway_requests
GROUP BY hour, provider_id, model
ORDER BY hour DESC;

CREATE OR REPLACE VIEW gateway_cache_stats AS
SELECT 
    COUNT(*) as total_entries,
    SUM(hit_count) as total_hits,
    SUM(tokens_saved) as total_tokens_saved,
    SUM(cost_saved_usd) as total_cost_saved,
    COUNT(*) FILTER (WHERE expires_at > CURRENT_TIMESTAMP) as active_entries,
    COUNT(*) FILTER (WHERE expires_at <= CURRENT_TIMESTAMP) as expired_entries
FROM gateway_cache;
