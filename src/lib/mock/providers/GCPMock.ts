/**
 * ☁️ GCP Functions Mock Provider
 *
 * GCP Cloud Functions의 간소화된 Mock 구현
 */

import { MockBase } from '../core/MockBase';

export class GCPMock extends MockBase {
  constructor() {
    super('GCPFunctions', {
      responseDelay: 150,
      enableStats: true,
    });
  }

  /**
   * 통합 AI 프로세서
   */
  /**
   * 통합 AI 프로세서
   */
  async callUnifiedProcessor(
    query: string,
    _processors: string[] = ['korean_nlp', 'server_analyzer']
  ): Promise<{
    success: boolean;
    data: unknown;
    timestamp: string;
  }> {
    return this.execute('callUnifiedProcessor', async () => {
      const startTime = Date.now();
      let result: unknown;

      // Mock result based on query
      if (query.includes('분석')) {
        result = {
          summary: '시스템 분석이 완료되었습니다.',
          findings: [
            '전반적인 성능은 양호합니다',
            '일부 서버에서 리소스 사용률이 높습니다',
            '네트워크 트래픽이 증가 추세입니다',
          ],
        };
      } else if (query.includes('예측')) {
        result = {
          forecast: '향후 24시간 내 시스템 안정성 유지 예상',
          riskLevel: 'low',
          recommendations: ['모니터링 지속', '백업 확인'],
        };
      } else {
        result = { message: '처리 완료' };
      }

      return {
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
        _performance: {
          processingTime: Date.now() - startTime,
        },
      };
    });
  }

  /**
   * Mock 리셋
   */
  reset(): void {
    this.stats.reset();
    this.logger.info('GCP Functions Mock 리셋됨');
  }
}
