/**
 * 🧹 Supabase 정리 유틸리티 (VM 서버데이터 생성기 제거 후)
 *
 * VM 시스템 제거로 불필요해진 Supabase 테이블들과 데이터를 정리합니다.
 * - 사용하지 않는 테이블 확인
 * - 오래된 메트릭 데이터 정리  
 * - 더 이상 사용하지 않는 컬럼 식별
 */

import { supabaseAdmin } from './supabase';

// 🔍 활성 사용 테이블들 (유지 필요)
const ACTIVE_TABLES = [
    'server_metrics',              // 서버 메트릭 저장
    'ai_analysis',                 // AI 분석 결과
    'ai_embeddings',               // AI 벡터 임베딩
    'document_embeddings',         // 문서 벡터 임베딩  
    'context_embeddings',          // 컨텍스트 벡터 임베딩
    'encrypted_environment_vars',  // 암호화된 환경변수
];

// ❓ 확인 필요한 테이블들 (사용 여부 불분명)
const UNCERTAIN_TABLES = [
    'organization_settings',       // 조직 설정
    'custom_rules',               // 커스텀 규칙
    'user_profiles',              // 사용자 프로필
    'server_metrics_timeseries',  // 시계열 데이터
];

// 🗑️ 삭제 고려 테이블들 (VM 관련)
const DEPRECATED_TABLES = [
    'vm_server_metrics',          // VM 서버 메트릭
    'baseline_data',              // 베이스라인 데이터
    'enriched_metrics',           // 강화된 메트릭
    'persistent_scenarios',       // 지속적 시나리오
];

interface TableAnalysis {
    name: string;
    exists: boolean;
    rowCount: number;
    lastUpdated: string | null;
    sizeEstimate: string;
    status: 'active' | 'unused' | 'uncertain' | 'deprecated';
}

interface CleanupPlan {
    keepTables: TableAnalysis[];
    removeTables: TableAnalysis[];
    uncertainTables: TableAnalysis[];
    oldDataCleanup: {
        table: string;
        oldDataCount: number;
        cutoffDate: string;
    }[];
}

/**
 * 🔍 Supabase 테이블 분석
 */
export async function analyzeSupabaseTables(): Promise<CleanupPlan> {
    const plan: CleanupPlan = {
        keepTables: [],
        removeTables: [],
        uncertainTables: [],
        oldDataCleanup: [],
    };

    try {
        console.log('🔍 Supabase 테이블 분석 시작...');

        // 1. 모든 테이블 목록 조회
        const { data: tables } = await supabaseAdmin
            .from('information_schema.tables')
            .select('table_name')
            .eq('table_schema', 'public')
            .eq('table_type', 'BASE TABLE');

        if (!tables) {
            throw new Error('테이블 목록을 가져올 수 없습니다');
        }

        console.log(`📋 발견된 테이블: ${tables.length}개`);

        // 2. 각 테이블 분석
        for (const table of tables) {
            const tableName = table.table_name;
            const analysis = await analyzeTable(tableName);

            if (ACTIVE_TABLES.includes(tableName)) {
                analysis.status = 'active';
                plan.keepTables.push(analysis);
            } else if (UNCERTAIN_TABLES.includes(tableName)) {
                analysis.status = 'uncertain';
                plan.uncertainTables.push(analysis);
            } else if (DEPRECATED_TABLES.includes(tableName)) {
                analysis.status = 'deprecated';
                plan.removeTables.push(analysis);
            } else {
                // 새로 발견된 테이블 - 사용 패턴으로 판단
                analysis.status = analysis.rowCount === 0 ? 'unused' : 'uncertain';
                plan.uncertainTables.push(analysis);
            }
        }

        // 3. 오래된 데이터 정리 계획
        for (const tableName of ACTIVE_TABLES) {
            const oldDataAnalysis = await analyzeOldData(tableName);
            if (oldDataAnalysis.oldDataCount > 0) {
                plan.oldDataCleanup.push(oldDataAnalysis);
            }
        }

        console.log('✅ Supabase 분석 완료');
        return plan;

    } catch (error) {
        console.error('❌ Supabase 분석 실패:', error);
        throw error;
    }
}

/**
 * 🔍 개별 테이블 분석
 */
