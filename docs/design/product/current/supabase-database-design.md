# Supabase 데이터베이스 설계

## 🎯 Supabase PostgreSQL 통합 시스템

**OpenManager VIBE v5.70.11**: Supabase PostgreSQL 기반 실시간 서버 모니터링 데이터 관리

### 🏗️ 데이터베이스 아키텍처

#### **Supabase 플랫폼 구성**
```
Supabase Cloud PostgreSQL 15
├── 무료 티어: 500MB (현재 3% 사용, 15MB)
├── RLS (Row Level Security) 정책
├── Real-time Subscriptions
└── PostgreSQL Extensions (pgVector, uuid-ossp)
```

**특징**:
- **PostgreSQL 15**: 최신 PostgreSQL 기능 완전 지원
- **무료 티어**: 500MB 스토리지, 500만 Read, 100만 Write/월
- **실시간**: WebSocket 기반 실시간 데이터 동기화
- **글로벌 CDN**: 평균 쿼리 응답시간 50ms

### 📊 데이터베이스 스키마 설계

#### **Core Tables**
```sql
-- 서버 정보 테이블
CREATE TABLE servers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'web', 'api', 'database', 'cache' 등
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'maintenance', 'down'
  location VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 서버 메트릭 히스토리 테이블  
CREATE TABLE server_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id UUID REFERENCES servers(id) ON DELETE CASCADE,
  cpu_usage DECIMAL(5,2) NOT NULL,
  memory_usage DECIMAL(5,2) NOT NULL,
  disk_usage DECIMAL(5,2) NOT NULL,
  network_in BIGINT DEFAULT 0,
  network_out BIGINT DEFAULT 0,
  response_time INTEGER DEFAULT 0, -- milliseconds
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 파티셔닝을 위한 인덱스
  CONSTRAINT check_cpu_range CHECK (cpu_usage >= 0 AND cpu_usage <= 100),
  CONSTRAINT check_memory_range CHECK (memory_usage >= 0 AND memory_usage <= 100),
  CONSTRAINT check_disk_range CHECK (disk_usage >= 0 AND disk_usage <= 100)
);

-- 장애 및 이벤트 로그 테이블
CREATE TABLE incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id UUID REFERENCES servers(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'high_cpu', 'memory_leak', 'disk_full', 'network_spike'
  severity VARCHAR(20) NOT NULL, -- 'critical', 'warning', 'info'
  title VARCHAR(255) NOT NULL,
  description TEXT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  auto_resolved BOOLEAN DEFAULT FALSE,
  
  -- 성능 최적화 인덱스
  INDEX idx_incidents_server_severity (server_id, severity),
  INDEX idx_incidents_timestamp (started_at DESC)
);

-- AI 분석 결과 캐시 테이블
CREATE TABLE ai_analysis_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id UUID REFERENCES servers(id) ON DELETE CASCADE,
  analysis_type VARCHAR(50) NOT NULL, -- 'performance', 'prediction', 'anomaly'
  result JSONB NOT NULL,
  confidence_score DECIMAL(3,2), -- 0.00 ~ 1.00
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 hour'),
  
  -- JSONB 인덱스 최적화
  INDEX idx_ai_cache_result (result) USING GIN,
  INDEX idx_ai_cache_expires (expires_at)
);
```

**테이블 특징**:
- **UUID Primary Keys**: 글로벌 유니크 식별자
- **JSONB 저장**: AI 분석 결과 유연한 저장
- **타임스탬프**: 모든 테이블에 created_at/updated_at
- **제약조건**: 데이터 무결성 보장 (0-100% 범위)

#### **파티셔닝 전략**
```sql
-- 메트릭 테이블 월별 파티셔닝
CREATE TABLE server_metrics_2025_09 PARTITION OF server_metrics
FOR VALUES FROM ('2025-09-01') TO ('2025-10-01');

CREATE TABLE server_metrics_2025_10 PARTITION OF server_metrics  
FOR VALUES FROM ('2025-10-01') TO ('2025-11-01');

-- 자동 파티션 생성 함수
CREATE OR REPLACE FUNCTION create_monthly_partition()
RETURNS void AS $$
DECLARE
  start_date date;
  end_date date;
  table_name text;
BEGIN
  start_date := date_trunc('month', CURRENT_DATE + interval '1 month');
  end_date := start_date + interval '1 month';
  table_name := 'server_metrics_' || to_char(start_date, 'YYYY_MM');
  
  EXECUTE format('CREATE TABLE %I PARTITION OF server_metrics 
                  FOR VALUES FROM (%L) TO (%L)', 
                  table_name, start_date, end_date);
END;
$$ LANGUAGE plpgsql;
```

### 🔐 RLS (Row Level Security) 정책

