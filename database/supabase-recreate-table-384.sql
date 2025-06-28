-- 🚀 Supabase 벡터 테이블 재생성 (384차원)
-- 이 스크립트를 Supabase Dashboard SQL Editor에서 실행하세요
-- 1. 기존 테이블 완전 삭제
DROP TABLE IF EXISTS command_vectors CASCADE;
-- 2. pgvector 확장 활성화 (이미 있으면 무시)
CREATE EXTENSION IF NOT EXISTS vector;
-- 3. 새로운 384차원 벡터 테이블 생성
CREATE TABLE command_vectors (
    id TEXT PRIMARY KEY,
    content TEXT NOT NULL,
    metadata JSONB NOT NULL,
    embedding vector(384),
    -- 384차원으로 변경
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- 4. 인덱스 생성 (성능 최적화)
CREATE INDEX ON command_vectors USING ivfflat (embedding vector_cosine_ops);
-- 5. RPC 함수들 재생성
-- 5-1. 유사도 검색 함수 (384차원)
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
-- 5-2. 전체 검색 함수 (텍스트 기반)
CREATE OR REPLACE FUNCTION search_all_commands(search_query text) RETURNS TABLE (
        id text,
        content text,
        metadata jsonb
    ) LANGUAGE sql STABLE AS $$
SELECT command_vectors.id,
    command_vectors.content,
    command_vectors.metadata
FROM command_vectors
WHERE command_vectors.content ILIKE '%' || search_query || '%'
    OR command_vectors.id ILIKE '%' || search_query || '%'
ORDER BY CASE
        WHEN command_vectors.content ILIKE search_query || '%' THEN 1
        WHEN command_vectors.content ILIKE '%' || search_query || '%' THEN 2
        ELSE 3
    END,
    command_vectors.created_at DESC
LIMIT 10;
$$;
-- 6. 테이블 권한 설정
ALTER TABLE command_vectors ENABLE ROW LEVEL SECURITY;
-- 모든 사용자가 읽기 가능
CREATE POLICY "Allow read access" ON command_vectors FOR
SELECT USING (true);
-- 서비스 롤만 쓰기 가능
CREATE POLICY "Allow insert for service role" ON command_vectors FOR
INSERT WITH CHECK (true);
CREATE POLICY "Allow update for service role" ON command_vectors FOR
UPDATE USING (true);
CREATE POLICY "Allow delete for service role" ON command_vectors FOR DELETE USING (true);
-- 완료 메시지
SELECT '✅ 384차원 벡터 테이블 재생성 완료!' as status;