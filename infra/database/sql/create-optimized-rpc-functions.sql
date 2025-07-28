-- 🚀 최적화된 RPC 함수들
-- 서버 메트릭 조회 성능 향상을 위한 PostgreSQL 함수

-- =====================================================
-- 1. 각 서버의 최신 상태 조회 (대시보드용)
-- =====================================================

CREATE OR REPLACE FUNCTION get_latest_server_status()
RETURNS TABLE (
    server_id VARCHAR(100),
    server_name VARCHAR(255),
    server_type VARCHAR(50),
    status VARCHAR(20),
    cpu NUMERIC(5,2),
    memory NUMERIC(5,2),
    disk NUMERIC(5,2),
    response_time INTEGER,
    last_update TIMESTAMP WITH TIME ZONE
) 
LANGUAGE plpgsql
STABLE
PARALLEL SAFE
AS $$
BEGIN
    RETURN QUERY
    WITH latest_metrics AS (
        SELECT DISTINCT ON (sm.server_id)
            sm.server_id,
            sm.server_name,
            sm.server_type,
            sm.status,
            sm.cpu,
            sm.memory,
            sm.disk,
            sm.response_time,
            sm.timestamp as last_update
        FROM server_metrics sm
        WHERE sm.timestamp > NOW() - INTERVAL '5 minutes'
        ORDER BY sm.server_id, sm.timestamp DESC
    )
    SELECT * FROM latest_metrics
    ORDER BY 
        CASE lm.status 
            WHEN 'critical' THEN 1
            WHEN 'warning' THEN 2
            WHEN 'healthy' THEN 3
            ELSE 4
        END,
        lm.server_id;
END;
$$;

-- 인덱스 힌트를 위한 코멘트
COMMENT ON FUNCTION get_latest_server_status() IS 
'최적화됨: idx_server_metrics_optimized 인덱스 사용';

-- =====================================================
-- 2. 샘플링된 메트릭 조회 (중간 시간 범위)
-- =====================================================

CREATE OR REPLACE FUNCTION get_server_metrics_sampled(
    p_server_id VARCHAR(100) DEFAULT NULL,
    p_start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '24 hours',
    p_interval_minutes INTEGER DEFAULT 5
)
RETURNS TABLE (
    server_id VARCHAR(100),
    server_name VARCHAR(255),
    timestamp TIMESTAMP WITH TIME ZONE,
    cpu NUMERIC(5,2),
    memory NUMERIC(5,2),
    disk NUMERIC(5,2),
    network_in BIGINT,
    network_out BIGINT,
    response_time INTEGER,
    status VARCHAR(20)
)
LANGUAGE plpgsql
STABLE
PARALLEL SAFE
AS $$
BEGIN
    RETURN QUERY
    WITH sampled_data AS (
        SELECT 
            sm.server_id,
            sm.server_name,
            date_trunc('minute', sm.timestamp) + 
                (((EXTRACT(MINUTE FROM sm.timestamp)::INTEGER / p_interval_minutes) * p_interval_minutes) || ' minutes')::INTERVAL as sample_time,
            AVG(sm.cpu) as cpu,
            AVG(sm.memory) as memory,
            AVG(sm.disk) as disk,
            AVG(sm.network_in) as network_in,
            AVG(sm.network_out) as network_out,
            AVG(sm.response_time) as response_time,
            MODE() WITHIN GROUP (ORDER BY sm.status) as status
        FROM server_metrics sm
        WHERE sm.timestamp >= p_start_time
            AND (p_server_id IS NULL OR sm.server_id = p_server_id)
        GROUP BY sm.server_id, sm.server_name, sample_time
    )
    SELECT 
        sd.server_id,
        sd.server_name,
        sd.sample_time as timestamp,
        ROUND(sd.cpu, 2),
        ROUND(sd.memory, 2),
        ROUND(sd.disk, 2),
        ROUND(sd.network_in),
        ROUND(sd.network_out),
        ROUND(sd.response_time),
        sd.status
    FROM sampled_data sd
    ORDER BY sd.sample_time DESC;
END;
$$;

-- =====================================================
-- 3. 시간별 집계 메트릭 (장기 데이터)
-- =====================================================

