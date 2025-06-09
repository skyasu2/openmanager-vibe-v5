/**
 * 🛠️ AI Engine Utils
 * 
 * AI 엔진 공통 유틸리티
 * - 메트릭 수집
 * - 문서 검색
 * - 키워드 처리
 * - 토큰화 및 텍스트 처리
 */

import { realMCPClient } from '../../../mcp/real-mcp-client';
import {
    SystemMetrics,
    DocumentSearchResult,
    AIEngineUtils as IAIEngineUtils,
    KOREAN_COMMON_WORDS,
    ENGLISH_COMMON_WORDS
} from '../types/AIEngineTypes';

export class AIEngineUtils implements IAIEngineUtils {
    private static instance: AIEngineUtils;
    private queryIdCounter = 0;

    /**
     * 싱글톤 인스턴스 조회
     */
    static getInstance(): AIEngineUtils {
        if (!AIEngineUtils.instance) {
            AIEngineUtils.instance = new AIEngineUtils();
        }
        return AIEngineUtils.instance;
    }

    /**
     * 고유 쿼리 ID 생성
     */
    generateQueryId(): string {
        const timestamp = Date.now();
        const counter = (++this.queryIdCounter).toString().padStart(4, '0');
        return `ai_query_${timestamp}_${counter}`;
    }

    /**
     * 시스템 메트릭 수집
     */
    async collectSystemMetrics(serverIds?: string[]): Promise<SystemMetrics> {
        try {
            console.log('📊 시스템 메트릭 수집 중...');

            // MCP를 통한 실제 메트릭 수집
            const mcpMetrics = await realMCPClient.getSystemMetrics();

            if (mcpMetrics.success && mcpMetrics.data) {
                return {
                    servers: mcpMetrics.data.servers || {},
                    global_stats: mcpMetrics.data.global_stats || {},
                    alerts: mcpMetrics.data.alerts || [],
                    timestamp: new Date().toISOString()
                };
            }

            // 폴백: 시뮬레이션 데이터
            console.log('⚠️ 실제 메트릭 수집 실패, 시뮬레이션 데이터 사용');
            return this.generateMockMetrics(serverIds);

        } catch (error: any) {
            console.error('메트릭 수집 실패:', error);
            return this.generateMockMetrics(serverIds);
        }
    }

    /**
     * 모의 메트릭 생성
     */
    private generateMockMetrics(serverIds?: string[]): SystemMetrics {
        const servers: Record<string, Record<string, number[]>> = {};
        const targetServers = serverIds || ['server-001', 'server-002', 'server-003'];

        targetServers.forEach(serverId => {
            servers[serverId] = {
                cpu_usage: this.generateRandomSeries(24, 20, 80),
                memory_usage: this.generateRandomSeries(24, 30, 90),
                disk_usage: this.generateRandomSeries(24, 40, 85),
                network_io: this.generateRandomSeries(24, 100, 1000),
                response_time: this.generateRandomSeries(24, 50, 500),
                error_rate: this.generateRandomSeries(24, 0, 5)
            };
        });

        return {
            servers,
            global_stats: {
                total_servers: targetServers.length,
                healthy_servers: targetServers.length - 1,
                total_requests: 15420,
                average_response_time: 245
            },
            alerts: [
                {
                    type: 'warning',
                    severity: 'medium',
                    message: 'Server CPU usage above 80%',
                    server: targetServers[0],
                    timestamp: new Date().toISOString()
                }
            ],
            timestamp: new Date().toISOString()
        };
    }

    /**
     * 랜덤 시계열 데이터 생성
     */
    private generateRandomSeries(count: number, min: number, max: number): number[] {
        const series: number[] = [];
        let current = min + (max - min) * Math.random();

        for (let i = 0; i < count; i++) {
            // 트렌드와 노이즈 추가
            const trend = (Math.random() - 0.5) * 0.1;
            const noise = (Math.random() - 0.5) * (max - min) * 0.2;
            current = Math.max(min, Math.min(max, current + trend * (max - min) + noise));
            series.push(Math.round(current * 100) / 100);
        }

        return series;
    }

