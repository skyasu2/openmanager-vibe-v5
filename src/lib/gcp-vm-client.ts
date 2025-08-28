/**
 * 🌐 GCP VM 통신 클라이언트
 * 
 * GCP VM Express.js 서버와 안전하게 통신하여 서버 데이터를 가져오는 클라이언트
 * 
 * 주요 기능:
 * - Circuit Breaker 패턴으로 안전한 통신
 * - 3단계 폴백 시스템 (GCP VM → Cache → Mock)
 * - 적응형 타임아웃 및 재시도 로직
 * - 압축된 데이터 구조로 메모리 효율성 최적화
 * 
 * AI 교차 검증 반영:
 * - Gemini: 3단계 폴백, 환경변수 기반 설정
 * - Codex: Circuit Breaker 통합, 보안 강화
 * - Qwen: 메모리 최적화, 성능 모니터링
 */

import { executeWithCircuitBreaker, monitorCircuitBreaker, type CircuitBreakerResult } from './circuit-breaker';
import type { EnhancedServerMetrics } from '../types/server';

// 🔧 환경변수 로드 - Next.js 캐시 우회를 위한 강제 최신 값 사용
// Next.js 빌드타임 캐시 문제 해결: 런타임에서 최신 .env.local 값 강제 사용
const GCP_VM_EXTERNAL_IP = '35.209.146.37'; // 새 gcp-server VM
const GCP_VM_INTERNAL_IP = '10.128.0.4';     // 내부 IP
const MCP_SERVER_PORT = '10000';             // 새 포트
const VM_API_TOKEN = process.env.VM_API_TOKEN; // 토큰은 정상적으로 로드됨

// 디버그 로그: 강제 설정된 값 확인
console.log('🔧 [GCP-VM-CLIENT] Next.js 캐시 우회 - 강제 최신 값 사용:');
console.log('  GCP_VM_EXTERNAL_IP:', GCP_VM_EXTERNAL_IP, '(강제 설정)');
console.log('  GCP_VM_INTERNAL_IP:', GCP_VM_INTERNAL_IP, '(강제 설정)');
console.log('  MCP_SERVER_PORT:', MCP_SERVER_PORT, '(강제 설정)');
console.log('  VM_API_TOKEN:', VM_API_TOKEN ? 'SET (길이: ' + VM_API_TOKEN.length + ')' : 'UNDEFINED');

// 🌐 GCP VM API 엔드포인트 (외부/내부 IP 폴백)
const GCP_VM_EXTERNAL_URL = `http://${GCP_VM_EXTERNAL_IP}:${MCP_SERVER_PORT}`;
const GCP_VM_INTERNAL_URL = `http://${GCP_VM_INTERNAL_IP}:${MCP_SERVER_PORT}`;
const GCP_VM_SERVERS_ENDPOINT_EXTERNAL = `${GCP_VM_EXTERNAL_URL}/api/servers`;
const GCP_VM_SERVERS_ENDPOINT_INTERNAL = `${GCP_VM_INTERNAL_URL}/api/servers`;
const GCP_VM_HEALTH_ENDPOINT_EXTERNAL = `${GCP_VM_EXTERNAL_URL}/health`;
const GCP_VM_HEALTH_ENDPOINT_INTERNAL = `${GCP_VM_INTERNAL_URL}/health`;

// 📊 응답 인터페이스
export interface GCPVMServerResponse {
  success: boolean;
  data: EnhancedServerMetrics[];
  source: 'gcp-vm' | 'cache' | 'fallback';
  fallback: boolean;
  cached?: boolean;
  scenario?: {
    current: string;
    korean: string;
    hour: number;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  timestamp: string;
  metadata?: {
    serverCount: number;
    loadMultiplier: number;
    cacheStats?: unknown;
  };
}

export interface GCPVMHealthResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime?: string;
  memory?: {
    used: string;
    total: string;
  };
  cache?: {
    keys: number;
    stats: unknown;
  };
}

