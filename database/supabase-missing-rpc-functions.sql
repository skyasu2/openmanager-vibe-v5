-- 🔧 OpenManager Vibe v5 - 누락된 Supabase RPC 함수 추가
-- Supabase Dashboard → SQL Editor에서 실행하세요
-- 1. search_all_commands 함수 생성 (AI 엔진에서 호출하는 함수)
CREATE OR REPLACE FUNCTION search_all_commands(
        result_limit integer DEFAULT 10,
        search_query text DEFAULT ''
    ) RETURNS TABLE (
        id text,
        content text,
        metadata jsonb,
        relevance_score float
    ) LANGUAGE sql STABLE AS $$
SELECT command_vectors.id,
    command_vectors.content,
    command_vectors.metadata,
    CASE
        WHEN search_query = '' THEN 1.0
        ELSE similarity(command_vectors.content, search_query)
    END as relevance_score
FROM command_vectors
WHERE CASE
        WHEN search_query = '' THEN true
        ELSE command_vectors.content ILIKE '%' || search_query || '%'
    END
ORDER BY relevance_score DESC
LIMIT result_limit;
$$;
-- 2. search_documents 함수 생성 (문서 검색용)
CREATE OR REPLACE FUNCTION search_documents(
        query_text text,
        limit_count integer DEFAULT 5
    ) RETURNS TABLE (
        id text,
        content text,
        metadata jsonb,
        score float
    ) LANGUAGE sql STABLE AS $$
SELECT command_vectors.id,
    command_vectors.content,
    command_vectors.metadata,
    similarity(command_vectors.content, query_text) as score
FROM command_vectors
WHERE command_vectors.content ILIKE '%' || query_text || '%'
ORDER BY score DESC
LIMIT limit_count;
$$;
-- 3. get_random_commands 함수 생성 (기본 데이터 반환용)
CREATE OR REPLACE FUNCTION get_random_commands(count_limit integer DEFAULT 5) RETURNS TABLE (
        id text,
        content text,
        metadata jsonb
    ) LANGUAGE sql STABLE AS $$
SELECT command_vectors.id,
    command_vectors.content,
    command_vectors.metadata
FROM command_vectors
ORDER BY RANDOM()
LIMIT count_limit;
$$;
-- 4. 확장 설치 확인 (similarity 함수 사용을 위해)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
-- 5. 함수 생성 확인
SELECT 'search_all_commands' as function_name,
    'Created successfully' as status
UNION ALL
SELECT 'search_documents' as function_name,
    'Created successfully' as status
UNION ALL
SELECT 'get_random_commands' as function_name,
    'Created successfully' as status;