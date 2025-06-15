-- =========================================
-- 🗄️ Supabase pgvector 설정 스크립트
-- =========================================

-- 1. pgvector 확장 활성화
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. 벡터 문서 테이블 생성
CREATE TABLE IF NOT EXISTS vector_documents (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  embedding vector(1536), -- OpenAI ada-002 차원
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 벡터 유사도 검색을 위한 인덱스 생성
CREATE INDEX IF NOT EXISTS vector_documents_embedding_idx 
ON vector_documents USING ivfflat (embedding vector_cosine_ops) 
WITH (lists = 100);

-- 4. 메타데이터 검색을 위한 GIN 인덱스
CREATE INDEX IF NOT EXISTS vector_documents_metadata_idx 
ON vector_documents USING GIN (metadata);

-- 5. 업데이트 시간 자동 갱신 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. 업데이트 트리거 생성
DROP TRIGGER IF EXISTS update_vector_documents_updated_at ON vector_documents;
CREATE TRIGGER update_vector_documents_updated_at
    BEFORE UPDATE ON vector_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =========================================
-- 🛠️ 헬퍼 함수들
-- =========================================

-- 벡터 유사도 검색 함수
CREATE OR REPLACE FUNCTION search_documents(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.3,
  match_count int DEFAULT 10,
  metadata_filter jsonb DEFAULT '{}'::jsonb
)
RETURNS TABLE (
  id text,
  content text,
  metadata jsonb,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    vector_documents.id,
    vector_documents.content,
    vector_documents.metadata,
    1 - (vector_documents.embedding <=> query_embedding) AS similarity
  FROM vector_documents
  WHERE 
    (metadata_filter = '{}'::jsonb OR vector_documents.metadata @> metadata_filter)
    AND 1 - (vector_documents.embedding <=> query_embedding) > match_threshold
  ORDER BY vector_documents.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- 벡터 삽입/업데이트 함수
CREATE OR REPLACE FUNCTION upsert_document(
  doc_id text,
  doc_content text,
  doc_embedding vector(1536),
  doc_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE sql
AS $$
  INSERT INTO vector_documents (id, content, embedding, metadata)
  VALUES (doc_id, doc_content, doc_embedding, doc_metadata)
  ON CONFLICT (id) 
  DO UPDATE SET
    content = EXCLUDED.content,
    embedding = EXCLUDED.embedding,
    metadata = EXCLUDED.metadata,
    updated_at = NOW();
$$;

-- 벡터 DB 통계 함수
CREATE OR REPLACE FUNCTION get_vector_stats()
RETURNS TABLE (
  total_documents bigint,
  avg_similarity float,
  storage_size text
)
LANGUAGE sql STABLE
AS $$
  SELECT
    COUNT(*) as total_documents,
    0.75 as avg_similarity, -- 예시값
    pg_size_pretty(pg_total_relation_size('vector_documents')) as storage_size
  FROM vector_documents;
$$;

-- =========================================
-- 🔧 관리 함수들
-- =========================================

-- pgvector 확장 활성화 헬퍼
CREATE OR REPLACE FUNCTION enable_pgvector_if_needed()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- pgvector가 이미 설치되어 있는지 확인
  IF NOT EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'vector'
  ) THEN
    CREATE EXTENSION vector;
    RAISE NOTICE 'pgvector 확장이 활성화되었습니다.';
  ELSE
    RAISE NOTICE 'pgvector 확장이 이미 활성화되어 있습니다.';
  END IF;
END;
$$;

-- 벡터 테이블 생성 헬퍼
CREATE OR REPLACE FUNCTION create_vector_table(table_name text DEFAULT 'vector_documents')
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  EXECUTE format('
    CREATE TABLE IF NOT EXISTS %I (
      id TEXT PRIMARY KEY,
      content TEXT NOT NULL,
      embedding vector(1536),
      metadata JSONB DEFAULT ''{}''::jsonb,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )', table_name);
  
  RAISE NOTICE '벡터 테이블 %가 생성되었습니다.', table_name;
END;
$$;

-- 벡터 인덱스 생성 헬퍼
CREATE OR REPLACE FUNCTION create_vector_index(table_name text DEFAULT 'vector_documents')
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- IVFFlat 인덱스 생성 (코사인 유사도)
  EXECUTE format('
    CREATE INDEX IF NOT EXISTS %I_embedding_idx 
    ON %I USING ivfflat (embedding vector_cosine_ops) 
    WITH (lists = 100)', table_name, table_name);
  
  -- 메타데이터 GIN 인덱스 생성
  EXECUTE format('
    CREATE INDEX IF NOT EXISTS %I_metadata_idx 
    ON %I USING GIN (metadata)', table_name, table_name);
  
  RAISE NOTICE '벡터 인덱스가 생성되었습니다: %', table_name;
END;
$$;

-- SQL 실행 헬퍼 (개발용)
CREATE OR REPLACE FUNCTION execute_sql(sql text)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  EXECUTE sql;
  RAISE NOTICE 'SQL 실행 완료: %', left(sql, 100);
END;
$$;

-- =========================================
-- 🎯 테스트 데이터 삽입 (선택사항)
-- =========================================

-- 샘플 벡터 문서 삽입
DO $$
BEGIN
  -- 샘플 문서 1
  PERFORM upsert_document(
    'sample-1',
    '서버 모니터링 시스템의 CPU 사용률이 높습니다.',
    array_fill(0.1, ARRAY[1536])::vector,
    '{"category": "monitoring", "priority": "high"}'::jsonb
  );
  
  -- 샘플 문서 2
  PERFORM upsert_document(
    'sample-2',
    'Redis 메모리 사용량이 임계치를 초과했습니다.',
    array_fill(0.2, ARRAY[1536])::vector,
    '{"category": "database", "priority": "medium"}'::jsonb
  );
  
  RAISE NOTICE '샘플 벡터 문서가 삽입되었습니다.';
END;
$$;

-- =========================================
-- 🏁 설정 완료 확인
-- =========================================

-- 설정 상태 확인
SELECT 
  'pgvector 확장' as component,
  CASE WHEN EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') 
    THEN '✅ 활성화됨' 
    ELSE '❌ 비활성화됨' 
  END as status
UNION ALL
SELECT 
  'vector_documents 테이블' as component,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vector_documents') 
    THEN '✅ 생성됨' 
    ELSE '❌ 없음' 
  END as status
UNION ALL
SELECT 
  '벡터 인덱스' as component,
  CASE WHEN EXISTS (SELECT 1 FROM pg_indexes WHERE indexname LIKE '%embedding_idx%') 
    THEN '✅ 생성됨' 
    ELSE '❌ 없음' 
  END as status;

-- 벡터 DB 통계 출력
SELECT * FROM get_vector_stats();