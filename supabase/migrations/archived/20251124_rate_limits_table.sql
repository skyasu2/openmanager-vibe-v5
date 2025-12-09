-- ============================================================================
-- 🛡️ Rate Limits Table for Serverless-Compatible Rate Limiting
-- ============================================================================
-- Created: 2025-11-24
-- Purpose: Distributed rate limiting for Vercel serverless environment
-- Related: src/lib/security/rate-limiter.ts v2.0
-- Changelog:
--   - v2.1 (2025-11-24): Added RLS policies, atomic increment RPC, idempotent migration

-- ============================================================================
-- 📦 Table Creation (Idempotent)
-- ============================================================================

-- Create rate_limits table (idempotent - safe for re-run)
CREATE TABLE IF NOT EXISTS rate_limits (
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
-- 🎯 Indexes for Performance (Idempotent)
-- ============================================================================

-- Index for cleanup queries (deleting expired records)
CREATE INDEX IF NOT EXISTS idx_rate_limits_expires_at ON rate_limits(expires_at);

-- Index for reset_time queries (finding active rate limits)
CREATE INDEX IF NOT EXISTS idx_rate_limits_reset_time ON rate_limits(reset_time);

-- ============================================================================
-- 🔧 Triggers for Auto-Update (Idempotent)
-- ============================================================================

-- Automatically update `updated_at` timestamp
CREATE OR REPLACE FUNCTION update_rate_limits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists, then recreate (idempotent)
DROP TRIGGER IF EXISTS rate_limits_updated_at ON rate_limits;
CREATE TRIGGER rate_limits_updated_at
  BEFORE UPDATE ON rate_limits
  FOR EACH ROW
  EXECUTE FUNCTION update_rate_limits_updated_at();

-- ============================================================================
-- 🔐 Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS on rate_limits table
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Policy: Only service role can read/write rate limits
-- (Prevents anon key abuse)
CREATE POLICY IF NOT EXISTS "Service role only access"
  ON rate_limits
  FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================================
-- ⚡ Atomic Increment RPC Function (Solves Race Condition)
-- ============================================================================

-- Atomic rate limit check and increment
-- Returns: { allowed: boolean, remaining: number, reset_time: bigint }
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_ip TEXT,
  p_path TEXT,
  p_max_requests INTEGER,
  p_window_ms BIGINT
)
RETURNS TABLE (
  allowed BOOLEAN,
  remaining INTEGER,
  reset_time BIGINT
) AS $$
DECLARE
  v_now BIGINT := EXTRACT(EPOCH FROM NOW()) * 1000;  -- Current time in ms
  v_record RECORD;
  v_new_reset_time BIGINT;
  v_new_expires_at TIMESTAMPTZ;
BEGIN
  -- Try to get existing record (with row lock)
  SELECT * INTO v_record
  FROM rate_limits
  WHERE ip = p_ip AND path = p_path
  FOR UPDATE;

  -- Case 1: No record or window expired → Create/Reset
  IF v_record IS NULL OR v_now > v_record.reset_time THEN
    v_new_reset_time := v_now + p_window_ms;
    v_new_expires_at := TO_TIMESTAMP((v_now + p_window_ms) / 1000.0);

    INSERT INTO rate_limits (ip, path, count, reset_time, expires_at)
    VALUES (p_ip, p_path, 1, v_new_reset_time, v_new_expires_at)
    ON CONFLICT (ip, path) DO UPDATE
    SET count = 1,
        reset_time = v_new_reset_time,
        expires_at = v_new_expires_at;

    RETURN QUERY SELECT TRUE, p_max_requests - 1, v_new_reset_time;
    RETURN;
  END IF;

  -- Case 2: Limit exceeded
  IF v_record.count >= p_max_requests THEN
    RETURN QUERY SELECT FALSE, 0, v_record.reset_time;
    RETURN;
  END IF;

  -- Case 3: Increment count (atomic)
  UPDATE rate_limits
  SET count = count + 1
  WHERE ip = p_ip AND path = p_path;

  RETURN QUERY SELECT TRUE, p_max_requests - (v_record.count + 1), v_record.reset_time;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION check_rate_limit TO service_role;

-- ============================================================================
-- 🧹 Cleanup RPC Function (Returns Actual Delete Count)
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_rate_limits()
RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  -- Delete expired records and get count
  DELETE FROM rate_limits
  WHERE expires_at < NOW();

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION cleanup_rate_limits TO service_role;

-- ============================================================================
-- 📝 Comments
-- ============================================================================

COMMENT ON TABLE rate_limits IS
  'Distributed rate limiting storage for Vercel serverless environment. ' ||
  'Tracks request counts per IP and path with automatic expiration. ' ||
  'Uses RLS and atomic RPC functions for security and race-condition prevention.';

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

COMMENT ON FUNCTION check_rate_limit IS
  'Atomic rate limit check and increment. Prevents race conditions in serverless environment. ' ||
  'Returns: { allowed: boolean, remaining: int, reset_time: bigint }';

COMMENT ON FUNCTION cleanup_rate_limits IS
  'Deletes expired rate limit records. Returns count of deleted records. ' ||
  'Can be called via API route or Supabase cron job.';

-- ============================================================================
-- ✅ Verification Query
-- ============================================================================

-- Verify table structure
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'rate_limits'
ORDER BY ordinal_position;

-- Verify RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'rate_limits';

-- Verify RPC functions exist
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_name IN ('check_rate_limit', 'cleanup_rate_limits');
