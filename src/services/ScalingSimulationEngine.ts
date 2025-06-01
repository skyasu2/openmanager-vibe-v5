/**
 * 🚀 서버 스케일링 시뮬레이션 엔진 v1.0
 * 
 * 목적: 오토스케일링과 AI 분석 로직 명확 분리
 * - 운영 시뮬레이션: scale-out/scale-in 자연스럽게 동작
 * - AI 분석 안정성: 고정된 서버 상태 기반 분석
 * - 메타 이벤트 분리: scaleEvent는 참조용, 실제 분석은 metrics 기반
 */

import { 
  ServerMetrics, 
  ServerAlert, 
  ServerRole, 
  ServerStatus, 
  ServerEnvironment,
  SERVER_TYPE_DEFINITIONS 
} from '../types/server';
import { EnhancedServerMetrics } from './simulationEngine';

/**
 * 🎯 AI 분석 전용 서버 타겟
 */
export interface AIAnalysisTarget extends EnhancedServerMetrics {
  isAnalysisTarget: boolean; // AI 분석 대상 여부
  analysisRole: 'primary' | 'secondary' | 'monitoring'; // 분석 우선순위
  lastAnalyzed: number; // 마지막 분석 시점
}

/**
 * 🔄 스케일링 이벤트 (메타 정보)
 */
export interface ScalingEvent {
  id: string;
  type: 'scale_out' | 'scale_in' | 'server_added' | 'server_retired';
  timestamp: number;
  triggeredBy: 'auto' | 'manual' | 'prediction';
  serverCount: { before: number; after: number };
  affectedServers: string[];
  reason: string;
  metadata: {
    avgCpu: number;
    avgMemory: number;
    criticalServers: number;
    costImpact?: number;
  };
}

/**
 * 🏗️ 서버 풀 구성
 */
export interface ServerPool {
  // 실제 운영 서버 (동적 변경)
  operational: EnhancedServerMetrics[];
  
  // AI 분석 대상 서버 (고정)
  analysisTargets: AIAnalysisTarget[];
  
  // 스케일링 이벤트 기록
  scalingEvents: ScalingEvent[];
  
  // 메타 정보
  metadata: {
    currentScale: number;
    targetScale: number;
    minServers: number;
    maxServers: number;
    lastScalingAction: number;
  };
}

/**
 * 🎮 스케일링 시뮬레이션 엔진
 */
export class ScalingSimulationEngine {
  private static instance: ScalingSimulationEngine;
  private serverPool: ServerPool;
  private simulationRunning: boolean = false;
  private scalingCooldown: number = 300000; // 5분 쿨다운
  
  // 스케일링 정책
  private scalingPolicy = {
    targetCpuThreshold: 70,
    targetMemoryThreshold: 75,
    scaleOutThreshold: 85,
    scaleInThreshold: 30,
    minServers: 8,
    maxServers: 30,
    stepSize: 2
  };

  constructor() {
    this.serverPool = this.initializeServerPool();
    console.log('🚀 스케일링 시뮬레이션 엔진 초기화 완료');
  }

  static getInstance(): ScalingSimulationEngine {
    if (!this.instance) {
      this.instance = new ScalingSimulationEngine();
    }
    return this.instance;
  }

  /**
   * 🏭 서버 풀 초기화
   */
  private initializeServerPool(): ServerPool {
    // AI 분석 대상 서버 고정 정의 (8개 핵심 서버)
    const analysisTargets = this.createFixedAnalysisTargets();
    
    // 초기 운영 서버 생성 (8-16개)
    const operational = this.createInitialOperationalServers();
    
    return {
      operational,
      analysisTargets,
      scalingEvents: [],
      metadata: {
        currentScale: operational.length,
        targetScale: operational.length,
        minServers: this.scalingPolicy.minServers,
        maxServers: this.scalingPolicy.maxServers,
        lastScalingAction: 0
      }
    };
  }

