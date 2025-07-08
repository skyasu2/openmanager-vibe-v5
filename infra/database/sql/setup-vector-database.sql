-- 🚀 OpenManager Vibe v5 - Supabase Vector Database Setup
-- pgvector 확장 활성화 및 벡터 검색 테이블 생성
-- 1. pgvector 확장 활성화
CREATE EXTENSION IF NOT EXISTS vector;
-- 2. pgvector 확장 확인 함수
CREATE OR REPLACE FUNCTION check_pgvector_extension() RETURNS BOOLEAN AS $$ BEGIN RETURN EXISTS (
        SELECT 1
        FROM pg_extension
        WHERE extname = 'vector'
    );
END;
$$ LANGUAGE plpgsql;
-- 3. pgvector 확장 활성화 함수
CREATE OR REPLACE FUNCTION enable_pgvector() RETURNS VOID AS $$ BEGIN CREATE EXTENSION IF NOT EXISTS vector;
END;
$$ LANGUAGE plpgsql;
-- 4. SQL 실행 함수 (테이블 생성용)
CREATE OR REPLACE FUNCTION execute_sql(sql TEXT) RETURNS VOID AS $$ BEGIN EXECUTE sql;
END;
$$ LANGUAGE plpgsql;
-- 5. 명령어 벡터 테이블 생성
CREATE TABLE IF NOT EXISTS command_vectors (
    id TEXT PRIMARY KEY,
    content TEXT NOT NULL,
    metadata JSONB NOT NULL,
    embedding vector(384),
    -- OpenAI text-embedding-3-small 차원
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- 6. 벡터 유사도 검색을 위한 인덱스 생성
-- IVFFlat 인덱스 (코사인 유사도 검색용)
CREATE INDEX IF NOT EXISTS command_vectors_embedding_cosine_idx ON command_vectors USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
-- L2 거리 인덱스 (유클리드 거리 검색용)
CREATE INDEX IF NOT EXISTS command_vectors_embedding_l2_idx ON command_vectors USING ivfflat (embedding vector_l2_ops) WITH (lists = 100);
-- 7. 메타데이터 검색을 위한 GIN 인덱스
CREATE INDEX IF NOT EXISTS command_vectors_metadata_idx ON command_vectors USING gin (metadata);
-- 8. 카테고리별 검색을 위한 인덱스
CREATE INDEX IF NOT EXISTS command_vectors_category_idx ON command_vectors USING btree ((metadata->>'category'));
-- 9. 벡터 유사도 검색 함수 (코사인 유사도)
CREATE OR REPLACE FUNCTION search_similar_commands(
        query_embedding vector(384),
        similarity_threshold FLOAT DEFAULT 0.7,
        max_results INTEGER DEFAULT 5,
        category_filter TEXT DEFAULT NULL
    ) RETURNS TABLE (
        id TEXT,
        content TEXT,
        metadata JSONB,
        similarity FLOAT
    ) AS $$ BEGIN RETURN QUERY
SELECT cv.id,
    cv.content,
    cv.metadata,
    1 - (cv.embedding <=> query_embedding) AS similarity
FROM command_vectors cv
WHERE (
        category_filter IS NULL
        OR cv.metadata->>'category' = category_filter
    )
    AND (1 - (cv.embedding <=> query_embedding)) >= similarity_threshold
ORDER BY cv.embedding <=> query_embedding
LIMIT max_results;
END;
$$ LANGUAGE plpgsql;
-- 10. 벡터 유사도 검색 함수 (L2 거리)
CREATE OR REPLACE FUNCTION search_similar_commands_l2(
        query_embedding vector(384),
        distance_threshold FLOAT DEFAULT 1.0,
        max_results INTEGER DEFAULT 5,
        category_filter TEXT DEFAULT NULL
    ) RETURNS TABLE (
        id TEXT,
        content TEXT,
        metadata JSONB,
        distance FLOAT
    ) AS $$ BEGIN RETURN QUERY
SELECT cv.id,
    cv.content,
    cv.metadata,
    cv.embedding <->query_embedding AS distance
FROM command_vectors cv
WHERE (
        category_filter IS NULL
        OR cv.metadata->>'category' = category_filter
    )
    AND (cv.embedding <->query_embedding) <= distance_threshold
ORDER BY cv.embedding <->query_embedding
LIMIT max_results;
END;
$$ LANGUAGE plpgsql;
-- 11. 하이브리드 검색 함수 (벡터 + 키워드)
CREATE OR REPLACE FUNCTION hybrid_search_commands(
        query_embedding vector(384),
        search_keywords TEXT [],
        similarity_threshold FLOAT DEFAULT 0.7,
        max_results INTEGER DEFAULT 5,
        category_filter TEXT DEFAULT NULL
    ) RETURNS TABLE (
        id TEXT,
        content TEXT,
        metadata JSONB,
        vector_similarity FLOAT,
        keyword_score INTEGER,
        combined_score FLOAT
    ) AS $$ BEGIN RETURN QUERY
SELECT cv.id,
    cv.content,
    cv.metadata,
    (1 - (cv.embedding <=> query_embedding)) AS vector_similarity,
    (
        SELECT COUNT(*)::INTEGER
        FROM unnest(search_keywords) AS keyword
        WHERE cv.content ILIKE '%' || keyword || '%'
            OR cv.metadata->>'tags' ILIKE '%' || keyword || '%'
    ) AS keyword_score,
    (
        (1 - (cv.embedding <=> query_embedding)) * 0.7 + (
            SELECT COUNT(*)::FLOAT / array_length(search_keywords, 1)
            FROM unnest(search_keywords) AS keyword
            WHERE cv.content ILIKE '%' || keyword || '%'
                OR cv.metadata->>'tags' ILIKE '%' || keyword || '%'
        ) * 0.3
    ) AS combined_score
FROM command_vectors cv
WHERE (
        category_filter IS NULL
        OR cv.metadata->>'category' = category_filter
    )
    AND (1 - (cv.embedding <=> query_embedding)) >= similarity_threshold
ORDER BY combined_score DESC
LIMIT max_results;
END;
$$ LANGUAGE plpgsql;
-- 12. 벡터 데이터베이스 통계 함수
CREATE OR REPLACE FUNCTION get_vector_stats() RETURNS TABLE (
        total_documents INTEGER,
        categories JSONB,
        avg_embedding_dimension INTEGER,
        index_size TEXT
    ) AS $$ BEGIN RETURN QUERY
SELECT COUNT(*)::INTEGER AS total_documents,
    jsonb_object_agg(
        category,
        category_count
    ) AS categories,
    384 AS avg_embedding_dimension,
    pg_size_pretty(pg_total_relation_size('command_vectors')) AS index_size
FROM (
        SELECT metadata->>'category' AS category,
            COUNT(*) AS category_count
        FROM command_vectors
        GROUP BY metadata->>'category'
    ) cat_stats;
END;
$$ LANGUAGE plpgsql;
-- 13. 벡터 데이터 정리 함수
CREATE OR REPLACE FUNCTION cleanup_vector_data() RETURNS INTEGER AS $$
DECLARE deleted_count INTEGER;
BEGIN -- 중복 제거
DELETE FROM command_vectors cv1
WHERE EXISTS (
        SELECT 1
        FROM command_vectors cv2
        WHERE cv2.id = cv1.id
            AND cv2.created_at > cv1.created_at
    );
GET DIAGNOSTICS deleted_count = ROW_COUNT;
-- 빈 임베딩 제거
DELETE FROM command_vectors
WHERE embedding IS NULL
    OR array_length(embedding::real [], 1) = 0;
-- 인덱스 재구성
REINDEX TABLE command_vectors;
RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;
-- 14. RLS (Row Level Security) 정책 설정
ALTER TABLE command_vectors ENABLE ROW LEVEL SECURITY;
-- 읽기 정책 (모든 사용자가 읽기 가능)
CREATE POLICY "Allow read access to command_vectors" ON command_vectors FOR
SELECT USING (true);
-- 쓰기 정책 (인증된 사용자만 쓰기 가능)
CREATE POLICY "Allow insert access to command_vectors" ON command_vectors FOR
INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow update access to command_vectors" ON command_vectors FOR
UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow delete access to command_vectors" ON command_vectors FOR DELETE USING (auth.role() = 'authenticated');
-- 15. 벡터 데이터베이스 헬스체크 함수
CREATE OR REPLACE FUNCTION vector_db_health_check() RETURNS JSONB AS $$
DECLARE result JSONB;
doc_count INTEGER;
index_status BOOLEAN;
BEGIN -- 문서 수 확인
SELECT COUNT(*) INTO doc_count
FROM command_vectors;
-- 인덱스 상태 확인
SELECT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE tablename = 'command_vectors'
            AND indexname = 'command_vectors_embedding_cosine_idx'
    ) INTO index_status;
result := jsonb_build_object(
    'status',
    'healthy',
    'document_count',
    doc_count,
    'indexes_present',
    index_status,
    'pgvector_enabled',
    check_pgvector_extension(),
    'timestamp',
    NOW()
);
RETURN result;
EXCEPTION
WHEN OTHERS THEN RETURN jsonb_build_object(
    'status',
    'error',
    'error_message',
    SQLERRM,
    'timestamp',
    NOW()
);
END;
$$ LANGUAGE plpgsql;
-- 16. 초기 데이터 확인
SELECT 'Vector Database Setup Complete' AS status,
    check_pgvector_extension() AS pgvector_enabled,
    COUNT(*) AS existing_documents
FROM command_vectors;
-- 실행 완료 메시지
SELECT '🚀 Supabase Vector Database Setup Complete!' AS message,
    '✅ pgvector extension enabled' AS extension_status,
    '✅ Tables and indexes created' AS table_status,
    '✅ Search functions created' AS function_status,
    '✅ RLS policies configured' AS security_status;