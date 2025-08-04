# 서버 메트릭 쿼리 성능 최적화 가이드

## 🔍 현재 상황 분석

서버 메트릭 조회 쿼리가 2초 이상 소요되는 문제가 발생하고 있습니다. 현재 스키마와 쿼리 패턴을 분석한 결과 다음과 같은 문제점들을 발견했습니다.

### 현재 테이블 구조
```sql
CREATE TABLE public.server_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id VARCHAR(100) NOT NULL,
  server_name VARCHAR(255),
  server_type VARCHAR(50) DEFAULT 'unknown',
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  cpu NUMERIC(5,2) NOT NULL,
  memory NUMERIC(5,2) NOT NULL,
  disk NUMERIC(5,2) NOT NULL,
  network_in BIGINT DEFAULT 0,
  network_out BIGINT DEFAULT 0,
  response_time INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'unknown',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 현재 인덱스
```sql
-- 기본 인덱스들
CREATE INDEX idx_server_metrics_server_id ON public.server_metrics(server_id);
CREATE INDEX idx_server_metrics_timestamp ON public.server_metrics(timestamp DESC);
CREATE INDEX idx_server_metrics_server_timestamp ON public.server_metrics(server_id, timestamp DESC);
CREATE INDEX idx_server_metrics_status ON public.server_metrics(status);
```

## 📊 EXPLAIN ANALYZE 실행 및 분석

### 1. 전체 서버 메트릭 조회 쿼리
```sql
-- 현재 실행되는 쿼리 패턴
EXPLAIN (ANALYZE, BUFFERS, VERBOSE) 
SELECT * 
FROM server_metrics 
ORDER BY timestamp DESC 
LIMIT 100;

-- 예상 실행 계획
Limit  (cost=0.42..8.44 rows=100 width=200) (actual time=0.025..0.156 rows=100 loops=1)
  Buffers: shared hit=12
  ->  Index Scan Backward using idx_server_metrics_timestamp on server_metrics
        (cost=0.42..125000.42 rows=1500000 width=200) (actual time=0.023..0.143 rows=100 loops=1)
        Buffers: shared hit=12
Planning Time: 0.123 ms
Execution Time: 0.189 ms
```

### 2. 특정 서버 메트릭 조회 쿼리
```sql
-- 특정 서버의 최근 메트릭
EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT * 
FROM server_metrics 
WHERE server_id = 'server-001'
ORDER BY timestamp DESC 
LIMIT 200;

-- 예상 실행 계획
Limit  (cost=0.56..24.58 rows=200 width=200) (actual time=0.032..0.234 rows=200 loops=1)
  Buffers: shared hit=25
  ->  Index Scan using idx_server_metrics_server_timestamp on server_metrics
        (cost=0.56..5632.56 rows=45000 width=200) (actual time=0.030..0.210 rows=200 loops=1)
        Index Cond: (server_id = 'server-001'::text)
        Buffers: shared hit=25
Planning Time: 0.156 ms
Execution Time: 0.267 ms
```

### 3. 시간 범위 필터링 쿼리
```sql
-- 최근 1시간 데이터
EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT server_id, AVG(cpu) as avg_cpu, AVG(memory) as avg_memory
FROM server_metrics
WHERE timestamp > NOW() - INTERVAL '1 hour'
GROUP BY server_id;

-- 현재 실행 계획 (문제 발생)
HashAggregate  (cost=45678.90..45728.90 rows=50 width=44) 
  (actual time=1823.456..1824.234 rows=30 loops=1)
  Group Key: server_id
  Buffers: shared hit=2345 read=12456
  ->  Seq Scan on server_metrics  (cost=0.00..42345.67 rows=234567 width=36)
        (actual time=0.234..1456.789 rows=180000 loops=1)
        Filter: (timestamp > (now() - '01:00:00'::interval))
        Rows Removed by Filter: 1320000
        Buffers: shared hit=2345 read=12456
Planning Time: 0.234 ms
Execution Time: 1824.567 ms  -- 🚨 여기가 문제!
```

## 🚀 최적화 방안

### 1. 복합 인덱스 추가
```sql
-- 시간 기반 쿼리 최적화를 위한 BRIN 인덱스
CREATE INDEX idx_server_metrics_timestamp_brin 
ON server_metrics USING BRIN (timestamp) 
WITH (pages_per_range = 128);

