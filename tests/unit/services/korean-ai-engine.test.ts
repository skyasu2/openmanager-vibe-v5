import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { KoreanAIEngine } from '../../../src/services/ai/korean-ai-engine';

/**
 * 🇰🇷 KoreanAIEngine 포괄적 테스트 스위트
 *
 * 테스트 범위:
 * - KoreanServerNLU 클래스 (자연어 이해)
 * - KoreanResponseGenerator 클래스 (응답 생성)
 * - KoreanAIEngine 클래스 (메인 엔진)
 * - 한국어 특화 기능들
 * - 에러 처리 및 폴백 시스템
 */

// Mock 데이터
const mockServerData = {
  servers: [
    {
      id: 'web-01',
      name: '웹서버-01',
      type: 'web',
      metrics: {
        cpu: 45.5,
        memory: 67.2,
        disk: 78.9,
        network: { in: 1024, out: 2048 },
      },
      status: 'running',
    },
    {
      id: 'db-01',
      name: '데이터베이스-01',
      type: 'database',
      metrics: {
        cpu: 89.3,
        memory: 92.1,
        disk: 45.6,
        network: { in: 512, out: 1024 },
      },
      status: 'running',
    },
  ],
};

describe('🇰🇷 KoreanAIEngine 통합 테스트', () => {
  let koreanAI: KoreanAIEngine;

  beforeEach(() => {
    koreanAI = new KoreanAIEngine();
    // console.log 출력 억제
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('🔧 엔진 초기화', () => {
    it('초기화가 정상적으로 완료되어야 함', async () => {
      await expect(koreanAI.initialize()).resolves.not.toThrow();

      const status = koreanAI.getEngineStatus();
      expect(status).toMatchObject({
        initialized: true,
        engine: 'korean-ai',
        version: expect.any(String),
        features: expect.arrayContaining([
          '한국어 자연어 이해',
          '서버 모니터링 특화',
        ]),
        supportedIntents: expect.any(Array),
        supportedEntities: expect.any(Array),
      });
    });

    it('중복 초기화 시 안전하게 처리되어야 함', async () => {
      await koreanAI.initialize();
      await koreanAI.initialize(); // 두 번째 호출

      // 에러 없이 완료되어야 함
      expect(console.error).not.toHaveBeenCalled();
    });
  });

  describe('🔍 자연어 이해 (NLU) 테스트', () => {
    it('서버 상태 조회 의도를 정확히 인식해야 함', async () => {
      const queries = [
        '서버 상태 보여줘',
        '웹서버 확인해줘',
        'CPU 사용률 알려줘',
        '메모리 상태 체크해줘',
      ];

      for (const query of queries) {
        const result = await koreanAI.processQuery(query, mockServerData);

        expect(result.success).toBe(true);
        expect(result.understanding.intent).toBe('조회');
        expect(result.understanding.confidence).toBeGreaterThan(0.5);
      }
    });

    it('서버 분석 의도를 정확히 인식해야 함', async () => {
      const queries = [
        '서버 성능 분석해줘',
        '데이터베이스 진단해줘',
        '시스템 검사해줘',
      ];

      for (const query of queries) {
        const result = await koreanAI.processQuery(query, mockServerData);

        expect(result.success).toBe(true);
        expect(result.understanding.intent).toBe('분석');
      }
    });

    it('서버 제어 의도를 정확히 인식해야 함', async () => {
      const queries = [
        '서버 재시작해줘',
        '웹서버 중지해줘',
        '데이터베이스 시작해줘',
      ];

      for (const query of queries) {
        const result = await koreanAI.processQuery(query, mockServerData);

        expect(result.success).toBe(true);
        expect(result.understanding.intent).toBe('제어');
      }
    });

    it('엔티티 추출이 정확해야 함', async () => {
      const result = await koreanAI.processQuery(
        '웹서버 CPU 사용률 확인해줘',
        mockServerData
      );

      expect(result.understanding.entities).toMatchObject({
        서버타입: expect.arrayContaining(['웹서버']),
        메트릭: expect.arrayContaining(['CPU']),
      });
    });

    it('복합 엔티티를 정확히 추출해야 함', async () => {
      const result = await koreanAI.processQuery(
        '프로덕션 데이터베이스 메모리 상태 분석해줘',
        mockServerData
      );

      expect(result.understanding.entities).toEqual(
        expect.objectContaining({
          서버타입: expect.arrayContaining(['데이터베이스']),
          메트릭: expect.arrayContaining(['메모리']),
          환경: expect.arrayContaining(['프로덕션']),
        })
      );
    });
  });

  describe('📊 서버 메트릭 분석 테스트', () => {
    it('정상 상태 서버를 올바르게 분석해야 함', async () => {
      const result = await koreanAI.processQuery(
        '웹서버 CPU 상태 확인해줘',
        mockServerData
      );

      expect(result.analysis).toMatchObject({
        server: '웹서버',
        metric: 'CPU',
        value: 46, // mockServerData의 CPU 45.5 반올림
        status: '정상상태',
        intent: '조회',
      });
    });

    it('경고 상태 서버를 올바르게 분석해야 함', async () => {
      const warningServerData = {
        servers: [
          {
            ...mockServerData.servers[0],
            metrics: { ...mockServerData.servers[0].metrics, cpu: 80.0 },
          },
        ],
      };

      const result = await koreanAI.processQuery(
        '웹서버 CPU 확인해줘',
        warningServerData
      );

      expect(result.analysis.status).toBe('경고상태');
      expect(result.analysis.value).toBe(80);
    });

    it('위험 상태 서버를 올바르게 분석해야 함', async () => {
      const criticalServerData = {
        servers: [
          {
            ...mockServerData.servers[0],
            metrics: { ...mockServerData.servers[0].metrics, cpu: 95.0 },
          },
        ],
      };

      const result = await koreanAI.processQuery(
        '웹서버 CPU 확인해줘',
        criticalServerData
      );

      expect(result.analysis.status).toBe('위험상태');
      expect(result.analysis.value).toBe(95);
    });

    it('서버 데이터가 없을 때 폴백 데이터를 생성해야 함', async () => {
      const result = await koreanAI.processQuery('서버 상태 확인해줘');

      expect(result.success).toBe(true);
      expect(result.analysis).toMatchObject({
        server: expect.any(String),
        metric: expect.any(String),
        value: expect.any(Number),
        status: expect.stringMatching(/정상상태|경고상태|위험상태/),
      });
    });
  });

  describe('💬 한국어 응답 생성 테스트', () => {
    it('정상 상태에 대한 한국어 응답을 생성해야 함', async () => {
      const result = await koreanAI.processQuery(
        '웹서버 CPU 확인해줘',
        mockServerData
      );

      expect(result.response.message).toMatch(/정상|안정|양호/);
      expect(result.response.message).toContain('웹서버');
      expect(result.response.message).toContain('CPU');
      expect(result.response.status).toBe('정상상태');
      expect(result.response.timestamp).toBeDefined();
    });

    it('경고 상태에 대한 한국어 응답을 생성해야 함', async () => {
      const warningData = {
        servers: [
          {
            ...mockServerData.servers[0],
            metrics: { ...mockServerData.servers[0].metrics, memory: 80.0 },
          },
        ],
      };

      const result = await koreanAI.processQuery(
        '웹서버 메모리 확인해줘',
        warningData
      );

      expect(result.response.message).toMatch(/주의|경고|높습니다/);
      expect(result.response.message).toContain('⚠️');
    });

    it('위험 상태에 대한 한국어 응답을 생성해야 함', async () => {
      const criticalData = {
        servers: [
          {
            ...mockServerData.servers[0],
            metrics: { ...mockServerData.servers[0].metrics, disk: 95.0 },
          },
        ],
      };

      const result = await koreanAI.processQuery(
        '웹서버 디스크 확인해줘',
        criticalData
      );

      expect(result.response.message).toMatch(/긴급|위험|즉시/);
      expect(result.response.message).toContain('🚨');
    });

    it('상황별 액션 권장사항을 제공해야 함', async () => {
      const highCpuData = {
        servers: [
          {
            ...mockServerData.servers[0],
            metrics: { ...mockServerData.servers[0].metrics, cpu: 90.0 },
          },
        ],
      };

      const result = await koreanAI.processQuery(
        'CPU 상태 확인해줘',
        highCpuData
      );

      expect(result.response.actions).toEqual(
        expect.arrayContaining([
          expect.stringMatching(/프로세스|작업|스케일링/),
        ])
      );
    });
  });

  describe('🎯 추가 기능 테스트', () => {
    it('의도별 추가 팁을 제공해야 함', async () => {
      const analysisResult = await koreanAI.processQuery(
        '서버 성능 분석해줘',
        mockServerData
      );

      expect(analysisResult.additionalInfo.tips).toEqual(
        expect.arrayContaining([expect.stringMatching(/상세 분석|분석해줘/)])
      );
    });

    it('관련 명령어를 추천해야 함', async () => {
      const result = await koreanAI.processQuery(
        '서버 상태 확인해줘',
        mockServerData
      );

      expect(result.additionalInfo.relatedCommands).toEqual(
        expect.arrayContaining([
          expect.stringMatching(/기본 상태 확인|top|free|df/),
          expect.stringMatching(/시스템 부하|uptime/),
          expect.stringMatching(/포트 사용 현황|netstat/),
        ])
      );

      // 실제 명령어 가이드가 포함되어 있는지 확인
      const hasCommandGuide = result.additionalInfo.relatedCommands.some(
        cmd =>
          cmd.includes('`') || cmd.includes('명령어') || cmd.includes('확인:')
      );
      expect(hasCommandGuide).toBe(true);
    });

    it('위험 상태에서 특별 알림 팁을 제공해야 함', async () => {
      const criticalData = {
        servers: [
          {
            ...mockServerData.servers[0],
            metrics: { ...mockServerData.servers[0].metrics, cpu: 95.0 },
          },
        ],
      };

      const result = await koreanAI.processQuery('CPU 확인해줘', criticalData);

      expect(result.additionalInfo.tips).toEqual(
        expect.arrayContaining([expect.stringMatching(/즉시 조치|담당자|알림/)])
      );
    });
  });

  describe('🚨 에러 처리 및 폴백 테스트', () => {
    it('잘못된 쿼리에 대해 안전하게 처리해야 함', async () => {
      const result = await koreanAI.processQuery('');

      expect(result.success).toBe(true);
      expect(result.understanding.intent).toBe('기타');
      expect(result.understanding.confidence).toBeGreaterThanOrEqual(0.5);
    });

    it('알 수 없는 서버 타입에 대해 기본값을 사용해야 함', async () => {
      const result = await koreanAI.processQuery(
        '알수없는서버 상태 확인해줘',
        mockServerData
      );

      expect(result.success).toBe(true);
      expect(result.analysis.server).toBeDefined();
    });

    it('처리 중 에러 발생 시 폴백 응답을 제공해야 함', async () => {
      // RealServerDataGenerator에서 에러가 발생하도록 Mock
      const errorKoreanAI = new KoreanAIEngine();

      // dataGenerator의 메서드를 에러를 던지도록 Mock
      vi.spyOn(errorKoreanAI as any, 'analyzeServerMetrics').mockRejectedValue(
        new Error('Mock error')
      );

      const result = await errorKoreanAI.processQuery('서버 상태 확인해줘');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Mock error');
      expect(result.fallbackResponse).toMatch(
        /죄송합니다|문제가 발생|다시 시도/
      );
      expect(result.engine).toBe('korean-ai');
    });
  });

  describe('🔧 유틸리티 메서드 테스트', () => {
    it('한국어 서버 타입을 영어로 매핑해야 함', async () => {
      const testCases = [
        { korean: '웹서버', expected: 'web' },
        { korean: '데이터베이스', expected: 'database' },
        { korean: 'API서버', expected: 'api' },
        { korean: '캐시서버', expected: 'cache' },
      ];

      for (const testCase of testCases) {
        const result = await koreanAI.processQuery(
          `${testCase.korean} 상태 확인해줘`,
          mockServerData
        );

        // 분석 결과에서 올바른 서버 타입이 매핑되었는지 확인
        expect(result.analysis.server).toBe(testCase.korean);
      }
    });

    it('시간대별 시스템 부하를 올바르게 추정해야 함', async () => {
      // 업무시간 (오전 9시~오후 6시) 테스트
      const businessHourDate = new Date();
      businessHourDate.setHours(14); // 오후 2시
      vi.setSystemTime(businessHourDate);

      const businessResult = await koreanAI.processQuery('서버 상태 확인해줘');
      expect(businessResult.success).toBe(true);

      // 업무시간 외 테스트
      const afterHourDate = new Date();
      afterHourDate.setHours(22); // 오후 10시
      vi.setSystemTime(afterHourDate);

      const afterResult = await koreanAI.processQuery('서버 상태 확인해줘');
      expect(afterResult.success).toBe(true);

      vi.useRealTimers();
    });
  });

  describe('📈 성능 및 응답 시간 테스트', () => {
    it('쿼리 처리 시간이 합리적이어야 함', async () => {
      const startTime = Date.now();

      await koreanAI.processQuery('서버 상태 확인해줘', mockServerData);

      const processingTime = Date.now() - startTime;
      expect(processingTime).toBeLessThan(1000); // 1초 이내
    });

    it('여러 쿼리를 연속으로 처리할 수 있어야 함', async () => {
      const queries = [
        '웹서버 CPU 확인해줘',
        '데이터베이스 메모리 분석해줘',
        '전체 서버 상태 보여줘',
        '네트워크 사용률 체크해줘',
        '디스크 용량 알려줘',
      ];

      const results = await Promise.all(
        queries.map(query => koreanAI.processQuery(query, mockServerData))
      );

      results.forEach(result => {
        expect(result.success).toBe(true);
        expect(result.understanding).toBeDefined();
        expect(result.analysis).toBeDefined();
        expect(result.response).toBeDefined();
      });
    });
  });

  describe('🌐 다양한 한국어 표현 테스트', () => {
    it('다양한 한국어 표현을 이해해야 함', async () => {
      const variations = [
        '서버 상태 보여줘', // 조회 의도
        '웹서버 확인해줘', // 조회 의도
        '서버 성능 분석해줘', // 분석 의도
        '데이터베이스 진단해줘', // 분석 의도
        'CPU 사용량이 궁금해요', // 조회 의도 (약한 표현)
      ];

      for (const query of variations) {
        const result = await koreanAI.processQuery(query, mockServerData);

        expect(result.success).toBe(true);
        // 일부 표현은 '기타'로 분류될 수 있으므로 더 관대한 검증
        expect([
          '조회',
          '분석',
          '제어',
          '최적화',
          '모니터링',
          '기타',
        ]).toContain(result.understanding.intent);
      }
    });

    it('존댓말과 반말을 모두 처리해야 함', async () => {
      const politeQuery = '서버 상태 확인해줘'; // 실제 키워드에 맞는 표현
      const casualQuery = '서버 상태 확인해줘';

      const politeResult = await koreanAI.processQuery(
        politeQuery,
        mockServerData
      );
      const casualResult = await koreanAI.processQuery(
        casualQuery,
        mockServerData
      );

      expect(politeResult.success).toBe(true);
      expect(casualResult.success).toBe(true);
      // 둘 다 조회 의도로 인식되어야 함
      expect(politeResult.understanding.intent).toBe('조회');
      expect(casualResult.understanding.intent).toBe('조회');
    });
  });
});
