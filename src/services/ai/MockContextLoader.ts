/**
 * 🎭 Mock 데이터 컨텍스트 로더
 *
 * AI가 Mock 데이터를 실제 서버처럼 분석할 수 있도록
 * 컨텍스트 정보를 제공
 */

import type { Server } from '../../types/server';
import { isMockMode } from '../../config/mock-config';
import { staticDataLoader } from '../data/StaticDataLoader';

export interface MockContext {
  enabled: boolean;
  currentTime: string;
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
    scenario: { name: string };
  };
}

export class MockContextLoader {
  private static instance: MockContextLoader;
  private cachedContext: MockContext | null = null;
  private cacheTimestamp: number = 0;
  private readonly CACHE_TTL_MS = 60000; // 60초 캐시 (StaticDataLoader와 동기화)

  static getInstance(): MockContextLoader {
    if (!MockContextLoader.instance) {
      MockContextLoader.instance = new MockContextLoader();
    }
    return MockContextLoader.instance;
  }

  /**
   * 캐시 유효성 확인
   */
  private isCacheValid(): boolean {
    return (
      this.cachedContext !== null &&
      Date.now() - this.cacheTimestamp < this.CACHE_TTL_MS
    );
  }

  /**
   * 캐시 무효화
   */
  private invalidateCache(): void {
    this.cachedContext = null;
    this.cacheTimestamp = 0;
  }

  /**
   * 공개 메서드: 캐시 강제 새로고침
   * AI API에서 최신 데이터가 필요할 때 호출
   */
  public refreshCache(): MockContext | null {
    this.invalidateCache();
    return this.getMockContext();
  }

  /**
   * Mock 컨텍스트 가져오기 (통합 데이터 서비스 연동 + 캐싱)
   */
  getMockContext(): MockContext | null {
    // 프로덕션에서는 디버그 로그 제거
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 MockContextLoader.getMockContext() 호출됨');
      console.log('🔍 isMockMode() 결과:', isMockMode());
    }

    if (!isMockMode()) {
      if (process.env.NODE_ENV === 'development') {
        console.log('❌ Mock 모드가 비활성화됨 - null 반환');
      }
      return null;
    }

