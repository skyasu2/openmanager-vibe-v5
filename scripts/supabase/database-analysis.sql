-- 🔍 Supabase 데이터베이스 상태 종합 분석
-- 불필요한 컬럼, 테이블, 인덱스, 데이터 정리 및 최적화

-- ===============================================
-- 1. 전체 데이터베이스 개요
-- ===============================================

-- 모든 스키마 조회
SELECT 
    schema_name,
    CASE 
        WHEN schema_name IN ('public', 'auth', 'storage', 'realtime', 'supabase_functions') THEN '시스템 스키마'
        WHEN schema_name LIKE 'pg_%' THEN 'PostgreSQL 시스템'
        WHEN schema_name = 'information_schema' THEN '정보 스키마'
        ELSE '사용자 정의'
    END as schema_type
FROM information_schema.schemata 
ORDER BY schema_type, schema_name;

-- ===============================================
-- 2. 테이블 분석 (크기, 행 수, 사용률)
-- ===============================================

-- 모든 테이블의 크기와 통계
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as index_size,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes,
    n_live_tup as live_rows,
    n_dead_tup as dead_rows,
    last_vacuum,
    last_autovacuum,
    last_analyze,
    last_autoanalyze
FROM pg_stat_user_tables 
JOIN pg_tables ON pg_stat_user_tables.relname = pg_tables.tablename
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- ===============================================
-- 3. 컬럼 사용률 분석
-- ===============================================

-- 모든 테이블의 컬럼 정보
SELECT 
    table_schema,
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length,
    CASE 
        WHEN column_default IS NOT NULL THEN '기본값 있음'
        WHEN is_nullable = 'YES' THEN 'NULL 허용'
        ELSE '필수 컬럼'
    END as column_usage_type
FROM information_schema.columns 
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- ===============================================
-- 4. 인덱스 분석 (사용률, 크기, 중복)
-- ===============================================

-- 인덱스 사용 통계
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as times_used,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched,
    pg_size_pretty(pg_relation_size(indexname::regclass)) as index_size,
    CASE 
        WHEN idx_scan = 0 THEN '⚠️ 사용되지 않음'
        WHEN idx_scan < 100 THEN '⚡ 저사용'
        WHEN idx_scan < 1000 THEN '✅ 보통 사용'
        ELSE '🔥 고사용'
    END as usage_status
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC;

-- 중복 가능성이 있는 인덱스 찾기
SELECT 
    a.schemaname,
    a.tablename,
    a.indexname as index1,
    b.indexname as index2,
    a.indexdef as def1,
    b.indexdef as def2
FROM pg_indexes a
JOIN pg_indexes b ON a.tablename = b.tablename 
WHERE a.indexname < b.indexname
AND a.schemaname = 'public'
AND b.schemaname = 'public'
AND a.indexdef SIMILAR TO b.indexdef;

-- ===============================================
-- 5. RAG 관련 테이블 상세 분석
-- ===============================================

-- command_vectors 테이블 상세 분석
SELECT 
    'command_vectors' as table_name,
    COUNT(*) as total_rows,
    COUNT(CASE WHEN embedding IS NULL THEN 1 END) as null_embeddings,
    COUNT(CASE WHEN content = '' OR content IS NULL THEN 1 END) as empty_content,
    COUNT(CASE WHEN metadata = '{}' OR metadata IS NULL THEN 1 END) as empty_metadata,
    AVG(LENGTH(content)) as avg_content_length,
    MAX(LENGTH(content)) as max_content_length,
    MIN(LENGTH(content)) as min_content_length,
    COUNT(DISTINCT metadata->>'category') as unique_categories,
    pg_size_pretty(pg_total_relation_size('command_vectors')) as table_size
FROM command_vectors;

-- 카테고리별 분포
SELECT 
    metadata->>'category' as category,
    COUNT(*) as count,
    AVG(LENGTH(content)) as avg_content_length,
    MIN(created_at) as oldest,
    MAX(updated_at) as newest
FROM command_vectors 
GROUP BY metadata->>'category'
ORDER BY count DESC;

-- 중복 콘텐츠 감지
SELECT 
    content_hash,
    COUNT(*) as duplicate_count,
    STRING_AGG(id, ', ') as duplicate_ids
FROM (
    SELECT 
        id,
        content,
        MD5(content) as content_hash
    FROM command_vectors
    WHERE content IS NOT NULL AND LENGTH(content) > 0
) duplicates
GROUP BY content_hash
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- ===============================================
-- 6. 불필요한 데이터 식별
-- ===============================================

-- 오래된 데이터 (6개월 이상)
SELECT 
    table_name,
    count_old_data,
    total_data,
    ROUND(count_old_data * 100.0 / total_data, 2) as old_data_percentage
FROM (
    SELECT 
        'command_vectors' as table_name,
        COUNT(CASE WHEN created_at < NOW() - INTERVAL '6 months' THEN 1 END) as count_old_data,
        COUNT(*) as total_data
    FROM command_vectors
    WHERE created_at IS NOT NULL
) old_data_analysis;

-- 임베딩 없는 문서 (정리 대상)
SELECT 
    COUNT(*) as documents_without_embeddings,
    STRING_AGG(id, ', ') as document_ids
FROM command_vectors 
WHERE embedding IS NULL
LIMIT 10;

-- 빈 콘텐츠 문서 (정리 대상)
SELECT 
    COUNT(*) as documents_with_empty_content,
    STRING_AGG(id, ', ') as document_ids
