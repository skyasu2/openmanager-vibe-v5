-- 🔄 서버 템플릿 백업 테이블 생성
-- OpenManager VIBE v5 - 동적 템플릿 시스템 Supabase 백업

-- 서버 템플릿 백업 테이블
CREATE TABLE IF NOT EXISTS server_templates_backup (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  server_id VARCHAR(50) NOT NULL,
  template_data JSONB NOT NULL,
  schema_version VARCHAR(20) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성 (빠른 조회를 위해)
CREATE INDEX idx_server_templates_server_id ON server_templates_backup(server_id);
CREATE INDEX idx_server_templates_created_at ON server_templates_backup(created_at DESC);
CREATE INDEX idx_server_templates_schema_version ON server_templates_backup(schema_version);

-- 템플릿 스키마 버전 관리 테이블
CREATE TABLE IF NOT EXISTS template_schemas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  version VARCHAR(20) NOT NULL UNIQUE,
  schema_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- RLS (Row Level Security) 활성화
ALTER TABLE server_templates_backup ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_schemas ENABLE ROW LEVEL SECURITY;

-- 기본 정책 설정 (인증된 사용자만 읽기/쓰기 가능)
CREATE POLICY "authenticated_read_server_templates" ON server_templates_backup
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "authenticated_write_server_templates" ON server_templates_backup
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "authenticated_update_server_templates" ON server_templates_backup
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "authenticated_read_template_schemas" ON template_schemas
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "authenticated_write_template_schemas" ON template_schemas
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- 자동 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 업데이트 시간 자동 갱신 트리거
CREATE TRIGGER update_server_templates_backup_updated_at
  BEFORE UPDATE ON server_templates_backup
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 오래된 백업 자동 삭제 함수 (30일 이상)
CREATE OR REPLACE FUNCTION cleanup_old_backups()
RETURNS void AS $$
BEGIN
  DELETE FROM server_templates_backup
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- 백업 통계 뷰
CREATE OR REPLACE VIEW backup_statistics AS
SELECT 
  COUNT(*) as total_backups,
  COUNT(DISTINCT server_id) as unique_servers,
  MAX(created_at) as latest_backup,
  MIN(created_at) as oldest_backup,
  schema_version,
  COUNT(*) as backup_count
FROM server_templates_backup
GROUP BY schema_version
ORDER BY schema_version DESC;

-- 최신 백업 뷰 (서버별 최신 백업만 표시)
CREATE OR REPLACE VIEW latest_server_backups AS
SELECT DISTINCT ON (server_id) *
FROM server_templates_backup
ORDER BY server_id, created_at DESC;

-- 코멘트 추가
COMMENT ON TABLE server_templates_backup IS '서버 템플릿 백업 데이터를 저장하는 테이블';
COMMENT ON TABLE template_schemas IS '템플릿 스키마 버전 관리 테이블';
COMMENT ON VIEW backup_statistics IS '백업 통계 정보를 제공하는 뷰';
COMMENT ON VIEW latest_server_backups IS '서버별 최신 백업 데이터를 제공하는 뷰';

-- 샘플 스키마 삽입 (v2.0)
INSERT INTO template_schemas (version, schema_data) 
VALUES (
  '2.0',
  '{
    "version": "2.0",
    "fields": [
      {"name": "cpu", "type": "number", "required": true, "defaultValue": 50},
      {"name": "memory", "type": "number", "required": true, "defaultValue": 60},
      {"name": "disk", "type": "number", "required": true, "defaultValue": 70},
      {"name": "network", "type": "number", "required": true, "defaultValue": 100},
      {"name": "gpu", "type": "number", "required": false, "defaultValue": 0},
      {"name": "temperature", "type": "number", "required": false, "defaultValue": 65},
      {"name": "connections", "type": "number", "required": false, "defaultValue": 150},
      {"name": "iops", "type": "number", "required": false, "defaultValue": 1000}
    ],
    "customMetrics": []
  }'::jsonb
) ON CONFLICT (version) DO NOTHING;