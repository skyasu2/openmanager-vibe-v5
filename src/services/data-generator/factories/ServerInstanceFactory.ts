/**
 * 🏭 ServerInstanceFactory - 서버 인스턴스 생성 팩토리
 *
 * 📝 담당 기능:
 * - 서버 타입별 특화 사양 생성 (generateSpecializedSpecs)
 * - 서버 건강 점수 계산 (calculateHealthScore)
 * - 서버 타입별 현실적인 이슈 생성 (generateRealisticIssues)
 *
 * 🎯 SOLID 원칙: 단일 책임 - 서버 생성 로직만 담당
 *
 * @author OpenManager Vibe v5
 * @since 2025-01-29 04:26 KST
 */

import { RealWorldServerType } from '../types/NewServerTypes';

/**
 * 🏗️ 서버 사양 인터페이스
 */
export interface ServerSpecs {
  cpu: {
    cores: number;
    model: string;
    architecture: string;
  };
  memory: {
    total: number;
    type: string;
    speed: number;
  };
  disk: {
    total: number;
    type: string;
    iops: number;
  };
  network: {
    bandwidth: number;
    latency: number;
  };
}

/**
 * 🏭 ServerInstanceFactory 클래스
 */
export class ServerInstanceFactory {
  /**
   * 🏗️ 서버 타입별 특화 사양 생성
   *
   * @param serverType 서버 타입 정보
   * @returns 서버 사양 객체
   */
  static generateSpecializedSpecs(
    serverType: RealWorldServerType
  ): ServerSpecs {
    const baseSpecs: ServerSpecs = {
      cpu: {
        cores: Math.floor(Math.random() * 16) + 4,
        model: 'Intel Xeon',
        architecture: Math.random() > 0.7 ? 'arm64' : 'x86_64',
      },
      memory: {
        total: Math.pow(2, Math.floor(Math.random() * 4) + 3) * 1024,
        type: 'DDR4',
        speed: 3200,
      },
      disk: {
        total: Math.pow(2, Math.floor(Math.random() * 3) + 8) * 1024,
        type: 'SSD',
        iops: 3000,
      },
      network: {
        bandwidth: 1000,
        latency: Math.random() * 10 + 1,
      },
    };

    // 서버 타입별 사양 특화
    switch (serverType.category) {
      case 'database':
        // 데이터베이스: 높은 메모리, 빠른 디스크
        baseSpecs.memory.total =
          Math.pow(2, Math.floor(Math.random() * 3) + 5) * 1024; // 32-128GB
        baseSpecs.disk.total =
          Math.pow(2, Math.floor(Math.random() * 4) + 10) * 1024; // 1-16TB
        baseSpecs.disk.iops = 5000 + Math.floor(Math.random() * 5000); // 5000-10000 IOPS
        baseSpecs.cpu.cores = Math.floor(Math.random() * 16) + 8; // 8-24 코어
        break;

      case 'web':
        // 웹서버: 높은 네트워크, 적은 메모리
        baseSpecs.network.bandwidth = 1000 + Math.floor(Math.random() * 9000); // 1-10Gbps
        baseSpecs.memory.total =
          Math.pow(2, Math.floor(Math.random() * 2) + 3) * 1024; // 8-32GB
        baseSpecs.cpu.cores = Math.floor(Math.random() * 8) + 4; // 4-12 코어
        break;

      case 'app':
        // 애플리케이션: 균형잡힌 사양
        baseSpecs.cpu.cores = Math.floor(Math.random() * 12) + 8; // 8-20 코어
        baseSpecs.memory.total =
          Math.pow(2, Math.floor(Math.random() * 3) + 4) * 1024; // 16-64GB
        break;

      case 'infrastructure':
        // 인프라: 목적별 특화
        if (serverType.id === 'redis') {
          baseSpecs.memory.total =
            Math.pow(2, Math.floor(Math.random() * 4) + 5) * 1024; // 32-256GB
        } else if (serverType.service === 'search') {
          baseSpecs.cpu.cores = Math.floor(Math.random() * 20) + 12; // 12-32 코어
          baseSpecs.memory.total =
            Math.pow(2, Math.floor(Math.random() * 3) + 6) * 1024; // 64-256GB
        }
        break;
    }

    return baseSpecs;
  }

  /**
   * 🔍 서버 건강 점수 계산
   *
   * @param metrics 서버 메트릭 정보
   * @returns 건강 점수 (0-100)
   */
  static calculateHealthScore(metrics: any): number {
    const cpuScore = Math.max(0, 100 - metrics.cpu);
    const memoryScore = Math.max(0, 100 - metrics.memory);
    const diskScore = Math.max(0, 100 - metrics.disk);

    // 가중 평균으로 건강 점수 계산
    return Math.round(cpuScore * 0.4 + memoryScore * 0.4 + diskScore * 0.2);
  }

  /**
   * 🚨 서버 타입별 현실적인 이슈 생성
   *
   * @param serverType 서버 타입 정보
   * @param metrics 서버 메트릭 정보
   * @returns 이슈 목록 (최대 3개)
   */
  static generateRealisticIssues(
    serverType: RealWorldServerType,
    metrics: any
  ): string[] {
    const issues: string[] = [];

    // 공통 이슈
    if (metrics.cpu > 80) {
      issues.push(`High CPU usage (${metrics.cpu.toFixed(1)}%)`);
    }
    if (metrics.memory > 85) {
      issues.push(`High memory usage (${metrics.memory.toFixed(1)}%)`);
    }
    if (metrics.disk > 90) {
      issues.push(`Disk space critical (${metrics.disk.toFixed(1)}%)`);
    }

    // 서버 타입별 특화 이슈
    switch (serverType.category) {
      case 'database':
        if (metrics.customMetrics?.query_time > 30) {
          issues.push('Slow query performance detected');
        }
        if (metrics.customMetrics?.active_connections > 150) {
          issues.push('High database connection count');
        }
        if (serverType.id === 'mysql') {
          issues.push('InnoDB buffer pool optimization needed');
        }
        break;

      case 'web':
        if (metrics.customMetrics?.response_time > 120) {
          issues.push('High response time detected');
        }
        if (metrics.customMetrics?.concurrent_connections > 800) {
          issues.push('Connection limit approaching');
        }
        if (serverType.id === 'nginx') {
          issues.push('Worker process optimization required');
        }
        break;

      case 'app':
        if (metrics.customMetrics?.heap_usage > 80) {
          issues.push('Memory leak suspected');
        }
        if (metrics.customMetrics?.gc_time > 8) {
          issues.push('Garbage collection overhead high');
        }
        if (serverType.id === 'nodejs') {
          issues.push('Event loop lag detected');
        }
        break;

      case 'infrastructure':
        if (
          serverType.id === 'redis' &&
          metrics.customMetrics?.cache_hit_ratio < 85
        ) {
          issues.push('Low cache hit ratio');
        }
        if (
          serverType.service === 'message-queue' &&
          metrics.customMetrics?.queue_depth > 5000
        ) {
          issues.push('Message queue backlog detected');
        }
        break;
    }

    return issues.slice(0, 3); // 최대 3개 이슈만 표시
  }
}

/**
 * 🎯 Export 기본 팩토리 인스턴스
 */
export const serverInstanceFactory = ServerInstanceFactory;