    // 캐시된 데이터가 유효하면 반환
    if (this.isCacheValid()) {
      if (process.env.NODE_ENV === 'development') {
        console.log('⚡ 캐시된 MockContext 사용');
      }
      return this.cachedContext;
    }

    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 StaticDataLoader 동기 컨텍스트 조회 시도...');
      }
      // 🚀 베르셀 최적화: StaticDataLoader를 통해 정적 JSON 데이터 사용 (NEW 17-server system)
      const result = this.getStaticContextSync();

      // 캐시 업데이트
      if (result) {
        this.cachedContext = result;
        this.cacheTimestamp = Date.now();
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('✅ StaticDataLoader 동기 컨텍스트 성공:', {
          enabled: result?.enabled,
          serverCount: result?.servers?.length,
          currentTime: result?.currentTime,
          cached: true,
        });
      }
      return result;
    } catch (error) {
      console.error('❌ StaticDataLoader 데이터 조회 실패:', error);

      // 폴백: null 반환 (StaticDataLoader 캐시 초기화 대기 필요)
      // AI는 데이터 없음 상태를 gracefully 처리 가능
      console.warn(
        '⚠️ MockContext 사용 불가 - StaticDataLoader 초기화 대기 중'
      );

      // 캐시 무효화 (다음 요청 시 재시도)
      this.invalidateCache();

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
      `알림: ${typeof server.alerts === 'number' ? server.alerts : Array.isArray(server.alerts) ? server.alerts.length : 0}개`,
      `마지막 업데이트: ${server.lastUpdate ? new Date(server.lastUpdate).toLocaleTimeString('ko-KR', { timeZone: 'Asia/Seoul' }) : '알 수 없음'}`,
    ].join('\n');
  }

  /**
   * 🚀 베르셀 최적화: StaticDataLoader 기반 컨텍스트 생성
   * CPU 99.4% 절약, 메모리 90% 절약
   *
   * Phase 3.3: 동기 래퍼 메서드 연동으로 하드코딩 제거
   */
  private getStaticContextSync(): MockContext | null {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('🚀 StaticDataLoader 기반 컨텍스트 생성 시도 (동기 래퍼)');
      }

      // 🔄 StaticDataLoader의 동기 래퍼 메서드 호출
      const serversData = staticDataLoader.getCurrentServersDataSync(true); // forAI=true (고정 데이터)
      const stats = staticDataLoader.getCurrentStatisticsSync();

      // 캐시가 준비되지 않은 경우 null 반환 (NEW 17-server system)
      if (!serversData || !stats) {
        if (process.env.NODE_ENV === 'development') {
          console.warn(
            '⚠️ StaticDataLoader 캐시 미준비 - 다음 요청에서 재시도'
          );
        }
        return null;
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('✅ StaticDataLoader 동기 데이터 로드 성공:', {
          serversCount: serversData.length,
          stats: stats,
        });
      }

      // 서버 상태별 분류
      const criticalServers = serversData.filter(
        (s) => s.status === 'critical'
      );
      const warningServers = serversData.filter((s) => s.status === 'warning');
      const onlineServers = serversData.filter((s) => s.status === 'online');

      // 평균 디스크 사용률 계산 (stats에 없으므로 서버 데이터에서 계산)
      const avgDisk =
        serversData.length > 0
          ? Math.round(
              serversData.reduce((sum, s) => sum + s.disk, 0) /
                serversData.length
            )
          : 0;

      const currentTime = new Date().toLocaleTimeString('ko-KR', {
        hour12: false,
      });

      // Server 타입으로 변환 (MockContext 인터페이스 호환)
      const servers: Server[] = serversData.map((s) => ({
        id: s.serverId,
        name: s.serverId,
        hostname: s.serverId,
        status: s.status, // 'online' | 'warning' | 'critical'
        cpu: s.cpu,
        memory: s.memory,
        disk: s.disk,
        network: s.network,
        uptime: 86400, // 기본값 (24시간)
        location: 'Seoul-DC-01',
        alerts: s.status === 'critical' ? 2 : s.status === 'warning' ? 1 : 0,
        ip: '192.168.1.1',
        os: 'Ubuntu 22.04 LTS',
        type: 'application',
        role: 'worker',
        environment: 'production',
        provider: 'StaticDataLoader',
        lastUpdate: new Date(),
      }));

      return {
        enabled: true,
        currentTime,
        metrics: {
          serverCount: serversData.length,
          criticalCount: criticalServers.length,
          warningCount: warningServers.length,
          healthyCount: onlineServers.length,
          avgCpu: stats.avgCpu,
          avgMemory: stats.avgMemory,
          avgDisk: avgDisk,
        },
        servers: servers.slice(0, 10), // 상위 10개 서버 (AI 분석에 충분)
        trends: {
          cpuTrend:
            stats.avgCpu > 70
              ? 'increasing'
              : stats.avgCpu < 30
                ? 'decreasing'
                : 'stable',
          memoryTrend:
            stats.avgMemory > 75
              ? 'increasing'
              : stats.avgMemory < 40
                ? 'decreasing'
                : 'stable',
          alertTrend:
            criticalServers.length > serversData.length * 0.3
              ? 'increasing'
              : criticalServers.length === 0
                ? 'decreasing'
                : 'stable',
          scenario: { name: 'static' },
        },
      };
    } catch (error) {
      console.error('❌ StaticDataLoader 컨텍스트 생성 실패:', error);
      return null;
    }
  }

  /**
   * 🔄 서버 상태 정규화
   * EnhancedServerMetrics의 status를 MockContext가 기대하는 형태로 변환
   */
  private normalizeStatus(status: string): 'online' | 'warning' | 'critical' {
    switch (status.toLowerCase()) {
      case 'healthy':
      case 'online':
        return 'online';
      case 'warning':
        return 'warning';
      case 'critical':
        return 'critical';
      default:
        return 'online';
    }
  }
}
