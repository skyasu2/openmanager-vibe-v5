/**
 * 🔥 Failure Pattern Engine
 * 
 * 현실적인 서버 장애 패턴을 생성하는 엔진
 * - 점진적 성능 저하
 * - 연쇄 장애
 * - 메모리 누수
 * - 디스크 포화
 * - 네트워크 지연
 */

import { DailyMetric, ServerConfig, ServerType } from './supabase-metrics';

// 장애 패턴 타입
export type FailurePattern = 
  | 'memory_leak'      // 메모리 누수
  | 'cpu_spike'        // CPU 스파이크
  | 'disk_full'        // 디스크 포화
  | 'cascade_failure'  // 연쇄 장애
  | 'network_latency'  // 네트워크 지연
  | 'database_lock'    // 데이터베이스 락
  | 'gradual_degradation'; // 점진적 성능 저하

export interface FailureEvent {
  pattern: FailurePattern;
  serverId: string;
  startTime: number; // timestamp index (0-143)
  duration: number;  // duration in 10-minute intervals
  severity: number;  // 0.1-1.0
  affectedServers?: string[]; // for cascade failures
}

export class FailurePatternEngine {
  private servers: ServerConfig[];
  private failureEvents: FailureEvent[] = [];
  private timePoints: number = 144; // 24시간 * 6 (10분 간격)

  constructor(servers: ServerConfig[]) {
    this.servers = servers;
    this.generateFailureEvents();
  }

  /**
   * 장애 이벤트 생성
   */
  private generateFailureEvents(): void {
    const numFailures = Math.floor(Math.random() * 8) + 2; // 2-10개 장애

    for (let i = 0; i < numFailures; i++) {
      const pattern = this.selectRandomPattern();
      const serverId = this.selectRandomServer(pattern);
      const startTime = Math.floor(Math.random() * (this.timePoints - 20)); // 마지막 3시간 전까지
      const duration = this.calculateDuration(pattern);
      const severity = this.calculateSeverity(pattern);

      const event: FailureEvent = {
        pattern,
        serverId,
        startTime,
        duration,
        severity
      };

      // 연쇄 장애의 경우 영향받는 서버 설정
      if (pattern === 'cascade_failure') {
        event.affectedServers = this.selectCascadeServers(serverId);
      }

      this.failureEvents.push(event);
    }

    // 시간순 정렬
    this.failureEvents.sort((a, b) => a.startTime - b.startTime);
  }

  /**
   * 랜덤 장애 패턴 선택
   */
  private selectRandomPattern(): FailurePattern {
    const patterns: FailurePattern[] = [
      'memory_leak',
      'cpu_spike', 
      'disk_full',
      'cascade_failure',
      'network_latency',
      'database_lock',
      'gradual_degradation'
    ];

    return patterns[Math.floor(Math.random() * patterns.length)];
  }

  /**
   * 패턴에 적합한 서버 선택
   */
  private selectRandomServer(pattern: FailurePattern): string {
    let candidateServers = this.servers;

    // 패턴에 따라 특정 타입 서버 선호
    switch (pattern) {
      case 'database_lock':
        candidateServers = this.servers.filter(s => s.type === 'db');
        break;
      case 'memory_leak':
        candidateServers = this.servers.filter(s => ['web', 'api', 'worker'].includes(s.type));
        break;
      case 'disk_full':
        candidateServers = this.servers.filter(s => ['db', 'cache'].includes(s.type));
        break;
    }

    if (candidateServers.length === 0) {
      candidateServers = this.servers;
    }

    return candidateServers[Math.floor(Math.random() * candidateServers.length)].id;
  }

  /**
   * 장애 지속 시간 계산
   */
  private calculateDuration(pattern: FailurePattern): number {
    switch (pattern) {
      case 'cpu_spike':
        return Math.floor(Math.random() * 6) + 1; // 10분-1시간
      case 'memory_leak':
        return Math.floor(Math.random() * 24) + 12; // 2-6시간
      case 'disk_full':
        return Math.floor(Math.random() * 36) + 6; // 1-7시간
      case 'cascade_failure':
        return Math.floor(Math.random() * 18) + 6; // 1-4시간
      case 'network_latency':
        return Math.floor(Math.random() * 12) + 3; // 30분-2시간30분
      case 'database_lock':
        return Math.floor(Math.random() * 8) + 2; // 20분-1시간40분
      case 'gradual_degradation':
        return Math.floor(Math.random() * 48) + 24; // 4-12시간
      default:
        return Math.floor(Math.random() * 12) + 6;
    }
  }

