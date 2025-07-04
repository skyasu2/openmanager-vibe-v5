/**
 * 🧹 Redis 정리 유틸리티 (VM 서버데이터 생성기 제거 후)
 *
 * VM 시스템 제거로 불필요해진 Redis 키들을 정리합니다.
 * - 서버데이터 스케줄러 관련 키들
 * - VM 시스템 관련 캐시 키들
 * - 더 이상 사용하지 않는 데이터 키들
 */

import { getRedisClient } from './redis';

// 🗑️ 제거 대상 키 패턴들 (VM 시스템 제거로 불필요)
const DEPRECATED_KEY_PATTERNS = [
    'server_data_scheduler:*',
    'vm_*',
    'unified_data_broker:server_*',
    'real_server_data_generator:*',
    'enhanced_metrics_generator:*',
    'vm_persistent_data:*',
    'baseline_continuity:*',
    'long_running_scenario:*',
];

// 🔧 안전하게 유지할 키 패턴들
const SAFE_KEY_PATTERNS = [
    'nlq:*',                    // 자연어 질의 캐시
    'google_ai:*',              // Google AI 쿼터 관리
    'system_state:*',           // 시스템 상태
    'user_activity:*',          // 사용자 활동
    'context:*',                // 컨텍스트 캐시
    'ai_analysis:*',            // AI 분석 결과
    'mcp:*',                    // MCP 관련
    'unified_context:*',        // 통합 컨텍스트
];

interface CleanupResult {
    deletedKeys: string[];
    preservedKeys: string[];
    totalDeleted: number;
    errorCount: number;
    errors: string[];
}

/**
 * 🧹 Redis 정리 실행
 */
export async function cleanupRedis(dryRun = true): Promise<CleanupResult> {
    const result: CleanupResult = {
        deletedKeys: [],
        preservedKeys: [],
        totalDeleted: 0,
        errorCount: 0,
        errors: [],
    };

    try {
        const redis = await getRedisClient('cleanup');
        if (!redis) {
            throw new Error('Redis 클라이언트를 가져올 수 없습니다');
        }

        console.log('🔍 Redis 키 스캔 시작...');

        // 1. 모든 키 패턴 조회 (실제 운영에서는 SCAN 사용 권장)
        const allKeys: string[] = [];

        for (const pattern of DEPRECATED_KEY_PATTERNS) {
            try {
                // Redis 구현에 따라 keys 또는 scan 사용
                const keys = await scanKeys(redis, pattern);
                allKeys.push(...keys);
            } catch (error) {
                result.errors.push(`패턴 ${pattern} 스캔 실패: ${error}`);
                result.errorCount++;
            }
        }

        console.log(`📋 발견된 키 개수: ${allKeys.length}`);

        // 2. 각 키 확인 및 정리
        for (const key of allKeys) {
            try {
                // 안전한 키인지 확인
                const isSafe = SAFE_KEY_PATTERNS.some(pattern =>
                    new RegExp(pattern.replace('*', '.*')).test(key)
                );

                if (isSafe) {
                    result.preservedKeys.push(key);
                    console.log(`✅ 보존: ${key}`);
                    continue;
                }

                // dry-run 모드가 아니면 실제 삭제
                if (!dryRun) {
                    const deleteCount = await redis.del(key);
                    if (deleteCount > 0) {
                        result.deletedKeys.push(key);
                        result.totalDeleted++;
                        console.log(`🗑️ 삭제: ${key}`);
                    }
                } else {
                    result.deletedKeys.push(key);
                    console.log(`🔍 삭제 예정: ${key}`);
                }

            } catch (error) {
                result.errors.push(`키 ${key} 처리 실패: ${error}`);
                result.errorCount++;
            }
        }

        console.log('✅ Redis 정리 완료');
        return result;

    } catch (error) {
        result.errors.push(`Redis 정리 실패: ${error}`);
        result.errorCount++;
        return result;
    }
}

/**
 * 🔍 키 패턴 스캔 (Redis 호환)
 */
async function scanKeys(redis: any, pattern: string): Promise<string[]> {
    const keys: string[] = [];

    try {
        // Redis 클라이언트 타입에 따라 다른 방법 사용
        if (typeof redis.keys === 'function') {
            // 단순 keys 명령어 (개발/테스트용)
            const result = await redis.keys(pattern);
            return Array.isArray(result) ? result : [];
        }

        if (typeof redis.scan === 'function') {
            // SCAN 명령어 사용 (프로덕션 권장)
            let cursor = 0;
            do {
                const result = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
                cursor = result[0];
                keys.push(...result[1]);
            } while (cursor !== 0);
        }

        return keys;
    } catch (error) {
        console.warn(`패턴 ${pattern} 스캔 실패:`, error);
        return [];
    }
}

/**
 * 📊 Redis 정리 리포트 생성
 */
export function generateCleanupReport(result: CleanupResult): string {
    const report = `
🧹 Redis 정리 리포트

📊 통계:
- 삭제된 키: ${result.totalDeleted}개
- 보존된 키: ${result.preservedKeys.length}개  
- 오류 발생: ${result.errorCount}개

🗑️ 삭제된 키들:
${result.deletedKeys.map(key => `  - ${key}`).join('\n')}

✅ 보존된 키들:
${result.preservedKeys.map(key => `  - ${key}`).join('\n')}

❌ 오류:
${result.errors.map(error => `  - ${error}`).join('\n')}
`;

    return report;
}

/**
 * 🔧 사용법 예시
 */
export async function runRedisCleanup() {
    console.log('🧹 Redis 정리 시작...');

    // 1. Dry-run으로 먼저 확인
    console.log('🔍 Dry-run 모드로 분석 중...');
    const dryRunResult = await cleanupRedis(true);
    console.log(generateCleanupReport(dryRunResult));

    // 2. 사용자 확인 후 실제 삭제 (수동으로 실행)
    // const realResult = await cleanupRedis(false);
    // console.log('✅ 실제 정리 완료:', generateCleanupReport(realResult));
} 