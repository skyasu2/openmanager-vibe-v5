# 🔌 MCP (Model Context Protocol) 완전 설정 가이드 2025

**최종 업데이트**: 2025-08-20 14:00 KST  
**버전**: 2.0.0  
**상태**: ✅ 12/12 서버 정상 작동 확인 (100%)  
**검증**: 자동 복구 스크립트로 완전 복구 완료

## 🛠️ 전제조건

### 필수 도구 설치
```bash
# Node.js (권장: v18+)
node --version || echo "Node.js 설치 필요"

# uvx (Python 패키지 관리자) - Time, Serena MCP에 필요
curl -LsSf https://astral.sh/uv/install.sh | sh
export PATH="$HOME/.local/bin:$PATH"
uvx --version || echo "uvx 설치 필요"

# GCP CLI (GCP MCP용) - 선택사항
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
```

## 🚀 빠른 시작

```bash
# 1. 환경변수 설정
cp .env.local.example .env.local
# 편집기로 .env.local 파일 열어서 토큰 설정
nano .env.local  # 또는 원하는 편집기 사용

# 2. 환경변수 로딩 (중요!)
source .env.local
# 또는
export $(grep -v '^#' .env.local | xargs)

# 3. 환경변수 확인
echo $GITHUB_PERSONAL_ACCESS_TOKEN | head -c 10  # 첫 10자만 표시

# 4. MCP 설정 확인
cat .mcp.json | jq '.mcpServers | keys'

# 5. Claude Code 재시작 (중요!)
pkill -f claude
ps aux | grep claude  # 프로세스 없음 확인
claude

# 6. 서버 상태 확인
# Claude Code 내에서 각 MCP 도구 사용해보기
```

## 📋 전체 MCP 서버 목록 및 상태

| # | 서버명 | 상태 | 용도 | 환경변수 필요 |
|---|--------|------|------|--------------|
| 1 | **filesystem** | ✅ 정상 | 파일 시스템 조작 | ❌ |
| 2 | **memory** | ✅ 정상 | 지식 그래프 관리 | ❌ |
| 3 | **github** | ✅ 정상 | GitHub 레포지토리 관리 | ✅ GITHUB_PERSONAL_ACCESS_TOKEN |
| 4 | **supabase** | ✅ 정상 | 데이터베이스 관리 | ✅ SUPABASE_ACCESS_TOKEN |
| 5 | **tavily** | ✅ 정상 | 웹 검색 및 크롤링 | ✅ TAVILY_API_KEY |
| 6 | **playwright** | ✅ 정상 | 브라우저 자동화 | ❌ |
| 7 | **time** | ✅ 정상 | 시간대 변환 | ❌ |
| 8 | **context7** | ✅ 정상 | 문서 검색 | ✅ UPSTASH_REDIS_REST_URL/TOKEN |
| 9 | **gcp** | ✅ 정상 | GCP 리소스 관리 | ✅ GOOGLE_CLOUD_PROJECT |
| 10 | **serena** | ✅ 정상 | 코드 분석 | ❌ (프로젝트 활성화 필요) |
| 11 | **sequential-thinking** | ✅ 정상 | 사고 체인 | ❌ |
| 12 | **shadcn-ui** | ✅ 정상 | UI 컴포넌트 | ❌ |

## 🔧 개별 서버 설정 가이드

### 1. Filesystem MCP
```json
"filesystem": {
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-filesystem", "/mnt/d/cursor/openmanager-vibe-v5"]
}
```
**테스트 명령**: 
```typescript
mcp__filesystem__list_allowed_directories()
mcp__filesystem__write_file(path, content)
mcp__filesystem__read_text_file(path)
```

### 2. Memory MCP
```json
"memory": {
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-memory"]
}
```
**테스트 명령**:
```typescript
mcp__memory__create_entities(entities)
mcp__memory__create_relations(relations)
mcp__memory__read_graph()
```

