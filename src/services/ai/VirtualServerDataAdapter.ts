/**
 * 🤖 Virtual Server Data Adapter
 * 
 * AI 에이전트가 가상 서버 데이터를 실제 데이터처럼 처리할 수 있도록 하는 어댑터
 * - 가상 서버 데이터를 표준 형식으로 변환
 * - AI 분석을 위한 데이터 전처리
 * - 실시간 데이터 스트림 제공
 */

import { virtualServerManager, VirtualServer } from '@/services/VirtualServerManager';
import { ServerMetrics, ServerStatus } from '@/types/common';

export interface StandardServerData {
  serverId: string;
  hostname: string;
  name: string;
  type: string;
  environment: string;
  location: string;
  provider: string;
  specs: {
    cpu_cores: number;
    memory_gb: number;
    disk_gb: number;
  };
  metrics: {
    timestamp: Date;
    cpu_usage: number;
    memory_usage: number;
    disk_usage: number;
    network_in: number;
    network_out: number;
    response_time: number;
    active_connections: number;
    status: ServerStatus;
    alerts: string[];
  };
  trends: {
    cpu_trend: 'increasing' | 'decreasing' | 'stable';
    memory_trend: 'increasing' | 'decreasing' | 'stable';
    performance_score: number;
  };
}

export interface SystemAnalysisData {
  timestamp: Date;
  totalServers: number;
  healthyServers: number;
  warningServers: number;
  criticalServers: number;
  offlineServers: number;
  averageCpu: number;
  averageMemory: number;
  topIssues: Array<{
    serverId: string;
    hostname: string;
    issue: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    recommendation: string;
  }>;
  correlations: Array<{
    metric1: string;
    metric2: string;
    correlation: number;
    significance: 'low' | 'medium' | 'high';
  }>;
  predictions: Array<{
    serverId: string;
    metric: string;
    predicted_value: number;
    confidence: number;
    time_horizon: string;
  }>;
}

export class VirtualServerDataAdapter {
  private static instance: VirtualServerDataAdapter;
  private dataCache: Map<string, StandardServerData> = new Map();
  private lastUpdateTime: Date = new Date(0);
  private readonly CACHE_TTL = 30000; // 30초

  private constructor() {}

  static getInstance(): VirtualServerDataAdapter {
    if (!VirtualServerDataAdapter.instance) {
      VirtualServerDataAdapter.instance = new VirtualServerDataAdapter();
    }
    return VirtualServerDataAdapter.instance;
  }

  /**
   * 모든 서버의 표준화된 데이터 조회
   */
  async getAllServersData(): Promise<StandardServerData[]> {
    try {
      const servers = virtualServerManager.getServers();
      const serverDataPromises = servers.map(server => this.getServerData(server.id));
      const serverData = await Promise.all(serverDataPromises);
      
      return serverData.filter(data => data !== null) as StandardServerData[];
    } catch (error) {
      console.error('❌ 모든 서버 데이터 조회 실패:', error);
      return [];
    }
  }

  /**
   * 특정 서버의 표준화된 데이터 조회
   */
  async getServerData(serverId: string): Promise<StandardServerData | null> {
    try {
      // 캐시 확인
      const now = new Date();
      if (this.dataCache.has(serverId) && 
          (now.getTime() - this.lastUpdateTime.getTime()) < this.CACHE_TTL) {
        return this.dataCache.get(serverId)!;
      }

      const servers = virtualServerManager.getServers();
      const server = servers.find(s => s.id === serverId);
      
      if (!server) {
        return null;
      }

      const latestMetrics = await virtualServerManager.getLatestMetrics(serverId);
      
      if (!latestMetrics) {
        return null;
      }

      // 트렌드 분석을 위한 히스토리 데이터 조회
      const historyMetrics = await virtualServerManager.getMetricsHistory(serverId, 1); // 1시간
      const trends = this.calculateTrends(historyMetrics);

      const standardData: StandardServerData = {
        serverId: server.id,
        hostname: server.hostname,
        name: server.name,
        type: server.type,
        environment: server.environment,
        location: server.location || 'Unknown',
        provider: server.provider || 'unknown',
        specs: server.specs || { cpu_cores: 0, memory_gb: 0, disk_gb: 0 },
        metrics: {
          timestamp: latestMetrics.timestamp,
          cpu_usage: latestMetrics.cpu_usage,
          memory_usage: latestMetrics.memory_usage,
          disk_usage: latestMetrics.disk_usage,
          network_in: latestMetrics.network_in,
          network_out: latestMetrics.network_out,
          response_time: latestMetrics.response_time,
          active_connections: latestMetrics.active_connections,
          status: latestMetrics.status,
          alerts: latestMetrics.alerts
        },
        trends
      };

      // 캐시 업데이트
      this.dataCache.set(serverId, standardData);
      this.lastUpdateTime = now;

      return standardData;
    } catch (error) {
      console.error(`❌ 서버 데이터 조회 실패 (${serverId}):`, error);
      return null;
    }
  }

