/**
 * 🧠 쿼리 분석기 v1.0
 * 
 * 책임:
 * - 사용자 쿼리 의도 분석
 * - 키워드 추출 및 정제
 * - SmartQuery 객체 생성
 * - 언어 감지 및 처리
 */

interface SmartQuery {
    originalQuery: string;
    intent: 'analysis' | 'search' | 'prediction' | 'optimization' | 'troubleshooting';
    keywords: string[];
    requiredDocs: string[];
    mcpActions: string[];
    tensorflowModels: string[];
    isKorean: boolean;
    useTransformers: boolean;
    useVectorSearch: boolean;
}

interface KeywordExtractionResult {
    primary: string[];      // 주요 키워드
    secondary: string[];    // 보조 키워드
    technical: string[];    // 기술 용어
    entities: string[];     // 개체명
}

interface IntentAnalysisResult {
    intent: SmartQuery['intent'];
    confidence: number;
    reasoning: string;
    suggestedActions: string[];
}

export class QueryAnalyzer {
    // 의도별 키워드 패턴
    private readonly intentPatterns = {
        analysis: [
            // 한국어
            ['분석', '확인', '검토', '조사', '살펴', '파악', '알아보', '점검'],
            // English
            ['analyze', 'check', 'review', 'investigate', 'examine', 'assess', 'evaluate']
        ],
        search: [
            // 한국어
            ['찾기', '검색', '조회', '탐색', '발견', '찾아', '보여줘', '알려줘'],
            // English
            ['find', 'search', 'lookup', 'locate', 'discover', 'show', 'tell', 'get']
        ],
        prediction: [
            // 한국어
            ['예측', '예상', '전망', '미래', '예보', '추정', '가능성', '트렌드'],
            // English
            ['predict', 'forecast', 'expect', 'future', 'trend', 'estimate', 'probability']
        ],
        optimization: [
            // 한국어
            ['최적화', '개선', '향상', '효율', '성능', '튜닝', '조정', '최적'],
            // English
            ['optimize', 'improve', 'enhance', 'performance', 'efficiency', 'tuning', 'adjust']
        ],
        troubleshooting: [
            // 한국어
            ['문제', '오류', '에러', '해결', '수정', '고장', '장애', '버그', '트러블'],
            // English
            ['problem', 'error', 'issue', 'fix', 'solve', 'troubleshoot', 'debug', 'resolve']
        ]
    };

    // 기술 용어 사전
    private readonly technicalTerms = [
        // 시스템 관련
        'cpu', 'memory', 'disk', 'network', 'server', 'database', 'api', 'endpoint',
        'metric', 'monitoring', 'alert', 'threshold', 'performance', 'latency',
        // 한국어 기술 용어
        '서버', '데이터베이스', '네트워크', '메모리', '디스크', '성능', '지연시간',
        '모니터링', '알림', '임계값', '메트릭', '엔드포인트'
    ];

    // MCP 액션 매핑
    private readonly mcpActionPatterns = {
        'list_servers': ['서버 목록', 'server list', '서버들', 'servers'],
        'get_metrics': ['메트릭', 'metrics', '지표', '성능 데이터'],
        'check_health': ['헬스체크', 'health check', '상태 확인', 'status'],
        'get_logs': ['로그', 'logs', '기록', '로그 파일'],
        'analyze_performance': ['성능 분석', 'performance analysis', '성능 검토']
    };

    // TensorFlow 모델 매핑
    private readonly tensorflowModelPatterns = {
        'anomaly_detection': ['이상탐지', 'anomaly detection', '비정상', 'outlier'],
        'load_prediction': ['부하예측', 'load prediction', '트래픽 예측', 'traffic forecast'],
        'resource_optimization': ['리소스 최적화', 'resource optimization', '자원 최적화'],
        'failure_prediction': ['장애예측', 'failure prediction', '고장 예측']
    };

    // 분석 통계
    private analysisStats = {
        totalQueries: 0,
        languageDetection: { korean: 0, english: 0, mixed: 0 },
        intentDistribution: {
            analysis: 0,
            search: 0,
            prediction: 0,
            optimization: 0,
            troubleshooting: 0
        },
        avgProcessingTime: 0
    };

    constructor() {
        console.log('🧠 QueryAnalyzer 초기화 완료');
    }

    /**
     * 🔍 스마트 쿼리 분석 (메인 함수)
     */
    async analyzeQuery(query: string): Promise<SmartQuery> {
        const startTime = Date.now();

        try {
            console.log(`🔍 쿼리 분석 시작: "${query}"`);

            // 1. 기본 전처리
            const cleanQuery = this.preprocessQuery(query);
            const isKorean = this.detectKoreanLanguage(cleanQuery);

            // 2. 키워드 추출
            const keywords = await this.extractKeywords(cleanQuery, isKorean);

            // 3. 의도 분석
            const intentAnalysis = await this.analyzeIntent(cleanQuery, keywords, isKorean);

            // 4. 필요한 문서 및 액션 식별
            const requiredDocs = this.identifyRequiredDocuments(cleanQuery, keywords);
            const mcpActions = this.identifyMCPActions(cleanQuery, keywords, intentAnalysis.intent);
            const tensorflowModels = this.identifyTensorFlowModels(cleanQuery, keywords, intentAnalysis.intent);

            // 5. 엔진 사용 결정
            const useTransformers = this.shouldUseTransformers(intentAnalysis.intent, keywords);
            const useVectorSearch = this.shouldUseVectorSearch(intentAnalysis.intent, keywords);

            // 6. SmartQuery 객체 생성
            const smartQuery: SmartQuery = {
                originalQuery: query,
                intent: intentAnalysis.intent,
                keywords: keywords.primary.concat(keywords.secondary),
                requiredDocs,
                mcpActions,
                tensorflowModels,
                isKorean,
                useTransformers,
                useVectorSearch
            };

            // 7. 통계 업데이트
            const processingTime = Date.now() - startTime;
            this.updateAnalysisStats(smartQuery, processingTime);

            console.log(`✅ 쿼리 분석 완료 (${processingTime}ms):`, {
                intent: smartQuery.intent,
                keywords: smartQuery.keywords.slice(0, 3),
                language: isKorean ? '한국어' : 'English',
                engines: {
                    transformers: useTransformers,
                    vectorSearch: useVectorSearch,
                    mcp: mcpActions.length > 0,
                    tensorflow: tensorflowModels.length > 0
                }
            });

            return smartQuery;
        } catch (error) {
            console.error('❌ 쿼리 분석 실패:', error);

            // 폴백 SmartQuery 반환
            return this.createFallbackSmartQuery(query);
        }
    }

    /**
     * 🧹 쿼리 전처리
     */
    private preprocessQuery(query: string): string {
        return query
            .trim()
            .replace(/\s+/g, ' ')                    // 다중 공백 제거
            .replace(/[^\w\sㄱ-ㅎㅏ-ㅣ가-힣]/g, ' ')  // 특수문자 제거 (한글 보존)
            .toLowerCase();
    }

    /**
     * 🇰🇷 한국어 감지
     */
    private detectKoreanLanguage(query: string): boolean {
        const koreanChars = query.match(/[ㄱ-ㅎㅏ-ㅣ가-힣]/g);
        const totalChars = query.replace(/\s/g, '').length;

        if (totalChars === 0) return false;

        const koreanRatio = koreanChars ? koreanChars.length / totalChars : 0;
        return koreanRatio > 0.3; // 30% 이상이 한글이면 한국어로 판단
    }

    /**
     * 🔑 키워드 추출
     */
    private async extractKeywords(query: string, isKorean: boolean): Promise<KeywordExtractionResult> {
        const words = query.split(/\s+/).filter(word => word.length > 1);

        const result: KeywordExtractionResult = {
            primary: [],
            secondary: [],
            technical: [],
            entities: []
        };

        // 불용어 필터링
        const stopwords = isKorean
            ? ['는', '은', '이', '가', '을', '를', '의', '에', '에서', '로', '으로', '와', '과', '그리고', '또한']
            : ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];

        const filteredWords = words.filter(word =>
            !stopwords.includes(word) && word.length > 2
        );

        // 기술 용어 식별
        result.technical = filteredWords.filter(word =>
            this.technicalTerms.some(term =>
                word.includes(term) || term.includes(word)
            )
        );

        // 주요 키워드 (기술 용어 + 긴 단어)
        result.primary = filteredWords
            .filter(word => word.length > 4 || result.technical.includes(word))
            .slice(0, 8);

        // 보조 키워드
        result.secondary = filteredWords
            .filter(word => !result.primary.includes(word))
            .slice(0, 5);

        // 개체명 (대문자로 시작하는 단어들)
        result.entities = filteredWords.filter(word =>
            /^[A-Z][a-z]+/.test(word) || /^[가-힣]{2,}$/.test(word)
        );

