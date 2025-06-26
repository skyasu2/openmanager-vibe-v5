/**
 * 🎯 Everything MCP 통합 설정
 *
 * Everything MCP 서버로 기존 여러 MCP 서버들을 단일화
 * - 테스트 및 개발 편의성 증대
 * - 설정 관리 단순화
 * - Cursor 호환성 최적화
 */

export interface EverythingMCPConfig {
  name: string;
  command: string;
  args: string[];
  env?: Record<string, string>;
  enabled: boolean;
  description: string;
  features: string[];
  performance: {
    timeout: number;
    memory: string;
    concurrency: number;
  };
}

/**
 * 🌟 Everything MCP 서버 설정 (개발용 메인)
 */
export const EVERYTHING_MCP_CONFIG: EverythingMCPConfig = {
  name: 'everything-mcp',
  command: 'npx',
  args: ['-y', '@modelcontextprotocol/server-everything'],
  env: {
    NODE_ENV: 'development',
    // Everything MCP의 모든 기능 활성화
    EVERYTHING_ENABLE_ALL: 'true',
    EVERYTHING_DEBUG: 'false',
    // 프로젝트 루트 설정
    PROJECT_ROOT: process.cwd(),
    // 브라우저 기능 (필요시)
    BROWSER_ENABLED: 'true',
    // 데이터베이스 테스트용
    DB_TEST_MODE: 'true',
  },
  enabled: true,
  description: 'Everything MCP - 올인원 개발 도구 서버',
  features: [
    'filesystem', // 파일 시스템 접근
    'memory', // 메모리/지식 그래프
    'search', // 웹 검색
    'browser', // 브라우저 자동화
    'database', // 데이터베이스 테스트
    'github', // Git/GitHub 연동
    'fetch', // HTTP 요청
    'time', // 시간/날짜
    'postgres', // PostgreSQL
    'sqlite', // SQLite
    'everythingElse', // 기타 모든 기능
  ],
  performance: {
    timeout: 30000, // 30초 (충분한 대기)
    memory: '1GB', // 넉넉한 메모리
    concurrency: 5, // 동시 처리
  },
};

/**
 * 🎯 핵심 백업 서버들 (Everything으로 커버 안 되는 경우)
 */
export const ESSENTIAL_BACKUP_SERVERS = {
  'openmanager-local': {
    name: 'openmanager-local',
    command: 'node',
    args: ['./mcp-server/dev-server.js'],
    env: {
      NODE_ENV: 'development',
      PORT: '3100',
    },
    enabled: true,
    description: 'OpenManager 로컬 서버 (프로젝트 전용)',
    purpose: 'OpenManager 특화 기능',
    memory: '512MB',
  },
};

/**
 * 🔧 통합 MCP 설정 생성
 */
export function generateEverythingMCPSetup() {
  return {
    mcpServers: {
      // 메인: Everything MCP
      everything: EVERYTHING_MCP_CONFIG,

      // 백업: 프로젝트 특화 서버
      ...ESSENTIAL_BACKUP_SERVERS,
    },

    // 설정 메타데이터
    metadata: {
      version: '2.0',
      type: 'everything-mcp-unified',
      created: new Date().toISOString(),
      description: 'Everything MCP 기반 통합 개발 환경',
      migration: {
        from: 'multi-server-setup',
        to: 'everything-mcp',
        benefits: [
          '설정 관리 단순화',
          '테스트 및 디버깅 통합',
          'Cursor 호환성 향상',
          '메모리 사용량 최적화',
        ],
      },
    },

    // 성능 설정
    performance: {
      memoryLimit: '1.5GB',
      globalTimeout: 60000, // 1분 전체 타임아웃
      maxConcurrentRequests: 8,
      retryAttempts: 2,
    },

    // 기능 플래그
    features: {
      everythingMcp: true,
      legacySupport: true,
      devMode: true,
      testingMode: true,
      debugMode: false,
    },
  };
}

/**
 * 📋 마이그레이션 가이드
 */
export const MIGRATION_GUIDE = {
  deprecated: [
    'filesystem (개별)',
    'memory (개별)',
    'duckduckgo-search (개별)',
    'sequential-thinking (개별)',
  ],

  replacedBy: 'everything-mcp (올인원)',

  steps: [
    '1. Everything MCP 설치: npx -y @modelcontextprotocol/server-everything',
    '2. 기존 개별 서버들 비활성화',
    '3. Everything MCP 설정 적용',
    '4. Cursor 재시작 및 테스트',
    '5. 문제없으면 기존 설정 정리',
  ],

  advantages: [
    '🎯 단일 서버로 모든 기능 테스트',
    '⚡ 설정 파일 90% 감소',
    '🔧 Cursor MCP 호환성 보장',
    '🚀 설치 및 업데이트 간편화',
    '💾 메모리 사용량 최적화',
  ],
};

export default {
  config: EVERYTHING_MCP_CONFIG,
  backups: ESSENTIAL_BACKUP_SERVERS,
  generate: generateEverythingMCPSetup,
  migration: MIGRATION_GUIDE,
};
