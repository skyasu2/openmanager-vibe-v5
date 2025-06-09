/**
 * 🔍 Query Processor v1.0
 * 
 * 쿼리 분석 및 처리 전담 모듈
 * - 쿼리 의도 분석
 * - 한국어 감지 및 처리
 * - MCP 액션 실행
 * - 키워드 추출
 */

import { RealMCPClient } from '@/services/mcp/real-mcp-client';
import {
    IQueryProcessor,
    SmartQuery,
    QueryIntent,
    MCPActionResult,
    AIEngineError
} from '../types/EnhancedAITypes';

export class QueryProcessor implements IQueryProcessor {
    private mcpClient: RealMCPClient;
    private commonWords: Set<string>;
    private intentPatterns: Map<QueryIntent, RegExp[]>;

    constructor(mcpClient: RealMCPClient) {
        this.mcpClient = mcpClient;
        this.initializeCommonWords();
        this.initializeIntentPatterns();
    }

    /**
     * 🧠 쿼리 의도 분석
     */
    async analyzeQueryIntent(query: string): Promise<SmartQuery> {
        const startTime = Date.now();

        try {
            // 1. 기본 분석
            const isKorean = this.detectKorean(query);
            const keywords = this.extractKeywords(query);
            const intent = this.detectIntent(query);

            // 2. 문서 요구사항 분석
            const requiredDocs = this.analyzeDocumentRequirements(query, intent);

            // 3. MCP 액션 분석
            const mcpActions = this.analyzeMCPActions(query, intent);

            // 4. TensorFlow 모델 요구사항 분석
            const tensorflowModels = this.analyzeTensorFlowRequirements(query, intent);

            const smartQuery: SmartQuery = {
                originalQuery: query,
                intent,
                keywords,
                requiredDocs,
                mcpActions,
                tensorflowModels,
                isKorean
            };

            const processingTime = Date.now() - startTime;
            console.log(`🔍 쿼리 분석 완료: ${processingTime}ms`, {
                intent,
                keywords: keywords.length,
                isKorean
            });

            return smartQuery;
        } catch (error) {
            console.error('❌ 쿼리 분석 실패:', error);
            throw new AIEngineError(
                '쿼리 처리 실패',
                'QUERY_PROCESSING_ERROR',
                error
            );
        }
    }

    /**
     * 🇰🇷 한국어 감지
     */
    detectKorean(text: string): boolean {
        const koreanRegex = /[가-힣]/;
        const koreanMatches = text.match(/[가-힣]/g);
        const totalChars = text.replace(/\s/g, '').length;

        if (!koreanMatches) return false;

        // 한국어 문자가 20% 이상이면 한국어로 판단
        const koreanRatio = koreanMatches.length / totalChars;
        return koreanRatio > 0.2;
    }

    /**
     * 🎯 의도 감지
     */
    private detectIntent(query: string): QueryIntent {
        const lowerQuery = query.toLowerCase();

        // 각 의도별 패턴 매칭
        for (const [intent, patterns] of this.intentPatterns) {
            if (patterns.some(pattern => pattern.test(lowerQuery))) {
                return intent;
            }
        }

        // 기본 의도는 검색
        return 'search';
    }

