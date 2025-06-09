/**
 * 🧠 NLP Processor
 * 
 * 자연어 처리 통합 관리
 * - Intent 감지
 * - 언어 감지
 * - 키워드 추출
 * - 쿼리 분류
 */

import { aiEngineUtils } from '../utils/AIEngineUtils';
import {
    NLPProcessor as INLPProcessor,
    NLPResult,
    IntentType,
    QueryType,
    AI_ENGINE_CONSTANTS
} from '../types/AIEngineTypes';

export class NLPProcessor implements INLPProcessor {
    private static instance: NLPProcessor;

    /**
     * 싱글톤 인스턴스 조회
     */
    static getInstance(): NLPProcessor {
        if (!NLPProcessor.instance) {
            NLPProcessor.instance = new NLPProcessor();
        }
        return NLPProcessor.instance;
    }

    /**
     * 쿼리 전체 처리
     */
    async processQuery(query: string): Promise<NLPResult> {
        try {
            const keywords = this.extractKeywords(query);
            const intent = this.detectIntent(query);
            const language = this.detectLanguage(query);
            const queryType = this.classifyQueryType(query);

            return {
                intent,
                confidence: this.calculateConfidence(query, intent),
                entities: this.extractEntities(query),
                keywords,
                language,
                sentiment: this.analyzeSentiment(query),
                query_type: queryType,
            };
        } catch (error: any) {
            console.warn('⚠️ NLP 처리 실패:', error);
            return this.createFallbackResult(query);
        }
    }

    /**
     * Intent 감지
     */
    detectIntent(query: string): string {
        const normalizedQuery = query.toLowerCase();

        // 문제 해결 관련 키워드
        const troubleshootingKeywords = [
            '문제', '오류', '에러', '장애', '문제점', '이상', '실패', '안됨', '작동', '불가',
            'error', 'problem', 'issue', 'trouble', 'fail', 'not working', 'broken'
        ];

        // 예측 관련 키워드
        const predictionKeywords = [
            '예측', '예상', '전망', '미래', '언제', '얼마나', '가능성', '확률',
            'predict', 'forecast', 'future', 'when', 'will', 'probability', 'likely'
        ];

        // 분석 관련 키워드
        const analysisKeywords = [
            '분석', '통계', '데이터', '지표', '성능', '결과', '추세', '패턴',
            'analysis', 'analyze', 'data', 'statistics', 'performance', 'trend', 'pattern'
        ];

        // 모니터링 관련 키워드
        const monitoringKeywords = [
            '모니터링', '상태', '확인', '감시', '현재', '실시간', '상황',
            'monitoring', 'status', 'check', 'current', 'realtime', 'live', 'now'
        ];

        // 보고서 관련 키워드
        const reportingKeywords = [
            '보고서', '리포트', '요약', '정리', '문서', '기록',
            'report', 'summary', 'document', 'generate', 'create'
        ];

        // 성능 관련 키워드
        const performanceKeywords = [
            '성능', '속도', '응답', '처리', '최적화', '개선', '느림', '빠름',
            'performance', 'speed', 'response', 'optimization', 'slow', 'fast', 'latency'
        ];

        // 키워드 매칭 점수 계산
        const scores = {
            troubleshooting: this.calculateKeywordScore(normalizedQuery, troubleshootingKeywords),
            prediction: this.calculateKeywordScore(normalizedQuery, predictionKeywords),
            analysis: this.calculateKeywordScore(normalizedQuery, analysisKeywords),
            monitoring: this.calculateKeywordScore(normalizedQuery, monitoringKeywords),
            reporting: this.calculateKeywordScore(normalizedQuery, reportingKeywords),
            performance: this.calculateKeywordScore(normalizedQuery, performanceKeywords)
        };

        // 가장 높은 점수의 intent 반환
        const maxScore = Math.max(...Object.values(scores));
        if (maxScore === 0) {
            return 'general';
        }

        const detectedIntent = Object.entries(scores).find(([, score]) => score === maxScore)?.[0] || 'general';
        return detectedIntent;
    }

    /**
     * 언어 감지
     */
    detectLanguage(query: string): string {
        // 한글 문자 비율 계산
        const koreanChars = query.match(/[가-힣]/g) || [];
        const totalChars = query.replace(/\s/g, '').length;
        const koreanRatio = totalChars > 0 ? koreanChars.length / totalChars : 0;

        return koreanRatio > 0.3 ? 'ko' : 'en';
    }

    /**
     * 쿼리 타입 분류
     */
    classifyQueryType(query: string): string {
        const normalizedQuery = query.toLowerCase();

        const patterns: Record<QueryType, string[]> = {
            status_check: ['상태', '어떻게', '어떤', '현재', 'status', 'how', 'what', 'current'],
            troubleshooting: ['문제', '오류', '안됨', 'error', 'problem', 'not working'],
            prediction: ['예측', '언제', '미래', 'predict', 'when', 'future', 'will'],
            analysis: ['분석', '왜', '원인', 'analyze', 'why', 'cause', 'reason'],
            performance: ['성능', '속도', '느림', 'performance', 'slow', 'fast', 'speed'],
            configuration: ['설정', '구성', '변경', 'config', 'setting', 'change'],
            general: []
        };

        let maxScore = 0;
        let detectedType: QueryType = 'general';

        for (const [type, keywords] of Object.entries(patterns)) {
            const score = this.calculateKeywordScore(normalizedQuery, keywords);
            if (score > maxScore) {
                maxScore = score;
                detectedType = type as QueryType;
            }
        }

        return detectedType;
    }

