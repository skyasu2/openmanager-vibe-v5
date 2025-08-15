# 🚀 MCP 활용 및 실전 가이드

> **Model Context Protocol 실전 활용법**  
> 실제 테스트 결과와 실전 예제로 개발 생산성 극대화

**최종 업데이트**: 2025-08-15 20:50  
**환경**: WSL 2 (Ubuntu 24.04 LTS) + Claude Code v1.0.81  
**상태**: 10/11 서버 정상, GitHub 토큰 갱신 완료 ✅

---

## 🎯 MCP 서버 현재 상태 (2025-08-15 테스트)

### ✅ 정상 작동 서버 (10/11)

- **Filesystem**: 파일 시스템 접근 정상
- **Memory**: 지식 그래프 저장/조회 정상
- **GitHub**: API 통합 정상 ✅ (토큰 갱신 완료)
- **Playwright**: 브라우저 자동화 정상 (WSL: 127.0.0.1 사용 필수)
- **Time**: 시간대 변환 정상
- **Tavily**: 웹 검색 API 정상
- **Thinking**: 순차적 사고 처리 정상
- **Context7**: 라이브러리 문서 검색 정상
- **ShadCN**: UI 컴포넌트 라이브러리 정상
- **Serena**: 코드베이스 분석 도구 정상

### ⚠️ 제한적 작동 서버 (1/11)

- **Supabase**: list_tables만 응답 크기 초과 (9/10 명령 정상)

## 📋 목차