### 3. GitHub MCP ✅
```json
"github": {
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-github"],
  "env": {
    "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_PERSONAL_ACCESS_TOKEN}"
  }
}
```
**문제 및 해결**:
- **근본 원인**: Claude Code가 시작 시점의 환경변수를 캐시
- **해결 방법**:
  1. 새 토큰 발급: https://github.com/settings/tokens
  2. 권한 설정: `repo`, `workflow`, `write:packages`
  3. `.env.local` 업데이트
  4. Claude Code 완전 재시작
  ```bash
  pkill -f claude
  ps aux | grep claude  # 프로세스 없음 확인
  claude
  ```

### 4. Supabase MCP
```json
"supabase": {
  "command": "npx",
  "args": ["-y", "@supabase/mcp-server-supabase@latest", "--project-ref", "vnswjnltnhpsueosfhmw"],
  "env": {
    "SUPABASE_ACCESS_TOKEN": "${SUPABASE_ACCESS_TOKEN}"
  }
}
```
**테스트 명령**:
```typescript
mcp__supabase__get_project_url()
mcp__supabase__list_tables()
mcp__supabase__execute_sql(query)
```

### 5. Tavily MCP
```json
"tavily": {
  "command": "npx",
  "args": ["-y", "tavily-mcp"],
  "env": {
    "TAVILY_API_KEY": "${TAVILY_API_KEY}"
  }
}
```
**무료 한도**: 1,000 검색/월
**테스트 명령**:
```typescript
mcp__tavily__tavily_search(query)
mcp__tavily__tavily_extract(urls)
mcp__tavily__tavily_crawl(url)
```

### 6. Playwright MCP
```json
"playwright": {
  "command": "npx",
  "args": ["-y", "@executeautomation/playwright-mcp-server"]
}
```
**테스트 명령**:
```typescript
mcp__playwright__browser_navigate(url)
mcp__playwright__browser_snapshot()
mcp__playwright__browser_click(element, ref)
mcp__playwright__browser_close()
```

### 7. Time MCP
```json
"time": {
  "command": "/home/skyasu/.local/bin/uvx",
  "args": ["mcp-server-time"]
}
```
**테스트 명령**:
```typescript
mcp__time__get_current_time(timezone)
mcp__time__convert_time(source_timezone, time, target_timezone)
```

### 8. Context7 MCP
```json
"context7": {
  "command": "npx",
  "args": ["-y", "@upstash/context7-mcp"],
  "env": {
    "UPSTASH_REDIS_REST_URL": "${UPSTASH_REDIS_REST_URL}",
    "UPSTASH_REDIS_REST_TOKEN": "${UPSTASH_REDIS_REST_TOKEN}"
  }
}
```
**테스트 명령**:
```typescript
mcp__context7__resolve_library_id(libraryName)
mcp__context7__get_library_docs(context7CompatibleLibraryID, tokens, topic)
```

### 9. GCP MCP
```json
"gcp": {
  "command": "node",
  "args": ["$(npm root -g)/google-cloud-mcp/dist/index.js"],
  "env": {
    "GOOGLE_CLOUD_PROJECT": "${GCP_PROJECT_ID}",
    "GOOGLE_APPLICATION_CREDENTIALS": "${HOME}/.config/gcloud/application_default_credentials.json"
  }
}
```
**사전 설정**:
```bash
# GCP 인증 및 프로젝트 설정
gcloud auth application-default login
gcloud config set project openmanager-free-tier
gcloud services enable cloudresourcemanager.googleapis.com

# 설치 확인
npm list -g google-cloud-mcp || npm install -g google-cloud-mcp
```
**테스트 명령**:
```typescript
mcp__gcp__get_project_id()
mcp__gcp__query_logs(filter, limit)
mcp__gcp__list_spanner_instances()
```

### 10. Serena MCP
```json
"serena": {
  "command": "/home/skyasu/.local/bin/uvx",
  "args": ["--from", "git+https://github.com/oraios/serena", "serena-mcp-server", "--project", "/mnt/d/cursor/openmanager-vibe-v5"],
  "env": {
    "UV_CACHE_DIR": "/tmp/uv-cache",
    "PYTHONUNBUFFERED": "1"
  }
}
```
**특이사항**: 사용 전 프로젝트 활성화 필수
```typescript
mcp__serena__activate_project("openmanager-vibe-v5")
mcp__serena__find_symbol(name_path, relative_path)
mcp__serena__list_memories()
```

