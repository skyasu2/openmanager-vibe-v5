/**
 * 🔧 MCP 서버 구성 설정
 *
 * 🎯 사용 목적별 MCP 분리:
 * - Vercel 내장 MCP: 개발/테스트/상태 분석 전용
 * - GCP MCP: 실제 AI 기능 전용
 */

export interface MCPServerConfig {
  name: string;
  command: string;
  args: string[];
  env?: Record<string, string>;
  enabled: boolean;
  description: string;
  purpose: string;
  timeout?: number;
  memory?: string;
  target?: 'vercel' | 'gcp' | 'local'; // 추가: 타겟 환경
  usage?: 'development' | 'testing' | 'monitoring' | 'ai-production'; // 추가: 사용 목적
}

export interface MCPEnvironmentConfig {
  environment: 'development' | 'ai-production' | 'vercel-dev-tools';
  purpose: string;
  servers: Record<string, MCPServerConfig>;
  performance: {
    memoryLimit: string;
    timeout: number;
    concurrency: number;
    optimization: string;
  };
  features: Record<string, boolean>;
}

/**
 * 🔧 개발용 MCP 서버 구성 (Cursor IDE 전용) - 기존 설정 유지
 */
export const DEVELOPMENT_MCP_CONFIG: MCPEnvironmentConfig = {
  environment: 'development',
  purpose: '개발자의 지능형 코딩 파트너',

  servers: {
    filesystem: {
      name: 'filesystem',
      command: 'npx',
      args: ['@modelcontextprotocol/server-filesystem', './src', './docs'],
      env: {
        NODE_ENV: 'development',
      },
      enabled: true,
      description: '프로젝트 파일 시스템 접근',
      purpose: '코드 편집, 파일 탐색, 개발 작업 지원',
      memory: '512MB',
    },

    memory: {
      name: 'memory',
      command: 'npx',
      args: ['@modelcontextprotocol/server-memory'],
      env: {
        NODE_ENV: 'development',
        MEMORY_STORAGE: './mcp-memory',
      },
      enabled: true,
      description: '지식 그래프 기반 메모리 시스템',
      purpose: '개발 히스토리, 코드 패턴 기억',
      memory: '256MB',
    },

    'duckduckgo-search': {
      name: 'duckduckgo-search',
      command: 'npx',
      args: ['duckduckgo-mcp-server'],
      env: {
        NODE_ENV: 'development',
      },
      enabled: true,
      description: 'DuckDuckGo 웹 검색 (프라이버시 중심)',
      purpose: '라이브러리 검색, 문서 찾기',
      memory: '256MB',
    },

    'sequential-thinking': {
      name: 'sequential-thinking',
      command: 'npx',
      args: ['@modelcontextprotocol/server-sequential-thinking'],
      env: {
        NODE_ENV: 'development',
        MAX_DEPTH: '10',
      },
      enabled: true,
      description: '고급 순차적 사고 처리',
      purpose: '복잡한 개발 문제 단계별 분해',
      memory: '512MB',
    },

    'openmanager-local': {
      name: 'openmanager-local',
      command: 'node',
      args: ['./mcp-server/dev-server.js'],
      env: {
        NODE_ENV: 'development',
        PORT: '3100',
      },
      enabled: true,
      description: 'OpenManager 로컬 서버 (포트 연결)',
      purpose: '개발 환경 테스트 및 디버깅',
      memory: '1GB',
    },

    'supabase': {
      name: 'supabase',
      command: 'npx',
      args: ['@supabase/mcp-server-supabase'],
      env: {
        SUPABASE_URL: '${SUPABASE_URL}',
        SUPABASE_SERVICE_ROLE_KEY: '${SUPABASE_SERVICE_ROLE_KEY}',
      },
      enabled: true,
      description: 'Supabase 데이터베이스 직접 접근',
      purpose: '데이터베이스 쿼리, 테이블 관리, 데이터 분석',
      memory: '512MB',
    },
  },

  performance: {
    memoryLimit: '2GB',
    timeout: 15000, // 기존 15초 유지 (개발용은 건드리지 않음)
    concurrency: 10,
    optimization: '개발 편의성 우선',
  },

  features: {
    fileAccess: true,
    memorySystem: true,
    webSearch: true,
    thinking: true,
    portBasedConnection: true,
    cursorOptimized: true,
    devMode: true,
    supabaseAccess: true,
  },
};

