-- 🧹 Supabase 안전한 정리 작업 스크립트
-- 분석 결과를 바탕으로 한 즉시 실행 가능한 정리 작업

-- ===============================================
-- 1. 안전 백업 및 확인
-- ===============================================

-- 현재 상태 기록
DO $$
DECLARE
    total_size BIGINT;
    command_vectors_rows INTEGER;
    notes_rows INTEGER;
    ml_rows INTEGER;
BEGIN
    SELECT pg_database_size(current_database()) INTO total_size;
    SELECT COUNT(*) INTO command_vectors_rows FROM command_vectors;
    SELECT COUNT(*) INTO notes_rows FROM notes;
    SELECT COUNT(*) INTO ml_rows FROM ml_training_results;
    
    RAISE NOTICE '📊 === 정리 작업 전 현재 상태 ===';
    RAISE NOTICE '💾 총 DB 크기: %', pg_size_pretty(total_size);
    RAISE NOTICE '📚 command_vectors: %개 레코드', command_vectors_rows;
    RAISE NOTICE '📝 notes: %개 레코드', notes_rows;
    RAISE NOTICE '🤖 ml_training_results: %개 레코드', ml_rows;
    RAISE NOTICE '🔢 무료 티어 사용률: %.2f%%', (total_size * 100.0 / (500 * 1024 * 1024));
END $$;

-- ===============================================
-- 2. 불필요한 테이블 제거 (안전 확인 후)
-- ===============================================

-- 2.1 notes 테이블 제거 (0개 데이터, 완전 미사용)
DO $$
DECLARE
    notes_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO notes_count FROM notes;
    
    IF notes_count = 0 THEN
        DROP TABLE IF EXISTS notes CASCADE;
        RAISE NOTICE '✅ notes 테이블 제거 완료 (0개 레코드)';
    ELSE
        RAISE NOTICE '⚠️ notes 테이블에 %개 레코드 존재 - 수동 확인 필요', notes_count;
    END IF;
END $$;

-- ===============================================
-- 3. 테이블 최적화 (실제 사용 테이블만)
-- ===============================================

-- 3.1 command_vectors 테이블 최적화
VACUUM ANALYZE command_vectors;

-- 3.2 ml_training_results 테이블 최적화 (소량 데이터 유지)
VACUUM ANALYZE ml_training_results;

-- ===============================================
-- 4. 인덱스 최적화 확인
-- ===============================================

-- 사용되지 않는 인덱스 식별 (제거하지 않고 보고만)
DO $$
DECLARE
    index_record RECORD;
    unused_count INTEGER := 0;
BEGIN
    RAISE NOTICE '🔍 === 인덱스 사용 현황 ===';
    
    FOR index_record IN 
        SELECT 
            schemaname,
            tablename,
            indexname,
            idx_scan as times_used
        FROM pg_stat_user_indexes 
        WHERE schemaname = 'public'
        ORDER BY idx_scan ASC
    LOOP
        IF index_record.times_used = 0 THEN
            unused_count := unused_count + 1;
            RAISE NOTICE '❓ 미사용 인덱스: %.% (사용횟수: %)', 
                index_record.tablename, index_record.indexname, index_record.times_used;
        ELSE
            RAISE NOTICE '✅ 활성 인덱스: %.% (사용횟수: %)', 
                index_record.tablename, index_record.indexname, index_record.times_used;
        END IF;
    END LOOP;
    
    IF unused_count = 0 THEN
        RAISE NOTICE '🎉 모든 인덱스가 적절히 사용되고 있습니다';
    ELSE
        RAISE NOTICE '⚠️ %개 미사용 인덱스 발견 - 향후 검토 권장', unused_count;
    END IF;
END $$;

-- ===============================================
-- 5. 정리 후 상태 확인
-- ===============================================

DO $$
DECLARE
    total_size_after BIGINT;
    saved_space BIGINT;
    command_vectors_rows INTEGER;
    ml_rows INTEGER;
BEGIN
    SELECT pg_database_size(current_database()) INTO total_size_after;
    SELECT COUNT(*) INTO command_vectors_rows FROM command_vectors;
    SELECT COUNT(*) INTO ml_rows FROM ml_training_results;
    
    RAISE NOTICE '📊 === 정리 작업 후 현재 상태 ===';
    RAISE NOTICE '💾 총 DB 크기: %', pg_size_pretty(total_size_after);
    RAISE NOTICE '📚 command_vectors: %개 레코드 (유지)', command_vectors_rows;
    RAISE NOTICE '🤖 ml_training_results: %개 레코드 (유지)', ml_rows;
    RAISE NOTICE '🔢 무료 티어 사용률: %.2f%%', (total_size_after * 100.0 / (500 * 1024 * 1024));
    RAISE NOTICE '💰 무료 티어 여유 공간: %', pg_size_pretty((500 * 1024 * 1024) - total_size_after);
    
    IF total_size_after < (500 * 1024 * 1024 * 0.1) THEN -- 10% 미만
        RAISE NOTICE '✅ 무료 티어 사용량 매우 양호 (10%% 미만)';
    ELSIF total_size_after < (500 * 1024 * 1024 * 0.5) THEN -- 50% 미만
        RAISE NOTICE '✅ 무료 티어 사용량 양호 (50%% 미만)';
    ELSE
        RAISE NOTICE '⚠️ 무료 티어 사용량 주의 필요';
    END IF;
END $$;

-- ===============================================
-- 6. 향후 모니터링 권장사항
-- ===============================================

DO $$
BEGIN
    RAISE NOTICE '📋 === 향후 모니터링 권장사항 ===';
    RAISE NOTICE '1. 월 1회 VACUUM ANALYZE 실행';
    RAISE NOTICE '2. command_vectors 테이블이 10,000개 레코드 초과시 파티셔닝 검토';
    RAISE NOTICE '3. 무료 티어 400MB 초과시 정리 작업 재실행';
    RAISE NOTICE '4. ml_training_results 테이블 사용량 모니터링';
    RAISE NOTICE '5. 정기적 백업: SELECT * FROM command_vectors; 실행하여 중요 데이터 보존';
END $$;