        return result;
    }

    /**
     * 🎯 의도 분석
     */
    private async analyzeIntent(
        query: string,
        keywords: KeywordExtractionResult,
        isKorean: boolean
    ): Promise<IntentAnalysisResult> {
        const scores: Record<SmartQuery['intent'], number> = {
            analysis: 0,
            search: 0,
            prediction: 0,
            optimization: 0,
            troubleshooting: 0
        };

        // 패턴 매칭으로 점수 계산
        Object.entries(this.intentPatterns).forEach(([intent, patterns]) => {
            const relevantPatterns = isKorean ? patterns[0] : patterns[1];

            relevantPatterns.forEach(pattern => {
                if (query.includes(pattern)) {
                    scores[intent as SmartQuery['intent']] += 2;
                }

                // 키워드에서도 검색
                const allKeywords = [...keywords.primary, ...keywords.secondary];
                if (allKeywords.some(keyword => keyword.includes(pattern))) {
                    scores[intent as SmartQuery['intent']] += 1;
                }
            });
        });

        // 컨텍스트 기반 보정
        this.applyContextualAdjustments(scores, keywords, query);

        // 최고 점수 의도 선택
        const maxScore = Math.max(...Object.values(scores));
        const detectedIntent = Object.keys(scores).find(
            intent => scores[intent as SmartQuery['intent']] === maxScore
        ) as SmartQuery['intent'];

        // 신뢰도 계산 (0-1)
        const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
        const confidence = totalScore > 0 ? maxScore / totalScore : 0.5;

        // 추천 액션 생성
        const suggestedActions = this.generateSuggestedActions(detectedIntent, keywords);

        const reasoning = `패턴 매칭 점수: ${JSON.stringify(scores)}, 최고점: ${maxScore}`;

        return {
            intent: detectedIntent || 'search', // 기본값: search
            confidence,
            reasoning,
            suggestedActions
        };
    }

    /**
     * 🔧 컨텍스트 기반 점수 보정
     */
    private applyContextualAdjustments(
        scores: Record<SmartQuery['intent'], number>,
        keywords: KeywordExtractionResult,
        query: string
    ): void {
        // 질문형이면 search 가중치 증가
        if (query.includes('?') || query.includes('무엇') || query.includes('어떻') ||
            query.includes('what') || query.includes('how') || query.includes('why')) {
            scores.search += 1;
        }

        // 시간 관련 표현이면 prediction 가중치 증가
        if (query.includes('미래') || query.includes('예상') || query.includes('future') ||
            query.includes('next') || query.includes('will')) {
            scores.prediction += 1;
        }

        // 기술 용어가 많으면 analysis 가중치 증가
        if (keywords.technical.length > 2) {
            scores.analysis += 1;
        }

        // 부정적 표현이면 troubleshooting 가중치 증가
        if (query.includes('문제') || query.includes('오류') || query.includes('실패') ||
            query.includes('problem') || query.includes('error') || query.includes('fail')) {
            scores.troubleshooting += 2;
        }
    }

    /**
     * 📚 필요 문서 식별
     */
    private identifyRequiredDocuments(query: string, keywords: KeywordExtractionResult): string[] {
        const docs: string[] = [];

        // 기술 용어 기반 문서 매핑
        if (keywords.technical.some(term => ['server', '서버'].includes(term))) {
            docs.push('server-management-guide');
        }

        if (keywords.technical.some(term => ['database', '데이터베이스'].includes(term))) {
            docs.push('database-operations-manual');
        }

        if (keywords.technical.some(term => ['monitoring', '모니터링'].includes(term))) {
            docs.push('monitoring-best-practices');
        }

        return docs.slice(0, 5); // 최대 5개 문서
    }

    /**
     * 🔧 MCP 액션 식별
     */
    private identifyMCPActions(
        query: string,
        keywords: KeywordExtractionResult,
        intent: SmartQuery['intent']
    ): string[] {
        const actions: string[] = [];

        Object.entries(this.mcpActionPatterns).forEach(([action, patterns]) => {
            if (patterns.some(pattern =>
                query.includes(pattern) ||
                keywords.primary.some(keyword => keyword.includes(pattern))
            )) {
                actions.push(action);
            }
        });

        // 의도 기반 자동 액션 추가
        if (intent === 'search' && actions.length === 0) {
            actions.push('list_servers');
        }

        if (intent === 'troubleshooting') {
            actions.push('check_health', 'get_logs');
        }

        return actions.slice(0, 3); // 최대 3개 액션
    }

    /**
     * 🧠 TensorFlow 모델 식별
     */
    private identifyTensorFlowModels(
        query: string,
        keywords: KeywordExtractionResult,
        intent: SmartQuery['intent']
    ): string[] {
        const models: string[] = [];

        Object.entries(this.tensorflowModelPatterns).forEach(([model, patterns]) => {
            if (patterns.some(pattern =>
                query.includes(pattern) ||
                keywords.primary.some(keyword => keyword.includes(pattern))
            )) {
                models.push(model);
            }
        });

        // 의도 기반 모델 추가
        if (intent === 'prediction') {
            if (models.length === 0) models.push('load_prediction');
        }

        if (intent === 'troubleshooting') {
            models.push('anomaly_detection');
        }

        return models.slice(0, 2); // 최대 2개 모델
    }

    /**
     * 🤖 Transformers 사용 여부 결정
     */
    private shouldUseTransformers(intent: SmartQuery['intent'], keywords: KeywordExtractionResult): boolean {
        // 복잡한 분석이나 자연어 처리가 필요한 경우
        return intent === 'analysis' ||
            intent === 'search' ||
            keywords.primary.length > 5;
    }

    /**
     * 🔍 벡터 검색 사용 여부 결정
     */
    private shouldUseVectorSearch(intent: SmartQuery['intent'], keywords: KeywordExtractionResult): boolean {
        // 의미적 검색이 필요한 경우
        return intent === 'search' ||
            intent === 'analysis' ||
            keywords.entities.length > 0;
    }

    /**
     * 💡 추천 액션 생성
     */
    private generateSuggestedActions(intent: SmartQuery['intent'], keywords: KeywordExtractionResult): string[] {
        const actions: string[] = [];

        switch (intent) {
            case 'analysis':
                actions.push('상세 분석 보고서 생성', '메트릭 트렌드 확인');
                break;
            case 'search':
                actions.push('관련 문서 검색', '유사 사례 조회');
                break;
            case 'prediction':
                actions.push('예측 모델 실행', '미래 트렌드 분석');
                break;
            case 'optimization':
                actions.push('최적화 방안 제안', '성능 개선 계획');
                break;
            case 'troubleshooting':
                actions.push('문제 진단 실행', '해결 방안 검색');
                break;
        }

        return actions;
    }

    /**
     * 🚨 폴백 SmartQuery 생성
     */
    private createFallbackSmartQuery(query: string): SmartQuery {
        const isKorean = this.detectKoreanLanguage(query);

        return {
            originalQuery: query,
            intent: 'search',
            keywords: query.split(/\s+/).filter(word => word.length > 2).slice(0, 5),
            requiredDocs: [],
            mcpActions: ['list_servers'],
            tensorflowModels: [],
            isKorean,
            useTransformers: true,
            useVectorSearch: true
        };
    }

    /**
     * 📊 분석 통계 업데이트
     */
    private updateAnalysisStats(smartQuery: SmartQuery, processingTime: number): void {
        this.analysisStats.totalQueries++;

        // 언어 통계
        if (smartQuery.isKorean) {
            this.analysisStats.languageDetection.korean++;
        } else {
            this.analysisStats.languageDetection.english++;
        }

        // 의도 통계
        this.analysisStats.intentDistribution[smartQuery.intent]++;

        // 평균 처리 시간 업데이트
        const totalTime = this.analysisStats.avgProcessingTime * (this.analysisStats.totalQueries - 1) + processingTime;
        this.analysisStats.avgProcessingTime = totalTime / this.analysisStats.totalQueries;
    }

    /**
     * 📊 분석 통계 조회
     */
    getAnalysisStats(): typeof this.analysisStats {
        return JSON.parse(JSON.stringify(this.analysisStats));
    }

    /**
     * 🧹 통계 리셋
     */
    resetStats(): void {
        this.analysisStats = {
            totalQueries: 0,
            languageDetection: { korean: 0, english: 0, mixed: 0 },
            intentDistribution: {
                analysis: 0,
                search: 0,
                prediction: 0,
                optimization: 0,
                troubleshooting: 0
            },
            avgProcessingTime: 0
        };
        console.log('📊 QueryAnalyzer 통계 리셋 완료');
    }

    /**
     * 🧹 정리
     */
    dispose(): void {
        this.resetStats();
        console.log('🧹 QueryAnalyzer 정리 완료');
    }
}