    /**
     * 키워드 추출
     */
    extractKeywords(query: string): string[] {
        // 기본 키워드 추출
        const basicKeywords = aiEngineUtils.extractKeywords(query, 10);

        // 도메인 특화 키워드 추가
        const domainKeywords = this.extractDomainKeywords(query);

        // 중복 제거 및 결합
        const allKeywords = [...new Set([...basicKeywords, ...domainKeywords])];

        return allKeywords.slice(0, 15); // 최대 15개 키워드
    }

    /**
     * 도메인 특화 키워드 추출
     */
    private extractDomainKeywords(query: string): string[] {
        const domainKeywords: string[] = [];
        const normalizedQuery = query.toLowerCase();

        // 서버 관련 키워드
        const serverKeywords = ['서버', 'server', 'cpu', 'memory', 'disk', 'network'];
        serverKeywords.forEach(keyword => {
            if (normalizedQuery.includes(keyword)) {
                domainKeywords.push(keyword);
            }
        });

        // 메트릭 관련 키워드
        const metricKeywords = ['사용률', 'usage', '응답시간', 'response time', '처리량', 'throughput'];
        metricKeywords.forEach(keyword => {
            if (normalizedQuery.includes(keyword)) {
                domainKeywords.push(keyword);
            }
        });

        // 시간 관련 키워드
        const timeKeywords = ['오늘', '어제', '지금', 'today', 'yesterday', 'now', '실시간', 'realtime'];
        timeKeywords.forEach(keyword => {
            if (normalizedQuery.includes(keyword)) {
                domainKeywords.push(keyword);
            }
        });

        return domainKeywords;
    }

    /**
     * 엔티티 추출
     */
    private extractEntities(query: string): any[] {
        const entities: any[] = [];

        // 서버 ID 패턴 추출
        const serverIdPattern = /server[-_]?\d+/gi;
        const serverMatches = query.match(serverIdPattern);
        if (serverMatches) {
            entities.push({
                type: 'server_id',
                value: serverMatches,
                confidence: 0.9
            });
        }

        // 숫자 패턴 추출 (메트릭 값, 퍼센티지 등)
        const numberPattern = /\d+(?:\.\d+)?%?/g;
        const numberMatches = query.match(numberPattern);
        if (numberMatches) {
            entities.push({
                type: 'numeric_value',
                value: numberMatches,
                confidence: 0.8
            });
        }

        // 시간 패턴 추출
        const timePattern = /(?:오늘|어제|내일|지금|현재|today|yesterday|tomorrow|now|current)/gi;
        const timeMatches = query.match(timePattern);
        if (timeMatches) {
            entities.push({
                type: 'time_reference',
                value: timeMatches,
                confidence: 0.7
            });
        }

        return entities;
    }

    /**
     * 감정 분석 (간단한 구현)
     */
    private analyzeSentiment(query: string): string {
        const positiveWords = ['좋다', '잘', '성공', '정상', 'good', 'well', 'success', 'normal', 'great'];
        const negativeWords = ['나쁘다', '문제', '오류', '실패', 'bad', 'problem', 'error', 'fail', 'wrong'];

        const normalizedQuery = query.toLowerCase();

        const positiveScore = this.calculateKeywordScore(normalizedQuery, positiveWords);
        const negativeScore = this.calculateKeywordScore(normalizedQuery, negativeWords);

        if (positiveScore > negativeScore) {
            return 'positive';
        } else if (negativeScore > positiveScore) {
            return 'negative';
        } else {
            return 'neutral';
        }
    }

    /**
     * 신뢰도 계산
     */
    private calculateConfidence(query: string, intent: string): number {
        if (intent === 'general') {
            return 0.5;
        }

        // 쿼리 길이에 따른 기본 신뢰도
        const baseConfidence = Math.min(0.9, 0.5 + (query.length / 100));

        // 키워드 매칭 정도에 따른 보정
        const keywordBonus = query.split(' ').length > 3 ? 0.1 : 0;

        return Math.min(0.95, baseConfidence + keywordBonus);
    }

    /**
     * 키워드 점수 계산
     */
    private calculateKeywordScore(query: string, keywords: string[]): number {
        return keywords.reduce((score, keyword) => {
            if (query.includes(keyword)) {
                return score + 1;
            }
            return score;
        }, 0);
    }

    /**
     * 폴백 결과 생성
     */
    private createFallbackResult(query: string): NLPResult {
        return {
            intent: 'general',
            confidence: 0.5,
            entities: [],
            keywords: aiEngineUtils.simpleTokenize(query).slice(0, 5),
            language: this.detectLanguage(query),
            sentiment: 'neutral',
            query_type: 'general',
        };
    }

    /**
     * NLP 성능 측정
     */
    async measurePerformance(query: string): Promise<{
        result: NLPResult;
        processing_time: number;
        memory_usage?: number;
    }> {
        const startTime = performance.now();
        const startMemory = process.memoryUsage ? process.memoryUsage().heapUsed : undefined;

        const result = await this.processQuery(query);

        const endTime = performance.now();
        const endMemory = process.memoryUsage ? process.memoryUsage().heapUsed : undefined;

        return {
            result,
            processing_time: endTime - startTime,
            memory_usage: startMemory && endMemory ? endMemory - startMemory : undefined
        };
    }
}

// 싱글톤 인스턴스 익스포트
export const nlpProcessor = NLPProcessor.getInstance(); 