  /**
   * 시스템 전체 분석 데이터 생성
   */
  async getSystemAnalysisData(): Promise<SystemAnalysisData> {
    try {
      const systemStatus = await virtualServerManager.getSystemStatus();
      const allServersData = await this.getAllServersData();
      
      // 주요 이슈 식별
      const topIssues = this.identifyTopIssues(allServersData);
      
      // 상관관계 분석
      const correlations = this.analyzeCorrelations(allServersData);
      
      // 예측 분석
      const predictions = await this.generatePredictions(allServersData);

      return {
        timestamp: new Date(),
        totalServers: systemStatus.totalServers,
        healthyServers: systemStatus.healthyServers,
        warningServers: systemStatus.warningServers,
        criticalServers: systemStatus.criticalServers,
        offlineServers: systemStatus.offlineServers,
        averageCpu: systemStatus.averageCpu,
        averageMemory: systemStatus.averageMemory,
        topIssues,
        correlations,
        predictions
      };
    } catch (error) {
      console.error('❌ 시스템 분석 데이터 생성 실패:', error);
      throw error;
    }
  }

  /**
   * 실시간 데이터 스트림 (AI 에이전트용)
   */
  async getRealtimeDataStream(): Promise<{
    servers: StandardServerData[];
    systemMetrics: {
      totalCpu: number;
      totalMemory: number;
      totalDisk: number;
      networkThroughput: number;
      responseTime: number;
    };
    alerts: Array<{
      serverId: string;
      hostname: string;
      message: string;
      severity: string;
      timestamp: Date;
    }>;
  }> {
    try {
      const allServersData = await this.getAllServersData();
      
      // 시스템 전체 메트릭 계산
      const systemMetrics = this.calculateSystemMetrics(allServersData);
      
      // 활성 알림 수집
      const alerts = this.collectActiveAlerts(allServersData);

      return {
        servers: allServersData,
        systemMetrics,
        alerts
      };
    } catch (error) {
      console.error('❌ 실시간 데이터 스트림 생성 실패:', error);
      throw error;
    }
  }

  /**
   * 특정 서버의 상세 히스토리 데이터 (AI 분석용)
   */
  async getServerHistoryForAnalysis(serverId: string, hours: number = 24): Promise<{
    server: VirtualServer | null;
    metrics: ServerMetrics[];
    analysis: {
      averageCpu: number;
      averageMemory: number;
      averageDisk: number;
      peakCpu: number;
      peakMemory: number;
      downtimeMinutes: number;
      alertCount: number;
      performanceScore: number;
    };
  }> {
    try {
      const servers = virtualServerManager.getServers();
      const server = servers.find(s => s.id === serverId) || null;
      const metrics = await virtualServerManager.getMetricsHistory(serverId, hours);
      
      // 분석 데이터 계산
      const analysis = this.calculateServerAnalysis(metrics);

      return {
        server,
        metrics,
        analysis
      };
    } catch (error) {
      console.error(`❌ 서버 히스토리 분석 실패 (${serverId}):`, error);
      throw error;
    }
  }

