-- 🗄️ OpenManager Vibe v5 - Supabase Database Schema
-- GitHub OAuth + 게스트 사용자 통합 관리를 위한 데이터베이스 스키마

-- =====================================================
-- 1. Users Table (사용자 프로필)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255),
  name VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  username VARCHAR(100),
  bio TEXT,
  location VARCHAR(255),
  company VARCHAR(255),
  blog TEXT,
  twitter_username VARCHAR(100),
  github_id VARCHAR(50),
  public_repos INTEGER DEFAULT 0,
  followers INTEGER DEFAULT 0,
  following INTEGER DEFAULT 0,
  verified BOOLEAN DEFAULT FALSE,
  user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('github', 'guest')),
  permissions TEXT[] DEFAULT ARRAY[]::TEXT[],
  settings JSONB DEFAULT '{
    "theme": "system",
    "language": "ko",
    "timezone": "Asia/Seoul",
    "notifications": {
      "email": true,
      "browser": true,
      "alerts": true
    },
    "privacy": {
      "profile_public": false,
      "activity_public": false
    }
  }'::jsonb,
  last_sign_in_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON public.users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_github_id ON public.users(github_id);
CREATE INDEX IF NOT EXISTS idx_users_user_type ON public.users(user_type);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users(created_at);

-- =====================================================
-- 2. User Activities Table (사용자 활동 로그)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.user_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  resource VARCHAR(255),
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON public.user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_action ON public.user_activities(action);
CREATE INDEX IF NOT EXISTS idx_user_activities_created_at ON public.user_activities(created_at);

-- =====================================================
-- 3. Server Metrics Table (서버 메트릭)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.server_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id VARCHAR(100) NOT NULL,
  server_name VARCHAR(255),
  server_type VARCHAR(50) DEFAULT 'unknown',
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  cpu NUMERIC(5,2) NOT NULL CHECK (cpu >= 0 AND cpu <= 100),
  memory NUMERIC(5,2) NOT NULL CHECK (memory >= 0 AND memory <= 100),
  disk NUMERIC(5,2) NOT NULL CHECK (disk >= 0 AND disk <= 100),
  network_in BIGINT DEFAULT 0,
  network_out BIGINT DEFAULT 0,
  response_time INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'unknown' CHECK (status IN ('healthy', 'warning', 'critical', 'unknown')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성 (시계열 데이터 최적화)
CREATE INDEX IF NOT EXISTS idx_server_metrics_server_id ON public.server_metrics(server_id);
CREATE INDEX IF NOT EXISTS idx_server_metrics_timestamp ON public.server_metrics(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_server_metrics_server_timestamp ON public.server_metrics(server_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_server_metrics_status ON public.server_metrics(status);

-- =====================================================
-- 4. AI Analysis Results Table (AI 분석 결과)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.ai_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  analysis_type VARCHAR(50) NOT NULL,
  input_data JSONB NOT NULL,
  result JSONB NOT NULL,
  confidence NUMERIC(3,2) DEFAULT 0.0 CHECK (confidence >= 0 AND confidence <= 1),
  processing_time INTEGER DEFAULT 0, -- milliseconds
  ai_engine VARCHAR(50) DEFAULT 'unknown',
  status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_ai_analysis_user_id ON public.ai_analysis(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_type ON public.ai_analysis(analysis_type);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_created_at ON public.ai_analysis(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_status ON public.ai_analysis(status);

-- =====================================================
-- 5. System Events Table (시스템 이벤트)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.system_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(50) NOT NULL,
  source VARCHAR(100) NOT NULL,
  message TEXT NOT NULL,
  severity VARCHAR(20) DEFAULT 'info' CHECK (severity IN ('debug', 'info', 'warning', 'error', 'critical')),
  metadata JSONB DEFAULT '{}'::jsonb,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_system_events_event_type ON public.system_events(event_type);
CREATE INDEX IF NOT EXISTS idx_system_events_severity ON public.system_events(severity);
CREATE INDEX IF NOT EXISTS idx_system_events_created_at ON public.system_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_events_user_id ON public.system_events(user_id);

-- =====================================================
-- 6. Row Level Security (RLS) 정책
-- =====================================================

-- Users 테이블 RLS 활성화
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 프로필만 조회/수정 가능
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = auth_user_id);

-- 새 사용자 프로필 생성 허용
CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = auth_user_id);

-- User Activities 테이블 RLS 활성화
ALTER TABLE public.user_activities ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 활동만 조회 가능
CREATE POLICY "Users can view own activities" ON public.user_activities
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = user_activities.user_id 
      AND users.auth_user_id = auth.uid()
    )
  );

-- 시스템이 활동 로그 삽입 가능
CREATE POLICY "System can insert activities" ON public.user_activities
  FOR INSERT WITH CHECK (true);

-- Server Metrics 테이블 RLS 활성화
ALTER TABLE public.server_metrics ENABLE ROW LEVEL SECURITY;

-- 인증된 사용자만 메트릭 조회 가능
CREATE POLICY "Authenticated users can view metrics" ON public.server_metrics
  FOR SELECT USING (auth.role() = 'authenticated');

-- 시스템이 메트릭 삽입 가능
CREATE POLICY "System can insert metrics" ON public.server_metrics
  FOR INSERT WITH CHECK (true);

-- AI Analysis 테이블 RLS 활성화
ALTER TABLE public.ai_analysis ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 분석 결과만 조회 가능
CREATE POLICY "Users can view own analysis" ON public.ai_analysis
  FOR SELECT USING (
    user_id IS NULL OR 
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = ai_analysis.user_id 
      AND users.auth_user_id = auth.uid()
    )
  );

