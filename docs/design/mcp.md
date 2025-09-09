# MCP 서버 설계

```yaml
title: "Model Context Protocol Integration"
version: "v5.77"
updated: "2025-09-09"
type: "mcp-architecture"
ai_priority: "high"
```

## 🔌 MCP 서버 통합 (8개)

### 핵심 시스템 (3개)
```typescript
// 1. memory - Knowledge Graph
interface MemoryMCP {
  entities: 'create_entities';
  observations: 'add_observations';
  search: 'search_entities';
  purpose: 'context_retention';
}

// 2. shadcn-ui - 46개 UI 컴포넌트
interface ShadcnMCP {
  components: 'ui_components';
  docs: 'component_docs';
  examples: 'usage_examples';
  purpose: 'ui_development';
}

// 3. time - 시간대 변환
interface TimeMCP {
  convert: 'timezone_conversion';
  format: 'time_formatting';
  purpose: 'global_time_management';
}
```

### AI & 검색 (3개)
```typescript
// 4. sequential-thinking - 순차 사고
interface SequentialThinkingMCP {
  think: 'step_by_step_reasoning';
  plan: 'task_decomposition';
  purpose: 'complex_problem_solving';
}

// 5. context7 - 라이브러리 문서
interface Context7MCP {
  search: 'library_documentation';
  examples: 'code_examples';
  purpose: 'api_reference';
}

// 6. serena - 코드 분석
interface SerenaMCP {
  analyze: 'code_analysis';
  symbols: 'symbol_manipulation';
  purpose: 'code_understanding';
}
```

### 개발 & 테스트 (2개)
```typescript
// 7. supabase - SQL 쿼리
interface SupabaseMCP {
  query: 'sql_execution';
  schema: 'database_schema';
  rls: 'security_policies';
  purpose: 'database_operations';
}

// 8. playwright - 브라우저 자동화
interface PlaywrightMCP {
  navigate: 'browser_navigation';
  screenshot: 'visual_testing';
  interact: 'element_interaction';
  purpose: 'e2e_testing';
}
```

### MCP 최적화 성과
- **토큰 절약**: 27% 감소
- **활성 서버**: 8/8개 완전 작동
- **도구 매핑**: 서브에이전트별 최적 할당
- **중복 제거**: github, gcp, tavily 제거 완료

### 환경변수 보안
```bash
# .env.local (보안 토큰)
SUPABASE_SERVICE_ROLE_KEY="sb-xxx"
GITHUB_TOKEN="ghp_xxx"

# .mcp.json (참조만)
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": ["@supabase/mcp-server"],
      "env": {
        "SUPABASE_URL": "${SUPABASE_URL}",
        "SUPABASE_SERVICE_ROLE_KEY": "${SUPABASE_SERVICE_ROLE_KEY}"
      }
    }
  }
}
```

### 서브에이전트 매핑
- **central-supervisor**: memory, sequential-thinking, serena
- **verification-specialist**: serena, memory, sequential-thinking
- **database-administrator**: supabase (모든 도구)
- **test-automation-specialist**: playwright (모든 도구)