/**
 * ☁️ GCP Functions Mock Provider
 *
 * GCP Cloud Functions의 간소화된 Mock 구현
 */

import { MockBase } from '../core/MockBase';
import mockServers from '../data/servers.json';

export class GCPMock extends MockBase {
  constructor() {
    super('GCPFunctions', {
      responseDelay: 150,
      enableStats: true,
    });
  }

  /**
   * Korean NLP 분석
   */
  async analyzeKoreanNLP(
    text: string,
    _context?: unknown
  ): Promise<{
    intent: string;
    entities: Array<{ type: string; value: string }>;
    confidence: number;
  }> {
    return this.execute('analyzeKoreanNLP', async () => {
      const lowerText = text.toLowerCase();

      // 의도 분석
      let intent = 'general';
      let confidence = 0.7;

      if (lowerText.includes('서버') || lowerText.includes('상태')) {
        intent = 'server_status';
        confidence = 0.9;
      } else if (lowerText.includes('성능') || lowerText.includes('cpu')) {
        intent = 'performance_check';
        confidence = 0.85;
      } else if (lowerText.includes('오류') || lowerText.includes('문제')) {
        intent = 'error_detection';
        confidence = 0.88;
      }

      // 엔티티 추출
      const entities: Array<{ type: string; value: string }> = [];

      // 서버 이름 추출
      for (const server of mockServers.servers) {
        if (text.includes(server.name)) {
          entities.push({ type: 'server', value: server.name });
        }
      }

      // 메트릭 타입 추출
      const metrics = ['cpu', 'memory', 'disk', 'network'];
      for (const metric of metrics) {
        if (lowerText.includes(metric)) {
          entities.push({ type: 'metric', value: metric });
        }
      }

      return { intent, entities, confidence };
    });
  }

  /**
   * ML 분석 엔진
   */
  async analyzeMLMetrics(
    metrics: Array<{
      timestamp: string;
      value: number;
      server_id: string;
      metric_type: string;
    }>
  ): Promise<{
    trend: 'increasing' | 'decreasing' | 'stable';
    anomalies: Array<{ timestamp: string; severity: number }>;
    prediction: { next_hour: number; confidence: number };
  }> {
    return this.execute('analyzeMLMetrics', async () => {
      // 트렌드 분석
      const values = metrics.map((m) => m.value);
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      const lastAvg = values.slice(-3).reduce((a, b) => a + b, 0) / 3;

      let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
      if (lastAvg > avg * 1.1) trend = 'increasing';
      else if (lastAvg < avg * 0.9) trend = 'decreasing';

      // 이상 탐지
      const anomalies: Array<{ timestamp: string; severity: number }> = [];
      const threshold = avg + (Math.max(...values) - avg) * 0.8;

      metrics.forEach((metric) => {
        if (metric.value > threshold) {
          anomalies.push({
            timestamp: metric.timestamp,
            severity: (metric.value - threshold) / threshold,
          });
        }
      });

      // 예측
      const prediction = {
        next_hour:
          trend === 'increasing'
            ? lastAvg * 1.05
            : trend === 'decreasing'
              ? lastAvg * 0.95
              : lastAvg,
        confidence: 0.75,
      };

      return { trend, anomalies, prediction };
    });
  }

  /**
   * 통합 AI 프로세서
   */
  async processUnifiedAI(request: {
    type: 'analysis' | 'prediction' | 'recommendation';
    data: unknown;
  }): Promise<{
    result: unknown;
    confidence: number;
    processingTime: number;
  }> {
    return this.execute('processUnifiedAI', async () => {
      const startTime = Date.now();
      let result: unknown;
      let confidence = 0.8;

      switch (request.type) {
        case 'analysis':
          result = {
            summary: '시스템 분석이 완료되었습니다.',
            findings: [
              '전반적인 성능은 양호합니다',
              '일부 서버에서 리소스 사용률이 높습니다',
              '네트워크 트래픽이 증가 추세입니다',
            ],
          };
          break;

        case 'prediction':
          result = {
            forecast: '향후 24시간 내 시스템 안정성 유지 예상',
            riskLevel: 'low',
            recommendations: ['모니터링 지속', '백업 확인'],
          };
          confidence = 0.85;
          break;

        case 'recommendation':
          result = {
            actions: [
              { priority: 'high', action: 'API 서버 스케일 아웃' },
              { priority: 'medium', action: '메모리 캐시 TTL 조정' },
              { priority: 'low', action: '로그 아카이빙 설정' },
            ],
          };
          confidence = 0.9;
          break;

        default:
          result = { message: '처리 완료' };
      }

      return {
        result,
        confidence,
        processingTime: Date.now() - startTime,
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
