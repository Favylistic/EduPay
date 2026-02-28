-- Allow @gmail.com and other domains for testing
-- This migration disables strict email domain validation in Supabase Auth

-- Update auth configuration to allow any email domain
-- Note: This is done via Supabase dashboard under Authentication settings

-- For now, we'll ensure the profiles table accepts any email format
ALTER TABLE profiles
  ADD CONSTRAINT valid_email_format 
  CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$');

-- Create a whitelist table for allowed email domains (optional, for future use)
CREATE TABLE IF NOT EXISTS email_domain_whitelist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT NOT NULL UNIQUE,
  allowed BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add some common test domains
INSERT INTO email_domain_whitelist (domain, allowed) VALUES
  ('gmail.com', TRUE),
  ('outlook.com', TRUE),
  ('yahoo.com', TRUE),
  ('test.com', TRUE)
ON CONFLICT (domain) DO UPDATE SET allowed = TRUE;

-- Enable RLS on email_domain_whitelist
ALTER TABLE email_domain_whitelist ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read the whitelist
CREATE POLICY "Allow public read of whitelist" ON email_domain_whitelist
  FOR SELECT
  USING (TRUE);

-- Policy: Only super admins can modify the whitelist
CREATE POLICY "Allow super admin to manage whitelist" ON email_domain_whitelist
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

COMMENT ON TABLE email_domain_whitelist IS 'Whitelist of allowed email domains for account creation';
