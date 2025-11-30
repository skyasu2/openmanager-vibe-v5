/**
 * 🔄 통합 데이터 서비스
 *
 * 서버 모니터링과 AI 어시스턴트가 동일한 24시간 고정 데이터를 사용하도록 통합
 *
 * ✅ 핵심 원칙:
 * - 단일 데이터 소스 (Single Source of Truth)
 * - 시간 동기화 (30초 순차 회전)
 * - AI 분석 순수성 보장 (메타데이터 숨김)
 * - 데이터 일관성 100% 보장
 */

import type { EnhancedServerMetrics } from '../types/server';

export interface UnifiedDataResponse {
  // 서버 모니터링용 데이터
  servers: EnhancedServerMetrics[];

  // AI 분석용 메타데이터 (선택적 포함)
  aiContext?: {
    scenario: string;
    timeContext: string;
    hiddenInsights?: {
      incidentType?: string;
      cascadeInfo?: string[];
      predictedIssues?: string[];
    };
  };

  // 데이터 출처 정보
  dataSource: {
    type: 'hourly-scenario';
    hour: number;
    segment: number;
    timestamp: string;
  };
}

/**
 * 🎯 통합 데이터 제공자 클래스
 * 서버 모니터링과 AI 시스템이 동일한 데이터를 사용하도록 중재
 */
export class UnifiedDataService {
  private static instance: UnifiedDataService;

  static getInstance(): UnifiedDataService {
    if (!UnifiedDataService.instance) {
      UnifiedDataService.instance = new UnifiedDataService();
    }
    return UnifiedDataService.instance;
  }

  /**
   * 🔄 현재 시간 기준 통합 데이터 조회
   * @param includeAIMetadata AI 메타데이터 포함 여부 (기본값: false)
   */
  async getCurrentData(
    includeAIMetadata: boolean = false
  ): Promise<UnifiedDataResponse> {
    try {
      // 1단계: 서버 모니터링 API 호출 (기존 24시간 회전 시스템 활용)
      const response = await fetch('/api/servers/all', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Unified-Data': 'true', // 통합 데이터 요청 표시
        },
      });

      if (!response.ok) {
        throw new Error(`서버 데이터 조회 실패: ${response.status}`);
      }

      const data = await response.json();

      // 2단계: AI 메타데이터 생성 (요청 시에만)
      let aiContext: UnifiedDataResponse['aiContext'];
      if (includeAIMetadata && data.servers && data.servers.length > 0) {
        aiContext = await this.generateAIContext(data.servers, data.source);
      }

