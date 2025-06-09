/**
 * 🏗️ Baseline Manager v1.0
 *
 * 서버 베이스라인 데이터 생성 및 관리 전담 모듈
 * - 24시간 베이스라인 프로필 생성
 * - 서버 타입별 메트릭 패턴 정의
 * - 시간대별 부하 패턴 계산
 */

import { getVercelOptimizedConfig } from '@/config/environment';

export interface BaselineProfile {
  serverId: string;
  type: string;
  architecture: string;
  location: string;
  baseline: {
    cpu: any[];
    memory: any[];
    network: any[];
    disk: any[];
  };
  createdAt: string;
}

export class BaselineManager {
  private config = getVercelOptimizedConfig();
  private serverBaselines = new Map<string, BaselineProfile>();

  /**
   * 🔄 베이스라인 초기화 (메모리 효율성)
   */
  public initializeBaselines(): void {
    const serverCount = this.config.IS_VERCEL ? 6 : 9; // Vercel에서 서버 수 제한

    for (let i = 1; i <= serverCount; i++) {
      const serverId = `server-${i.toString().padStart(2, '0')}`;

      // 24시간 베이스라인 생성 (경량화)
      this.serverBaselines.set(
        serverId,
        this.generateBaselineProfile(serverId)
      );
    }

    console.log(`✅ ${serverCount}개 서버 베이스라인 초기화 완료`);
  }

