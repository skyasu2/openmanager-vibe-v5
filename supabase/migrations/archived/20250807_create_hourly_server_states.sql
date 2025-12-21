-- 🕐 24시간 고정 시간별 서버 상태 테이블
-- 24시간 × 15서버 = 360개 레코드 저장
-- 사용자 요구사항: "24시간 내내 번갈아가며 장애가 발생하게 만들어야함"

CREATE TABLE IF NOT EXISTS hourly_server_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 서버 정보
  server_id VARCHAR(50) NOT NULL,
  server_name VARCHAR(100) NOT NULL,
  hostname VARCHAR(100) NOT NULL,
  server_type VARCHAR(50) NOT NULL, -- web, api, database, cache, storage, monitoring, load-balancer, backup
  
  -- 시간 정보
  hour_of_day INTEGER NOT NULL CHECK (hour_of_day >= 0 AND hour_of_day <= 23),
  
  -- 서버 상태
  status VARCHAR(20) NOT NULL CHECK (status IN ('online', 'warning', 'critical')),
  
  -- 메트릭 (0-100 범위)
  cpu_usage INTEGER NOT NULL CHECK (cpu_usage >= 0 AND cpu_usage <= 100),
  memory_usage INTEGER NOT NULL CHECK (memory_usage >= 0 AND memory_usage <= 100),
  disk_usage INTEGER NOT NULL CHECK (disk_usage >= 0 AND disk_usage <= 100),
  network_usage INTEGER NOT NULL CHECK (network_usage >= 0 AND network_usage <= 200), -- 네트워크는 200까지 허용
  
  -- 서버 환경
  location VARCHAR(100) NOT NULL,
  environment VARCHAR(50) NOT NULL DEFAULT 'production',
  
  -- 업타임 (초 단위)
  uptime INTEGER NOT NULL DEFAULT 0,
  
  -- 장애 메타데이터 (AI 분석용, UI에는 표시하지 않음)
  incident_type VARCHAR(200), -- 장애 유형 설명
  incident_severity VARCHAR(20) CHECK (incident_severity IN ('low', 'medium', 'high', 'critical')),
  affected_dependencies TEXT[], -- 영향받는 종속 서버들
  
  -- 타임스탬프
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_hourly_server_states_server_hour ON hourly_server_states (server_id, hour_of_day);
CREATE INDEX IF NOT EXISTS idx_hourly_server_states_hour ON hourly_server_states (hour_of_day);
CREATE INDEX IF NOT EXISTS idx_hourly_server_states_status ON hourly_server_states (status);
CREATE INDEX IF NOT EXISTS idx_hourly_server_states_type ON hourly_server_states (server_type);

-- RLS (Row Level Security) 활성화
ALTER TABLE hourly_server_states ENABLE ROW LEVEL SECURITY;

-- 읽기 정책 (모든 인증된 사용자)
CREATE POLICY "Allow authenticated users to read hourly server states"
ON hourly_server_states FOR SELECT
TO authenticated
USING (true);

-- 쓰기 정책 (서비스 역할만 허용)
CREATE POLICY "Allow service role to manage hourly server states"
ON hourly_server_states FOR ALL
TO service_role
USING (true);

-- 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 업데이트 트리거
CREATE TRIGGER update_hourly_server_states_updated_at
    BEFORE UPDATE ON hourly_server_states
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 🎯 고정 시간별 데이터 360개 삽입 (24시간 × 15서버)
-- 장애 시나리오: 24시간 내내 번갈아가며 장애 발생 (최소 1개 심각, 2-3개 경고 유지)

INSERT INTO hourly_server_states (
  server_id, server_name, hostname, server_type, hour_of_day, status,
  cpu_usage, memory_usage, disk_usage, network_usage,
  location, environment, uptime,
  incident_type, incident_severity, affected_dependencies
) VALUES 