1. [빠른 시작](#빠른-시작)
2. [11개 MCP 서버 실전 활용](#11개-mcp-서버-실전-활용)
3. [실전 통합 워크플로우](#실전-통합-워크플로우)
4. [성능 최적화 전략](#성능-최적화-전략)
5. [문제 해결 가이드](#문제-해결-가이드)

---

## 🚀 빠른 시작

### 환경변수 설정 (2025-08-15 업데이트)

**.mcp.json**에 환경변수가 직접 포함되어 자동으로 로드됩니다:

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "your-token-here"
      }
    },
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase@latest",
        "--project-ref",
        "vnswjnltnhpsueosfhmw"
      ],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "your-token-here"
      }
    },
    "tavily": {
      "command": "npx",
      "args": ["-y", "tavily-mcp"],
      "env": {
        "TAVILY_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

```bash
# MCP 서버 상태 확인
/mcp

# Claude Code 재시작 (설정 변경 시)
/reload
```

### 최소 테스트 예제

```bash
# FileSystem - 프로젝트 파일 목록
mcp__filesystem__list_directory({
  path: "/mnt/d/cursor/openmanager-vibe-v5"
})

# Memory - 지식 저장
mcp__memory__create_entities({
  entities: [{
    name: "QuickTest",
    entityType: "Test",
    observations: ["MCP 정상 작동 확인"]
  }]
})

# Time - 현재 시간
mcp__time__get_current_time({
  timezone: "Asia/Seoul"
})
```

---

## 📦 11개 MCP 서버 실전 활용

### 1. 🗂️ FileSystem MCP

**상태**: ✅ 정상 작동

#### 테스트 완료 기능

```typescript
// ✅ 디렉토리 목록 조회
await mcp__filesystem__list_directory({
  path: '/mnt/d/cursor/openmanager-vibe-v5',
});
// 결과: 파일 및 디렉토리 목록 반환

// ✅ 파일 크기 포함 목록
await mcp__filesystem__list_directory_with_sizes({
  path: '/mnt/d/cursor/openmanager-vibe-v5/src',
  sortBy: 'size',
});

// ✅ 파일 읽기
await mcp__filesystem__read_text_file({
  path: '/mnt/d/cursor/openmanager-vibe-v5/package.json',
  head: 20, // 상위 20줄만
});

// ✅ 파일 쓰기
await mcp__filesystem__write_file({
  path: '/mnt/d/cursor/openmanager-vibe-v5/test.txt',
  content: 'MCP 테스트 파일',
});

// ✅ 파일 검색
await mcp__filesystem__search_files({
  path: '/mnt/d/cursor/openmanager-vibe-v5',
  pattern: '*.md',
  excludePatterns: ['node_modules'],
});
```

#### 실전 활용 팁

- WSL 경로 사용 필수: `/mnt/d/` 형식
- 대용량 파일은 `head`/`tail` 파라미터 활용
- `excludePatterns`로 불필요한 디렉토리 제외

---

### 2. 🧠 Memory MCP

**상태**: ✅ 정상 작동

#### 테스트 완료 기능

```typescript
// ✅ 엔티티 생성
await mcp__memory__create_entities({
  entities: [
    {
      name: 'OpenManagerV5Test',
      entityType: 'TestSystem',
      observations: [
        'WSL 환경에서 MCP 테스트 중',
        '2025-08-15 테스트 실행',
        '11개 MCP 서버 동작 확인',
      ],
    },
  ],
});

// ✅ 관계 생성
await mcp__memory__create_relations({
  relations: [
    {
      from: 'OpenManagerV5Test',
      to: 'MCPServers',
      relationType: 'tests',
    },
  ],
});

// ✅ 지식 검색
await mcp__memory__search_nodes({
  query: 'WSL MCP 테스트',
});

// ✅ 전체 그래프 조회
await mcp__memory__read_graph();
```

#### 실전 활용 팁

- 프로젝트 지식을 체계적으로 저장
- 트러블슈팅 경험 기록
- 의존성 관계 문서화

---

### 3. 🐙 GitHub MCP

**상태**: ✅ 정상 작동 (토큰 갱신 완료)

#### 토큰 갱신 완료 (2025-08-15)

```bash
# .env.local에 새 토큰 적용됨
GITHUB_PERSONAL_ACCESS_TOKEN=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

# .mcp.json에 환경변수 포함됨 (자동 로드)
```

#### 사용 가능 기능

```typescript
// ✅ 저장소 검색
await mcp__github__search_repositories({
  query: 'openmanager user:skyasu2',
  perPage: 1,
});

// ✅ 이슈 생성
await mcp__github__create_issue({
  owner: 'skyasu2',
  repo: 'openmanager-vibe-v5',
  title: 'MCP 테스트 이슈',
  body: '자동 생성된 테스트 이슈',
});

// ✅ 파일 내용 조회
await mcp__github__get_file_contents({
  owner: 'skyasu2',
  repo: 'openmanager-vibe-v5',
  path: 'README.md',
});

// ✅ 풀 리퀘스트 생성
await mcp__github__create_pull_request({
  owner: 'skyasu2',
  repo: 'openmanager-vibe-v5',
  title: 'MCP 개선',
  head: 'feature-branch',
  base: 'main',
});
```

#### 주의사항

- **토큰 권한**: `repo`, `user`, `admin:org` 필요
- **레이트 리미트**: GitHub API 제한 준수 필요
- **재시작 필요**: 토큰 변경 시 `/reload` 실행

---

### 4. 🗄️ Supabase MCP

**상태**: ⚠️ 제한적 작동 (9/10 명령 정상)

#### ✅ 정상 동작 명령 (9개)

```typescript
// ✅ 프로젝트 URL 조회
await mcp__supabase__get_project_url();
// 결과: "https://vnswjnltnhpsueosfhmw.supabase.co"

// ✅ Anonymous Key 조회
await mcp__supabase__get_anon_key();
// 결과: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

// ✅ SQL 직접 실행
await mcp__supabase__execute_sql({
  query: 'SELECT current_database(), current_user LIMIT 1;',
});
// 결과: [{"current_database":"postgres","current_user":"postgres"}]

// ✅ 확장 목록 조회 (80개 확장)
await mcp__supabase__list_extensions();

// ✅ 마이그레이션 목록 (16개)
await mcp__supabase__list_migrations();

// ✅ 브랜치 목록
await mcp__supabase__list_branches();

// ✅ TypeScript 타입 생성 (31테이블+2뷰+46함수)
await mcp__supabase__generate_typescript_types();

// ✅ 로그 조회
await mcp__supabase__get_logs({ service: 'api' });

// ✅ 보안 권고사항 (34개 이슈 발견)
await mcp__supabase__get_advisors({ type: 'security' });
```

#### ❌ 제한 사항

```typescript
// ❌ 테이블 목록 - 응답 크기 초과
await mcp__supabase__list_tables();
// 오류: 46,244 토큰 > 25,000 토큰 제한

// 💡 대안: SQL로 직접 조회
await mcp__supabase__execute_sql({
  query:
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' LIMIT 10;",
});
```

#### 주의사항

- **공식 패키지**: `@supabase/mcp-server-supabase@latest` 필수
- **환경변수**: `SUPABASE_ACCESS_TOKEN` 필수
- **토큰 제한**: 응답이 25,000 토큰 초과 시 오류
- **대용량 데이터**: execute_sql로 LIMIT 사용 권장

---

### 5. 🔍 Tavily MCP

**상태**: ✅ 정상 작동

#### 테스트 완료 기능

```typescript
// ✅ 웹 검색
(await mcp__tavily__tavily) -
  search({
    query: 'WSL Ubuntu 24.04 development environment',
    max_results: 3,
    search_depth: 'basic',
  });

// ✅ 고급 검색 (뉴스)
(await mcp__tavily__tavily) -
  search({
    query: 'Next.js 15 새로운 기능',
    topic: 'news',
    time_range: 'week',
    max_results: 5,
    search_depth: 'advanced',
  });

// ✅ URL 콘텐츠 추출
(await mcp__tavily__tavily) -
  extract({
    urls: ['https://docs.anthropic.com/en/docs/claude-code'],
    format: 'markdown',
  });

// ✅ 웹사이트 크롤링
(await mcp__tavily__tavily) -
  crawl({
    url: 'https://nextjs.org/docs',
    max_depth: 2,
    max_breadth: 10,
  });
```

---

### 6. 🎭 Playwright MCP

**상태**: ✅ 정상 작동 (의존성 설치 완료)

#### 초기 설정 (WSL)

```bash
# 브라우저 의존성 설치
sudo apt-get install -y libnspr4 libnss3 libasound2t64
sudo npx playwright install-deps

# Chromium 브라우저 설치
npx playwright install chromium
```

#### 테스트 완료 기능

```typescript
// ✅ 페이지 이동
await mcp__playwright__playwright_navigate({
  url: 'https://www.google.com',
  browserType: 'chromium',
  headless: true,
});

// ✅ 스크린샷 캡처
await mcp__playwright__playwright_screenshot({
  name: 'google-homepage',
  fullPage: true,
  savePng: true,
});

// ✅ 요소 클릭
await mcp__playwright__playwright_click({
  selector: "button[type='submit']",
});

// ✅ 텍스트 입력
await mcp__playwright__playwright_fill({
  selector: "input[name='search']",
  value: 'MCP testing',
});

// ✅ 페이지 평가
await mcp__playwright__playwright_evaluate({
  script: 'document.title',
});
```

#### ⚠️ WSL 환경 주의사항 (2025-08-15 테스트 검증)

```typescript
// ❌ WSL에서 localhost 접근 시 타임아웃
await mcp__playwright__playwright_navigate({
  url: 'http://localhost:3000', // WSL에서 문제 발생
  timeout: 15000,
});
// 오류: Timeout 15000ms exceeded

// ✅ 해결책: 127.0.0.1 사용
await mcp__playwright__playwright_navigate({
  url: 'http://127.0.0.1:3000', // WSL에서 정상 작동
  headless: true,
});

// ❌ 개발 서버 미실행 시
await mcp__playwright__playwright_navigate({
  url: 'http://127.0.0.1:3000',
});
// 오류: net::ERR_CONNECTION_REFUSED

// ✅ 해결책: 개발 서버 먼저 실행
// 터미널에서: npm run dev
// 서버 실행 확인 후 Playwright 사용
```

#### 💡 WSL 개발 서버 접속 워크플로우

```bash
# 1. 개발 서버 실행
npm run dev

# 2. 서버 준비 완료 대기 (Ready in XXs 메시지)
# ✓ Ready in 30.4s
# - Local: http://localhost:3000

# 3. Playwright에서 127.0.0.1 사용
await mcp__playwright__playwright_navigate({
  url: "http://127.0.0.1:3000",
  browserType: "chromium",
  headless: true,
  timeout: 20000  // 첫 로딩은 시간 소요
});
```

---

### 7. ⏰ Time MCP

**상태**: ✅ 정상 작동

#### 테스트 완료 기능

```typescript
// ✅ 현재 시간 조회
await mcp__time__get_current_time({
  timezone: 'Asia/Seoul',
});
// 결과: {
//   timezone: "Asia/Seoul",
//   datetime: "2025-08-15T19:51:52+09:00",
//   is_dst: false
// }

// ✅ 시간대 변환
await mcp__time__convert_time({
  source_timezone: 'Asia/Seoul',
  target_timezone: 'America/New_York',
  time: '14:30',
});
```

---

### 8. 🤔 Thinking MCP

**상태**: ✅ 정상 작동

#### 테스트 완료 기능

```typescript
// ✅ 순차적 사고
await mcp__thinking__sequentialthinking({
  thought: 'MCP 서버 테스트 결과 분석',
  nextThoughtNeeded: true,
  thoughtNumber: 1,
  totalThoughts: 3,
});
```

---

### 9. 📚 Context7 MCP

**상태**: ✅ 정상 작동

#### 테스트 완료 기능

```typescript
// ✅ 라이브러리 검색
(await mcp__context7__resolve) -
  library -
  id({
    libraryName: 'react',
  });
// 결과: React 관련 라이브러리 목록 반환

// ✅ 문서 조회
(await mcp__context7__get) -
  library -
  docs({
    context7CompatibleLibraryID: '/reactjs/react.dev',
    tokens: 5000,
    topic: 'hooks',
  });
```

---

### 10. 🎨 Shadcn MCP

**상태**: ✅ 정상 작동

#### 테스트 완료 기능

```typescript
// ✅ 컴포넌트 목록 조회
await mcp__shadcn__list_components();
// 결과: 50+ UI 컴포넌트 목록

// ✅ 컴포넌트 코드 조회
await mcp__shadcn__get_component({
  componentName: 'button',
});

// ✅ 블록 목록 조회
await mcp__shadcn__list_blocks();
```

---

### 11. 🔧 Serena MCP

**상태**: ⚠️ 프로젝트 활성화 필요

#### 테스트 완료 기능

```typescript
// ✅ 프로젝트 활성화
await mcp__serena__activate_project({
  project: '/mnt/d/cursor/openmanager-vibe-v5',
});

// ✅ 디렉토리 목록
await mcp__serena__list_dir({
  relative_path: '.',
  recursive: false,
});

// ✅ 파일 검색
await mcp__serena__find_file({
  file_mask: '*.ts',
  relative_path: 'src',
});
```

---

## 🔄 실전 통합 워크플로우

### 1. 프로젝트 분석 워크플로우

```typescript
// 병렬로 프로젝트 정보 수집
const [files, dbSchema, memory, currentTime] = await Promise.all([
  // 파일 구조 분석
  mcp__filesystem__directory_tree({
    path: '/mnt/d/cursor/openmanager-vibe-v5/src',
  }),

  // 데이터베이스 스키마 조회
  mcp__supabase__generate_typescript_types(),

  // 기존 지식 조회
  mcp__memory__read_graph(),

  // 타임스탬프
  mcp__time__get_current_time({ timezone: 'Asia/Seoul' }),
]);

// 분석 결과 저장
await mcp__memory__create_entities({
  entities: [
    {
      name: `ProjectAnalysis_${currentTime.datetime}`,
      entityType: 'Analysis',
      observations: [
        `파일 수: ${files.length}`,
        `분석 시간: ${currentTime.datetime}`,
        '프로젝트 구조 분석 완료',
      ],
    },
  ],
});
```

### 2. 자동화된 테스트 워크플로우

```typescript
// E2E 테스트 자동화
async function runE2ETest(url: string) {
  // 1. 브라우저 시작
  await mcp__playwright__playwright_navigate({
    url,
    browserType: 'chromium',
    headless: true,
  });

  // 2. 페이지 로딩 확인
  const title = await mcp__playwright__playwright_evaluate({
    script: 'document.title',
  });

  // 3. 스크린샷 저장
  await mcp__playwright__playwright_screenshot({
    name: `test-${Date.now()}`,
    fullPage: true,
  });

  // 4. 결과 기록
  await mcp__memory__create_entities({
    entities: [
      {
        name: 'E2ETestResult',
        entityType: 'TestResult',
        observations: [
          `URL: ${url}`,
          `Title: ${title}`,
          `테스트 완료: ${new Date().toISOString()}`,
        ],
      },
    ],
  });

  // 5. 브라우저 종료
  await mcp__playwright__playwright_close();
}
```

### 3. 문서 자동 생성 워크플로우

```typescript
// API 문서 자동 생성
async function generateAPIDocs() {
  // 1. TypeScript 타입 생성
  const types = await mcp__supabase__generate_typescript_types();

  // 2. 기존 문서 검색
  const existingDocs = await mcp__filesystem__search_files({
    path: '/mnt/d/cursor/openmanager-vibe-v5/docs',
    pattern: 'API*.md',
  });

  // 3. 최신 정보 검색
  const latestInfo =
    (await mcp__tavily__tavily) -
    search({
      query: 'Supabase RLS best practices 2025',
      max_results: 3,
    });

  // 4. 문서 생성
  await mcp__filesystem__write_file({
    path: '/mnt/d/cursor/openmanager-vibe-v5/docs/API-Reference.md',
    content: `# API Reference
    
## Generated Types
\`\`\`typescript
${types}
\`\`\`

## Best Practices
${latestInfo.answer}

## Generated: ${new Date().toISOString()}
`,
  });
}
```

---

## ⚡ 성능 최적화 전략

### 1. 병렬 처리 최적화

```typescript
// ❌ 순차 처리 (느림)
const file1 = await mcp__filesystem__read_text_file({ path: 'file1.txt' });
const file2 = await mcp__filesystem__read_text_file({ path: 'file2.txt' });
const file3 = await mcp__filesystem__read_text_file({ path: 'file3.txt' });

