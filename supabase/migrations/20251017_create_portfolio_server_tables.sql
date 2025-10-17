-- ==========================================
-- Portfolio Server Data Schema
-- ==========================================
-- 목적: 포트폴리오 데모용 현실적인 서버 모니터링 데이터
-- 기반: src/types/server.ts의 Server, ServerInstance 타입
-- 적용 방법: Supabase Dashboard > SQL Editor에서 실행

-- ==========================================
-- 1. servers 테이블 (서버 메타데이터)
-- ==========================================
CREATE TABLE IF NOT EXISTS servers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  hostname TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('online', 'offline', 'warning', 'critical', 'maintenance', 'unknown')),
  type TEXT NOT NULL CHECK (type IN ('web', 'api', 'database', 'cache', 'storage', 'load-balancer', 'backup', 'monitoring', 'security', 'queue', 'app', 'fallback')),
  
  -- Location & Environment
  location TEXT NOT NULL DEFAULT '서울',
  environment TEXT NOT NULL DEFAULT 'production' CHECK (environment IN ('production', 'staging', 'development', 'test')),
  provider TEXT NOT NULL DEFAULT 'AWS' CHECK (provider IN ('AWS', 'GCP', 'Azure', 'On-Premise', 'Vercel')),
  
  -- System Info
  os TEXT NOT NULL DEFAULT 'Ubuntu 22.04',
  ip TEXT,
  role TEXT,
  description TEXT,
  
  -- Specs (JSON for flexibility)
  specs JSONB DEFAULT '{"cpu_cores": 4, "memory_gb": 16, "disk_gb": 512, "network_speed": "1Gbps"}',
  
  -- Services (array of service objects)
  services JSONB DEFAULT '[]',
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_health_check TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 2. server_metrics 테이블 (시계열 메트릭)
-- ==========================================
CREATE TABLE IF NOT EXISTS server_metrics (
  id BIGSERIAL PRIMARY KEY,
  server_id TEXT NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Core Metrics (%)
  cpu NUMERIC(5,2) NOT NULL CHECK (cpu >= 0 AND cpu <= 100),
  memory NUMERIC(5,2) NOT NULL CHECK (memory >= 0 AND memory <= 100),
  disk NUMERIC(5,2) NOT NULL CHECK (disk >= 0 AND disk <= 100),
  network NUMERIC(5,2) CHECK (network >= 0 AND network <= 100),
  
  -- Performance
  response_time INTEGER, -- milliseconds
  connections INTEGER DEFAULT 0,
  uptime BIGINT NOT NULL DEFAULT 0, -- seconds
  
  -- Detailed Metrics (JSON for flexibility)
  detailed_metrics JSONB DEFAULT '{}',
  
  -- Health Score
  health_score INTEGER CHECK (health_score >= 0 AND health_score <= 100),
  
  UNIQUE(server_id, timestamp)
);

-- ==========================================
-- 3. server_alerts 테이블 (알림 이력)
-- ==========================================
CREATE TABLE IF NOT EXISTS server_alerts (
  id BIGSERIAL PRIMARY KEY,
  server_id TEXT NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  
  -- Alert Info
  type TEXT NOT NULL CHECK (type IN ('cpu', 'memory', 'disk', 'network', 'security', 'availability', 'performance', 'custom')),
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical', 'emergency')),
  message TEXT NOT NULL,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved', 'ignored')),
  
  -- Timestamps
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  acknowledged_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'
);

-- ==========================================
-- Indexes for Performance
-- ==========================================

-- servers 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_servers_status ON servers(status);
CREATE INDEX IF NOT EXISTS idx_servers_type ON servers(type);
CREATE INDEX IF NOT EXISTS idx_servers_environment ON servers(environment);
CREATE INDEX IF NOT EXISTS idx_servers_provider ON servers(provider);

-- server_metrics 테이블 인덱스 (시계열 조회 최적화)
CREATE INDEX IF NOT EXISTS idx_server_metrics_server_id ON server_metrics(server_id);
CREATE INDEX IF NOT EXISTS idx_server_metrics_timestamp ON server_metrics(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_server_metrics_server_timestamp ON server_metrics(server_id, timestamp DESC);

-- server_alerts 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_server_alerts_server_id ON server_alerts(server_id);
CREATE INDEX IF NOT EXISTS idx_server_alerts_severity ON server_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_server_alerts_status ON server_alerts(status);
CREATE INDEX IF NOT EXISTS idx_server_alerts_triggered_at ON server_alerts(triggered_at DESC);

-- ==========================================
-- Row Level Security (RLS) - 데모용으로 간단하게
-- ==========================================

ALTER TABLE servers ENABLE ROW LEVEL SECURITY;
ALTER TABLE server_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE server_alerts ENABLE ROW LEVEL SECURITY;

-- 읽기 전용 정책 (데모 데이터이므로 누구나 읽기 가능)
CREATE POLICY "Allow read access to all users" ON servers FOR SELECT USING (true);
CREATE POLICY "Allow read access to all users" ON server_metrics FOR SELECT USING (true);
CREATE POLICY "Allow read access to all users" ON server_alerts FOR SELECT USING (true);

-- 쓰기 정책 (authenticated users만 가능)
CREATE POLICY "Allow insert for authenticated users" ON servers FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow insert for authenticated users" ON server_metrics FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow insert for authenticated users" ON server_alerts FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ==========================================
-- Triggers for updated_at
-- ==========================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_servers_updated_at
  BEFORE UPDATE ON servers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- Comments for Documentation
-- ==========================================

COMMENT ON TABLE servers IS '포트폴리오 데모용 서버 메타데이터 - SERVER_TYPE_DEFINITIONS 기반';
COMMENT ON TABLE server_metrics IS '시계열 서버 메트릭 데이터 - 1분 간격 업데이트';
COMMENT ON TABLE server_alerts IS '서버 알림 이력 - FAILURE_IMPACT_GRAPH 기반 연쇄 장애 추적';

COMMENT ON COLUMN servers.type IS '서버 역할 (web, api, database, cache, storage, load-balancer, backup, monitoring, security, queue, app, fallback)';
COMMENT ON COLUMN servers.specs IS 'JSON: {cpu_cores, memory_gb, disk_gb, network_speed}';
COMMENT ON COLUMN servers.services IS 'JSON 배열: [{name, status, port, pid}]';

COMMENT ON COLUMN server_metrics.detailed_metrics IS 'JSON: {cpu_cores_used, memory_breakdown, disk_io, network_throughput}';
COMMENT ON COLUMN server_metrics.health_score IS '0-100 점수, SERVER_TYPE_DEFINITIONS의 stabilityFactor 기반';

COMMENT ON COLUMN server_alerts.metadata IS 'JSON: {affected_services, cascade_impact, auto_recovery}';
