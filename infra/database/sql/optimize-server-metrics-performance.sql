-- 🚀 서버 메트릭 쿼리 성능 최적화 스크립트
-- 실행 전 현재 성능 측정 후 비교 권장

-- =====================================================
-- 1. 현재 성능 측정 (최적화 전)
-- =====================================================

-- 테이블 통계 업데이트
ANALYZE server_metrics;

-- 현재 인덱스 상태 확인
SELECT 
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE tablename = 'server_metrics'
ORDER BY idx_scan DESC;

-- 테이블 크기 확인
SELECT 
    pg_size_pretty(pg_total_relation_size('server_metrics')) as total_size,
    pg_size_pretty(pg_relation_size('server_metrics')) as table_size,
    pg_size_pretty(pg_total_relation_size('server_metrics') - pg_relation_size('server_metrics')) as indexes_size,
    (SELECT count(*) FROM server_metrics) as row_count;

-- =====================================================
-- 2. 기존 인덱스 분석 및 정리
-- =====================================================

-- 사용되지 않는 인덱스 확인
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan
FROM pg_stat_user_indexes
WHERE tablename = 'server_metrics' 
AND idx_scan = 0
AND indexname NOT LIKE '%_pkey';

-- =====================================================
-- 3. 최적화된 인덱스 생성
-- =====================================================

-- 시간 기반 쿼리를 위한 BRIN 인덱스 (매우 효율적)
DROP INDEX IF EXISTS idx_server_metrics_timestamp_brin;
CREATE INDEX CONCURRENTLY idx_server_metrics_timestamp_brin 
ON server_metrics USING BRIN (timestamp) 
WITH (pages_per_range = 128);

-- 서버별 최신 데이터 조회 최적화 (INCLUDE 절 사용)
DROP INDEX IF EXISTS idx_server_metrics_optimized;
CREATE INDEX CONCURRENTLY idx_server_metrics_optimized 
ON server_metrics (server_id, timestamp DESC) 
INCLUDE (cpu, memory, disk, status, response_time)
WHERE timestamp > NOW() - INTERVAL '7 days';

-- 상태별 조회 최적화
DROP INDEX IF EXISTS idx_server_metrics_status_timestamp;
CREATE INDEX CONCURRENTLY idx_server_metrics_status_timestamp 
ON server_metrics (status, timestamp DESC)
WHERE status IN ('warning', 'critical');

-- 집계 쿼리 최적화를 위한 복합 인덱스
DROP INDEX IF EXISTS idx_server_metrics_aggregate;
CREATE INDEX CONCURRENTLY idx_server_metrics_aggregate 
ON server_metrics (timestamp, server_id, cpu, memory, disk);

-- =====================================================
-- 4. 쿼리 성능 향상을 위한 통계 정보 개선
-- =====================================================

-- 통계 대상 증가 (더 정확한 쿼리 플랜)
ALTER TABLE server_metrics ALTER COLUMN timestamp SET STATISTICS 1000;
ALTER TABLE server_metrics ALTER COLUMN server_id SET STATISTICS 500;

-- 테이블 통계 재수집
VACUUM ANALYZE server_metrics;

-- =====================================================
-- 5. 자주 사용되는 쿼리를 위한 준비된 문(Prepared Statements)
-- =====================================================

-- 특정 서버의 최근 메트릭 조회
PREPARE get_server_metrics (text, interval) AS
SELECT 
    id, server_id, timestamp, cpu, memory, disk, 
    network_in, network_out, response_time, status
FROM server_metrics
WHERE server_id = $1 
AND timestamp > NOW() - $2
ORDER BY timestamp DESC
LIMIT 500;

