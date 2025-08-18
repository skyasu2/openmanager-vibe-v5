# 🔌 인프라 통합 설정 가이드

> **MCP 서버 + 테스트 환경 + Mock 서비스 통합**  
> 최종 업데이트: 2025-08-18  
> 서비스: MCP 12개 서버 + Vitest + Mock 시스템

## 🎯 개요

OpenManager VIBE v5의 MCP (Model Context Protocol) 서버 통합, 테스트 환경 구성, 개발용 Mock 서비스를 완전히 설정하고 관리하는 가이드입니다.

## 📋 목차

1. [MCP 서버 통합 관리](#mcp-서버-통합-관리)
2. [테스트 환경 구성](#테스트-환경-구성)
3. [개발 Mock 서비스](#개발-mock-서비스)
4. [통합 테스트](#통합-테스트)
5. [문제 해결](#문제-해결)

## 🔌 MCP 서버 통합 관리

### 1단계: MCP 서버 설정 파일

```json
// .mcp.json (완전 설정)
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": [
        "@modelcontextprotocol/server-filesystem",
        "/mnt/d/cursor/openmanager-vibe-v5"
      ],
      "env": {},
      "disabled": false
    },
    "memory": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-memory"],
      "env": {},
      "disabled": false
    },
    "github": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_PERSONAL_ACCESS_TOKEN}"
      },
      "disabled": false
    },
    "supabase": {
      "command": "npx",
      "args": ["mcp-server-supabase"],
      "env": {
        "SUPABASE_URL": "${SUPABASE_URL}",
        "SUPABASE_SERVICE_ROLE_KEY": "${SUPABASE_SERVICE_ROLE_KEY}"
      },
      "disabled": false
    },
    "gcp": {
      "command": "npx",
      "args": ["@google-cloud/mcp-server-gcp"],
      "env": {
        "GOOGLE_CLOUD_PROJECT": "openmanager-free-tier",
        "GOOGLE_APPLICATION_CREDENTIALS": "${GCP_SERVICE_ACCOUNT_KEY}"
      },
      "disabled": false
    },
    "tavily": {
      "command": "npx",
      "args": ["tavily-mcp"],
      "env": {
        "TAVILY_API_KEY": "${TAVILY_API_KEY}"
      },
      "disabled": false
    },
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp"],
      "env": {},
      "disabled": false
    },
    "thinking": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-sequential-thinking"],
      "env": {},
      "disabled": false
    },
    "context7": {
      "command": "npx",
      "args": ["@upstash/context7-mcp"],
      "env": {},
      "disabled": false
    },
    "time": {
      "command": "uvx",
      "args": ["mcp-server-time"],
      "env": {},
      "disabled": false
    },
    "shadcn": {
      "command": "npx",
      "args": ["@upstash/shadcn-ui-mcp"],
      "env": {},
      "disabled": false
    },
    "serena": {
      "command": "uvx",
      "args": [
        "--from",
        "git+https://github.com/oraios/serena",
        "serena-mcp-server",
        "--context",
        "ide-assistant",
        "--project",
        "/mnt/d/cursor/openmanager-vibe-v5"
      ],
      "env": {},
      "disabled": false
    }
  }
}
```

### 2단계: MCP 서버 관리 유틸리티

```typescript
// src/lib/mcp/mcp-manager.ts
import { execSync } from 'child_process';

export interface MCPServerStatus {
  name: string;
  status: 'running' | 'stopped' | 'error';
  tools: string[];
  lastCheck: Date;
}

export class MCPManager {
  private static readonly REQUIRED_SERVERS = [
    'filesystem',
    'memory',
    'github',
    'supabase',
    'tavily',
    'thinking',
    'time',
  ];

  // MCP 서버 상태 확인
  static async checkAllServers(): Promise<MCPServerStatus[]> {
    const statuses: MCPServerStatus[] = [];

    try {
      const output = execSync('claude mcp list', { encoding: 'utf8' });
      const servers = this.parseServerList(output);

      for (const server of servers) {
        const status = await this.checkServerStatus(server);
        statuses.push(status);
      }
    } catch (error) {
      console.error('MCP 서버 상태 확인 실패:', error);
    }

    return statuses;
  }

  private static parseServerList(output: string): string[] {
    // claude mcp list 출력 파싱
    const lines = output.split('\n');
    return lines
      .filter((line) => line.trim() && !line.includes('MCP Servers'))
      .map((line) => line.trim().split(' ')[0]);
  }

  private static async checkServerStatus(
    serverName: string
  ): Promise<MCPServerStatus> {
    try {
      // 서버별 도구 목록 확인
      const toolsOutput = execSync(`claude mcp tools ${serverName}`, {
        encoding: 'utf8',
        timeout: 5000,
      });

      const tools = this.parseToolsList(toolsOutput);

      return {
        name: serverName,
        status: tools.length > 0 ? 'running' : 'stopped',
        tools,
        lastCheck: new Date(),
      };
    } catch (error) {
      return {
        name: serverName,
        status: 'error',
        tools: [],
        lastCheck: new Date(),
      };
    }
  }

  private static parseToolsList(output: string): string[] {
    const lines = output.split('\n');
    return lines
      .filter((line) => line.trim() && line.includes('Tool:'))
      .map((line) => line.replace('Tool:', '').trim());
  }

  // 필수 서버 확인
  static async validateRequiredServers(): Promise<boolean> {
    const statuses = await this.checkAllServers();
    const runningServers = statuses
      .filter((s) => s.status === 'running')
      .map((s) => s.name);

    const missingServers = this.REQUIRED_SERVERS.filter(
      (required) => !runningServers.includes(required)
    );

    if (missingServers.length > 0) {
      console.warn('누락된 필수 MCP 서버:', missingServers);
      return false;
    }

    return true;
  }

  // 서버 재시작
  static async restartServer(serverName: string): Promise<boolean> {
    try {
      execSync(`claude api restart`, { encoding: 'utf8' });

      // 재시작 후 확인
      await new Promise((resolve) => setTimeout(resolve, 3000));
      const status = await this.checkServerStatus(serverName);

      return status.status === 'running';
    } catch (error) {
      console.error(`${serverName} 서버 재시작 실패:`, error);
      return false;
    }
  }

  // MCP 헬스체크 리포트
  static async generateHealthReport(): Promise<object> {
    const statuses = await this.checkAllServers();
    const totalServers = statuses.length;
    const runningServers = statuses.filter(
      (s) => s.status === 'running'
    ).length;
    const errorServers = statuses.filter((s) => s.status === 'error').length;

    return {
      timestamp: new Date().toISOString(),
      totalServers,
      runningServers,
      errorServers,
      healthyPercentage: Math.round((runningServers / totalServers) * 100),
      details: statuses,
      requiredServersOk: await this.validateRequiredServers(),
    };
  }
}
```

### 3단계: MCP 환경변수 관리

```typescript
// src/lib/mcp/env-manager.ts
export class MCPEnvManager {
  private static readonly REQUIRED_ENV_VARS = {
    GITHUB_PERSONAL_ACCESS_TOKEN: 'GitHub API 접근',
    SUPABASE_URL: 'Supabase 프로젝트 URL',
    SUPABASE_SERVICE_ROLE_KEY: 'Supabase 서비스 키',
    TAVILY_API_KEY: 'Tavily 검색 API',
    GCP_SERVICE_ACCOUNT_KEY: 'GCP 서비스 계정',
  };

  static validateEnvironment(): { valid: boolean; missing: string[] } {
    const missing: string[] = [];

    Object.keys(this.REQUIRED_ENV_VARS).forEach((envVar) => {
      if (!process.env[envVar]) {
        missing.push(envVar);
      }
    });

    return {
      valid: missing.length === 0,
      missing,
    };
  }

  static getEnvironmentReport(): object {
    const report: Record<string, any> = {};

    Object.entries(this.REQUIRED_ENV_VARS).forEach(([envVar, description]) => {
      const value = process.env[envVar];
      report[envVar] = {
        description,
        present: !!value,
        masked: value ? `${value.substring(0, 8)}...` : 'MISSING',
      };
    });

    return report;
  }

  static generateMCPConfigTemplate(): string {
    const validation = this.validateEnvironment();
    
    if (!validation.valid) {
      throw new Error(
        `환경변수 누락: ${validation.missing.join(', ')}`
      );
    }

    return JSON.stringify({
      mcpServers: {
        // MCP 서버 설정 템플릿
        filesystem: {
          command: 'npx',
          args: ['@modelcontextprotocol/server-filesystem', process.cwd()],
          env: {},
        },
        // 기타 서버들...
      },
    }, null, 2);
  }
}
```

## 🧪 테스트 환경 구성

### 1단계: Vitest 환경변수 관리

```typescript
// src/test/setup.ts
import { vi, beforeEach, afterEach } from 'vitest';

// 테스트 환경변수 기본값
export const TEST_ENV_DEFAULTS = {
  NODE_ENV: 'test',
  NEXT_PUBLIC_SUPABASE_URL: 'https://test-project.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
  SUPABASE_SERVICE_ROLE_KEY: 'test-service-key',
  GITHUB_PERSONAL_ACCESS_TOKEN: 'test-github-token',
  GOOGLE_AI_API_KEY: 'test-google-ai-key',
  TAVILY_API_KEY: 'test-tavily-key',
} as const;

// 테스트 환경 설정 함수
export function setupTestEnvironment() {
  beforeEach(() => {
    // 모든 환경변수를 기본값으로 설정
    Object.entries(TEST_ENV_DEFAULTS).forEach(([key, value]) => {
      vi.stubEnv(key, value);
    });
  });

  afterEach(() => {
    // 테스트 후 정리
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });
}

// 특정 환경변수로 테스트 실행
export function withTestEnv<T>(
  envOverrides: Partial<typeof TEST_ENV_DEFAULTS>,
  testFn: () => T
): T {
  const originalEnv: Record<string, string | undefined> = {};

  // 현재 환경변수 백업
  Object.keys(envOverrides).forEach((key) => {
    originalEnv[key] = process.env[key];
  });

  try {
    // 새 환경변수 설정
    Object.entries(envOverrides).forEach(([key, value]) => {
      vi.stubEnv(key, value);
    });

    return testFn();
  } finally {
    // 원래 값으로 복원
    Object.entries(originalEnv).forEach(([key, value]) => {
      if (value === undefined) {
        vi.unstubEnv(key);
      } else {
        vi.stubEnv(key, value);
      }
    });
  }
}
```

### 2단계: Mock 서비스 구현

```typescript
// src/test/mocks/supabase-mock.ts
import { vi } from 'vitest';

export const createSupabaseMock = () => {
  const mockQuery = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    filter: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
  };

  const mockSupabase = {
    from: vi.fn().mockReturnValue(mockQuery),
    rpc: vi.fn(),
    auth: {
      getSession: vi.fn(),
      getUser: vi.fn(),
      signInWithOAuth: vi.fn(),
      signOut: vi.fn(),
    },
    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi.fn(),
        download: vi.fn(),
        remove: vi.fn(),
      }),
    },
  };

  return { mockSupabase, mockQuery };
};

// 기본 Supabase 응답 Mock
export const createMockSupabaseResponse = <T>(data: T, error: any = null) => ({
  data,
  error,
  status: error ? 400 : 200,
  statusText: error ? 'Bad Request' : 'OK',
});
```

### 3단계: MCP 서버 Mock

```typescript
// src/test/mocks/mcp-mock.ts
import { vi } from 'vitest';

export const createMCPMock = () => {
  const mockMCPResponse = <T>(data: T) => Promise.resolve(data);

  return {
    filesystem: {
      list_directory: vi.fn().mockImplementation((params) =>
        mockMCPResponse({
          directories: ['src', 'docs', 'tests'],
          files: ['package.json', 'README.md'],
        })
      ),
      read_text_file: vi.fn().mockImplementation((params) =>
        mockMCPResponse('Mock file content')
      ),
      write_file: vi.fn().mockImplementation((params) =>
        mockMCPResponse({ success: true })
      ),
    },
    memory: {
      create_entities: vi.fn().mockImplementation((params) =>
        mockMCPResponse({ created: params.entities.length })
      ),
      search_nodes: vi.fn().mockImplementation((params) =>
        mockMCPResponse([
          {
            id: 'test-node-1',
            name: 'Test Node',
            type: 'TestEntity',
            observations: ['Test observation'],
          },
        ])
      ),
    },
    github: {
      search_repositories: vi.fn().mockImplementation((params) =>
        mockMCPResponse({
          total_count: 1,
          items: [
            {
              name: 'test-repo',
              full_name: 'user/test-repo',
              description: 'Test repository',
            },
          ],
        })
      ),
    },
  };
};
```

## 🏥 개발 Mock 서비스

### 1단계: Mock 데이터 생성기

```typescript
// src/test/mock-data/generators.ts
import { faker } from '@faker-js/faker';

export interface MockServer {
  id: string;
  name: string;
  host: string;
  port: number;
  protocol: 'http' | 'https';
  status: 'active' | 'inactive' | 'error' | 'unknown';
  response_time?: number;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface MockDocument {
  id: string;
  title: string;
  content: string;
  category: string;
  embedding: number[];
  metadata: Record<string, any>;
  user_id: string;
  created_at: string;
}

export class MockDataGenerator {
  static generateServer(overrides: Partial<MockServer> = {}): MockServer {
    return {
      id: faker.string.uuid(),
      name: faker.company.name(),
      host: faker.internet.domainName(),
      port: faker.internet.port(),
      protocol: faker.helpers.arrayElement(['http', 'https']),
      status: faker.helpers.arrayElement([
        'active',
        'inactive',
        'error',
        'unknown',
      ]),
      response_time: faker.number.int({ min: 50, max: 2000 }),
      user_id: faker.string.uuid(),
      created_at: faker.date.recent().toISOString(),
      updated_at: faker.date.recent().toISOString(),
      ...overrides,
    };
  }

  static generateServers(count: number = 10): MockServer[] {
    return Array.from({ length: count }, () => this.generateServer());
  }

  static generateDocument(overrides: Partial<MockDocument> = {}): MockDocument {
    return {
      id: faker.string.uuid(),
      title: faker.lorem.sentence(),
      content: faker.lorem.paragraphs(3),
      category: faker.helpers.arrayElement([
        'tech',
        'business',
        'health',
        'education',
      ]),
      embedding: Array.from({ length: 384 }, () =>
        faker.number.float({ min: -1, max: 1 })
      ),
      metadata: {
        author: faker.person.fullName(),
        tags: faker.helpers.arrayElements(['tag1', 'tag2', 'tag3'], 2),
        version: faker.system.semver(),
      },
      user_id: faker.string.uuid(),
      created_at: faker.date.recent().toISOString(),
      ...overrides,
    };
  }

  static generateDocuments(count: number = 20): MockDocument[] {
    return Array.from({ length: count }, () => this.generateDocument());
  }

  static generateVectorSearchResult(similarity: number = 0.8) {
    const doc = this.generateDocument();
    return {
      ...doc,
      similarity,
    };
  }
}
```

### 2단계: 개발 서버 Mock 모드

```typescript
// src/lib/dev/mock-service.ts
export class DevMockService {
  private static isEnabled =
    process.env.NODE_ENV === 'development' && process.env.MOCK_MODE === 'true';

  static async mockSupabaseResponse<T>(
    realCall: () => Promise<T>,
    mockData: T
  ): Promise<T> {
    if (this.isEnabled) {
      console.log('🎭 Mock 데이터 사용 중:', typeof mockData);
      return mockData;
    }

    return realCall();
  }

  static async mockVectorSearch(
    realCall: () => Promise<any[]>,
    mockResults: any[] = []
  ): Promise<any[]> {
    if (this.isEnabled) {
      console.log('🔍 벡터 검색 Mock 데이터 사용');
      return mockResults;
    }

    return realCall();
  }

  static async mockMCPCall<T>(
    realCall: () => Promise<T>,
    mockResponse: T
  ): Promise<T> {
    if (this.isEnabled) {
      console.log('🔌 MCP Mock 응답 사용');
      return mockResponse;
    }

    return realCall();
  }

  static logMockStatus() {
    if (this.isEnabled) {
      console.log('🎭 개발 Mock 모드 활성화됨');
    }
  }
}
```

## 🧪 통합 테스트

### 통합 테스트 예시

```typescript
// tests/integration/infrastructure-integration.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { setupTestEnvironment, withTestEnv } from '@/test/setup';
import { MCPManager } from '@/lib/mcp/mcp-manager';
import { MockDataGenerator } from '@/test/mock-data/generators';

describe('인프라 통합 테스트', () => {
  setupTestEnvironment();

  describe('MCP 서버 통합', () => {
    it('MCP 서버 상태 확인이 정상 작동해야 함', async () => {
      const statuses = await MCPManager.checkAllServers();

      expect(Array.isArray(statuses)).toBe(true);
      expect(statuses.length).toBeGreaterThan(0);
    });

    it('필수 서버 검증이 정상 작동해야 함', async () => {
      const isValid = await MCPManager.validateRequiredServers();
      expect(typeof isValid).toBe('boolean');
    });

    it('헬스체크 리포트 생성이 정상 작동해야 함', async () => {
      const report = await MCPManager.generateHealthReport();
      
      expect(report).toHaveProperty('timestamp');
      expect(report).toHaveProperty('totalServers');
      expect(report).toHaveProperty('runningServers');
      expect(report).toHaveProperty('healthyPercentage');
    });
  });

  describe('Mock 데이터 생성', () => {
    it('서버 Mock 데이터가 올바르게 생성되어야 함', () => {
      const mockServer = MockDataGenerator.generateServer();
      
      expect(mockServer).toHaveProperty('id');
      expect(mockServer).toHaveProperty('name');
      expect(mockServer).toHaveProperty('host');
      expect(['http', 'https']).toContain(mockServer.protocol);
      expect(['active', 'inactive', 'error', 'unknown']).toContain(
        mockServer.status
      );
    });

    it('문서 Mock 데이터가 올바르게 생성되어야 함', () => {
      const mockDocument = MockDataGenerator.generateDocument();
      
      expect(mockDocument).toHaveProperty('id');
      expect(mockDocument).toHaveProperty('title');
      expect(mockDocument).toHaveProperty('embedding');
      expect(mockDocument.embedding).toHaveLength(384);
      expect(mockDocument.metadata).toHaveProperty('author');
    });
  });

  describe('테스트 환경 관리', () => {
    it('환경변수 설정이 정상 작동해야 함', () => {
      withTestEnv({ NODE_ENV: 'test', MOCK_MODE: 'true' }, () => {
        expect(process.env.NODE_ENV).toBe('test');
        expect(process.env.MOCK_MODE).toBe('true');
      });
    });

    it('환경변수 복원이 정상 작동해야 함', () => {
      const originalEnv = process.env.NODE_ENV;
      
      withTestEnv({ NODE_ENV: 'development' }, () => {
        expect(process.env.NODE_ENV).toBe('development');
      });
      
      expect(process.env.NODE_ENV).toBe(originalEnv);
    });
  });
});
```

## 🚨 문제 해결

### MCP 서버 연결 실패

**증상**: `MCP server not responding` 또는 `Connection timeout`

**해결책**:
```typescript
// MCP 서버 진단
const diagnoseMCPIssues = async () => {
  console.log('🔍 MCP 서버 진단 시작...');
  
  // 1. 환경변수 확인
  const envReport = MCPEnvManager.getEnvironmentReport();
  console.log('환경변수 상태:', envReport);
  
  // 2. 서버 상태 확인
  const statuses = await MCPManager.checkAllServers();
  console.log('서버 상태:', statuses);
  
  // 3. 필수 서버 검증
  const isValid = await MCPManager.validateRequiredServers();
  console.log('필수 서버 정상:', isValid);
  
  // 4. 재시작 시도
  if (!isValid) {
    console.log('🔄 MCP 서버 재시작 시도...');
    await MCPManager.restartServer('filesystem');
  }
};
```

### 테스트 환경 설정 오류

**증상**: 테스트에서 `Environment variable not found`

**해결책**:
```typescript
// 테스트 환경 진단
const diagnoseTestEnvironment = () => {
  console.log('🧪 테스트 환경 진단...');
  
  const missingVars = Object.entries(TEST_ENV_DEFAULTS)
    .filter(([key]) => !process.env[key])
    .map(([key]) => key);
  
  if (missingVars.length > 0) {
    console.error('누락된 테스트 환경변수:', missingVars);
  } else {
    console.log('✅ 모든 테스트 환경변수 설정됨');
  }
};
```

### Mock 서비스 동작 오류

**증상**: Mock 데이터가 실제 API 호출로 대체됨

**해결책**:
```typescript
// Mock 모드 확인
const checkMockMode = () => {
  const isMockEnabled = process.env.NODE_ENV === 'development' && 
                       process.env.MOCK_MODE === 'true';
  
  if (!isMockEnabled) {
    console.warn('⚠️ Mock 모드가 비활성화됨');
    console.log('환경변수 설정: MOCK_MODE=true');
  } else {
    console.log('✅ Mock 모드 활성화됨');
    DevMockService.logMockStatus();
  }
};
```

---

## 📚 관련 문서

- [데이터베이스 & 스토리지 설정](./database-storage-setup.md)
- [AI 서비스 & 모니터링 가이드](./ai-services-monitoring-setup.md)
- [MCP 종합 가이드](../MCP-GUIDE.md)
- [테스트 가이드](../testing/testing-guide.md)

---

**💡 핵심 원칙**: 자동화된 설정 + 강력한 테스트 환경 + 스마트 Mock 시스템

🔌 **성공 요소**: MCP 12개 서버 완전 통합 + Vitest 환경 관리 + 개발 효율성 극대화