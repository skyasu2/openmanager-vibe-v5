-- 🔧 Supabase RPC 함수 수정
-- 벡터 검색이 작동하지 않는 문제 해결
-- 1. 기존 함수 삭제
DROP FUNCTION IF EXISTS search_similar_commands(vector(384), float, int);
-- 2. 올바른 RPC 함수 재생성
CREATE OR REPLACE FUNCTION search_similar_commands(
        query_embedding vector(384),
        match_threshold float DEFAULT 0.7,
        match_count int DEFAULT 5
    ) RETURNS TABLE (
        id text,
        content text,
        metadata jsonb,
        similarity float
    ) LANGUAGE sql STABLE AS $$
SELECT command_vectors.id,
    command_vectors.content,
    command_vectors.metadata,
    1 - (command_vectors.embedding <=> query_embedding) as similarity
FROM command_vectors
WHERE command_vectors.embedding IS NOT NULL
    AND 1 - (command_vectors.embedding <=> query_embedding) > match_threshold
ORDER BY command_vectors.embedding <=> query_embedding
LIMIT match_count;
$$;
-- 3. 임계값 없는 버전 (디버깅용)
CREATE OR REPLACE FUNCTION search_all_commands(
        query_embedding vector(384),
        match_count int DEFAULT 10
    ) RETURNS TABLE (
        id text,
        content text,
        metadata jsonb,
        similarity float
    ) LANGUAGE sql STABLE AS $$
SELECT command_vectors.id,
    command_vectors.content,
    command_vectors.metadata,
    1 - (command_vectors.embedding <=> query_embedding) as similarity
FROM command_vectors
WHERE command_vectors.embedding IS NOT NULL
ORDER BY command_vectors.embedding <=> query_embedding
LIMIT match_count;
$$;
-- 4. 테스트 쿼리
SELECT 'RPC 함수 수정 완료!' as status;
-- 5. 샘플 테스트 (임베딩 벡터는 실제 값으로 교체 필요)
-- SELECT * FROM search_all_commands(ARRAY[0.1,0.2,0.3,...]::vector(384), 3);