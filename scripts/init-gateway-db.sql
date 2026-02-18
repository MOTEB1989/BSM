-- BSU AI Gateway Database Schema
-- Creates tables for usage tracking, quota management, and request logging

-- API Keys and User Management
CREATE TABLE IF NOT EXISTS api_keys (
  id SERIAL PRIMARY KEY,
  key_hash VARCHAR(255) UNIQUE NOT NULL,
  key_prefix VARCHAR(20) NOT NULL,
  user_id VARCHAR(255),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  daily_quota INTEGER DEFAULT 1000,
  monthly_quota INTEGER DEFAULT 30000,
  CONSTRAINT valid_expiry CHECK (expires_at IS NULL OR expires_at > created_at)
);

CREATE INDEX idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX idx_api_keys_user ON api_keys(user_id);
CREATE INDEX idx_api_keys_active ON api_keys(is_active);

-- Usage Tracking
CREATE TABLE IF NOT EXISTS usage_logs (
  id SERIAL PRIMARY KEY,
  api_key_id INTEGER REFERENCES api_keys(id) ON DELETE CASCADE,
  request_id VARCHAR(100) UNIQUE,
  provider VARCHAR(50) NOT NULL,
  model VARCHAR(100) NOT NULL,
  endpoint VARCHAR(255),
  method VARCHAR(20),
  tokens_input INTEGER,
  tokens_output INTEGER,
  tokens_total INTEGER,
  cost_usd DECIMAL(10, 6),
  response_time_ms INTEGER,
  status_code INTEGER,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_usage_logs_api_key ON usage_logs(api_key_id);
CREATE INDEX idx_usage_logs_provider ON usage_logs(provider);
CREATE INDEX idx_usage_logs_created_at ON usage_logs(created_at);
CREATE INDEX idx_usage_logs_request_id ON usage_logs(request_id);

-- Daily Usage Aggregates (for fast quota checks)
CREATE TABLE IF NOT EXISTS daily_usage (
  id SERIAL PRIMARY KEY,
  api_key_id INTEGER REFERENCES api_keys(id) ON DELETE CASCADE,
  usage_date DATE NOT NULL,
  request_count INTEGER DEFAULT 0,
  tokens_total INTEGER DEFAULT 0,
  cost_total_usd DECIMAL(10, 4) DEFAULT 0,
  UNIQUE(api_key_id, usage_date)
);

CREATE INDEX idx_daily_usage_key_date ON daily_usage(api_key_id, usage_date);

-- Provider Configuration
CREATE TABLE IF NOT EXISTS providers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100),
  api_url VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  priority INTEGER DEFAULT 100,
  max_retries INTEGER DEFAULT 3,
  timeout_ms INTEGER DEFAULT 30000,
  config JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_providers_active ON providers(is_active);
CREATE INDEX idx_providers_priority ON providers(priority);

-- Insert default providers
INSERT INTO providers (name, display_name, api_url, priority, config) VALUES
  ('openai', 'OpenAI', 'https://api.openai.com/v1/chat/completions', 1, '{"models": ["gpt-4o-mini", "gpt-4o", "gpt-4"]}'),
  ('anthropic', 'Anthropic Claude', 'https://api.anthropic.com/v1/messages', 2, '{"models": ["claude-3-5-sonnet-20241022", "claude-3-opus", "claude-3-sonnet"]}'),
  ('google', 'Google Gemini', 'https://generativelanguage.googleapis.com/v1beta/models', 3, '{"models": ["gemini-pro", "gemini-1.5-pro"]}'),
  ('perplexity', 'Perplexity', 'https://api.perplexity.ai/chat/completions', 4, '{"models": ["sonar", "sonar-pro"]}')
ON CONFLICT (name) DO NOTHING;

-- Model Pricing (cost per 1M tokens)
CREATE TABLE IF NOT EXISTS model_pricing (
  id SERIAL PRIMARY KEY,
  provider VARCHAR(50) NOT NULL,
  model VARCHAR(100) NOT NULL,
  input_cost_per_1m DECIMAL(10, 4),
  output_cost_per_1m DECIMAL(10, 4),
  currency VARCHAR(10) DEFAULT 'USD',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(provider, model)
);

-- Insert pricing data (as of 2024)
INSERT INTO model_pricing (provider, model, input_cost_per_1m, output_cost_per_1m) VALUES
  ('openai', 'gpt-4o-mini', 0.15, 0.60),
  ('openai', 'gpt-4o', 2.50, 10.00),
  ('openai', 'gpt-4', 30.00, 60.00),
  ('anthropic', 'claude-3-5-sonnet-20241022', 3.00, 15.00),
  ('anthropic', 'claude-3-opus', 15.00, 75.00),
  ('anthropic', 'claude-3-sonnet', 3.00, 15.00),
  ('google', 'gemini-pro', 0.50, 1.50),
  ('google', 'gemini-1.5-pro', 1.25, 5.00),
  ('perplexity', 'sonar', 1.00, 1.00),
  ('perplexity', 'sonar-pro', 3.00, 15.00)
ON CONFLICT (provider, model) DO NOTHING;

-- Request Cache Table
CREATE TABLE IF NOT EXISTS request_cache (
  id SERIAL PRIMARY KEY,
  cache_key VARCHAR(255) UNIQUE NOT NULL,
  request_hash VARCHAR(64) NOT NULL,
  provider VARCHAR(50),
  model VARCHAR(100),
  response_data JSONB NOT NULL,
  tokens_total INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  access_count INTEGER DEFAULT 1,
  ttl_seconds INTEGER DEFAULT 3600
);

CREATE INDEX idx_request_cache_key ON request_cache(cache_key);
CREATE INDEX idx_request_cache_hash ON request_cache(request_hash);
CREATE INDEX idx_request_cache_created ON request_cache(created_at);

-- Function to clean expired cache entries
CREATE OR REPLACE FUNCTION clean_expired_cache() RETURNS void AS $$
BEGIN
  DELETE FROM request_cache 
  WHERE created_at < NOW() - INTERVAL '1 second' * ttl_seconds;
END;
$$ LANGUAGE plpgsql;

-- Create an index on providers priority for faster lookups
CREATE INDEX IF NOT EXISTS idx_providers_priority_active ON providers(priority, is_active);

-- Create a view for active usage stats
CREATE OR REPLACE VIEW active_usage_stats AS
SELECT 
  ak.key_prefix,
  ak.user_id,
  COUNT(ul.id) as total_requests,
  SUM(ul.tokens_total) as total_tokens,
  SUM(ul.cost_usd) as total_cost,
  AVG(ul.response_time_ms) as avg_response_time,
  MAX(ul.created_at) as last_request_at
FROM api_keys ak
LEFT JOIN usage_logs ul ON ak.id = ul.api_key_id
WHERE ak.is_active = TRUE
GROUP BY ak.id, ak.key_prefix, ak.user_id;

-- Grant permissions (if needed for specific user)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO bsu_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO bsu_user;
