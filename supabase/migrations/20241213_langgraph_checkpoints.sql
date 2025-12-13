-- ============================================================================
-- LangGraph Checkpoint Tables for Supabase
-- PostgresSaver auto-creates tables, but we add custom extensions
-- ============================================================================

-- Note: PostgresSaver.setup() creates these tables automatically:
-- - checkpoints (thread_id, checkpoint_ns, checkpoint_id, parent_checkpoint_id, type, checkpoint, metadata)
-- - checkpoint_writes (thread_id, checkpoint_ns, checkpoint_id, task_id, idx, channel, type, value)
-- - checkpoint_blobs (thread_id, checkpoint_ns, channel, version, type, blob)

-- ============================================================================
-- 1. Agent Session Analytics (Optional Enhancement)
-- ============================================================================

CREATE TABLE IF NOT EXISTS agent_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,

  -- Session metadata
  total_iterations INTEGER DEFAULT 0,
  agents_used TEXT[] DEFAULT '{}',
  models_used TEXT[] DEFAULT '{}',

  -- Performance metrics
  total_tokens_used INTEGER DEFAULT 0,
  avg_latency_ms REAL,

  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'error', 'timeout')),
  error_message TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for quick session lookup
CREATE INDEX IF NOT EXISTS idx_agent_sessions_thread_id ON agent_sessions(thread_id);
CREATE INDEX IF NOT EXISTS idx_agent_sessions_user_id ON agent_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_sessions_status ON agent_sessions(status);

-- ============================================================================
-- 2. Model Health Tracking (Circuit Breaker State)
-- ============================================================================

CREATE TABLE IF NOT EXISTS model_health (
  model_id TEXT PRIMARY KEY,
  failures INTEGER NOT NULL DEFAULT 0,
  last_failure TIMESTAMPTZ,
  last_success TIMESTAMPTZ,
  is_open BOOLEAN NOT NULL DEFAULT false,
  half_open_attempts INTEGER NOT NULL DEFAULT 0,

  -- Statistics
  total_requests INTEGER NOT NULL DEFAULT 0,
  total_failures INTEGER NOT NULL DEFAULT 0,
  success_rate REAL GENERATED ALWAYS AS (
    CASE WHEN total_requests > 0
    THEN ((total_requests - total_failures)::REAL / total_requests::REAL) * 100
    ELSE 100 END
  ) STORED,

  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 3. RLS Policies
-- ============================================================================

-- Agent Sessions: Users can only see their own sessions
ALTER TABLE agent_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions" ON agent_sessions
  FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can create sessions" ON agent_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update own sessions" ON agent_sessions
  FOR UPDATE
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Model Health: Read-only for authenticated users
ALTER TABLE model_health ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read model health" ON model_health
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Service role can update model health
CREATE POLICY "Service role can update model health" ON model_health
  FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================================
-- 4. Trigger for updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_agent_sessions_updated_at
  BEFORE UPDATE ON agent_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_model_health_updated_at
  BEFORE UPDATE ON model_health
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 5. Helper Functions
-- ============================================================================

-- Record model failure
CREATE OR REPLACE FUNCTION record_model_failure(p_model_id TEXT, p_threshold INTEGER DEFAULT 3)
RETURNS VOID AS $$
BEGIN
  INSERT INTO model_health (model_id, failures, last_failure, total_requests, total_failures, is_open)
  VALUES (p_model_id, 1, now(), 1, 1, false)
  ON CONFLICT (model_id) DO UPDATE SET
    failures = model_health.failures + 1,
    last_failure = now(),
    total_requests = model_health.total_requests + 1,
    total_failures = model_health.total_failures + 1,
    is_open = (model_health.failures + 1) >= p_threshold;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Record model success
CREATE OR REPLACE FUNCTION record_model_success(p_model_id TEXT)
RETURNS VOID AS $$
BEGIN
  INSERT INTO model_health (model_id, failures, last_success, total_requests, is_open)
  VALUES (p_model_id, 0, now(), 1, false)
  ON CONFLICT (model_id) DO UPDATE SET
    failures = 0,
    last_success = now(),
    total_requests = model_health.total_requests + 1,
    is_open = false,
    half_open_attempts = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if model is healthy
CREATE OR REPLACE FUNCTION is_model_healthy(p_model_id TEXT, p_reset_time_ms INTEGER DEFAULT 60000)
RETURNS BOOLEAN AS $$
DECLARE
  v_health model_health%ROWTYPE;
BEGIN
  SELECT * INTO v_health FROM model_health WHERE model_id = p_model_id;

  IF NOT FOUND THEN
    RETURN true;
  END IF;

  IF NOT v_health.is_open THEN
    RETURN true;
  END IF;

  -- Check if reset time has passed (half-open transition)
  IF v_health.last_failure IS NOT NULL AND
     EXTRACT(EPOCH FROM (now() - v_health.last_failure)) * 1000 > p_reset_time_ms THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================================
-- 6. Comments
-- ============================================================================

COMMENT ON TABLE agent_sessions IS 'LangGraph multi-agent session tracking';
COMMENT ON TABLE model_health IS 'Circuit breaker state for AI models';
COMMENT ON FUNCTION record_model_failure IS 'Record model failure and update circuit breaker';
COMMENT ON FUNCTION record_model_success IS 'Record model success and reset circuit breaker';
COMMENT ON FUNCTION is_model_healthy IS 'Check if model is available (circuit breaker check)';
