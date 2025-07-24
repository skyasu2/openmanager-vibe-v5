# 🎯 MCP 통합 아키텍처 가이드

> **최종 업데이트**: 2025년 7월 24일  
> **문서 목적**: OpenManager VIBE v5의 3-Tier MCP 아키텍처 완전 정리

## 📋 목차

1. [개요](#개요)
2. [3-Tier MCP 아키텍처](#3-tier-mcp-아키텍처)
3. [로컬 개발용 MCP](#1-로컬-개발용-mcp)
4. [Google Cloud VM 운영용 MCP](#2-google-cloud-vm-운영용-mcp)
5. [Vercel 배포 테스트용 MCP](#3-vercel-배포-테스트용-mcp)
6. [MCP 활용 시나리오](#mcp-활용-시나리오)
7. [문제 해결](#문제-해결)

## 🌟 개요

OpenManager VIBE v5는 **3가지 레벨의 MCP(Model Context Protocol)** 서버를 운영하며, 각각 명확한 목적과 사용 범위를 가지고 있습니다.

```
┌─────────────────────────────────────────────────────────────┐
│                   MCP 3-Tier Architecture                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1️⃣ 로컬 개발 MCP     2️⃣ GCP VM 운영 MCP    3️⃣ Vercel 테스트 MCP │
│       ↓                    ↓                    ↓           │
│  Claude Code에서      AI 어시스턴트가      개발자가 배포된  │
│  직접 사용           프로덕션에서 사용     환경 직접 테스트  │
└─────────────────────────────────────────────────────────────┘
```

## 🏗️ 3-Tier MCP 아키텍처

### 아키텍처 다이어그램

```
┌──────────────────────────────────────────────────────────────┐
│                        개발자 환경                            │
│  ┌─────────────────┐                                         │
│  │  Claude Code    │───► 1️⃣ 로컬 MCP (.mcp.json)             │
│  │  (개발 도구)    │     • filesystem                        │
│  └─────────────────┘     • github                            │
│                          • memory                            │
│                          • sequential-thinking               │
└──────────────────────────────────────────────────────────────┘
                                │
┌──────────────────────────────────────────────────────────────┐
│                      프로덕션 환경                            │
│  ┌─────────────────┐                                         │
│  │  AI Assistant   │───► 2️⃣ GCP VM MCP (104.154.205.25)      │
│  │  (운영 시스템)  │     • 컨텍스트 관리                      │
│  └─────────────────┘     • RAG 통합                          │
│                          • 자연어 처리                        │
└──────────────────────────────────────────────────────────────┘
                                │
┌──────────────────────────────────────────────────────────────┐
│                        배포 환경                              │
│  ┌─────────────────┐                                         │
│  │  개발자 도구    │───► 3️⃣ Vercel MCP (/api/mcp)            │
│  │  (테스트용)     │     • 시스템 상태 확인                   │
│  └─────────────────┘     • 환경변수 검증                      │
│                          • 헬스체크                           │
└──────────────────────────────────────────────────────────────┘
```

## 1️⃣ 로컬 개발용 MCP

### 개요

Claude Code에서 직접 사용하는 MCP 서버들로, 로컬 개발 환경에서 파일 작업, GitHub 통합, 메모리 관리, 복잡한 문제 분석을 수행합니다.

### 설정 파일

`.mcp.json`

### 사용 가능한 서버

#### 📁 filesystem

```bash
# 파일 읽기
mcp__filesystem__read_file("/path/to/file")

# 파일 쓰기
mcp__filesystem__write_file("/path/to/file", "content")

# 디렉토리 목록
mcp__filesystem__list_directory("/path/to/dir")

# 파일 검색
mcp__filesystem__search_files("/path", "pattern")
```

**활용 예시:**

- 프로젝트 파일 분석
- 코드 생성 및 수정
- 설정 파일 관리
- 문서 작성 및 업데이트

#### 🐙 github

```bash
# 이슈 생성
mcp__github__create_issue("owner", "repo", "title", "body")

# PR 생성
mcp__github__create_pull_request("owner", "repo", {
  title: "feat: 새 기능",
  head: "feature-branch",
  base: "main",
  body: "설명..."
})

# 파일 조회
mcp__github__get_file_contents("owner", "repo", "path/to/file")

# 이슈 목록
mcp__github__list_issues("owner", "repo")
```

**활용 예시:**

- 버그 리포트 자동 생성
- PR 생성 및 관리
- 코드 리뷰 자동화
- 이슈 트래킹

#### 🧠 memory

```bash
# 엔티티 생성 (정보 저장)
mcp__memory__create_entities([{
  name: "UserAuthFlow",
  entityType: "Process",
  observations: ["OAuth 로그인 플로우", "토큰 관리"]
}])

# 정보 검색
mcp__memory__search_nodes("인증")

# 관계 생성
mcp__memory__create_relations([{
  from: "UserAuthFlow",
  to: "SecurityModule",
  relationType: "uses"
}])
```

**활용 예시:**

- 프로젝트 구조 이해 저장
- 중요 정보 캐싱
- 컨텍스트 관리
- 지식 그래프 구축

#### 🤔 sequential-thinking

```bash
# 복잡한 문제 단계별 분석
mcp__sequential-thinking__sequentialthinking({
  thought: "로그인 버그 분석: 1단계 - 증상 파악",
  nextThoughtNeeded: true,
  thoughtNumber: 1,
  totalThoughts: 5
})
```

**활용 예시:**

- 복잡한 버그 디버깅
- 아키텍처 설계 분석
- 성능 최적화 계획
- 보안 취약점 분석

### 설치 및 설정

```bash
# 프로젝트 레벨 설치
claude mcp add filesystem -s project npx -y @modelcontextprotocol/server-filesystem .
claude mcp add github -s project -e GITHUB_TOKEN="${GITHUB_TOKEN}" npx -y @modelcontextprotocol/server-github
claude mcp add memory -s project npx -y @modelcontextprotocol/server-memory
claude mcp add sequential-thinking -s project npx -y @modelcontextprotocol/server-sequential-thinking

# 환경변수 설정 (.env.local)
GITHUB_TOKEN=ghp_YOUR_GITHUB_TOKEN_HERE
```

## 2️⃣ Google Cloud VM 운영용 MCP

### 개요

AI 어시스턴트가 프로덕션 환경에서 사용하는 MCP 서버로, Google Cloud VM에서 독립적으로 실행됩니다.

### 서버 정보

- **URL**: `http://104.154.205.25:10000`
- **용도**: 프로덕션 AI 기능, 컨텍스트 관리, RAG 통합

### 주요 기능

#### 🌐 컨텍스트 관리

```typescript
// CloudContextLoader 통해 접근
const loader = CloudContextLoader.getInstance();

// RAG 엔진용 컨텍스트 조회
const context = await loader.queryMCPContextForRAG('사용자 인증', {
  maxFiles: 10,
  includeSystemContext: true,
  pathFilters: ['src/auth', 'src/lib/auth'],
});

// 자연어 처리용 컨텍스트
const nlpContext = await loader.getContextForNLP(
  '로그인 에러 해결',
  'intent_analysis'
);
```

#### 📊 시스템 리소스

- `file://project-root` - 프로젝트 구조
- `file://src-structure` - 소스 코드 구조
- `file://docs-structure` - 문서 구조

#### 🏥 헬스체크

```bash
# 헬스체크 엔드포인트
GET http://104.154.205.25:10000/health

# 상세 헬스체크
GET http://104.154.205.25:10000/health/detailed
```

### 활용 예시

1. **AI 어시스턴트 컨텍스트 제공**
   - 사용자 질문에 대한 관련 파일 자동 검색
   - 프로젝트 구조 이해 기반 답변
   - 코드베이스 전체 분석

2. **RAG 엔진 통합**
   - 벡터 검색과 MCP 컨텍스트 결합
   - 더 정확한 AI 응답 생성
   - 실시간 컨텍스트 업데이트

3. **자연어 처리 지원**
   - 의도 분석 (intent_analysis)
   - 엔티티 추출 (entity_extraction)
   - 감정 분석 (sentiment_analysis)
   - 명령어 파싱 (command_parsing)

## 3️⃣ Vercel 배포 테스트용 MCP

### 개요

개발자가 배포된 환경을 직접 테스트하고 디버깅할 수 있는 MCP 서버입니다.

### 기술 스택

- **패키지**: `mcp-handler` v1.0.1
- **런타임**: Vercel Edge Runtime
- **엔드포인트**: `/api/mcp`
- **프로토콜**: HTTP POST (표준 MCP over HTTP)

### 사용 방법

⚠️ **중요**: Vercel MCP는 표준 MCP 도구로 호출됩니다. `mcp__vercel__` 접두사를 사용하지 않습니다.

#### 올바른 사용법

```bash
# Claude Code 또는 다른 MCP 클라이언트에서:
# 1. Vercel 배포 URL을 MCP 서버로 추가
# 2. 도구는 표준 MCP 형식으로 호출

# 예시:
tools.call("get_system_status")
tools.call("check_env_config")
tools.call("health_check", { endpoint: "/api/health" })
```

### 사용 가능한 도구

#### 📊 get_system_status

시스템의 현재 상태를 확인합니다.

```javascript
// 응답 예시
{
  environment: "production",
  vercelEnv: "production",
  timestamp: "2025-07-24T10:00:00Z",
  uptime: "Edge Runtime",
  region: "icn1"
}
```

#### 🔑 check_env_config

환경변수 설정 상태를 확인합니다.

```javascript
// 응답 예시
{
  NODE_ENV: "production",
  VERCEL_ENV: "production",
  GOOGLE_AI_ENABLED: "true",
  GCP_VM_IP_CONFIGURED: true,
  SUPABASE_CONFIGURED: true,
  REDIS_CONFIGURED: true
}
```

#### 🧪 health_check

지정된 API 엔드포인트의 상태를 확인합니다.

```javascript
// 파라미터
{
  endpoint: '/api/health';
} // 기본값: "/api/health"

// 응답 예시
('✅ 헬스체크 결과:\nStatus: 200\nResponse: {"status": "healthy"}');
```

#### 📝 get_recent_logs

최근 로그를 조회합니다. (현재 구현 예정)

```javascript
// 파라미터
{
  limit: 10;
} // 1-100 사이, 기본값: 10

// 응답 예시
('📝 최근 10개 로그:\n(로그 조회 기능은 추후 구현 예정)');
```

#### 🔍 get_project_info

프로젝트의 상세 정보를 조회합니다.

```javascript
// 응답 예시
{
  name: "OpenManager VIBE v5",
  description: "AI 기반 서버 모니터링 플랫폼",
  version: "5.62.3",
  techStack: [
    "Next.js 15",
    "TypeScript",
    "Supabase Auth",
    "Google AI (Gemini)",
    "Redis (Upstash)",
    "Vercel Edge Runtime"
  ],
  mcpArchitecture: {
    development: "Vercel MCP (이 서버)",
    production: "GCP VM MCP (104.154.205.25:10000)"
  }
}
```

#### 💡 debug_deployment

배포 환경 문제에 대한 디버깅 가이드를 제공합니다.

```javascript
// 파라미터
{
  issue: '로그인 리다이렉트 실패';
}

// 응답 예시
('OpenManager VIBE v5 배포 환경 디버깅 가이드:\n\n문제: 로그인 리다이렉트 실패\n\n체크리스트:\n1. 환경변수 설정 확인...');
```

### 활용 시나리오

#### 1. 배포 직후 검증

```bash
# 1. 시스템 상태 확인
get_system_status()
# → 배포 환경, 리전, 타임스탬프 확인

# 2. 환경변수 검증
check_env_config()
# → 필수 서비스 연결 상태 확인

# 3. API 헬스체크
health_check({ endpoint: "/api/auth/session" })
# → 인증 API 작동 확인
```

#### 2. 문제 디버깅

```bash
# 1. 문제 분석 가이드
debug_deployment({ issue: "OAuth 콜백 실패" })
# → 단계별 디버깅 체크리스트 제공

# 2. 시스템 상태 확인
get_system_status()
# → 현재 환경 정보 파악

# 3. 환경변수 확인
check_env_config()
# → OAuth 관련 설정 검증
```

#### 3. 프로덕션 모니터링

```bash
# 1. 프로젝트 정보 확인
get_project_info()
# → 버전, 기술 스택, MCP 아키텍처 확인

# 2. 헬스체크 수행
health_check({ endpoint: "/api/system/status" })
# → 시스템 상태 API 확인
```

### 구현 세부사항

#### mcp-handler 설정

```javascript
// /api/mcp/route.ts
import { createMcpHandler } from 'mcp-handler';

const handler = createMcpHandler(
  server => {
    // 도구 등록
    server.tool('get_system_status', '설명', {}, handler);
  },
  {
    capabilities: {
      tools: { listChanged: true },
    },
  },
  { basePath: '/api' }
);

export { handler as GET, handler as POST };
```

#### Vercel 배포 설정

- Edge Runtime 사용으로 빠른 응답
- 리전: `icn1` (서울)
- 캐싱: 헬스체크 응답 캐싱 가능
- 환경변수: `.env.local`에서 관리

## 🎯 MCP 활용 시나리오

### 시나리오 1: 전체 스택 개발

```bash
# 1. 로컬에서 코드 작성 (로컬 MCP)
mcp__filesystem__read_file("/src/app/auth/login/page.tsx")
mcp__filesystem__write_file("/src/app/auth/login/page.tsx", "새 코드...")

# 2. GitHub에 커밋 (로컬 MCP)
mcp__github__create_pull_request("owner", "repo", {...})

# 3. 배포 후 테스트 (Vercel MCP 도구 사용)
# 참고: Vercel MCP 서버에 연결 후 표준 도구 호출
health_check({ endpoint: "/api/auth/login" })
get_system_status()

# 4. AI 어시스턴트가 컨텍스트 활용 (GCP VM MCP)
# CloudContextLoader가 자동으로 처리
```

### 시나리오 2: 버그 디버깅

```bash
# 1. 문제 분석 (로컬 MCP)
mcp__sequential-thinking__sequentialthinking({
  thought: "로그인 버그 분석 시작",
  nextThoughtNeeded: true,
  thoughtNumber: 1,
  totalThoughts: 5
})

# 2. 관련 정보 저장 (로컬 MCP)
mcp__memory__create_entities([{
  name: "LoginBug2025",
  entityType: "Issue",
  observations: ["OAuth 리다이렉트 실패", "세션 유지 안됨"]
}])

# 3. 배포 환경 확인 (Vercel MCP 도구 사용)
debug_deployment({ issue: "OAuth 리다이렉트 실패" })

# 4. 이슈 생성 (로컬 MCP)
mcp__github__create_issue("owner", "repo",
  "버그: OAuth 로그인 리다이렉트 실패",
  "상세 설명..."
)
```

### 시나리오 3: AI 어시스턴트 활용

```javascript
// AI 어시스턴트가 사용자 질문 처리
const userQuery = '로그인 기능 어떻게 구현되어 있나요?';

// 1. GCP VM MCP를 통해 컨텍스트 수집
const context = await CloudContextLoader.getInstance().queryMCPContextForRAG(
  userQuery,
  {
    maxFiles: 10,
    pathFilters: ['src/auth', 'src/app/auth'],
  }
);

// 2. RAG 엔진과 결합하여 답변 생성
const response = await generateAIResponse(userQuery, context);
```

## 🔧 문제 해결

### 로컬 MCP 연결 문제

```bash
# 상태 확인
/mcp

# 서버 재시작
claude mcp restart --all

# 디버그 모드
claude --mcp-debug
```

### GCP VM MCP 연결 실패

```javascript
// CloudContextLoader 상태 확인
const status = await CloudContextLoader.getInstance().getIntegratedStatus();

console.log(status.mcpServer);
// → { status: 'online'|'offline', responseTime: 100 }
```

### Vercel MCP 접근 불가

```bash
# 1. 배포 상태 확인
vercel logs

# 2. 환경변수 확인
vercel env ls

# 3. Edge Runtime 호환성 확인
# /api/mcp/route.ts가 export const runtime = 'edge' 포함하는지 확인
```

## 📝 Best Practices

1. **용도에 맞는 MCP 선택**
   - 로컬 개발: 로컬 MCP
   - AI 기능: GCP VM MCP
   - 배포 테스트: Vercel MCP

2. **보안 고려사항**
   - GitHub 토큰은 환경변수로 관리
   - GCP VM MCP는 IP 화이트리스트 설정
   - Vercel MCP는 인증된 사용자만 접근

3. **성능 최적화**
   - 로컬 MCP: 필요한 도구만 활성화
   - GCP VM MCP: 캐싱 활용 (Redis)
   - Vercel MCP: Edge Runtime 최적화

4. **모니터링**
   - 각 MCP 서버의 헬스체크 정기 실행
   - 응답 시간 및 에러율 추적
   - 사용량 모니터링

## 🔗 관련 문서

- [MCP 빠른 사용 가이드](./mcp-quick-guide.md)
- [Claude Code MCP 설정](./claude-code-mcp-setup-2025.md)
- [AI 시스템 통합 가이드](./ai-system-unified-guide.md)
- [CloudContextLoader 상세](../src/services/mcp/CloudContextLoader.ts)

---

**참고**: 이 문서는 OpenManager VIBE v5의 MCP 아키텍처를 완전히 이해하고 활용하기 위한 통합 가이드입니다. 각 MCP 서버는 독립적으로 운영되며, 명확한 책임과 범위를 가지고 있습니다.
