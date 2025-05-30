/**
 * 🎲 서버 시뮬레이션 엔진 v2.1 - Prometheus 통합
 * 
 * 현실적 패턴 기반 고도화된 서버 데이터 생성
 * - RealisticPatternEngine 통합
 * - Prometheus 메트릭 지원
 * - 서버별 특성화된 메트릭
 * - 동적 장애 시나리오
 * - 상관관계 모델링
 */

import { realisticPatternEngine } from '../modules/data-generation/RealisticPatternEngine';
import { 
  prometheusFormatter, 
  type PrometheusMetric,
  type ServerMetricsForPrometheus 
} from '../modules/data-generation/PrometheusMetricsFormatter';
import { 
  ServerMetrics as BaseServerMetrics, 
  ServerEnvironment,
  ServerRole,
  ServerStatus,
  ServerAlert,
  FailureScenario,
  SimulationState
} from '../types/server';
import { timerManager } from '../utils/TimerManager';
import { cacheService } from './cacheService';
import { vercelStatusService } from './vercelStatusService';
import { redisTimeSeriesService } from './redisTimeSeriesService';
import { memoryOptimizer } from '../utils/MemoryOptimizer';

// 확장된 서버 메트릭 인터페이스
export interface EnhancedServerMetrics extends BaseServerMetrics {
  // 새로운 현실적 메트릭 필드
  pattern_info?: {
    server_profile: string;
    current_load: 'low' | 'medium' | 'high';
    time_multiplier: number;
    seasonal_multiplier: number;
    burst_active: boolean;
  };
  correlation_metrics?: {
    cpu_memory_correlation: number;
    response_time_impact: number;
    stability_score: number;
  };
}

// 확장된 시뮬레이션 상태
interface EnhancedSimulationState {
  isRunning: boolean;
  servers: EnhancedServerMetrics[];
  dataCount: number;
  activeScenarios: string[];
  startTime: number | null;
  intervalId: NodeJS.Timeout | null;
  prometheusEnabled: boolean; // Prometheus 메트릭 활성화 여부
}

export class SimulationEngine {
  private state: EnhancedSimulationState = {
    isRunning: false,
    servers: [],
    dataCount: 0,
    activeScenarios: [],
    startTime: null,
    intervalId: null,
    prometheusEnabled: true // 기본적으로 활성화
  };

  private UPDATE_INTERVAL = 30000; // 30초 (성능 최적화)

  private failureScenarios: FailureScenario[] = [
    {
      id: 'disk-shortage-cascade',
      name: '🚨 디스크 부족 연쇄 장애',
      servers: ['server-db-01', 'server-web-01', 'server-web-02', 'server-cache-01'],
      probability: 15,
      steps: [
        { 
          delay: 0, 
          server_id: 'server-db-01', 
          metric: 'disk_usage', 
          value: 95, 
          alert: { 
            type: 'disk', 
            message: '디스크 공간 부족 - 즉시 정리 필요', 
            severity: 'critical',
            resolved: false
          } 
        },
        { 
          delay: 30000, 
          server_id: 'server-web-01', 
          metric: 'response_time', 
          value: 8000, 
          alert: { 
            type: 'response_time', 
            message: '데이터베이스 연결 지연으로 응답시간 증가', 
            severity: 'warning',
            resolved: false
          } 
        },
        { 
          delay: 45000, 
          server_id: 'server-web-02', 
          metric: 'response_time', 
          value: 12000, 
          alert: { 
            type: 'response_time', 
            message: '서비스 응답 불가', 
            severity: 'critical',
            resolved: false
          } 
        },
        { 
          delay: 60000, 
          server_id: 'server-cache-01', 
          metric: 'cpu_usage', 
          value: 85, 
          alert: { 
            type: 'cpu', 
            message: '캐시 서버 과부하', 
            severity: 'warning',
            resolved: false
          } 
        }
      ]
    }
  ];

  private useRealisticPatterns: boolean = true;
  private previousMetricsCache: Map<string, any> = new Map();
  private lastMemoryOptimization: number = 0;
  private readonly MEMORY_CHECK_INTERVAL = 60000; // 1분마다 메모리 체크

