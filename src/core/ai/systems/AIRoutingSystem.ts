/**
 * 🔄 AI 라우팅 시스템 v2.0
 * 작성일: 2025-01-05 00:16:30 (KST)
 * 
 * UnifiedAIEngineRouter에서 분리된 모드별 라우팅 로직
 * TDD Green 단계 - AIRoutingSystem 모듈 분리
 */

import { AIMode, AIRequest } from '@/types/ai-types';
import { KoreanTimeUtil } from '@/utils/koreanTime';

// 🚀 베르셀 환경 감지 및 최적화 설정
const VERCEL_OPTIMIZATION = {
    isVercel: process.env.VERCEL === '1' || process.env.NODE_ENV === 'production',
    maxProcessingTime: 8000, // 8초 제한
    enableFastMode: true,
    cacheEnabled: true,
    simplifiedChain: true, // 엔진 체인 단순화
};

// 🎯 AI 모드 구성 인터페이스
interface AIModeConfig {
    name: AIMode;
    description: string;
    primaryEngine: string;
    fallbackEngines: string[];
    maxProcessingTime: number;
    priority: number;
    enableCache: boolean;
    optimizationLevel: 'low' | 'medium' | 'high';
}

// 🎯 AI 모드 구성 정의
const AI_MODE_CONFIGS: Record<AIMode, AIModeConfig> = {
    LOCAL: {
        name: 'LOCAL',
        description: 'Supabase RAG + MCP 컨텍스트 기반 로컬 AI',
        primaryEngine: 'supabase-rag',
        fallbackEngines: ['mcp-context', 'korean-ai', 'transformers'],
        maxProcessingTime: VERCEL_OPTIMIZATION.isVercel ? 8000 : 15000,
        priority: 80, // 80% 우선순위
        enableCache: true,
        optimizationLevel: 'high',
    },
    GOOGLE_AI: {
        name: 'GOOGLE_AI',
        description: 'Google AI + Supabase RAG + MCP 컨텍스트 조합',
        primaryEngine: 'google-ai',
        fallbackEngines: ['supabase-rag', 'mcp-context', 'korean-ai'],
        maxProcessingTime: VERCEL_OPTIMIZATION.isVercel ? 8000 : 20000,
        priority: 40, // 40% Google AI + 40% LOCAL + 20% 로컬AI
        enableCache: true,
        optimizationLevel: 'medium',
    },
    AUTO: {
        name: 'AUTO',
        description: '쿼리 분석에 따른 자동 모드 선택',
        primaryEngine: 'auto-selector',
        fallbackEngines: ['supabase-rag', 'google-ai', 'korean-ai'],
        maxProcessingTime: VERCEL_OPTIMIZATION.isVercel ? 8000 : 25000,
        priority: 50, // 동적 우선순위
        enableCache: true,
        optimizationLevel: 'medium',
    },
    GOOGLE_ONLY: {
        name: 'GOOGLE_ONLY',
        description: 'Google AI 전용 모드',
        primaryEngine: 'google-ai',
        fallbackEngines: ['transformers', 'korean-ai'],
        maxProcessingTime: VERCEL_OPTIMIZATION.isVercel ? 8000 : 10000,
        priority: 90, // 90% Google AI 우선
        enableCache: false, // 실시간 응답 우선
        optimizationLevel: 'low',
    },
};

/**
 * 🔄 AI 라우팅 시스템 
 * 
 * UnifiedAIEngineRouter에서 분리된 라우팅 로직:
 * - 모드별 라우팅 결정
 * - AUTO 모드 자동 선택
 * - 쿼리 분석 및 최적 모드 추천
 * - 모드 검증 및 정규화
 */
export class AIRoutingSystem {
    private currentMode: AIMode = 'LOCAL';
    private routingStats = {
        totalRoutes: 0,
        modeUsage: {
            LOCAL: 0,
            GOOGLE_AI: 0,
            AUTO: 0,
            GOOGLE_ONLY: 0,
        },
        lastUpdated: KoreanTimeUtil.now(),
    };

    constructor(initialMode: AIMode = 'LOCAL') {
        this.currentMode = initialMode;
        console.log(`🔄 AI 라우팅 시스템 초기화 (기본 모드: ${initialMode})`);
    }

