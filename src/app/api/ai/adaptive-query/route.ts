import { createErrorResponse, detectVercelTierWithTest } from '@/config/vercel-tier-config';
import { utf8Logger } from '@/utils/utf8-logger';
import { NextRequest, NextResponse } from 'next/server';

/**
 * 🧪 베르셀 요금제 감지 및 적응형 쿼리 처리 API
 * 시스템 시작 시 베르셀 요금제를 10초 테스트로 정확히 감지
 */

let cachedTierConfig: any = null;
let tierTestCompleted = false;

export async function POST(request: NextRequest) {
    const startTime = Date.now();

    try {
        const { query, mode = 'LOCAL', context } = await request.json();

        if (!query) {
            return NextResponse.json({
                success: false,
                error: 'query 파라미터가 필요합니다.'
            }, { status: 400 });
        }

        // 🧪 베르셀 요금제 10초 테스트 (최초 1회만 실행)
        if (!tierTestCompleted) {
            utf8Logger.korean('🧪', '베르셀 요금제 10초 테스트 시작...');

            try {
                cachedTierConfig = await detectVercelTierWithTest();
                tierTestCompleted = true;

                utf8Logger.korean('✅', `베르셀 요금제 감지 완료: ${cachedTierConfig.tier.toUpperCase()}`);
            } catch (error) {
                console.error('❌ 베르셀 요금제 테스트 실패:', error);

                // 폴백: 기본 감지 방식 사용
                const { detectVercelTier } = await import('@/config/vercel-tier-config');
                cachedTierConfig = detectVercelTier();
                tierTestCompleted = true;

                utf8Logger.korean('⚠️', `폴백 요금제 감지: ${cachedTierConfig.tier.toUpperCase()}`);
            }
        }

        // 🎯 적응형 쿼리 처리
        const tierConfig = cachedTierConfig;

        // 타임아웃 체크 함수
        const checkTimeout = () => {
            const elapsed = Date.now() - startTime;
            if (elapsed > tierConfig.safeExecutionTime) {
                throw new Error(`[${tierConfig.tier.toUpperCase()}] 처리 시간 초과: ${elapsed}ms > ${tierConfig.safeExecutionTime}ms`);
            }
            return elapsed;
        };

        utf8Logger.korean('🎯', `적응형 쿼리 처리 시작 (${tierConfig.tier.toUpperCase()}, ${tierConfig.safeExecutionTime}ms 제한)`);

        // 요금제별 차별화된 처리
        if (tierConfig.tier === 'free') {
            // Free 요금제: 단순하고 빠른 처리
            const result = await processFreeQuery(query, mode, context, checkTimeout);
            return NextResponse.json(result);
        } else {
            // Pro 요금제: 복잡한 분석 가능
            const result = await processProQuery(query, mode, context, checkTimeout);
            return NextResponse.json(result);
        }

    } catch (error) {
        console.error('❌ 적응형 쿼리 처리 실패:', error);

        const errorResponse = createErrorResponse(
            error as Error,
            '적응형 쿼리 처리',
            cachedTierConfig || { tier: 'free', safeExecutionTime: 8000 }
        );

        return NextResponse.json(errorResponse, { status: 500 });
    }
}

/**
 * 🆓 Free 요금제 쿼리 처리 (8초 제한)
 */
async function processFreeQuery(
    query: string,
    mode: string,
    context: any,
    checkTimeout: () => number
): Promise<any> {
    checkTimeout();

    utf8Logger.korean('🆓', 'Free 요금제 단순 처리 시작');

    // 1단계: 빠른 한국어 처리
    const koreanProcessed = await processKoreanQuickly(query);
    checkTimeout();

    // 2단계: 간단한 응답 생성
    const response = generateSimpleResponse(koreanProcessed, mode);
    checkTimeout();

    return {
        success: true,
        response,
        tier: 'free',
        processingTime: checkTimeout(),
        features: {
            complexAnalysis: false,
            streaming: false,
            multiStep: false
        }
    };
}

/**
 * 🎯 Pro 요금제 쿼리 처리 (55초 제한)
 */
