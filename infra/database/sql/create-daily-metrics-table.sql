-- Daily Metrics Table for Server Monitoring
-- 서버 모니터링을 위한 일일 메트릭 테이블

CREATE TABLE IF NOT EXISTS daily_metrics (
    id BIGSERIAL PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL,
    server_id VARCHAR(50) NOT NULL,
    cpu DECIMAL(5,2) NOT NULL CHECK (cpu >= 0 AND cpu <= 100),
    memory DECIMAL(5,2) NOT NULL CHECK (memory >= 0 AND memory <= 100),
    disk DECIMAL(5,2) NOT NULL CHECK (disk >= 0 AND disk <= 100),
    response_time INTEGER NOT NULL CHECK (response_time >= 0),
    status VARCHAR(20) NOT NULL CHECK (status IN ('healthy', 'warning', 'critical')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성 (쿼리 성능 최적화)
CREATE INDEX IF NOT EXISTS idx_daily_metrics_timestamp ON daily_metrics(timestamp);
CREATE INDEX IF NOT EXISTS idx_daily_metrics_server_id ON daily_metrics(server_id);
CREATE INDEX IF NOT EXISTS idx_daily_metrics_status ON daily_metrics(status);
CREATE INDEX IF NOT EXISTS idx_daily_metrics_composite ON daily_metrics(server_id, timestamp);

-- RLS (Row Level Security) 설정 (선택사항)
ALTER TABLE daily_metrics ENABLE ROW LEVEL SECURITY;

-- 기본 정책: 모든 사용자가 읽기/쓰기 가능 (개발 환경용)
CREATE POLICY IF NOT EXISTS "Enable all operations for daily_metrics" 
ON daily_metrics FOR ALL 
TO public 
USING (true) 
WITH CHECK (true);

-- 코멘트 추가
COMMENT ON TABLE daily_metrics IS '서버 모니터링 시계열 데이터 - 10분 간격으로 수집';
COMMENT ON COLUMN daily_metrics.timestamp IS '메트릭 수집 시간 (UTC)';
COMMENT ON COLUMN daily_metrics.server_id IS '서버 식별자 (예: web-01, db-02)';
COMMENT ON COLUMN daily_metrics.cpu IS 'CPU 사용률 (0-100%)';
COMMENT ON COLUMN daily_metrics.memory IS '메모리 사용률 (0-100%)';
COMMENT ON COLUMN daily_metrics.disk IS '디스크 사용률 (0-100%)';
COMMENT ON COLUMN daily_metrics.response_time IS '응답 시간 (밀리초)';
COMMENT ON COLUMN daily_metrics.status IS '서버 상태 (healthy/warning/critical)'; 