  /**
   * 트렌드 계산
   */
  private calculateTrends(metrics: ServerMetrics[]): {
    cpu_trend: 'increasing' | 'decreasing' | 'stable';
    memory_trend: 'increasing' | 'decreasing' | 'stable';
    performance_score: number;
  } {
    if (metrics.length < 2) {
      return {
        cpu_trend: 'stable',
        memory_trend: 'stable',
        performance_score: 85
      };
    }

    const recent = metrics.slice(-10); // 최근 10개 데이터 포인트
    const cpuTrend = this.calculateMetricTrend(recent.map(m => m.cpu_usage));
    const memoryTrend = this.calculateMetricTrend(recent.map(m => m.memory_usage));
    
    // 성능 점수 계산 (0-100)
    const avgCpu = recent.reduce((sum, m) => sum + m.cpu_usage, 0) / recent.length;
    const avgMemory = recent.reduce((sum, m) => sum + m.memory_usage, 0) / recent.length;
    const avgResponseTime = recent.reduce((sum, m) => sum + m.response_time, 0) / recent.length;
    
    const performanceScore = Math.max(0, 100 - (avgCpu * 0.4 + avgMemory * 0.4 + (avgResponseTime / 10) * 0.2));

    return {
      cpu_trend: cpuTrend,
      memory_trend: memoryTrend,
      performance_score: Math.round(performanceScore)
    };
  }

  /**
   * 메트릭 트렌드 계산
   */
  private calculateMetricTrend(values: number[]): 'increasing' | 'decreasing' | 'stable' {
    if (values.length < 2) return 'stable';
    
    const first = values.slice(0, Math.floor(values.length / 2));
    const second = values.slice(Math.floor(values.length / 2));
    
    const firstAvg = first.reduce((sum, v) => sum + v, 0) / first.length;
    const secondAvg = second.reduce((sum, v) => sum + v, 0) / second.length;
    
    const diff = secondAvg - firstAvg;
    
    if (Math.abs(diff) < 5) return 'stable';
    return diff > 0 ? 'increasing' : 'decreasing';
  }

  /**
   * 주요 이슈 식별
   */
  private identifyTopIssues(serversData: StandardServerData[]): Array<{
    serverId: string;
    hostname: string;
    issue: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    recommendation: string;
  }> {
    const issues: Array<{
      serverId: string;
      hostname: string;
      issue: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      recommendation: string;
    }> = [];

    serversData.forEach(server => {
      const { metrics } = server;
      
      // CPU 사용률 체크
      if (metrics.cpu_usage > 90) {
        issues.push({
          serverId: server.serverId,
          hostname: server.hostname,
          issue: `높은 CPU 사용률 (${metrics.cpu_usage.toFixed(1)}%)`,
          severity: 'critical',
          recommendation: 'CPU 집약적인 프로세스 확인 및 스케일링 고려'
        });
      } else if (metrics.cpu_usage > 80) {
        issues.push({
          serverId: server.serverId,
          hostname: server.hostname,
          issue: `CPU 사용률 경고 (${metrics.cpu_usage.toFixed(1)}%)`,
          severity: 'high',
          recommendation: 'CPU 사용량 모니터링 강화'
        });
      }

      // 메모리 사용률 체크
      if (metrics.memory_usage > 95) {
        issues.push({
          serverId: server.serverId,
          hostname: server.hostname,
          issue: `메모리 부족 (${metrics.memory_usage.toFixed(1)}%)`,
          severity: 'critical',
          recommendation: '메모리 증설 또는 메모리 누수 확인'
        });
      }

      // 응답 시간 체크
      if (metrics.response_time > 1000) {
        issues.push({
          serverId: server.serverId,
          hostname: server.hostname,
          issue: `느린 응답 시간 (${metrics.response_time.toFixed(1)}ms)`,
          severity: 'high',
          recommendation: '네트워크 및 애플리케이션 성능 최적화'
        });
      }

      // 상태 체크
      if (metrics.status === 'critical' || metrics.status === 'offline') {
        issues.push({
          serverId: server.serverId,
          hostname: server.hostname,
          issue: `서버 상태 이상 (${metrics.status})`,
          severity: 'critical',
          recommendation: '즉시 서버 상태 점검 및 복구 작업 필요'
        });
      }
    });

    // 심각도 순으로 정렬하고 상위 10개만 반환
    return issues
      .sort((a, b) => {
        const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return severityOrder[b.severity] - severityOrder[a.severity];
      })
      .slice(0, 10);
  }

