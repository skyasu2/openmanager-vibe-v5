-- Supabase 서버 메트릭 테이블 스키마
-- 24시간 보존 정책 포함

-- 메인 메트릭 테이블
CREATE TABLE IF NOT EXISTS server_metrics (
  id BIGSERIAL PRIMARY KEY,
  server_id VARCHAR(50) NOT NULL,
  hostname VARCHAR(100) NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- CPU 메트릭
  cpu_usage NUMERIC(5,2) NOT NULL CHECK (cpu_usage >= 0 AND cpu_usage <= 100),
  cpu_load_avg NUMERIC[] NOT NULL,
  cpu_cores INTEGER NOT NULL,
  
  -- 메모리 메트릭
  memory_total BIGINT NOT NULL,
  memory_used BIGINT NOT NULL,
  memory_usage NUMERIC(5,2) NOT NULL CHECK (memory_usage >= 0 AND memory_usage <= 100),
  
  -- 디스크 메트릭
  disk_total BIGINT NOT NULL,
  disk_used BIGINT NOT NULL,
  disk_usage NUMERIC(5,2) NOT NULL CHECK (disk_usage >= 0 AND disk_usage <= 100),
  
  -- 네트워크 메트릭
  network_interface VARCHAR(20) NOT NULL,
  network_bytes_received BIGINT NOT NULL,
  network_bytes_sent BIGINT NOT NULL,
  network_errors_received INTEGER NOT NULL,
  network_errors_sent INTEGER NOT NULL,
  
  -- 시스템 정보
  os VARCHAR(50) NOT NULL,
  uptime BIGINT NOT NULL,
  processes_total INTEGER NOT NULL,
  processes_zombie INTEGER NOT NULL,
  
  -- 서비스 상태 (JSON)
  services JSONB NOT NULL DEFAULT '[]',
  
  -- 메타데이터
  location VARCHAR(50) NOT NULL,
  environment VARCHAR(20) NOT NULL CHECK (environment IN ('production', 'staging', 'development')),
  provider VARCHAR(20) NOT NULL CHECK (provider IN ('aws', 'gcp', 'azure', 'kubernetes', 'onpremise')),
  
  -- 원시 데이터 (전체 메트릭 JSON)
  raw_data JSONB NOT NULL,
  
  -- 생성 시간
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_server_metrics_server_id ON server_metrics(server_id);
CREATE INDEX IF NOT EXISTS idx_server_metrics_timestamp ON server_metrics(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_server_metrics_server_timestamp ON server_metrics(server_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_server_metrics_environment ON server_metrics(environment);
CREATE INDEX IF NOT EXISTS idx_server_metrics_provider ON server_metrics(provider);

-- 24시간 자동 삭제 정책 (Row Level Security)
CREATE OR REPLACE FUNCTION cleanup_old_metrics()
RETURNS void AS $$
BEGIN
  DELETE FROM server_metrics 
  WHERE timestamp < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- 매시간 실행되는 자동 정리 작업
SELECT cron.schedule('cleanup-old-metrics', '0 * * * *', 'SELECT cleanup_old_metrics();');

-- 서버 상태 요약 뷰 (대시보드용)
CREATE OR REPLACE VIEW server_status_summary AS
SELECT 
  server_id,
  hostname,
  MAX(timestamp) as last_seen,
  CASE 
    WHEN MAX(timestamp) > NOW() - INTERVAL '5 minutes' THEN 'online'
    WHEN MAX(timestamp) > NOW() - INTERVAL '15 minutes' THEN 'warning'
    ELSE 'offline'
  END as status,
  environment,
  provider,
  location
FROM server_metrics 
WHERE timestamp > NOW() - INTERVAL '24 hours'
GROUP BY server_id, hostname, environment, provider, location;

-- 실시간 알림을 위한 함수
CREATE OR REPLACE FUNCTION check_server_alerts(p_server_id VARCHAR)
RETURNS TABLE(alert_type VARCHAR, message VARCHAR, severity VARCHAR) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE 
      WHEN cpu_usage > 90 THEN 'high_cpu'
      WHEN memory_usage > 90 THEN 'high_memory'
      WHEN disk_usage > 85 THEN 'high_disk'
      ELSE NULL
    END::VARCHAR as alert_type,
    CASE 
      WHEN cpu_usage > 90 THEN 'CPU 사용률이 ' || cpu_usage::TEXT || '%입니다'
      WHEN memory_usage > 90 THEN '메모리 사용률이 ' || memory_usage::TEXT || '%입니다'
      WHEN disk_usage > 85 THEN '디스크 사용률이 ' || disk_usage::TEXT || '%입니다'
      ELSE NULL
    END::VARCHAR as message,
    CASE 
      WHEN cpu_usage > 95 OR memory_usage > 95 OR disk_usage > 95 THEN 'critical'
      WHEN cpu_usage > 90 OR memory_usage > 90 OR disk_usage > 85 THEN 'warning'
      ELSE 'info'
    END::VARCHAR as severity
  FROM server_metrics 
  WHERE server_id = p_server_id 
    AND timestamp > NOW() - INTERVAL '5 minutes'
  ORDER BY timestamp DESC 
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- 테이블 소유권 및 권한 설정
ALTER TABLE server_metrics ENABLE ROW LEVEL SECURITY;

-- RLS 정책 (필요시 추가)
-- CREATE POLICY "서버 메트릭 조회 정책" ON server_metrics FOR SELECT USING (true);
-- CREATE POLICY "서버 메트릭 삽입 정책" ON server_metrics FOR INSERT WITH CHECK (true); 