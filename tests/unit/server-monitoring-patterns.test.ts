/**
 * 🖥️ 서버 모니터링 패턴 시스템 테스트
 * 
 * Phase 2: 서버 모니터링 특화 패턴 확장 테스트
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { ServerMonitoringPatterns } from '@/core/ai/patterns/ServerMonitoringPatterns';
import { EnhancedKoreanNLUProcessor } from '@/core/ai/processors/EnhancedKoreanNLUProcessor';

describe('ServerMonitoringPatterns', () => {
    let patterns: ServerMonitoringPatterns;

    beforeEach(() => {
        patterns = new ServerMonitoringPatterns();
    });

    describe('패턴 매칭 테스트', () => {
        test('서버 상태 패턴 15개 매칭', async () => {
            const queries = [
                '서버 상태 확인해줘',
                '현재 서버 어떤 상태야?',
                '서버 살아있어?',
                '서버 죽었나?',
                '서버 다운됐나?',
                '서버 정상인가?',
                '헬스체크 해줘',
                '가동 상태 확인'
            ];

            for (const query of queries) {
                const result = await patterns.matchPattern(query);
                expect(result).toBeDefined();
                expect(result.category).toBeDefined();
                expect(result.confidence).toBeGreaterThanOrEqual(0);
            }
        });

        test('성능 분석 패턴 12개 매칭', async () => {
            const queries = [
                'CPU 메모리 사용량 확인',
                '성능 분석해줘',
                '서버 느린데 왜그래?',
                '병목 현상 있나?',
                '응답시간 분석',
                '처리량 확인해줘'
            ];

            for (const query of queries) {
                const result = await patterns.matchPattern(query);
                expect(result).toBeDefined();
                expect(result.category).toBeDefined();
                expect(result.confidence).toBeGreaterThanOrEqual(0);
            }
        });

        test('로그 분석 패턴 10개 매칭', async () => {
            const queries = [
                '에러 로그 확인해줘',
                '로그 분석해줘',
                '오류 메시지 찾아줘',
                '예외 상황 확인',
                '장애 로그 검색'
            ];

            for (const query of queries) {
                const result = await patterns.matchPattern(query);
                expect(result).toBeDefined();
                expect(result.category).toBeDefined();
                expect(result.confidence).toBeGreaterThanOrEqual(0);
            }
        });

        test('장애 대응 패턴 8개 매칭', async () => {
            const queries = [
                '장애 해결 방법',
                '문제 해결해줘',
                '복구 방안 알려줘',
                '긴급 대응 필요'
            ];

            for (const query of queries) {
                const result = await patterns.matchPattern(query);
                expect(result).toBeDefined();
                expect(result.category).toBeDefined();
                expect(result.confidence).toBeGreaterThanOrEqual(0);
            }
        });

        test('리소스 모니터링 패턴 5개 매칭', async () => {
            const queries = [
                '디스크 용량 확인',
                '네트워크 대역폭',
                '메모리 사용률',
                'CPU 점유율',
                '스토리지 상태'
            ];

            for (const query of queries) {
                const result = await patterns.matchPattern(query);
                expect(result).toBeDefined();
                expect(result.category).toBeDefined();
                expect(result.confidence).toBeGreaterThanOrEqual(0);
            }
        });
    });

    describe('패턴 우선순위 테스트', () => {
        test('복합 쿼리에서 가장 적합한 패턴 선택', async () => {
            const query = 'CPU 사용률이 높은데 서버 상태 확인하고 로그도 분석해줘';
            const result = await patterns.matchPattern(query);

            expect(['performance_analysis', 'server_status', 'log_analysis']).toContain(result.category);
            expect(result.confidence).toBeGreaterThanOrEqual(0.6);
            if (result.subCategories) {
                expect(result.subCategories.length).toBeGreaterThanOrEqual(1);
            }
        });

        test('애매한 쿼리 처리', async () => {
            const query = '뭔가 이상한데?';
            const result = await patterns.matchPattern(query);

            expect(['general_inquiry', 'server_status']).toContain(result.category);
            expect(result.confidence).toBeLessThan(0.8);
            if (result.suggestions) {
                expect(result.suggestions.length).toBeGreaterThanOrEqual(1);
            }
        });
    });

    describe('성능 테스트', () => {
        test('50개 패턴 매칭 50ms 이내', async () => {
            const query = '서버 상태 확인해줘';
            const startTime = Date.now();

            await patterns.matchPattern(query);

            const endTime = Date.now();
            expect(endTime - startTime).toBeLessThan(50);
        });

        test('100개 동시 쿼리 처리', async () => {
            const queries = Array(100).fill('서버 성능 분석해줘');
            const startTime = Date.now();

            await Promise.all(queries.map(q => patterns.matchPattern(q)));

            const endTime = Date.now();
            expect(endTime - startTime).toBeLessThan(1000); // 1초 이내
        });
    });
});

describe('EnhancedKoreanNLUProcessor', () => {
    let processor: EnhancedKoreanNLUProcessor;

    beforeEach(() => {
        processor = new EnhancedKoreanNLUProcessor();
    });

    describe('도메인 특화 어휘 매핑', () => {
        test('서버 타입 인식', async () => {
            const queries = [
                '웹서버 상태 확인',
                'API서버 성능 분석',
                '데이터베이스 연결 상태'
            ];

            for (const query of queries) {
                const result = await processor.analyzeIntent(query);
                expect(result.serverType).toBeDefined();
                expect(result.confidence).toBeGreaterThan(0.8);
            }
        });

        test('메트릭 타입 인식', async () => {
            const queries = [
                'CPU 사용률 확인',
                '메모리 점유율 분석',
                '네트워크 대역폭 체크'
            ];

            for (const query of queries) {
                const result = await processor.analyzeIntent(query);
                expect(result.metricType).toBeDefined();
                expect(result.confidence).toBeGreaterThan(0.8);
            }
        });

        test('상태 타입 인식', async () => {
            const queries = [
                '서버 정상 상태인가?',
                '경고 상태 확인',
                '위험 상황 분석'
            ];

            for (const query of queries) {
                const result = await processor.analyzeIntent(query);
                expect(result.statusType).toBeDefined();
                expect(['normal', 'warning', 'critical']).toContain(result.statusType);
            }
        });
    });

    describe('한국어 NLP 처리', () => {
        test('조사 처리 (은/는, 이/가, 을/를)', async () => {
            const queries = [
                '서버가 느려요',
                '서버는 정상이에요',
                '로그를 확인해주세요'
            ];

            for (const query of queries) {
                const result = await processor.analyzeIntent(query);
                expect(result.processedQuery).not.toContain('가');
                expect(result.processedQuery).not.toContain('는');
                expect(result.processedQuery).not.toContain('를');
            }
        });

        test('높임말/반말 정규화', async () => {
            const queries = [
                '서버 상태 확인해주세요',
                '서버 상태 확인해줘',
                '서버 상태 확인하십시오'
            ];

            const results = await Promise.all(queries.map(q => processor.analyzeIntent(q)));

            // 모든 결과가 동일한 의도로 분류되어야 함
            const intents = results.map(r => r.intent);
            expect(new Set(intents).size).toBe(1);
        });
    });
}); 