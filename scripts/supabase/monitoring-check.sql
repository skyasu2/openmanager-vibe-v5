-- 🔍 Supabase 정기 모니터링 체크 스크립트
-- 월 1회 실행 권장

-- ===============================================
-- 1. 빠른 상태 체크
-- ===============================================

DO $$
DECLARE
    total_size BIGINT;
    usage_percent NUMERIC;
    command_vectors_count INTEGER;
    ml_results_count INTEGER;
BEGIN
    -- 기본 통계 수집
    SELECT pg_database_size(current_database()) INTO total_size;
    SELECT COUNT(*) INTO command_vectors_count FROM command_vectors;
    SELECT COUNT(*) INTO ml_results_count FROM ml_training_results;
    
    usage_percent := (total_size * 100.0 / (500 * 1024 * 1024));
    
    RAISE NOTICE '📊 === Supabase 월간 모니터링 리포트 ===';
    RAISE NOTICE '📅 체크 시간: %', NOW();
    RAISE NOTICE '💾 총 DB 크기: % (%.2f%% 사용)', pg_size_pretty(total_size), usage_percent;
    RAISE NOTICE '📚 command_vectors: %개 레코드', command_vectors_count;
    RAISE NOTICE '🤖 ml_training_results: %개 레코드', ml_results_count;
    RAISE NOTICE '💰 남은 여유 공간: %', pg_size_pretty((500 * 1024 * 1024) - total_size);
    
    -- 상태 평가
    IF usage_percent < 10 THEN
        RAISE NOTICE '✅ 상태: 매우 양호 (10%% 미만)';
    ELSIF usage_percent < 30 THEN
        RAISE NOTICE '✅ 상태: 양호 (30%% 미만)';
    ELSIF usage_percent < 60 THEN
        RAISE NOTICE '⚠️ 상태: 주의 (60%% 미만) - 정리 검토 권장';
    ELSIF usage_percent < 85 THEN
        RAISE NOTICE '🚨 상태: 경고 (85%% 미만) - 즉시 정리 필요';
    ELSE
        RAISE NOTICE '🔴 상태: 위험 (85%% 초과) - 긴급 정리 필요';
    END IF;
END $$;

-- ===============================================
-- 2. 테이블별 상세 분석
-- ===============================================

-- 2.1 command_vectors 테이블 품질 체크
SELECT 
    'command_vectors 품질 분석' as analysis_type,
    COUNT(*) as total_records,
    COUNT(CASE WHEN embedding IS NULL THEN 1 END) as null_embeddings,
    COUNT(CASE WHEN content = '' OR content IS NULL THEN 1 END) as empty_content,
    ROUND(AVG(LENGTH(content)), 1) as avg_content_length,
    COUNT(DISTINCT metadata->>'category') as unique_categories,
    pg_size_pretty(pg_total_relation_size('command_vectors')) as table_size
FROM command_vectors;

-- 2.2 카테고리별 분포 (상위 5개)
SELECT 
    '상위 카테고리 분포' as analysis_type,
    metadata->>'category' as category,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM command_vectors), 1) as percentage
FROM command_vectors 
GROUP BY metadata->>'category'
ORDER BY count DESC
LIMIT 5;

-- ===============================================
-- 3. 성능 지표 체크
-- ===============================================

-- 3.1 인덱스 사용률 체크
SELECT 
    '인덱스 사용률' as analysis_type,
    tablename,
    indexname,
    idx_scan as usage_count,
    CASE 
        WHEN idx_scan = 0 THEN '❌ 미사용'
        WHEN idx_scan < 100 THEN '⚠️ 저사용'
        WHEN idx_scan < 1000 THEN '✅ 보통'
        ELSE '🔥 고사용'
    END as usage_status
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- ===============================================
-- 4. 권장 조치사항
-- ===============================================

DO $$
DECLARE
    total_size BIGINT;
    usage_percent NUMERIC;
    vector_count INTEGER;
    old_records INTEGER;
BEGIN
    SELECT pg_database_size(current_database()) INTO total_size;
    SELECT COUNT(*) INTO vector_count FROM command_vectors;
    
    -- 3개월 이상 오래된 레코드 확인
    SELECT COUNT(*) INTO old_records 
    FROM command_vectors 
    WHERE created_at < NOW() - INTERVAL '3 months';
    
    usage_percent := (total_size * 100.0 / (500 * 1024 * 1024));
    
    RAISE NOTICE '📋 === 권장 조치사항 ===';
    
    -- 용량 기반 권장사항
    IF usage_percent > 60 THEN
        RAISE NOTICE '🧹 정리 권장: 무료 티어 60%% 초과';
        IF old_records > 0 THEN
            RAISE NOTICE '   - 3개월 이상 오래된 레코드 %개 정리 검토', old_records;
        END IF;
    END IF;
    
    -- 벡터 수 기반 권장사항
    IF vector_count > 10000 THEN
        RAISE NOTICE '📊 성능 권장: 벡터 수 10,000개 초과 - 파티셔닝 검토';
    ELSIF vector_count > 5000 THEN
        RAISE NOTICE '⚡ 성능 주의: 벡터 수 5,000개 초과 - 인덱스 최적화 검토';
    END IF;
    
    -- 정기 유지보수 권장
    RAISE NOTICE '🔄 정기 유지보수:';
    RAISE NOTICE '   - VACUUM ANALYZE 실행: 월 1회';
    RAISE NOTICE '   - 백업 생성: 주 1회 (중요 데이터)';
    RAISE NOTICE '   - 성능 모니터링: 이 스크립트 월 1회 실행';
    
    RAISE NOTICE '📈 다음 체크 권장일: %', (NOW() + INTERVAL '1 month')::date;
END $$;