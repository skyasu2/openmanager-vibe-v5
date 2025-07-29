-- 🧪 Database Hook 테스트용 스키마
-- 이 파일은 pre-database-hook.sh 트리거 테스트용입니다.

-- 안전한 테이블 생성
CREATE TABLE test_users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 생성 (백업 필요 작업)
CREATE INDEX idx_test_users_email ON test_users(email);
CREATE INDEX idx_test_users_created_at ON test_users(created_at);

-- 위험한 작업 시뮬레이션 (차단되어야 함)
-- DROP TABLE test_users;  -- 주석 처리됨
-- TRUNCATE test_users;    -- 주석 처리됨

-- RLS 정책 설정
ALTER TABLE test_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY test_users_policy ON test_users
    FOR ALL
    TO authenticated
    USING (auth.uid()::text = user_id::text);