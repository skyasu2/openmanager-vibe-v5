/**
 * 🎯 통합 메트릭 서비스
 * 
 * AI 어시스턴트와 모니터링 시스템이 동일한 데이터를 사용하도록 보장
 * - 24시간 순환: 매일 동일한 시간대 패턴 반복
 * - 1분 정규화: 데이터 일관성 보장
 * - 실시간 메트릭: FNV-1a 보간으로 자연스러운 변화
 */

import type { EnhancedServerMetrics } from '@/types/server';

export interface UnifiedMetricsResponse {
  success: boolean;
  timestamp: number;
  actualTimestamp: number;
  servers: EnhancedServerMetrics[];
  metadata: {
    timeInfo: {
      normalized: number;
      actual: number;
      cycle24h: number;
      slot10min: number;
      hour: number;
      validUntil: number;
    };
    systemInfo: {
      totalServers: number;
      processingTime: number;
      dataConsistency: boolean;
      version: string;
    };
  };
}

export class UnifiedMetricsService {
  private static instance: UnifiedMetricsService | null = null;
  private cache = new Map<string, { data: UnifiedMetricsResponse; fetchedAt: number }>();
  
  private constructor() {}
  
  static getInstance(): UnifiedMetricsService {
    if (!this.instance) {
      this.instance = new UnifiedMetricsService();
    }
    return this.instance;
  }
  
  /**
   * 🚀 현재 통합 메트릭 조회 (캐싱 포함)
   */
  async getCurrentMetrics(): Promise<UnifiedMetricsResponse> {
    const now = Date.now();
    const normalizedTime = this.normalizeTimestamp(now);
    const cacheKey = `metrics-${normalizedTime}`;
    
    // 캐시 확인 (30초 캐싱)
    const cached = this.cache.get(cacheKey);
    if (cached && (now - cached.fetchedAt < 30000)) {
      return cached.data;
    }
    
    try {
      // 통합 메트릭 API 호출
      const response = await fetch('/api/metrics/current');
      
      if (!response.ok) {
        throw new Error(`API 호출 실패: ${response.status} ${response.statusText}`);
      }
      
      const data: UnifiedMetricsResponse = await response.json();
      
      if (!data.success) {
        throw new Error(`메트릭 생성 실패: ${data}`);
      }
      
      // 캐시 저장
      this.cache.set(cacheKey, {
        data,
        fetchedAt: now
      });
      
      // 오래된 캐시 정리 (메모리 절약)
      this.cleanupCache(now);
      
      return data;
      
    } catch (error) {
      console.error('❌ 통합 메트릭 조회 실패:', error);
      
      // 폴백: 기본 메트릭 반환
      return this.getFallbackMetrics(normalizedTime);
    }
  }
  
  /**
   * 📊 특정 서버 메트릭 조회
   */
  async getServerMetrics(serverId: string): Promise<EnhancedServerMetrics | null> {
    const metrics = await this.getCurrentMetrics();
    return metrics.servers.find(server => server.id === serverId) || null;
  }
  
  /**
   * 🔍 서버 상태 분석 (AI 어시스턴트용)
   */
  async analyzeServerStatus(): Promise<{
    summary: string;
    criticalServers: EnhancedServerMetrics[];
    warningServers: EnhancedServerMetrics[];
    healthyServers: EnhancedServerMetrics[];
    timeContext: string;
  }> {
    const metrics = await this.getCurrentMetrics();
    const { servers, metadata } = metrics;
    
    // 상태별 서버 분류
    const criticalServers = servers.filter(s => s.status === 'critical');
    const warningServers = servers.filter(s => s.status === 'warning');
    const healthyServers = servers.filter(s => s.status === 'online');
    
    // 시간 컨텍스트 생성
    const hour = metadata.timeInfo.hour;
    const timeContext = this.getTimeContextDescription(hour);
    
    // 요약 생성
    const totalServers = servers.length;
    const summary = `전체 ${totalServers}개 서버 중 정상 ${healthyServers.length}개, 경고 ${warningServers.length}개, 심각 ${criticalServers.length}개`;
    
    return {
      summary,
      criticalServers,
      warningServers,
      healthyServers,
      timeContext
    };
  }
  
