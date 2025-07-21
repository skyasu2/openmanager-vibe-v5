/**
 * 🌍 MCP 환경 어댑터
 *
 * 환경별 MCP 구성을 관리하고 적절한 구현체를 반환합니다.
 * - 로컬 개발: Claude Code MCP (stdio 통신)
 * - Vercel: 비활성화 (GCP Cloud Functions 사용)
 * - GCP VM: Cloud Context API 사용
 */

import { detectEnvironment } from '@/config/environment';

export interface MCPEnvironmentAdapter {
  type: 'local' | 'vercel' | 'gcp-vm' | 'disabled';
  enabled: boolean;
  endpoint?: string;
  config: MCPEnvironmentConfig;
}

export interface MCPEnvironmentConfig {
  // 공통 설정
  timeout: number;
  maxRetries: number;

  // 로컬 MCP 설정 (Claude Code)
  localMCP?: {
    enabled: boolean;
    serversPath: string;
    communicationType: 'stdio' | 'http';
  };

  // GCP VM MCP 설정
  gcpMCP?: {
    enabled: boolean;
    contextAPIEndpoint: string;
    authToken?: string;
  };

  // Vercel 설정 (MCP 비활성화)
  vercelConfig?: {
    fallbackToGCPFunctions: boolean;
    gcpFunctionsEndpoint?: string;
  };
}

/**
 * 현재 환경에 따른 MCP 어댑터 반환
 */
export function getMCPAdapter(): MCPEnvironmentAdapter {
  const env = detectEnvironment();

  // 🚫 Vercel 환경: MCP 완전 비활성화
  if (env.IS_VERCEL) {
    console.log('🚫 Vercel 환경: MCP 비활성화 (GCP Functions 사용)');
    return {
      type: 'vercel',
      enabled: false,
      config: {
        timeout: 25000,
        maxRetries: 2,
        vercelConfig: {
          fallbackToGCPFunctions: true,
          gcpFunctionsEndpoint: process.env.GCP_FUNCTIONS_ENDPOINT,
        },
      },
    };
  }

  // 🏠 로컬 개발 환경: Claude Code MCP 활성화
  if (env.IS_LOCAL && env.IS_DEVELOPMENT) {
    console.log('🏠 로컬 환경: Claude Code MCP 활성화');
    return {
      type: 'local',
      enabled: true,
      config: {
        timeout: 60000,
        maxRetries: 3,
        localMCP: {
          enabled: true,
          serversPath: './.mcp.json',
          communicationType: 'stdio',
        },
      },
    };
  }

  // ☁️ GCP VM 환경: Cloud Context API 사용
  if (process.env.GCP_VM_INSTANCE === 'true') {
    console.log('☁️ GCP VM 환경: Cloud Context API 활성화');
    return {
      type: 'gcp-vm',
      enabled: true,
      endpoint: process.env.GCP_CONTEXT_API_ENDPOINT || 'http://localhost:8080',
      config: {
        timeout: 30000,
        maxRetries: 3,
        gcpMCP: {
          enabled: true,
          contextAPIEndpoint:
            process.env.GCP_CONTEXT_API_ENDPOINT || 'http://localhost:8080',
          authToken: process.env.GCP_CONTEXT_AUTH_TOKEN,
        },
      },
    };
  }

  // 🔒 기타 환경: MCP 비활성화
  console.log('🔒 알 수 없는 환경: MCP 비활성화');
  return {
    type: 'disabled',
    enabled: false,
    config: {
      timeout: 30000,
      maxRetries: 2,
    },
  };
}

/**
 * MCP 활성화 여부 확인
 */
export function isMCPEnabled(): boolean {
  const adapter = getMCPAdapter();
  return adapter.enabled;
}

/**
 * 환경별 MCP 엔드포인트 반환
 */
export function getMCPEndpoint(): string | null {
  const adapter = getMCPAdapter();

  switch (adapter.type) {
    case 'local':
      return 'stdio://localhost'; // Claude Code MCP
    case 'gcp-vm':
      return adapter.endpoint || null;
    case 'vercel':
    case 'disabled':
    default:
      return null;
  }
}

/**
 * 환경별 폴백 전략
 */
export function getMCPFallbackStrategy():
  | 'gcp-functions'
  | 'local-cache'
  | 'none' {
  const adapter = getMCPAdapter();

  switch (adapter.type) {
    case 'vercel':
      return 'gcp-functions';
    case 'local':
      return 'local-cache';
    case 'gcp-vm':
    case 'disabled':
    default:
      return 'none';
  }
}

/**
 * MCP 사용 통계 (환경별)
 */
export interface MCPUsageStats {
  environment: string;
  enabled: boolean;
  totalCalls: number;
  successCalls: number;
  failedCalls: number;
  fallbackCalls: number;
  averageResponseTime: number;
}

// 사용 통계 추적
const usageStats: MCPUsageStats = {
  environment: getMCPAdapter().type,
  enabled: isMCPEnabled(),
  totalCalls: 0,
  successCalls: 0,
  failedCalls: 0,
  fallbackCalls: 0,
  averageResponseTime: 0,
};

/**
 * MCP 호출 통계 업데이트
 */
export function updateMCPStats(
  success: boolean,
  responseTime: number,
  usedFallback: boolean = false
) {
  usageStats.totalCalls++;

  if (success) {
    usageStats.successCalls++;
  } else {
    usageStats.failedCalls++;
  }

  if (usedFallback) {
    usageStats.fallbackCalls++;
  }

  // 평균 응답 시간 계산
  const prevTotal = usageStats.totalCalls - 1;
  usageStats.averageResponseTime =
    (usageStats.averageResponseTime * prevTotal + responseTime) /
    usageStats.totalCalls;
}

/**
 * MCP 사용 통계 반환
 */
export function getMCPUsageStats(): MCPUsageStats {
  return { ...usageStats };
}

/**
 * 환경별 MCP 설정 검증
 */
export function validateMCPConfiguration(): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const adapter = getMCPAdapter();
  const errors: string[] = [];
  const warnings: string[] = [];

  // Vercel 환경 검증
  if (adapter.type === 'vercel' && adapter.enabled) {
    errors.push('Vercel 환경에서 MCP가 활성화되어 있음');
  }

  // 로컬 환경 검증
  if (adapter.type === 'local' && adapter.enabled) {
    if (!adapter.config.localMCP?.serversPath) {
      errors.push('로컬 MCP 서버 경로가 설정되지 않음');
    }
  }

  // GCP VM 환경 검증
  if (adapter.type === 'gcp-vm' && adapter.enabled) {
    if (!adapter.endpoint) {
      errors.push('GCP Context API 엔드포인트가 설정되지 않음');
    }
    if (!adapter.config.gcpMCP?.authToken) {
      warnings.push('GCP Context API 인증 토큰이 설정되지 않음');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
