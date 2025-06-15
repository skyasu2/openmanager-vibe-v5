/**
 * 🔍 독립 RAG (Retrieval-Augmented Generation) Engine
 * 
 * 완전히 독립적으로 동작하는 RAG 시스템:
 * - 벡터 데이터베이스 + 코사인 유사도 검색
 * - 한국어 특화 NLP 처리
 * - ML Tools 통합 (이상 탐지, 예측, 패턴 분석)
 * - 독립 캐싱 시스템
 * - 실시간 헬스체크
 */

import { LocalRAGEngine, RAGDocument, RAGQuery, RAGResponse } from '@/lib/ml/rag-engine';
import { UnifiedMLToolkit } from '@/lib/ml/UnifiedMLToolkit';

export interface RAGEngineConfig {
    vectorDimensions: number;
    cacheSize: number;
    defaultThreshold: number;
    enableKoreanNLP: boolean;
    enableMLTools: boolean;
}

export interface RAGEngineStats {
    totalDocuments: number;
    totalEmbeddings: number;
    cacheHitRate: number;
    averageResponseTime: number;
    isHealthy: boolean;
    lastHealthCheck: string;
}

export interface RAGSearchResult {
    success: boolean;
    query: string;
    results: Array<{
        id: string;
        content: string;
        score: number;
        relevance: number;
        category: string;
    }>;
    response: string;
    confidence: number;
    suggestions: string[];
    processingTime: number;
    source: 'rag-engine';
}

export class RAGEngine {
    private localRAG: LocalRAGEngine;
    private mlToolkit: UnifiedMLToolkit;
    private config: RAGEngineConfig;
    private cache: Map<string, any> = new Map();
    private stats: RAGEngineStats;
    private initialized: boolean = false;
    private healthCheckInterval: NodeJS.Timeout | null = null;

    constructor(config?: Partial<RAGEngineConfig>) {
        this.config = {
            vectorDimensions: 384,
            cacheSize: 1000,
            defaultThreshold: 0.3,
            enableKoreanNLP: true,
            enableMLTools: true,
            ...config,
        };

        this.localRAG = new LocalRAGEngine();
        this.mlToolkit = new UnifiedMLToolkit();

        this.stats = {
            totalDocuments: 0,
            totalEmbeddings: 0,
            cacheHitRate: 0,
            averageResponseTime: 0,
            isHealthy: false,
            lastHealthCheck: new Date().toISOString(),
        };

        console.log('🔍 독립 RAG Engine 생성됨');
    }

    /**
     * 🚀 RAG Engine 초기화
     */
    public async initialize(): Promise<void> {
        if (this.initialized) return;

        try {
            console.log('🚀 독립 RAG Engine 초기화 시작...');

            // LocalRAG 초기화
            await this.localRAG.initialize();

            // ML Toolkit 초기화
            if (this.config.enableMLTools) {
                await this.mlToolkit.initialize();
            }

            // 기본 문서 로드
            await this.loadSystemDocuments();

            // 헬스체크 시작
            this.startHealthCheck();

            this.initialized = true;
            this.stats.isHealthy = true;
            this.stats.lastHealthCheck = new Date().toISOString();

            console.log('✅ 독립 RAG Engine 초기화 완료');
            console.log(`📊 로드된 문서: ${this.stats.totalDocuments}개`);
        } catch (error) {
            console.error('❌ 독립 RAG Engine 초기화 실패:', error);
            this.stats.isHealthy = false;
            throw error;
        }
    }

