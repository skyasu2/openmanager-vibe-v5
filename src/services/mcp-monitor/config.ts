/**
 * MCP 서버 모니터링 시스템 설정
 * 10개 MCP 서버의 상태 추적 및 성능 임계값 관리
 */

export interface MCPServerConfig {
  name: string;
  type: 'core' | 'utility' | 'analysis';
  command: string;
  package: string;
  runtime: 'node' | 'python';
  priority: 'critical' | 'high' | 'medium' | 'low';
  healthCheck: {
    endpoint?: string;
    timeout: number;
    retries: number;
    interval: number;
  };
  thresholds: {
    responseTime: number; // ms
    errorRate: number; // %
    maxRetries: number;
  };
  dependencies?: string[];
}

export interface MCPMonitoringConfig {
  global: {
    healthCheckInterval: number; // 15초
    metricsCollectionInterval: number; // 30초
    performanceBudget: number; // 150ms
    circuitBreakerConfig: {
      failureThreshold: number;
      resetTimeout: number;
      halfOpenMaxCalls: number;
    };
  };
  alerting: {
    enabled: boolean;
    channels: ('console' | 'redis' | 'webhook')[];
    thresholds: {
      serverDown: number; // 연속 실패 횟수
      highLatency: number; // ms
      errorRate: number; // %
    };
  };
  retention: {
    metricsRetentionDays: number;
    logsRetentionDays: number;
  };
}

/**
 * 10개 MCP 서버 설정 (2025.7.31 기준)
 */
export const MCP_SERVERS: Record<string, MCPServerConfig> = {
  filesystem: {
    name: 'filesystem',
    type: 'core',
    command: 'npx -y @modelcontextprotocol/server-filesystem@latest',
    package: '@modelcontextprotocol/server-filesystem',
    runtime: 'node',
    priority: 'critical',
    healthCheck: {
      timeout: 5000,
      retries: 3,
      interval: 15000,
    },
    thresholds: {
      responseTime: 100,
      errorRate: 2,
      maxRetries: 3,
    },
  },
  memory: {
    name: 'memory',
    type: 'core',
    command: 'npx -y @modelcontextprotocol/server-memory@latest',
    package: '@modelcontextprotocol/server-memory',
    runtime: 'node',
    priority: 'critical',
    healthCheck: {
      timeout: 5000,
      retries: 3,
      interval: 15000,
    },
    thresholds: {
      responseTime: 150,
      errorRate: 2,
      maxRetries: 3,
    },
  },
  github: {
    name: 'github',
    type: 'core',
    command: 'npx -y @modelcontextprotocol/server-github@latest',
    package: '@modelcontextprotocol/server-github',
    runtime: 'node',
    priority: 'high',
    healthCheck: {
      timeout: 8000,
      retries: 2,
      interval: 15000,
    },
    thresholds: {
      responseTime: 200,
      errorRate: 5,
      maxRetries: 2,
    },
    dependencies: ['GITHUB_PERSONAL_ACCESS_TOKEN'],
  },
  supabase: {
    name: 'supabase',
    type: 'core',
    command: 'npx -y @supabase/mcp-server-supabase@latest',
    package: '@supabase/mcp-server-supabase',
    runtime: 'node',
    priority: 'critical',
    healthCheck: {
      timeout: 10000,
      retries: 3,
      interval: 15000,
    },
    thresholds: {
      responseTime: 300,
      errorRate: 3,
      maxRetries: 3,
    },
    dependencies: ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'],
  },
  'tavily-mcp': {
    name: 'tavily-mcp',
    type: 'utility',
    command: 'npx -y tavily-mcp@0.2.9',
    package: 'tavily-mcp',
    runtime: 'node',
    priority: 'medium',
    healthCheck: {
      timeout: 8000,
      retries: 2,
      interval: 15000,
    },
    thresholds: {
      responseTime: 500,
      errorRate: 5,
      maxRetries: 2,
    },
    dependencies: ['TAVILY_API_KEY'],
  },
  'sequential-thinking': {
    name: 'sequential-thinking',
    type: 'analysis',
    command: 'npx -y @modelcontextprotocol/server-sequential-thinking@latest',
    package: '@modelcontextprotocol/server-sequential-thinking',
    runtime: 'node',
    priority: 'medium',
    healthCheck: {
      timeout: 6000,
      retries: 2,
      interval: 15000,
    },
    thresholds: {
      responseTime: 400,
      errorRate: 5,
      maxRetries: 2,
    },
  },
  playwright: {
    name: 'playwright',
    type: 'utility',
    command: 'npx -y @playwright/mcp@latest',
    package: '@playwright/mcp',
    runtime: 'node',
    priority: 'medium',
    healthCheck: {
      timeout: 10000,
      retries: 2,
      interval: 15000,
    },
    thresholds: {
      responseTime: 800,
      errorRate: 10,
      maxRetries: 2,
    },
  },
  context7: {
    name: 'context7',
    type: 'utility',
    command: 'npx -y @upstash/context7-mcp@latest',
    package: '@upstash/context7-mcp',
    runtime: 'node',
    priority: 'medium',
    healthCheck: {
      timeout: 8000,
      retries: 2,
      interval: 15000,
    },
    thresholds: {
      responseTime: 300,
      errorRate: 5,
      maxRetries: 2,
    },
    dependencies: ['UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN'],
  },
  time: {
    name: 'time',
    type: 'utility',
    command: 'uvx mcp-server-time',
    package: 'mcp-server-time',
    runtime: 'python',
    priority: 'low',
    healthCheck: {
      timeout: 5000,
      retries: 2,
      interval: 15000,
    },
    thresholds: {
      responseTime: 200,
      errorRate: 5,
      maxRetries: 2,
    },
  },
  serena: {
    name: 'serena',
    type: 'analysis',
    command:
      'uvx --from git+https://github.com/oraios/serena serena-mcp-server',
    package: 'git+https://github.com/oraios/serena',
    runtime: 'python',
    priority: 'high',
    healthCheck: {
      timeout: 12000,
      retries: 3,
      interval: 15000,
    },
    thresholds: {
      responseTime: 600,
      errorRate: 8,
      maxRetries: 3,
    },
  },
};

