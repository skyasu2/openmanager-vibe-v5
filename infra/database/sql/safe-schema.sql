-- 🧪 안전한 Database Hook 테스트용 스키마

-- 안전한 테이블 생성
CREATE TABLE safe_test_table (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 안전한 인덱스 생성
CREATE INDEX idx_safe_test_name ON safe_test_table(name);

-- RLS 정책 설정
ALTER TABLE safe_test_table ENABLE ROW LEVEL SECURITY;