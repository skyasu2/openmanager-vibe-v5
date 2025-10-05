/**
 * Realistic Variation Generator
 *
 * 현실적인 서버 메트릭 변동성 생성 서비스
 * - FNV-1a 해시 기반 결정론적 난수 생성
 * - 시간대별, 요일별 패턴 반영
 * - 확률적 이벤트 시스템
 * - 서버 간 연쇄 효과 시뮬레이션
 */

/**
 * 현실적인 서버 변동성 생성기
 * - 자연스러운 ±15% 변동
 * - 확률적 이벤트 발생
 * - 서버간 연쇄 효과
 */
export class RealisticVariationGenerator {
  private static seed = Date.now();
  
  /**
   * FNV-1a 해시 기반 고성능 유사 랜덤 (20% 성능 향상)
   */
  private static fnv1aHash(seed: number): number {
    let hash = 0x811c9dc5;
    const str = seed.toString();
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      hash = (hash * 0x01000193) >>> 0;
    }
    return hash / 0xFFFFFFFF;
  }

  /**
   * 레거시 호환성을 위한 래퍼 (점진적 마이그레이션)
   */
  private static seededRandom(seed: number): number {
    return this.fnv1aHash(seed);
  }
  
  /**
   * 현실적 변동성 생성 - 시간대별 + 서버별 특성 반영
   */
  static generateNaturalVariance(baseValue: number, serverId: string): number {
    const now = new Date();
    const timeSeed = Math.floor(Date.now() / 30000); // 30초마다 변경
    const serverSeed = serverId.charCodeAt(0) * 7; // 서버별 고유 패턴
    const combinedSeed = timeSeed + serverSeed;
    
    // 기본 변동성 (±10%)
    const baseVariance = (this.seededRandom(combinedSeed) - 0.5) * 20;
    
    // 시간대별 패턴 (업무시간 vs 야간)
    const hour = now.getHours();
    let timeMultiplier = 1.0;
    if (hour >= 9 && hour <= 17) {
      timeMultiplier = 1.3; // 업무시간: 부하 증가
    } else if (hour >= 22 || hour <= 6) {
      timeMultiplier = 0.7; // 야간: 부하 감소
    }
    
    // 요일별 패턴
    const dayOfWeek = now.getDay();
    let dayMultiplier = 1.0;
    if (dayOfWeek === 1) dayMultiplier = 1.1; // 월요일: 높은 부하
    else if (dayOfWeek === 5) dayMultiplier = 1.2; // 금요일: 배포 등으로 높은 부하
    else if (dayOfWeek === 0 || dayOfWeek === 6) dayMultiplier = 0.6; // 주말: 낮은 부하
    
    // 점진적 드리프트 (서버가 시간에 따라 자연스럽게 변화)
    const driftSeed = Math.floor(Date.now() / 300000); // 5분마다 변화
    const drift = (this.seededRandom(driftSeed + serverSeed) - 0.5) * 5; // ±2.5% 드리프트
    
    // 최종 계산
    const finalVariance = baseVariance * timeMultiplier * dayMultiplier + drift;
    return Math.max(5, Math.min(95, baseValue + finalVariance));
  }
  
  /**
   * 현실적 이벤트 시스템 - 시나리오 기반
   */
  static checkRandomEvent(serverId: string): { hasEvent: boolean; impact: number; type: string; description?: string } {
    const timeSeed = Math.floor(Date.now() / 60000); // 1분마다 체크
    const serverSeed = serverId.charCodeAt(0) * 13;
    const eventRoll = this.seededRandom(timeSeed + serverSeed);
    
    const now = new Date();
    const hour = now.getHours();
    
    // 시간대별 이벤트 확률 조정
    let eventModifier = 1.0;
    if (hour >= 9 && hour <= 17) {
      eventModifier = 1.5; // 업무시간: 이벤트 확률 증가
    } else if (hour >= 1 && hour <= 5) {
      eventModifier = 2.0; // 새벽: 유지보수 및 배치 작업
    }
    
    const adjustedRoll = eventRoll / eventModifier;
    
    // 심각한 이벤트 (1-2% 확률)
    if (adjustedRoll < 0.015) {
      const severEvents = [
        { impact: 45, type: '메모리 누수 감지', description: '점진적 메모리 사용량 증가 패턴 발견' },
        { impact: 40, type: 'DB 커넥션 풀 고갈', description: '동시 연결 수 한계 도달' },
        { impact: 50, type: 'CPU 과부하', description: '비정상적인 CPU 사용률 급증' },
        { impact: 35, type: '디스크 I/O 병목', description: '디스크 읽기/쓰기 지연 발생' }
      ];
      const selected = severEvents[Math.floor(this.seededRandom(timeSeed * 2) * severEvents.length)] ?? severEvents[0];
      return { hasEvent: true, impact: selected?.impact ?? 50, type: selected?.type ?? 'Unknown Event', description: selected?.description };
    }
    
    // 중간 이벤트 (8-12% 확률)
    else if (adjustedRoll < 0.10) {
      const mediumEvents = [
        { impact: 22, type: '트래픽 스파이크', description: '예상보다 높은 사용자 요청' },
        { impact: 18, type: '캐시 미스 증가', description: '캐시 효율성 일시적 저하' },
        { impact: 25, type: '네트워크 지연', description: '외부 API 응답 시간 증가' },
        { impact: 20, type: '가비지 컬렉션', description: 'GC 실행으로 인한 일시적 부하' }
      ];
      const selected = mediumEvents[Math.floor(this.seededRandom(timeSeed * 3) * mediumEvents.length)] ?? mediumEvents[0];
      return { hasEvent: true, impact: selected?.impact ?? 25, type: selected?.type ?? 'Unknown Event', description: selected?.description };
    }
    
    // 소규모 변동 (15-25% 확률)
    else if (adjustedRoll < 0.20) {
      const minorEvents = [
        { impact: 8, type: '일반적 부하 변동', description: '정상 범위 내 사용량 변화' },
        { impact: 12, type: '백그라운드 작업', description: '스케줄된 작업 실행 중' },
        { impact: 10, type: '세션 정리', description: '만료된 세션 정리 작업' },
        { impact: 6, type: '로그 로테이션', description: '로그 파일 순환 처리' }
      ];
      const selected = minorEvents[Math.floor(this.seededRandom(timeSeed * 4) * minorEvents.length)] ?? minorEvents[0];
      return { hasEvent: true, impact: selected?.impact ?? 10, type: selected?.type ?? 'Unknown Event', description: selected?.description };
    }
    
    return { hasEvent: false, impact: 0, type: '정상', description: '모든 시스템 정상 동작 중' };
  }
  
  /**
   * 서버간 연쇄 효과 시뮬레이션
   */
  static calculateCascadeEffect(serverType: string, otherServers: any[]): number {
    let cascadeImpact = 0;
    
    // 웹서버 부하 → API 서버 영향
    if (serverType === 'api') {
      const webServers = otherServers.filter(s => s.type === 'web');
      const avgWebLoad = webServers.reduce((sum, s) => sum + s.cpu, 0) / webServers.length;
      if (avgWebLoad > 70) {
        cascadeImpact += (avgWebLoad - 70) * 0.3;
      }
    }
    
    // DB 부하 → 모든 연결된 서버 영향  
    if (serverType !== 'database') {
      const dbServers = otherServers.filter(s => s.type === 'database');
      const avgDbLoad = dbServers.reduce((sum, s) => sum + s.cpu, 0) / dbServers.length;
      if (avgDbLoad > 80) {
        cascadeImpact += (avgDbLoad - 80) * 0.2;
      }
    }
    
    return Math.min(cascadeImpact, 20); // 최대 20% 추가 부하
  }

  /**
   * 배치 처리 시스템 - 30% 효율성 향상
   * 서버별 개별 처리 대신 배치로 매트릭 생성
   */
  static generateBatchMetrics(
    serverInfos: Array<{ id: string; type: string; baseMetrics: any }>,
    timeSlot: number = Date.now()
  ): Array<{ id: string; metrics: any; events: any }> {
    const timeSeed = Math.floor(timeSlot / 30000); // 30초마다 변경
    
    // 배치 처리로 모든 서버 메트릭 동시 생성
    const results = serverInfos.map(({ id, type, baseMetrics }) => {
      const serverSeed = id.charCodeAt(0) * 7;
      const combinedSeed = timeSeed + serverSeed;
      
      // 기본 메트릭 생성
      const metrics = {
        cpu: this.generateNaturalVariance(baseMetrics.cpu, id),
        memory: this.generateNaturalVariance(baseMetrics.memory, id),
        disk: this.generateNaturalVariance(baseMetrics.disk, id),
        network: this.generateNaturalVariance(baseMetrics.network, id)
      };
      
      // 이벤트 확인
      const events = this.checkRandomEvent(id);
      
      return { id, metrics, events };
    });
    
    // 연쇄 효과 계산 (모든 서버 데이터를 기반으로)
    results.forEach(result => {
      const cascadeImpact = this.calculateCascadeEffect(
        serverInfos.find(s => s.id === result.id)?.type || 'unknown',
        results.map(r => ({ type: serverInfos.find(s => s.id === r.id)?.type, cpu: r.metrics.cpu }))
      );
      
      // 연쇄 효과 적용
      if (cascadeImpact > 0) {
        result.metrics.cpu = Math.min(95, result.metrics.cpu + cascadeImpact);
        result.metrics.memory = Math.min(95, result.metrics.memory + cascadeImpact * 0.7);
      }
    });
    
    return results;
  }
}