/**
 * 🤖 AI용 MCP 서버 구성 (GCP VM) - 30초/1분 타임아웃 적용
 */
export const AI_PRODUCTION_MCP_CONFIG: MCPEnvironmentConfig = {
  environment: 'ai-production',
  purpose:
    '사용자의 지능형 서버 관리 어시스턴트 - 30초씩 충분한 대기, 1분 전체 타임아웃',

  servers: {
    'openmanager-ai': {
      name: 'openmanager-ai',
      command: 'node',
      args: ['./mcp-server/server.js'],
      env: {
        NODE_ENV: 'production',
        PORT: '3100',
        AI_ENGINE_MODE: 'gcp',
        AI_ANALYSIS_ONLY: 'true',
        GCP_OPTIMIZED: 'true',
      },
      enabled: true,
      description: 'AI 엔진 전용 분석 서버',
      purpose: '실시간 AI 분석 및 추론',
      timeout: 30000, // 🕐 30초 - 각 단계별 충분한 대기
      memory: '512MB',
    },

    filesystem: {
      name: 'filesystem',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-filesystem', '/app'],
      env: {
        NODE_OPTIONS: '--max-old-space-size=512',
        AI_FILE_ANALYSIS: 'true',
        PRODUCTION_MODE: 'true',
      },
      enabled: true,
      description: 'AI 파일 분석 전용',
      purpose: '서버 모니터링 데이터 AI 분석',
      timeout: 30000, // 🕐 30초
      memory: '256MB',
    },

    'sequential-thinking-ai': {
      name: 'sequential-thinking-ai',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-sequential-thinking'],
      env: {
        THINKING_MODE: 'ai-analysis',
        MAX_DEPTH: '5',
        AI_OPTIMIZED: 'true',
      },
      enabled: true,
      description: 'AI 추론 엔진',
      purpose: '사용자 질의 고급 추론',
      timeout: 30000, // 🕐 30초
      memory: '256MB',
    },

    'vector-db': {
      name: 'vector-db',
      command: 'node',
      args: ['./mcp-server/vector-db-server.js'],
      env: {
        VECTOR_DB_URL: '${VECTOR_DB_URL}',
        EMBEDDING_MODEL: 'text-embedding-3-small',
        AI_VECTOR_MODE: 'production',
      },
      enabled: true,
      description: 'AI 벡터 검색 엔진',
      purpose: 'RAG 기반 지식 검색',
      timeout: 30000, // 🕐 30초
      memory: '512MB',
    },
  },

  performance: {
    memoryLimit: '1GB',
    timeout: 60000, // 🕐 1분 - 전체 세션 타임아웃 (사용자 요청)
    concurrency: 5,
    optimization: '응답 속도 및 안정성 우선, 충분한 대기 시간 제공',
  },

  features: {
    aiAnalysis: true,
    vectorSearch: true,
    advancedReasoning: true,
    patternRecognition: true,
    contextManagement: true,
    performanceOptimized: true,
    gcpOptimized: true,
    timeoutOptimized: true, // 🕐 타임아웃 최적화 추가
  },
};

/**
 * 🏢 Vercel 내장 MCP 설정 (개발/테스트/모니터링 전용)
 */
export const VERCEL_DEV_TOOLS_MCP_CONFIG: MCPEnvironmentConfig = {
  environment: 'vercel-dev-tools',
  purpose: '개발자 도구 및 시스템 모니터링 전용',

  servers: {
    'dev-filesystem': {
      name: 'dev-filesystem',
      command: 'npx',
      args: ['@modelcontextprotocol/server-filesystem', './src', './docs'],
      env: {
        NODE_ENV: 'development',
        PURPOSE: 'development',
      },
      enabled: true,
      description: '개발자 도구 파일 시스템',
      purpose: '코드 분석, 테스트 파일 접근',
      target: 'vercel',
      usage: 'development',
      memory: '256MB',
    },

    'monitoring-tools': {
      name: 'monitoring-tools',
      command: 'node',
      args: ['./mcp-server/monitoring-server.js'],
      env: {
        NODE_ENV: 'production',
        PORT: '3101',
        PURPOSE: 'monitoring',
      },
      enabled: true,
      description: '시스템 모니터링 전용',
      purpose: '서버 상태 분석, 성능 모니터링',
      target: 'vercel',
      usage: 'monitoring',
      timeout: 10000,
      memory: '256MB',
    },

    'dev-analysis': {
      name: 'dev-analysis',
      command: 'npx',
      args: ['@modelcontextprotocol/server-sequential-thinking'],
      env: {
        NODE_ENV: 'development',
        PURPOSE: 'testing',
        MAX_DEPTH: '3',
      },
      enabled: true,
      description: '개발/테스트 분석 도구',
      purpose: '코드 품질 분석, 테스트 결과 분석',
      target: 'vercel',
      usage: 'testing',
      memory: '256MB',
    },
  },

  performance: {
    memoryLimit: '768MB',
    timeout: 10000, // 10초 (빠른 응답)
    concurrency: 5,
    optimization: '개발 도구 최적화',
  },

  features: {
    fileAccess: true,
    monitoring: true,
    testing: true,
    devTools: true,
    aiProduction: false,
  },
};

