# 🗃️ 데이터베이스 설정 가이드

> **Supabase PostgreSQL + RLS + 스키마 관리**  
> 완전한 데이터베이스 설정 및 보안 구성

## 🎯 개요

OpenManager VIBE v5의 Supabase PostgreSQL 데이터베이스 완전 설정 가이드입니다. 스키마 설계, Row Level Security, 마이그레이션 관리를 포함합니다.

---

## 🏗️ 데이터베이스 스키마 설계

### 1단계: 핵심 테이블 생성

```sql
-- supabase/migrations/001_initial_schema.sql

-- 사용자 프로필 테이블
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 서버 정보 테이블
CREATE TABLE public.servers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  name TEXT NOT NULL,
  host TEXT NOT NULL,
  port INTEGER DEFAULT 80,
  type TEXT CHECK (type IN ('web', 'api', 'database', 'cache', 'monitoring')),
  status TEXT CHECK (status IN ('online', 'warning', 'critical', 'offline')) DEFAULT 'offline',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 서버 로그 테이블 (파티셔닝 적용)
CREATE TABLE public.server_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  server_id UUID REFERENCES public.servers(id) NOT NULL,
  cpu_usage DECIMAL(5,2),
  memory_usage DECIMAL(5,2),
  disk_usage DECIMAL(5,2),
  network_in BIGINT,
  network_out BIGINT,
  response_time INTEGER,
  error_message TEXT,
  http_status INTEGER,
  checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
) PARTITION BY RANGE (checked_at);

-- 파티션 생성 (월별)
CREATE TABLE public.server_logs_2025_09 PARTITION OF public.server_logs
FOR VALUES FROM ('2025-09-01') TO ('2025-10-01');

CREATE TABLE public.server_logs_2025_10 PARTITION OF public.server_logs
FOR VALUES FROM ('2025-10-01') TO ('2025-11-01');

-- 인덱스 생성
CREATE INDEX idx_servers_user_id ON public.servers(user_id);
CREATE INDEX idx_servers_status ON public.servers(status);
CREATE INDEX idx_server_logs_server_id ON public.server_logs(server_id);
CREATE INDEX idx_server_logs_checked_at ON public.server_logs(checked_at);
```

### 2단계: Mock 시뮬레이션 지원 테이블

```sql
-- 서버 시뮬레이션 설정 테이블
CREATE TABLE public.server_simulation_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  server_id UUID REFERENCES public.servers(id) NOT NULL,
  simulation_type TEXT DEFAULT 'box_muller',
  cpu_mean DECIMAL(5,2) DEFAULT 30.0,
  cpu_stddev DECIMAL(5,2) DEFAULT 15.0,
  memory_mean DECIMAL(5,2) DEFAULT 50.0, 
  memory_stddev DECIMAL(5,2) DEFAULT 20.0,
  failure_scenarios JSONB DEFAULT '[]',
  correlation_coefficient DECIMAL(3,2) DEFAULT 0.6,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 시뮬레이션 시나리오 테이블
CREATE TABLE public.simulation_scenarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  probability DECIMAL(4,3) CHECK (probability BETWEEN 0 AND 1),
  effects JSONB NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 기본 시나리오 데이터 삽입
INSERT INTO public.simulation_scenarios (name, probability, effects, description) VALUES
('traffic_spike', 0.15, '{"cpu": 25, "memory": 15}', '트래픽 급증으로 인한 부하'),
('ddos_attack', 0.03, '{"cpu": 45, "memory": 20, "network_in": 500}', 'DDoS 공격 시뮬레이션'),
('memory_leak', 0.08, '{"memory": 35}', '메모리 누수 발생'),
('slow_query', 0.12, '{"cpu": 20, "response_time": 2000}', '느린 데이터베이스 쿼리'),
('disk_full', 0.05, '{"disk": 95}', '디스크 용량 부족');
```

---

## 🔒 Row Level Security (RLS) 정책

### RLS 활성화 및 기본 정책

```sql
-- supabase/migrations/002_rls_policies.sql

-- RLS 활성화
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.server_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.server_simulation_configs ENABLE ROW LEVEL SECURITY;

-- 프로필 정책
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 서버 정책
CREATE POLICY "Users can manage own servers"
  ON public.servers
  USING (auth.uid() = user_id);

-- 서버 로그 정책 (성능 최적화된)
CREATE POLICY "Users can view own server logs"
  ON public.server_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.servers 
      WHERE id = server_logs.server_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert server logs"
  ON public.server_logs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.servers 
      WHERE id = server_logs.server_id 
      AND user_id = auth.uid()
    )
  );

-- 시뮬레이션 설정 정책
CREATE POLICY "Users can manage own simulation configs"
  ON public.server_simulation_configs
  USING (
    EXISTS (
      SELECT 1 FROM public.servers
      WHERE id = server_simulation_configs.server_id
      AND user_id = auth.uid()
    )
  );
```

