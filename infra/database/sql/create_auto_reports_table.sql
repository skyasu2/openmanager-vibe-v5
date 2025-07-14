-- 📄 자동 장애 보고서 테이블 생성
-- OpenManager Vibe v5 - Auto Reports Database Schema

-- 기존 테이블이 있다면 삭제
DROP TABLE IF EXISTS auto_reports;

-- 자동 장애 보고서 테이블 생성
CREATE TABLE auto_reports (
    id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    status VARCHAR(50) NOT NULL CHECK (status IN ('generating', 'completed', 'error')),
    type VARCHAR(50) NOT NULL CHECK (type IN ('daily', 'incident', 'performance', 'security')),
    summary TEXT NOT NULL,
    details JSONB NOT NULL,
    content TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX idx_auto_reports_type ON auto_reports(type);
CREATE INDEX idx_auto_reports_generated_at ON auto_reports(generated_at DESC);
CREATE INDEX idx_auto_reports_status ON auto_reports(status);

-- RLS (Row Level Security) 정책 활성화
ALTER TABLE auto_reports ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽기 가능
CREATE POLICY "Enable read access for all users" ON auto_reports
    FOR SELECT USING (true);

-- 인증된 사용자만 삽입 가능
CREATE POLICY "Enable insert for authenticated users only" ON auto_reports
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 인증된 사용자만 업데이트 가능
CREATE POLICY "Enable update for authenticated users only" ON auto_reports
    FOR UPDATE USING (auth.role() = 'authenticated');

-- 인증된 사용자만 삭제 가능
CREATE POLICY "Enable delete for authenticated users only" ON auto_reports
    FOR DELETE USING (auth.role() = 'authenticated');

-- 트리거 함수: updated_at 자동 업데이트
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 트리거 생성
CREATE TRIGGER update_auto_reports_updated_at 
    BEFORE UPDATE ON auto_reports 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 샘플 데이터 삽입 (선택사항)
INSERT INTO auto_reports (
    id, 
    title, 
    generated_at, 
    status, 
    type, 
    summary, 
    details, 
    content
) VALUES (
    'sample_report_' || extract(epoch from now())::text,
    '시스템 초기화 보고서',
    NOW(),
    'completed',
    'daily',
    'OpenManager Vibe v5 시스템이 성공적으로 초기화되었습니다.',
    '{"totalServers": 30, "healthyServers": 28, "warningServers": 2, "criticalServers": 0, "totalIncidents": 0, "resolvedIncidents": 0, "avgResponseTime": 150, "cpuUsage": 45, "memoryUsage": 62, "diskUsage": 38}'::jsonb,
    '# 시스템 초기화 보고서\n\n## 📊 전체 요약\n- **총 서버 수**: 30개\n- **정상 서버**: 28개\n- **주의 서버**: 2개\n- **위험 서버**: 0개\n\n## 🎯 시스템 상태\n모든 핵심 시스템이 정상적으로 작동하고 있습니다.'
);

-- 테이블 정보 확인
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'auto_reports'
ORDER BY ordinal_position; 