  /**
   * 상관관계 분석
   */
  private analyzeCorrelations(serversData: StandardServerData[]): Array<{
    metric1: string;
    metric2: string;
    correlation: number;
    significance: 'low' | 'medium' | 'high';
  }> {
    const correlations: Array<{
      metric1: string;
      metric2: string;
      correlation: number;
      significance: 'low' | 'medium' | 'high';
    }> = [];

    if (serversData.length < 3) return correlations;

    // CPU와 메모리 상관관계
    const cpuValues = serversData.map(s => s.metrics.cpu_usage);
    const memoryValues = serversData.map(s => s.metrics.memory_usage);
    const cpuMemoryCorr = this.calculateCorrelation(cpuValues, memoryValues);
    
    correlations.push({
      metric1: 'CPU Usage',
      metric2: 'Memory Usage',
      correlation: cpuMemoryCorr,
      significance: Math.abs(cpuMemoryCorr) > 0.7 ? 'high' : Math.abs(cpuMemoryCorr) > 0.4 ? 'medium' : 'low'
    });

    // CPU와 응답시간 상관관계
    const responseTimeValues = serversData.map(s => s.metrics.response_time);
    const cpuResponseCorr = this.calculateCorrelation(cpuValues, responseTimeValues);
    
    correlations.push({
      metric1: 'CPU Usage',
      metric2: 'Response Time',
      correlation: cpuResponseCorr,
      significance: Math.abs(cpuResponseCorr) > 0.7 ? 'high' : Math.abs(cpuResponseCorr) > 0.4 ? 'medium' : 'low'
    });

    return correlations;
  }

  /**
   * 상관계수 계산
   */
  private calculateCorrelation(x: number[], y: number[]): number {
    const n = x.length;
    if (n !== y.length || n < 2) return 0;

    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumXX = x.reduce((sum, val) => sum + val * val, 0);
    const sumYY = y.reduce((sum, val) => sum + val * val, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));

