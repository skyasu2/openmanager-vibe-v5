-- OpenManager Vibe v5 - Supabase 스키마 설정
-- 이 파일을 Supabase SQL Editor에서 실행하세요

-- 1. pgvector 확장 활성화 (벡터 검색용)
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. 벡터 테이블 생성 함수
CREATE OR REPLACE FUNCTION public.create_vector_table(table_name text)
RETURNS void AS $$
BEGIN
  EXECUTE format('
    CREATE TABLE IF NOT EXISTS %I (
      id SERIAL PRIMARY KEY,
      content TEXT NOT NULL,
      embedding vector(1536),
      metadata JSONB DEFAULT ''{}''::jsonb,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )', table_name);
  
  -- 벡터 인덱스 생성
  EXECUTE format('
    CREATE INDEX IF NOT EXISTS %I_embedding_idx 
    ON %I USING ivfflat (embedding vector_cosine_ops) 
    WITH (lists = 100)', table_name || '_embedding', table_name);
END;
$$ LANGUAGE plpgsql;

-- 3. organization_settings 테이블
CREATE TABLE IF NOT EXISTS organization_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  setting_key VARCHAR(255) NOT NULL,
  setting_value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(organization_id, setting_key)
);

-- 4. custom_rules 테이블
CREATE TABLE IF NOT EXISTS custom_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  rule_name VARCHAR(255) NOT NULL,
  rule_type VARCHAR(100) NOT NULL, -- 'ai_response', 'monitoring', 'alert' 등
  rule_config JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. user_profiles 테이블
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  display_name VARCHAR(255),
  avatar_url TEXT,
  role VARCHAR(100) DEFAULT 'user', -- 'admin', 'user', 'viewer'
  preferences JSONB DEFAULT '{}'::jsonb,
  organization_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. 벡터 테이블들 생성
SELECT create_vector_table('ai_embeddings');
SELECT create_vector_table('document_embeddings');
SELECT create_vector_table('context_embeddings');

-- 7. RLS (Row Level Security) 설정
ALTER TABLE organization_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 8. 기본 정책 생성 (필요에 따라 수정)
CREATE POLICY "Enable read access for all users" ON organization_settings
  FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON custom_rules
  FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON user_profiles
  FOR SELECT USING (true);

-- 9. 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 10. 업데이트 트리거 적용
CREATE TRIGGER update_organization_settings_updated_at 
  BEFORE UPDATE ON organization_settings 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_custom_rules_updated_at 
  BEFORE UPDATE ON custom_rules 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at 
  BEFORE UPDATE ON user_profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 11. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_organization_settings_org_id ON organization_settings(organization_id);
CREATE INDEX IF NOT EXISTS idx_custom_rules_org_id ON custom_rules(organization_id);
CREATE INDEX IF NOT EXISTS idx_custom_rules_active ON custom_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_user_profiles_org_id ON user_profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);

-- 12. 완료 확인
DO $$
BEGIN
  RAISE NOTICE '✅ OpenManager Vibe v5 스키마 설정 완료!';
  RAISE NOTICE '📋 생성된 테이블: organization_settings, custom_rules, user_profiles';
  RAISE NOTICE '🔍 생성된 벡터 테이블: ai_embeddings, document_embeddings, context_embeddings';
  RAISE NOTICE '🔧 생성된 함수: create_vector_table, update_updated_at_column';
END $$; 