  /**
   * 🎯 AI 분석 대상 서버 고정 생성
   */
  private createFixedAnalysisTargets(): AIAnalysisTarget[] {
    const targets: AIAnalysisTarget[] = [];
    
    // 핵심 서버 타입별 분석 대상 (AI가 항상 모니터링)
    const coreTargets = [
      { role: 'database', count: 2, priority: 'primary' },
      { role: 'api', count: 2, priority: 'primary' },
      { role: 'web', count: 2, priority: 'secondary' },
      { role: 'cache', count: 1, priority: 'secondary' },
      { role: 'load-balancer', count: 1, priority: 'monitoring' }
    ] as const;

    let serverId = 1;
    coreTargets.forEach(({ role, count, priority }) => {
      for (let i = 0; i < count; i++) {
        const server = this.createAnalysisTargetServer(
          `ai-target-${role}-${i + 1}`,
          role,
          priority as any
        );
        targets.push(server);
        serverId++;
      }
    });

    console.log(`🎯 AI 분석 대상 서버 ${targets.length}개 생성 (고정)`);
    return targets;
  }

  /**
   * 🏗️ AI 분석 대상 서버 생성
   */
  private createAnalysisTargetServer(
    id: string, 
    role: ServerRole, 
    priority: 'primary' | 'secondary' | 'monitoring'
  ): AIAnalysisTarget {
    const typeDef = SERVER_TYPE_DEFINITIONS[role];
    const baseServer = this.generateBaseServer(id, role);
    
    return {
      ...baseServer,
      isAnalysisTarget: true,
      analysisRole: priority,
      lastAnalyzed: Date.now()
    };
  }

  /**
   * 🏭 초기 운영 서버 생성
   */
  private createInitialOperationalServers(): EnhancedServerMetrics[] {
    const servers: EnhancedServerMetrics[] = [];
    const serverCount = Math.floor(Math.random() * 9) + 8; // 8-16개
    
    for (let i = 1; i <= serverCount; i++) {
      const roles: ServerRole[] = ['web', 'api', 'database', 'cache', 'k8s-worker'];
      const randomRole = roles[Math.floor(Math.random() * roles.length)];
      
      const server = this.generateBaseServer(`ops-server-${i}`, randomRole);
      servers.push(server);
    }
    
    console.log(`🏗️ 초기 운영 서버 ${servers.length}개 생성`);
    return servers;
  }

  /**
   * ⚙️ 기본 서버 생성
   */
  private generateBaseServer(id: string, role: ServerRole): EnhancedServerMetrics {
    const typeDef = SERVER_TYPE_DEFINITIONS[role];
    const environments: ServerEnvironment[] = ['aws', 'kubernetes', 'on-premise'];
    const statuses: ServerStatus[] = ['healthy', 'warning', 'critical'];
    
    // 서버 상태 분포 (70% 정상, 20% 경고, 10% 심각)
    const statusDistribution = Math.random();
    let status: ServerStatus;
    if (statusDistribution < 0.7) status = 'healthy';
    else if (statusDistribution < 0.9) status = 'warning';
    else status = 'critical';
    
    const statusMultiplier = status === 'critical' ? 1.5 : status === 'warning' ? 1.2 : 1.0;
    
    return {
      id,
      hostname: `${id}.openmanager.local`,
      environment: environments[Math.floor(Math.random() * environments.length)],
      role,
      status,
      cpu_usage: Math.round((20 + Math.random() * 40) * statusMultiplier * typeDef.characteristics.cpuWeight),
      memory_usage: Math.round((30 + Math.random() * 40) * statusMultiplier * typeDef.characteristics.memoryWeight),
      disk_usage: Math.round((25 + Math.random() * 35) * statusMultiplier * typeDef.characteristics.diskWeight),
      network_in: Math.round((50 + Math.random() * 100) * typeDef.characteristics.networkWeight),
      network_out: Math.round((40 + Math.random() * 80) * typeDef.characteristics.networkWeight),
      response_time: Math.round(typeDef.characteristics.responseTimeBase + (Math.random() * 100)),
      uptime: Math.floor(Math.random() * 8760), // 0-8760 시간
      last_updated: new Date().toISOString(),
      alerts: this.generateServerAlerts(id, status)
    };
  }