      return {
        servers: data.data || [],
        aiContext,
        dataSource: {
          type: 'hourly-scenario',
          hour: new Date().getHours(),
          segment: Math.floor(
            (new Date().getMinutes() * 60 + new Date().getSeconds()) / 30
          ),
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error('❌ 통합 데이터 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 🤖 AI 분석용 메타데이터 생성
   * 현재 서버 상태를 바탕으로 AI가 분석할 수 있는 컨텍스트 정보 생성
   */
  private async generateAIContext(
    servers: EnhancedServerMetrics[],
    _dataSource: string
  ): Promise<UnifiedDataResponse['aiContext']> {
    const currentHour = new Date().getHours();
    const currentTime = new Date().toLocaleTimeString('ko-KR', {
      hour12: false,
    });

    // 서버 상태 분석
    const criticalServers = servers.filter((s) => s.status === 'critical');
    const warningServers = servers.filter((s) => s.status === 'warning');
    const _healthyServers = servers.filter((s) => s.status === 'online'); // 🔧 수정: 'healthy' 제거 (타입 통합)

    // 시나리오 추론 (시간대별)
    let scenario = '정상 운영';
    if (currentHour >= 0 && currentHour <= 5) {
      scenario = '심야 유지보수 시간대';
    } else if (currentHour >= 6 && currentHour <= 8) {
      scenario = '출근 시간 트래픽 급증';
    } else if (currentHour >= 9 && currentHour <= 17) {
      scenario = '업무 시간 피크';
    } else if (currentHour >= 18 && currentHour <= 23) {
      scenario = '저녁 시간대 안정화';
    }

    // AI 분석 순수성을 위한 숨겨진 인사이트 (선택적)
    let hiddenInsights: NonNullable<UnifiedDataResponse['aiContext']>['hiddenInsights'];
    if (criticalServers.length > 0 || warningServers.length > 2) {
      hiddenInsights = {
        incidentType: this.inferIncidentType(servers, currentHour),
        cascadeInfo: this.analyzeCascadeRisk(servers),
        predictedIssues: this.predictUpcomingIssues(servers, currentHour),
      };
    }

    return {
      scenario,
      timeContext: `${currentTime} (${currentHour}시 기준)`,
      hiddenInsights,
    };
  }

  /**
   * 🔍 장애 유형 추론
   */
  private inferIncidentType(
    servers: EnhancedServerMetrics[],
    hour: number
  ): string {
    const criticalServers = servers.filter((s) => s.status === 'critical');

    if (criticalServers.some((s) => s.type === 'database')) {
      return '데이터베이스 성능 저하';
    }
    if (criticalServers.some((s) => s.type === 'web')) {
      return '웹서버 응답 지연';
    }
    if (criticalServers.some((s) => s.type === 'api')) {
      return 'API 서비스 장애';
    }
    if (hour >= 0 && hour <= 5) {
      return '백업/유지보수 관련 장애';
    }

    return '시스템 과부하';
  }

  /**
   * 🌊 연쇄 장애 위험 분석
   */
  private analyzeCascadeRisk(servers: EnhancedServerMetrics[]): string[] {
    const risks: string[] = [];
    const criticalServers = servers.filter((s) => s.status === 'critical');

    if (criticalServers.some((s) => s.type === 'database')) {
      risks.push('DB 장애로 인한 전체 서비스 영향 우려');
    }
    if (
      criticalServers.some(
        (s) => s.name.includes('load') || (s.type && s.type === 'load-balancer')
      )
    ) {
      risks.push('로드밸런서 장애로 인한 서비스 접근 불가');
    }
    if (criticalServers.length > 2) {
      risks.push('다중 서버 장애로 인한 시스템 전반 불안정');
    }

    return risks;
  }

  /**
   * 🔮 예상 이슈 예측
   */
  private predictUpcomingIssues(
    servers: EnhancedServerMetrics[],
    hour: number
  ): string[] {
    const predictions: string[] = [];
    const highCpuServers = servers.filter(
      (s) => (s.cpu_usage || s.cpu || 0) > 80
    );
    const highMemoryServers = servers.filter(
      (s) => (s.memory_usage || s.memory || 0) > 85
    );

    if (highCpuServers.length > 0) {
      predictions.push('CPU 사용률 급증으로 인한 응답시간 지연 예상');
    }
    if (highMemoryServers.length > 0) {
      predictions.push('메모리 부족으로 인한 서비스 중단 위험');
    }
    if (hour >= 8 && hour <= 10) {
      predictions.push('오전 피크 시간 대비 추가 리소스 필요');
    }

    return predictions;
  }

  /**
   * 📊 서버 모니터링 전용 데이터 조회
   * AI 메타데이터 없이 순수한 서버 데이터만 제공
   */
  async getServerMonitoringData(): Promise<EnhancedServerMetrics[]> {
    const unifiedData = await this.getCurrentData(false);
    return unifiedData.servers;
  }

  /**
   * 🤖 AI 어시스턴트 전용 데이터 조회
   * AI 분석을 위한 풍부한 메타데이터와 함께 제공
   */
  async getAIAnalysisData(): Promise<UnifiedDataResponse> {
    return this.getCurrentData(true);
  }
}

// 싱글톤 인스턴스 내보내기
export const unifiedDataService = UnifiedDataService.getInstance();

/**
 * 🎯 편의 함수들
 */

// 서버 모니터링용 (기존 호환성 유지)
export async function getCurrentServers(): Promise<EnhancedServerMetrics[]> {
  return unifiedDataService.getServerMonitoringData();
}

// AI 분석용 (풍부한 컨텍스트 포함)
export async function getCurrentAIContext(): Promise<UnifiedDataResponse> {
  return unifiedDataService.getAIAnalysisData();
}

// 통합 데이터 조회 (용도에 따른 선택적 메타데이터)
export async function getUnifiedData(
  includeAIMetadata: boolean = false
): Promise<UnifiedDataResponse> {
  return unifiedDataService.getCurrentData(includeAIMetadata);
}