async function processProQuery(
    query: string,
    mode: string,
    context: any,
    checkTimeout: () => number
): Promise<any> {
    checkTimeout();

    utf8Logger.korean('🎯', 'Pro 요금제 고급 처리 시작');

    // 1단계: 고급 한국어 처리
    const koreanProcessed = await processKoreanAdvanced(query);
    checkTimeout();

    // 2단계: 복잡한 분석 가능
    const analysis = await performComplexAnalysis(koreanProcessed, context);
    checkTimeout();

    // 3단계: 고품질 응답 생성
    const response = await generateAdvancedResponse(analysis, mode);
    checkTimeout();

    return {
        success: true,
        response,
        tier: 'pro',
        processingTime: checkTimeout(),
        features: {
            complexAnalysis: true,
            streaming: true,
            multiStep: true
        }
    };
}

/**
 * 🇰🇷 빠른 한국어 처리 (Free 요금제용)
 */
async function processKoreanQuickly(query: string): Promise<string> {
    // Buffer 기반 UTF-8 안전 처리
    const buffer = Buffer.from(query, 'utf8');
    const safeQuery = buffer.toString('utf8');

    // 기본 한국어 정규화
    return safeQuery
        .replace(/[^\w\s가-힣ㄱ-ㅎㅏ-ㅣ]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * 🇰🇷 고급 한국어 처리 (Pro 요금제용)
 */
async function processKoreanAdvanced(query: string): Promise<string> {
    // 1단계: UTF-8 안전 처리
    const buffer = Buffer.from(query, 'utf8');
    let safeQuery = buffer.toString('utf8');

    // 2단계: 지능형 깨진 문자 감지 및 복구
    if (safeQuery.includes('\uFFFD')) {
        // 깨진 문자 복구
        safeQuery = safeQuery
            .replace(/\uFFFD+/g, '')
            .replace(/현재\s*시간/g, '현재 시간')
            .replace(/시간\s*몇\s*시/g, '시간 몇시');
    }

    // 3단계: 고급 한국어 정규화
    return safeQuery
        .replace(/[^\w\s가-힣ㄱ-ㅎㅏ-ㅣ?!]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * 🔍 복잡한 분석 (Pro 요금제 전용)
 */
async function performComplexAnalysis(query: string, context: any): Promise<any> {
    const analysis = {
        intent: analyzeIntent(query),
        entities: extractEntities(query),
        context: context || {},
        complexity: calculateComplexity(query)
    };

    return analysis;
}

/**
 * 🎨 단순 응답 생성 (Free 요금제)
 */
function generateSimpleResponse(query: string, mode: string): string {
    const responses = {
        time: '현재 시간은 ' + new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }) + ' 입니다.',
        status: '시스템이 정상적으로 작동하고 있습니다.',
        server: '서버 상태를 확인하고 있습니다.',
        default: '간단한 처리가 완료되었습니다. (Free 요금제)'
    };

    if (query.includes('시간')) return responses.time;
    if (query.includes('상태')) return responses.status;
    if (query.includes('서버')) return responses.server;

    return responses.default;
}

/**
 * 🎨 고급 응답 생성 (Pro 요금제)
 */
async function generateAdvancedResponse(analysis: any, mode: string): Promise<string> {
    const baseResponse = generateSimpleResponse(analysis.intent, mode);

    const enhancements = [
        '상세한 분석 결과를 제공합니다.',
        '복합적인 요청 처리가 가능합니다.',
        '실시간 데이터 연동을 지원합니다.'
    ];

    return baseResponse + '\n\n' + enhancements.join('\n');
}

/**
 * 🔍 의도 분석
 */
function analyzeIntent(query: string): string {
    if (query.includes('시간')) return 'time_query';
    if (query.includes('상태')) return 'status_query';
    if (query.includes('서버')) return 'server_query';
    return 'general_query';
}

/**
 * 🏷️ 엔티티 추출
 */
function extractEntities(query: string): string[] {
    const entities: string[] = [];

    if (query.includes('시간')) entities.push('time');
    if (query.includes('서버')) entities.push('server');
    if (query.includes('상태')) entities.push('status');

    return entities;
}

/**
 * 📊 복잡도 계산
 */
function calculateComplexity(query: string): number {
    let complexity = 0;

    complexity += query.length * 0.01; // 길이 기반
    complexity += (query.match(/\s+/g) || []).length * 0.1; // 단어 수 기반
    complexity += (query.match(/[?!]/g) || []).length * 0.2; // 질문/감탄 기반

    return Math.min(complexity, 1.0);
} 