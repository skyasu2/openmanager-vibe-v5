-- 🚀 Supabase RAG 시스템 벡터 검색 최적화 SQL 스크립트
-- AI 교차검증 기반 폴백 트래픽 차단 및 성능 최적화

-- ===============================================
-- 1. 현재 상태 확인
-- ===============================================

-- pgvector 확장 상태 확인
SELECT name, installed_version, default_version 
FROM pg_available_extensions 
WHERE name = 'vector';

-- 테이블 존재 확인
SELECT schemaname, tablename, tableowner 
FROM pg_tables 
WHERE tablename = 'command_vectors';

-- 현재 인덱스 상태 확인
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'command_vectors';

-- ===============================================
-- 2. 테이블 구조 최적화 (존재하지 않는 경우만)
-- ===============================================

-- command_vectors 테이블 생성 (존재하지 않는 경우)
CREATE TABLE IF NOT EXISTS command_vectors (
    id TEXT PRIMARY KEY,
    content TEXT NOT NULL,
    embedding vector(384),
    metadata JSONB DEFAULT '{}',
    category TEXT GENERATED ALWAYS AS ((metadata->>'category')) STORED,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===============================================
-- 3. 핵심 인덱스 생성 (Codex CLI 권장사항)
-- ===============================================

-- 메타데이터 GIN 인덱스 (빠른 JSON 검색)
CREATE INDEX IF NOT EXISTS idx_metadata_gin 
ON command_vectors USING gin (metadata);

-- 카테고리 인덱스 (생성 칼럼 기반)
CREATE INDEX IF NOT EXISTS idx_category 
ON command_vectors (category);

-- 벡터 인덱스 - HNSW 권장 (Qwen CLI 권장사항)
-- 데이터량이 적으면 IVFFlat, 많으면 HNSW
DO $$
DECLARE
    row_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO row_count FROM command_vectors;
    
    IF row_count < 1000 THEN
        -- 소규모 데이터: IVFFlat 사용
        EXECUTE 'CREATE INDEX IF NOT EXISTS embedding_ivfflat_idx 
                 ON command_vectors USING ivfflat (embedding vector_cosine_ops) 
                 WITH (lists = ' || GREATEST(50, SQRT(row_count)::int * 4) || ')';
    ELSE
        -- 대규모 데이터: HNSW 사용 (더 정확하고 빠름)
        EXECUTE 'CREATE INDEX IF NOT EXISTS embedding_hnsw_idx 
                 ON command_vectors USING hnsw (embedding vector_cosine_ops) 
                 WITH (m = 16, ef_construction = 64)';
    END IF;
END $$;

-- ===============================================
-- 4. 검색 함수 최적화 (폴백 트래픽 차단)
-- ===============================================

-- 기본 벡터 검색 함수 (최적화된 버전)
CREATE OR REPLACE FUNCTION search_similar_vectors(
    query_embedding vector(384),
    similarity_threshold FLOAT DEFAULT 0.3,
    max_results INTEGER DEFAULT 10
)
RETURNS TABLE(
    id TEXT,
    content TEXT,
    metadata JSONB,
    similarity FLOAT
) AS $$
BEGIN
    -- HNSW 인덱스 최적화 파라미터 설정
    SET LOCAL hnsw.ef_search = 64;
    
    RETURN QUERY
    SELECT 
        cv.id,
        cv.content,
        cv.metadata,
        (1 - (cv.embedding <=> query_embedding))::FLOAT as similarity
    FROM command_vectors cv
    WHERE 
        cv.embedding IS NOT NULL
        AND (1 - (cv.embedding <=> query_embedding)) > similarity_threshold
    ORDER BY cv.embedding <=> query_embedding
    LIMIT max_results;
END;
$$ LANGUAGE plpgsql;

-- 카테고리별 벡터 검색 함수
CREATE OR REPLACE FUNCTION search_vectors_by_category(
    query_embedding vector(384),
    category TEXT,
    similarity_threshold FLOAT DEFAULT 0.3,
    max_results INTEGER DEFAULT 10
)
RETURNS TABLE(
    id TEXT,
    content TEXT,
    metadata JSONB,
    similarity FLOAT
) AS $$
BEGIN
    -- HNSW 인덱스 최적화 파라미터 설정
    SET LOCAL hnsw.ef_search = 64;
    
    RETURN QUERY
    SELECT 
        cv.id,
        cv.content,
        cv.metadata,
        (1 - (cv.embedding <=> query_embedding))::FLOAT as similarity
    FROM command_vectors cv
    WHERE 
        cv.embedding IS NOT NULL
        AND cv.category = search_vectors_by_category.category
        AND (1 - (cv.embedding <=> query_embedding)) > similarity_threshold
    ORDER BY cv.embedding <=> query_embedding
    LIMIT max_results;
END;
$$ LANGUAGE plpgsql;

-- 하이브리드 검색 함수 (벡터 + 텍스트 점수 결합)
CREATE OR REPLACE FUNCTION hybrid_search_vectors(
    query_embedding vector(384),
    text_query TEXT,
    similarity_threshold FLOAT DEFAULT 0.3,
    max_results INTEGER DEFAULT 10
)
RETURNS TABLE(
    id TEXT,
    content TEXT,
    metadata JSONB,
    vector_similarity FLOAT,
    text_rank FLOAT,
    combined_score FLOAT
) AS $$
BEGIN
    -- HNSW 인덱스 최적화 파라미터 설정
    SET LOCAL hnsw.ef_search = 64;
    
    RETURN QUERY
    WITH vector_candidates AS (
        -- 벡터 후보군 확장 (max_results * 5)
        SELECT 
            cv.id,
            cv.content,
            cv.metadata,
            (1 - (cv.embedding <=> query_embedding))::FLOAT as vector_similarity
        FROM command_vectors cv
        WHERE 
            cv.embedding IS NOT NULL
            AND (1 - (cv.embedding <=> query_embedding)) > similarity_threshold
        ORDER BY cv.embedding <=> query_embedding
        LIMIT (max_results * 5)
    ),
    text_scores AS (
        -- 텍스트 랭킹 계산
        SELECT 
            vc.id,
            vc.content,
            vc.metadata,
            vc.vector_similarity,
            COALESCE(ts_rank(to_tsvector('english', vc.content), plainto_tsquery('english', text_query)), 0.0) as text_rank
        FROM vector_candidates vc
    )
    SELECT 
        ts.id,
        ts.content,
        ts.metadata,
        ts.vector_similarity,
        ts.text_rank,
        -- 가중 평균 스코어 (벡터 70%, 텍스트 30%)
        (0.7 * ts.vector_similarity + 0.3 * ts.text_rank)::FLOAT as combined_score
    FROM text_scores ts
    ORDER BY combined_score DESC
    LIMIT max_results;
END;
$$ LANGUAGE plpgsql;

-- ===============================================
-- 5. 2단계 조회 최적화 함수 (폴백용)
-- ===============================================

-- 1단계: ID와 임베딩만 조회하여 유사도 계산
CREATE OR REPLACE FUNCTION get_vector_ids_with_similarity(
    query_embedding vector(384),
    similarity_threshold FLOAT DEFAULT 0.3,
    max_results INTEGER DEFAULT 100
)
RETURNS TABLE(
    id TEXT,
    similarity FLOAT
) AS $$
BEGIN
    SET LOCAL hnsw.ef_search = 64;
    
    RETURN QUERY
    SELECT 
        cv.id,
        (1 - (cv.embedding <=> query_embedding))::FLOAT as similarity
    FROM command_vectors cv
    WHERE 
        cv.embedding IS NOT NULL
        AND (1 - (cv.embedding <=> query_embedding)) > similarity_threshold
    ORDER BY cv.embedding <=> query_embedding
    LIMIT max_results;
END;
$$ LANGUAGE plpgsql;

-- ===============================================
-- 6. 성능 모니터링 뷰
-- ===============================================

-- 벡터 검색 통계 뷰
CREATE OR REPLACE VIEW vector_search_stats AS
SELECT 
    COUNT(*) as total_vectors,
    COUNT(DISTINCT category) as unique_categories,
    AVG(LENGTH(content)) as avg_content_length,
    MIN(created_at) as oldest_document,
    MAX(updated_at) as latest_update
FROM command_vectors
WHERE embedding IS NOT NULL;

-- 인덱스 사용률 모니터링
CREATE OR REPLACE VIEW index_usage_stats AS
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as times_used,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes 
WHERE tablename = 'command_vectors'
ORDER BY idx_scan DESC;

-- ===============================================
-- 7. 테이블 최적화 및 분석
-- ===============================================

-- 테이블 통계 업데이트 (쿼리 플래너 최적화)
ANALYZE command_vectors;

-- 인덱스 리빌드 권장사항 확인
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation
FROM pg_stats 
WHERE tablename = 'command_vectors'
ORDER BY abs(correlation) DESC;

-- ===============================================
-- 8. 권한 설정
-- ===============================================

-- 함수 실행 권한 부여 (필요시)
-- GRANT EXECUTE ON FUNCTION search_similar_vectors TO authenticated;
-- GRANT EXECUTE ON FUNCTION search_vectors_by_category TO authenticated;
-- GRANT EXECUTE ON FUNCTION hybrid_search_vectors TO authenticated;
-- GRANT EXECUTE ON FUNCTION get_vector_ids_with_similarity TO authenticated;

-- ===============================================
-- 마무리: 최적화 완료 확인
-- ===============================================

-- 최종 인덱스 상태 확인
SELECT 
    indexname,
    indexdef,
    pg_size_pretty(pg_relation_size(indexname::regclass)) as index_size
FROM pg_indexes 
WHERE tablename = 'command_vectors'
ORDER BY indexname;

-- 최적화 완료 메시지
DO $$
BEGIN
    RAISE NOTICE '✅ Supabase RAG 벡터 검색 최적화 완료!';
    RAISE NOTICE '📊 인덱스: HNSW/IVFFlat + GIN + 카테고리';
    RAISE NOTICE '🔍 함수: search_similar_vectors, search_vectors_by_category, hybrid_search_vectors';
    RAISE NOTICE '⚡ 폴백 트래픽 70%% 감소 예상';
    RAISE NOTICE '🎯 다음 단계: postgres-vector-db.ts 폴백 로직 2단계 조회 최적화';
END $$;