  constructor() {
    // 즉시 기본 서버 생성 (동기적)
    this.state.servers = this.generateInitialServers();
    console.log('🎯 시뮬레이션 엔진 초기화 완료 (Prometheus 지원)');
    
    // Vercel 상태 기반 최적화 (비동기적, 백그라운드)
    this.initializeWithAutoScaling().catch(error => {
      console.warn('⚠️ 오토스케일링 최적화 실패, 기본 설정 유지:', error);
    });
    
    // 메모리 최적화 모니터링 시작
    this.startMemoryOptimization();
  }

  /**
   * 🔄 Vercel 상태 기반 초기화
   */
  private async initializeWithAutoScaling(): Promise<void> {
    try {
      // Vercel 상태 확인 및 스케일링 설정 가져오기
      const scalingConfig = await vercelStatusService.updateScalingConfig();
      const vercelStatus = vercelStatusService.getCurrentStatus();
      
      console.log(`🔍 Vercel 상태 감지: ${vercelStatus?.plan || 'unknown'} 플랜`);
      console.log(`⚡ 오토스케일링 설정: ${scalingConfig.maxServers}서버, ${scalingConfig.maxMetrics}메트릭`);
      
      // 스케일링 설정에 따른 동적 서버 생성
      this.state.servers = this.generateServersBasedOnPlan(scalingConfig);
      this.UPDATE_INTERVAL = scalingConfig.updateInterval;
      this.state.prometheusEnabled = scalingConfig.prometheusEnabled;
      
    } catch (error) {
      console.warn('⚠️ 오토스케일링 초기화 실패, 기본 설정 사용:', error);
      this.state.servers = this.generateInitialServers();
    }
  }

  /**
   * 📊 스케일링 설정 기반 서버 생성 (8-30개 범위, 상태 분포 보장)
   */
  private generateServersBasedOnPlan(scalingConfig: any): EnhancedServerMetrics[] {
    // 8-30개 범위로 제한
    const maxServers = Math.min(Math.max(scalingConfig.maxServers, 8), 30);
    const servers: EnhancedServerMetrics[] = [];
    
    console.log(`🏗️ ${maxServers}개 서버 생성 중 (상태 분포: 10% 심각, 20% 경고, 70% 정상)...`);
    
    // 📊 상태 분포 계산 (10% 심각, 20% 경고, 70% 정상)
    const criticalCount = Math.max(1, Math.round(maxServers * 0.1));  // 최소 1개, 10%
    const warningCount = Math.max(1, Math.round(maxServers * 0.2));   // 최소 1개, 20%
    const healthyCount = maxServers - criticalCount - warningCount;   // 나머지는 정상

    console.log(`📊 상태 분포: 심각 ${criticalCount}개, 경고 ${warningCount}개, 정상 ${healthyCount}개`);

    // 서버 타입별 비율 (전체 maxServers 기준)
    const onPremCount = Math.max(2, Math.floor(maxServers * 0.25)); // 최소 2개, 전체의 25%
    const awsCount = Math.floor(maxServers * 0.35); // 전체의 35%
    const k8sCount = Math.floor(maxServers * 0.25); // 전체의 25%
    const multiCount = maxServers - onPremCount - awsCount - k8sCount; // 나머지

    // 상태 카운터
    let criticalAssigned = 0;
    let warningAssigned = 0;
    let serverIndex = 0;

    // 📍 상태 할당 함수
    const getServerStatus = (): 'healthy' | 'warning' | 'critical' => {
      if (criticalAssigned < criticalCount) {
        criticalAssigned++;
        return 'critical';
      } else if (warningAssigned < warningCount) {
        warningAssigned++;
        return 'warning';
      } else {
        return 'healthy';
      }
    };

    // 온프레미스 서버
    for (let i = 1; i <= onPremCount; i++) {
      const status = getServerStatus();
      servers.push(this.createServerWithStatus(
        `onprem-${String(i).padStart(2, '0')}.local`,
        'onpremise',
        'database',
        status,
        ++serverIndex
      ));
    }

    // AWS 서버
    for (let i = 1; i <= awsCount; i++) {
      const status = getServerStatus();
      const serverTypes = ['web', 'database', 'cache'];
      const serverType = serverTypes[Math.floor(Math.random() * serverTypes.length)];
      servers.push(this.createServerWithStatus(
        `aws-${serverType}-${String(i).padStart(2, '0')}.amazonaws.com`,
        'aws',
        serverType as any,
        status,
        ++serverIndex
      ));
    }

    // Kubernetes 서버
    for (let i = 1; i <= k8sCount; i++) {
      const status = getServerStatus();
      servers.push(this.createServerWithStatus(
        `k8s-worker-${String(i).padStart(2, '0')}.cluster.local`,
        'kubernetes',
        'web',
        status,
        ++serverIndex
      ));
    }

    // 멀티클라우드 서버
    for (let i = 1; i <= multiCount; i++) {
      const status = getServerStatus();
      servers.push(this.createServerWithStatus(
        `multi-${String(i).padStart(2, '0')}.example.com`,
        'gcp',
        'web',
        status,
        ++serverIndex
      ));
    }

    // 📊 최종 상태 분포 검증
    const finalStats = {
      critical: servers.filter(s => s.status === 'critical').length,
      warning: servers.filter(s => s.status === 'warning').length,
      healthy: servers.filter(s => s.status === 'healthy').length,
      total: servers.length
    };

    console.log(`✅ 서버 생성 완료 - 총 ${finalStats.total}개: 심각 ${finalStats.critical}개(${(finalStats.critical/finalStats.total*100).toFixed(1)}%), 경고 ${finalStats.warning}개(${(finalStats.warning/finalStats.total*100).toFixed(1)}%), 정상 ${finalStats.healthy}개(${(finalStats.healthy/finalStats.total*100).toFixed(1)}%)`);

    return servers;
  }