/**
 * 글로벌 모니터링 설정
 */
export const MONITORING_CONFIG: MCPMonitoringConfig = {
  global: {
    healthCheckInterval: 15000, // 15초
    metricsCollectionInterval: 30000, // 30초
    performanceBudget: 150, // 150ms 목표
    circuitBreakerConfig: {
      failureThreshold: 5, // 5회 연속 실패 시 차단
      resetTimeout: 60000, // 1분 후 재시도
      halfOpenMaxCalls: 3, // Half-Open 상태에서 최대 3회 호출
    },
  },
  alerting: {
    enabled: true,
    channels: ['console', 'redis'],
    thresholds: {
      serverDown: 3, // 3회 연속 실패 시 알림
      highLatency: 500, // 500ms 초과 시 알림
      errorRate: 10, // 10% 초과 시 알림
    },
  },
  retention: {
    metricsRetentionDays: 7, // 7일
    logsRetentionDays: 3, // 3일
  },
};

/**
 * 서버 우선순위별 그룹화
 */
export const SERVER_GROUPS = {
  critical: ['filesystem', 'memory', 'supabase'],
  high: ['github', 'serena'],
  medium: ['tavily-mcp', 'sequential-thinking', 'playwright', 'context7'],
  low: ['time'],
} as const;

/**
 * 환경변수 의존성 매핑
 */
export const ENV_DEPENDENCIES = {
  github: ['GITHUB_PERSONAL_ACCESS_TOKEN'],
  supabase: ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_ANON_KEY'],
  'tavily-mcp': ['TAVILY_API_KEY'],
  context7: ['UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN'],
} as const;

/**
 * MCP 서버 타입 정의
 */
export type MCPServerName = keyof typeof MCP_SERVERS;
export type ServerPriority = keyof typeof SERVER_GROUPS;
export type ServerStatus = 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
export type CircuitBreakerState = 'closed' | 'open' | 'half-open';