#### **보안 정책 설정**
```sql
-- RLS 활성화
ALTER TABLE servers ENABLE ROW LEVEL SECURITY;
ALTER TABLE server_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_analysis_cache ENABLE ROW LEVEL SECURITY;

-- 공개 읽기 정책 (인증된 사용자)
CREATE POLICY "Anyone can view servers" ON servers
  FOR SELECT USING (true);

CREATE POLICY "Anyone can view metrics" ON server_metrics
  FOR SELECT USING (true);

-- 관리자만 쓰기 가능 정책
CREATE POLICY "Only admins can insert servers" ON servers
  FOR INSERT WITH CHECK (auth.role() = 'admin');

CREATE POLICY "Only service can insert metrics" ON server_metrics
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- 시간 기반 정책 (최근 30일 데이터만 접근)
CREATE POLICY "Recent metrics only" ON server_metrics
  FOR SELECT USING (
    timestamp > NOW() - INTERVAL '30 days'
  );
```

**RLS 특징**:
- **세분화된 접근제어**: 테이블/행 레벨 보안
- **역할 기반**: admin, service_role, authenticated 역할
- **시간 기반 제한**: 최근 30일 데이터만 접근 허용
- **자동 필터링**: 쿼리 레벨에서 자동 보안 적용

### ⚡ 성능 최적화

#### **인덱스 전략**
```sql
-- 복합 인덱스 (서버별 최신 메트릭)
CREATE INDEX idx_metrics_server_timestamp 
ON server_metrics (server_id, timestamp DESC);

-- 부분 인덱스 (활성 장애만)
CREATE INDEX idx_active_incidents 
ON incidents (server_id, severity) 
WHERE resolved_at IS NULL;

-- GIN 인덱스 (JSONB 검색)
CREATE INDEX idx_ai_result_gin 
ON ai_analysis_cache USING GIN (result);

-- BRIN 인덱스 (시계열 데이터)
CREATE INDEX idx_metrics_timestamp_brin 
ON server_metrics USING BRIN (timestamp);
```

**쿼리 최적화**:
- **복합 인덱스**: 서버별 시계열 데이터 빠른 조회
- **부분 인덱스**: 활성 장애만 인덱싱하여 공간 절약
- **GIN 인덱스**: JSONB 필드 내 검색 최적화
- **BRIN 인덱스**: 대용량 시계열 데이터 압축 인덱싱

#### **쿼리 성능 분석**
```sql
-- 서버별 최신 메트릭 조회 (50ms 이내)
EXPLAIN (ANALYZE, BUFFERS) 
SELECT s.*, m.cpu_usage, m.memory_usage, m.timestamp
FROM servers s
LEFT JOIN LATERAL (
  SELECT cpu_usage, memory_usage, timestamp
  FROM server_metrics 
  WHERE server_id = s.id 
  ORDER BY timestamp DESC 
  LIMIT 1
) m ON true;

-- AI 분석 결과 캐시 조회
EXPLAIN (ANALYZE, BUFFERS)
SELECT result->>'prediction' as prediction
FROM ai_analysis_cache
WHERE server_id = $1 
  AND analysis_type = 'performance'
  AND expires_at > NOW()
ORDER BY created_at DESC
LIMIT 1;
```

### 🔄 실시간 기능

#### **Supabase Realtime 설정**
```sql
-- 실시간 구독 활성화
ALTER PUBLICATION supabase_realtime ADD TABLE servers;
ALTER PUBLICATION supabase_realtime ADD TABLE server_metrics;
ALTER PUBLICATION supabase_realtime ADD TABLE incidents;

-- 실시간 트리거 함수
CREATE OR REPLACE FUNCTION notify_server_change()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify(
    'server_update',
    json_build_object(
      'operation', TG_OP,
      'server_id', COALESCE(NEW.id, OLD.id),
      'timestamp', NOW()
    )::text
  );
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 트리거 설정
CREATE TRIGGER server_change_trigger
  AFTER INSERT OR UPDATE OR DELETE ON servers
  FOR EACH ROW EXECUTE FUNCTION notify_server_change();
```

**클라이언트 구독**:
```typescript
// Next.js에서 실시간 구독
const supabase = createClientComponentClient();

useEffect(() => {
  const channel = supabase
    .channel('server-changes')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'server_metrics'
    }, (payload) => {
      console.log('Realtime update:', payload);
      // 상태 업데이트 로직
    })
    .subscribe();

  return () => supabase.removeChannel(channel);
}, []);
```

### 🗂️ 데이터 관리 전략

#### **데이터 보존 정책**
```sql
-- 오래된 메트릭 데이터 자동 삭제 (90일 이후)
CREATE OR REPLACE FUNCTION cleanup_old_metrics()
RETURNS void AS $$
BEGIN
  DELETE FROM server_metrics 
  WHERE timestamp < NOW() - INTERVAL '90 days';
  
  DELETE FROM ai_analysis_cache
  WHERE expires_at < NOW();
  
  -- 통계 업데이트
  ANALYZE server_metrics;
  ANALYZE ai_analysis_cache;
END;
$$ LANGUAGE plpgsql;

-- 매일 자정 실행
SELECT cron.schedule(
  'cleanup-old-data',
  '0 0 * * *',
  'SELECT cleanup_old_metrics();'
);
```

**백업 전략**:
- **자동 백업**: Supabase 일일 자동 백업
- **PITR (Point-in-Time Recovery)**: 7일간 복구 가능
- **Export**: 월별 CSV/JSON 백업 생성
- **복제**: 읽기 전용 복제본 운영 (Pro 플랜)