---

## 🔧 데이터베이스 함수

### 서버 메트릭 집계 함수

```sql
-- supabase/migrations/003_database_functions.sql

-- 서버별 최근 메트릭 조회 함수
CREATE OR REPLACE FUNCTION get_recent_server_metrics(
  p_server_id UUID,
  p_hours INTEGER DEFAULT 24
)
RETURNS TABLE (
  timestamp TIMESTAMP WITH TIME ZONE,
  cpu_usage DECIMAL(5,2),
  memory_usage DECIMAL(5,2),
  disk_usage DECIMAL(5,2),
  response_time INTEGER
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sl.checked_at,
    sl.cpu_usage,
    sl.memory_usage,
    sl.disk_usage,
    sl.response_time
  FROM public.server_logs sl
  JOIN public.servers s ON s.id = sl.server_id
  WHERE s.id = p_server_id 
    AND s.user_id = auth.uid()
    AND sl.checked_at >= NOW() - INTERVAL '1 hour' * p_hours
  ORDER BY sl.checked_at DESC
  LIMIT 1000;
END;
$$;

-- 서버 상태 업데이트 함수
CREATE OR REPLACE FUNCTION update_server_status(
  p_server_id UUID,
  p_status TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER  
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- 서버 소유권 확인
  SELECT user_id INTO v_user_id
  FROM public.servers
  WHERE id = p_server_id;
  
  IF v_user_id != auth.uid() THEN
    RETURN FALSE;
  END IF;
  
  -- 상태 업데이트
  UPDATE public.servers
  SET 
    status = p_status,
    updated_at = NOW()
  WHERE id = p_server_id;
  
  RETURN TRUE;
END;
$$;

-- 서버 통계 집계 함수
CREATE OR REPLACE FUNCTION get_server_stats_summary(p_user_id UUID)
RETURNS TABLE (
  total_servers INTEGER,
  online_servers INTEGER,
  warning_servers INTEGER,
  critical_servers INTEGER,
  avg_response_time DECIMAL(8,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_servers,
    COUNT(*) FILTER (WHERE status = 'online')::INTEGER as online_servers,
    COUNT(*) FILTER (WHERE status = 'warning')::INTEGER as warning_servers,
    COUNT(*) FILTER (WHERE status = 'critical')::INTEGER as critical_servers,
    COALESCE(
      (SELECT AVG(response_time)
       FROM public.server_logs sl
       JOIN public.servers s ON s.id = sl.server_id
       WHERE s.user_id = p_user_id 
       AND sl.checked_at >= NOW() - INTERVAL '1 hour'), 
      0
    )::DECIMAL(8,2) as avg_response_time
  FROM public.servers
  WHERE user_id = p_user_id;
END;
$$;
```

---

## 🚀 Supabase 클라이언트 설정

### TypeScript 클라이언트 구성

```typescript
// lib/supabase/client.ts
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'X-Client-Info': 'openmanager-vibe-v5'
    }
  }
});

// 타입 안전한 쿼리 헬퍼
export const queryHelpers = {
  // 사용자 서버 목록 조회
  async getUserServers(userId: string) {
    return supabase
      .from('servers')
      .select(`
        id,
        name,
        host,
        port,
        type,
        status,
        created_at,
        updated_at
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
  },

  // 서버 메트릭 조회
  async getServerMetrics(serverId: string, hours = 24) {
    return supabase.rpc('get_recent_server_metrics', {
      p_server_id: serverId,
      p_hours: hours
    });
  },

  // 서버 상태 업데이트
  async updateServerStatus(serverId: string, status: string) {
    return supabase.rpc('update_server_status', {
      p_server_id: serverId,
      p_status: status
    });
  },

  // 사용자 서버 통계
  async getUserServerStats(userId: string) {
    return supabase.rpc('get_server_stats_summary', {
      p_user_id: userId
    });
  }
};
```

### 실시간 구독 설정

```typescript
// lib/supabase/subscriptions.ts
import { supabase } from './client';
import { RealtimeChannel } from '@supabase/supabase-js';

