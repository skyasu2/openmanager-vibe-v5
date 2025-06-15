-- 🤖 AI 자동 보고서 테이블 생성
-- OpenManager Vibe v5 - Auto Reports System

-- auto_reports 테이블 생성
CREATE TABLE IF NOT EXISTS public.auto_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    report_id VARCHAR(255) UNIQUE NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('daily', 'performance', 'incident', 'security', 'custom')),
    title VARCHAR(255) NOT NULL,
    summary TEXT,
    content JSONB NOT NULL,
    metadata JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'generated' CHECK (status IN ('generated', 'reviewed', 'archived')),
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'critical')),
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_by VARCHAR(100) DEFAULT 'system',
    reviewed_by VARCHAR(100),
    reviewed_at TIMESTAMP WITH TIME ZONE
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_auto_reports_type ON public.auto_reports(type);
CREATE INDEX IF NOT EXISTS idx_auto_reports_status ON public.auto_reports(status);
CREATE INDEX IF NOT EXISTS idx_auto_reports_priority ON public.auto_reports(priority);
CREATE INDEX IF NOT EXISTS idx_auto_reports_created_at ON public.auto_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_auto_reports_report_id ON public.auto_reports(report_id);
CREATE INDEX IF NOT EXISTS idx_auto_reports_tags ON public.auto_reports USING GIN(tags);

-- 업데이트 트리거 함수 생성
CREATE OR REPLACE FUNCTION update_auto_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 업데이트 트리거 생성
DROP TRIGGER IF EXISTS trigger_auto_reports_updated_at ON public.auto_reports;
CREATE TRIGGER trigger_auto_reports_updated_at
    BEFORE UPDATE ON public.auto_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_auto_reports_updated_at();

-- RLS (Row Level Security) 활성화
ALTER TABLE public.auto_reports ENABLE ROW LEVEL SECURITY;

-- 기본 정책: 모든 사용자가 읽기 가능
CREATE POLICY IF NOT EXISTS "auto_reports_select_policy" ON public.auto_reports
    FOR SELECT USING (true);

-- 기본 정책: 시스템만 삽입 가능
CREATE POLICY IF NOT EXISTS "auto_reports_insert_policy" ON public.auto_reports
    FOR INSERT WITH CHECK (created_by = 'system' OR created_by = current_user);

-- 기본 정책: 시스템과 리뷰어만 업데이트 가능
CREATE POLICY IF NOT EXISTS "auto_reports_update_policy" ON public.auto_reports
    FOR UPDATE USING (created_by = 'system' OR created_by = current_user);

-- 샘플 데이터 삽입 (선택사항)
INSERT INTO public.auto_reports (report_id, type, title, summary, content, priority, tags) VALUES
('sample_daily_001', 'daily', '일일 시스템 상태 보고서', '모든 시스템이 정상 동작 중입니다.', 
 '{"servers": {"total": 20, "online": 18, "warning": 2}, "performance": {"avg_response": "145ms", "uptime": "99.8%"}}',
 'normal', ARRAY['daily', 'system', 'status']),
('sample_performance_001', 'performance', '성능 분석 보고서', 'CPU 사용률이 평균보다 높습니다.',
 '{"cpu": {"usage": 75, "threshold": 70}, "memory": {"usage": 60, "threshold": 80}, "recommendations": ["스케일링 고려"]}',
 'high', ARRAY['performance', 'cpu', 'monitoring'])
ON CONFLICT (report_id) DO NOTHING;

-- 권한 설정
GRANT SELECT, INSERT, UPDATE ON public.auto_reports TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.auto_reports TO authenticated;

-- 코멘트 추가
COMMENT ON TABLE public.auto_reports IS 'AI 자동 생성 보고서 저장 테이블';
COMMENT ON COLUMN public.auto_reports.report_id IS '고유 보고서 식별자';
COMMENT ON COLUMN public.auto_reports.type IS '보고서 유형 (daily, performance, incident, security, custom)';
COMMENT ON COLUMN public.auto_reports.content IS '보고서 내용 (JSON 형태)';
COMMENT ON COLUMN public.auto_reports.metadata IS '추가 메타데이터';
COMMENT ON COLUMN public.auto_reports.tags IS '검색용 태그 배열';
COMMENT ON COLUMN public.auto_reports.expires_at IS '보고서 만료 시간 (자동 삭제용)';

-- 완료 메시지
SELECT 'auto_reports 테이블이 성공적으로 생성되었습니다.' AS result; 