### 📊 무료 티어 최적화

#### **리소스 사용량 현황**
| 항목 | 현재 사용량 | 무료 한도 | 사용률 |
|------|-------------|-----------|--------|
| **스토리지** | 15MB | 500MB | 3% |
| **Database Reads** | 50만 | 500만/월 | 10% |
| **Database Writes** | 5만 | 100만/월 | 5% |
| **Realtime Connections** | 5개 | 200개 | 2.5% |

**최적화 전략**:
```sql
-- 메트릭 데이터 압축 (일별 집계)
CREATE MATERIALIZED VIEW daily_server_metrics AS
SELECT 
  server_id,
  DATE(timestamp) as date,
  AVG(cpu_usage) as avg_cpu,
  MAX(cpu_usage) as max_cpu,
  AVG(memory_usage) as avg_memory,
  MAX(memory_usage) as max_memory,
  COUNT(*) as measurement_count
FROM server_metrics
GROUP BY server_id, DATE(timestamp);

-- 자동 갱신 (매일 자정)
SELECT cron.schedule(
  'refresh-daily-metrics',
  '0 0 * * *',
  'REFRESH MATERIALIZED VIEW daily_server_metrics;'
);
```

### 🔧 백엔드 연동

#### **Supabase Client 설정**
```typescript
// lib/supabase.ts
import { createClientComponentClient, createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// 클라이언트 컴포넌트용
export const createClient = () => {
  return createClientComponentClient({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  });
};

// 서버 컴포넌트용
export const createServerClient = () => {
  const cookieStore = cookies();
  return createServerComponentClient({
    cookies: () => cookieStore
  });
};
```

#### **타입 안전 쿼리**
```typescript
// types/database.ts - Supabase 생성 타입
export interface Database {
  public: {
    Tables: {
      servers: {
        Row: {
          id: string;
          name: string;
          type: string;
          status: string;
          location: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['servers']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['servers']['Insert']>;
      };
      server_metrics: {
        Row: {
          id: string;
          server_id: string;
          cpu_usage: number;
          memory_usage: number;
          disk_usage: number;
          network_in: number;
          network_out: number;
          response_time: number;
          timestamp: string;
        };
        Insert: Omit<Database['public']['Tables']['server_metrics']['Row'], 'id' | 'timestamp'>;
        Update: Partial<Database['public']['Tables']['server_metrics']['Insert']>;
      };
    };
  };
}

// API 사용 예시
export async function getLatestMetrics(): Promise<ServerMetrics[]> {
  const supabase = createServerClient();
  
  const { data, error } = await supabase
    .from('server_metrics')
    .select(`
      *,
      servers (
        id,
        name,
        type,
        status
      )
    `)
    .order('timestamp', { ascending: false })
    .limit(100);
    
  if (error) throw error;
  return data;
}
```

### 🛡️ 보안 구성

#### **인증 & 권한**
```sql
-- 서비스 역할 함수 (API에서만 사용)
CREATE OR REPLACE FUNCTION auth.role()
RETURNS text AS $$
BEGIN
  RETURN current_setting('request.jwt.claims', true)::json->>'role';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- API 키 기반 인증
CREATE POLICY "API access only" ON server_metrics
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'service_role' OR
    auth.jwt() ->> 'role' = 'authenticated'
  );
```

**환경변수 보안**:
```bash
# .env.local (Vercel 환경변수)
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."
SUPABASE_SERVICE_ROLE_KEY="eyJ..." # 서버에서만 사용
DATABASE_URL="postgresql://postgres:[password]@db.xxx.supabase.co:5432/postgres"
```

### 📈 모니터링 & 분석

#### **Supabase Dashboard 활용**
- **SQL Editor**: 쿼리 성능 실시간 분석
- **Database**: 테이블 구조 및 관계 시각화  
- **API**: RESTful/GraphQL API 자동 생성
- **Auth**: 사용자 인증 및 권한 관리

#### **성능 메트릭**
```sql
-- 쿼리 성능 분석
SELECT 
  schemaname,
  tablename,
  attname,
  n_distinct,
  correlation
FROM pg_stats 
WHERE schemaname = 'public'
ORDER BY tablename, attname;

-- 인덱스 사용률 분석  
SELECT 
  indexrelname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

### 🚀 확장 계획

#### **Pro 플랜 전환 시나리오** ($25/월)
- **Daily Backups**: 매일 자동 백업 + 7일 보존
- **Dedicated CPU**: 전용 CPU 자원 할당
- **Read Replicas**: 읽기 전용 복제본 운영
- **Advanced Metrics**: 상세 성능 분석

#### **스케일링 전략**
```sql
-- 읽기 복제본 활용
-- 메인 DB: 쓰기 작업
-- 복제본: 분석 쿼리, 리포트 생성

-- 연결 풀링 최적화
-- pgBouncer: 연결 관리 최적화
-- 최대 동시 연결: 60개 (무료) → 200개 (Pro)
```

---

💡 **핵심 가치**: "PostgreSQL 15 기반 타입 안전 실시간 데이터베이스 운영"