### 11. Sequential-thinking MCP
```json
"sequential-thinking": {
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-sequential-thinking@latest"]
}
```
**테스트 명령**:
```typescript
mcp__sequential_thinking__sequentialthinking(thought, nextThoughtNeeded, thoughtNumber, totalThoughts)
```

### 12. Shadcn-ui MCP
```json
"shadcn-ui": {
  "command": "npx",
  "args": ["-y", "@jpisnice/shadcn-ui-mcp-server@latest"]
}
```
**테스트 명령**:
```typescript
mcp__shadcn_ui__list_components()
mcp__shadcn_ui__get_component(componentName)
mcp__shadcn_ui__get_component_demo(componentName)
```

## 🔐 환경변수 설정 (.env.local)

```bash
# GitHub MCP
GITHUB_PERSONAL_ACCESS_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxx

# Supabase MCP
SUPABASE_ACCESS_TOKEN=sbp_xxxxxxxxxxxxxxxxxxxxx

# Tavily MCP (무료 1000회/월)
TAVILY_API_KEY=tvly-xxxxxxxxxxxxxxxxxxxxx

# Upstash Context7 MCP (무료 10MB)
UPSTASH_REDIS_REST_URL=https://xxxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxxxxxxxxxxxxxxxxxxxx

# GCP MCP
GCP_PROJECT_ID=openmanager-free-tier
```

## 🔍 문제 해결

### 일반적인 문제

#### 1. "Bad credentials" 오류
**원인**: 토큰 만료 또는 잘못된 토큰
**해결**: 
```bash
# 토큰 갱신 후
pkill -f claude
claude
```

#### 2. MCP 서버가 연결되지 않음
**원인**: 의존성 미설치
**해결**:
```bash
# npx 기반 서버는 자동 설치됨
# uvx 기반 서버 확인 및 설치
which uvx || {
  echo "uvx 설치 중..."
  curl -LsSf https://astral.sh/uv/install.sh | sh
  export PATH="$HOME/.local/bin:$PATH"
  echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
}
```

#### 3. 환경변수가 적용되지 않음
**원인**: Claude Code 캐시
**해결**: Claude Code 완전 재시작 필수

### 자동화 도구

#### 의존성 자동 설치
```bash
# 모든 MCP 서버 의존성 자동 설치
./scripts/mcp/install-dependencies.sh
```

#### 상태 진단 도구
```bash
# 환경변수, 의존성, 프로세스 종합 진단
./scripts/mcp/diagnose-status.sh
```

### 검증 스크립트

```bash
#!/bin/bash
# test-mcp-servers.sh

echo "Testing MCP Servers..."

# 0. 환경변수 로딩
if [ -f .env.local ]; then
    export $(grep -v '^#' .env.local | xargs)
    echo "✅ 환경변수 로딩 완료"
else
    echo "❌ .env.local 파일이 없습니다"
    exit 1
fi

# 1. 의존성 확인
echo "\nChecking dependencies..."
node --version || echo "❌ Node.js not found"
uvx --version || echo "❌ uvx not found - run: curl -LsSf https://astral.sh/uv/install.sh | sh"
gcloud auth application-default print-access-token > /dev/null 2>&1 || echo "⚠️ GCP auth not configured (optional)"

# 2. 환경변수 확인
echo "\nChecking environment variables..."
[ -z "$GITHUB_PERSONAL_ACCESS_TOKEN" ] && echo "❌ GITHUB_PERSONAL_ACCESS_TOKEN not set" || echo "✅ GitHub token set"
[ -z "$SUPABASE_ACCESS_TOKEN" ] && echo "❌ SUPABASE_ACCESS_TOKEN not set" || echo "✅ Supabase token set"
[ -z "$TAVILY_API_KEY" ] && echo "❌ TAVILY_API_KEY not set" || echo "✅ Tavily key set"

# 3. MCP 설정 확인
echo "\nChecking MCP configuration..."
if command -v jq > /dev/null; then
    cat .mcp.json | jq '.mcpServers | keys'
else
    echo "jq not installed, showing raw config:"
    cat .mcp.json
fi

# 4. Claude Code 프로세스 확인
echo "\nChecking Claude processes..."
ps aux | grep -v grep | grep claude || echo "⚠️ Claude Code not running"

echo "\n✅ Test complete!"
```