  /**
   * 🚨 서버 알림 생성
   */
  private generateServerAlerts(serverId: string, status: ServerStatus): ServerAlert[] {
    const alerts: ServerAlert[] = [];
    
    if (status === 'critical') {
      alerts.push({
        id: `alert-${serverId}-1`,
        server_id: serverId,
        type: 'cpu',
        message: 'CPU 사용률 90% 초과',
        severity: 'critical',
        timestamp: new Date().toISOString(),
        resolved: false
      });
    } else if (status === 'warning') {
      alerts.push({
        id: `alert-${serverId}-1`,
        server_id: serverId,
        type: 'memory',
        message: '메모리 사용률 80% 초과',
        severity: 'warning',
        timestamp: new Date().toISOString(),
        resolved: false
      });
    }
    
    return alerts;
  }

  /**
   * 🔄 스케일링 시뮬레이션 실행
   */
  async simulateScaling(): Promise<ScalingEvent | null> {
    if (!this.canPerformScaling()) {
      return null;
    }

    const metrics = this.calculatePoolMetrics();
    const decision = this.makeScalingDecision(metrics);
    
    if (decision.action === 'maintain') {
      return null;
    }

    // 스케일링 이벤트 실행
    const event = await this.executeScalingAction(decision);
    this.serverPool.scalingEvents.push(event);
    
    // 메타데이터 업데이트
    this.serverPool.metadata.lastScalingAction = Date.now();
    this.serverPool.metadata.currentScale = this.serverPool.operational.length;
    
    console.log(`🔄 스케일링 실행: ${event.type} (${event.serverCount.before} → ${event.serverCount.after})`);
    return event;
  }

  /**
   * 📊 풀 메트릭 계산
   */
  private calculatePoolMetrics() {
    const operational = this.serverPool.operational;
    
    return {
      avgCpu: operational.reduce((sum, s) => sum + s.cpu_usage, 0) / operational.length,
      avgMemory: operational.reduce((sum, s) => sum + s.memory_usage, 0) / operational.length,
      maxCpu: Math.max(...operational.map(s => s.cpu_usage)),
      maxMemory: Math.max(...operational.map(s => s.memory_usage)),
      criticalServers: operational.filter(s => s.status === 'critical').length,
      warningServers: operational.filter(s => s.status === 'warning').length,
      totalServers: operational.length
    };
  }

  /**
   * 🤖 스케일링 의사결정
   */
  private makeScalingDecision(metrics: any) {
    const { avgCpu, avgMemory, criticalServers, totalServers } = metrics;
    
    // Scale Out 조건
    if ((avgCpu > this.scalingPolicy.scaleOutThreshold || 
         avgMemory > this.scalingPolicy.scaleOutThreshold ||
         criticalServers > totalServers * 0.2) &&
        totalServers < this.scalingPolicy.maxServers) {
      
      return {
        action: 'scale_out',
        targetCount: Math.min(
          totalServers + this.scalingPolicy.stepSize,
          this.scalingPolicy.maxServers
        ),
        reason: `고부하 감지 (CPU: ${avgCpu.toFixed(1)}%, Memory: ${avgMemory.toFixed(1)}%, Critical: ${criticalServers})`
      };
    }
    
    // Scale In 조건
    if (avgCpu < this.scalingPolicy.scaleInThreshold && 
        avgMemory < this.scalingPolicy.scaleInThreshold &&
        criticalServers === 0 &&
        totalServers > this.scalingPolicy.minServers) {
      
      return {
        action: 'scale_in',
        targetCount: Math.max(
          totalServers - 1,
          this.scalingPolicy.minServers
        ),
        reason: `저부하 감지 (CPU: ${avgCpu.toFixed(1)}%, Memory: ${avgMemory.toFixed(1)}%)`
      };
    }
    
    return {
      action: 'maintain',
      targetCount: totalServers,
      reason: '현재 규모 유지'
    };
  }