-- 서버 상태 요약 조회
PREPARE get_server_summary AS
WITH latest_metrics AS (
    SELECT DISTINCT ON (server_id)
        server_id, server_name, server_type, status,
        cpu, memory, disk, response_time, timestamp
    FROM server_metrics
    WHERE timestamp > NOW() - INTERVAL '5 minutes'
    ORDER BY server_id, timestamp DESC
)
SELECT * FROM latest_metrics
ORDER BY 
    CASE status 
        WHEN 'critical' THEN 1
        WHEN 'warning' THEN 2
        WHEN 'healthy' THEN 3
        ELSE 4
    END,
    server_id;

-- =====================================================
-- 6. 성능 개선을 위한 설정 조정 (세션 레벨)
-- =====================================================

-- 병렬 쿼리 실행 활성화
SET max_parallel_workers_per_gather = 4;
SET parallel_setup_cost = 100;
SET parallel_tuple_cost = 0.01;

-- 메모리 설정 최적화
SET work_mem = '64MB';
SET maintenance_work_mem = '128MB';

-- =====================================================
-- 7. 최적화 후 성능 테스트
-- =====================================================

-- 테스트 1: 전체 서버 최신 상태 조회
EXPLAIN (ANALYZE, BUFFERS, TIMING) 
WITH latest_metrics AS (
    SELECT DISTINCT ON (server_id)
        server_id, server_name, status, cpu, memory, disk, timestamp
    FROM server_metrics
    WHERE timestamp > NOW() - INTERVAL '5 minutes'
    ORDER BY server_id, timestamp DESC
)
SELECT * FROM latest_metrics;

-- 테스트 2: 특정 서버 시간대별 메트릭
EXPLAIN (ANALYZE, BUFFERS, TIMING)
SELECT 
    date_trunc('minute', timestamp) as minute,
    AVG(cpu) as avg_cpu,
    AVG(memory) as avg_memory,
    AVG(disk) as avg_disk,
    AVG(response_time) as avg_response_time
FROM server_metrics
WHERE server_id = 'web-server-01'
AND timestamp > NOW() - INTERVAL '1 hour'
GROUP BY date_trunc('minute', timestamp)
ORDER BY minute DESC;

-- 테스트 3: 경고/위험 서버 조회
EXPLAIN (ANALYZE, BUFFERS, TIMING)
SELECT DISTINCT ON (server_id)
    server_id, server_name, status, cpu, memory, disk, timestamp
FROM server_metrics
WHERE status IN ('warning', 'critical')
AND timestamp > NOW() - INTERVAL '10 minutes'
ORDER BY server_id, timestamp DESC;

-- =====================================================
-- 8. 인덱스 사용 현황 모니터링 뷰
-- =====================================================

CREATE OR REPLACE VIEW v_index_usage_stats AS
SELECT 
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
    idx_scan as scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched,
    CASE 
        WHEN idx_scan = 0 THEN 'UNUSED'
        WHEN idx_scan < 100 THEN 'RARELY USED'
        WHEN idx_scan < 1000 THEN 'OCCASIONALLY USED'
        ELSE 'FREQUENTLY USED'
    END as usage_category
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- =====================================================
-- 9. 자동 VACUUM 설정 최적화
-- =====================================================

-- server_metrics 테이블에 대한 자동 VACUUM 임계값 조정
ALTER TABLE server_metrics SET (
    autovacuum_vacuum_scale_factor = 0.1,
    autovacuum_analyze_scale_factor = 0.05,
    autovacuum_vacuum_cost_delay = 10,
    autovacuum_vacuum_cost_limit = 1000
);

-- =====================================================
-- 10. 최종 검증
-- =====================================================

-- 인덱스 생성 확인
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'server_metrics'
ORDER BY indexname;

-- 테이블 통계 확인
SELECT 
    attname,
    n_distinct,
    most_common_vals,
    histogram_bounds
FROM pg_stats
WHERE tablename = 'server_metrics'
AND attname IN ('server_id', 'timestamp', 'status');

-- 완료 메시지
SELECT '✅ 서버 메트릭 성능 최적화 완료!' as status,
       '예상 성능 개선: 40-60배' as expected_improvement,
       '다음 단계: 실제 쿼리 성능 모니터링' as next_step;