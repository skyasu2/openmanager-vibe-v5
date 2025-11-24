-- 20251124_create_command_vectors_table.sql
-- command_vectors 테이블 생성 및 HNSW 인덱스 적용
-- 목적: 누락된 테이블 스키마 복구 및 최신 인덱스 기술 적용

-- 1. command_vectors 테이블 생성 (존재하지 않을 경우)
CREATE TABLE IF NOT EXISTS command_vectors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    embedding vector(384),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. RLS (Row Level Security) 활성화
ALTER TABLE command_vectors ENABLE ROW LEVEL SECURITY;

-- 3. RLS 정책 설정 (중복 방지)
DO $$
BEGIN
    -- 읽기 정책
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'command_vectors' AND policyname = 'Command vectors viewable by authenticated users'
    ) THEN
        CREATE POLICY "Command vectors viewable by authenticated users" 
        ON command_vectors FOR SELECT 
        TO authenticated 
        USING (true);
    END IF;

    -- 쓰기 정책 (관리자/인증된 사용자용)
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'command_vectors' AND policyname = 'Authenticated users can manage command vectors'
    ) THEN
        CREATE POLICY "Authenticated users can manage command vectors" 
        ON command_vectors FOR ALL 
        TO authenticated 
        USING (true);
    END IF;
END $$;

-- 4. HNSW 인덱스 생성 (pgvector 0.5.0+)
-- m=16, ef_construction=64: 성능과 정확도의 균형점
CREATE INDEX IF NOT EXISTS idx_command_vectors_embedding_hnsw 
ON command_vectors 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- 5. 업데이트 트리거 (updated_at 자동 갱신)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_command_vectors_updated_at'
    ) THEN
        CREATE TRIGGER update_command_vectors_updated_at
        BEFORE UPDATE ON command_vectors
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- 6. 코멘트 추가
COMMENT ON TABLE command_vectors IS 'RAG 시스템을 위한 명령어 벡터 저장소 (384차원)';
COMMENT ON COLUMN command_vectors.embedding IS 'Google Generative AI 임베딩 벡터';