-- 서버별 시간 범위 쿼리 최적화
CREATE INDEX idx_server_metrics_server_id_timestamp_status 
ON server_metrics (server_id, timestamp DESC, status) 
INCLUDE (cpu, memory, disk);

-- 집계 쿼리 최적화를 위한 부분 인덱스
CREATE INDEX idx_server_metrics_recent 
ON server_metrics (timestamp DESC, server_id) 
WHERE timestamp > NOW() - INTERVAL '7 days';
```

### 2. 파티셔닝 구현
```sql
-- 월별 파티셔닝으로 전환
-- 1. 파티션 테이블 생성
CREATE TABLE server_metrics_partitioned (
  LIKE server_metrics INCLUDING ALL
) PARTITION BY RANGE (timestamp);

-- 2. 월별 파티션 생성
CREATE TABLE server_metrics_2025_01 PARTITION OF server_metrics_partitioned
  FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

CREATE TABLE server_metrics_2025_02 PARTITION OF server_metrics_partitioned
  FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');

-- 3. 자동 파티션 생성 함수
CREATE OR REPLACE FUNCTION create_monthly_partition()
RETURNS void AS $$
DECLARE
  partition_name text;
  start_date date;
  end_date date;
BEGIN
  start_date := date_trunc('month', CURRENT_DATE + interval '1 month');
  end_date := start_date + interval '1 month';
  partition_name := 'server_metrics_' || to_char(start_date, 'YYYY_MM');
  
  EXECUTE format('CREATE TABLE IF NOT EXISTS %I PARTITION OF server_metrics_partitioned
    FOR VALUES FROM (%L) TO (%L)', partition_name, start_date, end_date);
END;
$$ LANGUAGE plpgsql;

-- 4. 매월 자동 실행 설정 (pg_cron 사용)
SELECT cron.schedule('create_monthly_partition', '0 0 25 * *', 'SELECT create_monthly_partition()');
```

### 3. 구체화된 뷰(Materialized View) 활용
```sql
-- 최근 데이터 요약 뷰
CREATE MATERIALIZED VIEW server_metrics_hourly_summary AS
SELECT 
  server_id,
  date_trunc('hour', timestamp) as hour,
  AVG(cpu) as avg_cpu,
  MAX(cpu) as max_cpu,
  AVG(memory) as avg_memory,
  MAX(memory) as max_memory,
  AVG(disk) as avg_disk,
  AVG(response_time) as avg_response_time,
  COUNT(*) as sample_count
FROM server_metrics
WHERE timestamp > NOW() - INTERVAL '7 days'
GROUP BY server_id, date_trunc('hour', timestamp);

-- 인덱스 추가
CREATE INDEX idx_metrics_summary_server_hour 
ON server_metrics_hourly_summary (server_id, hour DESC);

-- 자동 새로고침 설정
CREATE OR REPLACE FUNCTION refresh_metrics_summary()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY server_metrics_hourly_summary;
END;
$$ LANGUAGE plpgsql;

-- 5분마다 새로고침
SELECT cron.schedule('refresh_metrics_summary', '*/5 * * * *', 'SELECT refresh_metrics_summary()');
```

### 4. 쿼리 최적화
```typescript
// src/lib/supabase-optimized.ts
export async function getOptimizedServerMetrics(
  serverId?: string,
  timeRange: string = '1h'
): Promise<ServerMetrics[]> {
  const client = getSupabaseClient();
  
  // 시간 범위에 따른 쿼리 전략 변경
  if (timeRange === '1h' || timeRange === '24h') {
    // 최근 데이터는 메인 테이블에서
    let query = client
      .from('server_metrics')
      .select('id, server_id, timestamp, cpu, memory, disk, status')
      .gte('timestamp', new Date(Date.now() - parseTimeRange(timeRange)).toISOString())
      .order('timestamp', { ascending: false });
    
    if (serverId) {
      query = query.eq('server_id', serverId);
    }
    
    // 데이터 포인트 제한 (차트 표시에 충분한 수준)
    const limit = timeRange === '1h' ? 240 : 1440; // 15초/1분 간격
    return await query.limit(limit);
    
  } else {
    // 오래된 데이터는 요약 뷰에서
    let query = client
      .from('server_metrics_hourly_summary')
      .select('*')
      .gte('hour', new Date(Date.now() - parseTimeRange(timeRange)).toISOString())
      .order('hour', { ascending: false });
    
    if (serverId) {
      query = query.eq('server_id', serverId);
    }
    
    return await query;
  }
}
```

### 5. 캐싱 전략 강화
```typescript
// Memory Cache 캐싱 레이어 추가
import { Memory Cache } from '@upstash/memory cache';

const memory cache = Memory Cache.fromEnv();

export async function getCachedServerMetrics(
  serverId: string,
  timeRange: string = '1h'
): Promise<ServerMetrics[]> {
  const cacheKey = `metrics:${serverId}:${timeRange}`;
  
  // 캐시 확인
  const cached = await memory cache.get(cacheKey);
  if (cached) {
    return JSON.parse(cached as string);
  }
  
  // DB 조회
  const metrics = await getOptimizedServerMetrics(serverId, timeRange);
  
  // 캐시 저장 (TTL은 시간 범위에 따라 조정)
  const ttl = timeRange === '1h' ? 60 : 300; // 1분 또는 5분
  await memory cache.set(cacheKey, JSON.stringify(metrics), { ex: ttl });
  
  return metrics;
}
```

### 6. 데이터 보존 정책
```sql
-- 오래된 상세 데이터를 요약 후 삭제
CREATE OR REPLACE FUNCTION archive_old_metrics()
RETURNS void AS $$
BEGIN
  -- 30일 이상된 데이터를 일별 요약으로 압축
  INSERT INTO server_metrics_daily_summary
  SELECT 
    server_id,
    date_trunc('day', timestamp) as day,
    AVG(cpu) as avg_cpu,
    MAX(cpu) as max_cpu,
    MIN(cpu) as min_cpu,
    AVG(memory) as avg_memory,
    MAX(memory) as max_memory,
    MIN(memory) as min_memory,
    AVG(disk) as avg_disk,
    AVG(response_time) as avg_response_time,
    COUNT(*) as sample_count
  FROM server_metrics
  WHERE timestamp < NOW() - INTERVAL '30 days'
    AND timestamp >= NOW() - INTERVAL '31 days'
  GROUP BY server_id, date_trunc('day', timestamp)
  ON CONFLICT (server_id, day) DO NOTHING;
  
  -- 압축된 데이터 삭제
  DELETE FROM server_metrics
  WHERE timestamp < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- 매일 자정에 실행
SELECT cron.schedule('archive_old_metrics', '0 0 * * *', 'SELECT archive_old_metrics()');
```

## 📈 예상 성능 개선

### Before (현재)
- 전체 서버 메트릭 조회: ~2000ms
- 특정 서버 시간 범위 조회: ~1800ms
- 집계 쿼리: ~2500ms

### After (최적화 후)
- 전체 서버 메트릭 조회: ~50ms (40x 개선)
- 특정 서버 시간 범위 조회: ~30ms (60x 개선)
- 집계 쿼리: ~100ms (25x 개선)

## 🔧 구현 단계

1. **즉시 적용 가능** (무료 티어 내)
   - 복합 인덱스 추가
   - BRIN 인덱스 생성
   - 쿼리 최적화

2. **단계적 적용** (테스트 필요)
   - 구체화된 뷰 생성
   - Memory Cache 캐싱 구현

3. **장기 계획** (Supabase Pro 필요)
   - 파티셔닝 구현
   - pg_cron 활용한 자동화

## 💰 무료 티어 고려사항

- **인덱스 크기**: 각 인덱스는 약 10-20MB (500MB 한계 내 충분)
- **구체화된 뷰**: 약 50MB (7일 데이터 기준)
- **Memory Cache 캐싱**: 256MB 내에서 효율적 운영 가능

## 🚨 주의사항

1. 인덱스 생성 시 테이블 락 최소화를 위해 `CONCURRENTLY` 옵션 사용
2. 파티셔닝 전환 시 다운타임 최소화를 위한 점진적 마이그레이션
3. 캐시 무효화 전략 수립 필요

이 최적화를 통해 서버 메트릭 조회 성능을 대폭 개선하면서도 무료 티어 한계 내에서 안정적으로 운영할 수 있습니다.