  /**
   * 장애 심각도 계산
   */
  private calculateSeverity(pattern: FailurePattern): number {
    switch (pattern) {
      case 'cpu_spike':
        return 0.7 + Math.random() * 0.3; // 0.7-1.0
      case 'memory_leak':
        return 0.5 + Math.random() * 0.4; // 0.5-0.9
      case 'disk_full':
        return 0.8 + Math.random() * 0.2; // 0.8-1.0
      case 'cascade_failure':
        return 0.6 + Math.random() * 0.4; // 0.6-1.0
      case 'network_latency':
        return 0.3 + Math.random() * 0.5; // 0.3-0.8
      case 'database_lock':
        return 0.7 + Math.random() * 0.3; // 0.7-1.0
      case 'gradual_degradation':
        return 0.2 + Math.random() * 0.6; // 0.2-0.8
      default:
        return 0.4 + Math.random() * 0.4;
    }
  }

  /**
   * 연쇄 장애 영향 서버 선택
   */
  private selectCascadeServers(originServerId: string): string[] {
    const originServer = this.servers.find(s => s.id === originServerId);
    if (!originServer) return [];

    const affected: string[] = [];
    const candidates = this.servers.filter(s => s.id !== originServerId);

    // 같은 타입 서버들이 영향받을 확률이 높음
    const sameTypeServers = candidates.filter(s => s.type === originServer.type);
    sameTypeServers.forEach(server => {
      if (Math.random() < 0.6) { // 60% 확률
        affected.push(server.id);
      }
    });

    // 의존 관계가 있는 서버들
    if (originServer.type === 'db') {
      candidates.filter(s => ['web', 'api'].includes(s.type)).forEach(server => {
        if (Math.random() < 0.8) { // 80% 확률
          affected.push(server.id);
        }
      });
    }

    return affected;
  }

  /**
   * 특정 시점과 서버에 대한 장애 영향 계산
   */
  public getFailureImpact(serverId: string, timeIndex: number): {
    cpuImpact: number;
    memoryImpact: number;
    diskImpact: number;
    responseTimeMultiplier: number;
  } {
    let cpuImpact = 0;
    let memoryImpact = 0;
    let diskImpact = 0;
    let responseTimeMultiplier = 1;

    // 모든 장애 이벤트를 확인
    this.failureEvents.forEach(event => {
      const isDirectlyAffected = event.serverId === serverId;
      const isCascadeAffected = event.affectedServers?.includes(serverId) || false;
      
      if (!isDirectlyAffected && !isCascadeAffected) return;

      const isInTimeRange = timeIndex >= event.startTime && timeIndex < (event.startTime + event.duration);
      if (!isInTimeRange) return;

      // 장애 진행률 (0-1)
      const progress = (timeIndex - event.startTime) / event.duration;
      const severity = isCascadeAffected ? event.severity * 0.6 : event.severity;

      // 패턴별 영향 계산
      switch (event.pattern) {
        case 'memory_leak':
          memoryImpact += severity * progress * 60; // 최대 60% 증가
          cpuImpact += severity * progress * 20; // CPU도 같이 증가
          responseTimeMultiplier *= (1 + severity * progress * 2);
          break;

        case 'cpu_spike':
          cpuImpact += severity * 70 * Math.sin(progress * Math.PI); // 종 모양 곡선
          responseTimeMultiplier *= (1 + severity * 3);
          break;

        case 'disk_full':
          diskImpact += severity * progress * 50; // 점진적 디스크 증가
          if (progress > 0.7) {
            cpuImpact += severity * 30; // 디스크 포화 시 CPU 스파이크
            responseTimeMultiplier *= (1 + severity * 4);
          }
          break;

        case 'cascade_failure':
          cpuImpact += severity * 40 * (1 - Math.exp(-progress * 3));
          memoryImpact += severity * 30 * progress;
          responseTimeMultiplier *= (1 + severity * progress * 5);
          break;

        case 'network_latency':
          responseTimeMultiplier *= (1 + severity * (2 + Math.sin(progress * Math.PI * 4)));
          break;

        case 'database_lock':
          if (this.servers.find(s => s.id === serverId)?.type === 'db') {
            cpuImpact += severity * 80; // DB 서버 CPU 급증
            responseTimeMultiplier *= (1 + severity * 10);
          } else {
            responseTimeMultiplier *= (1 + severity * 3); // 다른 서버들은 대기시간 증가
          }
          break;

        case 'gradual_degradation':
          const degradationFactor = severity * progress * 0.5;
          cpuImpact += degradationFactor * 40;
          memoryImpact += degradationFactor * 30;
          diskImpact += degradationFactor * 20;
          responseTimeMultiplier *= (1 + degradationFactor * 2);
          break;
      }
    });

    return {
      cpuImpact: Math.min(cpuImpact, 80), // 최대 80% 추가 부하
      memoryImpact: Math.min(memoryImpact, 70), // 최대 70% 추가 부하
      diskImpact: Math.min(diskImpact, 60), // 최대 60% 추가 부하
      responseTimeMultiplier: Math.min(responseTimeMultiplier, 20) // 최대 20배 증가
    };
  }

  /**
   * 생성된 장애 이벤트 반환
   */
  public getFailureEvents(): FailureEvent[] {
    return this.failureEvents;
  }
} 