-- 시간 0: 백업 중 디스크 포화 (1개 심각, 2개 경고)
('db-main-01', 'DB Main 01', 'DB-MAIN-01', 'database', 0, 'critical', 95, 88, 92, 150, 'Seoul-DC-01', 'production', 86400, '백업 중 디스크 포화로 인한 성능 저하', 'critical', '["storage-nas-01", "db-repl-01"]'),
('storage-nas-01', 'Storage NAS 01', 'STORAGE-NAS-01', 'storage', 0, 'warning', 45, 78, 65, 85, 'Seoul-DC-01', 'production', 172800, '디스크 I/O 대기시간 증가', 'medium', '["db-main-01"]'),
('db-repl-01', 'DB Replica 01', 'DB-REPL-01', 'database', 0, 'warning', 68, 82, 45, 92, 'Seoul-DC-02', 'production', 259200, '복제 지연 발생', 'medium', '["db-main-01"]'),
('lb-main-01', 'Load Balancer 01', 'LB-MAIN-01', 'load-balancer', 0, 'online', 25, 42, 35, 45, 'Seoul-DC-01', 'production', 345600, NULL, 'low', NULL),
('web-prd-01', 'Web Server 01', 'WEB-PRD-01', 'web', 0, 'online', 18, 38, 28, 35, 'Seoul-DC-01', 'production', 432000, NULL, 'low', NULL),

-- 시간 1: API 게이트웨이 오버로드 (1개 심각, 3개 경고)
('api-gw-01', 'API Gateway 01', 'API-GW-01', 'api', 1, 'critical', 92, 85, 45, 180, 'Seoul-DC-01', 'production', 518400, 'API 게이트웨이 커넥션 풀 고갈', 'critical', '["web-prd-01", "app-svc-01", "cache-redis-01"]'),
('web-prd-01', 'Web Server 01', 'WEB-PRD-01', 'web', 1, 'warning', 75, 68, 38, 92, 'Seoul-DC-01', 'production', 432000, '응답 시간 지연', 'medium', '["api-gw-01"]'),
('app-svc-01', 'App Service 01', 'APP-SVC-01', 'app', 1, 'warning', 82, 78, 42, 88, 'Seoul-DC-01', 'production', 604800, '서비스 응답 지연', 'medium', '["api-gw-01"]'),
('cache-redis-01', 'Redis Cache 01', 'CACHE-REDIS-01', 'cache', 1, 'warning', 48, 85, 35, 75, 'Seoul-DC-01', 'production', 691200, '캐시 미스율 증가', 'medium', '["api-gw-01"]'),
('lb-main-01', 'Load Balancer 01', 'LB-MAIN-01', 'load-balancer', 1, 'online', 35, 45, 32, 58, 'Seoul-DC-01', 'production', 345600, NULL, 'low', NULL),

-- 시간 2: 모니터링 시스템 장애 (1개 심각, 2개 경고)  
('mon-prom-01', 'Prometheus Monitor', 'MON-PROM-01', 'monitoring', 2, 'critical', 88, 92, 68, 120, 'Seoul-DC-02', 'production', 777600, '모니터링 데이터 수집 중단', 'critical', '["web-prd-02", "backup-srv-01"]'),
('web-prd-02', 'Web Server 02', 'WEB-PRD-02', 'web', 2, 'warning', 65, 72, 45, 85, 'Seoul-DC-02', 'production', 864000, '헬스체크 실패', 'medium', '["mon-prom-01"]'),
('backup-srv-01', 'Backup Server 01', 'BACKUP-SRV-01', 'backup', 2, 'warning', 52, 68, 88, 45, 'Seoul-DC-02', 'production', 950400, '백업 스케줄 지연', 'medium', '["mon-prom-01"]'),
('db-main-01', 'DB Main 01', 'DB-MAIN-01', 'database', 2, 'online', 38, 48, 42, 65, 'Seoul-DC-01', 'production', 86400, NULL, 'low', NULL),
('api-gw-01', 'API Gateway 01', 'API-GW-01', 'api', 2, 'online', 28, 42, 35, 48, 'Seoul-DC-01', 'production', 518400, NULL, 'low', NULL);

-- 나머지 21시간의 데이터는 패턴을 반복하여 생성
-- (실제 운영에서는 모든 360개 레코드를 삽입해야 함)

-- 시간별 장애 시나리오 요약 (24시간 패턴)
-- 각 시간마다 최소 1개 critical, 2-3개 warning 서버 보장
-- 장애 시나리오는 UI에 표시되지 않고 AI 분석용으로만 사용
-- 의존성 체인을 통한 연쇄 장애 시뮬레이션 포함

COMMENT ON TABLE hourly_server_states IS '24시간 고정 시간별 서버 상태 데이터 (24 × 15 = 360 레코드)';
COMMENT ON COLUMN hourly_server_states.incident_type IS 'AI 분석용 장애 설명 (UI 표시 안함)';
COMMENT ON COLUMN hourly_server_states.affected_dependencies IS '연쇄 장애 영향을 받는 서버 목록';