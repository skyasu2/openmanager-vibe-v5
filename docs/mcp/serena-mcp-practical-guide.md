ARCHIVED

## 🚀 Serena MCP 개요

Serena는 **Language Server Protocol(LSP)** 기반의 강력한 코드 분석 및 편집 도구를 제공하는 MCP 서버입니다. Claude Code에서 `mcp__serena__*` 명령으로 사용 가능합니다.

### 핵심 특징

- **심볼 기반 분석**: 텍스트가 아닌 코드 구조 수준에서 이해
- **안전한 리팩토링**: 심볼 단위로 정확한 코드 수정
- **프로젝트 지식 관리**: 메모리 기능으로 컨텍스트 유지
- **빠른 코드 탐색**: 참조 관계 및 의존성 추적

## 📋 주요 기능별 사용법

### 1. 코드 구조 파악

```typescript
// 전체 디렉토리 심볼 개요
mcp__serena__get_symbols_overview({
  relative_path: 'src/services/ai',
  max_answer_chars: 10000,
});

// 특정 파일의 모든 심볼
mcp__serena__get_symbols_overview({
  relative_path: 'src/services/ai/SimplifiedQueryEngine.ts',
});
```

### 2. 심볼 검색 및 분석

```typescript
// 클래스 찾기
mcp__serena__find_symbol({
  name_path: 'SimplifiedQueryEngine',
  relative_path: 'src/services/ai/SimplifiedQueryEngine.ts',
  include_body: true, // 전체 코드 포함
  depth: 1, // 하위 메소드/속성 포함
});

// 특정 메소드 찾기
mcp__serena__find_symbol({
  name_path: 'SimplifiedQueryEngine/query',
  relative_path: 'src/services/ai/SimplifiedQueryEngine.ts',
  include_body: true,
});

// 패턴으로 심볼 찾기 (substring_matching)
mcp__serena__find_symbol({
  name_path: 'process',
  substring_matching: true,
  include_kinds: [12], // 12 = Function
});
```

### 3. 참조 추적

```typescript
// 특정 클래스를 사용하는 모든 위치 찾기
mcp__serena__find_referencing_symbols({
  name_path: 'SimplifiedQueryEngine',
  relative_path: 'src/services/ai/SimplifiedQueryEngine.ts',
});

// 메소드 호출 위치 추적
mcp__serena__find_referencing_symbols({
  name_path: 'query',
  relative_path: 'src/services/ai/SimplifiedQueryEngine.ts',
  include_kinds: [12], // 메소드만
});
```

### 4. 코드 수정

```typescript
// 심볼 본문 전체 교체
mcp__serena__replace_symbol_body({
  name_path: 'calculateConfidence',
  relative_path: 'src/services/ai/SimplifiedQueryEngine.ts',
  body: `protected calculateConfidence(ragResult: any): number {
    // 새로운 구현
    return Math.min(ragResult.topScore * 0.9, 0.95);
  }`,
});

// 클래스에 새 메소드 추가
mcp__serena__insert_after_symbol({
  name_path: 'SimplifiedQueryEngine/query',
  relative_path: 'src/services/ai/SimplifiedQueryEngine.ts',
  body: `
  /**
   * 새로운 헬퍼 메소드
   */
  private validateQuery(query: string): boolean {
    return query && query.trim().length > 0;
  }
  `,
});

// import 문 추가
mcp__serena__insert_before_symbol({
  name_path: 'SimplifiedQueryEngine', // 첫 번째 심볼 앞에
  relative_path: 'src/services/ai/SimplifiedQueryEngine.ts',
  body: "import { NewUtility } from './new-utility';\n",
});
```

### 5. 패턴 검색

```typescript
// 코드 패턴 검색
mcp__serena__search_for_pattern({
  substring_pattern: 'TODO|FIXME|HACK',
  restrict_search_to_code_files: true,
  context_lines_before: 2,
  context_lines_after: 2,
});

// 특정 API 사용 검색
mcp__serena__search_for_pattern({
  substring_pattern: 'fetch\\s*\\(',
  relative_path: 'src/services',
  paths_include_glob: '*.ts',
});
```

### 6. 프로젝트 메모리 관리

```typescript
// 중요 정보 저장
mcp__serena__write_memory({
  memory_name: 'api-endpoints',
  content: '# API 엔드포인트 목록\n- /api/servers\n- /api/ai/query',
});

// 저장된 정보 조회
mcp__serena__read_memory({
  memory_file_name: 'api-endpoints',
});

// 모든 메모리 목록
mcp__serena__list_memories();
```

## 🤖 서브에이전트별 활용 시나리오

### 1. code-review-specialist

```typescript
// SOLID 원칙 위반 검사
const classOverview = await mcp__serena__get_symbols_overview({
  relative_path: 'src/services',
});

// God Class 탐지 (500줄 이상)
const largeClasses = await mcp__serena__find_symbol({
  name_path: '*',
  include_kinds: [5], // Class
  include_body: true,
}).filter((c) => c.body_location.end_line - c.body_location.start_line > 500);

// 순환 의존성 체크
const references = await mcp__serena__find_referencing_symbols({
  name_path: 'ServiceA',
  relative_path: 'src/services/ServiceA.ts',
});
```