    /**
     * 키워드 기반 문서 검색
     */
    async searchDocumentsByKeywords(keywords: string[]): Promise<DocumentSearchResult[]> {
        try {
            console.log('🔍 문서 검색 중:', keywords);

            // 실제 구현에서는 벡터 DB나 검색 엔진 사용
            const mockDocuments = this.generateMockDocuments();

            return mockDocuments
                .map(doc => ({
                    ...doc,
                    relevance_score: this.calculateKeywordRelevance(doc.content, keywords),
                    keywords_matched: keywords.filter(keyword =>
                        doc.content.toLowerCase().includes(keyword.toLowerCase()) ||
                        doc.title.toLowerCase().includes(keyword.toLowerCase())
                    )
                }))
                .filter(doc => doc.relevance_score > 0)
                .sort((a, b) => b.relevance_score - a.relevance_score)
                .slice(0, 10); // 상위 10개만 반환

        } catch (error: any) {
            console.error('문서 검색 실패:', error);
            return [];
        }
    }

    /**
     * 모의 문서 생성
     */
    private generateMockDocuments(): Omit<DocumentSearchResult, 'relevance_score' | 'keywords_matched'>[] {
        return [
            {
                id: 'doc-001',
                title: '서버 모니터링 가이드',
                content: 'CPU, 메모리, 디스크 사용량을 모니터링하는 방법과 임계값 설정에 대한 가이드입니다. 장애 예측과 성능 최적화 방법을 다룹니다.',
                source: 'documentation',
                last_updated: '2025-06-08T10:00:00Z'
            },
            {
                id: 'doc-002',
                title: '장애 대응 매뉴얼',
                content: '시스템 장애 발생 시 대응 절차와 복구 방법을 설명합니다. 우선순위별 대응 방안과 에스컬레이션 프로세스를 포함합니다.',
                source: 'manual',
                last_updated: '2025-06-07T15:30:00Z'
            },
            {
                id: 'doc-003',
                title: '성능 최적화 가이드',
                content: '시스템 성능 향상을 위한 튜닝 방법과 최적화 기법을 설명합니다. 병목 지점 식별과 해결 방안을 다룹니다.',
                source: 'guide',
                last_updated: '2025-06-06T09:15:00Z'
            },
            {
                id: 'doc-004',
                title: 'AI 예측 모델 활용법',
                content: '머신러닝 기반 장애 예측 모델의 활용 방법과 해석 방법을 설명합니다. 예측 정확도 향상 방안을 포함합니다.',
                source: 'technical',
                last_updated: '2025-06-05T14:20:00Z'
            },
            {
                id: 'doc-005',
                title: '실시간 알림 설정',
                content: '시스템 이상 상황 발생 시 실시간 알림을 받기 위한 설정 방법을 설명합니다. 알림 채널과 조건 설정을 다룹니다.',
                source: 'configuration',
                last_updated: '2025-06-04T11:45:00Z'
            }
        ];
    }

    /**
     * 키워드 관련성 점수 계산
     */
    calculateKeywordRelevance(content: string, keywords: string[]): number {
        if (keywords.length === 0) return 0;

        const normalizedContent = content.toLowerCase();
        let totalScore = 0;
        let matchedKeywords = 0;

        keywords.forEach(keyword => {
            const normalizedKeyword = keyword.toLowerCase();

            if (this.isCommonWord(normalizedKeyword)) {
                return; // 일반적인 단어는 점수에 포함하지 않음
            }

            // 정확한 매치
            const exactMatches = (normalizedContent.match(new RegExp(`\\b${normalizedKeyword}\\b`, 'g')) || []).length;
            if (exactMatches > 0) {
                totalScore += exactMatches * 2; // 정확한 매치는 2점
                matchedKeywords++;
            }

            // 부분 매치
            const partialMatches = (normalizedContent.match(new RegExp(normalizedKeyword, 'g')) || []).length;
            if (partialMatches > exactMatches) {
                totalScore += (partialMatches - exactMatches) * 1; // 부분 매치는 1점
                matchedKeywords++;
            }
        });

        // 매치된 키워드 비율로 보정
        const keywordCoverage = matchedKeywords / keywords.length;
        return totalScore * keywordCoverage;
    }