CREATE OR REPLACE FUNCTION get_server_metrics_hourly(
    p_server_id VARCHAR(100) DEFAULT NULL,
    p_start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '7 days'
)
RETURNS TABLE (
    server_id VARCHAR(100),
    server_name VARCHAR(255),
    hour TIMESTAMP WITH TIME ZONE,
    avg_cpu NUMERIC(5,2),
    max_cpu NUMERIC(5,2),
    avg_memory NUMERIC(5,2),
    max_memory NUMERIC(5,2),
    avg_disk NUMERIC(5,2),
    avg_response_time INTEGER,
    sample_count BIGINT,
    status_summary JSONB
)
LANGUAGE plpgsql
STABLE
PARALLEL SAFE
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sm.server_id,
        MAX(sm.server_name) as server_name,
        date_trunc('hour', sm.timestamp) as hour,
        ROUND(AVG(sm.cpu), 2) as avg_cpu,
        ROUND(MAX(sm.cpu), 2) as max_cpu,
        ROUND(AVG(sm.memory), 2) as avg_memory,
        ROUND(MAX(sm.memory), 2) as max_memory,
        ROUND(AVG(sm.disk), 2) as avg_disk,
        ROUND(AVG(sm.response_time)) as avg_response_time,
        COUNT(*) as sample_count,
        jsonb_object_agg(
            sm.status, 
            status_count
        ) FILTER (WHERE sm.status IS NOT NULL) as status_summary
    FROM server_metrics sm
    LEFT JOIN LATERAL (
        SELECT COUNT(*) as status_count
        FROM server_metrics sm2
        WHERE sm2.server_id = sm.server_id
            AND date_trunc('hour', sm2.timestamp) = date_trunc('hour', sm.timestamp)
            AND sm2.status = sm.status
    ) sc ON TRUE
    WHERE sm.timestamp >= p_start_time
        AND (p_server_id IS NULL OR sm.server_id = p_server_id)
    GROUP BY sm.server_id, date_trunc('hour', sm.timestamp)
    ORDER BY hour DESC;
END;
$$;

-- =====================================================
-- 4. 서버 성능 트렌드 분석
-- =====================================================

