-- ⚙️ CustomContextManager 테이블 생성 스크립트
-- 조직 설정, 커스텀 규칙, 사용자 프로필 관리

-- 🏢 조직 설정 테이블
CREATE TABLE IF NOT EXISTS organization_settings (
  id TEXT PRIMARY KEY,
  organization_name TEXT NOT NULL,
  settings_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 📏 커스텀 규칙 테이블
CREATE TABLE IF NOT EXISTS custom_rules (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('threshold', 'automation', 'notification', 'analysis')),
  rule_data JSONB NOT NULL,
  enabled BOOLEAN DEFAULT true,
  created_by TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 👤 사용자 프로필 테이블
CREATE TABLE IF NOT EXISTS user_profiles (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'operator', 'viewer')),
  organization_id TEXT,
  profile_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (organization_id) REFERENCES organization_settings(id) ON DELETE SET NULL
);

-- 📋 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_organization_settings_name ON organization_settings(organization_name);
CREATE INDEX IF NOT EXISTS idx_custom_rules_category ON custom_rules(category);
CREATE INDEX IF NOT EXISTS idx_custom_rules_enabled ON custom_rules(enabled);
CREATE INDEX IF NOT EXISTS idx_custom_rules_created_by ON custom_rules(created_by);
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON user_profiles(username);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_org_id ON user_profiles(organization_id);

-- 🔄 updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 🔄 트리거 생성
DROP TRIGGER IF EXISTS update_organization_settings_updated_at ON organization_settings;
CREATE TRIGGER update_organization_settings_updated_at
  BEFORE UPDATE ON organization_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_custom_rules_updated_at ON custom_rules;
CREATE TRIGGER update_custom_rules_updated_at
  BEFORE UPDATE ON custom_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 🛡️ RLS (Row Level Security) 정책 (선택사항)
-- ALTER TABLE organization_settings ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE custom_rules ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 📊 초기 테스트 데이터 (개발용)
INSERT INTO organization_settings (id, organization_name, settings_data) VALUES 
('org_default', 'OpenManager', '{
  "id": "org_default",
  "organizationName": "OpenManager",
  "thresholds": {
    "cpu": {"warning": 70, "critical": 90},
    "memory": {"warning": 80, "critical": 95},
    "disk": {"warning": 85, "critical": 95},
    "response_time": {"warning": 1000, "critical": 3000}
  },
  "notifications": {
    "email": {"enabled": false, "addresses": []},
    "slack": {"enabled": false},
    "webhook": {"enabled": false}
  },
  "customGuides": [],
  "preferences": {
    "language": "ko",
    "timezone": "Asia/Seoul",
    "dateFormat": "YYYY-MM-DD HH:mm:ss",
    "autoResolveAlerts": false,
    "maintenanceWindows": []
  },
  "integrations": {
    "monitoring": [],
    "alerting": []
  }
}')
ON CONFLICT (id) DO NOTHING;

-- ✅ 확인 쿼리
-- SELECT COUNT(*) as organization_count FROM organization_settings;
-- SELECT COUNT(*) as rules_count FROM custom_rules;
-- SELECT COUNT(*) as users_count FROM user_profiles; 