    return denominator === 0 ? 0 : numerator / denominator;
  }

  /**
   * 예측 분석 생성
   */
  private async generatePredictions(serversData: StandardServerData[]): Promise<Array<{
    serverId: string;
    metric: string;
    predicted_value: number;
    confidence: number;
    time_horizon: string;
  }>> {
    const predictions: Array<{
      serverId: string;
      metric: string;
      predicted_value: number;
      confidence: number;
      time_horizon: string;
    }> = [];

    // 간단한 선형 예측 (실제로는 더 복잡한 ML 모델 사용)
    for (const server of serversData.slice(0, 5)) { // 상위 5개 서버만
      const { metrics, trends } = server;
      
      // CPU 예측
      let cpuPrediction = metrics.cpu_usage;
      if (trends.cpu_trend === 'increasing') {
        cpuPrediction += Math.random() * 10 + 5;
      } else if (trends.cpu_trend === 'decreasing') {
        cpuPrediction -= Math.random() * 5 + 2;
      }
      
      predictions.push({
        serverId: server.serverId,
        metric: 'CPU Usage',
        predicted_value: Math.max(0, Math.min(100, cpuPrediction)),
        confidence: 0.75 + Math.random() * 0.2,
        time_horizon: '1 hour'
      });

      // 메모리 예측
      let memoryPrediction = metrics.memory_usage;
      if (trends.memory_trend === 'increasing') {
        memoryPrediction += Math.random() * 8 + 3;
      } else if (trends.memory_trend === 'decreasing') {
        memoryPrediction -= Math.random() * 4 + 1;
      }
      
      predictions.push({
        serverId: server.serverId,
        metric: 'Memory Usage',
        predicted_value: Math.max(0, Math.min(100, memoryPrediction)),
        confidence: 0.70 + Math.random() * 0.25,
        time_horizon: '1 hour'
      });
    }

    return predictions;
  }

  /**
   * 시스템 메트릭 계산
   */
  private calculateSystemMetrics(serversData: StandardServerData[]): {
    totalCpu: number;
    totalMemory: number;
    totalDisk: number;
    networkThroughput: number;
    responseTime: number;
  } {
    if (serversData.length === 0) {
      return {
        totalCpu: 0,
        totalMemory: 0,
        totalDisk: 0,
        networkThroughput: 0,
        responseTime: 0
      };
    }

    const totalCpu = serversData.reduce((sum, s) => sum + s.metrics.cpu_usage, 0) / serversData.length;
    const totalMemory = serversData.reduce((sum, s) => sum + s.metrics.memory_usage, 0) / serversData.length;
    const totalDisk = serversData.reduce((sum, s) => sum + s.metrics.disk_usage, 0) / serversData.length;
    const networkThroughput = serversData.reduce((sum, s) => sum + s.metrics.network_in + s.metrics.network_out, 0);
    const responseTime = serversData.reduce((sum, s) => sum + s.metrics.response_time, 0) / serversData.length;

    return {
      totalCpu: Math.round(totalCpu * 10) / 10,
      totalMemory: Math.round(totalMemory * 10) / 10,
      totalDisk: Math.round(totalDisk * 10) / 10,
      networkThroughput: Math.round(networkThroughput),
      responseTime: Math.round(responseTime * 10) / 10
    };
  }

  /**
   * 활성 알림 수집
   */
  private collectActiveAlerts(serversData: StandardServerData[]): Array<{
    serverId: string;
    hostname: string;
    message: string;
    severity: string;
    timestamp: Date;
  }> {
    const alerts: Array<{
      serverId: string;
      hostname: string;
      message: string;
      severity: string;
      timestamp: Date;
    }> = [];

    serversData.forEach(server => {
      server.metrics.alerts.forEach(alert => {
        let severity = 'info';
        if (server.metrics.status === 'critical') severity = 'critical';
        else if (server.metrics.status === 'warning') severity = 'warning';

        alerts.push({
          serverId: server.serverId,
          hostname: server.hostname,
          message: alert,
          severity,
          timestamp: server.metrics.timestamp
        });
      });
    });

    return alerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * 서버 분석 계산
   */
  private calculateServerAnalysis(metrics: ServerMetrics[]): {
    averageCpu: number;
    averageMemory: number;
    averageDisk: number;
    peakCpu: number;
    peakMemory: number;
    downtimeMinutes: number;
    alertCount: number;
    performanceScore: number;
  } {
    if (metrics.length === 0) {
      return {
        averageCpu: 0,
        averageMemory: 0,
        averageDisk: 0,
        peakCpu: 0,
        peakMemory: 0,
        downtimeMinutes: 0,
        alertCount: 0,
        performanceScore: 0
      };
    }

    const averageCpu = metrics.reduce((sum, m) => sum + m.cpu_usage, 0) / metrics.length;
    const averageMemory = metrics.reduce((sum, m) => sum + m.memory_usage, 0) / metrics.length;
    const averageDisk = metrics.reduce((sum, m) => sum + m.disk_usage, 0) / metrics.length;
    const peakCpu = Math.max(...metrics.map(m => m.cpu_usage));
    const peakMemory = Math.max(...metrics.map(m => m.memory_usage));
    
    const downtimeMinutes = metrics.filter(m => m.status === 'offline').length * 5; // 5분 간격
    const alertCount = metrics.reduce((sum, m) => sum + m.alerts.length, 0);
    
    // 성능 점수 계산
    const performanceScore = Math.max(0, 100 - (averageCpu * 0.4 + averageMemory * 0.4 + (downtimeMinutes / 60) * 20));

    return {
      averageCpu: Math.round(averageCpu * 10) / 10,
      averageMemory: Math.round(averageMemory * 10) / 10,
      averageDisk: Math.round(averageDisk * 10) / 10,
      peakCpu: Math.round(peakCpu * 10) / 10,
      peakMemory: Math.round(peakMemory * 10) / 10,
      downtimeMinutes,
      alertCount,
      performanceScore: Math.round(performanceScore)
    };
  }

  /**
   * 캐시 클리어
   */
  clearCache(): void {
    this.dataCache.clear();
    this.lastUpdateTime = new Date(0);
  }
}

// 싱글톤 인스턴스
export const virtualServerDataAdapter = VirtualServerDataAdapter.getInstance(); 