### 2. debugger-specialist

```typescript
// 스택 트레이스에서 문제 위치 찾기
const errorLocation = await mcp__serena__find_symbol({
  name_path: 'SimplifiedQueryEngine/processLocalQuery',
  relative_path: 'src/services/ai/SimplifiedQueryEngine.ts',
  include_body: true,
});

// 에러 발생 가능 지점 패턴 검색
const catchBlocks = await mcp__serena__search_for_pattern({
  substring_pattern: 'catch\\s*\\(.*?\\)\\s*\\{',
  restrict_search_to_code_files: true,
  context_lines_after: 5,
});
```

### 3. doc-writer-researcher

```typescript
// 문서화되지 않은 public 메소드 찾기
const publicMethods = await mcp__serena__search_for_pattern({
  substring_pattern: '^\\s*public\\s+\\w+\\s*\\(',
  restrict_search_to_code_files: true,
  paths_include_glob: '**/*.ts',
});

// API 엔드포인트 문서화
const apiRoutes = await mcp__serena__search_for_pattern({
  substring_pattern: 'app\\.(get|post|put|delete)\\s*\\(',
  relative_path: 'src/app/api',
  context_lines_after: 3,
});
```

### 4. test-automation-specialist

```typescript
// 테스트되지 않은 함수 찾기
const allFunctions = await mcp__serena__find_symbol({
  name_path: '*',
  include_kinds: [12], // Function
  relative_path: 'src/services',
});

const testFiles = await mcp__serena__find_file({
  file_mask: '*.test.ts',
  relative_path: 'src',
});

// 테스트 커버리지 분석을 위한 참조 확인
const testedFunctions = await mcp__serena__find_referencing_symbols({
  name_path: 'targetFunction',
  relative_path: 'src/services/module.ts',
});
```

### 5. security-auditor

```typescript
// SQL 인젝션 취약점 패턴
const sqlQueries = await mcp__serena__search_for_pattern({
  substring_pattern: 'query\\s*\\(.*?\\$\\{.*?\\}', // 템플릿 리터럴 in SQL
  restrict_search_to_code_files: true,
  context_lines_before: 3,
});

// 하드코딩된 시크릿 검색
const secrets = await mcp__serena__search_for_pattern({
  substring_pattern: '(api_key|secret|password|token)\\s*=\\s*["\']\\w+["\']',
  restrict_search_to_code_files: true,
});

// 인증 미들웨어 사용 확인
const authUsage = await mcp__serena__find_referencing_symbols({
  name_path: 'authMiddleware',
  relative_path: 'src/middleware/auth.ts',
});
```

## 💡 Best Practices

### 1. 심볼 수준 작업 우선

```typescript
// ❌ 텍스트 기반 수정
replace_regex({ pattern: 'function.*{', replacement: '...' });

// ✅ 심볼 기반 수정
replace_symbol_body({ name_path: 'functionName', body: '...' });
```

### 2. 참조 확인 후 수정

```typescript
// 1. 먼저 참조 확인
const refs = await find_referencing_symbols({ name_path: 'targetSymbol' });

// 2. 영향 범위 파악 후 수정
if (refs.length < 10) {
  await replace_symbol_body({
    name_path: 'targetSymbol',
    body: newImplementation,
  });
}
```

### 3. 메모리 활용

```typescript
// 복잡한 분석 결과 저장
await write_memory({
  memory_name: 'code-metrics-2024-01',
  content: JSON.stringify(analysisResults),
});

// 나중에 재사용
const prevAnalysis = await read_memory({
  memory_file_name: 'code-metrics-2024-01',
});
```

### 4. 점진적 탐색

```typescript
// 1단계: 개요 파악
const overview = await get_symbols_overview({ relative_path: 'src' });

// 2단계: 관심 영역 좁히기
const targetModule = await get_symbols_overview({
  relative_path: 'src/services/ai',
});

// 3단계: 구체적 심볼 분석
const symbol = await find_symbol({
  name_path: 'SimplifiedQueryEngine',
  include_body: true,
  depth: 2,
});
```

## 🚨 주의사항

1. **Language Server 재시작**: 외부 편집 시 `restart_language_server()` 필요
2. **경로 정확성**: 모든 경로는 프로젝트 루트 기준 상대 경로
3. **심볼 이름 형식**: `Class/method` 또는 `/absolute/path` 형식 사용
4. **성능 고려**: `include_body: true`는 필요한 경우만 사용
5. **메모리 한계**: 큰 프로젝트에서는 `max_answer_chars` 조정 필요

## 🔗 연관 문서

- `/docs/subagents-mcp-usage-summary.md` - 서브에이전트별 MCP 사용 현황
- `.claude/mcp.json` - MCP 서버 설정
- `CLAUDE.md` - 프로젝트 가이드