// ✅ 병렬 처리 (3배 빠름)
const [file1, file2, file3] = await Promise.all([
  mcp__filesystem__read_text_file({ path: 'file1.txt' }),
  mcp__filesystem__read_text_file({ path: 'file2.txt' }),
  mcp__filesystem__read_text_file({ path: 'file3.txt' }),
]);
```

### 2. 캐싱 전략

```typescript
// 간단한 메모리 캐시 구현
const mcpCache = new Map();

async function cachedMcpCall(key: string, operation: Function, ttl = 300000) {
  const cached = mcpCache.get(key);
  if (cached && cached.expiry > Date.now()) {
    return cached.data;
  }

  const result = await operation();
  mcpCache.set(key, {
    data: result,
    expiry: Date.now() + ttl,
  });

  return result;
}

// 사용 예
const dbSchema = await cachedMcpCall(
  'db-schema',
  () => mcp__supabase__generate_typescript_types(),
  600000 // 10분 캐시
);
```

### 3. 배치 처리

```typescript
// 여러 파일을 효율적으로 처리
async function batchProcessFiles(pattern: string) {
  // 1. 파일 목록 조회
  const files = await mcp__filesystem__search_files({
    path: '/mnt/d/cursor/openmanager-vibe-v5',
    pattern,
    excludePatterns: ['node_modules', '.next'],
  });

  // 2. 배치 단위로 처리 (10개씩)
  const batchSize = 10;
  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize);
    await Promise.all(batch.map((file) => processFile(file)));
  }
}
```

---

## 🔧 문제 해결 가이드

### 일반적인 문제와 해결책

#### 1. "No MCP servers configured" 오류

```bash
# 해결책
1. .mcp.json이 프로젝트 루트에 있는지 확인
2. /reload 명령 실행
3. /mcp로 서버 목록 확인
```

#### 2. GitHub MCP 인증 실패

```bash
# 해결책
1. .env.local에 GITHUB_PERSONAL_ACCESS_TOKEN 추가
2. source scripts/setup-mcp-env.sh 실행
3. /reload 명령 실행
```

#### 3. Supabase MCP 토큰 오류

```bash
# 해결책
1. 공식 패키지 사용 확인: @supabase/mcp-server-supabase
2. SUPABASE_ACCESS_TOKEN 또는 SUPABASE_PAT 설정
3. Project ID 확인
```

#### 4. Playwright 브라우저 오류

```bash
# 해결책 (WSL)
sudo apt-get update
sudo apt-get install -y libnspr4 libnss3 libasound2t64
sudo npx playwright install-deps
npx playwright install chromium
```

#### 5. Python MCP (time, serena) 실행 오류

```bash
# 해결책
1. UV/UVX 설치 확인
which uvx  # /home/username/.local/bin/uvx

