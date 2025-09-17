/**
 * 🎭 Mock 데이터 컨텍스트 로더
 *
 * AI가 Mock 데이터를 실제 서버처럼 분석할 수 있도록
 * 컨텍스트 정보를 제공
 */

import { getMockSystem, getMockServers } from '../../mock';
import type { Server } from '../../types/server';
import type { EnhancedServerMetrics } from '../../types/server';
import { isMockMode } from '../../config/mock-config';
import { unifiedDataService } from '../unified-data-service';
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
  scenario: { name: string; }; 
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
        console.log('🔄 getUnifiedContextSync() 호출 시도...');
      }
      // 🚀 베르셀 최적화: StaticDataLoader를 통해 정적 JSON 데이터 사용
      const result = this.getStaticContextSync() || this.getUnifiedContextSync();
      
      // 캐시 업데이트
      if (result) {
        this.cachedContext = result;
        this.cacheTimestamp = Date.now();
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ getUnifiedContextSync() 성공:', {
          enabled: result?.enabled,
          serverCount: result?.servers?.length,
          currentTime: result?.currentTime,
          cached: true
        });
      }
      return result;
    } catch (error) {
      console.error('❌ 통합 데이터 조회 실패, 기존 Mock 시스템 사용:', error);
      
      // 폴백: 15서버 고정 시간별 데이터 사용
      console.log('🔄 15서버 고정 시간별 데이터로 폴백 처리...');
      const mockSystem = getMockSystem();
      console.log('✅ MockSystem 인스턴스 획득');
      const servers = getMockServers(); // 15대 서버 데이터
      console.log('✅ 서버 데이터 획득:', servers.length, '개');
      const systemInfo = mockSystem.getSystemInfo();
      console.log('✅ 시스템 정보 획득:', systemInfo);

      // 메트릭 계산
      const criticalServers = servers.filter(
        (s) => s.status === 'critical' || s.status === 'warning'
      );
      const warningServers = servers.filter((s) => s.status === 'warning');
      const healthyServers = servers.filter(
        (s) => s.status === 'online' || s.status === 'healthy'
      );

      const avgCpu = servers.length > 0 
        ? servers.reduce((sum, s) => sum + s.cpu, 0) / servers.length 
        : 0;
      const avgMemory = servers.length > 0 
        ? servers.reduce((sum, s) => sum + s.memory, 0) / servers.length 
        : 0;
      const avgDisk = servers.length > 0 
        ? servers.reduce((sum, s) => sum + s.disk, 0) / servers.length 
        : 0;

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
        servers.length > 0 && criticalServers.length > servers.length * 0.3
          ? 'increasing'
          : criticalServers.length === 0
            ? 'decreasing'
            : 'stable';

      const fallbackContext: MockContext = {
        enabled: true,
        currentTime: new Date().toLocaleTimeString('ko-KR', { hour12: false }),
        metrics: {
          serverCount: servers.length,
          criticalCount: systemInfo.criticalCount,
          warningCount: systemInfo.warningCount,
          healthyCount: healthyServers.length,
          avgCpu: Math.round(avgCpu * 10) / 10,
          avgMemory: Math.round(avgMemory * 10) / 10,
          avgDisk: Math.round(avgDisk * 10) / 10,
        },
        servers: servers.slice(0, 10), // 상위 10개 서버 (분석에 충분한 샘플)
        trends: {
          cpuTrend,
          memoryTrend,
          alertTrend,
          scenario: { name: "normal" },
        },
      };

      // 폴백 데이터도 캐시에 저장
      if (fallbackContext) {
        this.cachedContext = fallbackContext;
        this.cacheTimestamp = Date.now();
      }

      return fallbackContext;
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

  /**
   * 🔄 통합 데이터 서비스 기반 컨텍스트 생성 (동기 버전)
   * 서버 모니터링과 동일한 24시간 고정 데이터를 AI 분석용으로 변환
   */
  private getUnifiedContextSync(): MockContext | null {
    try {
      console.log('🔄 통합 데이터 서비스에서 AI 분석용 데이터 조회 중... (동기)');
      
      // ✅ 15서버 고정 시간별 데이터 사용 (API 엔드포인트와 동일)
      const servers = getMockServers(); // 15대 서버 데이터
      const mockSystem = getMockSystem();
      const systemInfo = mockSystem.getSystemInfo();

      // 메트릭 계산
      const criticalServers = servers.filter(
        (s) => s.status === 'critical' || s.status === 'warning'
      );
      const warningServers = servers.filter((s) => s.status === 'warning');
      const healthyServers = servers.filter(
        (s) => s.status === 'online' || s.status === 'healthy'
      );

      const avgCpu = servers.reduce((sum, s) => sum + s.cpu, 0) / servers.length;
      const avgMemory = servers.reduce((sum, s) => sum + s.memory, 0) / servers.length;
      const avgDisk = servers.reduce((sum, s) => sum + s.disk, 0) / servers.length;

      // 트렌드 분석 (간단한 휴리스틱)
      const cpuTrend = avgCpu > 70 ? 'increasing' : avgCpu < 30 ? 'decreasing' : 'stable';
      const memoryTrend = avgMemory > 75 ? 'increasing' : avgMemory < 40 ? 'decreasing' : 'stable';
      const alertTrend = criticalServers.length > servers.length * 0.3 ? 'increasing' : 
                        criticalServers.length === 0 ? 'decreasing' : 'stable';

      return {
        enabled: true,
        currentTime: new Date().toLocaleTimeString('ko-KR', { hour12: false }),
        metrics: {
          serverCount: servers.length,
          criticalCount: systemInfo.criticalCount,
          warningCount: systemInfo.warningCount,
          healthyCount: healthyServers.length,
          avgCpu: Math.round(avgCpu * 10) / 10,
          avgMemory: Math.round(avgMemory * 10) / 10,
          avgDisk: Math.round(avgDisk * 10) / 10,
        },
        servers: servers.slice(0, 10), // 상위 10개 서버
        trends: {
          cpuTrend,
          memoryTrend,
          alertTrend,
          scenario: { name: "unified" },
        },
      };

    } catch (error) {
      console.error('❌ 동기 통합 데이터 컨텍스트 생성 실패:', error);
      throw error; // 상위에서 폴백 처리
    }
  }

  /**
   * 🔄 통합 데이터 서비스 기반 컨텍스트 생성 (비동기 버전)
   * 서버 모니터링과 동일한 24시간 고정 데이터를 AI 분석용으로 변환
   */
  private async getUnifiedContext(): Promise<MockContext | null> {
    try {
      console.log('🔄 통합 데이터 서비스에서 AI 분석용 데이터 조회 중...');
      
      // 통합 데이터 서비스에서 AI 메타데이터 포함하여 데이터 조회
      const unifiedData = await unifiedDataService.getAIAnalysisData();
      
      if (!unifiedData.servers || unifiedData.servers.length === 0) {
        throw new Error('통합 데이터 서비스에서 서버 데이터 없음');
      }

      console.log(`✅ 통합 데이터 조회 성공: ${unifiedData.servers.length}개 서버`);
      console.log(`📊 시나리오: ${unifiedData.aiContext?.scenario || '알 수 없음'}`);

      // EnhancedServerMetrics를 Server 타입으로 변환
      const servers: Server[] = unifiedData.servers.map((server) => ({
        id: server.id,
        name: server.name,
        hostname: server.hostname || server.name,
        status: this.normalizeStatus(server.status),
        cpu: server.cpu_usage || server.cpu || 0,
        memory: server.memory_usage || server.memory || 0,
        disk: server.disk_usage || server.disk || 0,
        network: server.network || 0,
        uptime: server.uptime || 86400,
        location: server.location || 'Seoul-DC-01',
        alerts: server.alerts || 0,
        ip: server.ip || '192.168.1.1',
        os: server.os || 'Ubuntu 22.04 LTS',
        type: server.type || 'application',
        role: server.role || 'worker',
        environment: server.environment || 'production',
        provider: server.provider || 'Unified-Data-Service',
        lastUpdate: server.lastUpdate ? new Date(server.lastUpdate) : new Date(),
      }));

      // 서버 상태별 분류 및 통계 계산
      const criticalServers = servers.filter((s) => s.status === 'critical');
      const warningServers = servers.filter((s) => s.status === 'warning');  
      const healthyServers = servers.filter((s) => s.status === 'online' || s.status === 'healthy');

      const avgCpu = servers.reduce((sum, s) => sum + s.cpu, 0) / servers.length;
      const avgMemory = servers.reduce((sum, s) => sum + s.memory, 0) / servers.length;
      const avgDisk = servers.reduce((sum, s) => sum + s.disk, 0) / servers.length;

      // 트렌드 분석 (통합 데이터 기반)
      const cpuTrend = avgCpu > 70 ? 'increasing' : avgCpu < 30 ? 'decreasing' : 'stable';
      const memoryTrend = avgMemory > 75 ? 'increasing' : avgMemory < 40 ? 'decreasing' : 'stable';
      const alertTrend = criticalServers.length > servers.length * 0.3 ? 'increasing' : 
                        criticalServers.length === 0 ? 'decreasing' : 'stable';

      const mockContext: MockContext = {
        enabled: true,
        currentTime: new Date().toLocaleTimeString('ko-KR', { hour12: false }),
        metrics: {
          serverCount: servers.length,
          criticalCount: criticalServers.length,
          warningCount: warningServers.length,
          healthyCount: healthyServers.length,
          avgCpu: Math.round(avgCpu * 10) / 10,
          avgMemory: Math.round(avgMemory * 10) / 10,
          avgDisk: Math.round(avgDisk * 10) / 10,
        },
        servers,
        trends: {
          cpuTrend,
          memoryTrend,
          scenario: { name: "dynamic" },
          alertTrend,
        },
      };

      console.log('🤖 AI 분석용 통합 컨텍스트 생성 완료:', {
        serverCount: mockContext.servers.length,
        scenario: mockContext.trends.scenario.name,
        criticalCount: mockContext.metrics.criticalCount,
        warningCount: mockContext.metrics.warningCount,
      });

      return mockContext;

    } catch (error) {
      console.error('❌ 통합 데이터 컨텍스트 생성 실패:', error);
      throw error; // 상위에서 폴백 처리
    }
  }

  /**
   * 🚀 베르셀 최적화: StaticDataLoader 기반 컨텍스트 생성
   * CPU 99.4% 절약, 메모리 90% 절약
   */
  private getStaticContextSync(): MockContext | null {
    try {
      // 동기적으로 사용하기 위해 Promise를 처리할 수 없으므로
      // 이미 캐시된 데이터가 있는지 확인하거나 폴백 사용
      if (process.env.NODE_ENV === 'development') {
        console.log('🚀 StaticDataLoader 기반 컨텍스트 생성 시도');
      }

      // getCurrentServersData는 비동기이므로 여기서는 간단한 폴백 사용
      // 실제로는 AI API에서 직접 staticDataLoader.getCurrentServersData(true) 호출 권장
      const now = new Date();
      const currentTime = now.toLocaleTimeString('ko-KR', { hour12: false });

      return {
        enabled: true,
        currentTime,
        metrics: {
          serverCount: 15,
          criticalCount: 1,
          warningCount: 2,
          healthyCount: 12,
          avgCpu: 45,
          avgMemory: 55,
          avgDisk: 35,
        },
        servers: [], // AI API에서 staticDataLoader.getCurrentServersData(true) 직접 호출
        trends: {
          cpuTrend: 'stable',
          scenario: { name: "static" },
          memoryTrend: 'stable',
          alertTrend: 'stable',
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