-- 시스템이 분석 결과 삽입 가능
CREATE POLICY "System can insert analysis" ON public.ai_analysis
  FOR INSERT WITH CHECK (true);

-- System Events 테이블 RLS 활성화
ALTER TABLE public.system_events ENABLE ROW LEVEL SECURITY;

-- 인증된 사용자만 시스템 이벤트 조회 가능
CREATE POLICY "Authenticated users can view events" ON public.system_events
  FOR SELECT USING (auth.role() = 'authenticated');

-- 시스템이 이벤트 삽입 가능
CREATE POLICY "System can insert events" ON public.system_events
  FOR INSERT WITH CHECK (true);

-- =====================================================
-- 7. Functions & Triggers
-- =====================================================

-- 업데이트 시간 자동 갱신 함수
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Users 테이블 업데이트 트리거
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 사용자 생성 시 기본 권한 설정 함수
CREATE OR REPLACE FUNCTION public.set_default_user_permissions()
RETURNS TRIGGER AS $$
BEGIN
  -- GitHub 사용자 기본 권한
  IF NEW.user_type = 'github' THEN
    NEW.permissions = ARRAY[
      'dashboard:view',
      'dashboard:edit', 
      'system:start',
      'system:stop',
      'api:read',
      'api:write',
      'logs:view',
      'metrics:view',
      'settings:edit'
    ];
  -- 게스트 사용자 기본 권한
  ELSIF NEW.user_type = 'guest' THEN
    NEW.permissions = ARRAY[
      'dashboard:view',
      'system:start',
      'basic_interaction',
      'metrics:view',
      'logs:view'
    ];
  END IF;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 사용자 권한 설정 트리거
DROP TRIGGER IF EXISTS set_user_permissions ON public.users;
CREATE TRIGGER set_user_permissions
  BEFORE INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.set_default_user_permissions();

-- =====================================================
-- 8. 유틸리티 뷰 (Views)
-- =====================================================

-- 사용자 통계 뷰
CREATE OR REPLACE VIEW public.user_stats AS
SELECT 
  COUNT(*) as total_users,
  COUNT(*) FILTER (WHERE user_type = 'github') as github_users,
  COUNT(*) FILTER (WHERE user_type = 'guest') as guest_users,
  COUNT(*) FILTER (WHERE last_sign_in_at > NOW() - INTERVAL '1 day') as daily_active_users,
  COUNT(*) FILTER (WHERE last_sign_in_at > NOW() - INTERVAL '30 days') as monthly_active_users,
  NOW() as last_updated
FROM public.users;

-- 최근 활동 뷰
CREATE OR REPLACE VIEW public.recent_activities AS
SELECT 
  ua.id,
  ua.action,
  ua.resource,
  ua.created_at,
  u.name as user_name,
  u.user_type
FROM public.user_activities ua
JOIN public.users u ON ua.user_id = u.id
WHERE ua.created_at > NOW() - INTERVAL '7 days'
ORDER BY ua.created_at DESC;

-- 서버 상태 요약 뷰
CREATE OR REPLACE VIEW public.server_status_summary AS
SELECT 
  server_id,
  server_name,
  server_type,
  status,
  AVG(cpu) as avg_cpu,
  AVG(memory) as avg_memory,
  AVG(disk) as avg_disk,
  MAX(timestamp) as last_update
FROM public.server_metrics
WHERE timestamp > NOW() - INTERVAL '1 hour'
GROUP BY server_id, server_name, server_type, status;

-- =====================================================
-- 9. 데이터 정리 작업 (Cleanup Jobs)
-- =====================================================

-- 오래된 활동 로그 정리 함수 (30일 이상)
CREATE OR REPLACE FUNCTION public.cleanup_old_activities()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.user_activities 
  WHERE created_at < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ language 'plpgsql';

-- 오래된 메트릭 정리 함수 (7일 이상)
CREATE OR REPLACE FUNCTION public.cleanup_old_metrics()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.server_metrics 
  WHERE created_at < NOW() - INTERVAL '7 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ language 'plpgsql';

-- 비활성 게스트 사용자 정리 함수 (24시간 이상)
CREATE OR REPLACE FUNCTION public.cleanup_inactive_guests()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.users 
  WHERE user_type = 'guest' 
  AND (last_sign_in_at IS NULL OR last_sign_in_at < NOW() - INTERVAL '24 hours');
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ language 'plpgsql';

-- =====================================================
-- 10. 초기 데이터 삽입
-- =====================================================

-- 시스템 시작 이벤트 기록
INSERT INTO public.system_events (event_type, source, message, severity) 
VALUES ('system_init', 'database', 'OpenManager Vibe v5 database schema initialized', 'info')
ON CONFLICT DO NOTHING;

-- =====================================================
-- 11. 권한 부여
-- =====================================================

-- authenticated 역할에 테이블 접근 권한 부여
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- anon 역할에 제한적 권한 부여 (읽기 전용)
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON public.user_stats TO anon;

-- service_role에 모든 권한 부여
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- ✅ 스키마 설정 완료
SELECT 'OpenManager Vibe v5 Database Schema Setup Complete! 🎉' as status;