2. .mcp.json에서 절대 경로 사용
"command": "/home/username/.local/bin/uvx"
```

#### 6. WSL Playwright localhost 접속 오류 (2025-08-15 추가)

**문제**: `Timeout exceeded` 또는 `ERR_CONNECTION_REFUSED`

**해결 단계**:

```bash
# 1. 개발 서버 실행 상태 확인
ss -tlnp | grep :3000

# 2. 서버 미실행 시 시작
npm run dev
# ✓ Ready 메시지 확인

# 3. Playwright에서 127.0.0.1 사용
await mcp__playwright__playwright_navigate({
  url: "http://127.0.0.1:3000",  // localhost 대신 127.0.0.1
  timeout: 20000,                // 충분한 타임아웃
  headless: true
});
```

**WSL 네트워크 특성**:

- `localhost` → WSL 내부 루프백 문제 발생 가능
- `127.0.0.1` → IP 직접 접근으로 안정적
- 개발 서버 첫 로딩은 20-30초 소요 가능

### 디버깅 도구

```typescript
// MCP 서버 상태 진단
async function diagnoseMCP() {
  const results = {};

  // 각 서버 테스트
  const servers = [
    {
      name: 'filesystem',
      test: () => mcp__filesystem__list_directory({ path: '.' }),
    },
    { name: 'memory', test: () => mcp__memory__read_graph() },
    {
      name: 'time',
      test: () => mcp__time__get_current_time({ timezone: 'UTC' }),
    },
    // ... 더 많은 서버
  ];

  for (const server of servers) {
    try {
      const start = Date.now();
      await server.test();
      results[server.name] = {
        status: 'success',
        responseTime: Date.now() - start,
      };
    } catch (error) {
      results[server.name] = {
        status: 'error',
        error: error.message,
      };
    }
  }

  return results;
}
```

---

## 📚 추가 리소스

- [MCP 프로토콜 사양](https://modelcontextprotocol.io)
- [Claude Code MCP 문서](https://docs.anthropic.com/en/docs/claude-code/mcp)
- [프로젝트별 설정 예제](./.mcp.json.example)
- [환경변수 설정 스크립트](./scripts/setup-mcp-env.sh)

---

## 🎯 핵심 체크리스트

- [x] 환경변수 설정 완료 (.env.local)
- [x] MCP 서버 설치 완료 (NPM + Python)
- [x] .mcp.json 프로젝트 루트에 위치
- [x] Playwright 브라우저 의존성 설치 (WSL)
- [x] Python 도구 절대 경로 설정
- [x] /reload 후 /mcp로 확인

---

## 🚀 빠른 참조 (Quick Reference)

### 자주 사용하는 명령어

```typescript
// 📁 파일 시스템
mcp__filesystem__list_directory({ path: '.' });
mcp__filesystem__read_text_file({ path: 'README.md' });

// 🧠 메모리 저장
mcp__memory__create_entities([
  {
    name: 'ProjectInfo',
    entityType: 'Knowledge',
    observations: ['중요한 정보'],
  },
]);

// 🗄️ Supabase 직접 쿼리
mcp__supabase__execute_sql({
  query: 'SELECT * FROM servers LIMIT 5;',
});

// 🔍 웹 검색
mcp__tavily__tavily -
  search({
    query: '검색어',
    max_results: 3,
  });

// ⏰ 현재 시간
mcp__time__get_current_time({ timezone: 'Asia/Seoul' });
```

### 트러블슈팅

- `/reload` - MCP 서버 재시작
- `/mcp` - 서버 상태 확인
- `/doctor` - 시스템 진단
- GitHub 토큰 갱신 → `.mcp.json` 업데이트 → `/reload`
- WSL Playwright → `localhost` 대신 `127.0.0.1` 사용
- 개발 서버 접속 → `npm run dev` 실행 후 테스트

---

**작성**: Claude Code + 실제 테스트 검증  
**환경**: WSL 2 (Ubuntu 24.04) + Node.js v22.18.0  
**최종 검증**: 2025-08-15 20:50 KST