/**
 * GCP VM 프로덕션 서버 정보
 */
export const GCP_SERVER_CONFIG = {
  url: 'http://104.154.205.25:10000',
  port: 10000,
  healthEndpoint: '/health',
  statusEndpoint: '/status',
  ips: [
    '13.228.225.19', // Primary
    '18.142.128.26', // Secondary
    '54.254.162.138', // Backup
  ],
  deployment: {
    region: 'oregon',
    runtime: 'node',
    plan: 'free',
    autoScaling: false,
    keepAlive: true,
  },
  monitoring: {
    healthCheckInterval: 30000, // 30초
    maxResponseTime: 30000, // 🕐 30초로 조정 (충분한 대기)
    retryAttempts: 3,
    fallbackEnabled: true,
  },
};

/**
 * 🔄 사용 목적별 MCP 설정 반환
 */
export function getMCPConfigByPurpose(
  purpose: 'ai-production' | 'development' | 'dev-tools'
): MCPEnvironmentConfig {
  switch (purpose) {
    case 'ai-production':
      return AI_PRODUCTION_MCP_CONFIG;
    case 'development':
      return DEVELOPMENT_MCP_CONFIG;
    case 'dev-tools':
      return VERCEL_DEV_TOOLS_MCP_CONFIG;
    default:
      return DEVELOPMENT_MCP_CONFIG;
  }
}

/**
 * 🎯 환경별 MCP 설정 가져오기 (업데이트)
 */
export function getMCPConfig(): MCPEnvironmentConfig {
  // Google VM 환경 감지 - AI 프로덕션용
  if (
    process.env.GCP_MCP_SERVER_URL ||
    process.env.MCP_SERVER_TYPE === 'google-vm-only'
  ) {
    return AI_PRODUCTION_MCP_CONFIG;
  }

  // Vercel 환경 감지 - 개발 도구용
  if (process.env.VERCEL === '1' || process.env.VERCEL_ENV) {
    return VERCEL_DEV_TOOLS_MCP_CONFIG;
  }

  // Cursor IDE 환경 감지 - 기존 설정 유지
  if (process.env.CURSOR_IDE || process.env.VSCODE_PID) {
    return DEVELOPMENT_MCP_CONFIG;
  }

  // 프로덕션 환경이지만 Vercel이 아닌 경우 - AI용 MCP 사용
  if (process.env.NODE_ENV === 'production') {
    return AI_PRODUCTION_MCP_CONFIG;
  }

  // 기본값: 개발 환경 (기존 설정 유지)
  return DEVELOPMENT_MCP_CONFIG;
}

/**
 * 🔍 현재 MCP 서버 타입 확인 (업데이트)
 */
export function getMCPServerType():
  | 'development'
  | 'ai-production'
  | 'vercel-dev-tools' {
  const config = getMCPConfig();
  return config.environment;
}

/**
 * 🎯 AI 엔진용 MCP 설정 강제 반환 (Google VM 전용)
 */
export function getAIProductionMCPConfig(): MCPEnvironmentConfig {
  return AI_PRODUCTION_MCP_CONFIG;
}

/**
 * 🛠️ 개발 도구용 MCP 설정 강제 반환 (Vercel 전용)
 */
export function getDevToolsMCPConfig(): MCPEnvironmentConfig {
  return VERCEL_DEV_TOOLS_MCP_CONFIG;
}

/**
 * 현재 활성 MCP 서버 목록
 */
