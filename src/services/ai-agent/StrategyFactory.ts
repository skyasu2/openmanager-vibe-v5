/**
 * 🏭 전략 팩토리 - 요청 타입별 처리 전략 선택
 * 
 * 전략 패턴을 적용하여 각 요청 타입에 맞는 최적의 처리 전략을 선택
 * - Factory Pattern: 전략 객체 생성 관리
 * - Strategy Pattern: 알고리즘 캡슐화 및 교체 가능
 * - Performance: 전략별 성능 최적화
 */

import { RealServerDataGenerator } from '@/services/data-generator/RealServerDataGenerator';
import { aiDataFilter, AIDataFilterOptions, AIFilterResult } from './AIDataFilter';
import { hybridDataManager, HybridDataRequest, HybridDataResponse } from './HybridDataManager';

export interface ProcessingStrategy {
    name: string;
    priority: 'monitoring' | 'ai' | 'balanced';
    execute(request: any): Promise<any>;
    getMetadata(): StrategyMetadata;
}

export interface StrategyMetadata {
    name: string;
    description: string;
    avgProcessingTime: number;
    successRate: number;
    lastUsed: Date;
    usageCount: number;
}

/**
 * 🎯 모니터링 우선 전략
 */
export class MonitoringFocusStrategy implements ProcessingStrategy {
    name = 'monitoring_focus';
    priority: 'monitoring' = 'monitoring';
    private dataGenerator: RealServerDataGenerator;
    private usageCount = 0;
    private totalProcessingTime = 0;
    private successCount = 0;
    private lastUsed = new Date();

    constructor() {
        this.dataGenerator = RealServerDataGenerator.getInstance();
    }

    async execute(request: any): Promise<any> {
        const startTime = Date.now();
        this.usageCount++;
        this.lastUsed = new Date();

        try {
            console.log(`🔍 [${request.requestId}] 모니터링 우선 전략 실행`);

            // 실시간 서버 데이터 우선 수집
            const servers = this.dataGenerator.getAllServers();

            // 모니터링 필터 적용
            let filteredServers = [...servers];
            if (request.filters?.monitoring) {
                const { status, location, searchTerm } = request.filters.monitoring;

                if (status && status !== 'all') {
                    filteredServers = filteredServers.filter(s => s.status === status);
                }

                if (location) {
                    filteredServers = filteredServers.filter(s => s.location === location);
                }

                if (searchTerm) {
                    const searchLower = searchTerm.toLowerCase();
                    filteredServers = filteredServers.filter(s =>
                        s.name.toLowerCase().includes(searchLower) ||
                        s.id.toLowerCase().includes(searchLower)
                    );
                }
            }

            // 실시간 메트릭 계산
            const totalServers = filteredServers.length;
            const onlineServers = filteredServers.filter(s => s.status === 'running').length;
            const warningServers = filteredServers.filter(s => s.status === 'warning').length;
            const criticalServers = filteredServers.filter(s => s.status === 'error').length;

            // AI 보조 분석 (경량)
            const aiSupport = await aiDataFilter.filterForAI({
                analysisType: 'anomaly_detection',
                includeHealthy: false,
                maxResults: 10
            });

            const processingTime = Date.now() - startTime;
            this.totalProcessingTime += processingTime;
            this.successCount++;

            const result = {
                strategy: this.name,
                data: {
                    servers: filteredServers,
                    realTimeMetrics: {
                        totalServers,
                        onlineServers,
                        warningServers,
                        criticalServers,
                        healthRatio: (onlineServers / totalServers) * 100
                    },
                    aiSupport: {
                        anomalies: aiSupport.insights.anomalies.slice(0, 3),
                        confidence: aiSupport.metadata.dataQuality.accuracy
                    }
                },
                metadata: {
                    processingTime,
                    dataSource: 'real_time_monitoring',
                    aiSupportLevel: 'minimal'
                },
                confidence: 0.95, // 실시간 데이터는 높은 신뢰도
                dataQuality: 0.9
            };

            console.log(`✅ [${request.requestId}] 모니터링 전략 완료: ${processingTime}ms`);
            return result;

        } catch (error) {
            console.error(`❌ [${request.requestId}] 모니터링 전략 실패:`, error);
            throw error;
        }
    }

    getMetadata(): StrategyMetadata {
        return {
            name: this.name,
            description: '실시간 모니터링 데이터 우선 처리',
            avgProcessingTime: this.usageCount > 0 ? this.totalProcessingTime / this.usageCount : 0,
            successRate: this.usageCount > 0 ? this.successCount / this.usageCount : 0,
            lastUsed: this.lastUsed,
            usageCount: this.usageCount
        };
    }
}

/**
 * 🤖 AI 분석 우선 전략
 */
