-- 🚀 servers 테이블 생성 및 테스트 데이터 삽입 (구버전 호환성)
-- Supabase SQL Editor에서 실행하세요

-- 1. servers 테이블이 없다면 생성
CREATE TABLE IF NOT EXISTS servers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  hostname TEXT,
  status TEXT NOT NULL CHECK (status IN ('online', 'offline', 'warning', 'healthy', 'critical')),
  cpu NUMERIC DEFAULT 0,
  memory NUMERIC DEFAULT 0,
  disk NUMERIC DEFAULT 0,
  network NUMERIC DEFAULT 0,
  uptime INTEGER DEFAULT 0,
  location TEXT,
  environment TEXT,
  provider TEXT,
  type TEXT,
  alerts INTEGER DEFAULT 0,
  ip TEXT,
  os TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 기존 데이터 삭제
TRUNCATE TABLE servers CASCADE;

-- 3. 테스트 데이터 삽입
INSERT INTO servers (
  id, name, hostname, status, cpu, memory, disk, network, 
  uptime, location, environment, provider, type, alerts, ip, os
) VALUES
  ('srv-001', 'Production Web Server', 'prod-web-01', 'online', 35.5, 45.2, 62.8, 224.1, 
   864000, 'Seoul, KR', 'production', 'AWS', 'web', 0, '10.0.1.10', 'Ubuntu 22.04'),
  
  ('srv-002', 'Production API Server', 'prod-api-01', 'online', 42.1, 55.8, 70.5, 403.2, 
   1728000, 'Seoul, KR', 'production', 'AWS', 'api', 0, '10.0.1.11', 'Ubuntu 22.04'),
  
  ('srv-003', 'Production Database', 'prod-db-01', 'online', 28.7, 82.3, 85.2, 165.7, 
   2592000, 'Seoul, KR', 'production', 'AWS', 'database', 0, '10.0.1.12', 'Ubuntu 22.04'),
  
  ('srv-004', 'Development Server', 'dev-test-01', 'warning', 78.9, 89.5, 45.3, 77.3, 
   432000, 'Seoul, KR', 'development', 'GCP', 'test', 2, '10.0.2.10', 'Ubuntu 22.04'),
  
  ('srv-005', 'Staging Server', 'staging-app-01', 'offline', 0, 0, 0, 0, 
   0, 'Seoul, KR', 'staging', 'On-Premise', 'application', 5, '10.0.3.10', 'Ubuntu 22.04');

-- 4. RLS (Row Level Security) 활성화
ALTER TABLE servers ENABLE ROW LEVEL SECURITY;

-- 5. 모든 사용자가 읽을 수 있도록 정책 생성
CREATE POLICY "Enable read access for all users" ON servers
  FOR SELECT
  USING (true);

-- 6. 인증된 사용자는 쓰기 가능하도록 정책 생성
CREATE POLICY "Enable write access for authenticated users" ON servers
  FOR ALL
  USING (auth.role() = 'authenticated');

-- 7. 데이터 확인
SELECT 
  id,
  name,
  status,
  ROUND(cpu::numeric, 1) as cpu,
  ROUND(memory::numeric, 1) as memory,
  ROUND(disk::numeric, 1) as disk,
  location,
  environment
FROM servers
ORDER BY name;

-- 8. 통계 확인
SELECT 
  COUNT(*) as total_servers,
  COUNT(CASE WHEN status = 'online' THEN 1 END) as online_servers,
  COUNT(CASE WHEN status = 'warning' THEN 1 END) as warning_servers,
  COUNT(CASE WHEN status = 'offline' THEN 1 END) as offline_servers
FROM servers;