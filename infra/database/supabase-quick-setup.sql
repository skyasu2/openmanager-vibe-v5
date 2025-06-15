-- 🚀 OpenManager Vibe v5 - 즉시 배포 에러 해결용 스키마
-- Supabase Studio → SQL Editor에서 실행하세요

-- 1. pgvector 확장 (AI 검색용)
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. 벡터 테이블 생성 함수 (가장 중요!)
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
  
  EXECUTE format('
    CREATE INDEX IF NOT EXISTS %I_embedding_idx 
    ON %I USING ivfflat (embedding vector_cosine_ops) 
    WITH (lists = 100)', table_name || '_embedding', table_name);
END;
$$ LANGUAGE plpgsql;

-- 3. 누락된 테이블들 생성
CREATE TABLE IF NOT EXISTS organization_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  setting_key VARCHAR(255) NOT NULL,
  setting_value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(organization_id, setting_key)
);

CREATE TABLE IF NOT EXISTS custom_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  rule_name VARCHAR(255) NOT NULL,
  rule_type VARCHAR(100) NOT NULL,
  rule_config JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  display_name VARCHAR(255),
  avatar_url TEXT,
  role VARCHAR(100) DEFAULT 'user',
  preferences JSONB DEFAULT '{}'::jsonb,
  organization_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. 벡터 테이블들 생성
SELECT create_vector_table('ai_embeddings');
SELECT create_vector_table('document_embeddings');
SELECT create_vector_table('context_embeddings');

-- 5. 완료 확인
DO $$
BEGIN
  RAISE NOTICE '✅ 배포 에러 해결 완료!';
  RAISE NOTICE '🔧 create_vector_table 함수 생성됨';
  RAISE NOTICE '📋 필수 테이블들 생성됨: organization_settings, custom_rules, user_profiles';
  RAISE NOTICE '🔍 AI 벡터 테이블들 생성됨: ai_embeddings, document_embeddings, context_embeddings';
END $$; 