export class AIAnalysisStrategy implements ProcessingStrategy {
    name = 'ai_analysis';
    priority: 'ai' = 'ai';
    private dataGenerator: RealServerDataGenerator;
    private usageCount = 0;
    private totalProcessingTime = 0;
    private successCount = 0;
    private lastUsed = new Date();

    constructor() {
        this.dataGenerator = RealServerDataGenerator.getInstance();
    }

    async execute(request: any): Promise<any> {
        const startTime = Date.now();
        this.usageCount++;
        this.lastUsed = new Date();

        try {
            console.log(`🧠 [${request.requestId}] AI 분석 우선 전략 실행`);

            // AI 전용 데이터 필터링
            const aiOptions: AIDataFilterOptions = {
                analysisType: request.filters?.ai?.analysisType || 'pattern_analysis',
                includeHealthy: request.filters?.ai?.includeHealthy ?? true,
                includeWarning: request.filters?.ai?.includeWarning ?? true,
                includeCritical: request.filters?.ai?.includeCritical ?? true,
                ...request.filters?.ai
            };

            const aiResult = await aiDataFilter.filterForAI(aiOptions);

            // 모니터링 컨텍스트 (최소한)
            const allServers = this.dataGenerator.getAllServers();
            const serverContext = {
                total: allServers.length,
                online: allServers.filter(s => s.status === 'running').length,
                issues: allServers.filter(s => s.status !== 'running').length
            };

            const processingTime = Date.now() - startTime;
            this.totalProcessingTime += processingTime;
            this.successCount++;

            const result = {
                strategy: this.name,
                data: {
                    aiAnalysis: aiResult.data,
                    insights: aiResult.insights,
                    patterns: aiResult.insights.patterns,
                    anomalies: aiResult.insights.anomalies,
                    recommendations: aiResult.insights.recommendations,
                    serverContext
                },
                metadata: {
                    processingTime,
                    dataSource: 'ai_analysis',
                    analysisType: aiOptions.analysisType,
                    dataQuality: aiResult.metadata.dataQuality
                },
                confidence: aiResult.metadata.dataQuality.accuracy,
                dataQuality: (
                    aiResult.metadata.dataQuality.completeness +
                    aiResult.metadata.dataQuality.consistency +
                    aiResult.metadata.dataQuality.accuracy
                ) / 3
            };

            console.log(`✅ [${request.requestId}] AI 분석 전략 완료: ${processingTime}ms`);
            return result;

        } catch (error) {
            console.error(`❌ [${request.requestId}] AI 분석 전략 실패:`, error);
            throw error;
        }
    }

    getMetadata(): StrategyMetadata {
        return {
            name: this.name,
            description: 'AI 패턴 분석 및 인사이트 생성 우선',
            avgProcessingTime: this.usageCount > 0 ? this.totalProcessingTime / this.usageCount : 0,
            successRate: this.usageCount > 0 ? this.successCount / this.usageCount : 0,
            lastUsed: this.lastUsed,
            usageCount: this.usageCount
        };
    }
}

/**
 * ⚖️ 하이브리드 균형 전략
 */
export class HybridBalancedStrategy implements ProcessingStrategy {
    name = 'hybrid_balanced';
    priority: 'balanced' = 'balanced';
    private dataGenerator: RealServerDataGenerator;
    private usageCount = 0;
    private totalProcessingTime = 0;
    private successCount = 0;
    private lastUsed = new Date();

    constructor() {
        this.dataGenerator = RealServerDataGenerator.getInstance();
    }

    async execute(request: any): Promise<any> {
        const startTime = Date.now();
        this.usageCount++;
        this.lastUsed = new Date();

        try {
            console.log(`⚖️ [${request.requestId}] 하이브리드 균형 전략 실행`);

            // 하이브리드 데이터 매니저 활용
            const hybridRequest: HybridDataRequest = {
                requestType: 'hybrid',
                query: request.query,
                urgency: request.urgency || 'medium',
                monitoringFilters: request.filters?.monitoring,
                aiFilters: request.filters?.ai,
                fusionOptions: {
                    includeInsights: true,
                    crossValidate: true,
                    confidenceThreshold: request.options?.confidenceThreshold || 0.7
                }
            };

            const hybridResult = await hybridDataManager.processHybridRequest(hybridRequest);

            const processingTime = Date.now() - startTime;
            this.totalProcessingTime += processingTime;
            this.successCount++;

            const result = {
                strategy: this.name,
                data: {
                    monitoringData: hybridResult.monitoringData,
                    aiData: hybridResult.aiData,
                    fusedInsights: hybridResult.fusedInsights,
                    crossValidation: hybridResult.debug
                },
                metadata: {
                    processingTime,
                    dataSource: 'hybrid_fusion',
                    fusionStrategy: hybridResult.metadata.fusionStrategy,
                    dataQuality: hybridResult.metadata.dataQuality
                },
                confidence: hybridResult.fusedInsights.confidence,
                dataQuality: hybridResult.metadata.dataQuality.fusion
            };

            console.log(`✅ [${request.requestId}] 하이브리드 전략 완료: ${processingTime}ms`);
            return result;

        } catch (error) {
            console.error(`❌ [${request.requestId}] 하이브리드 전략 실패:`, error);
            throw error;
        }
    }