async function analyzeTable(tableName: string): Promise<TableAnalysis> {
    const analysis: TableAnalysis = {
        name: tableName,
        exists: false,
        rowCount: 0,
        lastUpdated: null,
        sizeEstimate: '0 KB',
        status: 'uncertain',
    };

    try {
        // 테이블 존재 확인 및 행 개수
        const { count, error } = await supabaseAdmin
            .from(tableName)
            .select('*', { count: 'exact', head: true });

        if (!error) {
            analysis.exists = true;
            analysis.rowCount = count || 0;
        }

        // 최근 업데이트 시간 확인 (created_at 또는 updated_at 컬럼이 있는 경우)
        try {
            const { data: recentData } = await supabaseAdmin
                .from(tableName)
                .select('updated_at, created_at')
                .order('updated_at', { ascending: false })
                .limit(1)
                .single();

            if (recentData) {
                analysis.lastUpdated = recentData.updated_at || recentData.created_at;
            }
        } catch {
            // updated_at 컬럼이 없는 테이블은 무시
        }

        // 크기 추정 (PostgreSQL 시스템 테이블 활용)
        try {
            const { data: sizeData } = await supabaseAdmin.rpc('get_table_size', {
                table_name: tableName
            });

            if (sizeData) {
                analysis.sizeEstimate = sizeData;
            }
        } catch {
            // 크기 조회 실패 시 행 수로 추정
            const estimatedKB = Math.ceil(analysis.rowCount * 0.5); // 행당 0.5KB 추정
            analysis.sizeEstimate = `~${estimatedKB} KB`;
        }

    } catch (error) {
        console.warn(`테이블 ${tableName} 분석 실패:`, error);
    }

    return analysis;
}

/**
 * 📅 오래된 데이터 분석 (30일 이상)
 */
async function analyzeOldData(tableName: string): Promise<{
    table: string;
    oldDataCount: number;
    cutoffDate: string;
}> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30); // 30일 전
    const cutoffString = cutoffDate.toISOString();

    try {
        const { count } = await supabaseAdmin
            .from(tableName)
            .select('*', { count: 'exact', head: true })
            .lt('created_at', cutoffString);

        return {
            table: tableName,
            oldDataCount: count || 0,
            cutoffDate: cutoffString,
        };
    } catch {
        return {
            table: tableName,
            oldDataCount: 0,
            cutoffDate: cutoffString,
        };
    }
}

/**
 * 🧹 실제 정리 실행 (신중하게!)
 */
export async function executeSupabaseCleanup(plan: CleanupPlan, dryRun = true): Promise<void> {
    console.log(`🧹 Supabase 정리 시작 (Dry-run: ${dryRun})`);

    // 1. 테이블 제거 (매우 신중하게!)
    for (const table of plan.removeTables) {
        if (table.status === 'deprecated' && table.rowCount === 0) {
            console.log(`🗑️ ${dryRun ? '삭제 예정' : '삭제'}: ${table.name} (${table.rowCount}행)`);

            if (!dryRun) {
                try {
                    // 실제 프로덕션에서는 백업 후 삭제 권장
                    await supabaseAdmin.rpc('drop_table_safely', { table_name: table.name });
                } catch (error) {
                    console.error(`테이블 ${table.name} 삭제 실패:`, error);
                }
            }
        }
    }

    // 2. 오래된 데이터 정리
    for (const cleanup of plan.oldDataCleanup) {
        if (cleanup.oldDataCount > 1000) { // 1000개 이상인 경우만
            console.log(`📅 ${dryRun ? '정리 예정' : '정리'}: ${cleanup.table} - ${cleanup.oldDataCount}개 오래된 데이터`);

            if (!dryRun) {
                try {
                    await supabaseAdmin
                        .from(cleanup.table)
                        .delete()
                        .lt('created_at', cleanup.cutoffDate);
                } catch (error) {
                    console.error(`${cleanup.table} 오래된 데이터 정리 실패:`, error);
                }
            }
        }
    }
}

/**
 * 📊 정리 계획 리포트 생성
 */
export function generateSupabaseReport(plan: CleanupPlan): string {
    const report = `
🧹 Supabase 정리 계획 리포트

📊 테이블 현황:
- 활성 테이블 (유지): ${plan.keepTables.length}개
- 확인 필요 테이블: ${plan.uncertainTables.length}개  
- 제거 대상 테이블: ${plan.removeTables.length}개

✅ 유지할 테이블:
${plan.keepTables.map(t => `  - ${t.name}: ${t.rowCount}행, ${t.sizeEstimate}`).join('\n')}

❓ 확인 필요 테이블:
${plan.uncertainTables.map(t => `  - ${t.name}: ${t.rowCount}행, 최근 업데이트: ${t.lastUpdated || '알 수 없음'}`).join('\n')}

🗑️ 제거 고려 테이블:
${plan.removeTables.map(t => `  - ${t.name}: ${t.rowCount}행`).join('\n')}

📅 오래된 데이터 정리:
${plan.oldDataCleanup.map(c => `  - ${c.table}: ${c.oldDataCount}개 (${c.cutoffDate} 이전)`).join('\n')}
`;

    return report;
}

/**
 * 🔧 Supabase 정리 실행 함수
 */
export async function runSupabaseCleanup() {
    console.log('🔍 Supabase 분석 시작...');

    try {
        const plan = await analyzeSupabaseTables();
        console.log(generateSupabaseReport(plan));

        // Dry-run으로 먼저 확인
        console.log('\n🔍 Dry-run 정리 시뮬레이션...');
        await executeSupabaseCleanup(plan, true);

        console.log('\n⚠️ 실제 정리를 원한다면 executeSupabaseCleanup(plan, false)를 수동으로 실행하세요.');

    } catch (error) {
        console.error('❌ Supabase 정리 실패:', error);
    }
} 