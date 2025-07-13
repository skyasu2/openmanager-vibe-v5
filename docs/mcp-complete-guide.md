# MCP (Model Context Protocol) 완전 가이드

## MCP(Model Context Protocol) 개요

MCP는 AI 어시스턴트와 외부 도구 간의 통신을 표준화하는 프로토콜입니다. AI 어시스턴트(Claude Code, Cursor 등)가 파일 시스템, 데이터베이스, API 등의 외부 리소스에 접근할 수 있게 해주는 플러그인 시스템입니다.

### 주요 특징
- **표준화된 통신**: JSON-RPC 기반 STDIO 통신
- **모듈식 아키텍처**: 필요한 기능만 선택적으로 활성화
- **보안**: 각 서버별 권한 및 접근 제어
- **확장성**: 커스텀 MCP 서버 개발 가능

## MCP 아키텍처 설명

OpenManager Vibe v5 프로젝트는 3가지 타입의 MCP 서버를 사용합니다:

### 1. 로컬 개발용 MCP (Development MCP)
- **용도**: Cursor IDE, Claude Code 등에서 로컬 개발 시 사용
- **위치**: 개발자의 로컬 환경
- **특징**: 
  - 코드 자동완성, 리팩토링, 문서 생성 등 개발 도구 기능
  - 로컬 파일 시스템에 직접 접근
  - 개발 생산성 향상을 위한 도구
  - Supabase 데이터베이스 직접 접근 및 관리

### 2. Vercel Dev Tools MCP (@vercel/mcp-adapter)
- **용도**: 로컬에서 Vercel에 배포된 앱의 상태 확인 및 개발
- **특징**:
  - Vercel에 배포된 애플리케이션과 로컬 개발 환경을 연결
  - 배포된 앱의 실시간 상태 모니터링
  - 디버깅 및 테스트를 위한 직접 접근
  - `VERCEL_AUTOMATION_BYPASS_SECRET`을 통한 보안 접근