    /**
     * 🔍 통합 검색 (벡터 + ML 분석)
     */
    public async search(query: string, options?: {
        maxResults?: number;
        threshold?: number;
        category?: string;
        enableMLAnalysis?: boolean;
    }): Promise<RAGSearchResult> {
        const startTime = Date.now();

        try {
            if (!this.initialized) {
                await this.initialize();
            }

            // 캐시 확인
            const cacheKey = this.generateCacheKey(query, options);
            if (this.cache.has(cacheKey)) {
                console.log('💾 캐시에서 결과 반환');
                return this.cache.get(cacheKey);
            }

            // RAG 검색 수행
            const ragQuery: RAGQuery = {
                query,
                maxResults: options?.maxResults || 10,
                threshold: options?.threshold || this.config.defaultThreshold,
                category: options?.category,
            };

            const ragResponse = await this.localRAG.search(ragQuery);

            // ML 분석 추가 (옵션)
            let enhancedResults = ragResponse.results;
            if (options?.enableMLAnalysis && this.config.enableMLTools) {
                enhancedResults = await this.enhanceWithMLAnalysis(ragResponse.results, query);
            }

            // 결과 포맷팅
            const result: RAGSearchResult = {
                success: ragResponse.success,
                query: ragResponse.query,
                results: enhancedResults.map(r => ({
                    id: r.document.id,
                    content: r.document.content,
                    score: r.score,
                    relevance: r.relevance,
                    category: r.document.metadata.category,
                })),
                response: ragResponse.response || '관련 정보를 찾았습니다.',
                confidence: ragResponse.confidence || 0.7,
                suggestions: ragResponse.suggestions || [],
                processingTime: Date.now() - startTime,
                source: 'rag-engine',
            };

            // 캐시 저장
            this.updateCache(cacheKey, result);

            // 통계 업데이트
            this.updateStats(Date.now() - startTime);

            return result;
        } catch (error) {
            console.error('❌ RAG 검색 실패:', error);

            return {
                success: false,
                query,
                results: [],
                response: '검색 중 오류가 발생했습니다.',
                confidence: 0,
                suggestions: [],
                processingTime: Date.now() - startTime,
                source: 'rag-engine',
            };
        }
    }

    /**
     * 📄 문서 추가
     */
    public async addDocument(document: RAGDocument): Promise<void> {
        try {
            await this.localRAG.addDocument(document);
            this.stats.totalDocuments++;
            this.stats.totalEmbeddings++;

            console.log(`📄 문서 추가됨: ${document.id}`);
        } catch (error) {
            console.error('❌ 문서 추가 실패:', error);
            throw error;
        }
    }

    /**
 * 🧠 ML 분석으로 결과 향상
 */
    private async enhanceWithMLAnalysis(
        results: any[],
        query: string
    ): Promise<any[]> {
        try {
            // ML Toolkit으로 통합 분석 수행
            const mlAnalysis = await this.mlToolkit.analyzeQuery(query, {
                mcpResult: results.map(r => r.score),
                context: 'search_results'
            });

            // 이상 탐지 결과로 점수 조정
            const anomalyScores = results.map((result, index) => {
                const hasAnomaly = mlAnalysis.anomalies.some(a => a.score > 0.7);
                return hasAnomaly ? 0.8 : 1.0; // 이상한 결과는 점수 약간 감소
            });

            // 패턴 분석 결과로 가중치 적용
            const patternWeight = mlAnalysis.patterns.length > 0 ?
                mlAnalysis.patterns[0].confidence : 1.0;

            // 향상된 결과 생성
            return results.map((result, index) => ({
                ...result,
                score: result.score * anomalyScores[index] * patternWeight,
                relevance: result.relevance * anomalyScores[index],
            })).sort((a, b) => b.score - a.score);
        } catch (error) {
            console.warn('⚠️ ML 분석 실패, 원본 결과 반환:', error);
            return results;
        }
    }

    /**
     * 📚 시스템 문서 로드
     */
    private async loadSystemDocuments(): Promise<void> {
        const systemDocs: RAGDocument[] = [
            {
                id: 'openmanager-overview',
                content: 'OpenManager Vibe v5는 AI 기반 서버 모니터링 시스템입니다. 실시간 성능 모니터링, AI 예측 분석, 자동화된 장애 대응 기능을 제공합니다.',
                metadata: {
                    source: 'system-docs',
                    timestamp: new Date().toISOString(),
                    category: 'overview',
                    tags: ['openmanager', 'monitoring', 'ai'],
                    priority: 10,
                },
            },
            {
                id: 'ai-engine-architecture',
                content: 'OpenManager의 AI 엔진은 MCP Engine과 RAG Engine의 이중 코어 구조로 설계되었습니다. 각 엔진은 독립적으로 동작하며 Google AI와 연동 가능합니다.',
                metadata: {
                    source: 'technical-docs',
                    timestamp: new Date().toISOString(),
                    category: 'architecture',
                    tags: ['ai', 'engine', 'architecture'],
                    priority: 9,
                },
            },
            {
                id: 'performance-optimization',
                content: '성능 최적화를 위해 CPU 사용률 80% 이하, 메모리 사용률 85% 이하, 디스크 I/O 70% 이하를 유지하는 것이 권장됩니다. 실시간 모니터링으로 임계값 초과 시 자동 알림을 받을 수 있습니다.',
                metadata: {
                    source: 'performance-guide',
                    timestamp: new Date().toISOString(),
                    category: 'performance',
                    tags: ['performance', 'optimization', 'monitoring'],
                    priority: 8,
                },
            },
            {
                id: 'troubleshooting-guide',
                content: '일반적인 문제 해결 방법: 1) 서비스 재시작, 2) 로그 파인 확인, 3) 리소스 사용률 점검, 4) 네트워크 연결 상태 확인, 5) AI 분석 결과 검토',
                metadata: {
                    source: 'troubleshooting-docs',
                    timestamp: new Date().toISOString(),
                    category: 'troubleshooting',
                    tags: ['troubleshooting', 'problems', 'solutions'],
                    priority: 7,
                },
            },
        ];

        for (const doc of systemDocs) {
            await this.addDocument(doc);
        }

        console.log(`📚 시스템 문서 ${systemDocs.length}개 로드 완료`);
    }

