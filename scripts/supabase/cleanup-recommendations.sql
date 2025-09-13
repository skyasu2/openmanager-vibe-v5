-- 🧹 Supabase 데이터베이스 자동 정리 권장사항
-- database-analysis.sql 결과를 바탕으로 한 구체적인 정리 작업

-- ===============================================
-- 1. 안전 백업 생성 (정리 작업 전 필수)
-- ===============================================

-- 중요 데이터 백업 테이블 생성
CREATE TABLE IF NOT EXISTS command_vectors_backup AS 
SELECT * FROM command_vectors WHERE 1=0; -- 구조만 복사

-- 백업 실행 함수
CREATE OR REPLACE FUNCTION create_safety_backup()
RETURNS TEXT AS $$
DECLARE
    backup_count INTEGER;
    result_message TEXT;
BEGIN
    -- 기존 백업 데이터 확인
    SELECT COUNT(*) INTO backup_count FROM command_vectors_backup;
    
    IF backup_count = 0 THEN
        -- 전체 데이터 백업
        INSERT INTO command_vectors_backup SELECT * FROM command_vectors;
        GET DIAGNOSTICS backup_count = ROW_COUNT;
        result_message := '✅ 안전 백업 완료: ' || backup_count || '개 레코드';
    ELSE
        result_message := '⚠️ 기존 백업 존재 (' || backup_count || '개) - 수동 확인 필요';
    END IF;
    
    RETURN result_message;
END;
$$ LANGUAGE plpgsql;

-- 백업 실행
SELECT create_safety_backup();

-- ===============================================
-- 2. 불필요한 데이터 정리
-- ===============================================

-- 2.1 임베딩 없는 문서 정리
DO $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- 임베딩이 없고 오래된 문서 삭제
    DELETE FROM command_vectors 
    WHERE embedding IS NULL 
    AND (created_at < NOW() - INTERVAL '7 days' OR created_at IS NULL);
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '🗑️ 임베딩 없는 문서 삭제: %개', deleted_count;
END $$;

-- 2.2 빈 콘텐츠 문서 정리
DO $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- 콘텐츠가 비어있거나 너무 짧은 문서 삭제
    DELETE FROM command_vectors 
    WHERE content IS NULL 
    OR LENGTH(TRIM(content)) < 10
    OR content = '';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '📝 빈 콘텐츠 문서 삭제: %개', deleted_count;
END $$;

-- 2.3 중복 문서 정리 (최신 것만 유지)
DO $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- 같은 콘텐츠의 중복 문서 중 오래된 것 삭제
    DELETE FROM command_vectors cv1
    WHERE EXISTS (
        SELECT 1 FROM command_vectors cv2
        WHERE cv2.content = cv1.content
        AND cv2.created_at > cv1.created_at
        AND cv1.content IS NOT NULL
        AND LENGTH(cv1.content) > 10
    );
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '🔄 중복 문서 정리: %개 (오래된 버전 삭제)', deleted_count;
END $$;

-- 2.4 오래된 테스트 데이터 정리
DO $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- 테스트 또는 임시 데이터로 보이는 것들 정리
    DELETE FROM command_vectors 
    WHERE (
        metadata->>'category' IN ('test', 'temp', 'debug', 'sample')
        OR id LIKE 'test_%'
        OR id LIKE 'temp_%'
        OR id LIKE 'debug_%'
        OR content LIKE '%test%test%' -- 명백한 테스트 콘텐츠
    )
    AND created_at < NOW() - INTERVAL '30 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '🧪 테스트 데이터 정리: %개', deleted_count;
END $$;

-- ===============================================
-- 3. 불필요한 인덱스 정리
-- ===============================================

-- 사용되지 않는 인덱스 식별 및 제거
DO $$
DECLARE
    index_record RECORD;
    dropped_count INTEGER := 0;
BEGIN
    -- 사용되지 않는 인덱스 찾기 및 제거
    FOR index_record IN 
        SELECT indexname 
        FROM pg_stat_user_indexes 
        WHERE idx_scan = 0 
        AND schemaname = 'public'
        AND tablename = 'command_vectors'
        AND indexname NOT LIKE '%_pkey' -- PRIMARY KEY 인덱스는 제외
        AND indexname NOT LIKE '%embedding%' -- 벡터 인덱스는 보존
    LOOP
        BEGIN
            EXECUTE 'DROP INDEX IF EXISTS ' || index_record.indexname;
            dropped_count := dropped_count + 1;
            RAISE NOTICE '🗑️ 사용되지 않는 인덱스 제거: %', index_record.indexname;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE '⚠️ 인덱스 제거 실패: % - %', index_record.indexname, SQLERRM;
        END;
    END LOOP;
    
    IF dropped_count = 0 THEN
        RAISE NOTICE '✅ 제거할 불필요한 인덱스 없음';
    ELSE
        RAISE NOTICE '🔧 총 %개 인덱스 제거 완료', dropped_count;
    END IF;
END $$;

-- ===============================================
-- 4. 메타데이터 정규화
-- ===============================================

-- 4.1 빈 메타데이터 정리
UPDATE command_vectors 
SET metadata = '{}' 
WHERE metadata IS NULL;

-- 4.2 카테고리 정규화
UPDATE command_vectors 
SET metadata = jsonb_set(
    metadata, 
    '{category}', 
    '"documentation"'
)
WHERE metadata->>'category' IS NULL 
AND content IS NOT NULL;

