/**
 * Server Registration Service
 * 
 * 🔗 서버 등록 로직 중앙화
 * - ServerDataCollector와의 안전한 통신
 * - 배치 등록 및 개별 등록 지원
 * - 등록 상태 추적 및 검증
 */

import { ServerDataFactory, type BaseServerConfig, type ExtendedServerInfo } from '@/lib/serverDataFactory';

export interface RegistrationResult {
  success: boolean;
  registered: number;
  failed: number;
  errors: string[];
}

export class ServerRegistrationService {
  private static instance: ServerRegistrationService;
  
  public static getInstance(): ServerRegistrationService {
    if (!this.instance) {
      this.instance = new ServerRegistrationService();
    }
    return this.instance;
  }

  private constructor() {}

  /**
   * 기본 서버 리스트를 ServerDataCollector에 등록
   */
  async registerBaseServers(): Promise<RegistrationResult> {
    const servers = ServerDataFactory.generateBaseServerList();
    return this.registerServersToCollector(servers);
  }

  /**
   * 서버 목록을 ServerDataCollector에 배치 등록
   */
  async registerServersToCollector(servers: BaseServerConfig[]): Promise<RegistrationResult> {
    const result: RegistrationResult = {
      success: false,
      registered: 0,
      failed: 0,
      errors: []
    };

    try {
      // 서버 사이드에서만 실행
      if (typeof window !== 'undefined') {
        console.log('🌐 Client-side: skipping server registration');
        result.errors.push('Client-side execution detected');
        return result;
      }

      // 동적 import로 ServerDataCollector 불러오기
      const { serverDataCollector } = await import('./collectors/ServerDataCollector');
      
      console.log(`🔗 Registering ${servers.length} servers to ServerDataCollector...`);
      
      // 각 서버를 ServerInfo 형태로 변환하여 등록
      for (const server of servers) {
        try {
          const serverInfo = ServerDataFactory.extendServerInfo(server);
          
          // ServerDataCollector의 내부 서버 맵에 직접 추가
          (serverDataCollector as any).servers.set(server.id, serverInfo);
          result.registered++;
          
          console.log(`  ✅ Registered: ${server.id}`);
        } catch (error) {
          console.error(`  ❌ Failed to register ${server.id}:`, error);
          result.failed++;
          result.errors.push(`${server.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
      
      result.success = result.registered > 0;
      console.log(`🎯 Registration complete: ${result.registered} success, ${result.failed} failed`);
      
    } catch (error) {
      console.error('❌ ServerDataCollector registration failed:', error);
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
    }

    return result;
  }

  /**
   * 개별 서버 등록
   */
  async registerSingleServer(server: BaseServerConfig): Promise<boolean> {
    const result = await this.registerServersToCollector([server]);
    return result.success && result.registered === 1;
  }

  /**
   * 등록된 서버 수 확인
   */
  async getRegisteredServerCount(): Promise<number> {
    try {
      if (typeof window !== 'undefined') {
        return 0;
      }

      const { serverDataCollector } = await import('./collectors/ServerDataCollector');
      return (serverDataCollector as any).servers.size || 0;
    } catch (error) {
      console.error('Failed to get registered server count:', error);
      return 0;
    }
  }

  /**
   * 등록 상태 검증
   */
  async validateRegistration(): Promise<{ isValid: boolean; serverCount: number; details: string }> {
    const count = await this.getRegisteredServerCount();
    
    return {
      isValid: count > 0,
      serverCount: count,
      details: count > 0 
        ? `${count} servers registered successfully`
        : 'No servers found in collector'
    };
  }

  /**
   * 강제 재등록 (기존 서버 클리어 후 재등록)
   */
  async forceReregister(): Promise<RegistrationResult> {
    try {
      if (typeof window !== 'undefined') {
        return {
          success: false,
          registered: 0,
          failed: 0,
          errors: ['Client-side execution detected']
        };
      }

      const { serverDataCollector } = await import('./collectors/ServerDataCollector');
      
      // 기존 서버 맵 클리어
      (serverDataCollector as any).servers.clear();
      console.log('🧹 Cleared existing server registrations');
      
      // 새로 등록
      return await this.registerBaseServers();
    } catch (error) {
      return {
        success: false,
        registered: 0,
        failed: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }
}

// 싱글톤 인스턴스 export
export const serverRegistrationService = ServerRegistrationService.getInstance(); 