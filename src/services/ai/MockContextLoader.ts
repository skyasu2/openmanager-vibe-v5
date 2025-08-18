/**
 * 🎭 Mock 데이터 컨텍스트 로더
 *
 * AI가 Mock 데이터를 실제 서버처럼 분석할 수 있도록
 * 컨텍스트 정보를 제공
 */

import { getMockSystem } from '@/mock';
import type { Server } from '@/types/server';
import { isMockMode } from '@/config/mock-config';

export interface MockContext {
  enabled: boolean;
  currentTime: string;
  scenario: {
    name: string;
    description: string;
    severity: string;
    startHour: number;
  };
  metrics: {
    serverCount: number;
    criticalCount: number;
    warningCount: number;
    healthyCount: number;
    avgCpu: number;
    avgMemory: number;
    avgDisk: number;
  };
  servers: Server[];
  trends: {
    cpuTrend: 'increasing' | 'decreasing' | 'stable';
    memoryTrend: 'increasing' | 'decreasing' | 'stable';
    alertTrend: 'increasing' | 'decreasing' | 'stable';
  };
}

export class MockContextLoader {
  private static instance: MockContextLoader;

  static getInstance(): MockContextLoader {
    if (!MockContextLoader.instance) {
      MockContextLoader.instance = new MockContextLoader();
    }
    return MockContextLoader.instance;
  }

  /**
   * Mock 컨텍스트 가져오기
   */
  getMockContext(): MockContext | null {
    if (!isMockMode()) {
      return null;
    }

    try {
      const mockSystem = getMockSystem();
      const servers = mockSystem.getServers();
      const systemInfo = mockSystem.getSystemInfo();

      // 메트릭 계산
      const criticalServers = servers.filter(
        (s) => s.status === 'critical' || s.status === 'warning'
      );
      const warningServers = servers.filter((s) => s.status === 'warning');
      const healthyServers = servers.filter(
        (s) => s.status === 'online' || s.status === 'healthy'
      );

      const avgCpu =
        servers.reduce((sum, s) => sum + s.cpu, 0) / servers.length;
      const avgMemory =
        servers.reduce((sum, s) => sum + s.memory, 0) / servers.length;
      const avgDisk =
        servers.reduce((sum, s) => sum + s.disk, 0) / servers.length;

      // 트렌드 분석 (간단한 휴리스틱)
      const cpuTrend =
        avgCpu > 70 ? 'increasing' : avgCpu < 30 ? 'decreasing' : 'stable';
      const memoryTrend =
        avgMemory > 75
          ? 'increasing'
          : avgMemory < 40
            ? 'decreasing'
            : 'stable';
      const alertTrend =
        criticalServers.length > servers.length * 0.3
          ? 'increasing'
          : criticalServers.length === 0
            ? 'decreasing'
            : 'stable';

      return {
        enabled: true,
        currentTime: systemInfo.rotatorStatus?.simulationTime || '00:00:00',
        scenario: {
          name: systemInfo.scenario.scenario,
          description: systemInfo.scenario.description,
          severity:
            criticalServers.length > servers.length * 0.5
              ? 'critical'
              : warningServers.length > servers.length * 0.3
                ? 'warning'
                : 'normal',
          startHour: systemInfo.scenario.startHour,
        },
        metrics: {
          serverCount: servers.length,
          criticalCount: systemInfo.criticalCount,
          warningCount: systemInfo.warningCount,
          healthyCount: healthyServers.length,
          avgCpu: Math.round(avgCpu),
          avgMemory: Math.round(avgMemory),
          avgDisk: Math.round(avgDisk),
        },
        servers: servers.slice(0, 10), // 상위 10개 서버 (분석에 충분한 샘플)
        trends: {
          cpuTrend,
          memoryTrend,
          alertTrend,
        },
      };
    } catch (error) {
      console.error('Mock 컨텍스트 로드 실패:', error);
      return null;
    }
  }

  /**
   * AI용 컨텍스트 문자열 생성 (시나리오 정보 제외)
   */
  generateContextString(): string {
    const context = this.getMockContext();
    if (!context) {
      return '';
    }

    const lines = [
      `🎭 Mock 데이터 모드 활성화됨`,
      `⏰ 현재 시각: ${context.currentTime}`,
      ``,
      `서버 상태:`,
      `- 전체 서버: ${context.metrics.serverCount}대`,
      `- 위험: ${context.metrics.criticalCount}대`,
      `- 경고: ${context.metrics.warningCount}대`,
      `- 정상: ${context.metrics.healthyCount}대`,
      ``,
      `현재 메트릭:`,
      `- CPU 평균: ${context.metrics.avgCpu}%`,
      `- Memory 평균: ${context.metrics.avgMemory}%`,
      `- Disk 평균: ${context.metrics.avgDisk}%`,
    ];

    // 주요 문제 서버 정보 추가 (시나리오 언급 없이)
    if (context.servers && context.servers.length > 0) {
      const problemServers = context.servers.filter(
        (s) =>
          s.status === 'critical' ||
          s.status === 'warning' ||
          s.cpu > 80 ||
          s.memory > 85
      );

      if (problemServers.length > 0) {
        lines.push('', '주요 서버 상태:');
        problemServers.slice(0, 3).forEach((server) => {
          lines.push(
            `- ${server.name}: CPU ${server.cpu}%, Memory ${server.memory}%, 상태: ${server.status}`
          );
        });
      }
    }

    // 시나리오 정보는 제공하지 않음 - AI가 데이터만 보고 판단하도록
    return lines.join('\n');
  }

  /**
   * 특정 서버 분석용 컨텍스트
   */
  getServerContext(serverId: string): string {
    const context = this.getMockContext();
    if (!context) {
      return '';
    }

    const server = context.servers.find((s) => s.id === serverId);
    if (!server) {
      return '서버를 찾을 수 없습니다.';
    }

    return [
      `🖥️ ${server.name} (${server.id})`,
      `상태: ${server.status}`,
      `위치: ${server.location || '알 수 없음'}`,
      ``,
      `현재 메트릭:`,
      `- CPU: ${server.cpu}%`,
      `- Memory: ${server.memory}%`,
      `- Disk: ${server.disk}%`,
      `- Network: ${server.network}%`,
      ``,
      `알림: ${server.alerts || 0}개`,
      `마지막 업데이트: ${server.lastUpdate ? new Date(server.lastUpdate).toLocaleTimeString('ko-KR') : '알 수 없음'}`,
    ].join('\n');
  }
}