    /**
     * 일반적인 단어 확인
     */
    isCommonWord(word: string): boolean {
        const normalizedWord = word.toLowerCase();

        return (
            KOREAN_COMMON_WORDS.includes(normalizedWord as any) ||
            ENGLISH_COMMON_WORDS.includes(normalizedWord as any) ||
            normalizedWord.length <= 2 ||
            /^\d+$/.test(normalizedWord) // 숫자만으로 구성된 단어
        );
    }

    /**
     * 간단한 토큰화
     */
    simpleTokenize(text: string): string[] {
        return text
            .toLowerCase()
            .replace(/[^\w\s가-힣]/g, ' ') // 특수문자 제거 (한글 포함)
            .split(/\s+/)
            .filter(token => token.length > 1 && !this.isCommonWord(token));
    }

    /**
     * 텍스트에서 키워드 추출
     */
    extractKeywords(text: string, maxKeywords: number = 10): string[] {
        const tokens = this.simpleTokenize(text);
        const frequency: Record<string, number> = {};

        // 단어 빈도 계산
        tokens.forEach(token => {
            frequency[token] = (frequency[token] || 0) + 1;
        });

        // 빈도 순으로 정렬하여 상위 키워드 반환
        return Object.entries(frequency)
            .sort(([, a], [, b]) => b - a)
            .slice(0, maxKeywords)
            .map(([word]) => word);
    }

    /**
     * 텍스트 유사도 계산 (자카드 유사도)
     */
    calculateTextSimilarity(text1: string, text2: string): number {
        const tokens1 = new Set(this.simpleTokenize(text1));
        const tokens2 = new Set(this.simpleTokenize(text2));

        const intersection = new Set([...tokens1].filter(x => tokens2.has(x)));
        const union = new Set([...tokens1, ...tokens2]);

        return union.size === 0 ? 0 : intersection.size / union.size;
    }

    /**
     * 문자열 해시 생성 (간단한 해시 함수)
     */
    generateHash(text: string): string {
        let hash = 0;
        for (let i = 0; i < text.length; i++) {
            const char = text.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // 32비트 정수로 변환
        }
        return Math.abs(hash).toString(36);
    }

    /**
     * 시간 포맷팅
     */
    formatDuration(milliseconds: number): string {
        if (milliseconds < 1000) {
            return `${milliseconds}ms`;
        } else if (milliseconds < 60000) {
            return `${(milliseconds / 1000).toFixed(2)}s`;
        } else {
            return `${(milliseconds / 60000).toFixed(2)}m`;
        }
    }

    /**
     * 메모리 사용량 포맷팅
     */
    formatMemoryUsage(bytes: number): string {
        const units = ['B', 'KB', 'MB', 'GB'];
        let size = bytes;
        let unitIndex = 0;

        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }

        return `${size.toFixed(2)} ${units[unitIndex]}`;
    }

    /**
     * 퍼센티지 포맷팅
     */
    formatPercentage(value: number, decimals: number = 1): string {
        return `${(value * 100).toFixed(decimals)}%`;
    }

    /**
     * 안전한 JSON 파싱
     */
    safeJsonParse<T = any>(jsonString: string, defaultValue: T): T {
        try {
            return JSON.parse(jsonString);
        } catch {
            return defaultValue;
        }
    }

    /**
     * 딥 클론 (간단한 구현)
     */
    deepClone<T>(obj: T): T {
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }

        if (obj instanceof Date) {
            return new Date(obj.getTime()) as T;
        }

        if (obj instanceof Array) {
            return obj.map(item => this.deepClone(item)) as T;
        }

        if (typeof obj === 'object') {
            const cloned = {} as T;
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    cloned[key] = this.deepClone(obj[key]);
                }
            }
            return cloned;
        }

        return obj;
    }
}

// 싱글톤 인스턴스 익스포트
export const aiEngineUtils = AIEngineUtils.getInstance(); 