  /**
   * 📈 메트릭 트렌드 분석 (AI용)
   */
  async getMetricTrends(serverId: string): Promise<{
    server: EnhancedServerMetrics;
    trends: {
      cpu: { current: number; baseline: number; trend: 'rising' | 'stable' | 'falling' };
      memory: { current: number; baseline: number; trend: 'rising' | 'stable' | 'falling' };
      network: { current: number; baseline: number; trend: 'rising' | 'stable' | 'falling' };
    };
    recommendations: string[];
  }> {
    const metrics = await this.getCurrentMetrics();
    const server = metrics.servers.find(s => s.id === serverId);
    
    if (!server) {
      throw new Error(`서버 ${serverId}를 찾을 수 없습니다.`);
    }
    
    // 기준값과 비교하여 트렌드 분석
    const baseline = server.metadata?.baseline || { cpu: 50, memory: 50, network: 30 };
    
    const analyzeTrend = (current: number, base: number) => {
      const diff = current - base;
      if (Math.abs(diff) < 5) return 'stable';
      return diff > 0 ? 'rising' : 'falling';
    };
    
    const trends = {
      cpu: { current: server.cpu, baseline: baseline.cpu, trend: analyzeTrend(server.cpu, baseline.cpu) },
      memory: { current: server.memory, baseline: baseline.memory, trend: analyzeTrend(server.memory, baseline.memory) },
      network: { current: server.network, baseline: baseline.network, trend: analyzeTrend(server.network, baseline.network) }
    } as const;
    
    // 추천사항 생성
    const recommendations = this.generateRecommendations(server, trends);
    
    return {
      server,
      trends,
      recommendations
    };
  }
  
  /**
   * 🕐 시간 정규화 (1분 단위)
   */
  private normalizeTimestamp(timestamp: number): number {
    const minuteMs = 60 * 1000;
    return Math.floor(timestamp / minuteMs) * minuteMs;
  }
  
  /**
   * 🕰️ 시간 컨텍스트 설명
   */
  private getTimeContextDescription(hour: number): string {
    if (hour >= 9 && hour <= 18) {
      return `현재 업무시간(${hour}시)으로 높은 부하가 예상되는 시간대입니다.`;
    } else if (hour >= 2 && hour <= 6) {
      return `현재 새벽시간(${hour}시)으로 시스템 부하가 낮은 시간대입니다.`;
    } else if (hour >= 19 && hour <= 23) {
      return `현재 저녁시간(${hour}시)으로 중간 정도 부하가 예상되는 시간대입니다.`;
    } else {
      return `현재 심야시간(${hour}시)으로 시스템 유지보수나 백업 작업이 진행될 수 있는 시간대입니다.`;
    }
  }
  
  /**
   * 💡 추천사항 생성
   */
  private generateRecommendations(
    server: EnhancedServerMetrics, 
    trends: any
  ): string[] {
    const recommendations: string[] = [];
    
    if (server.cpu > 80) {
      recommendations.push('CPU 사용률이 높습니다. 프로세스 최적화를 고려해보세요.');
    }
    
    if (server.memory > 85) {
      recommendations.push('메모리 사용률이 높습니다. 메모리 누수 확인이 필요합니다.');
    }
    
    if (server.responseTime > 200) {
      recommendations.push('응답 시간이 느립니다. 데이터베이스 쿼리를 최적화해보세요.');
    }
    
    if (trends.cpu.trend === 'rising' && server.cpu > 70) {
      recommendations.push('CPU 사용률이 지속적으로 증가하고 있습니다. 모니터링을 강화하세요.');
    }
    
    // 시간대별 추천
    const hour = new Date().getHours();
    if (hour >= 2 && hour <= 6 && server.id.includes('backup')) {
      recommendations.push('새벽시간 백업 작업이 진행 중일 수 있습니다.');
    }
    
    return recommendations;
  }
  
  /**
   * 🧹 캐시 정리
   */
  private cleanupCache(currentTime: number): void {
    const cutoffTime = currentTime - 300000; // 5분 전
    
    for (const [key, value] of this.cache.entries()) {
      if (value.fetchedAt < cutoffTime) {
        this.cache.delete(key);
      }
    }
  }
  
  /**
   * 🚨 폴백 메트릭 (API 실패 시)
   */
  private getFallbackMetrics(timestamp: number): UnifiedMetricsResponse {
    const servers: EnhancedServerMetrics[] = [
      {
        id: 'web-01',
        name: 'Web 01',
        status: 'warning',
        cpu: 75,
        memory: 68,
        disk: 45,
        network: 52,
        responseTime: 180,
        uptime: 99.95,
        lastUpdated: timestamp,
        metadata: {
          serverType: 'web',
          scenarios: [{ type: 'fallback', severity: 'low', description: 'API 폴백 모드' }]
        }
      }
    ];
    
    return {
      success: true,
      timestamp,
      actualTimestamp: Date.now(),
      servers,
      metadata: {
        timeInfo: {
          normalized: timestamp,
          actual: Date.now(),
          cycle24h: timestamp % (24 * 60 * 60 * 1000),
          slot10min: 0,
          hour: new Date().getHours(),
          validUntil: timestamp + 60000
        },
        systemInfo: {
          totalServers: servers.length,
          processingTime: 0,
          dataConsistency: false, // 폴백 모드
          version: 'fallback-v1.0'
        }
      }
    };
  }
}

// 싱글톤 인스턴스 export
export const unifiedMetricsService = UnifiedMetricsService.getInstance();