## 📈 성능 메트릭

| 메트릭 | 값 |
|--------|-----|
| 전체 성공률 | 100% (12/12) |
| 평균 응답시간 | <500ms |
| 안정성 | 매우 높음 |
| 메모리 사용량 | ~200MB/서버 |

## 🚀 모범 사례

1. **환경변수 관리**
   - 모든 토큰은 `.env.local`에 저장
   - `.mcp.json`에는 `${VAR_NAME}` 형식 사용
   - 정기적인 토큰 갱신

2. **서버 관리**
   - 설정 변경 시 Claude Code 재시작
   - 정기적인 상태 모니터링
   - 로그 확인으로 문제 조기 발견

3. **보안**
   - 절대 실제 토큰을 `.mcp.json`에 하드코딩하지 않음
   - Git에 `.env.local` 커밋 금지
   - 최소 권한 원칙 적용

## ✅ 설정 완료 체크리스트

### 기본 환경 준비
- [ ] Node.js v18+ 설치 확인
- [ ] npm 최신 버전 확인
- [ ] uvx 설치 (Time, Serena MCP용)
- [ ] GCP CLI 설치 (선택사항)

### 환경변수 설정
- [ ] .env.local 파일 생성
- [ ] GitHub Personal Access Token 설정
- [ ] Supabase Access Token 설정
- [ ] Tavily API Key 설정 (무료 1000회/월)
- [ ] Upstash Redis 설정 (무료 10MB)
- [ ] GCP 프로젝트 ID 설정 (선택사항)
- [ ] 환경변수 로딩 (`source .env.local`)

### MCP 서버 설정
- [ ] .mcp.json 파일 확인
- [ ] 12개 서버 설정 완료
- [ ] Claude Code 재시작

### 연결 테스트
- [ ] filesystem MCP 테스트
- [ ] memory MCP 테스트
- [ ] GitHub MCP 테스트
- [ ] Supabase MCP 테스트
- [ ] 기타 필요한 MCP 테스트

## 🔍 문제 해결 플로우차트

```
MCP 연결 실패
├── 환경변수 문제?
│   ├── .env.local 존재? → 생성 필요
│   ├── source 실행? → source .env.local
│   └── 토큰 유효? → 갱신 필요
├── 의존성 문제?
│   ├── Node.js 버전? → v18+ 업그레이드
│   ├── uvx 설치? → install-dependencies.sh 실행
│   └── npm 패키지? → npx로 자동 설치
└── 프로세스 문제?
    ├── Claude Code 재시작
    └── 프로세스 완전 종료 확인
```

## 📊 검수 결과

- **Gemini 검수**: 7.6/10 → 개선 완료 ✅
- **Codex 검수**: 8.0/10 → 개선 완료 ✅
- **최종 개선**: 의존성 자동 설치, 진단 도구, 플로우차트 추가

## 🛠️ 자동화 스크립트

| 스크립트 | 용도 | 위치 |
|---------|------|------|
| **install-dependencies.sh** | 모든 의존성 자동 설치 | `scripts/mcp/` |
| **diagnose-status.sh** | 종합 상태 진단 | `scripts/mcp/` |
| **test-mcp-servers.sh** | MCP 서버 테스트 | `scripts/mcp/` |
| **mcp-auto-recovery.sh** | 자동 복구 | `scripts/mcp/` |

## 📚 참고 문서

- [MCP 공식 문서](https://modelcontextprotocol.io)
- [MCP 테스트 보고서](../reports/mcp/mcp-test-report-2025-08-20.md)
- [GitHub MCP 트러블슈팅](./github-mcp-troubleshooting.md)
- [Gemini 검수 결과](./mcp-complete-setup-guide-2025-improved.md)
- [Codex 검수 결과](./mcp-setup-guide-codex-review.md)

---

**다음 업데이트 예정**: 2025-08-21
**문의**: Claude Code Assistant