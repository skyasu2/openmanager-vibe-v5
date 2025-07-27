# 서브 에이전트 시스템 개선 사항

## 작성일: 2025-01-27

### 발견된 문제점 및 해결 방안

#### 1. Supabase MCP 프로젝트 ID 이슈

**문제**: ai-systems-engineer 등이 Supabase MCP 사용 시 프로젝트 ID 필요
**해결**:

```typescript
// src/services/agents/config.ts
export const AGENT_CONFIG = {
  defaultSupabaseProjectId: process.env.SUPABASE_PROJECT_ID,
  mcp: {
    supabase: {
      projectId: process.env.SUPABASE_PROJECT_ID,
      url: process.env.SUPABASE_URL,
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    },
  },
};
```

#### 2. 환경변수 자동 검증 시스템

**문제**: MCP 서버들이 필요한 환경변수가 설정되지 않으면 실패
**해결**:

```typescript
// src/services/agents/mcp-validator.ts
export class MCPValidator {
  static validateEnvironment(): ValidationResult {
    const required = {
      github: ['GITHUB_PERSONAL_ACCESS_TOKEN'],
      supabase: [
        'SUPABASE_URL',
        'SUPABASE_SERVICE_ROLE_KEY',
        'SUPABASE_PROJECT_ID',
      ],
    };

    const missing: string[] = [];

    Object.entries(required).forEach(([mcp, vars]) => {
      vars.forEach(v => {
        if (!process.env[v]) missing.push(`${mcp}: ${v}`);
      });
    });

    return { valid: missing.length === 0, missing };
  }
}
```

#### 3. 에이전트 컨텍스트 전달 개선

**문제**: 에이전트가 프로젝트 컨텍스트를 충분히 받지 못함
**해결**:

```typescript
// src/services/agents/context-provider.ts
export class AgentContextProvider {
  static async buildContext(agentType: string): Promise<AgentContext> {
    const baseContext = {
      projectRoot: process.cwd(),
      env: process.env.NODE_ENV,
      config: await this.loadProjectConfig(),
    };

    // 에이전트별 추가 컨텍스트
    const specificContext = await this.loadAgentSpecificContext(agentType);

    return { ...baseContext, ...specificContext };
  }
}
```

#### 4. MCP 도구 사용 추적 시스템

**문제**: 에이전트가 어떤 MCP를 실제로 사용했는지 추적 어려움
**해결**:

```typescript
// src/services/agents/mcp-tracker.ts
export class MCPUsageTracker {
  private static usage = new Map<string, MCPUsageStats>();

  static track(agentType: string, mcpTool: string, success: boolean) {
    const key = `${agentType}:${mcpTool}`;
    const stats = this.usage.get(key) || {
      calls: 0,
      successes: 0,
      failures: 0,
    };

    stats.calls++;
    if (success) stats.successes++;
    else stats.failures++;

    this.usage.set(key, stats);
  }

  static getReport(): MCPUsageReport {
    return Array.from(this.usage.entries()).map(([key, stats]) => {
      const [agent, mcp] = key.split(':');
      return { agent, mcp, ...stats };
    });
  }
}
```

#### 5. 에러 복구 메커니즘

**문제**: MCP 도구 실패 시 에이전트가 중단됨
**해결**:

```typescript
// src/services/agents/error-recovery.ts
export class AgentErrorRecovery {
  static async withFallback<T>(
    primary: () => Promise<T>,
    fallback: () => Promise<T>,
    context: { agent: string; operation: string }
  ): Promise<T> {
    try {
      return await primary();
    } catch (error) {
      console.warn(
        `[${context.agent}] Primary operation failed: ${context.operation}`
      );

      // MCP 도구 실패 시 대체 전략
      if (error.message.includes('mcp_')) {
        return await fallback();
      }

      throw error;
    }
  }
}
```

### 구현 우선순위

1. **즉시 적용 (1일)**
   - 환경변수 검증 스크립트 실행
   - `.env.example` 업데이트

2. **단기 개선 (3일)**
   - MCPValidator 구현
   - AgentContextProvider 구현

3. **중기 개선 (1주)**
   - MCPUsageTracker 구현
   - 에러 복구 메커니즘 적용

4. **장기 개선 (2주)**
   - 에이전트 성능 대시보드 구축
   - 자동 최적화 시스템 구현

### 테스트 계획

```typescript
// src/tests/agents/integration.test.ts
describe('Sub-Agent MCP Integration', () => {
  it('should validate MCP environment before execution', async () => {
    const result = await MCPValidator.validateEnvironment();
    expect(result.valid).toBe(true);
  });

  it('should track MCP usage correctly', async () => {
    await Task({
      subagent_type: 'ai-systems-engineer',
      description: 'Test task',
      prompt: 'Test prompt',
    });

    const report = MCPUsageTracker.getReport();
    expect(report).toContainEqual(
      expect.objectContaining({
        agent: 'ai-systems-engineer',
        mcp: 'supabase',
      })
    );
  });
});
```

### 모니터링 메트릭

- 각 에이전트별 MCP 사용률
- MCP 도구 성공/실패율
- 평균 실행 시간
- 에러 복구 횟수

### 결론

서브 에이전트와 MCP 통합은 기본적으로 잘 동작하고 있으나, 프로덕션 환경에서의 안정성과 추적성을 높이기 위한 개선이 필요합니다. 제안된 개선사항들을 단계적으로 적용하면 더욱 견고한 시스템을 구축할 수 있을 것입니다.