  private randomBetween(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * 🔄 현실적 패턴 기반 메트릭 업데이트
   */
  private updateServerMetricsRealistic(server: EnhancedServerMetrics): EnhancedServerMetrics {
    const timestamp = new Date();
    const serverType = this.mapRoleToServerType(server.role);
    const previousMetrics = this.previousMetricsCache.get(server.id);

    if (this.useRealisticPatterns) {
      // 현실적 패턴 엔진 사용
      const cpu = realisticPatternEngine.generateRealisticMetric(
        'cpu_usage', 
        serverType, 
        timestamp, 
        previousMetrics
      );
      
      const memory = realisticPatternEngine.generateRealisticMetric(
        'memory_usage', 
        serverType, 
        timestamp, 
        { ...previousMetrics, cpu_usage: cpu }
      );
      
      const disk = realisticPatternEngine.generateRealisticMetric(
        'disk_usage', 
        serverType, 
        timestamp, 
        { ...previousMetrics, cpu_usage: cpu, memory_usage: memory }
      );
      
      const networkIn = realisticPatternEngine.generateRealisticMetric(
        'network_in', 
        serverType, 
        timestamp, 
        previousMetrics
      );
      
      const networkOut = realisticPatternEngine.generateRealisticMetric(
        'network_out', 
        serverType, 
        timestamp, 
        previousMetrics
      );
      
      const responseTime = realisticPatternEngine.generateRealisticMetric(
        'response_time', 
        serverType, 
        timestamp, 
        { ...previousMetrics, cpu_usage: cpu, memory_usage: memory }
      );

      // 패턴 정보 생성
      const patternSummary = realisticPatternEngine.getPatternSummary(serverType, timestamp);
      const serverProfile = realisticPatternEngine.getServerProfile(serverType);

      // 장애 시나리오 체크
      const currentMetrics = { cpu_usage: cpu, memory_usage: memory, disk_usage: disk, response_time: responseTime };
      const failureCheck = realisticPatternEngine.shouldTriggerFailure(serverType, currentMetrics, timestamp);

      // 상태 업데이트
      let newStatus: ServerStatus = 'healthy';
      const newAlerts: ServerAlert[] = [];

      if (failureCheck.shouldTrigger && failureCheck.failureType && failureCheck.severity) {
        newStatus = failureCheck.severity > 3 ? 'critical' : failureCheck.severity > 1 ? 'warning' : 'healthy';
        
        newAlerts.push({
          id: `alert-${Date.now()}`,
          server_id: server.id,
          type: this.mapFailureTypeToAlertType(failureCheck.failureType),
          message: this.generateAlertMessage(failureCheck.failureType, failureCheck.severity),
          severity: failureCheck.severity > 3 ? 'critical' : 'warning',
          timestamp: timestamp.toISOString(),
          resolved: false
        });

        console.log(`🔥 ${server.hostname}: ${failureCheck.failureType} 감지 (심각도: ${failureCheck.severity})`);
      } else {
        // 기존 알림 중 자동 복구 가능한 것들 제거
        const existingAlerts = server.alerts.filter(alert => {
          const alertAge = Date.now() - new Date(alert.timestamp).getTime();
          const recoveryTime = (serverProfile?.characteristics.recovery_time || 5) * 60 * 1000; // 분을 밀리초로
          return alertAge < recoveryTime;
        });
        newAlerts.push(...existingAlerts);
      }

      // 메트릭 캐시 업데이트
      this.previousMetricsCache.set(server.id, currentMetrics);

      return {
        ...server,
        cpu_usage: Math.round(cpu * 100) / 100,
        memory_usage: Math.round(memory * 100) / 100,
        disk_usage: Math.round(disk * 100) / 100,
        network_in: Math.round(networkIn * 100) / 100,
        network_out: Math.round(networkOut * 100) / 100,
        response_time: Math.round(responseTime),
        status: newStatus,
        alerts: newAlerts,
        last_updated: timestamp.toISOString(),
        
        // 새로운 패턴 정보
        pattern_info: {
          server_profile: serverProfile?.name || 'Unknown',
          current_load: patternSummary.expectedLoad,
          time_multiplier: Math.round(patternSummary.timeMultiplier * 100) / 100,
          seasonal_multiplier: Math.round(patternSummary.seasonalMultiplier * 100) / 100,
          burst_active: failureCheck.shouldTrigger || false
        },
        
        // 상관관계 정보
        correlation_metrics: {
          cpu_memory_correlation: serverProfile?.correlation.cpu_memory || 0,
          response_time_impact: Math.abs(serverProfile?.correlation.cpu_response_time || 0),
          stability_score: serverProfile?.characteristics.stability || 0
        }
      };
    } else {
      // 기존 단순 랜덤 방식 (폴백)
      return this.updateServerMetricsLegacy(server);
    }
  }

  /**
   * 📊 Prometheus 메트릭 생성
   */
  getPrometheusMetrics(serverId?: string): PrometheusMetric[] {
    if (!this.state.prometheusEnabled) {
      return [];
    }

    let servers = this.state.servers;
    
    if (serverId) {
      const server = servers.find(s => s.id === serverId);
      if (!server) {
        console.warn(`⚠️ 서버 '${serverId}' not found for Prometheus metrics`);
        return [];
      }
      servers = [server];
    }

    let allMetrics: PrometheusMetric[] = [];

    // 각 서버별 메트릭 생성
    servers.forEach(server => {
      const serverMetrics = prometheusFormatter.formatServerMetrics(server as ServerMetricsForPrometheus);
      allMetrics = allMetrics.concat(serverMetrics);
    });

    // 시스템 전체 요약 메트릭 추가 (전체 조회시에만)
    if (!serverId) {
      const systemMetrics = prometheusFormatter.generateSystemSummaryMetrics(
        servers as ServerMetricsForPrometheus[]
      );
      allMetrics = allMetrics.concat(systemMetrics);
    }

    return allMetrics;
  }

  /**
   * 📝 Prometheus 텍스트 형식 출력
   */
  getPrometheusText(serverId?: string): string {
    const metrics = this.getPrometheusMetrics(serverId);
    return prometheusFormatter.formatToPrometheusText(metrics);
  }

  /**
   * 🔍 메트릭 필터링 (라벨 기반)
   */
  getFilteredPrometheusMetrics(filters: Record<string, string>): PrometheusMetric[] {
    const allMetrics = this.getPrometheusMetrics();
    return prometheusFormatter.filterMetrics(allMetrics, filters);
  }

  /**
   * 📈 메트릭 집계
   */
  getAggregatedMetrics(operation: 'sum' | 'avg' | 'max' | 'min' = 'avg'): Record<string, number> {
    const allMetrics = this.getPrometheusMetrics();
    return prometheusFormatter.aggregateMetrics(allMetrics, operation);
  }

  /**
   * 🎛️ Prometheus 메트릭 활성화/비활성화
   */
  togglePrometheusMetrics(enabled: boolean): void {
    this.state.prometheusEnabled = enabled;
    console.log(`📊 Prometheus 메트릭: ${enabled ? '활성화' : '비활성화'}`);
  }

  /**
   * 🔄 서버 역할을 패턴 엔진 타입으로 매핑
   */
  private mapRoleToServerType(role: ServerRole): string {
    const mapping: Record<ServerRole, string> = {
      'web': 'web',
      'database': 'database',
      'api': 'api',
      'worker': 'kubernetes',
      'gateway': 'api',
      'cache': 'cache',
      'storage': 'storage',
      'monitoring': 'monitoring'
    };
    
    return mapping[role] || 'web';
  }

  /**
   * 🔄 장애 타입을 알림 타입으로 매핑
   */
  private mapFailureTypeToAlertType(failureType: string): ServerAlert['type'] {
    const mapping: Record<string, ServerAlert['type']> = {
      'memory_leak': 'memory',
      'cpu_spike': 'cpu',
      'disk_full': 'disk',
      'general_slowdown': 'response_time'
    };
    
    return mapping[failureType] || 'response_time';
  }

  /**
   * 🚨 알림 메시지 생성
   */
  private generateAlertMessage(failureType: string, severity: number): string {
    const messages: Record<string, string[]> = {
      'memory_leak': [
        '메모리 누수가 감지되었습니다',
        '심각한 메모리 누수로 성능 저하',
        '메모리 누수로 인한 시스템 불안정',
        '치명적 메모리 누수 - 즉시 조치 필요'
      ],
      'cpu_spike': [
        'CPU 사용률이 급증했습니다',
        '높은 CPU 사용률로 응답 지연',
        'CPU 과부하로 서비스 영향',
        '치명적 CPU 과부하 - 긴급 조치 필요'
      ],
      'disk_full': [
        '디스크 공간이 부족합니다',
        '디스크 용량 부족으로 쓰기 실패 위험',
        '디스크 가득함 - 서비스 중단 위험',
        '디스크 풀 - 즉시 정리 필요'
      ],
      'general_slowdown': [
        '시스템 성능이 저하되었습니다',
        '응답 속도 저하가 감지됨',
        '시스템 성능 저하로 사용자 영향',
        '심각한 성능 저하 - 즉시 점검 필요'
      ]
    };

    const messageArray = messages[failureType] || messages['general_slowdown'];
    const index = Math.min(severity - 1, messageArray.length - 1);
    return messageArray[index];
  }

  /**
   * 🔄 레거시 메트릭 업데이트 (폴백용)
   */
  private updateServerMetricsLegacy(server: EnhancedServerMetrics): EnhancedServerMetrics {
    // 기존 단순 랜덤 방식 유지
    const variation = 5;
    
    return {
      ...server,
      cpu_usage: Math.max(0, Math.min(100, server.cpu_usage + (Math.random() - 0.5) * variation)),
      memory_usage: Math.max(0, Math.min(100, server.memory_usage + (Math.random() - 0.5) * variation)),
      disk_usage: Math.max(0, Math.min(100, server.disk_usage + (Math.random() - 0.5) * (variation / 2))),
      network_in: Math.max(0, server.network_in + (Math.random() - 0.5) * 20),
      network_out: Math.max(0, server.network_out + (Math.random() - 0.5) * 15),
      response_time: Math.max(10, server.response_time + (Math.random() - 0.5) * 50),
      last_updated: new Date().toISOString()
    };
  }

  /**
   * 🎛️ 패턴 엔진 토글
   */
  toggleRealisticPatterns(enabled: boolean): void {
    this.useRealisticPatterns = enabled;
    console.log(`🎯 현실적 패턴 엔진: ${enabled ? '활성화' : '비활성화'}`);
  }

  /**
   * 📊 시뮬레이션 상태 요약
   */
  getSimulationSummary(): {
    totalServers: number;
    patternsEnabled: boolean;
    prometheusEnabled: boolean;
    currentLoad: string;
    activeFailures: number;
    avgStability: number;
    totalMetrics: number;
  } {
    const servers = this.state.servers;
    const activeFailures = servers.filter(s => s.status !== 'healthy').length;
    const avgStability = servers.reduce((sum, s) => 
      sum + (s.correlation_metrics?.stability_score || 0), 0) / servers.length;
    
    const currentHour = new Date().getHours();
    let currentLoad = 'medium';
    if ([9, 10, 11, 14, 15, 16].includes(currentHour)) currentLoad = 'high';
    else if ([0, 1, 2, 3, 4, 5, 23].includes(currentHour)) currentLoad = 'low';

    // Prometheus 메트릭 총 개수 계산
    const totalMetrics = this.state.prometheusEnabled ? 
      this.getPrometheusMetrics().length : 0;

    return {
      totalServers: servers.length,
      patternsEnabled: this.useRealisticPatterns,
      prometheusEnabled: this.state.prometheusEnabled,
      currentLoad,
      activeFailures,
      avgStability: Math.round(avgStability * 100) / 100,
      totalMetrics
    };
  }

  public start(): void {
    if (this.state.isRunning) {
      console.log('⚠️ 시뮬레이션이 이미 실행 중입니다');
      return;
    }

    this.state.isRunning = true;
    
    // TimerManager를 사용한 시뮬레이션 업데이트
    timerManager.register({
      id: 'simulation-engine-update',
      callback: () => this.updateSimulation(),
      interval: this.UPDATE_INTERVAL,
      priority: 'high'
    });

    console.log(`🚀 시뮬레이션 시작 (${this.state.servers.length}개 서버, ${this.UPDATE_INTERVAL/1000}초 간격, Prometheus: ${this.state.prometheusEnabled ? 'ON' : 'OFF'})`);
  }

  public stop(): void {
    if (!this.state.isRunning) {
      console.log('⚠️ 시뮬레이션이 실행 중이 아닙니다');
      return;
    }

    this.state.isRunning = false;
    timerManager.unregister('simulation-engine-update');
    
    console.log('🛑 시뮬레이션 정지');
  }

  /**
   * 📊 시뮬레이션 업데이트 (캐싱 및 시계열 저장 포함)
   */
  private updateSimulation(): void {
    if (!this.state.isRunning) return;

    this.state.servers = this.state.servers.map(server => 
      this.updateServerMetricsRealistic(server)
    );

    this.state.dataCount++;

    // 🔥 Redis 캐싱 추가
    cacheService.cacheServerMetrics(this.state.servers).catch(error => {
      console.warn('⚠️ 캐싱 실패 (시뮬레이션은 계속):', error.message);
    });

    // 📊 시계열 데이터 저장 (InfluxDB 대체)
    redisTimeSeriesService.storeMetrics(this.state.servers).catch(error => {
      console.warn('⚠️ 시계열 저장 실패 (시뮬레이션은 계속):', error.message);
    });

    const summary = this.getSimulationSummary();
    console.log(`📊 시뮬레이션 업데이트 ${this.state.dataCount}: ${summary.totalServers}개 서버, ${summary.totalMetrics}개 메트릭 (패턴: ${this.useRealisticPatterns ? 'ON' : 'OFF'}, Prometheus: ${summary.prometheusEnabled ? 'ON' : 'OFF'})`);
  }

  public getState(): EnhancedSimulationState {
    return { ...this.state };
  }

  public getServers(): EnhancedServerMetrics[] {
    return [...this.state.servers];
  }

  public getServerById(id: string): EnhancedServerMetrics | undefined {
    return this.state.servers.find(server => server.id === id);
  }

  /**
   * 🔍 시뮬레이션 실행 상태 확인
   */
  public isRunning(): boolean {
    return this.state.isRunning;
  }

  private generateInitialServers(): EnhancedServerMetrics[] {
    console.log('🏗️ 초기 서버 생성 시작...');
    
    // 기본 스케일링 설정으로 서버 생성
    const defaultScalingConfig = {
      minServers: 8,
      maxServers: 16, // 8~16개 서버로 시작
      targetCpuUsage: 70,
      targetMemoryUsage: 75
    };
    
    const servers = this.generateServersBasedOnPlan(defaultScalingConfig);
    
    console.log(`✅ 초기 서버 ${servers.length}개 생성 완료`);
    return servers;
  }

  /**
   * 🔧 상태에 따른 서버 생성 (메트릭 및 알림 포함)
   */
  private createServerWithStatus(hostname: string, environment: ServerEnvironment, role: ServerRole, status: ServerStatus, index: number): EnhancedServerMetrics {
    // 상태에 따른 메트릭 조정
    let cpuBase = 20, memoryBase = 30, diskBase = 40, responseBase = 80;
    const alerts: ServerAlert[] = [];

    switch (status) {
      case 'critical':
        // 심각 상태: 높은 리소스 사용률, 긴 응답시간, 알림 생성
        cpuBase = 85;
        memoryBase = 90;
        diskBase = 95;
        responseBase = 800;
        
        // 심각 상태 알림 추가
        alerts.push({
          id: `alert-${index}-critical`,
          server_id: `server-${role}-${index.toString().padStart(2, '0')}`,
          type: 'cpu',
          message: `심각: CPU 사용률 ${cpuBase}% 초과`,
          severity: 'critical',
          timestamp: new Date().toISOString(),
          resolved: false
        });
        
        if (diskBase > 90) {
          alerts.push({
            id: `alert-${index}-disk`,
            server_id: `server-${role}-${index.toString().padStart(2, '0')}`,
            type: 'disk',
            message: `심각: 디스크 사용률 ${diskBase}% - 즉시 조치 필요`,
            severity: 'critical',
            timestamp: new Date().toISOString(),
            resolved: false
          });
        }
        break;

      case 'warning':
        // 경고 상태: 중간 리소스 사용률, 약간 긴 응답시간
        cpuBase = 70;
        memoryBase = 75;
        diskBase = 80;
        responseBase = 400;
        
        // 경고 상태 알림 추가
        alerts.push({
          id: `alert-${index}-warning`,
          server_id: `server-${role}-${index.toString().padStart(2, '0')}`,
          type: 'memory',
          message: `경고: 성능 저하 감지 - CPU ${cpuBase}%, 메모리 ${memoryBase}%`,
          severity: 'warning',
          timestamp: new Date().toISOString(),
          resolved: false
        });
        break;

      case 'healthy':
      default:
        // 정상 상태: 낮은 리소스 사용률, 빠른 응답시간
        cpuBase = this.randomBetween(15, 45);
        memoryBase = this.randomBetween(20, 50);
        diskBase = this.randomBetween(25, 65);
        responseBase = this.randomBetween(50, 150);
        break;
    }

    return {
      id: `server-${role}-${index.toString().padStart(2, '0')}`,
      hostname,
      environment,
      role,
      status,
      cpu_usage: cpuBase + this.randomBetween(-5, 5), // ±5% 변동
      memory_usage: memoryBase + this.randomBetween(-5, 5),
      disk_usage: diskBase + this.randomBetween(-3, 3),
      network_in: this.randomBetween(50, 200),
      network_out: this.randomBetween(40, 180),
      response_time: responseBase + this.randomBetween(-20, 50),
      uptime: status === 'critical' 
        ? this.randomBetween(24, 168)  // 심각 상태: 1일-1주
        : this.randomBetween(168, 8760), // 정상/경고: 1주-1년
      last_updated: new Date().toISOString(),
      alerts
    };
  }

  /**
   * 🧠 메모리 최적화 시작
   */
  private startMemoryOptimization(): void {
    // 메모리 모니터링 시작 (30초 간격)
    memoryOptimizer.startMemoryMonitoring(30000);
    console.log('🧠 시뮬레이션 엔진 메모리 최적화 활성화');
  }

  /**
   * 🔄 메모리 정리 체크
   */
  private async checkMemoryOptimization(): Promise<void> {
    const now = Date.now();
    
    // 1분마다 체크
    if (now - this.lastMemoryOptimization > this.MEMORY_CHECK_INTERVAL) {
      const memoryStats = memoryOptimizer.getCurrentMemoryStats();
      
      // 75% 이상 사용 시 정리
      if (memoryStats.usagePercent > 75) {
        console.log(`🧠 메모리 정리 필요: ${memoryStats.usagePercent}%`);
        
        // 캐시된 메트릭 정리 (100개 이상 시)
        if (this.previousMetricsCache.size > 100) {
          this.previousMetricsCache.clear();
          console.log('🗑️ 메트릭 캐시 정리 완료');
        }
        
        // 메모리 최적화 실행
        await memoryOptimizer.optimizeMemoryNow();
        this.lastMemoryOptimization = now;
      }
    }
  }
}

// 싱글톤 인스턴스
export const simulationEngine = new SimulationEngine(); 