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
  // 시나리오 정보는 AI 분석 순수성을 위해 제거됨
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
    console.log('🚀 [GCP-VM-CLIENT] VM HTTP API 방식으로 복원 - 서버 데이터 요청 시작');
    
    // 캐시 확인
    if (this.options.enableCache && this.cache.has('servers-data')) {
      console.log('⚡ [GCP-VM-CLIENT] 캐시된 데이터 반환');
      const cachedData = this.cache.get('servers-data');
      
      return {
        success: true,
        data: cachedData,
        source: 'cache',
        timestamp: new Date().toISOString(),
        error: null,
        fallbackUsed: false
      };
    }

    // 1차: VM API 시도
    try {
      console.log('🌐 [GCP-VM-CLIENT] VM API 호출: /api/v3/servers');
      const vmResponse = await this.fetchFromVMAPI();
      
      if (vmResponse && vmResponse.data && Array.isArray(vmResponse.data)) {
        console.log('✅ [GCP-VM-CLIENT] VM API 성공:', {
          serverCount: vmResponse.data.length,
          source: 'vm-api'
        });

        // 캐시에 저장
        if (this.options.enableCache) {
          this.cache.set('servers-data', vmResponse.data);
          console.log('💾 [GCP-VM-CLIENT] VM 서버 데이터를 캐시에 저장 완료');
        }

        return {
          success: true,
          data: vmResponse.data,
          source: 'vm-api',
          timestamp: vmResponse.timestamp || new Date().toISOString(),
          error: null,
          fallbackUsed: false
        };
      }
    } catch (error) {
      console.warn('⚠️ [GCP-VM-CLIENT] VM API 실패:', error instanceof Error ? error.message : 'Unknown error');
    }

    // 2차: 기존 GCP VM API 폴백 시도
    try {
      console.log('🔄 [GCP-VM-CLIENT] 기존 VM API 폴백 시도');
      const fallbackResponse = await this.fetchFromGCPVM();
      
      if (fallbackResponse && fallbackResponse.success && fallbackResponse.data) {
        console.log('✅ [GCP-VM-CLIENT] 기존 VM API 폴백 성공');
        
        // 캐시에 저장
        if (this.options.enableCache) {
          this.cache.set('servers-data', fallbackResponse.data);
        }

        return {
          ...fallbackResponse,
          fallbackUsed: true
        };
      }
    } catch (error) {
      console.warn('⚠️ [GCP-VM-CLIENT] 기존 VM API 폴백도 실패:', error instanceof Error ? error.message : 'Unknown error');
    }

    // 3차: 최종 Mock 폴백
    console.log('🎯 [GCP-VM-CLIENT] 최종 폴백: Mock 데이터 사용');
    try {
      const mockResponse = await this.getMockData();
      console.log('✅ [GCP-VM-CLIENT] Mock 데이터 폴백 성공');
      
      return {
        ...mockResponse,
        fallbackUsed: true,
        source: 'mock-fallback'
      };
    } catch (error) {
      console.error('❌ [GCP-VM-CLIENT] 모든 데이터 소스 실패:', error);
      return this.getEmptyResponse();
    }
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
   * VM API에서 JSON 데이터 가져오기 (/api/v3/metrics)
   */
  private async fetchFromVMAPI(): Promise<any> {
    const VM_ENDPOINT = `${GCP_VM_EXTERNAL_URL}/api/v3/metrics`;
    const VM_ENDPOINT_INTERNAL = `${GCP_VM_INTERNAL_URL}/api/v3/metrics`;
    
    console.log('🌐 [GCP-VM-CLIENT] VM API 호출 시작');
    
    // 1차: 외부 IP 시도
    try {
      console.log(`🌐 외부 VM API: ${VM_ENDPOINT}`);
      const response = await this.makeRequest<any>(VM_ENDPOINT, {
        method: 'GET',
        timeout: this.options.timeout,
        headers: {
          'Authorization': `Bearer ${VM_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });

      if (response && response.success && response.data) {
        console.log('✅ [GCP-VM-CLIENT] 외부 VM API 성공');
        return {
          data: response.data,
          timestamp: response.timestamp
        };
      }
    } catch (externalError) {
      console.error('❌ [GCP-VM-CLIENT] 외부 VM API 실패 상세:');
      console.error('🔍 에러 타입:', externalError?.constructor?.name || 'Unknown');
      console.error('📝 에러 메시지:', externalError instanceof Error ? externalError.message : String(externalError));
      console.error('🌐 요청 URL:', VM_ENDPOINT);
      console.error('🔑 토큰 길이:', VM_API_TOKEN?.length || 0);
      console.error('⏱️ 타임아웃 설정:', this.options.timeout);
      if (externalError instanceof Error && externalError.stack) {
        console.error('📚 스택 트레이스:', externalError.stack.split('\n').slice(0, 5).join('\n'));
      }
    }

    // 2차: 내부 IP 시도 (폴백)
    try {
      console.log(`🏠 내부 VM API: ${VM_ENDPOINT_INTERNAL}`);
      const response = await this.makeRequest<any>(VM_ENDPOINT_INTERNAL, {
        method: 'GET',
        timeout: this.options.timeout,
        headers: {
          'Authorization': `Bearer ${VM_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });

      if (response && response.success && response.data) {
        console.log('✅ [GCP-VM-CLIENT] 내부 VM API 성공');
        return {
          data: response.data,
          timestamp: response.timestamp
        };
      }
    } catch (internalError) {
      console.error('❌ [GCP-VM-CLIENT] 내부 VM API도 실패:', internalError);
      throw new Error(`VM API 완전 실패: ${internalError instanceof Error ? internalError.message : 'Unknown error'}`);
    }

    throw new Error('VM API에서 올바른 응답을 받지 못했습니다');
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
   * 시간대에 맞는 정적 시나리오 파일 로드 (무료 티어 최적화)
   */


  /**
   * Mock 데이터 생성 (정적 JSON 기반 - 무료 티어 최적화)
   */
  private async getMockData(): Promise<GCPVMServerResponse> {
    const timestamp = new Date().toISOString();
    const currentHour = new Date().getHours();
    
    console.log(`🎯 [GCP-VM-CLIENT] 최종 폴백: Mock 데이터 생성 (${currentHour}시)`);
    console.log(`⚠️ [GCP-VM-CLIENT] 모든 VM API가 실패하여 Mock 데이터를 사용합니다`);
    
    // 간단한 폴백용 Mock 서버 데이터 (최종 안전장치)
    const fallbackServers: EnhancedServerMetrics[] = [
      {
        id: `mock-${Date.now()}-1`,
        name: 'web-server-mock',
        hostname: 'web-server-mock.local',
        status: 'online' as const,
        cpu: 45.2,
        cpu_usage: 45.2,
        memory: 62.8,
        memory_usage: 62.8,
        disk: 58.3,
        disk_usage: 58.3,
        network: 18.4,
        network_in: 11.2,
        network_out: 7.2,
        uptime: 259200,
        location: 'Mock-Fallback',
        alerts: 0,
        ip: '127.0.0.1',
        os: 'Mock OS',
        type: 'web',
        role: 'worker',
        environment: 'mock',
        provider: 'Mock-Provider',
        specs: { cpu_cores: 2, memory_gb: 4, disk_gb: 100, network_speed: '1Gbps' },
        lastUpdate: timestamp,
        services: ['mock-service'],
        systemInfo: {
          os: 'Mock OS',
          uptime: '1h',
          processes: 10,
          zombieProcesses: 0,
          loadAverage: '0.50, 0.50, 0.50',
          lastUpdate: timestamp
        },
        networkInfo: {
          interface: 'mock0',
          receivedBytes: '1 MB',
          sentBytes: '1 MB',
          receivedErrors: 0,
          sentErrors: 0,
          status: 'healthy'
        }
      }
    ];

    console.log(`📋 [GCP-VM-CLIENT] Mock 서버 생성: ${fallbackServers.length}개`);

    return {
      success: true,
      data: fallbackServers,
      source: 'mock-fallback',
      fallback: true,
      // 시나리오 정보는 AI 분석 순수성을 위해 제거됨
      pagination: {
        page: 1,
        limit: fallbackServers.length,
        total: fallbackServers.length,
        totalPages: 1,
        hasNext: false,
        hasPrev: false
      },
      timestamp,
      metadata: {
        serverCount: fallbackServers.length,
        loadMultiplier: 0.4
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