    /**
     * 🔤 키워드 추출
     */
    extractKeywords(text: string): string[] {
        // 1. 텍스트 정제
        const cleanText = text
            .toLowerCase()
            .replace(/[^\w\s가-힣]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

        // 2. 단어 분리
        const words = cleanText.split(' ');

        // 3. 유효한 키워드만 필터링
        const validKeywords = words.filter(word => {
            return word.length > 1 &&
                !this.commonWords.has(word) &&
                !this.isStopWord(word);
        });

        // 4. 중복 제거 및 상위 10개만 반환
        return [...new Set(validKeywords)].slice(0, 10);
    }

    /**
     * 🎬 MCP 액션 실행
     */
    async executeMCPActions(smartQuery: SmartQuery): Promise<string[]> {
        const executedActions: string[] = [];

        if (smartQuery.mcpActions.length === 0) {
            return executedActions;
        }

        try {
            for (const action of smartQuery.mcpActions) {
                const result = await this.executeSingleMCPAction(action, smartQuery);
                if (result.success) {
                    executedActions.push(`${action}: ${result.result}`);
                } else {
                    executedActions.push(`${action}: 실패 - ${result.error}`);
                }
            }

            console.log(`✅ MCP 액션 실행 완료: ${executedActions.length}개`);
        } catch (error) {
            console.error('❌ MCP 액션 실행 실패:', error);
            executedActions.push(`MCP 액션 실행 실패: ${error}`);
        }

        return executedActions;
    }

    /**
     * 🔧 단일 MCP 액션 실행
     */
    private async executeSingleMCPAction(action: string, smartQuery: SmartQuery): Promise<MCPActionResult> {
        const startTime = Date.now();

        try {
            let result: any;

            switch (action) {
                case 'search-documents':
                    result = await this.mcpClient.searchDocuments(smartQuery.originalQuery);
                    break;
                case 'get-system-metrics':
                    result = await this.mcpClient.getSystemMetrics?.();
                    break;
                case 'analyze-logs':
                    result = await this.mcpClient.analyzeLogs?.(smartQuery.keywords);
                    break;
                case 'check-health':
                    result = await this.mcpClient.healthCheck?.();
                    break;
                default:
                    throw new Error(`지원하지 않는 MCP 액션: ${action}`);
            }

            return {
                action,
                success: true,
                result,
                executionTime: Date.now() - startTime
            };
        } catch (error) {
            return {
                action,
                success: false,
                result: null,
                error: error instanceof Error ? error.message : String(error),
                executionTime: Date.now() - startTime
            };
        }
    }

    /**
     * 📋 문서 요구사항 분석
     */
    private analyzeDocumentRequirements(query: string, intent: QueryIntent): string[] {
        const requiredDocs: string[] = [];
        const lowerQuery = query.toLowerCase();

        // 의도별 문서 요구사항
        const intentDocuments = {
            analysis: ['README.md', 'docs/', 'analysis/'],
            search: ['docs/', 'README.md'],
            prediction: ['models/', 'data/', 'predictions/'],
            optimization: ['config/', 'performance/', 'optimization/'],
            troubleshooting: ['logs/', 'errors/', 'troubleshooting/']
        };

        requiredDocs.push(...(intentDocuments[intent] || []));

        // 특정 키워드 기반 문서 추가
        const keywordDocuments = {
            'api': ['api/', 'endpoints/', 'swagger/'],
            'config': ['config/', 'environment/', 'settings/'],
            'test': ['test/', 'spec/', '__tests__/'],
            'component': ['components/', 'ui/', 'src/'],
            'service': ['services/', 'business/', 'logic/'],
            'database': ['database/', 'models/', 'schema/'],
            'ai': ['ai/', 'ml/', 'models/'],
            'mcp': ['mcp/', 'protocol/', 'client/']
        };

        for (const [keyword, docs] of Object.entries(keywordDocuments)) {
            if (lowerQuery.includes(keyword)) {
                requiredDocs.push(...docs);
            }
        }

        return [...new Set(requiredDocs)]; // 중복 제거
    }

    /**
     * 🤖 MCP 액션 분석
     */
    private analyzeMCPActions(query: string, intent: QueryIntent): string[] {
        const actions: string[] = [];
        const lowerQuery = query.toLowerCase();

        // 의도별 기본 액션
        const intentActions = {
            analysis: ['search-documents', 'get-system-metrics'],
            search: ['search-documents'],
            prediction: ['get-system-metrics', 'analyze-logs'],
            optimization: ['get-system-metrics', 'check-health'],
            troubleshooting: ['analyze-logs', 'check-health', 'get-system-metrics']
        };

        actions.push(...(intentActions[intent] || []));

        // 키워드별 추가 액션
        if (lowerQuery.includes('로그') || lowerQuery.includes('log')) {
            actions.push('analyze-logs');
        }
        if (lowerQuery.includes('상태') || lowerQuery.includes('health') || lowerQuery.includes('status')) {
            actions.push('check-health');
        }
        if (lowerQuery.includes('메트릭') || lowerQuery.includes('metric') || lowerQuery.includes('performance')) {
            actions.push('get-system-metrics');
        }

        return [...new Set(actions)]; // 중복 제거
    }

    /**
     * 🧮 TensorFlow 요구사항 분석
     */
    private analyzeTensorFlowRequirements(query: string, intent: QueryIntent): string[] {
        const models: string[] = [];
        const lowerQuery = query.toLowerCase();

        // 의도별 모델 요구사항
        if (intent === 'prediction') {
            models.push('prediction-model', 'time-series-model');
        }
        if (intent === 'analysis') {
            models.push('classification-model', 'anomaly-detection-model');
        }

        // 특정 키워드 기반 모델 추가
        const keywordModels = {
            '예측': ['prediction-model', 'forecasting-model'],
            'prediction': ['prediction-model', 'forecasting-model'],
            '분류': ['classification-model'],
            'classification': ['classification-model'],
            '이상': ['anomaly-detection-model'],
            'anomaly': ['anomaly-detection-model'],
            '성능': ['performance-model'],
            'performance': ['performance-model']
        };

        for (const [keyword, modelList] of Object.entries(keywordModels)) {
            if (lowerQuery.includes(keyword)) {
                models.push(...modelList);
            }
        }

        return [...new Set(models)]; // 중복 제거
    }

    /**
     * 🔄 쿼리 처리 (전체 파이프라인)
     */
    async processQuery(query: string, sessionId?: string): Promise<SmartQuery> {
        console.log(`🔍 쿼리 처리 시작: "${query}"`);

        try {
            // 1. 쿼리 분석
            const smartQuery = await this.analyzeQueryIntent(query);

            // 2. 세션 기반 컨텍스트 향상 (옵션)
            if (sessionId) {
                this.enhanceWithSessionContext(smartQuery, sessionId);
            }

            // 3. 쿼리 검증
            this.validateSmartQuery(smartQuery);

            console.log(`✅ 쿼리 처리 완료:`, {
                intent: smartQuery.intent,
                keywords: smartQuery.keywords.length,
                mcpActions: smartQuery.mcpActions.length,
                isKorean: smartQuery.isKorean
            });

            return smartQuery;
        } catch (error) {
            console.error('❌ 쿼리 처리 실패:', error);
            throw error;
        }
    }

    /**
     * 📝 세션 컨텍스트 향상
     */
    private enhanceWithSessionContext(smartQuery: SmartQuery, sessionId: string): void {
        // 향후 세션 메모리 기반 컨텍스트 향상 로직
        // 현재는 기본 구현
        console.log(`📝 세션 컨텍스트 적용: ${sessionId}`);
    }

    /**
     * ✅ SmartQuery 검증
     */
    private validateSmartQuery(smartQuery: SmartQuery): void {
        if (!smartQuery.originalQuery || smartQuery.originalQuery.trim().length === 0) {
            throw new AIEngineError(
                '빈 쿼리는 처리할 수 없습니다',
                'QUERY_PROCESSING_ERROR',
                { query: smartQuery.originalQuery }
            );
        }

        if (smartQuery.keywords.length === 0) {
            console.warn('⚠️ 키워드가 추출되지 않았습니다');
        }
    }

    /**
     * 🚫 불용어 확인
     */
    private isStopWord(word: string): boolean {
        const stopWords = [
            // 영어 불용어
            'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had',
            'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can',
            'what', 'where', 'when', 'why', 'how', 'who', 'which',
            // 한국어 불용어
            '이', '그', '저', '것', '들', '의', '를', '을', '에', '와', '과', '로', '으로',
            '에서', '까지', '부터', '만', '도', '는', '은', '가', '이다', '있다', '없다'
        ];

        return stopWords.includes(word.toLowerCase());
    }

    /**
     * 🔤 일반 단어 초기화
     */
    private initializeCommonWords(): void {
        this.commonWords = new Set([
            'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
            'this', 'that', 'these', 'those', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
            'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
            '이', '그', '저', '의', '를', '을', '에', '와', '과', '로', '으로', '에서', '까지',
            '있다', '없다', '하다', '되다', '같다', '다르다', '많다', '적다'
        ]);
    }

    /**
     * 🎯 의도 패턴 초기화
     */
    private initializeIntentPatterns(): void {
        this.intentPatterns = new Map([
            ['analysis', [
                /분석/i, /해석/i, /분해/i, /조사/i,
                /analyz/i, /examine/i, /investigate/i, /study/i
            ]],
            ['search', [
                /검색/i, /찾/i, /조회/i, /확인/i,
                /search/i, /find/i, /look/i, /query/i
            ]],
            ['prediction', [
                /예측/i, /전망/i, /미래/i, /추정/i,
                /predict/i, /forecast/i, /estimate/i, /future/i
            ]],
            ['optimization', [
                /최적화/i, /개선/i, /향상/i, /효율/i,
                /optim/i, /improve/i, /enhance/i, /efficient/i
            ]],
            ['troubleshooting', [
                /문제/i, /오류/i, /에러/i, /버그/i, /해결/i,
                /trouble/i, /error/i, /bug/i, /fix/i, /solve/i, /debug/i
            ]]
        ]);
    }

    /**
     * 🧹 리소스 정리
     */
    dispose(): void {
        this.commonWords.clear();
        this.intentPatterns.clear();
        console.log('🧹 QueryProcessor 리소스 정리 완료');
    }
} 