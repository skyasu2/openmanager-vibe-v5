/**
 * 🖥️ 서버 인스턴스 관리자 v1.0
 *
 * 책임:
 * - 서버 인스턴스 생성
 * - 서버 스펙 생성
 * - 커스텀 메트릭 생성
 * - 서버 상태 관리
 */

import type {
  ServerInstance,
  CustomEnvironmentConfig,
} from '@/types/data-generator';

export class ServerInstanceManager {
  private servers: Map<string, ServerInstance> = new Map();

  /**
   * 서버 인스턴스 생성
   */
  createServer(
    id: string,
    name: string,
    type: ServerInstance['type'],
    location: string,
    role: ServerInstance['role'] = 'standalone',
    environment: ServerInstance['environment'] = 'production'
  ): ServerInstance {
    const server: ServerInstance = {
      id,
      name,
      type,
      role,
      location,
      status: 'running',
      environment,
      specs: this.generateServerSpecs(type),
      metrics: {
        cpu: 0,
        memory: 0,
        disk: 0,
        network: { in: 0, out: 0 },
        requests: 0,
        errors: 0,
        uptime: 0,
        customMetrics: this.generateCustomMetrics(type, role),
      },
      health: {
        score: 100,
        issues: [],
        lastCheck: new Date().toISOString(),
      },
      security: {
        level: 'enhanced',
        lastSecurityScan: new Date().toISOString(),
        vulnerabilities: 0,
        patchLevel: '2024.12',
      },
    };

    this.servers.set(id, server);
    return server;
  }

  /**
   * 서버 스펙 생성
   */
  private generateServerSpecs(type: ServerInstance['type']) {
    const baseSpecs = {
      web: {
        cpu: { cores: 4, model: 'Intel Xeon E5-2680v4' },
        memory: { total: 16, type: 'DDR4', speed: 2400 },
        disk: { total: 500, type: 'SSD', iops: 3000 },
        network: { bandwidth: 1000, latency: 5 },
      },
      api: {
        cpu: { cores: 8, model: 'Intel Xeon E5-2680v4' },
        memory: { total: 32, type: 'DDR4', speed: 2400 },
        disk: { total: 1000, type: 'NVMe SSD', iops: 5000 },
        network: { bandwidth: 10000, latency: 2 },
      },
      database: {
        cpu: {
          cores: 16,
          model: 'Intel Xeon Gold 6252N',
          architecture: 'x86_64',
        },
        memory: { total: 128, type: 'DDR4 ECC', speed: 3200 },
        disk: { total: 2000, type: 'NVMe SSD RAID 10', iops: 10000 },
        network: { bandwidth: 10000, latency: 1 },
      },
      cache: {
        cpu: { cores: 8, model: 'AMD EPYC 7551P' },
        memory: { total: 64, type: 'DDR4', speed: 2666 },
        disk: { total: 200, type: 'NVMe SSD', iops: 8000 },
        network: { bandwidth: 10000, latency: 1 },
      },
      queue: {
        cpu: { cores: 4, model: 'Intel Core i7-11700K' },
        memory: { total: 16, type: 'DDR4', speed: 3200 },
        disk: { total: 500, type: 'SSD', iops: 4000 },
        network: { bandwidth: 1000, latency: 3 },
      },
      cdn: {
        cpu: { cores: 2, model: 'Intel Xeon D-1548' },
        memory: { total: 8, type: 'DDR4', speed: 2400 },
        disk: { total: 100, type: 'SSD', iops: 2000 },
        network: { bandwidth: 100000, latency: 10 },
      },
      gpu: {
        cpu: { cores: 24, model: 'Intel Xeon Platinum 8280' },
        memory: { total: 256, type: 'DDR4 ECC', speed: 2933 },
        disk: { total: 4000, type: 'NVMe SSD', iops: 15000 },
        network: { bandwidth: 25000, latency: 1 },
        gpu: { count: 4, model: 'NVIDIA A100 80GB', memory: 80 },
      },
      storage: {
        cpu: { cores: 12, model: 'Intel Xeon Silver 4214' },
        memory: { total: 64, type: 'DDR4 ECC', speed: 2400 },
        disk: { total: 10000, type: 'HDD RAID 6 + SSD Cache', iops: 2000 },
        network: { bandwidth: 10000, latency: 2 },
      },
    };

    const spec = baseSpecs[type];
    return {
      ...spec,
      // 약간의 변동성 추가
      cpu: {
        ...spec.cpu,
        cores: spec.cpu.cores + (Math.random() > 0.7 ? 2 : 0),
      },
      memory: {
        ...spec.memory,
        total: spec.memory.total * (0.8 + Math.random() * 0.4),
      },
      disk: {
        ...spec.disk,
        total: spec.disk.total * (0.8 + Math.random() * 0.4),
        iops: spec.disk.iops! * (0.9 + Math.random() * 0.2),
      },
    };
  }

