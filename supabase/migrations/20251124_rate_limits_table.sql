-- ============================================================================
-- 🛡️ Rate Limits Table for Serverless-Compatible Rate Limiting
-- ============================================================================
-- Created: 2025-11-24
-- Purpose: Distributed rate limiting for Vercel serverless environment
-- Related: src/lib/security/rate-limiter.ts v2.0

-- Drop existing table if exists (for clean migration)
DROP TABLE IF EXISTS rate_limits CASCADE;

-- Create rate_limits table
CREATE TABLE rate_limits (
  -- Composite primary key (IP + Path)
  ip TEXT NOT NULL,
  path TEXT NOT NULL,

  -- Rate limit tracking
  count INTEGER NOT NULL DEFAULT 1,
  reset_time BIGINT NOT NULL, -- Unix timestamp in milliseconds

  -- Automatic cleanup
  expires_at TIMESTAMPTZ NOT NULL,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  PRIMARY KEY (ip, path)
);

-- ============================================================================
-- 🎯 Indexes for Performance
-- ============================================================================

-- Index for cleanup queries (deleting expired records)
CREATE INDEX idx_rate_limits_expires_at ON rate_limits(expires_at);

-- Index for reset_time queries (finding active rate limits)
CREATE INDEX idx_rate_limits_reset_time ON rate_limits(reset_time);

-- ============================================================================
-- 🔧 Triggers for Auto-Update
-- ============================================================================

-- Automatically update `updated_at` timestamp
CREATE OR REPLACE FUNCTION update_rate_limits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER rate_limits_updated_at
  BEFORE UPDATE ON rate_limits
  FOR EACH ROW
  EXECUTE FUNCTION update_rate_limits_updated_at();

-- ============================================================================
-- 📝 Comments
-- ============================================================================

COMMENT ON TABLE rate_limits IS
  'Distributed rate limiting storage for Vercel serverless environment. ' ||
  'Tracks request counts per IP and path with automatic expiration.';

COMMENT ON COLUMN rate_limits.ip IS
  'Client IP address (from x-forwarded-for or x-real-ip headers)';

COMMENT ON COLUMN rate_limits.path IS
  'Request path (e.g., /api/ai/query)';

COMMENT ON COLUMN rate_limits.count IS
  'Number of requests in the current time window';

COMMENT ON COLUMN rate_limits.reset_time IS
  'Unix timestamp (ms) when the rate limit window resets';

COMMENT ON COLUMN rate_limits.expires_at IS
  'Timestamp for automatic cleanup of expired records';

-- ============================================================================
-- ✅ Verification
-- ============================================================================

-- Test query: Check table structure
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'rate_limits'
ORDER BY ordinal_position;

-- ============================================================================
-- 🧹 Cleanup Job (Optional - Run periodically via cron or API route)
-- ============================================================================

-- Example cleanup query (delete records older than their expiration time)
-- DELETE FROM rate_limits WHERE expires_at < NOW();

-- Note: This can be triggered:
-- 1. Via Supabase cron job (if available)
-- 2. Via API route (e.g., /api/admin/cleanup-rate-limits)
-- 3. Via the rate-limiter cleanup() method (on-demand)