### 3. AI Production MCP (Google Cloud VM)
- **용도**: 프로덕션 환경에서 AI 엔진과 Supabase RAG 엔진 통합
- **위치**: Google Cloud VM (http://104.154.205.25:10000)
- **특징**:
  - Supabase RAG 엔진과 협업하여 컨텍스트 기반 AI 응답 생성
  - 실시간 서버 모니터링 데이터 처리
  - NLP 기능: 의도 분석, 엔티티 추출, 감정 분석, 명령 파싱
  - 캐싱 및 성능 최적화
  - 30초/60초 타임아웃 설정으로 안정성 보장

### 아키텍처 다이어그램

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Development    │     │  Vercel Dev     │     │  Production     │
│     MCP         │     │  Tools MCP      │     │     MCP         │
│   (Local)       │     │ (@vercel/mcp)   │     │  (GCP VM)       │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                         │
         │                       │                         │
    개발 도구               배포 모니터링              AI 엔진 통합
    코드 지원               상태 확인                 RAG + NLP
         │                       │                         │
         └───────────────────────┴─────────────────────────┘
                                 │
                         OpenManager Vibe v5
                           애플리케이션
```

## 각 MCP 서버별 설정 가이드

### Supabase MCP

`@supabase/mcp-server-supabase`는 Supabase 데이터베이스와 직접 상호작용할 수 있게 해주는 MCP 서버입니다.

#### 주요 기능
- SQL 쿼리 실행 및 테이블 데이터 조회
- 데이터 삽입, 업데이트, 삭제
- 테이블 생성 및 수정, 인덱스 관리
- Realtime 구독 및 데이터베이스 변경 사항 모니터링
- RLS (Row Level Security) 정책 관리

#### 설정 방법

1. `.claude/mcp.json`에 추가:
```json
{
  "mcpServers": {
    "supabase": {
      "command": "node",
      "args": ["./node_modules/@supabase/mcp-server-supabase/dist/index.js"],
      "env": {
        "SUPABASE_URL": "${SUPABASE_URL}",
        "SUPABASE_SERVICE_ROLE_KEY": "${SUPABASE_SERVICE_ROLE_KEY}"
      }
    }
  }
}
```

2. 환경 변수 설정 (`.env.local`):
```bash
SUPABASE_URL=your-supabase-project-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Gemini CLI Bridge v2.0

`gemini-cli-bridge` v2.0은 Claude Code와 Gemini CLI 간의 양방향 호출 문제를 해결하는 적응적 MCP 서버입니다.

#### 주요 특징

- **스마트 컨텍스트 감지**: 호출 방향을 자동으로 감지 (Claude→Gemini, Gemini→Claude)
- **적응적 실행 전략**: Windows 네이티브/WSL/PowerShell 환경에 맞춰 최적화
- **자동 폴백 체인**: 한 방법 실패 시 다른 방법 자동 시도
- **디버깅 도구**: 현재 컨텍스트 상태 실시간 확인

#### 설정 방법

1. MCP 서버는 이미 설정됨 (`.claude/claude_workspace.json`)
2. Gemini CLI 로그인만 필요:
```bash
gemini login
```

#### 사용 가능한 도구

- `gemini_chat`: 기본 모델로 채팅
- `gemini_chat_flash`: Flash 모델 (빠르고 효율적)
- `gemini_chat_pro`: Pro 모델 (강력한 추론)
- `gemini_stats`: 사용량 통계 확인
- `gemini_clear`: 컨텍스트 초기화
- `gemini_context_info`: 컨텍스트 정보 확인 (디버깅용)

### 기타 MCP 서버들

#### Filesystem MCP
파일 시스템 접근 기능 제공:
```json
{
  "filesystem": {
    "command": "node",
    "args": ["./node_modules/@modelcontextprotocol/server-filesystem/dist/index.js"],
    "env": { "ALLOWED_DIRECTORIES": "/mnt/d/cursor/openmanager-vibe-v5" }
  }
}
```

#### GitHub MCP
GitHub 저장소 통합:
```json
{
  "github": {
    "command": "node",
    "args": ["./node_modules/@modelcontextprotocol/server-github/dist/index.js"],
    "env": { "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}" }
  }
}
```

#### Memory MCP
지식 그래프 기반 메모리 관리:
```json
{
  "memory": {
    "command": "node",
    "args": ["./node_modules/@modelcontextprotocol/server-memory/dist/index.js"]
  }
}
```

#### Brave Search MCP
웹 검색 기능:
```json
{
  "brave-search": {
    "command": "node",
    "args": ["./node_modules/@modelcontextprotocol/server-brave-search/dist/index.js"],
    "env": { "BRAVE_API_KEY": "${BRAVE_API_KEY}" }
  }
}
```

## 사용 방법 및 예제

### Supabase MCP 사용 예제

#### 테이블 조회
```sql
-- 모든 서버 목록 조회
SELECT * FROM servers;

-- 활성 서버만 조회
SELECT * FROM servers WHERE status = 'active';
```

#### 데이터 분석
```sql
-- 서버별 평균 CPU 사용률
SELECT server_id, AVG(cpu_usage) as avg_cpu
FROM metrics
GROUP BY server_id;
```

#### 실시간 모니터링
```sql
-- 최근 5분간 알림
SELECT * FROM alerts
WHERE created_at > NOW() - INTERVAL '5 minutes'
ORDER BY created_at DESC;
```

### Gemini CLI Bridge v2.0 사용 예제

#### Claude Code에서 MCP 도구 사용
```typescript
// 컨텍스트 정보 확인
mcp_gemini_cli_bridge_gemini_context_info()

// 기본 채팅
mcp_gemini_cli_bridge_gemini_chat("코드 리뷰 요청")

// Flash 모델 (빠름)
mcp_gemini_cli_bridge_gemini_chat_flash("간단한 질문")

// Pro 모델 (고품질)
mcp_gemini_cli_bridge_gemini_chat_pro("복잡한 분석 요청")

// 사용량 확인
mcp_gemini_cli_bridge_gemini_stats()
```

#### 터미널에서 직접 사용
```bash
# 파일 분석
cat src/app/page.tsx | gemini -p "이 코드 리뷰해주세요"

# Git 변경사항 리뷰
git diff | gemini -p "변경사항 간단히 요약"

# 사용량 확인
gemini /stats
```

### Claude Code에서 MCP 테스트
- `@filesystem` - 파일 시스템 접근
- `@github` - GitHub 저장소 정보
- `@memory` - 대화 기억/검색
- `@supabase` - 데이터베이스 쿼리

## 문제 해결 가이드

### 일반적인 문제

#### 1. MCP 프로세스가 실행되지 않음
**증상**: `ps aux | grep modelcontextprotocol` 명령 실행 시 프로세스 없음

**해결책**:
- Claude Code 완전 재시작
- 환경변수 확인
- MCP 설정 파일 검증

#### 2. 환경변수 미설정
**증상**: API 키 관련 오류 발생

**해결책**:
```bash
# 시스템 환경변수 설정
export GITHUB_TOKEN="your-github-pat"
export BRAVE_API_KEY="your-brave-api-key"
export SUPABASE_URL="your-supabase-url"
export SUPABASE_SERVICE_ROLE_KEY="your-supabase-key"
```

### Supabase MCP 문제

#### 1. 연결 실패
**원인**: 잘못된 인증 정보 또는 네트워크 문제

**해결책**:
- Service Role Key 확인
- Supabase URL 검증
- 네트워크 연결 확인

#### 2. 쿼리 타임아웃
**원인**: 대용량 쿼리 또는 복잡한 조인

**해결책**:
- 쿼리 최적화
- 인덱스 추가
- 페이지네이션 적용

### Gemini CLI Bridge v2.0 문제 해결

#### 1. 컨텍스트 감지 문제
**원인**: 호출 환경을 정확히 인식하지 못함

**해결책**:
```typescript
// 컨텍스트 정보 확인
mcp_gemini_cli_bridge_gemini_context_info()

// 디버그 모드 활성화
process.env.GEMINI_DEBUG = 'true'
```

#### 2. Windows/WSL 환경에서 타임아웃 문제
**원인**: PowerShell 경로 또는 환경 설정 문제

**해결책**:
- v2.0에서는 자동 폴백 체인으로 해결됨
- Windows 네이티브 환경 자동 감지
- 플랫폼별 최적화된 실행 전략

#### 3. 인증 문제
**해결책**:
```bash
# Gemini CLI 재인증
gemini login

# 인증 상태 확인
gemini --version
```

## 환경별 설정

### 로컬 개발
- 모든 MCP 타입 사용 가능
- 개발 효율성 최대화
- 디버깅 및 테스트 도구 활성화

### Vercel 배포
- Production MCP만 활성화
- Vercel Dev Tools MCP로 원격 접근 가능
- 보안 및 성능 최적화

### 프로덕션 환경
- GCP VM의 AI Production MCP 사용
- API 엔드포인트:
  - `GET/POST /api/mcp/context-integration` - MCP + RAG 통합
  - `GET/POST /api/mcp/context-integration/health` - 헬스체크
  - `GET/POST /api/mcp/context-integration/sync` - RAG 동기화

## 보안 주의사항

### 1. 인증 정보 보호
- Service Role Key는 절대 클라이언트 코드에 노출하지 마세요
- OAuth 인증 정보를 Git에 커밋하지 마세요
- `.gitignore`에 추가: `/.gemini/`, `.env.local`

### 2. 프로덕션 보안
- 프로덕션 환경에서는 RLS 정책을 반드시 설정
- 민감한 데이터 쿼리 시 주의
- DDL 작업은 주의해서 실행

### 3. MCP 서버 신뢰 설정
- 기본적으로 `"trust": false` 유지
- 신뢰할 수 있는 서버만 `true`로 설정
- 권한을 최소한으로 제한

## 모니터링 및 최적화

### 성능 모니터링
```bash
# MCP 서버 상태 확인
npm run mcp:status

# 메모리 사용량 확인
npm run memory:check

# 헬스체크
npm run health-check
```

### 토큰 사용 최적화 (Gemini)
```bash
# 사용량 확인
gemini /stats

# 대화 압축
gemini /compress

# 컨텍스트 초기화
gemini /clear

# 중요 정보 저장
gemini /memory add "프로젝트 핵심 정보"
```

## 권장사항

### 1. 초기 설정
- 필요한 MCP 서버만 활성화
- 환경변수를 안전하게 관리
- 정기적으로 MCP 서버 업데이트

### 2. 개발 워크플로우
- 로컬 개발 시 모든 MCP 활용
- 테스트 데이터로 기능 검증
- 프로덕션 배포 전 권한 검토

### 3. 문제 해결
- MCP 서버 로그 모니터링
- 에러 발생 시 환경변수 먼저 확인
- 네트워크 연결 상태 점검

## 참고 자료

- [MCP 공식 문서](https://modelcontextprotocol.com)
- [Supabase MCP Server](https://github.com/supabase/mcp-server-supabase)
- [Gemini CLI Bridge v2.0 가이드](./gemini-cli-bridge-v2-guide.md)
- [Google Gemini CLI](https://github.com/google-gemini/gemini-cli)
- [Claude Code MCP 설정](./claude-code-mcp-setup.md)

---

이 가이드는 OpenManager Vibe v5 프로젝트의 MCP 설정 및 사용에 대한 완전한 참조 문서입니다. 지속적으로 업데이트되며, 새로운 MCP 서버가 추가되거나 기능이 변경될 때마다 반영됩니다.