    /**
     * 🎯 메인 라우팅 결정 메서드
     * @param request AI 요청
     * @returns 라우팅 정보 및 처리 모드
     */
    public routeRequest(request: AIRequest): {
        targetMode: AIMode;
        config: AIModeConfig;
        routingReason: string;
        processingStrategy: string;
    } {
        const startTime = Date.now();

        // 모드 검증 및 정규화
        const validatedMode = this.validateAndNormalizeMode(request.mode || 'LOCAL');

        // AUTO 모드인 경우 자동 선택
        const targetMode = validatedMode === 'AUTO'
            ? this.selectOptimalMode(request.query, request.context)
            : validatedMode;

        const config = AI_MODE_CONFIGS[targetMode];

        // 라우팅 통계 업데이트
        this.routingStats.totalRoutes++;
        this.routingStats.modeUsage[targetMode]++;
        this.routingStats.lastUpdated = KoreanTimeUtil.now();

        const processingTime = Date.now() - startTime;

        console.log(
            `🔄 라우팅 결정: ${request.mode || 'LOCAL'} → ${targetMode} (${processingTime}ms)`
        );

        return {
            targetMode,
            config,
            routingReason: this.generateRoutingReason(request, targetMode),
            processingStrategy: this.generateProcessingStrategy(targetMode, request),
        };
    }

    /**
     * 🤖 쿼리 분석에 따른 자동 모드 선택 (AUTO 모드)
     * @param query 사용자 쿼리
     * @param context 요청 컨텍스트
     * @returns 최적 AI 모드
     */
    public selectOptimalMode(query: string, context?: any): AIMode {
        // 한국어 쿼리 감지
        const isKorean = this.isKoreanQuery(query);

        // 복잡성 분석
        const complexity = this.analyzeQueryComplexity(query);

        // 실시간 데이터 요구 분석
        const needsRealtime = this.needsRealtimeData(query);

        // 기술적 쿼리 감지
        const isTechnical = this.isTechnicalQuery(query);

        let optimalMode: AIMode;

        if (needsRealtime || complexity === 'high') {
            // 실시간 데이터나 복잡한 쿼리는 Google AI 활용
            optimalMode = 'GOOGLE_AI';
        } else if (isTechnical || isKorean) {
            // 기술적이거나 한국어 쿼리는 LOCAL 모드 우선
            optimalMode = 'LOCAL';
        } else if (complexity === 'simple') {
            // 단순한 쿼리는 LOCAL 모드로 충분
            optimalMode = 'LOCAL';
        } else {
            // 기타 경우는 GOOGLE_AI 모드
            optimalMode = 'GOOGLE_AI';
        }

        console.log(
            `🤖 자동 모드 선택: ${optimalMode} (한국어: ${isKorean}, 복잡도: ${complexity}, 실시간: ${needsRealtime})`
        );

        return optimalMode;
    }

    /**
     * 🔍 모드 검증 및 정규화
     * @param mode 입력 모드
     * @returns 정규화된 모드
     */
    public validateAndNormalizeMode(mode: string): AIMode {
        const supportedModes: AIMode[] = ['LOCAL', 'GOOGLE_AI', 'AUTO', 'GOOGLE_ONLY'];

        // 레거시 모드 변환 맵
        const modeMap: Record<string, AIMode> = {
            'AUTO': 'AUTO',
            'GOOGLE_ONLY': 'GOOGLE_AI', // GOOGLE_ONLY는 GOOGLE_AI로 변환
            'LOCAL': 'LOCAL',
            'GOOGLE_AI': 'GOOGLE_AI',
        };

        const normalizedMode = modeMap[mode] || 'LOCAL';

        if (!supportedModes.includes(normalizedMode)) {
            console.warn(`⚠️ 지원되지 않는 AI 모드: ${mode}, LOCAL 모드로 폴백`);
            return 'LOCAL';
        }

        if (mode !== normalizedMode) {
            console.log(`🔄 AI 모드 변환: ${mode} → ${normalizedMode}`);
        }

        return normalizedMode;
    }

