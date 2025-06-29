/**
 * 🚀 베르셀 환경 최적화 AI 전략
 * 
 * 쿼리 복잡도에 따른 적응형 처리:
 * - 단순 쿼리: 즉시 응답 (2초 내)
 * - 복잡 쿼리: 스트리밍 응답 (3단계 × 8초)
 * - 매우 복잡: 다단계 스트리밍 (분할 처리)
 */

import { utf8Logger } from '@/utils/utf8-logger';

export interface VercelOptimizedRequest {
    query: string;
    mode: 'LOCAL' | 'GOOGLE_AI' | 'AUTO';
    context?: any;
    preferredStrategy?: 'fast' | 'streaming' | 'auto';
}

export interface VercelOptimizedResponse {
    strategy: 'fast' | 'streaming';
    success: boolean;
    response?: string;
    streamId?: string;
    estimatedTime: number;
    processingTime: number;
    qualityScore: number;
}

export interface QueryComplexity {
    level: 'simple' | 'medium' | 'complex' | 'very_complex';
    score: number;
    factors: string[];
    estimatedTime: number;
    recommendedStrategy: 'fast' | 'streaming';
}

export class VercelOptimizedStrategy {
    private static instance: VercelOptimizedStrategy;
    private readonly VERCEL_TIMEOUT = 8000; // 8초 안전 제한
    private readonly STREAMING_CHUNK_SIZE = 8000; // 8초 청크
    private readonly MAX_STREAM_CHUNKS = 3; // 최대 3청크 (24초)

    private constructor() { }

    public static getInstance(): VercelOptimizedStrategy {
        if (!VercelOptimizedStrategy.instance) {
            VercelOptimizedStrategy.instance = new VercelOptimizedStrategy();
        }
        return VercelOptimizedStrategy.instance;
    }

    /**
     * 🧠 쿼리 복잡도 분석
     */
    public analyzeQueryComplexity(query: string): QueryComplexity {
        let score = 0;
        const factors: string[] = [];

        // 1. 길이 분석 (가중치: 30%)
        if (query.length > 100) {
            score += 30;
            factors.push('긴 쿼리');
        } else if (query.length > 50) {
            score += 15;
            factors.push('중간 길이 쿼리');
        }

        // 2. 복잡한 키워드 분석 (가중치: 40%)
        const complexKeywords = [
            '분석', '상세히', '단계별', '종합적', '근본원인',
            '해결방안', '비교', '평가', '추천', '최적화',
            '모니터링', '장애', '복구', '예방', '설계'
        ];

        const foundComplexKeywords = complexKeywords.filter(keyword =>
            query.includes(keyword)
        );

        if (foundComplexKeywords.length >= 3) {
            score += 40;
            factors.push(`복잡한 분석 요구 (${foundComplexKeywords.length}개)`);
        } else if (foundComplexKeywords.length >= 1) {
            score += 20;
            factors.push(`분석 요구 (${foundComplexKeywords.length}개)`);
        }

        // 3. 다중 조건 분석 (가중치: 20%)
        const conditions = query.split(/그리고|또한|동시에|함께|및/).length;
        if (conditions >= 3) {
            score += 20;
            factors.push(`다중 조건 (${conditions}개)`);
        } else if (conditions >= 2) {
            score += 10;
            factors.push(`복수 조건 (${conditions}개)`);
        }

        // 4. 기술적 복잡도 (가중치: 10%)
        const technicalTerms = [
            'CPU', '메모리', '디스크', '네트워크', 'API', 'DB',
            '아키텍처', '인프라', '클라우드', '배포', 'CI/CD'
        ];

        const foundTechnicalTerms = technicalTerms.filter(term =>
            query.includes(term)
        );

        if (foundTechnicalTerms.length >= 2) {
            score += 10;
            factors.push(`기술적 용어 (${foundTechnicalTerms.length}개)`);
        }

        // 복잡도 레벨 결정
        let level: QueryComplexity['level'];
        let estimatedTime: number;
        let recommendedStrategy: 'fast' | 'streaming';

        if (score >= 70) {
            level = 'very_complex';
            estimatedTime = 24000; // 24초 (3청크)
            recommendedStrategy = 'streaming';
        } else if (score >= 40) {
            level = 'complex';
            estimatedTime = 16000; // 16초 (2청크)
            recommendedStrategy = 'streaming';
        } else if (score >= 20) {
            level = 'medium';
            estimatedTime = 8000; // 8초 (1청크 또는 빠른 처리)
            recommendedStrategy = 'fast';
        } else {
            level = 'simple';
            estimatedTime = 3000; // 3초
            recommendedStrategy = 'fast';
        }

        utf8Logger.korean('🧠',
            `쿼리 복잡도 분석: ${level} (점수: ${score}, 예상시간: ${estimatedTime}ms)`
        );

        return {
            level,
            score,
            factors,
            estimatedTime,
            recommendedStrategy
        };
    }

    /**
     * 🎯 최적 전략 선택
     */
    public selectOptimalStrategy(
        request: VercelOptimizedRequest
    ): 'fast' | 'streaming' {
        // 사용자 명시적 선택
        if (request.preferredStrategy && request.preferredStrategy !== 'auto') {
            return request.preferredStrategy;
        }

        // 복잡도 기반 자동 선택
        const complexity = this.analyzeQueryComplexity(request.query);

        // 베르셀 환경에서는 보수적 접근
        const isVercel = process.env.VERCEL === '1';
        if (isVercel && complexity.level === 'medium') {
            // 베르셀에서는 medium도 fast로 처리
            return 'fast';
        }

        return complexity.recommendedStrategy;
    }