    /**
     * 💾 캐시 관리
     */
    private generateCacheKey(query: string, options?: any): string {
        return `${query}_${JSON.stringify(options || {})}`;
    }

    private updateCache(key: string, value: any): void {
        if (this.cache.size >= this.config.cacheSize) {
            // LRU 방식으로 가장 오래된 항목 제거
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        this.cache.set(key, value);
    }

    /**
     * 📊 통계 업데이트
     */
    private updateStats(responseTime: number): void {
        // 평균 응답 시간 계산 (이동 평균)
        this.stats.averageResponseTime =
            (this.stats.averageResponseTime * 0.9) + (responseTime * 0.1);

        // 캐시 히트율 계산
        const totalRequests = this.cache.size;
        const cacheHits = Array.from(this.cache.values()).length;
        this.stats.cacheHitRate = totalRequests > 0 ? (cacheHits / totalRequests) * 100 : 0;

        this.stats.lastHealthCheck = new Date().toISOString();
    }

    /**
     * 🏥 헬스체크 시스템
     */
    private startHealthCheck(): void {
        this.healthCheckInterval = setInterval(async () => {
            try {
                // RAG 엔진 상태 확인
                const ragStats = this.localRAG.getStats();

                // ML Toolkit 상태 확인
                const mlHealthy = this.config.enableMLTools ?
                    this.mlToolkit.isReady() : true;

                // 전체 상태 업데이트
                this.stats.isHealthy = ragStats.initialized && mlHealthy;
                this.stats.totalDocuments = ragStats.totalDocuments;
                this.stats.totalEmbeddings = ragStats.totalEmbeddings;
                this.stats.lastHealthCheck = new Date().toISOString();

                if (!this.stats.isHealthy) {
                    console.warn('⚠️ RAG Engine 헬스체크 실패');
                }
            } catch (error) {
                console.error('❌ RAG Engine 헬스체크 오류:', error);
                this.stats.isHealthy = false;
            }
        }, 30000); // 30초마다 헬스체크
    }

    /**
     * 📊 상태 정보 반환
     */
    public getStats(): RAGEngineStats {
        return { ...this.stats };
    }

    /**
     * 🔄 정리 작업
     */
    public async cleanup(): Promise<void> {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
            this.healthCheckInterval = null;
        }

        this.cache.clear();
        console.log('🧹 RAG Engine 정리 완료');
    }

    /**
     * 🔍 레거시 호환성 메서드들
     */
    public isReady(): boolean {
        return this.initialized && this.stats.isHealthy;
    }

    public async query(query: string, options?: any): Promise<RAGSearchResult> {
        return this.search(query, options);
    }

    public async processQuery(query: string, sessionId: string): Promise<any> {
        const result = await this.search(query);
        return {
            response: result.response,
            confidence: result.confidence,
            sources: result.results.map(r => r.id),
            suggestions: result.suggestions,
            processingTime: result.processingTime,
            sessionLearning: true,
            reliability: result.confidence > 0.7 ? 'high' : result.confidence > 0.4 ? 'medium' : 'low',
            source: 'rag-engine',
        };
    }
} 