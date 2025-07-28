-- 성능 최적화 SQL 스크립트
-- 작성일: 2025-01-27
-- 목적: 데이터베이스 인덱스 최적화 및 불필요한 테이블 정리

-- 1. 빈 embedding 테이블 정리 (데이터가 없으므로 TRUNCATE 사용)
TRUNCATE TABLE ai_embeddings CASCADE;
TRUNCATE TABLE document_embeddings CASCADE;
TRUNCATE TABLE context_embeddings CASCADE;

-- 2. command_vectors 테이블 최적화
-- 2.1 벡터 검색을 위한 IVFFlat 인덱스 (11개 레코드이므로 lists=10)
CREATE INDEX IF NOT EXISTS idx_command_vectors_embedding 
ON command_vectors USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 10);

-- 2.2 메타데이터 검색을 위한 GIN 인덱스
CREATE INDEX IF NOT EXISTS idx_command_vectors_metadata 
ON command_vectors USING GIN (metadata);

-- 2.3 시간 기반 쿼리를 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_command_vectors_created 
ON command_vectors(created_at DESC);

-- 2.4 content 필드 텍스트 검색을 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_command_vectors_content_trgm
ON command_vectors USING gin (content gin_trgm_ops);

-- 3. 기타 테이블 인덱스 최적화
-- 3.1 user_profiles 테이블
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id 
ON user_profiles(user_id);

CREATE INDEX IF NOT EXISTS idx_user_profiles_org_id 
ON user_profiles(organization_id);

-- 3.2 organization_settings 테이블
CREATE INDEX IF NOT EXISTS idx_org_settings_org_id 
ON organization_settings(organization_id);

CREATE INDEX IF NOT EXISTS idx_org_settings_key 
ON organization_settings(setting_key);

-- 3.3 custom_rules 테이블
CREATE INDEX IF NOT EXISTS idx_custom_rules_org_id 
ON custom_rules(organization_id);

CREATE INDEX IF NOT EXISTS idx_custom_rules_active 
ON custom_rules(is_active) WHERE is_active = true;

-- 4. 통계 업데이트
ANALYZE command_vectors;
ANALYZE user_profiles;
ANALYZE organization_settings;
ANALYZE custom_rules;

-- 5. 현재 인덱스 상태 확인
SELECT 
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC;