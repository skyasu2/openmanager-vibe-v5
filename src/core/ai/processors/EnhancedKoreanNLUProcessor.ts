/**
 * 🇰🇷 확장된 한국어 NLP 프로세서
 * 
 * Phase 2: 서버 모니터링 특화 도메인 어휘 매핑 시스템
 * 기존 KoreanNLUProcessor를 확장하여 서버 모니터링 도메인에 특화
 */

import {
    IEnhancedKoreanNLUProcessor,
    KoreanNLUResult,
    ServerType,
    MetricType,
    StatusType,
    ServerTerms,
    DomainMapping,
    NLPProcessingError
} from '@/types/server-monitoring-patterns.types';

/**
 * 확장된 한국어 NLP 프로세서
 * 기존 lib/ml/rag-engine.ts의 KoreanNLUProcessor를 확장
 */
export class EnhancedKoreanNLUProcessor implements IEnhancedKoreanNLUProcessor {
    private serverTermMapping: Map<string, ServerType> = new Map();
    private metricTermMapping: Map<string, MetricType> = new Map();
    private statusTermMapping: Map<string, StatusType> = new Map();
    private synonymMapping: Map<string, string> = new Map();

    constructor() {
        this.initializeTermMappings();
    }

    /**
     * 도메인 특화 어휘 매핑 초기화
     * 서버 모니터링에 특화된 한국어 용어들을 매핑
     */
    private initializeTermMappings(): void {
        // 서버 타입 매핑
        this.initializeServerTypeMapping();

        // 메트릭 타입 매핑  
        this.initializeMetricTypeMapping();

        // 상태 타입 매핑
        this.initializeStatusTypeMapping();

        // 동의어 매핑
        this.initializeSynonymMapping();
    }

    /**
     * 서버 타입 매핑 초기화
     */
    private initializeServerTypeMapping(): void {
        // 웹서버 관련 용어
        ['웹서버', 'web서버', 'nginx', 'apache', 'iis', '아파치', '엔진엑스'].forEach(term => {
            this.serverTermMapping.set(term.toLowerCase(), 'web_server');
        });

        // API서버 관련 용어
        ['api서버', 'API서버', 'rest', 'graphql', 'grpc', '레스트', '그래프큐엘'].forEach(term => {
            this.serverTermMapping.set(term.toLowerCase(), 'api_server');
        });

        // 데이터베이스 관련 용어
        ['데이터베이스', 'DB', 'mysql', 'postgresql', 'mongodb', '마이에스큐엘', '포스트그레', '몽고디비'].forEach(term => {
            this.serverTermMapping.set(term.toLowerCase(), 'database');
        });

        // 캐시서버 관련 용어
        ['캐시서버', 'redis', 'memcached', '레디스', '멤캐시드'].forEach(term => {
            this.serverTermMapping.set(term.toLowerCase(), 'cache_server');
        });

        // 애플리케이션서버 관련 용어
        ['앱서버', '애플리케이션서버', 'nodejs', 'java', 'python', '노드제이에스', '자바', '파이썬'].forEach(term => {
            this.serverTermMapping.set(term.toLowerCase(), 'app_server');
        });

        // 프록시서버 관련 용어
        ['프록시서버', 'haproxy', '로드밸런서', '부하분산'].forEach(term => {
            this.serverTermMapping.set(term.toLowerCase(), 'proxy_server');
        });
    }

    /**
     * 메트릭 타입 매핑 초기화
     */
    private initializeMetricTypeMapping(): void {
        // CPU 관련 용어
        ['cpu', 'CPU', '씨피유', '프로세서', '연산', '처리', '코어', '중앙처리장치'].forEach(term => {
            this.metricTermMapping.set(term.toLowerCase(), 'cpu');
        });

        // 메모리 관련 용어
        ['메모리', 'memory', 'ram', 'RAM', '저장공간', '용량', '램'].forEach(term => {
            this.metricTermMapping.set(term.toLowerCase(), 'memory');
        });

        // 네트워크 관련 용어
        ['네트워크', 'network', '대역폭', '통신', '연결', '트래픽', '네트웍'].forEach(term => {
            this.metricTermMapping.set(term.toLowerCase(), 'network');
        });

        // 디스크 관련 용어
        ['디스크', 'disk', '스토리지', '하드디스크', 'HDD', 'SSD', '저장장치'].forEach(term => {
            this.metricTermMapping.set(term.toLowerCase(), 'disk');
        });

        // 응답시간 관련 용어
        ['응답시간', '지연시간', 'latency', '레이턴시', '응답속도', '반응시간'].forEach(term => {
            this.metricTermMapping.set(term.toLowerCase(), 'response_time');
        });

        // 처리량 관련 용어
        ['처리량', '처리속도', 'throughput', '쓰루풋', 'TPS', 'QPS'].forEach(term => {
            this.metricTermMapping.set(term.toLowerCase(), 'throughput');
        });

        // 연결 관련 용어
        ['연결', 'connection', '세션', '접속', '커넥션'].forEach(term => {
            this.metricTermMapping.set(term.toLowerCase(), 'connection');
        });
    }

    /**
     * 상태 타입 매핑 초기화
     */
    private initializeStatusTypeMapping(): void {
        // 정상 상태 관련 용어
        ['정상', 'normal', 'healthy', 'ok', '양호', '건강', '괜찮', '멀쩡'].forEach(term => {
            this.statusTermMapping.set(term.toLowerCase(), 'normal');
        });

        // 경고 상태 관련 용어
        ['경고', 'warning', 'caution', '주의', '알림', '워닝'].forEach(term => {
            this.statusTermMapping.set(term.toLowerCase(), 'warning');
        });

        // 위험 상태 관련 용어
        ['위험', 'critical', 'danger', '심각', '긴급', '크리티컬', '치명적'].forEach(term => {
            this.statusTermMapping.set(term.toLowerCase(), 'critical');
        });
    }

    /**
     * 동의어 매핑 초기화
     */
    private initializeSynonymMapping(): void {
        // 동작 관련 동의어
        this.synonymMapping.set('확인', '체크');
        this.synonymMapping.set('분석', '검토');
        this.synonymMapping.set('모니터링', '감시');
        this.synonymMapping.set('해결', '복구');
        this.synonymMapping.set('문제', '장애');

        // 상태 관련 동의어
        this.synonymMapping.set('느림', '지연');
        this.synonymMapping.set('빠름', '고속');
        this.synonymMapping.set('높음', '상승');
        this.synonymMapping.set('낮음', '하락');
    }

    /**
     * 의도 분석 수행
     * 기존 KoreanNLUProcessor의 analyzeIntent 확장
     */
    async analyzeIntent(query: string): Promise<KoreanNLUResult> {
        const startTime = Date.now();

        try {
            // 1. 쿼리 정규화
            const normalizedQuery = this.normalizeQuery(query);

            // 2. 서버 용어 추출
            const serverTerms = this.extractServerTerms(normalizedQuery);

            // 3. 도메인 매핑
            const domainMapping = this.mapDomainTerms([
                ...serverTerms.serverTypes,
                ...serverTerms.metricTypes,
                ...serverTerms.statusTypes
            ]);

            // 4. 의도 분류 (기존 IntentClassifier 로직 활용)
            const intent = this.classifyIntent(normalizedQuery, serverTerms);

            const result: KoreanNLUResult = {
                intent,
                confidence: domainMapping.confidence,
                serverType: domainMapping.serverType !== 'unknown' ? domainMapping.serverType : undefined,
                metricType: domainMapping.metricType !== 'unknown' ? domainMapping.metricType : undefined,
                statusType: domainMapping.statusType !== 'unknown' ? domainMapping.statusType : undefined,
                processedQuery: normalizedQuery,
                originalQuery: query,
                processingTime: Date.now() - startTime
            };

            return result;

        } catch (error) {
            throw new NLPProcessingError(
                `의도 분석 실패: ${error instanceof Error ? error.message : String(error)}`,
                query,
                'analysis'
            );
        }
    }

    /**
     * 한국어 쿼리 정규화
     * 조사 제거, 높임말 정규화, 동의어 치환
     */
    normalizeQuery(query: string): string {
        try {
            let normalized = query.toLowerCase();

            // 1. 조사 제거 (은/는, 이/가, 을/를, 의, 에, 에서, 로/으로)
            normalized = normalized
                .replace(/[이가](\s|$)/g, ' ')
                .replace(/[은는](\s|$)/g, ' ')
                .replace(/[을를](\s|$)/g, ' ')
                .replace(/의(\s|$)/g, ' ')
                .replace(/에서(\s|$)/g, ' ')
                .replace(/에(\s|$)/g, ' ')
                .replace(/(으)?로(\s|$)/g, ' ');

            // 2. 높임말 정규화
            normalized = normalized
                .replace(/해주세요|하십시오|해주시기|하시기/g, '해줘')
                .replace(/확인해주세요/g, '확인해줘')
                .replace(/알려주세요/g, '알려줘')
                .replace(/분석해주세요/g, '분석해줘')
                .replace(/검토해주세요/g, '검토해줘');

            // 3. 동의어 치환
            for (const [original, synonym] of this.synonymMapping.entries()) {
                const regex = new RegExp(`\\b${original}\\b`, 'g');
                normalized = normalized.replace(regex, synonym);
            }

            // 4. 공백 정리
            normalized = normalized.replace(/\s+/g, ' ').trim();

            return normalized;

        } catch (error) {
            throw new NLPProcessingError(
                `쿼리 정규화 실패: ${error instanceof Error ? error.message : String(error)}`,
                query,
                'normalization'
            );
        }
    }

    /**
     * 서버 관련 용어 추출
     */
    extractServerTerms(query: string): ServerTerms {
        try {
            const words = query.split(/\s+/);
            const serverTypes: string[] = [];
            const metricTypes: string[] = [];
            const statusTypes: string[] = [];
            const actionTypes: string[] = [];
            const unknownTerms: string[] = [];

            for (const word of words) {
                const lowerWord = word.toLowerCase();

                if (this.serverTermMapping.has(lowerWord)) {
                    serverTypes.push(word);
                } else if (this.metricTermMapping.has(lowerWord)) {
                    metricTypes.push(word);
                } else if (this.statusTermMapping.has(lowerWord)) {
                    statusTypes.push(word);
                } else if (this.isActionTerm(lowerWord)) {
                    actionTypes.push(word);
                } else if (this.isUnknownTerm(lowerWord)) {
                    unknownTerms.push(word);
                }
            }

            return {
                serverTypes,
                metricTypes,
                statusTypes,
                actionTypes,
                unknownTerms
            };

        } catch (error) {
            throw new NLPProcessingError(
                `서버 용어 추출 실패: ${error instanceof Error ? error.message : String(error)}`,
                query,
                'tokenization'
            );
        }
    }

    /**
     * 도메인 용어 매핑
     */
    mapDomainTerms(terms: string[]): DomainMapping {
        try {
            let serverType: ServerType = 'unknown';
            let metricType: MetricType = 'unknown';
            let statusType: StatusType = 'unknown';
            let totalConfidence = 0;
            const mappingDetails: DomainMapping['mappingDetails'] = [];

            for (const term of terms) {
                const lowerTerm = term.toLowerCase();
                let mapped = false;

                // 서버 타입 매핑
                if (this.serverTermMapping.has(lowerTerm)) {
                    serverType = this.serverTermMapping.get(lowerTerm)!;
                    mappingDetails.push({
                        originalTerm: term,
                        mappedTerm: serverType,
                        mappingType: 'exact'
                    });
                    totalConfidence += 0.9;
                    mapped = true;
                }

                // 메트릭 타입 매핑
                if (this.metricTermMapping.has(lowerTerm)) {
                    metricType = this.metricTermMapping.get(lowerTerm)!;
                    mappingDetails.push({
                        originalTerm: term,
                        mappedTerm: metricType,
                        mappingType: 'exact'
                    });
                    totalConfidence += 0.9;
                    mapped = true;
                }

                // 상태 타입 매핑
                if (this.statusTermMapping.has(lowerTerm)) {
                    statusType = this.statusTermMapping.get(lowerTerm)!;
                    mappingDetails.push({
                        originalTerm: term,
                        mappedTerm: statusType,
                        mappingType: 'exact'
                    });
                    totalConfidence += 0.8;
                    mapped = true;
                }

                // 퍼지 매칭 시도 (유사도 기반)
                if (!mapped) {
                    const fuzzyMatch = this.findFuzzyMatch(lowerTerm);
                    if (fuzzyMatch) {
                        mappingDetails.push({
                            originalTerm: term,
                            mappedTerm: fuzzyMatch.mappedTerm,
                            mappingType: 'fuzzy'
                        });
                        totalConfidence += fuzzyMatch.confidence;
                    }
                }
            }

            const confidence = terms.length > 0 ? totalConfidence / terms.length : 0;

            return {
                serverType,
                metricType,
                statusType,
                confidence: Math.min(confidence, 1.0),
                mappingDetails
            };

        } catch (error) {
            throw new NLPProcessingError(
                `도메인 매핑 실패: ${error instanceof Error ? error.message : String(error)}`,
                terms.join(' '),
                'mapping'
            );
        }
    }

    /**
     * 의도 분류
     * 기존 IntentClassifier 로직 활용
     */
    private classifyIntent(query: string, serverTerms: ServerTerms): string {
        // 서버 상태 확인 의도
        if (/상태|체크|확인|헬스/.test(query)) {
            return 'server_status_check';
        }

        // 성능 분석 의도
        if (/성능|분석|느림|빠름|최적화/.test(query)) {
            return 'performance_analysis';
        }

        // 로그 분석 의도
        if (/로그|에러|오류|예외/.test(query)) {
            return 'log_analysis';
        }

        // 장애 대응 의도
        if (/장애|문제|해결|복구|대응/.test(query)) {
            return 'troubleshooting';
        }

        // 리소스 모니터링 의도
        if (serverTerms.metricTypes.length > 0) {
            return 'resource_monitoring';
        }

        return 'general_inquiry';
    }

    /**
     * 액션 용어 판별
     */
    private isActionTerm(term: string): boolean {
        const actionTerms = ['확인', '체크', '분석', '검토', '모니터링', '감시', '해결', '복구', '대응'];
        return actionTerms.includes(term);
    }

    /**
     * 알 수 없는 용어 판별
     */
    private isUnknownTerm(term: string): boolean {
        // 일반적인 불용어나 조사가 아닌 경우 알 수 없는 용어로 분류
        const stopWords = ['그', '이', '저', '그것', '이것', '저것', '및', '또는', '그리고'];
        return !stopWords.includes(term) && term.length > 1;
    }

    /**
     * 퍼지 매칭 수행
     */
    private findFuzzyMatch(term: string): { mappedTerm: string; confidence: number } | null {
        // 레벤슈타인 거리 기반 유사도 계산
        const allTerms = [
            ...Array.from(this.serverTermMapping.keys()),
            ...Array.from(this.metricTermMapping.keys()),
            ...Array.from(this.statusTermMapping.keys())
        ];

        let bestMatch: { term: string; distance: number } | null = null;

        for (const mappedTerm of allTerms) {
            const distance = this.levenshteinDistance(term, mappedTerm);
            const similarity = 1 - (distance / Math.max(term.length, mappedTerm.length));

            if (similarity > 0.7 && (!bestMatch || distance < bestMatch.distance)) {
                bestMatch = { term: mappedTerm, distance };
            }
        }

        if (bestMatch) {
            const confidence = 1 - (bestMatch.distance / Math.max(term.length, bestMatch.term.length));
            return {
                mappedTerm: bestMatch.term,
                confidence: confidence * 0.6 // 퍼지 매칭은 신뢰도를 낮춤
            };
        }

        return null;
    }

    /**
     * 레벤슈타인 거리 계산
     */
    private levenshteinDistance(str1: string, str2: string): number {
        const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

        for (let i = 0; i <= str1.length; i++) {
            matrix[0][i] = i;
        }

        for (let j = 0; j <= str2.length; j++) {
            matrix[j][0] = j;
        }

        for (let j = 1; j <= str2.length; j++) {
            for (let i = 1; i <= str1.length; i++) {
                const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
                matrix[j][i] = Math.min(
                    matrix[j][i - 1] + 1,     // deletion
                    matrix[j - 1][i] + 1,     // insertion
                    matrix[j - 1][i - 1] + indicator // substitution
                );
            }
        }

        return matrix[str2.length][str1.length];
    }
} 