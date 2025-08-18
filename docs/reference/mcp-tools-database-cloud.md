# 🐘 MCP 데이터베이스 & 클라우드 도구 레퍼런스

> **2025년 8월 18일 기준**  
> **환경**: Claude Code v1.0.81 + MCP 서버  
> **카테고리**: GitHub API + Supabase DB + Google Cloud

## 📋 목차

1. [개요](#개요)
2. [GitHub MCP 도구](#github-mcp-도구)
3. [Supabase MCP 도구](#supabase-mcp-도구)
4. [GCP MCP 도구](#gcp-mcp-도구)
5. [실전 활용 예시](#실전-활용-예시)
6. [문제 해결](#문제-해결)

---

## 🎯 개요

GitHub API, Supabase 데이터베이스, Google Cloud Platform을 완전 통합한 **30개 핵심 도구**를 제공합니다.

### 📊 도구 개요

| 서버 | 도구 수 | 주요 기능 |
|------|---------|-----------|
| `github` | 12개 | Git/API 완전 통합 |
| `supabase` | 10개 | PostgreSQL 관리 |
| `gcp` | 8개 | 클라우드 인프라 |

**총 도구 수**: 30개  
**응답 속도**: 평균 100-500ms

---

## 🐙 GitHub MCP 도구

**목적**: GitHub API 완전 통합

### `mcp__github__search_repositories`

**저장소 검색**

```typescript
await mcp__github__search_repositories({
  query: string,      // 검색 쿼리
  perPage?: number,   // 페이지당 결과 수 (기본: 30)
  page?: number       // 페이지 번호 (기본: 1)
});

// 예시
await mcp__github__search_repositories({
  query: 'openmanager user:skyasu2',
  perPage: 10
});

// 반환값 예시
{
  "total_count": 1,
  "items": [{
    "name": "openmanager-vibe-v5",
    "full_name": "skyasu2/openmanager-vibe-v5",
    "description": "AI 기반 실시간 서버 모니터링",
    "stargazers_count": 0,
    "language": "TypeScript"
  }]
}
```

### `mcp__github__get_file_contents`

**파일 내용 조회**

```typescript
await mcp__github__get_file_contents({
  owner: string,   // 소유자
  repo: string,    // 저장소명
  path: string,    // 파일 경로
  ref?: string     // 브랜치/태그 (기본: main)
});

// 예시
await mcp__github__get_file_contents({
  owner: 'skyasu2',
  repo: 'openmanager-vibe-v5',
  path: 'README.md'
});
```

### `mcp__github__create_issue`

**이슈 생성**

```typescript
await mcp__github__create_issue({
  owner: string,
  repo: string,
  title: string,
  body?: string,
  labels?: string[],
  assignees?: string[]
});

// 예시
await mcp__github__create_issue({
  owner: 'skyasu2',
  repo: 'openmanager-vibe-v5',
  title: 'MCP 문서 통합 완료',
  body: '12개 서버 모두 정상 작동 확인',
  labels: ['documentation', 'enhancement']
});
```

### `mcp__github__create_pull_request`

**풀 리퀘스트 생성**

```typescript
await mcp__github__create_pull_request({
  owner: string,
  repo: string,
  title: string,
  head: string,    // 소스 브랜치
  base: string,    // 대상 브랜치
  body?: string
});

// 예시
await mcp__github__create_pull_request({
  owner: 'skyasu2',
  repo: 'openmanager-vibe-v5',
  title: 'MCP 도구 레퍼런스 추가',
  head: 'feature/mcp-reference',
  base: 'main',
  body: '12개 MCP 서버의 완전한 도구 레퍼런스 가이드 추가'
});
```

### 추가 GitHub 도구들

- `mcp__github__search_issues`: 이슈 검색
- `mcp__github__list_commits`: 커밋 목록 조회
- `mcp__github__get_pull_request_status`: PR 상태 조회
- `mcp__github__list_repositories`: 저장소 목록
- `mcp__github__get_repository`: 저장소 정보
- `mcp__github__list_issues`: 이슈 목록
- `mcp__github__update_issue`: 이슈 업데이트
- `mcp__github__create_branch`: 브랜치 생성

---

## 🐘 Supabase MCP 도구

**목적**: PostgreSQL 데이터베이스 완전 관리

### `mcp__supabase__execute_sql`

**SQL 직접 실행**

```typescript
await mcp__supabase__execute_sql({
  query: string  // SQL 쿼리
});

// 예시
await mcp__supabase__execute_sql({
  query: 'SELECT * FROM servers ORDER BY created_at DESC LIMIT 5;'
});

// 반환값: 쿼리 결과 (JSON 배열)
```

### `mcp__supabase__list_tables`

**테이블 목록 조회**

```typescript
await mcp__supabase__list_tables({
  schemas?: string[]  // 스키마 목록 (기본: ['public'])
});

// 예시
await mcp__supabase__list_tables({
  schemas: ['public', 'auth']
});

// 반환값 예시
{
  "tables": [
    {
      "schema": "public",
      "name": "servers",
      "columns": 8,
      "rows": 1234
    }
  ]
}
```

### `mcp__supabase__generate_typescript_types`

**TypeScript 타입 생성**

```typescript
await mcp__supabase__generate_typescript_types();

// 반환값: 자동 생성된 TypeScript 타입 정의
export interface Database {
  public: {
    Tables: {
      servers: {
        Row: {
          id: string;
          name: string;
          status: 'online' | 'offline';
          created_at: string;
        };
        Insert: {
          name: string;
          status?: 'online' | 'offline';
        };
        Update: {
          name?: string;
          status?: 'online' | 'offline';
        };
      };
    };
  };
}
```

### `mcp__supabase__list_migrations`

**마이그레이션 목록**

```typescript
await mcp__supabase__list_migrations();

// 반환값: 적용된 마이그레이션 목록
```

### `mcp__supabase__get_advisors`

**성능 권장사항**

```typescript
await mcp__supabase__get_advisors();

// 반환값: 데이터베이스 최적화 권장사항
```

### 추가 Supabase 도구들

- `mcp__supabase__apply_migration`: 마이그레이션 적용
- `mcp__supabase__get_logs`: 로그 조회
- `mcp__supabase__list_extensions`: PostgreSQL 확장 목록
- `mcp__supabase__list_branches`: 브랜치 목록 (개발용)
- `mcp__supabase__get_project_url`: 프로젝트 URL 조회

---

## ☁️ GCP MCP 도구

**목적**: Google Cloud Platform 통합

### `mcp__gcp__get_project_id`

**프로젝트 ID 조회**

```typescript
await mcp__gcp__get_project_id();

// 반환값 예시
{
  "project_id": "openmanager-free-tier"
}
```

### `mcp__gcp__list_instances`

**VM 인스턴스 목록**

```typescript
await mcp__gcp__list_instances({
  project?: string,  // 프로젝트 ID
  zone?: string      // 영역
});

// 예시
await mcp__gcp__list_instances({
  project: 'openmanager-free-tier',
  zone: 'asia-northeast3-a'
});

// 반환값 예시
{
  "instances": [{
    "name": "openmanager-vm",
    "status": "RUNNING",
    "machineType": "e2-micro",
    "zone": "asia-northeast3-a",
    "externalIP": "104.154.205.25"
  }]
}
```

### `mcp__gcp__query_logs`

**Cloud Logging 조회**

```typescript
await mcp__gcp__query_logs({
  project: string,
  filter: string,
  limit?: number
});

// 예시
await mcp__gcp__query_logs({
  project: 'openmanager-free-tier',
  filter: 'severity>=ERROR',
  limit: 50
});
```

### `mcp__gcp__query_metrics`

**Cloud Monitoring 메트릭 조회**

```typescript
await mcp__gcp__query_metrics({
  project: string,
  metric: string,
  startTime: string,
  endTime: string
});

// 예시
await mcp__gcp__query_metrics({
  project: 'openmanager-free-tier',
  metric: 'compute.googleapis.com/instance/cpu/utilization',
  startTime: '2025-08-18T00:00:00Z',
  endTime: '2025-08-18T23:59:59Z'
});
```

### 추가 GCP 도구들

- `mcp__gcp__start_instance`: VM 인스턴스 시작
- `mcp__gcp__stop_instance`: VM 인스턴스 중지
- `mcp__gcp__list_functions`: Cloud Functions 목록
- `mcp__gcp__set_project_id`: 프로젝트 ID 설정

---

## 🚀 실전 활용 예시

### 자동 GitHub 이슈 관리

```typescript
// 1. 기존 이슈 검색
const issues = await mcp__github__search_issues({
  query: 'repo:skyasu2/openmanager-vibe-v5 is:open label:bug'
});

// 2. 새 버그 이슈 생성
if (issues.items.length === 0) {
  await mcp__github__create_issue({
    owner: 'skyasu2',
    repo: 'openmanager-vibe-v5',
    title: '새 버그 발견: MCP 도구 연결 실패',
    body: '12개 MCP 서버 중 1개 서버 연결 실패\n\n**재현 방법:**\n1. Claude Code 시작\n2. MCP 서버 연결 시도\n3. 오류 메시지 확인',
    labels: ['bug', 'priority:high']
  });
}
```

### 데이터베이스 성능 모니터링

```typescript
// 1. 데이터베이스 상태 확인
const tables = await mcp__supabase__list_tables();

// 2. 성능 권장사항 확인
const advisors = await mcp__supabase__get_advisors();

// 3. 문제가 있을 경우 자동 최적화
if (advisors.length > 0) {
  for (const advice of advisors) {
    if (advice.type === 'index_missing') {
      await mcp__supabase__execute_sql({
        query: `CREATE INDEX IF NOT EXISTS idx_${advice.table}_${advice.column} ON ${advice.table}(${advice.column});`
      });
    }
  }
}
```

### GCP 인프라 자동 관리

```typescript
// 1. VM 상태 확인
const instances = await mcp__gcp__list_instances({
  project: 'openmanager-free-tier'
});

// 2. 중지된 인스턴스 자동 시작
for (const instance of instances.instances) {
  if (instance.status === 'TERMINATED') {
    await mcp__gcp__start_instance({
      project: 'openmanager-free-tier',
      zone: instance.zone,
      instance: instance.name
    });
    
    console.log(`✅ ${instance.name} 인스턴스 시작됨`);
  }
}

// 3. 로그 모니터링
const logs = await mcp__gcp__query_logs({
  project: 'openmanager-free-tier',
  filter: 'severity>=ERROR AND timestamp>"-1h"',
  limit: 10
});
```

---

## 🚨 문제 해결

### GitHub API 오류

**증상**: `API rate limit exceeded`

**해결책**:
```typescript
// 요청 빈도를 줄이고 캐시 활용
const cachedResult = cache.get('github_repos');
if (!cachedResult) {
  const result = await mcp__github__search_repositories({
    query: 'user:skyasu2',
    perPage: 10
  });
  cache.set('github_repos', result, 3600); // 1시간 캐시
}
```

### Supabase 연결 오류

**증상**: `Connection refused` 또는 `Authentication failed`

**해결책**:
```typescript
// 1. 프로젝트 상태 확인
const url = await mcp__supabase__get_project_url();

// 2. 데이터베이스 연결 테스트
try {
  await mcp__supabase__execute_sql({
    query: 'SELECT 1 as test;'
  });
  console.log('✅ 데이터베이스 연결 정상');
} catch (error) {
  console.error('❌ 데이터베이스 연결 실패:', error);
}
```

### GCP 권한 오류

**증상**: `Permission denied` 또는 `Insufficient authentication scopes`

**해결책**:
```typescript
// 1. 프로젝트 ID 확인
const project = await mcp__gcp__get_project_id();
console.log('현재 프로젝트:', project.project_id);

// 2. 다른 프로젝트로 전환 (필요시)
await mcp__gcp__set_project_id({
  project_id: 'openmanager-free-tier'
});
```

---

## 📚 관련 문서

- [MCP 파일시스템 & 메모리 도구](./mcp-tools-filesystem-memory.md)
- [MCP 웹 & 브라우저 도구](./mcp-tools-web-browser.md)
- [MCP AI & 유틸리티 도구](./mcp-tools-ai-utility.md)
- [Supabase 설정 가이드](../guides/auth-security-complete-setup.md)
- [GCP 배포 가이드](../gcp/gcp-complete-guide.md)

---

**💡 팁**: GitHub, Supabase, GCP를 조합하면 완전한 DevOps 자동화 워크플로우를 구축할 수 있습니다!