FROM command_vectors 
WHERE content IS NULL OR LENGTH(TRIM(content)) < 10
LIMIT 10;

-- ===============================================
-- 7. 스토리지 사용량 분석
-- ===============================================

-- 테이블별 상세 스토리지 사용량
SELECT 
    nspname as schema_name,
    relname as table_name,
    pg_size_pretty(pg_total_relation_size(oid)) as total_size,
    pg_size_pretty(pg_relation_size(oid)) as table_size,
    pg_size_pretty(pg_total_relation_size(oid) - pg_relation_size(oid)) as index_size,
    ROUND(100.0 * pg_total_relation_size(oid) / 
          (SELECT SUM(pg_total_relation_size(oid)) FROM pg_class WHERE relkind = 'r'), 2) as size_percentage
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE relkind = 'r' AND nspname = 'public'
ORDER BY pg_total_relation_size(oid) DESC;

-- 전체 데이터베이스 크기
SELECT 
    pg_size_pretty(pg_database_size(current_database())) as total_database_size,
    pg_size_pretty(SUM(pg_total_relation_size(oid))) as total_table_size,
    pg_size_pretty(SUM(pg_relation_size(oid))) as total_data_size,
    pg_size_pretty(SUM(pg_total_relation_size(oid) - pg_relation_size(oid))) as total_index_size
FROM pg_class 
WHERE relkind = 'r';

-- ===============================================
-- 8. 불필요한 확장 및 함수 검사
-- ===============================================

-- 설치된 확장 목록
SELECT 
    extname as extension_name,
    extversion as version,
    nspname as schema_name,
    CASE 
        WHEN extname IN ('plpgsql', 'pg_stat_statements', 'uuid-ossp', 'vector') THEN '✅ 필수'
        WHEN extname LIKE 'pg_%' THEN '⚡ 시스템'
        ELSE '❓ 검토 필요'
    END as necessity
FROM pg_extension 
JOIN pg_namespace ON pg_extension.extnamespace = pg_namespace.oid
ORDER BY necessity, extname;

-- 사용자 정의 함수 목록
SELECT 
    n.nspname as schema_name,
    p.proname as function_name,
    pg_catalog.pg_get_function_arguments(p.oid) as arguments,
    t.typname as return_type,
    CASE 
        WHEN p.proname LIKE 'search_%' THEN '🔍 RAG 검색'
        WHEN p.proname LIKE 'vector_%' THEN '📊 벡터 처리'
        WHEN p.proname LIKE 'hybrid_%' THEN '🔄 하이브리드'
        ELSE '❓ 기타'
    END as function_category
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
JOIN pg_type t ON p.prorettype = t.oid
WHERE n.nspname = 'public'
ORDER BY function_category, p.proname;

-- ===============================================
-- 9. 권한 및 정책 분석
-- ===============================================

-- RLS (Row Level Security) 정책
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 테이블 권한
SELECT 
    table_schema,
    table_name,
    privilege_type,
    grantee,
    is_grantable
FROM information_schema.table_privileges 
WHERE table_schema = 'public'
ORDER BY table_name, grantee;

-- ===============================================
-- 10. 정리 권장사항 생성
-- ===============================================

-- 종합 정리 권장사항
DO $$
DECLARE
    total_size BIGINT;
    unused_indexes INTEGER;
    empty_documents INTEGER;
    duplicate_documents INTEGER;
BEGIN
    -- 전체 크기 확인
    SELECT pg_database_size(current_database()) INTO total_size;
    
    -- 사용되지 않는 인덱스 수
    SELECT COUNT(*) INTO unused_indexes FROM pg_stat_user_indexes WHERE idx_scan = 0;
    
    -- 빈 문서 수
    SELECT COUNT(*) INTO empty_documents FROM command_vectors 
    WHERE content IS NULL OR LENGTH(TRIM(content)) < 10;
    
    -- 중복 문서 수 (간단한 추정)
    SELECT COUNT(*) INTO duplicate_documents FROM (
        SELECT MD5(content), COUNT(*) 
        FROM command_vectors 
        WHERE content IS NOT NULL 
        GROUP BY MD5(content) 
        HAVING COUNT(*) > 1
    ) dups;
    
    RAISE NOTICE '📊 === Supabase 데이터베이스 분석 결과 ===';
    RAISE NOTICE '💾 전체 DB 크기: %', pg_size_pretty(total_size);
    RAISE NOTICE '🗑️ 사용되지 않는 인덱스: %개', unused_indexes;
    RAISE NOTICE '📝 빈 문서: %개', empty_documents;
    RAISE NOTICE '🔄 중복 문서 (추정): %개', duplicate_documents;
    
    IF total_size > 400 * 1024 * 1024 THEN -- 400MB 초과시
        RAISE NOTICE '⚠️ 무료 티어 제한(500MB) 근접 - 정리 권장';
    ELSE
        RAISE NOTICE '✅ 무료 티어 여유 공간 충분';
    END IF;
    
    IF unused_indexes > 0 THEN
        RAISE NOTICE '🔧 사용되지 않는 인덱스 %개 제거 권장', unused_indexes;
    END IF;
    
    IF empty_documents > 0 THEN
        RAISE NOTICE '🧹 빈 문서 %개 정리 권장', empty_documents;
    END IF;
    
    IF duplicate_documents > 0 THEN
        RAISE NOTICE '♻️ 중복 문서 정리로 공간 절약 가능', duplicate_documents;
    END IF;
    
    RAISE NOTICE '📋 상세 정리 스크립트는 cleanup-recommendations.sql 참고';
END $$;