export class ServerSubscriptionManager {
  private channel: RealtimeChannel | null = null;

  // 서버 상태 변경 구독
  subscribeToServerChanges(userId: string, callback: (payload: any) => void) {
    this.channel = supabase
      .channel('server_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'servers',
        filter: `user_id=eq.${userId}`
      }, callback)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public', 
        table: 'server_logs'
      }, (payload) => {
        // 새로운 로그 데이터 처리
        callback({ type: 'log_update', payload });
      })
      .subscribe();

    return this.channel;
  }

  // 구독 해제
  unsubscribe() {
    if (this.channel) {
      supabase.removeChannel(this.channel);
      this.channel = null;
    }
  }
}

// 사용 예시
export const serverSubscription = new ServerSubscriptionManager();
```

---

## 📊 성능 최적화

### 인덱스 최적화

```sql
-- 성능 최적화 인덱스 추가
-- supabase/migrations/004_performance_indexes.sql

-- 복합 인덱스 생성
CREATE INDEX idx_server_logs_server_time ON public.server_logs(server_id, checked_at DESC);
CREATE INDEX idx_servers_user_status ON public.servers(user_id, status);
CREATE INDEX idx_server_logs_composite ON public.server_logs(server_id, checked_at) 
  WHERE checked_at >= NOW() - INTERVAL '7 days';

-- 부분 인덱스 (활성 서버만)
CREATE INDEX idx_servers_active ON public.servers(user_id, updated_at)
  WHERE status != 'offline';

-- GIN 인덱스 (JSONB 컬럼용)
CREATE INDEX idx_simulation_effects ON public.simulation_scenarios USING GIN (effects);
```

### 연결 풀 설정

```typescript
// lib/supabase/connection-pool.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';

class SupabaseConnectionPool {
  private pools: Map<string, SupabaseClient> = new Map();
  private readonly maxConnections = 10;

  getConnection(key: string = 'default'): SupabaseClient {
    if (!this.pools.has(key)) {
      this.pools.set(key, createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          db: {
            schema: 'public'
          },
          auth: {
            persistSession: true,
            autoRefreshToken: true
          }
        }
      ));
    }

    return this.pools.get(key)!;
  }

  closeAll() {
    for (const [key, client] of this.pools) {
      // Supabase 클라이언트 정리
      this.pools.delete(key);
    }
  }
}

export const connectionPool = new SupabaseConnectionPool();
```

---

## 🔧 마이그레이션 관리

### 마이그레이션 실행

```bash
# 새 마이그레이션 생성
npx supabase migration new add_server_monitoring

# 마이그레이션 적용
npx supabase db push

# 타입 생성
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > types/database.types.ts

# 로컬 개발 환경 초기화
npx supabase start
npx supabase db reset
```

### 백업 및 복원

```bash
# 데이터베이스 백업
pg_dump "postgresql://user:pass@host:5432/dbname" > backup.sql

# 복원
psql "postgresql://user:pass@host:5432/dbname" < backup.sql

# Supabase CLI를 통한 백업
npx supabase db dump --file backup.sql
```

---

## 🔧 문제 해결

### 일반적인 오류

1. **RLS 권한 오류**: 정책 확인 및 사용자 인증 상태 점검
2. **연결 한계**: 연결 풀 설정 및 불필요한 연결 정리
3. **쿼리 성능**: 인덱스 추가 및 쿼리 최적화

### 디버깅 도구

```typescript
// 쿼리 성능 모니터링
export const debugQuery = async (queryName: string, queryFn: () => Promise<any>) => {
  const start = performance.now();
  try {
    const result = await queryFn();
    const duration = performance.now() - start;
    console.log(`[${queryName}] 실행 시간: ${duration.toFixed(2)}ms`);
    return result;
  } catch (error) {
    console.error(`[${queryName}] 쿼리 오류:`, error);
    throw error;
  }
};

// 사용 예시
const servers = await debugQuery('getUserServers', () => 
  queryHelpers.getUserServers(userId)
);
```

---

## 📚 참고 자료

- **[Supabase 공식 문서](https://supabase.com/docs)**
- **[PostgreSQL RLS 가이드](https://supabase.com/docs/guides/auth/row-level-security)**
- **[Supabase JavaScript 클라이언트](https://supabase.com/docs/reference/javascript)**

---

**💡 팁**: RLS 정책은 성능에 큰 영향을 미칩니다. 복잡한 정책보다는 적절한 인덱스와 함께 간단한 정책을 사용하는 것이 좋습니다.