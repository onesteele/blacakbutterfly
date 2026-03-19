-- =====================================================
-- FREE TRIAL SYSTEM SETUP
-- Run this in your Supabase SQL Editor
-- =====================================================

-- 1. Insert default free_trial_config into admin_settings
INSERT INTO admin_settings (key, value, updated_at)
VALUES (
    'free_trial_config',
    '{
        "videos": [
            { "title": "Welcome to Your Free Trial", "url": "", "duration": "120", "checkboxes": ["I understand how the free trial works"] },
            { "title": "Setting Up TradeLink", "url": "", "duration": "150", "checkboxes": ["I am ready to set up my TradeLink account"] },
            { "title": "Getting Started with Algorithms", "url": "", "duration": "120", "checkboxes": ["I understand the basics of algorithmic trading"] }
        ],
        "tradelink_url": "https://tradelink.com/signup"
    }'::jsonb,
    NOW()
)
ON CONFLICT (key) DO NOTHING;