  /**
   * ⚡ 스케일링 액션 실행
   */
  private async executeScalingAction(decision: any): Promise<ScalingEvent> {
    const beforeCount = this.serverPool.operational.length;
    const targetCount = decision.targetCount;
    
    if (decision.action === 'scale_out') {
      // 새 서버 추가
      const serversToAdd = targetCount - beforeCount;
      for (let i = 0; i < serversToAdd; i++) {
        const newServer = this.generateBaseServer(
          `auto-${Date.now()}-${i}`,
          this.selectOptimalServerRole()
        );
        this.serverPool.operational.push(newServer);
      }
    } else if (decision.action === 'scale_in') {
      // 서버 제거 (건강한 서버 우선 제거)
      const serversToRemove = beforeCount - targetCount;
      const healthyServers = this.serverPool.operational
        .filter(s => s.status === 'healthy')
        .sort((a, b) => a.cpu_usage - b.cpu_usage); // CPU 사용률 낮은 순
      
      for (let i = 0; i < serversToRemove && healthyServers.length > 0; i++) {
        const serverToRemove = healthyServers.shift()!;
        this.serverPool.operational = this.serverPool.operational
          .filter(s => s.id !== serverToRemove.id);
      }
    }
    
    const metrics = this.calculatePoolMetrics();
    
    return {
      id: `scale-${Date.now()}`,
      type: decision.action === 'scale_out' ? 'scale_out' : 'scale_in',
      timestamp: Date.now(),
      triggeredBy: 'auto',
      serverCount: { before: beforeCount, after: this.serverPool.operational.length },
      affectedServers: [], // 구현 간소화
      reason: decision.reason,
      metadata: {
        avgCpu: metrics.avgCpu,
        avgMemory: metrics.avgMemory,
        criticalServers: metrics.criticalServers
      }
    };
  }

  /**
   * 🎯 최적 서버 역할 선택
   */
  private selectOptimalServerRole(): ServerRole {
    const roles: ServerRole[] = ['web', 'api', 'k8s-worker'];
    return roles[Math.floor(Math.random() * roles.length)];
  }

  /**
   * ⏰ 스케일링 가능 여부 체크
   */
  private canPerformScaling(): boolean {
    const now = Date.now();
    const lastAction = this.serverPool.metadata.lastScalingAction;
    return (now - lastAction) > this.scalingCooldown;
  }

  /**
   * 📊 공개 메서드들
   */

  // AI 분석용 고정 서버 목록 (변경 없음)
  getAnalysisTargets(): AIAnalysisTarget[] {
    return [...this.serverPool.analysisTargets];
  }

  // 시뮬레이션용 운영 서버 목록 (동적 변경)
  getOperationalServers(): EnhancedServerMetrics[] {
    return [...this.serverPool.operational];
  }

  // 전체 서버 풀 (시각화용)
  getServerPool(): ServerPool {
    return { ...this.serverPool };
  }

  // 스케일링 이벤트 기록
  getScalingHistory(limit: number = 50): ScalingEvent[] {
    return this.serverPool.scalingEvents
      .slice(-limit)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  // AI가 사용할 메트릭 (분석 대상 서버 + 집계된 운영 서버 상태)
  getAIMetrics() {
    const analysisTargets = this.getAnalysisTargets();
    const operationalMetrics = this.calculatePoolMetrics();
    
    return {
      // AI 분석 대상 서버 (고정)
      targetServers: analysisTargets,
      
      // 운영 서버 집계 정보 (참고용)
      operationalSummary: {
        totalServers: operationalMetrics.totalServers,
        avgCpu: operationalMetrics.avgCpu,
        avgMemory: operationalMetrics.avgMemory,
        criticalCount: operationalMetrics.criticalServers,
        warningCount: operationalMetrics.warningServers,
        healthyCount: operationalMetrics.totalServers - operationalMetrics.criticalServers - operationalMetrics.warningServers
      },
      
      // 메타 이벤트 (참조용)
      recentScalingEvents: this.getScalingHistory(5),
      
      // 분석 타임스탬프
      analyzedAt: Date.now()
    };
  }

  // 스케일링 정책 업데이트
  updateScalingPolicy(policy: Partial<typeof this.scalingPolicy>): void {
    this.scalingPolicy = { ...this.scalingPolicy, ...policy };
    console.log('🔧 스케일링 정책 업데이트:', this.scalingPolicy);
  }
}

// 싱글톤 인스턴스
export const scalingSimulationEngine = ScalingSimulationEngine.getInstance(); 