    getMetadata(): StrategyMetadata {
        return {
            name: this.name,
            description: '모니터링과 AI 분석의 균형잡힌 융합',
            avgProcessingTime: this.usageCount > 0 ? this.totalProcessingTime / this.usageCount : 0,
            successRate: this.usageCount > 0 ? this.successCount / this.usageCount : 0,
            lastUsed: this.lastUsed,
            usageCount: this.usageCount
        };
    }
}

/**
 * 🏭 전략 팩토리 메인 클래스
 */
export class StrategyFactory {
    private static instance: StrategyFactory | null = null;
    private strategies: Map<string, ProcessingStrategy>;

    private constructor() {
        this.strategies = new Map<string, ProcessingStrategy>();
        this.strategies.set('monitoring_focus', new MonitoringFocusStrategy());
        this.strategies.set('ai_analysis', new AIAnalysisStrategy());
        this.strategies.set('hybrid_balanced', new HybridBalancedStrategy());
    }

    static getInstance(): StrategyFactory {
        if (!StrategyFactory.instance) {
            StrategyFactory.instance = new StrategyFactory();
        }
        return StrategyFactory.instance;
    }

    /**
     * 🎯 전략 선택
     */
    async selectStrategy(request: any): Promise<ProcessingStrategy> {
        const strategyName = request.requestType;

        // auto_select 요청 시 직접 전략 선택
        if (strategyName === 'auto_select') {
            const selectedStrategyName = this.selectBestStrategy(request);
            const strategy = this.strategies.get(selectedStrategyName);
            if (!strategy) {
                console.warn(`⚠️ 알 수 없는 전략: ${selectedStrategyName}, hybrid_balanced로 대체`);
                return this.strategies.get('hybrid_balanced')!;
            }
            return strategy;
        }

        const strategy = this.strategies.get(strategyName);

        if (!strategy) {
            console.warn(`⚠️ 알 수 없는 전략: ${strategyName}, hybrid_balanced로 대체`);
            return this.strategies.get('hybrid_balanced')!;
        }

        return strategy;
    }

    /**
     * 🎯 자동 전략 선택 로직
     */
    private selectBestStrategy(request: any): string {
        const query = request.query.toLowerCase();
        const urgency = request.urgency;

        // 긴급 상황 - 모니터링 우선
        if (urgency === 'critical' || urgency === 'high') {
            return 'monitoring_focus';
        }

        // AI 분석 키워드 감지
        if (query.includes('분석') || query.includes('예측') || query.includes('패턴') || query.includes('이상')) {
            return 'ai_analysis';
        }

        // 실시간 모니터링 키워드 감지
        if (query.includes('현재') || query.includes('실시간') || query.includes('상태') || query.includes('지금')) {
            return 'monitoring_focus';
        }

        // 복합 키워드 - 하이브리드
        if (query.includes('종합') || query.includes('전체') || query.includes('비교')) {
            return 'hybrid_balanced';
        }

        // 기본값 - 하이브리드
        return 'hybrid_balanced';
    }

    /**
     * 📊 전략 상태 조회
     */
    async getStatus(): Promise<any> {
        const strategyStats = Array.from(this.strategies.entries()).map(([name, strategy]) => ({
            name,
            metadata: strategy.getMetadata()
        }));

        return {
            availableStrategies: strategyStats,
            totalStrategies: this.strategies.size,
            lastUpdated: new Date().toISOString()
        };
    }

    /**
     * 📈 전략 성능 분석
     */
    getPerformanceAnalysis(): any {
        const strategies = Array.from(this.strategies.values());
        const totalUsage = strategies.reduce((sum, s) => sum + s.getMetadata().usageCount, 0);

        return {
            totalRequests: totalUsage,
            strategyDistribution: strategies.map(s => ({
                name: s.name,
                usage: s.getMetadata().usageCount,
                percentage: totalUsage > 0 ? (s.getMetadata().usageCount / totalUsage) * 100 : 0
            })),
            averagePerformance: strategies.map(s => ({
                name: s.name,
                avgTime: s.getMetadata().avgProcessingTime,
                successRate: s.getMetadata().successRate
            }))
        };
    }
} 