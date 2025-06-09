/**
 * 🎯 순수 메트릭 인터페이스
 *
 * AI 에이전트가 오직 서버 메트릭 숫자만 접근하도록 제한
 * 시나리오 정보, 예상 결과, 컨텍스트 힌트 완전 차단
 */

export interface PureServerMetrics {
  // 기본 식별자 (시나리오 정보 제외)
  serverId: string;
  serverName: string;
  timestamp: Date;

  // 순수 성능 메트릭 (숫자만)
  cpu_usage: number; // 0-100 (%)
  memory_usage: number; // 0-100 (%)
  disk_usage: number; // 0-100 (%)
  network_in: number; // Mbps
  network_out: number; // Mbps
  response_time: number; // milliseconds
  active_connections: number; // count
  error_rate: number; // 0-100 (%)
  throughput: number; // requests per second

  // 추가 메트릭 (시나리오 무관)
  uptime_seconds: number;
  disk_io_read: number; // MB/s
  disk_io_write: number; // MB/s

  // ❌ 절대 포함 금지:
  // - scenario: string;
  // - scenarioType: string;
  // - expectedPattern: string;
  // - description: string;
  // - hints: string[];
}

export interface PureHistoricalData {
  timeRange: {
    start: Date;
    end: Date;
  };
  metrics: PureServerMetrics[];
  sampleInterval: number; // minutes
}

export interface PureAnalysisRequest {
  // 현재 메트릭 (실시간)
  currentMetrics: PureServerMetrics[];

  // 과거 데이터 (패턴 분석용만)
  historicalData?: PureHistoricalData;

  // 분석 설정
  analysisConfig: {
    sensitivityLevel: 'low' | 'medium' | 'high';
    timeWindow: number; // minutes
    includeCorrelation: boolean;
    includeTrendAnalysis: boolean;
  };

  // ❌ 절대 포함 금지:
  // - scenarioHints: any;
  // - expectedResults: any;
  // - contextClues: any;
}

/**
 * 🛡️ 데이터 격리 필터
 * 들어오는 서버 데이터에서 시나리오 정보 완전 제거
 */
export class DataIsolationFilter {
  /**
   * 서버 데이터를 순수 메트릭으로 변환
   */
  static filterToPureMetrics(rawServerData: any): PureServerMetrics {
    return {
      serverId: rawServerData.id || rawServerData.serverId,
      serverName: rawServerData.name || `Server-${rawServerData.id}`,
      timestamp: new Date(rawServerData.timestamp || Date.now()),

      // 순수 숫자 메트릭만 추출
      cpu_usage: this.sanitizeNumber(
        rawServerData.cpu_usage || rawServerData.metrics?.cpu || 0
      ),
      memory_usage: this.sanitizeNumber(
        rawServerData.memory_usage || rawServerData.metrics?.memory || 0
      ),
      disk_usage: this.sanitizeNumber(
        rawServerData.disk_usage || rawServerData.metrics?.disk || 0
      ),
      network_in: this.sanitizeNumber(
        rawServerData.network_in || rawServerData.metrics?.network?.in || 0
      ),
      network_out: this.sanitizeNumber(
        rawServerData.network_out || rawServerData.metrics?.network?.out || 0
      ),
      response_time: this.sanitizeNumber(
        rawServerData.response_time || rawServerData.metrics?.response_time || 0
      ),
      active_connections: this.sanitizeNumber(
        rawServerData.active_connections ||
          rawServerData.metrics?.connections ||
          0
      ),
      error_rate: this.sanitizeNumber(
        rawServerData.error_rate || rawServerData.metrics?.error_rate || 0
      ),
      throughput: this.sanitizeNumber(
        rawServerData.throughput || rawServerData.metrics?.throughput || 0
      ),
      uptime_seconds: this.sanitizeNumber(
        rawServerData.uptime_seconds || rawServerData.metrics?.uptime || 0
      ),
      disk_io_read: this.sanitizeNumber(
        rawServerData.disk_io_read || rawServerData.metrics?.disk_io?.read || 0
      ),
      disk_io_write: this.sanitizeNumber(
        rawServerData.disk_io_write ||
          rawServerData.metrics?.disk_io?.write ||
          0
      ),
    };
  }

  /**
   * 배열 데이터 필터링
   */
  static filterServerArray(rawServers: any[]): PureServerMetrics[] {
    return rawServers.map(server => this.filterToPureMetrics(server));
  }

