/**
 * 🚀 실시간 메트릭 수집기 v1.0
 *
 * 실제 API 호출 통계를 수집하고 관리하는 간단한 시스템
 * - API 호출 수 추적
 * - 응답 시간 측정
 * - 성공/실패율 계산
 * - 메모리 기반 (서버 재시작 시 초기화)
 */

export interface APICallMetric {
  endpoint: string;
  method: string;
  timestamp: number;
  responseTime: number;
  success: boolean;
  statusCode: number;
  userAgent?: string;
}

export interface EngineMetrics {
  name: string;
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  avgResponseTime: number;
  lastUsed: number;
  status: 'active' | 'inactive' | 'error';
}

export class RealTimeMetricsCollector {
  private apiCalls: APICallMetric[] = [];
  private readonly MAX_RECORDS = 1000; // 메모리 관리

  /**
   * API 호출 기록
   */
  recordAPICall(metric: APICallMetric): void {
    this.apiCalls.push(metric);

    // 메모리 관리 - 오래된 기록 제거
    if (this.apiCalls.length > this.MAX_RECORDS) {
      this.apiCalls = this.apiCalls.slice(-this.MAX_RECORDS);
    }

    console.log(
      `📊 API 호출 기록: ${metric.endpoint} (${metric.responseTime}ms)`
    );
  }

  /**
   * 엔진별 메트릭 계산
   */
  getEngineMetrics(): EngineMetrics[] {
    const engineMap = new Map<string, APICallMetric[]>();

    // AI 엔진 관련 API 호출만 필터링
    const aiCalls = this.apiCalls.filter(
      call =>
        call.endpoint.includes('/api/ai/') ||
        call.endpoint.includes('/api/test/') ||
        call.endpoint.includes('/api/mcp/')
    );

    // 엔진별로 그룹화
    aiCalls.forEach(call => {
      const engineName = this.extractEngineName(call.endpoint);
      if (!engineMap.has(engineName)) {
        engineMap.set(engineName, []);
      }
      engineMap.get(engineName)!.push(call);
    });

    // 메트릭 계산
    const metrics: EngineMetrics[] = [];
    engineMap.forEach((calls, engineName) => {
      const successfulCalls = calls.filter(c => c.success).length;
      const totalCalls = calls.length;
      const avgResponseTime =
        calls.reduce((sum, c) => sum + c.responseTime, 0) / totalCalls;
      const lastUsed = Math.max(...calls.map(c => c.timestamp));

      metrics.push({
        name: engineName,
        totalCalls,
        successfulCalls,
        failedCalls: totalCalls - successfulCalls,
        avgResponseTime: Math.round(avgResponseTime),
        lastUsed,
        status: this.determineEngineStatus(calls),
      });
    });

    return metrics.sort((a, b) => b.totalCalls - a.totalCalls);
  }

  /**
   * 전체 시스템 메트릭
   */
  getSystemMetrics() {
    const now = Date.now();
    const last24h = now - 24 * 60 * 60 * 1000;
    const recent = this.apiCalls.filter(call => call.timestamp >= last24h);

    const totalCalls = recent.length;
    const successfulCalls = recent.filter(c => c.success).length;
    const avgResponseTime =
      totalCalls > 0
        ? recent.reduce((sum, c) => sum + c.responseTime, 0) / totalCalls
        : 0;

    // 활성 엔진 수 계산
    const engineMetrics = this.getEngineMetrics();
    const activeEngines = engineMetrics.filter(e => e.status === 'active').length;

    return {
      totalCalls,
      successfulCalls,
      failedCalls: totalCalls - successfulCalls,
      successRate: totalCalls > 0 ? (successfulCalls / totalCalls) * 100 : 0,
      avgResponseTime: Math.round(avgResponseTime),
      last24hCalls: totalCalls,
      activeEngines,
      timestamp: now,
    };
  }

  /**
   * 최근 API 호출 로그
   */
  getRecentLogs(limit: number = 50): APICallMetric[] {
    return this.apiCalls.slice(-limit).reverse(); // 최신 순으로 정렬
  }

  /**
   * 엔진 이름 추출
   */
  private extractEngineName(endpoint: string): string {
    if (endpoint.includes('/ai/smart-query')) return 'SmartQuery';
    if (endpoint.includes('/ai/google-ai')) return 'GoogleAI';
    if (endpoint.includes('/ai/engines')) return 'EngineManager';
    if (endpoint.includes('/ai/predict')) return 'PredictiveAnalytics';
    if (endpoint.includes('/ai/anomaly')) return 'AnomalyDetection';
    if (endpoint.includes('/ai/unified')) return 'UnifiedEngine';
    if (endpoint.includes('/ai/hybrid')) return 'HybridEngine';
    if (endpoint.includes('/ai/')) return 'ai'; // 기본 AI 엔진
    if (endpoint.includes('/mcp/')) return 'mcp';
    if (endpoint.includes('/test/')) return 'test';

    return 'Unknown';
  }

  /**
   * 엔진 상태 판단
   */
  private determineEngineStatus(
    calls: APICallMetric[]
  ): 'active' | 'inactive' | 'error' {
    if (calls.length === 0) return 'inactive';

    const recentCalls = calls.filter(
      c => Date.now() - c.timestamp < 5 * 60 * 1000 // 최근 5분
    );

    if (recentCalls.length === 0) return 'inactive';

    const errorRate =
      recentCalls.filter(c => !c.success).length / recentCalls.length;
    if (errorRate > 0.5) return 'error';

    return 'active';
  }

  /**
   * 데이터 정리
   */
  cleanup(): void {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000; // 24시간 이전
    this.apiCalls = this.apiCalls.filter(call => call.timestamp >= cutoff);
    console.log(`🧹 메트릭 정리 완료: ${this.apiCalls.length}개 기록 유지`);
  }
}

// 싱글톤 인스턴스
export const metricsCollector = new RealTimeMetricsCollector();
