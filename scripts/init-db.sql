-- Initialize Database Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create enum types
CREATE TYPE user_role AS ENUM ('user', 'admin', 'super_admin');
CREATE TYPE platform_type AS ENUM ('youtube', 'instagram', 'twitter', 'linkedin', 'snapchat', 'whatsapp', 'telegram', 'github', 'email');
CREATE TYPE post_status AS ENUM ('draft', 'scheduled', 'publishing', 'published', 'failed');
CREATE TYPE subscription_plan AS ENUM ('free', 'basic', 'pro', 'business', 'enterprise');
CREATE TYPE subscription_status AS ENUM ('active', 'canceled', 'past_due', 'unpaid', 'trialing', 'incomplete');

-- Admin settings table for API management
CREATE TABLE IF NOT EXISTS admin_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(255) UNIQUE NOT NULL,
    value JSONB NOT NULL DEFAULT '{}',
    description TEXT,
    is_sensitive BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API usage tracking
CREATE TABLE IF NOT EXISTS api_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service VARCHAR(100) NOT NULL,
    endpoint VARCHAR(255),
    requests_count INTEGER DEFAULT 0,
    tokens_used INTEGER DEFAULT 0,
    cost_usd DECIMAL(10, 4) DEFAULT 0,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(service, endpoint, date)
);

-- API billing records
CREATE TABLE IF NOT EXISTS api_billing (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service VARCHAR(100) NOT NULL,
    invoice_id VARCHAR(255),
    amount_usd DECIMAL(10, 2) NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    paid_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default admin settings
INSERT INTO admin_settings (key, value, description, is_sensitive) VALUES
    ('openai_config', '{"model": "gpt-4-turbo-preview", "max_tokens": 500, "enabled": true}', 'OpenAI API Configuration', false),
    ('anthropic_config', '{"model": "claude-3-sonnet", "max_tokens": 500, "enabled": true}', 'Anthropic Claude Configuration', false),
    ('rate_limits', '{"global": 1000, "per_user": 100, "per_minute": 60}', 'API Rate Limiting Configuration', false),
    ('subscription_features', '{"free": ["basic_posting"], "basic": ["scheduling", "analytics"], "pro": ["ai_content", "team"], "business": ["api_access", "white_label"]}', 'Features per subscription tier', false),
    ('maintenance_mode', '{"enabled": false, "message": ""}', 'Maintenance mode settings', false)
ON CONFLICT (key) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_api_usage_date ON api_usage(date);
CREATE INDEX IF NOT EXISTS idx_api_usage_service ON api_usage(service);
CREATE INDEX IF NOT EXISTS idx_api_billing_service ON api_billing(service);
CREATE INDEX IF NOT EXISTS idx_api_billing_status ON api_billing(status);