    /**
     * ⚡ 빠른 응답 전략 (8초 이내 완료)
     */
    public async executeFastStrategy(
        request: VercelOptimizedRequest
    ): Promise<VercelOptimizedResponse> {
        const startTime = Date.now();

        try {
            utf8Logger.korean('⚡', `빠른 응답 전략 시작: "${request.query}"`);

            // 3단계 폴백 시스템
            const result = await this.executeThreeTierFallback(request);

            const processingTime = Date.now() - startTime;
            const qualityScore = this.calculateQualityScore(result.response, processingTime);

            return {
                strategy: 'fast',
                success: true,
                response: result.response,
                estimatedTime: processingTime,
                processingTime,
                qualityScore
            };
        } catch (error) {
            utf8Logger.error('빠른 응답 전략 실패:', error);

            return {
                strategy: 'fast',
                success: false,
                response: '요청 처리 중 오류가 발생했습니다. 다시 시도해주세요.',
                estimatedTime: this.VERCEL_TIMEOUT,
                processingTime: Date.now() - startTime,
                qualityScore: 0.2
            };
        }
    }

    /**
     * 🔄 스트리밍 응답 전략 (최대 24초)
     */
    public async executeStreamingStrategy(
        request: VercelOptimizedRequest
    ): Promise<VercelOptimizedResponse> {
        const startTime = Date.now();
        const streamId = `stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        try {
            utf8Logger.korean('🔄', `스트리밍 전략 시작: "${request.query}"`);

            const complexity = this.analyzeQueryComplexity(request.query);
            const requiredChunks = Math.min(
                Math.ceil(complexity.estimatedTime / this.STREAMING_CHUNK_SIZE),
                this.MAX_STREAM_CHUNKS
            );

            // 스트리밍 처리 시작 (실제 구현은 별도 API에서)
            this.initializeStreaming(streamId, request, requiredChunks);

            const processingTime = Date.now() - startTime;

            return {
                strategy: 'streaming',
                success: true,
                streamId,
                estimatedTime: requiredChunks * this.STREAMING_CHUNK_SIZE,
                processingTime,
                qualityScore: 0.9 // 스트리밍은 높은 품질 기대
            };
        } catch (error) {
            utf8Logger.error('스트리밍 전략 실패:', error);

            return {
                strategy: 'streaming',
                success: false,
                response: '스트리밍 처리 중 오류가 발생했습니다.',
                estimatedTime: this.STREAMING_CHUNK_SIZE,
                processingTime: Date.now() - startTime,
                qualityScore: 0.1
            };
        }
    }

    /**
     * 🛡️ 3단계 폴백 시스템
     */
    private async executeThreeTierFallback(
        request: VercelOptimizedRequest
    ): Promise<{ response: string }> {
        // 실제 구현은 기존 UnifiedAIEngineRouter 활용
        // 여기서는 인터페이스만 정의

        const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('베르셀 타임아웃')), this.VERCEL_TIMEOUT);
        });

        const processingPromise = this.performActualProcessing(request);

        try {
            const result = await Promise.race([processingPromise, timeoutPromise]);
            return result;
        } catch (error) {
            // 최종 폴백
            return {
                response: `"${request.query}"에 대한 기본 응답을 제공합니다. 더 상세한 분석이 필요하시면 스트리밍 모드를 시도해보세요.`
            };
        }
    }

    /**
     * 🎯 실제 AI 처리 (기존 엔진 활용)
     */
    private async performActualProcessing(
        request: VercelOptimizedRequest
    ): Promise<{ response: string }> {
        // 기존 UnifiedAIEngineRouter.processQuery 호출
        // 실제 구현에서는 의존성 주입으로 처리
        return {
            response: `${request.query}에 대한 AI 분석 결과입니다.`
        };
    }

    /**
     * 🔄 스트리밍 초기화
     */
    private initializeStreaming(
        streamId: string,
        request: VercelOptimizedRequest,
        chunks: number
    ): void {
        // 스트리밍 상태 관리 (Redis 또는 메모리)
        utf8Logger.korean('🔄',
            `스트리밍 초기화: ID=${streamId}, 청크=${chunks}개`
        );
    }

    /**
     * 📊 품질 점수 계산
     */
    private calculateQualityScore(response: string, processingTime: number): number {
        let score = 0.5; // 기본 점수

        // 응답 길이 기반 점수
        if (response.length > 200) score += 0.2;
        if (response.length > 500) score += 0.1;

        // 처리 시간 기반 점수
        if (processingTime < 2000) score += 0.1;
        if (processingTime > 6000) score -= 0.1;

        // 구조화된 응답인지 확인
        if (response.includes('단계') || response.includes('분석') || response.includes('권장')) {
            score += 0.1;
        }

        return Math.max(0, Math.min(1, score));
    }

    /**
     * 📈 성능 통계
     */
    public getPerformanceStats(): {
        fastRequests: number;
        streamingRequests: number;
        averageQuality: number;
        averageResponseTime: number;
    } {
        // 실제 구현에서는 통계 데이터 수집
        return {
            fastRequests: 0,
            streamingRequests: 0,
            averageQuality: 0.8,
            averageResponseTime: 3500
        };
    }
} 