    /**
     * 🔍 한국어 쿼리 감지
     * @param query 쿼리 문자열
     * @returns 한국어 여부
     */
    private isKoreanQuery(query: string): boolean {
        const koreanRegex = /[ㄱ-ㅎㅏ-ㅣ가-힣]/;
        return koreanRegex.test(query);
    }

    /**
     * 📊 쿼리 복잡성 분석
     * @param query 쿼리 문자열
     * @returns 복잡성 수준
     */
    private analyzeQueryComplexity(query: string): 'simple' | 'medium' | 'high' {
        const wordCount = query.trim().split(/\s+/).length;
        const hasSpecialTerms = /분석|예측|모니터링|최적화|알고리즘|머신러닝|딥러닝/.test(query);
        const hasMultipleClauses = /그리고|그런데|하지만|그래서|따라서|또한/.test(query);

        if (wordCount > 20 || hasSpecialTerms || hasMultipleClauses) {
            return 'high';
        } else if (wordCount > 10 || /어떻게|왜|무엇|어디/.test(query)) {
            return 'medium';
        } else {
            return 'simple';
        }
    }

    /**
     * ⏰ 실시간 데이터 요구 분석
     * @param query 쿼리 문자열
     * @returns 실시간 데이터 필요 여부
     */
    private needsRealtimeData(query: string): boolean {
        const realtimeKeywords = /현재|지금|실시간|최신|오늘|실행중|상태|모니터링|라이브/;
        return realtimeKeywords.test(query);
    }

    /**
     * 🔧 기술적 쿼리 감지
     * @param query 쿼리 문자열
     * @returns 기술적 쿼리 여부
     */
    private isTechnicalQuery(query: string): boolean {
        const technicalKeywords = /서버|API|데이터베이스|코드|프로그래밍|배포|로그|에러|버그|성능|메모리|CPU/;
        return technicalKeywords.test(query);
    }

    /**
     * 📝 라우팅 이유 생성
     * @param request 요청
     * @param targetMode 선택된 모드
     * @returns 라우팅 이유
     */
    private generateRoutingReason(request: AIRequest, targetMode: AIMode): string {
        const isKorean = this.isKoreanQuery(request.query);
        const complexity = this.analyzeQueryComplexity(request.query);
        const needsRealtime = this.needsRealtimeData(request.query);
        const isTechnical = this.isTechnicalQuery(request.query);

        const reasons = [];

        if (isKorean) reasons.push('한국어 쿼리');
        if (isTechnical) reasons.push('기술적 내용');
        if (needsRealtime) reasons.push('실시간 데이터 필요');
        if (complexity === 'high') reasons.push('복잡한 쿼리');

        return reasons.length > 0
            ? `${targetMode} 모드 선택 이유: ${reasons.join(', ')}`
            : `${targetMode} 모드 기본 처리`;
    }

    /**
     * 🎯 처리 전략 생성
     * @param mode 처리 모드
     * @param request 요청
     * @returns 처리 전략
     */
    private generateProcessingStrategy(mode: AIMode, request: AIRequest): string {
        const config = AI_MODE_CONFIGS[mode];

        return `주요 엔진: ${config.primaryEngine}, 폴백: [${config.fallbackEngines.join(', ')}], 타임아웃: ${config.maxProcessingTime}ms`;
    }

    // 🎛️ 상태 관리 메서드들

    public setMode(mode: AIMode): void {
        const oldMode = this.currentMode;
        this.currentMode = this.validateAndNormalizeMode(mode);
        console.log(`🔄 라우팅 모드 변경: ${oldMode} → ${this.currentMode}`);
    }

    public getCurrentMode(): AIMode {
        return this.currentMode;
    }

    public getModeConfig(mode?: AIMode): AIModeConfig {
        return AI_MODE_CONFIGS[mode || this.currentMode];
    }

    public getRoutingStats() {
        return {
            ...this.routingStats,
            lastUpdated: KoreanTimeUtil.now(),
        };
    }

    public resetStats(): void {
        this.routingStats = {
            totalRoutes: 0,
            modeUsage: {
                LOCAL: 0,
                GOOGLE_AI: 0,
                AUTO: 0,
                GOOGLE_ONLY: 0,
            },
            lastUpdated: KoreanTimeUtil.now(),
        };
        console.log('🔄 라우팅 통계 초기화 완료');
    }
} 