  /**
   * 📊 베이스라인 프로필 생성 (Vercel 최적화)
   */
  private generateBaselineProfile(serverId: string): BaselineProfile {
    const serverTypes = ['web', 'api', 'database', 'cache', 'queue', 'storage'];
    const architectures = ['x86_64', 'arm64', 'hybrid', 'kubernetes'];

    const type = serverTypes[Math.floor(Math.random() * serverTypes.length)];
    const arch =
      architectures[Math.floor(Math.random() * architectures.length)];

    return {
      serverId,
      type,
      architecture: arch,
      location: this.getServerLocation(),
      baseline: this.generate24HourBaseline(type),
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * 🌍 서버 위치 선택 (Vercel 글로벌 최적화)
   */
  private getServerLocation(): string {
    const locations = [
      'us-east-1',
      'us-west-2',
      'eu-west-1',
      'ap-northeast-1',
      'ap-southeast-1',
    ];
    return locations[Math.floor(Math.random() * locations.length)];
  }

  /**
   * 📈 24시간 베이스라인 생성 (경량화)
   */
  private generate24HourBaseline(serverType: string): any {
    return {
      cpu: this.generateCPUBaseline(serverType),
      memory: this.generateMemoryBaseline(serverType),
      network: this.generateNetworkBaseline(serverType),
      disk: this.generateDiskBaseline(serverType),
    };
  }

  /**
   * 🖥️ CPU 베이스라인 생성 (서버 타입별)
   */
  private generateCPUBaseline(serverType: string): any[] {
    const baselineProfiles = {
      web: { base: 30, peak: 80, variance: 15 },
      api: { base: 40, peak: 85, variance: 20 },
      database: { base: 50, peak: 75, variance: 10 },
      cache: { base: 15, peak: 40, variance: 8 },
      queue: { base: 25, peak: 60, variance: 12 },
      cdn: { base: 10, peak: 35, variance: 5 },
      gpu: { base: 60, peak: 95, variance: 25 },
      storage: { base: 20, peak: 45, variance: 7 },
    };

    const profile =
      baselineProfiles[serverType as keyof typeof baselineProfiles] ||
      baselineProfiles.web;
    const hourlyData = [];

    for (let hour = 0; hour < 24; hour++) {
      // 시간대별 부하 패턴 (오전 9시-오후 6시가 피크)
      const timeMultiplier = this.getTimeMultiplier(hour);
      const cpuValue =
        profile.base + (profile.peak - profile.base) * timeMultiplier;
      const variance = (Math.random() - 0.5) * profile.variance;

      hourlyData.push({
        hour,
        cpu: Math.max(5, Math.min(100, cpuValue + variance)),
        timestamp: Date.now() + hour * 3600000,
      });
    }

    return hourlyData;
  }

  /**
   * 💾 메모리 베이스라인 생성 (서버 타입별)
   */
  private generateMemoryBaseline(serverType: string): any[] {
    const baselineProfiles = {
      web: { base: 40, peak: 70, variance: 10 },
      api: { base: 50, peak: 80, variance: 15 },
      database: { base: 70, peak: 90, variance: 8 },
      cache: { base: 80, peak: 95, variance: 5 },
      queue: { base: 35, peak: 65, variance: 12 },
      cdn: { base: 25, peak: 50, variance: 8 },
      gpu: { base: 60, peak: 85, variance: 15 },
      storage: { base: 30, peak: 55, variance: 10 },
    };

    const profile =
      baselineProfiles[serverType as keyof typeof baselineProfiles] ||
      baselineProfiles.web;
    const hourlyData = [];

    for (let hour = 0; hour < 24; hour++) {
      const timeMultiplier = this.getTimeMultiplier(hour);
      const memoryValue =
        profile.base + (profile.peak - profile.base) * timeMultiplier;
      const variance = (Math.random() - 0.5) * profile.variance;

      hourlyData.push({
        hour,
        memory: Math.max(10, Math.min(100, memoryValue + variance)),
        timestamp: Date.now() + hour * 3600000,
      });
    }

    return hourlyData;
  }

  /**
   * 🌐 네트워크 베이스라인 생성 (서버 타입별)
   */
  private generateNetworkBaseline(serverType: string): any[] {
    const baselineProfiles = {
      web: { inBase: 100, inPeak: 500, outBase: 200, outPeak: 800 },
      api: { inBase: 150, inPeak: 600, outBase: 100, outPeak: 400 },
      database: { inBase: 50, inPeak: 200, outBase: 80, outPeak: 300 },
      cache: { inBase: 300, inPeak: 800, outBase: 250, outPeak: 700 },
      queue: { inBase: 80, inPeak: 300, outBase: 60, outPeak: 250 },
      cdn: { inBase: 50, inPeak: 150, outBase: 1000, outPeak: 3000 },
      gpu: { inBase: 200, inPeak: 1000, outBase: 150, outPeak: 800 },
      storage: { inBase: 300, inPeak: 1500, outBase: 400, outPeak: 2000 },
    };

    const profile =
      baselineProfiles[serverType as keyof typeof baselineProfiles] ||
      baselineProfiles.web;
    const hourlyData = [];

    for (let hour = 0; hour < 24; hour++) {
      const timeMultiplier = this.getTimeMultiplier(hour);
      const networkInValue =
        profile.inBase + (profile.inPeak - profile.inBase) * timeMultiplier;
      const networkOutValue =
        profile.outBase + (profile.outPeak - profile.outBase) * timeMultiplier;

      hourlyData.push({
        hour,
        networkIn: Math.max(0, networkInValue + (Math.random() - 0.5) * 50),
        networkOut: Math.max(0, networkOutValue + (Math.random() - 0.5) * 80),
        timestamp: Date.now() + hour * 3600000,
      });
    }

    return hourlyData;
  }

  /**
   * 💿 디스크 베이스라인 생성 (서버 타입별)
   */
  private generateDiskBaseline(serverType: string): any[] {
    const baselineProfiles = {
      web: { base: 30, peak: 60, variance: 8 },
      api: { base: 25, peak: 55, variance: 10 },
      database: { base: 60, peak: 85, variance: 12 },
      cache: { base: 15, peak: 35, variance: 5 },
      queue: { base: 40, peak: 70, variance: 15 },
      cdn: { base: 20, peak: 45, variance: 8 },
      gpu: { base: 35, peak: 65, variance: 12 },
      storage: { base: 70, peak: 95, variance: 10 },
    };

    const profile =
      baselineProfiles[serverType as keyof typeof baselineProfiles] ||
      baselineProfiles.web;
    const hourlyData = [];

    for (let hour = 0; hour < 24; hour++) {
      const timeMultiplier = this.getTimeMultiplier(hour);
      const diskValue =
        profile.base + (profile.peak - profile.base) * timeMultiplier;
      const variance = (Math.random() - 0.5) * profile.variance;

      hourlyData.push({
        hour,
        disk: Math.max(5, Math.min(100, diskValue + variance)),
        timestamp: Date.now() + hour * 3600000,
      });
    }

    return hourlyData;
  }

  /**
   * ⏰ 시간대별 부하 패턴 계산
   */
  private getTimeMultiplier(hour: number): number {
    // 업무 시간 (9-18시)에 높은 부하
    if (hour >= 9 && hour <= 18) {
      // 점심시간(12-13시)에는 약간 감소
      if (hour >= 12 && hour <= 13) {
        return 0.7;
      }
      // 오전/오후 피크 시간
      if ((hour >= 10 && hour <= 11) || (hour >= 14 && hour <= 16)) {
        return 1.0;
      }
      return 0.8;
    }

    // 야간 시간 (22-6시)에 낮은 부하
    if (hour >= 22 || hour <= 6) {
      return 0.2;
    }

    // 전환 시간
    return 0.5;
  }

  /**
   * 📊 베이스라인 데이터 조회
   */
  public getBaseline(serverId: string): BaselineProfile | undefined {
    return this.serverBaselines.get(serverId);
  }

  /**
   * 📋 모든 베이스라인 조회
   */
  public getAllBaselines(): BaselineProfile[] {
    return Array.from(this.serverBaselines.values());
  }

  /**
   * 🔄 베이스라인 새로고침
   */
  public refreshBaseline(serverId: string): void {
    const newBaseline = this.generateBaselineProfile(serverId);
    this.serverBaselines.set(serverId, newBaseline);
    console.log(`🔄 ${serverId} 베이스라인 새로고침 완료`);
  }

  /**
   * 📊 베이스라인 통계 조회
   */
  public getBaselineStats() {
    return {
      totalBaselines: this.serverBaselines.size,
      serverTypes: Array.from(
        new Set(Array.from(this.serverBaselines.values()).map(b => b.type))
      ),
      locations: Array.from(
        new Set(Array.from(this.serverBaselines.values()).map(b => b.location))
      ),
      lastUpdate: new Date().toISOString(),
    };
  }
}