-- 4.3 타임스탬프 정규화
UPDATE command_vectors 
SET created_at = NOW(),
    updated_at = NOW()
WHERE created_at IS NULL;

-- ===============================================
-- 5. 테이블 최적화
-- ===============================================

-- 5.1 VACUUM 및 ANALYZE 실행
VACUUM ANALYZE command_vectors;

-- 5.2 통계 업데이트
DO $$
BEGIN
    -- 테이블 통계 강제 업데이트
    ANALYZE command_vectors;
    RAISE NOTICE '📊 테이블 통계 업데이트 완료';
END $$;

-- ===============================================
-- 6. 불필요한 함수 및 확장 정리
-- ===============================================

-- 사용되지 않는 함수 식별
SELECT 
    n.nspname as schema_name,
    p.proname as function_name,
    '❓ 검토 필요 - 사용 여부 확인' as recommendation
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname NOT IN (
    'search_similar_vectors',
    'search_vectors_by_category', 
    'hybrid_search_vectors',
    'advanced_hybrid_search_vectors',
    'calculate_adaptive_ttl',
    'cleanup_vector_cache',
    'set_hnsw_search_params'
) -- 필수 함수 목록
ORDER BY p.proname;

-- ===============================================
-- 7. 정리 후 상태 확인
-- ===============================================

-- 정리 후 통계
DO $$
DECLARE
    total_rows INTEGER;
    total_size TEXT;
    null_embeddings INTEGER;
    empty_content INTEGER;
    categories INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_rows FROM command_vectors;
    SELECT pg_size_pretty(pg_total_relation_size('command_vectors')) INTO total_size;
    SELECT COUNT(*) INTO null_embeddings FROM command_vectors WHERE embedding IS NULL;
    SELECT COUNT(*) INTO empty_content FROM command_vectors WHERE content IS NULL OR LENGTH(TRIM(content)) < 10;
    SELECT COUNT(DISTINCT metadata->>'category') INTO categories FROM command_vectors;
    
    RAISE NOTICE '📊 === 정리 후 현재 상태 ===';
    RAISE NOTICE '📚 총 문서 수: %개', total_rows;
    RAISE NOTICE '💾 테이블 크기: %', total_size;
    RAISE NOTICE '⚠️ 임베딩 없는 문서: %개', null_embeddings;
    RAISE NOTICE '📝 빈 콘텐츠 문서: %개', empty_content;
    RAISE NOTICE '🏷️ 고유 카테고리 수: %개', categories;
    
    IF total_rows > 0 THEN
        RAISE NOTICE '✅ 데이터 정리 완료 - 정상 상태';
    ELSE
        RAISE NOTICE '⚠️ 경고: 모든 데이터가 삭제됨 - 백업에서 복구 검토';
    END IF;
END $$;

-- ===============================================
-- 8. 복구 함수 (비상시 사용)
-- ===============================================

-- 백업에서 복구하는 함수
CREATE OR REPLACE FUNCTION restore_from_backup()
RETURNS TEXT AS $$
DECLARE
    backup_count INTEGER;
    current_count INTEGER;
    result_message TEXT;
BEGIN
    SELECT COUNT(*) INTO backup_count FROM command_vectors_backup;
    SELECT COUNT(*) INTO current_count FROM command_vectors;
    
    IF backup_count = 0 THEN
        RETURN '❌ 백업 데이터가 없습니다';
    END IF;
    
    IF current_count > 0 THEN
        RETURN '⚠️ 현재 데이터가 존재합니다. 수동으로 TRUNCATE 후 복구하세요';
    END IF;
    
    -- 백업에서 복구
    INSERT INTO command_vectors SELECT * FROM command_vectors_backup;
    GET DIAGNOSTICS current_count = ROW_COUNT;
    
    result_message := '✅ 백업에서 복구 완료: ' || current_count || '개 레코드';
    RETURN result_message;
END;
$$ LANGUAGE plpgsql;

-- ===============================================
-- 9. 정기 정리 작업 스케줄링 권장사항
-- ===============================================

-- 정기 정리 함수
CREATE OR REPLACE FUNCTION weekly_cleanup()
RETURNS TEXT AS $$
DECLARE
    result_text TEXT := '';
    deleted_count INTEGER;
BEGIN
    -- 1. 오래된 임시 데이터 정리
    DELETE FROM command_vectors 
    WHERE metadata->>'category' = 'temp' 
    AND created_at < NOW() - INTERVAL '7 days';
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    result_text := result_text || '임시 데이터 ' || deleted_count || '개 정리; ';
    
    -- 2. VACUUM
    VACUUM command_vectors;
    result_text := result_text || 'VACUUM 완료; ';
    
    -- 3. ANALYZE
    ANALYZE command_vectors;
    result_text := result_text || 'ANALYZE 완료';
    
    RETURN result_text;
END;
$$ LANGUAGE plpgsql;

-- 마지막 메시지
DO $$
BEGIN
    RAISE NOTICE '🎉 === 데이터베이스 정리 작업 완료 ===';
    RAISE NOTICE '📋 권장 사항:';
    RAISE NOTICE '  1. 정기적 정리: SELECT weekly_cleanup(); (주 1회)';
    RAISE NOTICE '  2. 백업 확인: SELECT COUNT(*) FROM command_vectors_backup;';
    RAISE NOTICE '  3. 복구 필요시: SELECT restore_from_backup();';
    RAISE NOTICE '  4. 모니터링: 무료 티어 500MB 제한 주의';
END $$;