export interface GCPVMClientOptions {
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
  enableFallback?: boolean;
  enableCache?: boolean;
}

// 📦 메모리 캐시 (30초 TTL)
interface CacheEntry {
  data: EnhancedServerMetrics[];
  timestamp: number;
  ttl: number;
}

class SimpleCache {
  private cache = new Map<string, CacheEntry>();
  private defaultTTL = 30 * 1000; // 30초

  set(key: string, data: EnhancedServerMetrics[], ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    });

    // 자동 만료 설정
    setTimeout(() => {
      this.cache.delete(key);
    }, ttl || this.defaultTTL);
  }

  get(key: string): EnhancedServerMetrics[] | null {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    // TTL 확인
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

/**
 * GCP VM 클라이언트 클래스
 */
export class GCPVMClient {
  private cache = new SimpleCache();
  private options: Required<GCPVMClientOptions>;

  constructor(options: GCPVMClientOptions = {}) {
    this.options = {
      timeout: 8000,        // 8초 타임아웃 (GCP VM 통신 고려)
      retryAttempts: 3,     // 3회 재시도 (외부/내부 IP 폴백 포함)
      retryDelay: 1500,     // 1.5초 재시도 지연 (지수 백오프)
      enableFallback: true, // 폴백 활성화
      enableCache: true,    // 캐시 활성화
      ...options
    };

    // 토큰 검증
    if (!VM_API_TOKEN) {
      console.warn('⚠️ VM_API_TOKEN이 설정되지 않았습니다. GCP VM 통신이 실패할 수 있습니다.');
    }
  }

  /**
   * 서버 데이터 가져오기 (3단계 폴백 + Circuit Breaker)
   */
  async getServers(): Promise<GCPVMServerResponse> {
    const cacheKey = 'servers-data';
    
    console.log('🚀 [GCP-VM-CLIENT] 서버 데이터 가져오기 시작');
    console.log('🔧 [GCP-VM-CLIENT] 설정:', {
      enableCache: this.options.enableCache,
      timeout: this.options.timeout,
      retryAttempts: this.options.retryAttempts
    });
    console.log('🌐 [GCP-VM-CLIENT] 대상 서버:', {
      external: GCP_VM_EXTERNAL_URL,
      internal: GCP_VM_INTERNAL_URL
    });
    
    // 🔄 Circuit Breaker로 GCP VM 요청 실행
    console.log('🔧 [GCP-VM-CLIENT] Circuit Breaker를 통한 요청 실행');
    const result = await executeWithCircuitBreaker<GCPVMServerResponse>(
      // 1차: GCP VM 직접 요청
      () => {
        console.log('🎯 [GCP-VM-CLIENT] 1차: GCP VM 직접 요청 시도');
        return this.fetchFromGCPVM();
      },
      // 2차: 캐시된 데이터 폴백
      () => {
        console.log('🛡️ [GCP-VM-CLIENT] 2차: 캐시/Mock 폴백 실행');
        return this.getFallbackData(cacheKey);
      }
    );

    // Circuit Breaker 결과 분석
    console.log('⚡ [GCP-VM-CLIENT] Circuit Breaker 결과:', {
      success: result.success,
      error: result.error,
      fallbackUsed: result.fallbackUsed
    });

    // 최종 응답 데이터 확인
    const finalResponse = result.data || this.getEmptyResponse();
    console.log('📊 [GCP-VM-CLIENT] 최종 응답 데이터:', {
      success: finalResponse.success,
      source: finalResponse.source || 'unknown',
      fallback: finalResponse.fallback || false,
      serverCount: finalResponse.data?.length || 0
    });

    // 성공한 데이터를 캐시에 저장
    if (result.success && result.data && !result.data.fallback && this.options.enableCache) {
      this.cache.set(cacheKey, result.data.data);
      console.log('💾 [GCP-VM-CLIENT] GCP VM 데이터를 캐시에 저장 완료');
      console.log('📋 [GCP-VM-CLIENT] 캐시된 서버 목록:', 
        result.data.data?.map((s: any) => `${s.name}(${s.status})`).join(', ') || '없음'
      );
    }

    return finalResponse;
  }

  /**
   * GCP VM 헬스체크 (외부 → 내부 IP 폴백)
   */
  async checkHealth(): Promise<{ healthy: boolean; response?: GCPVMHealthResponse; error?: string; source?: 'external' | 'internal' }> {
    // 1차: 외부 IP 시도
    try {
      console.log(`🏥 외부 IP 헬스체크: ${GCP_VM_EXTERNAL_URL}`);
      const response = await this.makeRequest<GCPVMHealthResponse>(GCP_VM_HEALTH_ENDPOINT_EXTERNAL, {
        method: 'GET',
        timeout: 3000 // 헬스체크는 3초 타임아웃
      });

      return {
        healthy: response.status === 'healthy',
        response,
        source: 'external'
      };
    } catch (externalError) {
      console.warn(`⚠️ 외부 IP 헬스체크 실패: ${externalError instanceof Error ? externalError.message : 'Unknown error'}`);
    }

    // 2차: 내부 IP 시도 (폴백)
    try {
      console.log(`🏥 내부 IP 헬스체크: ${GCP_VM_INTERNAL_URL}`);
      const response = await this.makeRequest<GCPVMHealthResponse>(GCP_VM_HEALTH_ENDPOINT_INTERNAL, {
        method: 'GET',
        timeout: 3000 // 헬스체크는 3초 타임아웃
      });

      return {
        healthy: response.status === 'healthy',
        response,
        source: 'internal'
      };
    } catch (internalError) {
      console.error('❌ GCP VM 헬스체크 완전 실패:', internalError);
      return {
        healthy: false,
        error: internalError instanceof Error ? internalError.message : 'Unknown error'
      };
    }
  }

  /**
   * GCP VM에서 직접 데이터 가져오기 (외부 → 내부 IP 폴백)
   */
  private async fetchFromGCPVM(): Promise<GCPVMServerResponse> {
    console.log('🌐 GCP VM에서 서버 데이터 요청 중...');
    
    // 1차: 외부 IP 시도
    try {
      console.log(`🔗 외부 IP 시도: ${GCP_VM_EXTERNAL_URL}`);
      const response = await this.makeRequest<GCPVMServerResponse>(GCP_VM_SERVERS_ENDPOINT_EXTERNAL, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${VM_API_TOKEN}`,
          'Content-Type': 'application/json'
        },
        timeout: this.options.timeout
      });

      console.log(`✅ 외부 IP 응답 성공: ${response.data?.length || 0}개 서버`);
      return response;
    } catch (externalError) {
      console.warn(`⚠️ 외부 IP 실패: ${externalError instanceof Error ? externalError.message : 'Unknown error'}`);
    }

    // 2차: 내부 IP 시도 (폴백)
    try {
      console.log(`🔗 내부 IP 시도: ${GCP_VM_INTERNAL_URL}`);
      const response = await this.makeRequest<GCPVMServerResponse>(GCP_VM_SERVERS_ENDPOINT_INTERNAL, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${VM_API_TOKEN}`,
          'Content-Type': 'application/json'
        },
        timeout: this.options.timeout
      });

      console.log(`✅ 내부 IP 응답 성공: ${response.data?.length || 0}개 서버`);
      return response;
    } catch (internalError) {
      console.error(`❌ 내부 IP도 실패: ${internalError instanceof Error ? internalError.message : 'Unknown error'}`);
      throw internalError;
    }
  }

  /**
   * 폴백 데이터 가져오기 (캐시 → Mock 순서)
   */
  private async getFallbackData(cacheKey: string): Promise<GCPVMServerResponse> {
    console.log('🛡️ [GCP-VM-CLIENT] 폴백 데이터 요청 시작');
    console.log('🔑 [GCP-VM-CLIENT] 캐시 키:', cacheKey);
    console.log('💾 [GCP-VM-CLIENT] 캐시 활성화 여부:', this.options.enableCache);
    
    // 2차: 캐시된 데이터 시도
    if (this.options.enableCache && this.cache.has(cacheKey)) {
      const cachedData = this.cache.get(cacheKey);
      if (cachedData) {
        console.log('⚡ [GCP-VM-CLIENT] 캐시된 서버 데이터 사용');
        console.log('📊 [GCP-VM-CLIENT] 캐시된 서버 수:', cachedData.length);
        console.log('📋 [GCP-VM-CLIENT] 캐시된 서버 목록:', cachedData.map((s: any) => `${s.name}(${s.status})`).join(', '));
        
        return {
          success: true,
          data: cachedData,
          source: 'gcp-vm-cache',
          fallback: true,
          cached: true,
          timestamp: new Date().toISOString()
        };
      }
    }

    // 3차: GCP VM 클라이언트 Mock 데이터 (최후 수단)
    console.log('🔄 [GCP-VM-CLIENT] GCP VM Mock 데이터로 폴백 (10개 서버)');
    console.log('📁 [GCP-VM-CLIENT] 폴백 경로: GCP VM 클라이언트 전용 목업');
    
    const mockResult = this.getMockData();
    console.log('🎯 [GCP-VM-CLIENT] Mock 데이터 서버 수:', mockResult.data.length);
    console.log('📋 [GCP-VM-CLIENT] Mock 서버 목록:', mockResult.data.map(s => `${s.name}(${s.status})`).join(', '));
    
    return mockResult;
  }

  /**
   * Mock 데이터 생성 (10개 서버 - GCP VM 서버와 일관성 유지)
   */
  private getMockData(): GCPVMServerResponse {
    const timestamp = new Date().toISOString();
    const mockServers: EnhancedServerMetrics[] = [
      // 웹 서버들 (3개)
      {
        id: `server-${Date.now()}-0`,
        name: 'web-server-01',
        hostname: 'web-server-01',
        status: 'online' as const,
        cpu: 45.2,
        cpu_usage: 45.2,
        memory: 78.5,
        memory_usage: 78.5,
        disk: 65.1,
        disk_usage: 65.1,
        network: 12.3,
        network_in: 7.4,
        network_out: 4.9,
        uptime: 359280,
        location: 'Seoul-DC-01',
        alerts: 0,
        ip: '192.168.1.100',
        os: 'Ubuntu 22.04 LTS',
        type: 'web',
        role: 'worker',
        environment: 'production',
        provider: 'GCP-Mock-Fallback',
        specs: { cpu_cores: 2, memory_gb: 8, disk_gb: 260, network_speed: '1Gbps' },
        lastUpdate: timestamp,
        services: [],
        systemInfo: {
          os: 'Ubuntu 22.04 LTS',
          uptime: '99h',
          processes: 120,
          zombieProcesses: 0,
          loadAverage: '1.80, 1.75, 1.70',
          lastUpdate: timestamp
        },
        networkInfo: {
          interface: 'eth0',
          receivedBytes: '7 MB',
          sentBytes: '4 MB',
          receivedErrors: 0,
          sentErrors: 0,
          status: 'healthy'
        }
      },
      {
        id: `server-${Date.now()}-1`,
        name: 'web-server-02',
        hostname: 'web-server-02',
        status: 'online' as const,
        cpu: 52.8,
        cpu_usage: 52.8,
        memory: 68.2,
        memory_usage: 68.2,
        disk: 58.9,
        disk_usage: 58.9,
        network: 15.7,
        network_in: 9.4,
        network_out: 6.3,
        uptime: 358200,
        location: 'Seoul-DC-01',
        alerts: 0,
        ip: '192.168.1.101',
        os: 'Ubuntu 22.04 LTS',
        type: 'web',
        role: 'worker',
        environment: 'production',
        provider: 'GCP-Mock-Fallback',
        specs: { cpu_cores: 3, memory_gb: 6, disk_gb: 235, network_speed: '1Gbps' },
        lastUpdate: timestamp,
        services: [],
        systemInfo: {
          os: 'Ubuntu 22.04 LTS',
          uptime: '99h',
          processes: 135,
          zombieProcesses: 1,
          loadAverage: '2.10, 2.05, 2.00',
          lastUpdate: timestamp
        },
        networkInfo: {
          interface: 'eth0',
          receivedBytes: '9 MB',
          sentBytes: '6 MB',
          receivedErrors: 0,
          sentErrors: 0,
          status: 'healthy'
        }
      },
      {
        id: `server-${Date.now()}-2`,
        name: 'web-server-03',
        hostname: 'web-server-03',
        status: 'warning' as const,
        cpu: 78.4,
        cpu_usage: 78.4,
        memory: 85.1,
        memory_usage: 85.1,
        disk: 72.3,
        disk_usage: 72.3,
        network: 25.8,
        network_in: 15.2,
        network_out: 10.6,
        uptime: 325680,
        location: 'Seoul-DC-02',
        alerts: 1,
        ip: '192.168.1.102',
        os: 'Ubuntu 22.04 LTS',
        type: 'web',
        role: 'worker',
        environment: 'production',
        provider: 'GCP-Mock-Fallback',
        specs: { cpu_cores: 4, memory_gb: 8, disk_gb: 320, network_speed: '1Gbps' },
        lastUpdate: timestamp,
        services: [],
        systemInfo: {
          os: 'Ubuntu 22.04 LTS',
          uptime: '90h',
          processes: 187,
          zombieProcesses: 3,
          loadAverage: '3.20, 3.15, 3.10',
          lastUpdate: timestamp
        },
        networkInfo: {
          interface: 'eth0',
          receivedBytes: '15 MB',
          sentBytes: '11 MB',
          receivedErrors: 2,
          sentErrors: 1,
          status: 'warning'
        }
      },
      // API 서버들 (3개)
      {
        id: `server-${Date.now()}-3`,
        name: 'api-server-01',
        hostname: 'api-server-01',
        status: 'online' as const,
        cpu: 38.7,
        cpu_usage: 38.7,
        memory: 62.4,
        memory_usage: 62.4,
        disk: 45.9,
        disk_usage: 45.9,
        network: 18.6,
        network_in: 11.2,
        network_out: 7.4,
        uptime: 421200,
        location: 'Seoul-DC-01',
        alerts: 0,
        ip: '192.168.1.110',
        os: 'Ubuntu 22.04 LTS',
        type: 'api',
        role: 'worker',
        environment: 'production',
        provider: 'GCP-Mock-Fallback',
        specs: { cpu_cores: 4, memory_gb: 8, disk_gb: 280, network_speed: '1Gbps' },
        lastUpdate: timestamp,
        services: [],
        systemInfo: {
          os: 'Ubuntu 22.04 LTS',
          uptime: '117h',
          processes: 95,
          zombieProcesses: 0,
          loadAverage: '1.50, 1.45, 1.40',
          lastUpdate: timestamp
        },
        networkInfo: {
          interface: 'eth0',
          receivedBytes: '11 MB',
          sentBytes: '7 MB',
          receivedErrors: 0,
          sentErrors: 0,
          status: 'healthy'
        }
      },
      {
        id: `server-${Date.now()}-4`,
        name: 'api-server-02',
        hostname: 'api-server-02',
        status: 'online' as const,
        cpu: 56.3,
        cpu_usage: 56.3,
        memory: 74.8,
        memory_usage: 74.8,
        disk: 67.2,
        disk_usage: 67.2,
        network: 22.4,
        network_in: 13.7,
        network_out: 8.7,
        uptime: 398760,
        location: 'Seoul-DC-02',
        alerts: 0,
        ip: '192.168.1.111',
        os: 'Ubuntu 22.04 LTS',
        type: 'api',
        role: 'worker',
        environment: 'production',
        provider: 'GCP-Mock-Fallback',
        specs: { cpu_cores: 3, memory_gb: 6, disk_gb: 250, network_speed: '1Gbps' },
        lastUpdate: timestamp,
        services: [],
        systemInfo: {
          os: 'Ubuntu 22.04 LTS',
          uptime: '110h',
          processes: 112,
          zombieProcesses: 2,
          loadAverage: '2.00, 1.95, 1.90',
          lastUpdate: timestamp
        },
        networkInfo: {
          interface: 'eth0',
          receivedBytes: '14 MB',
          sentBytes: '9 MB',
          receivedErrors: 1,
          sentErrors: 0,
          status: 'healthy'
        }
      },
      {
        id: `server-${Date.now()}-5`,
        name: 'api-server-03',
        hostname: 'api-server-03',
        status: 'critical' as const,
        cpu: 92.4,
        cpu_usage: 92.4,
        memory: 95.7,
        memory_usage: 95.7,
        disk: 87.3,
        disk_usage: 87.3,
        network: 52.1,
        network_in: 31.3,
        network_out: 20.8,
        uptime: 340020,
        location: 'Seoul-DC-01',
        alerts: 3,
        ip: '192.168.1.112',
        os: 'Ubuntu 22.04 LTS',
        type: 'api',
        role: 'worker',
        environment: 'production',
        provider: 'GCP-Mock-Fallback',
        specs: { cpu_cores: 4, memory_gb: 8, disk_gb: 349, network_speed: '1Gbps' },
        lastUpdate: timestamp,
        services: [],
        systemInfo: {
          os: 'Ubuntu 22.04 LTS',
          uptime: '94h',
          processes: 287,
          zombieProcesses: 12,
          loadAverage: '4.50, 4.12, 3.98',
          lastUpdate: timestamp
        },
        networkInfo: {
          interface: 'eth0',
          receivedBytes: '31 MB',
          sentBytes: '21 MB',
          receivedErrors: 8,
          sentErrors: 5,
          status: 'critical'
        }
      },
      // DB 서버들 (2개)
      {
        id: `server-${Date.now()}-6`,
        name: 'db-server-01',
        hostname: 'db-server-01',
        status: 'online' as const,
        cpu: 35.1,
        cpu_usage: 35.1,
        memory: 82.3,
        memory_usage: 82.3,
        disk: 76.8,
        disk_usage: 76.8,
        network: 8.4,
        network_in: 4.9,
        network_out: 3.5,
        uptime: 489600,
        location: 'Seoul-DC-01',
        alerts: 0,
        ip: '192.168.1.120',
        os: 'Ubuntu 22.04 LTS',
        type: 'database',
        role: 'master',
        environment: 'production',
        provider: 'GCP-Mock-Fallback',
        specs: { cpu_cores: 6, memory_gb: 16, disk_gb: 500, network_speed: '1Gbps' },
        lastUpdate: timestamp,
        services: [],
        systemInfo: {
          os: 'Ubuntu 22.04 LTS',
          uptime: '136h',
          processes: 67,
          zombieProcesses: 0,
          loadAverage: '1.20, 1.15, 1.10',
          lastUpdate: timestamp
        },
        networkInfo: {
          interface: 'eth0',
          receivedBytes: '5 MB',
          sentBytes: '4 MB',
          receivedErrors: 0,
          sentErrors: 0,
          status: 'healthy'
        }
      },
      {
        id: `server-${Date.now()}-7`,
        name: 'db-server-02',
        hostname: 'db-server-02',
        status: 'warning' as const,
        cpu: 67.2,
        cpu_usage: 67.2,
        memory: 89.6,
        memory_usage: 89.6,
        disk: 84.7,
        disk_usage: 84.7,
        network: 12.7,
        network_in: 7.8,
        network_out: 4.9,
        uptime: 456720,
        location: 'Seoul-DC-02',
        alerts: 2,
        ip: '192.168.1.121',
        os: 'Ubuntu 22.04 LTS',
        type: 'database',
        role: 'slave',
        environment: 'production',
        provider: 'GCP-Mock-Fallback',
        specs: { cpu_cores: 6, memory_gb: 16, disk_gb: 500, network_speed: '1Gbps' },
        lastUpdate: timestamp,
        services: [],
        systemInfo: {
          os: 'Ubuntu 22.04 LTS',
          uptime: '126h',
          processes: 89,
          zombieProcesses: 5,
          loadAverage: '2.80, 2.75, 2.70',
          lastUpdate: timestamp
        },
        networkInfo: {
          interface: 'eth0',
          receivedBytes: '8 MB',
          sentBytes: '5 MB',
          receivedErrors: 3,
          sentErrors: 2,
          status: 'warning'
        }
      },
      // 캐시 서버 (1개)
      {
        id: `server-${Date.now()}-8`,
        name: 'cache-server-01',
        hostname: 'cache-server-01',
        status: 'online' as const,
        cpu: 28.4,
        cpu_usage: 28.4,
        memory: 76.2,
        memory_usage: 76.2,
        disk: 34.8,
        disk_usage: 34.8,
        network: 42.6,
        network_in: 25.8,
        network_out: 16.8,
        uptime: 512400,
        location: 'Seoul-DC-01',
        alerts: 0,
        ip: '192.168.1.130',
        os: 'Ubuntu 22.04 LTS',
        type: 'cache',
        role: 'worker',
        environment: 'production',
        provider: 'GCP-Mock-Fallback',
        specs: { cpu_cores: 4, memory_gb: 16, disk_gb: 200, network_speed: '1Gbps' },
        lastUpdate: timestamp,
        services: [],
        systemInfo: {
          os: 'Ubuntu 22.04 LTS',
          uptime: '142h',
          processes: 45,
          zombieProcesses: 0,
          loadAverage: '0.80, 0.75, 0.70',
          lastUpdate: timestamp
        },
        networkInfo: {
          interface: 'eth0',
          receivedBytes: '26 MB',
          sentBytes: '17 MB',
          receivedErrors: 0,
          sentErrors: 0,
          status: 'healthy'
        }
      },
      // 로드 밸런서 (1개)
      {
        id: `server-${Date.now()}-9`,
        name: 'loadbalancer-01',
        hostname: 'loadbalancer-01',
        status: 'online' as const,
        cpu: 22.7,
        cpu_usage: 22.7,
        memory: 45.3,
        memory_usage: 45.3,
        disk: 18.9,
        disk_usage: 18.9,
        network: 85.4,
        network_in: 52.6,
        network_out: 32.8,
        uptime: 623520,
        location: 'Seoul-DC-01',
        alerts: 0,
        ip: '192.168.1.140',
        os: 'Ubuntu 22.04 LTS',
        type: 'loadbalancer',
        role: 'primary',
        environment: 'production',
        provider: 'GCP-Mock-Fallback',
        specs: { cpu_cores: 2, memory_gb: 4, disk_gb: 100, network_speed: '10Gbps' },
        lastUpdate: timestamp,
        services: [],
        systemInfo: {
          os: 'Ubuntu 22.04 LTS',
          uptime: '173h',
          processes: 32,
          zombieProcesses: 0,
          loadAverage: '0.50, 0.45, 0.40',
          lastUpdate: timestamp
        },
        networkInfo: {
          interface: 'eth0',
          receivedBytes: '53 MB',
          sentBytes: '33 MB',
          receivedErrors: 0,
          sentErrors: 0,
          status: 'healthy'
        }
      }
    ];

    return {
      success: true,
      data: mockServers,
      source: 'fallback',
      fallback: true,
      scenario: {
        current: 'fallback-mode',
        korean: '폴백 모드',
        hour: new Date().getHours()
      },
      pagination: {
        page: 1,
        limit: mockServers.length,
        total: mockServers.length,
        totalPages: 1,
        hasNext: false,
        hasPrev: false
      },
      timestamp: new Date().toISOString(),
      metadata: {
        serverCount: mockServers.length,
        loadMultiplier: 0.3 // 폴백 모드는 낮은 부하로 표시
      }
    };
  }

  /**
   * HTTP 요청 헬퍼 (타임아웃 및 재시도 포함)
   */
  private async makeRequest<T>(url: string, options: {
    method: string;
    headers?: Record<string, string>;
    body?: string;
    timeout?: number;
  }): Promise<T> {
    const { timeout = this.options.timeout } = options;

    for (let attempt = 1; attempt <= this.options.retryAttempts + 1; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
          method: options.method,
          headers: options.headers,
          body: options.body,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return data as T;

      } catch (error) {
        console.error(`❌ 요청 실패 (시도 ${attempt}/${this.options.retryAttempts + 1}):`, error);

        // 마지막 시도가 아니면 재시도
        if (attempt <= this.options.retryAttempts) {
          await this.delay(this.options.retryDelay * attempt); // 지수 백오프
          continue;
        }

        // 모든 재시도 실패
        throw error;
      }
    }

    throw new Error('All retry attempts failed');
  }

  /**
   * 지연 함수
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 빈 응답 생성
   */
  private getEmptyResponse(): GCPVMServerResponse {
    return {
      success: false,
      data: [],
      source: 'fallback',
      fallback: true,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 캐시 상태 확인
   */
  getCacheStats() {
    return {
      size: this.cache.size(),
      enabled: this.options.enableCache
    };
  }

  /**
   * 캐시 초기화
   */
  clearCache(): void {
    this.cache.clear();
    console.log('🗑️ GCP VM 클라이언트 캐시 초기화됨');
  }

  /**
   * 클라이언트 상태 모니터링
   */
  getStatus() {
    const circuitBreakerStats = monitorCircuitBreaker();
    const cacheStats = this.getCacheStats();

    return {
      endpoint: GCP_VM_SERVERS_ENDPOINT_EXTERNAL,
      health: GCP_VM_HEALTH_ENDPOINT_EXTERNAL,
      tokenConfigured: !!VM_API_TOKEN,
      circuitBreaker: circuitBreakerStats,
      cache: cacheStats,
      options: this.options,
      timestamp: new Date().toISOString()
    };
  }
}

// 🌍 전역 GCP VM 클라이언트 인스턴스
export const gcpVmClient = new GCPVMClient({
  timeout: 3000,        // 🚨 무료티어 보호: 3초 빠른 타임아웃
  retryAttempts: 1,     // 🚨 무료티어 보호: 1회만 재시도
  retryDelay: 2000,     // 🚨 무료티어 보호: 2초 재시도 지연
  enableFallback: true, // fallback 유지 (사용자 경험)
  enableCache: true     // 캐시 유지 (무료티어 절약)
});

/**
 * 헬퍼 함수들
 */

/**
 * 서버 데이터 가져오기 (간편 함수)
 */
export async function getServersFromGCPVM(): Promise<GCPVMServerResponse> {
  return gcpVmClient.getServers();
}

/**
 * GCP VM 헬스체크 (간편 함수)
 */
export async function checkGCPVMHealth() {
  return gcpVmClient.checkHealth();
}

/**
 * GCP VM 클라이언트 상태 확인 (간편 함수)
 */
export function getGCPVMClientStatus() {
  return gcpVmClient.getStatus();
}

export default GCPVMClient;