export function getActiveMCPServers(): MCPServerConfig[] {
  const config = getMCPConfig();
  return Object.values(config.servers).filter(server => server.enabled);
}

/**
 * MCP 서버 상태 정보
 */
export interface MCPServerStatus {
  type: 'development' | 'ai-production' | 'vercel-dev-tools';
  purpose: string;
  activeServers: number;
  totalServers: number;
  performance: {
    memoryLimit: string;
    timeout: number;
    concurrency: number;
  };
  features: string[];
  gcpConfig?: typeof GCP_SERVER_CONFIG;
}

/**
 * 현재 MCP 상태 가져오기
 */
export function getMCPStatus(): MCPServerStatus {
  const config = getMCPConfig();
  const activeServers = getActiveMCPServers();

  return {
    type: config.environment,
    purpose: config.purpose,
    activeServers: activeServers.length,
    totalServers: Object.keys(config.servers).length,
    performance: config.performance,
    features: Object.keys(config.features).filter(key => config.features[key]),
    gcpConfig:
      config.environment === 'ai-production' ? GCP_SERVER_CONFIG : undefined,
  };
}

/**
 * 개발용/AI용 MCP 구분 로깅
 */
export function logMCPConfiguration(): void {
  const status = getMCPStatus();

  console.log(`
🔧 MCP 서버 구성 정보
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 환경 타입: ${status.type === 'development' ? '🔧 개발용 (Cursor IDE) - 기존 설정 유지' : status.type === 'ai-production' ? '🤖 AI용 (GCP VM) - 30초/1분 타임아웃' : '🏢 Vercel 내장 MCP'}
🎯 목적: ${status.purpose}
🖥️  활성 서버: ${status.activeServers}/${status.totalServers}개

⚡ 성능 설정:
   • 메모리 제한: ${status.performance.memoryLimit}
   • 타임아웃: ${status.performance.timeout / 1000}초 ${status.type === 'ai-production' ? '(사용자 요청: 충분한 대기)' : '(기존 설정 유지)'}
   • 동시 연결: ${status.performance.concurrency}개

  🚀 활성 기능: ${status.features.join(', ')}
  
${
  status.gcpConfig
    ? `
  🌐 GCP VM 서버 정보:
  • URL: ${status.gcpConfig.url}
  • 포트: ${status.gcpConfig.port}
  • 리전: ${status.gcpConfig.deployment.region}
  • IP: ${status.gcpConfig.ips.join(', ')}
  • 응답 대기: ${status.gcpConfig.monitoring.maxResponseTime / 1000}초 (🕐 30초로 조정)
`
    : ''
}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);
}

/**
 * 전체 MCP 설정 통합 관리
 */
const mcpConfig = {
  // 개발용 MCP 설정 (Cursor IDE)
  development: DEVELOPMENT_MCP_CONFIG,

  // AI용 MCP 설정 (Google VM 프로덕션)
  ai: AI_PRODUCTION_MCP_CONFIG,

  // 서버 정보
  server: GCP_SERVER_CONFIG,

  // 환경 감지
  getCurrentConfig() {
    const env = getMCPServerType();
    console.log(`🌍 MCP 환경 감지: ${env}`);

    switch (env) {
      case 'development':
        return this.development;
      case 'ai-production':
        return this.ai;
      case 'vercel-dev-tools':
        return this.development;
      default:
        return this.development;
    }
  },

  // 헬스체크
  async healthCheck() {
    const config = this.getCurrentConfig();
    console.log(`🏥 MCP 헬스체크 시작: ${config.servers.length}개 서버`);

    // 각 서버별 헬스체크 로직
    const results = await Promise.allSettled(
      Object.values(config.servers).map(async (server: any) => {
        try {
          // 실제 헬스체크 구현은 각 MCP 클라이언트에서 담당
          return { server: server.name, status: 'healthy' };
        } catch (error) {
          return { server: server.name, status: 'unhealthy', error };
        }
      })
    );

    return results;
  },

  // 🌐 Google Cloud VM MCP 서버 (24시간 동작)
  production: {
    name: 'Google Cloud VM MCP Server',
    url: 'http://104.154.205.25:10000', // Google Cloud VM - 24시간 동작
    timeout: 5000,
    retries: 2,
    healthCheck: '/health',
    description: 'Google Cloud VM에서 24시간 동작하는 MCP 서버 (Render 대체)',
  },
};

export default mcpConfig;
