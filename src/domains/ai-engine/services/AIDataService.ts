/**
 * 📊 AI Data Service Implementation
 *
 * AI 관련 데이터 처리 서비스
 * - 예측 데이터 조회
 * - 이상 징후 데이터 조회
 * - 보고서 데이터 조회
 * - 로그 검색
 */

import { IAIDataService } from '../interfaces';
import {
  PredictionResult,
  AnomalyDetection,
  ReportData,
  SystemLogEntry,
} from '../types';

export class AIDataService implements IAIDataService {
  private readonly BASE_URL = '/api';

  /**
   * 예측 데이터 조회
   */
  async getPredictionData(): Promise<PredictionResult[]> {
    try {
      const response = await fetch(`${this.BASE_URL}/ai/prediction`);
      if (!response.ok) {
        throw new Error(`예측 데이터 조회 실패: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('예측 데이터 조회 오류:', error);
      return this.getMockPredictionData();
    }
  }

  /**
   * 이상 징후 데이터 조회
   */
  async getAnomalyData(): Promise<AnomalyDetection[]> {
    try {
      const response = await fetch(`${this.BASE_URL}/ai/anomaly-detection`);
      if (!response.ok) {
        throw new Error(`이상 징후 데이터 조회 실패: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('이상 징후 데이터 조회 오류:', error);
      return this.getMockAnomalyData();
    }
  }

  /**
   * 보고서 데이터 조회
   */
  async getReportData(): Promise<ReportData[]> {
    try {
      const response = await fetch(`${this.BASE_URL}/ai/auto-report`);
      if (!response.ok) {
        throw new Error(`보고서 데이터 조회 실패: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('보고서 데이터 조회 오류:', error);
      return this.getMockReportData();
    }
  }

  /**
   * 로그 검색
   */
  async searchLogs(query: string, filters?: any): Promise<SystemLogEntry[]> {
    try {
      const params = new URLSearchParams({
        q: query,
        ...(filters && { filters: JSON.stringify(filters) }),
      });

      const response = await fetch(`${this.BASE_URL}/logs?${params}`);
      if (!response.ok) {
        throw new Error(`로그 검색 실패: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('로그 검색 오류:', error);
      return this.getMockLogData(query);
    }
  }

  /**
   * 모의 예측 데이터 생성
   */
  private getMockPredictionData(): PredictionResult[] {
    return [
      {
        id: 'pred_001',
        type: 'performance',
        severity: 'medium',
        confidence: 0.85,
        description:
          'CPU 사용률이 향후 2시간 내 80%를 초과할 가능성이 높습니다.',
        recommendation: '불필요한 프로세스를 종료하거나 스케일링을 고려하세요.',
        timestamp: new Date().toISOString(),
        affectedSystems: ['web-server-01', 'web-server-02'],
      },
      {
        id: 'pred_002',
        type: 'capacity',
        severity: 'high',
        confidence: 0.92,
        description: '디스크 사용량이 24시간 내 90%에 도달할 예정입니다.',
        recommendation: '로그 파일 정리 또는 스토리지 확장이 필요합니다.',
        timestamp: new Date().toISOString(),
        affectedSystems: ['database-01'],
      },
      {
        id: 'pred_003',
        type: 'anomaly',
        severity: 'low',
        confidence: 0.67,
        description: '네트워크 트래픽 패턴에서 경미한 이상이 감지되었습니다.',
        recommendation: '지속적인 모니터링을 권장합니다.',
        timestamp: new Date().toISOString(),
        affectedSystems: ['load-balancer'],
      },
    ];
  }

  /**
   * 모의 이상 징후 데이터 생성
   */
  private getMockAnomalyData(): AnomalyDetection[] {
    return [
      {
        id: 'anomaly_001',
        metric: 'cpu_usage',
        currentValue: 85.2,
        expectedValue: 45.0,
        deviation: 40.2,
        severity: 'high',
        timestamp: new Date().toISOString(),
        description: 'CPU 사용률이 예상 범위를 크게 벗어났습니다.',
      },
      {
        id: 'anomaly_002',
        metric: 'memory_usage',
        currentValue: 78.5,
        expectedValue: 60.0,
        deviation: 18.5,
        severity: 'medium',
        timestamp: new Date().toISOString(),
        description: '메모리 사용률이 평소보다 높습니다.',
      },
      {
        id: 'anomaly_003',
        metric: 'response_time',
        currentValue: 1250,
        expectedValue: 300,
        deviation: 950,
        severity: 'critical',
        timestamp: new Date().toISOString(),
        description: '응답 시간이 임계값을 초과했습니다.',
      },
    ];
  }

  /**
   * 모의 보고서 데이터 생성
   */
  private getMockReportData(): ReportData[] {
    return [
      {
        id: 'report_001',
        title: '시스템 성능 주간 보고서',
        type: 'performance',
        summary:
          '지난 주 전반적인 시스템 성능이 안정적이었으나, 목요일 오후 트래픽 급증으로 인한 일시적 지연이 발생했습니다.',
        details:
          '• 평균 응답 시간: 245ms (전주 대비 5% 개선)\n• CPU 사용률: 평균 42% (안정적)\n• 메모리 사용률: 평균 58% (정상 범위)\n• 디스크 I/O: 평균 65% (양호)',
        recommendations: [
          '트래픽 급증 시간대 자동 스케일링 설정 검토',
          '캐시 정책 최적화를 통한 응답 시간 단축',
          '모니터링 알림 임계값 조정',
        ],
        timestamp: new Date().toISOString(),
        status: 'published',
      },
      {
        id: 'report_002',
        title: '보안 이벤트 분석 보고서',
        type: 'security',
        summary:
          '지난 24시간 동안 3건의 의심스러운 로그인 시도가 감지되었으나, 모두 차단되었습니다.',
        details:
          '• 차단된 IP: 192.168.1.100, 10.0.0.50, 172.16.0.25\n• 시도 횟수: 총 15회\n• 차단 시간: 평균 0.2초\n• 영향받은 서비스: 없음',
        recommendations: [
          'IP 차단 목록 업데이트',
          '로그인 시도 모니터링 강화',
          '2단계 인증 도입 검토',
        ],
        timestamp: new Date().toISOString(),
        status: 'published',
      },
    ];
  }

  /**
   * 모의 로그 데이터 생성
   */
  private getMockLogData(query: string): SystemLogEntry[] {
    const baseTime = Date.now();
    return [
      {
        timestamp: new Date(baseTime - 300000).toISOString(),
        level: 'info',
        source: 'web-server',
        message: `검색어 "${query}"와 관련된 요청 처리 완료`,
        metadata: { requestId: 'req_12345', duration: 150 },
      },
      {
        timestamp: new Date(baseTime - 600000).toISOString(),
        level: 'warning',
        source: 'database',
        message: `"${query}" 관련 쿼리 실행 시간이 평소보다 길어짐`,
        metadata: { queryTime: 2500, threshold: 1000 },
      },
      {
        timestamp: new Date(baseTime - 900000).toISOString(),
        level: 'error',
        source: 'api-gateway',
        message: `"${query}" 처리 중 일시적 오류 발생`,
        metadata: { errorCode: 'TEMP_UNAVAILABLE', retryCount: 3 },
      },
    ];
  }
}