CREATE OR REPLACE FUNCTION analyze_server_performance_trend(
    p_server_id VARCHAR(100),
    p_metric VARCHAR(20) DEFAULT 'cpu', -- cpu, memory, disk, response_time
    p_period VARCHAR(10) DEFAULT '24h'
)
RETURNS TABLE (
    current_value NUMERIC,
    avg_value NUMERIC,
    min_value NUMERIC,
    max_value NUMERIC,
    std_deviation NUMERIC,
    trend VARCHAR(20), -- improving, stable, degrading
    anomaly_score NUMERIC
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_interval INTERVAL;
BEGIN
    -- 기간 파싱
    v_interval := CASE p_period
        WHEN '1h' THEN INTERVAL '1 hour'
        WHEN '6h' THEN INTERVAL '6 hours'
        WHEN '24h' THEN INTERVAL '24 hours'
        WHEN '7d' THEN INTERVAL '7 days'
        ELSE INTERVAL '24 hours'
    END;
    
    RETURN QUERY
    WITH metric_stats AS (
        SELECT 
            CASE p_metric
                WHEN 'cpu' THEN cpu
                WHEN 'memory' THEN memory
                WHEN 'disk' THEN disk
                WHEN 'response_time' THEN response_time::NUMERIC
                ELSE cpu
            END as metric_value,
            timestamp
        FROM server_metrics
        WHERE server_id = p_server_id
            AND timestamp > NOW() - v_interval
    ),
    recent_stats AS (
        SELECT 
            metric_value
        FROM metric_stats
        WHERE timestamp > NOW() - INTERVAL '10 minutes'
        ORDER BY timestamp DESC
        LIMIT 1
    ),
    overall_stats AS (
        SELECT 
            AVG(metric_value) as avg_val,
            MIN(metric_value) as min_val,
            MAX(metric_value) as max_val,
            STDDEV(metric_value) as std_dev
        FROM metric_stats
    ),
    trend_analysis AS (
        SELECT 
            CASE 
                WHEN regr_slope(EXTRACT(EPOCH FROM timestamp), metric_value) < -0.1 THEN 'improving'
                WHEN regr_slope(EXTRACT(EPOCH FROM timestamp), metric_value) > 0.1 THEN 'degrading'
                ELSE 'stable'
            END as trend_direction
        FROM metric_stats
    )
    SELECT 
        r.metric_value as current_value,
        ROUND(o.avg_val, 2) as avg_value,
        ROUND(o.min_val, 2) as min_value,
        ROUND(o.max_val, 2) as max_value,
        ROUND(o.std_dev, 2) as std_deviation,
        t.trend_direction as trend,
        CASE 
            WHEN o.std_dev > 0 THEN 
                ROUND(ABS(r.metric_value - o.avg_val) / o.std_dev, 2)
            ELSE 0
        END as anomaly_score
    FROM recent_stats r
    CROSS JOIN overall_stats o
    CROSS JOIN trend_analysis t;
END;
$$;

-- =====================================================
-- 5. 대량 데이터 정리 함수 (유지보수용)
-- =====================================================

CREATE OR REPLACE FUNCTION cleanup_old_metrics_batch(
    p_days_to_keep INTEGER DEFAULT 30,
    p_batch_size INTEGER DEFAULT 10000
)
RETURNS TABLE (
    deleted_count BIGINT,
    execution_time_ms INTEGER
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_start_time TIMESTAMP;
    v_deleted_total BIGINT := 0;
    v_deleted_batch BIGINT;
BEGIN
    v_start_time := clock_timestamp();
    
    -- 배치 단위로 삭제 (락 최소화)
    LOOP
        DELETE FROM server_metrics
        WHERE ctid IN (
            SELECT ctid
            FROM server_metrics
            WHERE created_at < NOW() - (p_days_to_keep || ' days')::INTERVAL
            LIMIT p_batch_size
        );
        
        GET DIAGNOSTICS v_deleted_batch = ROW_COUNT;
        v_deleted_total := v_deleted_total + v_deleted_batch;
        
        EXIT WHEN v_deleted_batch < p_batch_size;
        
        -- 짧은 휴식 (다른 쿼리가 실행될 수 있도록)
        PERFORM pg_sleep(0.1);
    END LOOP;
    
    RETURN QUERY
    SELECT 
        v_deleted_total,
        EXTRACT(MILLISECONDS FROM clock_timestamp() - v_start_time)::INTEGER;
END;
$$;

-- =====================================================
-- 6. 실시간 모니터링 뷰
-- =====================================================

CREATE OR REPLACE VIEW v_realtime_server_monitoring AS
WITH latest_data AS (
    SELECT 
        server_id,
        server_name,
        server_type,
        status,
        cpu,
        memory,
        disk,
        response_time,
        timestamp,
        ROW_NUMBER() OVER (PARTITION BY server_id ORDER BY timestamp DESC) as rn
    FROM server_metrics
    WHERE timestamp > NOW() - INTERVAL '2 minutes'
)
SELECT 
    server_id,
    server_name,
    server_type,
    status,
    cpu,
    memory,
    disk,
    response_time,
    timestamp as last_update,
    EXTRACT(EPOCH FROM NOW() - timestamp)::INTEGER as seconds_since_update,
    CASE 
        WHEN EXTRACT(EPOCH FROM NOW() - timestamp) > 120 THEN 'stale'
        WHEN EXTRACT(EPOCH FROM NOW() - timestamp) > 60 THEN 'delayed'
        ELSE 'fresh'
    END as data_freshness
FROM latest_data
WHERE rn = 1
ORDER BY 
    CASE status 
        WHEN 'critical' THEN 1
        WHEN 'warning' THEN 2
        WHEN 'healthy' THEN 3
        ELSE 4
    END,
    server_id;

-- =====================================================
-- 7. 권한 부여
-- =====================================================

-- authenticated 사용자에게 함수 실행 권한 부여
GRANT EXECUTE ON FUNCTION get_latest_server_status() TO authenticated;
GRANT EXECUTE ON FUNCTION get_server_metrics_sampled(VARCHAR, TIMESTAMP WITH TIME ZONE, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_server_metrics_hourly(VARCHAR, TIMESTAMP WITH TIME ZONE) TO authenticated;
GRANT EXECUTE ON FUNCTION analyze_server_performance_trend(VARCHAR, VARCHAR, VARCHAR) TO authenticated;

-- 뷰 접근 권한
GRANT SELECT ON v_realtime_server_monitoring TO authenticated;

-- service_role에게 관리 함수 권한
GRANT EXECUTE ON FUNCTION cleanup_old_metrics_batch(INTEGER, INTEGER) TO service_role;

-- =====================================================
-- 8. 성능 최적화 완료 확인
-- =====================================================

SELECT 
    '✅ RPC 함수 생성 완료!' as status,
    COUNT(*) as function_count,
    string_agg(proname, ', ') as functions
FROM pg_proc
WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
AND proname IN (
    'get_latest_server_status',
    'get_server_metrics_sampled',
    'get_server_metrics_hourly',
    'analyze_server_performance_trend',
    'cleanup_old_metrics_batch'
);