-- 🔐 OpenManager Vibe v5 - 암호화된 환경변수 테이블 생성
-- Supabase Studio → SQL Editor에서 실행하세요
-- encrypted_environment_vars 테이블 생성
CREATE TABLE IF NOT EXISTS public.encrypted_environment_vars (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key_name VARCHAR(255) NOT NULL UNIQUE,
    encrypted_value TEXT NOT NULL,
    encryption_method VARCHAR(100) DEFAULT 'AES-256-GCM',
    iv TEXT,
    salt TEXT,
    environment VARCHAR(50) DEFAULT 'production',
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    last_accessed_at TIMESTAMP WITH TIME ZONE
);
-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_encrypted_env_key_name ON public.encrypted_environment_vars(key_name);
CREATE INDEX IF NOT EXISTS idx_encrypted_env_environment ON public.encrypted_environment_vars(environment);
CREATE INDEX IF NOT EXISTS idx_encrypted_env_active ON public.encrypted_environment_vars(is_active);
-- RLS (Row Level Security) 정책 설정
ALTER TABLE public.encrypted_environment_vars ENABLE ROW LEVEL SECURITY;
-- 서비스 역할에 대한 전체 접근 권한
CREATE POLICY "Service role can access all encrypted env vars" ON public.encrypted_environment_vars FOR ALL TO service_role USING (true) WITH CHECK (true);
-- 인증된 사용자는 읽기만 가능
CREATE POLICY "Authenticated users can read encrypted env vars" ON public.encrypted_environment_vars FOR
SELECT TO authenticated USING (true);
-- 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_encrypted_env_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = CURRENT_TIMESTAMP;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- 업데이트 트리거 생성
CREATE TRIGGER trigger_update_encrypted_env_updated_at BEFORE
UPDATE ON public.encrypted_environment_vars FOR EACH ROW EXECUTE FUNCTION update_encrypted_env_updated_at();
-- 기본 환경변수 삽입 (테스트용)
INSERT INTO public.encrypted_environment_vars (
        key_name,
        encrypted_value,
        description,
        environment
    )
VALUES (
        'SAMPLE_KEY',
        'encrypted_sample_value',
        'Sample encrypted environment variable',
        'production'
    ) ON CONFLICT (key_name) DO NOTHING;
-- 완료 메시지
DO $$ BEGIN RAISE NOTICE '✅ encrypted_environment_vars 테이블 생성 완료!';
RAISE NOTICE '🔐 암호화된 환경변수 저장소 준비됨';
RAISE NOTICE '🛡️ RLS 보안 정책 적용됨';
RAISE NOTICE '📊 인덱스 및 트리거 설정 완료';
RAISE NOTICE '🚀 이제 Health API가 정상 작동할 것입니다!';
END $$;