  /**
   * 숫자 값 검증 및 정제
   */
  private static sanitizeNumber(value: any): number {
    const num = Number(value);
    return isNaN(num) ? 0 : Math.max(0, num);
  }

  /**
   * 🚨 시나리오 누설 감지
   * 들어오는 데이터에 시나리오 관련 정보가 있으면 경고
   */
  static detectScenarioLeak(data: any): string[] {
    const leaks: string[] = [];
    const dangerousKeys = [
      'scenario',
      'scenarioType',
      'scenarioName',
      'scenarioId',
      'expectedPattern',
      'description',
      'hints',
      'contextClues',
      'mainFailure',
      'cascadeFailures',
      'recoveryType',
      'demoScenario',
      'aiAnalysisPoints',
      'koreanDescription',
    ];

    const checkObject = (obj: any, path = '') => {
      if (typeof obj !== 'object' || obj === null) return;

      Object.keys(obj).forEach(key => {
        const fullPath = path ? `${path}.${key}` : key;

        if (
          dangerousKeys.some(danger =>
            key.toLowerCase().includes(danger.toLowerCase())
          )
        ) {
          leaks.push(
            `🚨 시나리오 누설 감지: ${fullPath} = ${JSON.stringify(obj[key])}`
          );
        }

        if (typeof obj[key] === 'object') {
          checkObject(obj[key], fullPath);
        }
      });
    };

    checkObject(data);
    return leaks;
  }

  /**
   * 순수 분석 요청 생성
   */
  static createPureAnalysisRequest(
    currentMetrics: PureServerMetrics[],
    options: {
      includeHistory?: boolean;
      timeWindow?: number;
      sensitivity?: 'low' | 'medium' | 'high';
    } = {}
  ): PureAnalysisRequest {
    return {
      currentMetrics,
      historicalData: options.includeHistory
        ? {
            timeRange: {
              start: new Date(
                Date.now() - (options.timeWindow || 60) * 60 * 1000
              ),
              end: new Date(),
            },
            metrics: currentMetrics, // 실제로는 과거 데이터를 별도 조회
            sampleInterval: 5,
          }
        : undefined,
      analysisConfig: {
        sensitivityLevel: options.sensitivity || 'medium',
        timeWindow: options.timeWindow || 60,
        includeCorrelation: true,
        includeTrendAnalysis: true,
      },
    };
  }
}

/**
 * 🔍 데이터 품질 검증
 */
export class MetricsQualityValidator {
  static validateMetrics(metrics: PureServerMetrics[]): {
    isValid: boolean;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // 기본 검증
    if (metrics.length === 0) {
      issues.push('메트릭 데이터가 비어있습니다');
      return { isValid: false, issues, recommendations };
    }

    metrics.forEach((metric, index) => {
      // 범위 검증
      if (metric.cpu_usage > 100)
        issues.push(
          `서버 ${metric.serverId}: CPU 사용률이 100% 초과 (${metric.cpu_usage}%)`
        );
      if (metric.memory_usage > 100)
        issues.push(
          `서버 ${metric.serverId}: 메모리 사용률이 100% 초과 (${metric.memory_usage}%)`
        );
      if (metric.error_rate > 100)
        issues.push(
          `서버 ${metric.serverId}: 에러율이 100% 초과 (${metric.error_rate}%)`
        );

      // 음수 검증
      Object.entries(metric).forEach(([key, value]) => {
        if (typeof value === 'number' && value < 0) {
          issues.push(
            `서버 ${metric.serverId}: ${key} 값이 음수입니다 (${value})`
          );
        }
      });

      // 타임스탬프 검증
      if (
        !(metric.timestamp instanceof Date) ||
        isNaN(metric.timestamp.getTime())
      ) {
        issues.push(`서버 ${metric.serverId}: 잘못된 타임스탬프`);
      }
    });

    // 권장사항
    if (metrics.length < 3) {
      recommendations.push(
        '통계적 분석을 위해 최소 3개 이상의 서버 데이터를 권장합니다'
      );
    }

    const timeSpan =
      Math.max(...metrics.map(m => m.timestamp.getTime())) -
      Math.min(...metrics.map(m => m.timestamp.getTime()));
    if (timeSpan < 5 * 60 * 1000) {
      // 5분 미만
      recommendations.push(
        '트렌드 분석을 위해 최소 5분 이상의 시간 범위 데이터를 권장합니다'
      );
    }

    return {
      isValid: issues.length === 0,
      issues,
      recommendations,
    };
  }
}