  /**
   * 커스텀 메트릭 생성
   */
  private generateCustomMetrics(
    type: ServerInstance['type'],
    role: ServerInstance['role']
  ) {
    const customMetrics: Record<string, number> = {};

    switch (type) {
      case 'database':
        customMetrics.replication_lag =
          role === 'replica' ? Math.random() * 100 : 0;
        customMetrics.connection_pool = 50 + Math.random() * 200;
        break;
      case 'cache':
        customMetrics.cache_hit_ratio = 85 + Math.random() * 10;
        break;
      case 'gpu':
        customMetrics.gpu_utilization = Math.random() * 100;
        break;
      case 'storage':
        customMetrics.storage_iops = 1000 + Math.random() * 3000;
        break;
      case 'api':
      case 'web':
        customMetrics.container_count = 5 + Math.floor(Math.random() * 15);
        break;
    }

    return customMetrics;
  }

  /**
   * 서버 헬스 스코어 계산
   */
  calculateServerHealth(server: ServerInstance): void {
    const metrics = server.metrics;
    let score = 100;
    const issues: string[] = [];

    // CPU 사용률 체크
    if (metrics.cpu > 90) {
      score -= 30;
      issues.push('높은 CPU 사용률');
    } else if (metrics.cpu > 80) {
      score -= 15;
      issues.push('CPU 사용률 주의');
    }

    // 메모리 사용률 체크
    if (metrics.memory > 95) {
      score -= 25;
      issues.push('메모리 부족');
    } else if (metrics.memory > 85) {
      score -= 10;
      issues.push('메모리 사용률 높음');
    }

    // 디스크 사용률 체크
    if (metrics.disk > 90) {
      score -= 20;
      issues.push('디스크 공간 부족');
    }

    // 에러율 체크
    const errorRate =
      metrics.requests > 0 ? metrics.errors / metrics.requests : 0;
    if (errorRate > 0.05) {
      score -= 35;
      issues.push('높은 에러율');
    } else if (errorRate > 0.01) {
      score -= 15;
      issues.push('에러율 증가');
    }

    // 업타임 체크
    if (metrics.uptime < 12) {
      score -= 10;
      issues.push('최근 재시작됨');
    }

    server.health = {
      score: Math.max(0, score),
      issues,
      lastCheck: new Date().toISOString(),
    };

    // 상태 업데이트
    if (score < 50) {
      server.status = 'error';
    } else if (score < 80) {
      server.status = 'warning';
    } else {
      server.status = 'running';
    }
  }

  /**
   * 서버 목록 반환
   */
  getAllServers(): ServerInstance[] {
    return Array.from(this.servers.values());
  }

  /**
   * 서버 조회
   */
  getServerById(id: string): ServerInstance | undefined {
    return this.servers.get(id);
  }

  /**
   * 서버 업데이트
   */
  updateServer(id: string, updates: Partial<ServerInstance>): boolean {
    const server = this.servers.get(id);
    if (!server) return false;

    this.servers.set(id, { ...server, ...updates });
    return true;
  }

  /**
   * 서버 삭제
   */
  removeServer(id: string): boolean {
    return this.servers.delete(id);
  }

  /**
   * 서버 개수 제한
   */
  limitServerCount(maxCount: number): void {
    const allServers = this.getAllServers();
    if (allServers.length <= maxCount) return;

    // 우선순위: 개발환경 > 테스트 > 스테이징 > 프로덕션 순으로 제거
    const sortedServers = allServers.sort((a, b) => {
      const priority = { development: 1, test: 2, staging: 3, production: 4 };
      return priority[a.environment] - priority[b.environment];
    });

    // 초과분 제거
    const serversToRemove = sortedServers.slice(maxCount);
    serversToRemove.forEach(server => this.removeServer(server.id));

    console.log(`🔄 서버 수 제한: ${allServers.length} → ${maxCount}개`);
  }

  /**
   * 현재 상태 반환
   */
  getStatus() {
    const servers = this.getAllServers();
    return {
      total: servers.length,
      running: servers.filter(s => s.status === 'running').length,
      warning: servers.filter(s => s.status === 'warning').length,
      error: servers.filter(s => s.status === 'error').length,
    };
  }
}
