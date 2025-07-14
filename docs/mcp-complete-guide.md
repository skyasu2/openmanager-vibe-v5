# MCP (Model Context Protocol) 완전 정복 가이드

## 1. MCP(Model Context Protocol)란 무엇인가?

MCP는 AI 어시스턴트(Claude Code, Cursor 등)가 파일 시스템, 데이터베이스, API와 같은 외부 도구 및 리소스와 안전하고 표준화된 방식으로 상호작용할 수 있게 해주는 프로토콜입니다. 간단히 말해, AI를 위한 강력한 플러그인 시스템입니다.

### 핵심 특징
- **표준화된 통신**: JSON-RPC 기반의 STDIO 통신으로 안정적인 데이터 교환을 보장합니다.
- **모듈식 아키텍처**: 필요한 기능(MCP 서버)만 선택적으로 활성화하여 리소스를 효율적으로 사용합니다.
- **강화된 보안**: 각 MCP 서버별로 권한 및 접근 제어가 가능하여 안전한 작업 환경을 제공합니다.
- **높은 확장성**: 누구나 커스텀 MCP 서버를 개발하여 AI의 기능을 무한히 확장할 수 있습니다.

## 2. OpenManager VIBE v5의 MCP 아키텍처

본 프로젝트는 개발, 배포, 프로덕션 각 단계에 최적화된 3가지 유형의 MCP 서버를 활용합니다.

### 아키텍처 다이어그램
```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Development    │     │  Vercel Dev     │     │  Production     │
│     MCP         │     │  Tools MCP      │     │     MCP         │
│   (Local)       │     │ (@vercel/mcp)   │     │  (GCP VM)       │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                         │
    개발 도구(IDE)          배포 환경 모니터링         AI 엔진 통합
    코드 자동완성,            실시간 상태 확인           Supabase RAG + NLP
    DB 직접 관리              원격 디버깅 및 테스트      실시간 데이터 처리
         │                       │                         │
         └───────────────────────┴─────────────────────────┘
                                 │
                         OpenManager Vibe v5
                           애플리케이션
```

## 3. MCP 시스템의 3단계 구조 이해하기

Claude Code의 MCP 시스템은 다음 3단계로 작동합니다:

### 🎯 1단계: 글로벌 MCP 정의
Claude Code가 인식할 수 있는 모든 MCP 서버를 정의합니다.
- 위치: `claude mcp add` 명령으로 추가되는 글로벌 설정
- 역할: MCP 서버의 실행 방법과 환경 변수 저장

### 📦 2단계: 프로젝트별 MCP 등록
각 프로젝트에서 사용할 MCP 서버를 정의합니다.
- 위치: `.mcp.json` 파일 (프로젝트 루트)
- 역할: 프로젝트에서 사용 가능한 MCP 서버 목록과 설정
- 예시:
  ```json
  {
    "mcpServers": {
      "redis": {
        "command": "node",
        "args": ["./scripts/upstash-redis-mcp-wrapper-final.mjs"],
        "cwd": ".",
        "env": {}
      }
    }
  }
  ```

### ✅ 3단계: 프로젝트별 활성화
실제로 사용할 MCP 서버를 선택적으로 활성화합니다.
- 위치: `.claude/settings.local.json` 파일
- 역할: 활성화된 MCP 서버 목록 관리
- 예시:
  ```json
  {
    "enabledMcpjsonServers": [
      "filesystem",
      "github",
      "redis"  // Redis MCP 활성화
    ]
  }
  ```

**⚠️ 중요**: 세 단계가 모두 올바르게 설정되어야 MCP가 정상 작동합니다.

## 4. MCP 서버 설정 및 관리 (Claude Code v1.0.51+ 기준)

**중요:** Claude Code v1.0.51부터는 `~/.claude/settings.json` 파일을 직접 수정하는 방식이 아닌, `claude mcp` CLI 명령어를 사용해야 합니다.

### 🚀 자동 설정 (권장)
가장 쉽고 빠른 방법은 미리 준비된 npm 스크립트를 사용하는 것입니다.

```bash
# 프로젝트에 필요한 모든 MCP 서버를 자동으로 설정합니다.
# (내부적으로 `claude mcp add` 명령어를 실행)
npm run mcp:setup

# 설정된 MCP 서버 목록 확인
npm run mcp:list
```
**⚠️ 주의:** 위 명령어는 Claude Code 내장 터미널이 아닌, **일반 터미널(WSL, PowerShell, Git Bash 등)**에서 실행해야 합니다.

### 🔧 수동 설정 (개별 서버 추가)
필요한 MCP 서버만 개별적으로 추가할 수 있습니다.

```bash
# 예시: Filesystem MCP 서버 추가
claude mcp add filesystem node \
  "/path/to/project/node_modules/@modelcontextprotocol/server-filesystem/dist/index.js" \
  "/path/to/project" # 허용할 디렉토리 경로

# 예시: GitHub MCP 서버 추가 (환경변수 사용)
claude mcp add github node \
  "/path/to/project/node_modules/@modelcontextprotocol/server-github/dist/index.js" \
  -e GITHUB_PERSONAL_ACCESS_TOKEN="${GITHUB_TOKEN}"
```

## 5. 주요 MCP 서버 상세 가이드

### Filesystem MCP
- **기능**: 로컬 파일 읽기, 쓰기, 검색 등 파일 시스템에 접근합니다.
- **설정 시 주의사항**:
  - **반드시 허용할 디렉토리를 `args`로 전달해야 합니다.** 환경변수(`ALLOWED_DIRECTORIES`) 방식은 더 이상 작동하지 않습니다.
  - 보안을 위해 프로젝트 루트 디렉토리 등 최소한의 범위로 경로를 제한하는 것이 좋습니다.

### Supabase MCP
- **기능**: Supabase 데이터베이스 쿼리, 데이터 조작, 실시간 구독 등을 지원합니다.
- **사용 예시**:
  ```
  @supabase
  -- 활성 상태인 서버 목록 조회
  SELECT * FROM servers WHERE status = 'active';
  ```

### Gemini CLI Bridge v3.0
- **기능**: Claude와 Gemini 간의 양방향 통신을 중계하는 핵심 브릿지입니다. v3.0으로 업데이트되면서 `--prompt` 최적화 및 자동 모델 선택 기능이 강화되었습니다.
- **사용 예시**:
  ```
  @gemini-cli-bridge
  # Flash 모델로 코드 리뷰 요청
  gemini_chat_flash("다음 코드의 개선점을 알려줘: [코드 스니펫]")
  ```

### Tavily MCP
- **기능**: AI 기반 웹 검색 엔진으로 실시간 정보 검색, 웹 컨텐츠 추출, 사이트 크롤링, 사이트맵 생성 등을 지원합니다.
- **주요 도구**:
  - `tavily-search`: 웹 검색 및 필터링
  - `tavily-extract`: URL에서 컨텐츠 추출  
  - `tavily-crawl`: 사이트 크롤링
  - `tavily-map`: 사이트 구조 매핑
- **사용 예시**:
  ```
  @tavily
  # Vercel 무료 티어 한도 검색
  tavily_search("Vercel free tier limits monthly 2025", include_domains=["vercel.com"])
  ```

### Redis MCP
- **기능**: Redis 키-값 저장소와 직접 상호작용하여 캐시 데이터, 세션 정보, 임시 데이터 등을 관리합니다.
- **구현**: 커스텀 Upstash Redis MCP 래퍼 (`scripts/upstash-redis-mcp-wrapper-final.mjs`)
- **주요 도구**:
  - `set`: 키-값 쌍 저장 (TTL 설정 가능)
  - `get`: 키로 값 조회
  - `delete`: 키 삭제 (다중 키 지원)
  - `list`: 패턴 매칭으로 키 목록 조회
- **✅ v5.46.32 안정화 완료**: `@gongrzhe/server-redis-mcp` 실행 실패 문제 해결됨

#### 📋 완전 설정 가이드 (단계별 검증 포함)

##### 🎯 **1단계: 커스텀 래퍼 확인 (v5.46.32 기준)**
```bash
# 1-1. 커스텀 래퍼 파일 존재 확인
ls scripts/upstash-redis-mcp-wrapper-final.mjs
# ✅ 예상 결과: 파일이 존재해야 함

# 1-2. 환경변수 설정 확인
cat .env.local | grep UPSTASH_REDIS
# ✅ 예상 결과: UPSTASH_REDIS_REST_URL과 UPSTASH_REDIS_REST_TOKEN이 설정되어야 함

# 1-3. 래퍼 실행 테스트
timeout 5 node scripts/upstash-redis-mcp-wrapper-final.mjs
# ✅ 예상 결과: "Upstash Redis MCP server running..." 출력
```
💡 **참고**: v5.46.32부터는 별도 패키지 설치 없이 커스텀 래퍼를 사용합니다.

##### 🌐 **2단계: Redis 서버 준비 (로컬 vs 클라우드)**

**Option A: 로컬 Redis 서버 (개발용)**
```bash
# Docker 사용 (권장)
docker run -d -p 6379:6379 redis:alpine

# 연결 테스트
redis-cli ping
# ✅ 예상 결과: PONG

# 환경변수 설정 (.env.local)
REDIS_URL=redis://localhost:6379
```

**Option B: Upstash Redis 클라우드 (운영용, 권장)**
```bash
# 환경변수 설정 (.env.local)
UPSTASH_REDIS_REST_URL=https://your-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token

# 연결 테스트
npm run redis:test
# ✅ 예상 결과: "✅ Upstash Redis 연결 성공!"
```

**🔍 연결 테스트 스크립트 실행:**
```bash
# 로컬 Redis 헬스 체크
node scripts/check-redis-health.js

# Upstash Redis 테스트
node scripts/test-upstash-redis.js
```

##### ⚙️ **3단계: MCP 설정 파일 구성**

**3-1. `.mcp.json` 파일 설정:**

**로컬 Redis 사용 시:**
```json
{
  "mcpServers": {
    "redis": {
      "command": "node",
      "args": ["./scripts/upstash-redis-mcp-wrapper-final.mjs"],
      "cwd": ".",
      "env": {}
    }
  }
}
```
💡 **참고**: 환경변수는 `.env.local` 파일에서 자동으로 로드됩니다.

**Upstash Redis 사용 시 (권장):**
```json
{
  "mcpServers": {
    "redis": {
      "command": "node",
      "args": ["./scripts/upstash-redis-mcp-wrapper-final.mjs"],
      "cwd": ".",
      "env": {}
    }
  }
}
```
💡 **참고**: 환경변수는 `.env.local` 파일에서 자동으로 로드됩니다.
```bash
# .env.local 파일에 다음과 같이 설정:
UPSTASH_REDIS_REST_URL=https://your-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token
```

**3-2. 설정 파일 검증:**
```bash
# JSON 문법 검증
npx jsonlint .mcp.json
# ✅ 예상 결과: Valid JSON

# MCP 서버 직접 실행 테스트
node scripts/upstash-redis-mcp-wrapper-final.mjs
# ✅ 예상 결과: "Upstash Redis MCP server running..."
```

##### ✅ **4단계: Claude Code에서 활성화**

**4-1. `.claude/settings.local.json` 수정:**
```json
{
  "enabledMcpjsonServers": [
    "filesystem",
    "github",
    "memory",
    "supabase",
    "context7",
    "gemini-cli-bridge",
    "tavily",
    "redis"  // Redis MCP 추가
  ]
}
```

**4-2. 설정 확인:**
```bash
# 활성화된 MCP 서버 목록 확인
cat .claude/settings.local.json | grep -A 10 enabledMcpjsonServers
# ✅ "redis"가 목록에 포함되어야 함
```

##### 🔄 **5단계: Claude Code 재시작 및 검증**

**5-1. Claude Code 완전 재시작:**
- Claude Code 완전 종료
- 프로세스 확인: `tasklist | findstr "claude"` (Windows)
- Claude Code 재시작

**5-2. Redis MCP 작동 확인:**
```bash
# MCP 서버 상태 확인 (Claude Code 터미널에서)
# 아래 명령어들이 오류 없이 실행되어야 함:
```

**5-3. 실제 Redis 작업 테스트:**
```
Claude Code에서 다음 명령어 테스트:
set("test_key", "Hello Redis!", 300)  // 5분 TTL
get("test_key")                       // "Hello Redis!" 반환
list("test_*")                        // test_key 포함된 목록
delete("test_key")                    // 키 삭제
```

#### 🚨 **트러블슈팅: 실제 문제 해결 사례**

##### **문제 1: "Redis 서버에 연결할 수 없습니다" (가장 흔한 문제)**

**💥 증상:**
```
❌ Redis 서버에 연결할 수 없습니다.
Redis 서버를 시작하세요:
  • Docker: docker run -d -p 6379:6379 redis:alpine
```

**🔍 원인 분석:**
1. 로컬 Redis 서버가 실행되지 않음 (포트 6379 미사용)
2. 로컬 Redis 설치가 되어있지 않음
3. 포트 충돌 또는 방화벽 문제

**✅ 해결 방법 (우선순위별):**

**방법 1: Upstash 클라우드 Redis 사용 (권장)**
```bash
# 1. Upstash 계정 생성 및 Redis 인스턴스 생성
# 2. .env.local에 인증 정보 추가
UPSTASH_REDIS_REST_URL=https://charming-condor-46598.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token

# 3. .mcp.json 설정을 Upstash wrapper로 변경
# (위의 설정 가이드 참조)

# 4. 연결 테스트
node scripts/test-upstash-redis.js
```

**방법 2: 로컬 Redis 서버 설치**
```bash
# Windows (Chocolatey)
choco install redis-64

# Windows (WSL)
sudo apt update && sudo apt install redis-server
sudo service redis-server start

# Docker (가장 간단)
docker run -d -p 6379:6379 redis:alpine

# 연결 확인
redis-cli ping  # PONG 응답 확인
```

##### **문제 2: "No such tool available: mcp__redis__set"**

**💥 증상:**
```
Error: No such tool available: mcp__redis__set
```

**🔍 원인 분석:**
1. MCP 3단계 설정 중 누락된 부분 존재
2. Claude Code가 Redis MCP를 인식하지 못함
3. MCP 서버 시작 실패

**✅ 진단 프로세스:**
```bash
# Step 1: 커스텀 래퍼 확인 (v5.46.32 기준)
ls scripts/upstash-redis-mcp-wrapper-final.mjs
# ✅ 파일이 존재해야 함

# Step 2: .mcp.json 확인
cat .mcp.json | grep -A 10 "redis"
# ✅ redis 정의가 있어야 함

# Step 3: settings.local.json 확인
cat .claude/settings.local.json | grep redis
# ✅ "redis"가 enabledMcpjsonServers에 있어야 함

# Step 4: MCP 서버 직접 실행
node scripts/upstash-redis-mcp-wrapper-final.mjs
# ✅ "Upstash Redis MCP server running..." 출력되어야 함
```

**✅ 해결 방법:**
```bash
# 1. 모든 설정 초기화 후 재설정
npm run mcp:reset

# 2. Redis MCP 재설정
# .mcp.json에 redis 정의 추가
# .claude/settings.local.json에 "redis" 추가

# 3. Claude Code 완전 재시작
# (프로세스 완전 종료 후 재시작)

# 4. 설정 검증
node scripts/test-upstash-mcp-wrapper.js
```

##### **문제 3: MCP 서버 시작 중 환경변수 오류**

**💥 증상:**
```
Error: UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set
process.exit(1);
```

**🔍 원인:**
- `.env.local` 파일의 환경변수가 MCP 프로세스에 전달되지 않음
- 환경변수 이름 불일치

**✅ 해결 방법:**
```bash
# 1. .env.local 파일 확인
cat .env.local | grep UPSTASH
# ✅ 두 환경변수가 모두 설정되어야 함

# 2. .mcp.json에서 환경변수 직접 지정 (권장)
{
  "mcpServers": {
    "redis": {
      "command": "node",
      "args": ["./scripts/upstash-redis-mcp-wrapper-final.mjs"],
      "env": {
        "UPSTASH_REDIS_REST_URL": "실제_URL_값",
        "UPSTASH_REDIS_REST_TOKEN": "실제_토큰_값"
      }
    }
  }
}
```

#### 💡 **Redis MCP 활용 팁**

**🎯 실전 사용 예시:**
```
# 사용자 세션 관리 (1시간 TTL)
set("session:user_123", "{\"userId\": 123, \"role\": \"admin\"}", 3600)

# API 응답 캐싱 (30분 TTL)
set("api_cache:weather_seoul", "{\"temp\": 25, \"humidity\": 60}", 1800)

# 임시 토큰 저장 (10분 TTL)  
set("temp_token:abc123", "valid", 600)

# 실시간 카운터
set("visitor_count", "1547")

# 패턴으로 관련 데이터 조회
list("session:*")     # 모든 세션
list("api_cache:*")   # 모든 API 캐시
list("temp_token:*")  # 모든 임시 토큰
```

**🔧 성능 최적화:**
- TTL을 적절히 설정하여 메모리 사용량 관리
- 키 네이밍 규칙을 일관성 있게 사용 (namespace:identifier)
- 대용량 데이터는 JSON 압축 고려
- 패턴 검색 시 구체적인 패턴 사용 (와일드카드 최소화)

**🔒 보안 권장사항:**
- Upstash 인증 토큰은 절대 Git에 커밋하지 않기
- 환경변수로 인증 정보 관리
- Redis 인스턴스에 IP 화이트리스트 설정
- 정기적인 토큰 갱신

## 6. 문제 해결(Troubleshooting) 완전 가이드

### 🔥 최신 해결 사례: Filesystem MCP 서버 실패
- **문제**: `mcp-server-filesystem <allowed-directory>` 오류와 함께 서버 시작 실패.
- **원인**: 허용 디렉토리를 `args`가 아닌 `env`로 전달.
- **해결**: `claude mcp add` 명령어 사용 시, 아래와 같이 마지막 인자로 허용 디렉토리 경로를 직접 추가해야 합니다.
  ```json
  // ❌ 잘못된 설정 (구 방식)
  "env": { "ALLOWED_DIRECTORIES": "D:/cursor/openmanager-vibe-v5" }

  // ✅ 올바른 설정 (신 방식)
  "args": [
    "./node_modules/@modelcontextprotocol/server-filesystem/dist/index.js",
    "D:/cursor/openmanager-vibe-v5"  // 디렉터리를 마지막 인자로 전달
  ]
  ```

### 🔧 **표준화된 MCP 문제 해결 프로세스**

MCP 관련 문제가 발생했을 때, 다음 단계를 순서대로 따라하세요:

#### **🎯 Phase 1: 기본 진단 (5분)**

```bash
# 1. 프로젝트 구조 확인
ls -la .claude/  # settings.local.json 존재 확인
ls -la .mcp.json # .mcp.json 존재 확인

# 2. 패키지 설치 상태 확인
npm ls | grep mcp

# 3. 설정 파일 문법 검증
npx jsonlint .mcp.json
npx jsonlint .claude/settings.local.json

# 4. Claude Code 프로세스 확인 (Windows)
tasklist | findstr "claude"
```

#### **🎯 Phase 2: MCP 3단계 설정 검증 (10분)**

```bash
# Step 1: .mcp.json에서 서버 정의 확인
echo "=== .mcp.json 내용 ==="
cat .mcp.json | jq '.mcpServers | keys[]'

# Step 2: settings.local.json에서 활성화 상태 확인  
echo "=== 활성화된 MCP 서버 ==="
cat .claude/settings.local.json | jq '.enabledMcpjsonServers[]'

# Step 3: 불일치 항목 찾기
echo "=== 정의되었지만 활성화되지 않은 서버 ==="
comm -23 \
  <(cat .mcp.json | jq -r '.mcpServers | keys[]' | sort) \
  <(cat .claude/settings.local.json | jq -r '.enabledMcpjsonServers[]' | sort)
```

#### **🎯 Phase 3: 개별 MCP 서버 테스트 (서버당 3분)**

```bash
# 예시: Redis MCP 서버 직접 실행 테스트
echo "=== MCP 서버 직접 실행 테스트 ==="
timeout 10s node scripts/upstash-redis-mcp-wrapper-final.mjs

# 예상 결과: "Upstash Redis MCP server running..." 출력 후 대기
# Ctrl+C로 종료 후 다음 단계로
```

#### **🎯 Phase 4: 환경변수 및 권한 확인 (5분)**

```bash
# 1. 환경변수 로드 확인
source .env.local
echo "Environment variables loaded:"
env | grep -E "(UPSTASH|GITHUB|SUPABASE)" | head -5

# 2. 파일 권한 확인
ls -la node_modules/@modelcontextprotocol/*/dist/index.js
ls -la scripts/*mcp*.js scripts/*mcp*.mjs

# 3. 실행 권한 부여 (필요시)
chmod +x scripts/*.mjs
```

#### **🎯 Phase 5: 재설정 및 검증 (5분)**

```bash
# 1. Claude Code 완전 종료
# (GUI에서 직접 종료)

# 2. 프로세스 확인 및 강제 종료
tasklist | findstr "claude" && taskkill /f /im "claude.exe"

# 3. Claude Code 재시작

# 4. MCP 도구 사용 테스트
# Claude Code에서: set("test", "value") 등 실행
```

### 🚨 **자주 발생하는 문제와 해결법 (우선순위별)**

#### **🔥 Critical (즉시 해결 필요)**

| 문제 상황 | 원인 | 1차 해결 방법 | 2차 해결 방법 |
|----------|------|-------------|-------------|
| **MCP 도구가 전혀 인식되지 않음** | Claude Code가 .mcp.json을 읽지 못함 | 1. Claude Code 재시작<br>2. .mcp.json 문법 검증 | 프로젝트 폴더 재선택<br>Claude Code 재설치 |
| **"No such tool available: mcp__xxx"** | MCP 3단계 설정 중 누락 | settings.local.json에 서버명 추가 후 재시작 | .mcp.json 재작성<br>npm run mcp:reset |
| **MCP 서버 시작 실패** | 환경변수 누락 또는 패키지 문제 | .env.local 확인 후 환경변수 추가 | 패키지 재설치<br>권한 문제 해결 |

#### **⚠️ High (1일 내 해결)**

| 문제 상황 | 원인 | 해결 방법 |
|----------|------|-----------|
| `claude mcp list`에 서버가 안 보임 | Claude Code가 설정을 제대로 읽지 못함 | 1. Claude Code를 완전히 종료 후 재시작<br>2. `npm run mcp:reset` 후 `npm run mcp:setup`으로 재설정 |
| Redis MCP가 "running"이지만 도구 사용 불가 | 인증 실패 또는 네트워크 문제 | 1. Upstash 대시보드에서 인증 정보 재확인<br>2. `node scripts/test-upstash-redis.js` 실행<br>3. 방화벽/프록시 설정 확인 |
| "Unrecognized field: mcpServers" 오류 | `~/.claude/settings.json`에 남아있는 구버전 설정 | `~/.claude/settings.json` 파일을 열어 `mcpServers` 필드를 완전히 삭제 |

#### **📋 Medium (1주 내 해결)**

| 문제 상황 | 원인 | 해결 방법 |
|----------|------|-----------|
| "Raw mode is not supported" 오류 | Claude Code 내장 터미널에서 설정 스크립트 실행 | 일반 터미널(WSL, PowerShell 등)에서 스크립트 실행 |
| 환경변수 관련 오류 (API 키 등) | MCP 프로세스가 환경변수를 상속받지 못함 | `claude mcp add` 명령어의 `-e` 옵션을 사용하여 환경변수를 명시적으로 주입 |
| "ENOENT: no such file or directory" | 파일 또는 디렉토리 경로가 잘못됨 | WSL 환경에서는 `/mnt/d/...` 와 같은 경로를 사용하고, 경로가 올바른지 재확인 |
| "Permission denied" | 파일 실행 권한 없음 | `chmod +x <file>` 명령어로 스크립트 또는 서버 파일에 실행 권한 부여 |
| ESM 모듈 에러 ("require is not defined") | CommonJS 구문을 ESM 프로젝트에서 사용 | `require()` 대신 `import` 구문 사용, `__dirname` 대신 `import.meta.url` 활용 |

### 디버깅 심화 과정
1.  **Claude Code 로그 확인**: `~/.claude/logs/` 디렉토리에서 최신 로그 파일을 확인하여 오류 단서를 찾습니다.
2.  **MCP 서버 직접 실행**: 터미널에서 MCP 서버 파일을 직접 실행하여 오류 메시지를 확인합니다.
    ```bash
    # 디버그 모드로 Filesystem 서버 실행
    DEBUG=* node ./node_modules/@modelcontextprotocol/server-filesystem/dist/index.js /path/to/project
    ```
3.  **MCP 설정 파일 검증**:
    ```bash
    # .mcp.json 파일 문법 검증
    npx jsonlint .mcp.json
    
    # 활성화된 MCP 서버 확인
    cat .claude/settings.local.json | grep enabledMcpjsonServers -A 10
    ```

### 🔥 실제 문제 해결 사례: Redis MCP가 보이지 않는 문제

**문제 상황**: Redis MCP 패키지를 설치했지만 Claude Code에서 `@redis` 명령어 사용 불가

**분석 과정**:
1. 패키지 설치 확인: `node_modules/@gongrzhe/server-redis-mcp` 존재 ✓
2. `.mcp.json` 확인: Redis 정의 누락 ✗
3. `.claude/settings.local.json` 확인: `enabledMcpjsonServers`에 "redis" 없음 ✗

**해결 단계**:
1. `.mcp.json`에 Redis MCP 정의 추가:
   ```json
   "redis": {
     "command": "node",
     "args": ["./scripts/upstash-redis-mcp-wrapper-final.mjs"],
     "cwd": ".",
     "env": {}
   }
   ```
   💡 **v5.46.32 개선**: 환경변수는 `.env.local`에서 자동 로드
2. `.claude/settings.local.json`의 `enabledMcpjsonServers` 배열에 "redis" 추가
3. Claude Code 재시작

**결과**: Redis MCP가 정상적으로 활성화되어 사용 가능

## 7. 🚀 **새로운 MCP 서버 추가 가이드 (템플릿)**

향후 새로운 MCP 서버를 추가할 때 이 템플릿을 활용하세요.

### **📋 MCP 서버 추가 체크리스트**

#### **🎯 Phase 1: 사전 준비 (10분)**

- [ ] **패키지 조사**
  ```bash
  # NPM에서 패키지 검색
  npm search "mcp server [서비스명]"
  
  # 패키지 정보 확인
  npm view [패키지명] description version
  
  # README 및 문서 확인
  npm view [패키지명] homepage
  ```

- [ ] **호환성 확인**
  - Claude Code 호환성 (MCP 프로토콜 버전)
  - Node.js 버전 요구사항 확인
  - 운영체제 호환성 (Windows/WSL)

- [ ] **인증 요구사항 파악**
  - API 키, 토큰 등 필요한 인증 정보
  - 환경변수 네이밍 규칙 확인
  - 권한 설정 요구사항

#### **🎯 Phase 2: 설치 및 기본 설정 (15분)**

- [ ] **패키지 설치**
  ```bash
  # 패키지 설치
  npm install [패키지명]@[버전]
  
  # 설치 확인
  npm list [패키지명]
  
  # 패키지 파일 구조 확인
  ls -la node_modules/[패키지명]/
  ```

- [ ] **환경변수 설정**
  ```bash
  # .env.local 파일에 추가
  echo "[SERVICE]_API_KEY=your_api_key" >> .env.local
  echo "[SERVICE]_URL=https://api.service.com" >> .env.local
  
  # 환경변수 로드 테스트
  source .env.local && echo $[SERVICE]_API_KEY
  ```

- [ ] **직접 실행 테스트**
  ```bash
  # MCP 서버 직접 실행 (10초 후 자동 종료)
  timeout 10s node node_modules/[패키지명]/dist/index.js
  
  # 예상 결과: 서버 시작 메시지 출력
  ```

#### **🎯 Phase 3: MCP 설정 파일 구성 (10분)**

- [ ] **`.mcp.json` 업데이트**
  ```json
  {
    "mcpServers": {
      "기존_서버들": { "..." },
      "[새서버명]": {
        "command": "node",
        "args": ["./node_modules/[패키지명]/dist/index.js"],
        "env": {
          "[SERVICE]_API_KEY": "${[SERVICE]_API_KEY}",
          "[SERVICE]_URL": "${[SERVICE]_URL}"
        }
      }
    }
  }
  ```

- [ ] **설정 파일 검증**
  ```bash
  # JSON 문법 검증
  npx jsonlint .mcp.json
  
  # 환경변수 치환 테스트
  cat .mcp.json | envsubst
  ```

#### **🎯 Phase 4: Claude Code 활성화 (5분)**

- [ ] **settings.local.json 업데이트**
  ```json
  {
    "enabledMcpjsonServers": [
      "filesystem",
      "github",
      "memory",
      "supabase",
      "context7",
      "gemini-cli-bridge", 
      "tavily",
      "redis",
      "[새서버명]"  // 새 서버 추가
    ]
  }
  ```

- [ ] **Claude Code 재시작**
  - GUI에서 완전 종료
  - 프로세스 확인: `tasklist | findstr "claude"`
  - 재시작 후 프로젝트 다시 열기

#### **🎯 Phase 5: 검증 및 테스트 (15분)**

- [ ] **MCP 도구 인식 확인**
  ```bash
  # Claude Code에서 다음 중 하나 시도:
  # 1. @[새서버명] 입력 후 자동완성 확인
  # 2. [새서버명] 관련 도구 함수 호출
  # 3. 간단한 API 호출 테스트
  ```

- [ ] **기능 테스트**
  ```bash
  # 서비스별 주요 기능 테스트
  # 예시: Notion MCP인 경우
  # - 페이지 조회: get_page("page_id")
  # - 데이터베이스 검색: query_database("db_id")
  ```

- [ ] **오류 처리 테스트**
  ```bash
  # 의도적으로 잘못된 요청을 보내서 에러 핸들링 확인
  # 예: 잘못된 API 키, 존재하지 않는 리소스 요청 등
  ```

### **📝 MCP 서버 추가 템플릿**

새로운 MCP 서버 추가 시 아래 템플릿을 복사하여 사용하세요:

```bash
#!/bin/bash
# MCP 서버 추가 자동화 스크립트 템플릿

# 변수 설정
SERVER_NAME="[새서버명]"           # 예: "notion"
PACKAGE_NAME="[패키지명]"          # 예: "@modelcontextprotocol/server-notion"
PACKAGE_VERSION="[버전]"           # 예: "latest"
ENV_PREFIX="[환경변수_접두사]"      # 예: "NOTION"

echo "🚀 $SERVER_NAME MCP 서버 추가 시작..."

# 1. 패키지 설치
echo "📦 패키지 설치 중..."
npm install $PACKAGE_NAME@$PACKAGE_VERSION

# 2. 설치 확인
echo "✅ 설치 확인..."
npm list $PACKAGE_NAME

# 3. .mcp.json 백업
echo "💾 설정 파일 백업..."
cp .mcp.json .mcp.json.backup.$(date +%Y%m%d_%H%M%S)

# 4. .mcp.json 업데이트 (수동으로 해야 함)
echo "⚙️  .mcp.json 파일을 수동으로 업데이트하세요:"
echo "서버명: $SERVER_NAME"
echo "패키지: $PACKAGE_NAME"

# 5. settings.local.json 백업
echo "💾 Claude 설정 백업..."
cp .claude/settings.local.json .claude/settings.local.json.backup.$(date +%Y%m%d_%H%M%S)

# 6. 테스트 스크립트 생성
echo "🧪 테스트 스크립트 생성..."
cat > scripts/test-${SERVER_NAME}-mcp.js << EOF
#!/usr/bin/env node

console.log('🔧 $SERVER_NAME MCP 서버 테스트 시작...');

// 패키지 존재 확인
try {
  const packageInfo = require('$PACKAGE_NAME/package.json');
  console.log(\`✅ \${packageInfo.name} v\${packageInfo.version} 설치됨\`);
} catch (error) {
  console.error('❌ 패키지를 찾을 수 없습니다:', error.message);
  process.exit(1);
}

console.log('✅ $SERVER_NAME MCP 테스트 완료!');
EOF

chmod +x scripts/test-${SERVER_NAME}-mcp.js

echo "✅ $SERVER_NAME MCP 서버 추가 완료!"
echo ""
echo "📋 다음 단계:"
echo "1. .mcp.json 파일에 서버 정의 추가"
echo "2. .claude/settings.local.json의 enabledMcpjsonServers에 '$SERVER_NAME' 추가"
echo "3. 필요한 환경변수를 .env.local에 설정"
echo "4. Claude Code 재시작"
echo "5. 테스트 실행: node scripts/test-${SERVER_NAME}-mcp.js"
```

### **🔍 검증 자동화 스크립트**

MCP 설정이 올바른지 자동으로 확인하는 스크립트:

```bash
#!/bin/bash
# scripts/validate-mcp-setup.sh

echo "🔍 MCP 설정 검증 시작..."

# 1. 필수 파일 존재 확인
echo "📁 필수 파일 확인..."
[ -f ".mcp.json" ] && echo "✅ .mcp.json 존재" || echo "❌ .mcp.json 누락"
[ -f ".claude/settings.local.json" ] && echo "✅ settings.local.json 존재" || echo "❌ settings.local.json 누락"

# 2. JSON 문법 검증
echo "📝 JSON 문법 검증..."
npx jsonlint .mcp.json > /dev/null && echo "✅ .mcp.json 문법 올바름" || echo "❌ .mcp.json 문법 오류"
npx jsonlint .claude/settings.local.json > /dev/null && echo "✅ settings.local.json 문법 올바름" || echo "❌ settings.local.json 문법 오류"

# 3. MCP 서버 일치성 검사
echo "🔗 MCP 서버 일치성 검사..."
DEFINED_SERVERS=$(cat .mcp.json | jq -r '.mcpServers | keys[]' | sort)
ENABLED_SERVERS=$(cat .claude/settings.local.json | jq -r '.enabledMcpjsonServers[]' | sort)

echo "정의된 서버: $DEFINED_SERVERS"
echo "활성화된 서버: $ENABLED_SERVERS"

# 4. 환경변수 확인
echo "🌍 환경변수 확인..."
source .env.local
echo "로드된 환경변수 개수: $(env | grep -E "(API_KEY|TOKEN|URL)" | wc -l)"

echo "✅ MCP 설정 검증 완료!"
```

## 8. 보안 및 권장사항

- **인증 정보 보호**: API 키나 서비스 키는 절대로 코드나 설정 파일에 직접 하드코딩하지 말고, 환경변수를 통해 안전하게 주입하세요.
- **최소 권한 원칙**: Filesystem MCP에는 꼭 필요한 디렉토리만 허용하고, 데이터베이스 계정은 필요한 권한만 가지도록 제한하세요.
- **정기적인 업데이트**: `npm outdated` 명령어로 MCP 서버 패키지의 최신 버전을 확인하고 정기적으로 업데이트하여 보안 및 성능을 개선하세요.
- **설정 파일 백업**: 새로운 MCP 서버 추가 전에는 반드시 `.mcp.json`과 `.claude/settings.local.json` 파일을 백업하세요.
- **점진적 추가**: 한 번에 여러 MCP 서버를 추가하지 말고, 하나씩 추가하여 문제 발생 시 원인을 명확히 파악할 수 있도록 하세요.

## 9. 📚 참고 자료 및 추가 도구

### **유용한 npm 스크립트 (package.json에 추가 권장)**

```json
{
  "scripts": {
    "mcp:validate": "node scripts/validate-mcp-setup.sh",
    "mcp:backup": "cp .mcp.json .mcp.json.backup.$(date +%Y%m%d_%H%M%S) && cp .claude/settings.local.json .claude/settings.local.json.backup.$(date +%Y%m%d_%H%M%S)",
    "mcp:test-all": "node scripts/test-*-mcp.js",
    "mcp:health-check": "node scripts/check-redis-health.js && node scripts/test-upstash-redis.js"
  }
}
```

### **MCP 생태계 추천 서버 목록**

- **@modelcontextprotocol/server-filesystem**: 파일 시스템 접근
- **@modelcontextprotocol/server-github**: GitHub API 연동
- **@modelcontextprotocol/server-memory**: 컨텍스트 메모리 관리
- **@supabase/mcp-server-supabase**: Supabase 데이터베이스
- **@gongrzhe/server-redis-mcp**: Redis 키-값 저장소
- **@upstash/context7-mcp**: 문서 검색 및 RAG
- **기타**: Notion, Slack, Discord, AWS, Google Drive 등

---
**이 문서는 OpenManager VIBE v5 프로젝트의 MCP 설정 및 사용에 대한 모든 것을 담고 있습니다. 문제가 발생하면 이 문서를 가장 먼저 참고하고, 새로운 MCP 서버 추가 시에는 7장의 템플릿을 활용해주세요.**

*최종 업데이트: 2025-07-14 | Redis MCP 트러블슈팅 경험 및 표준화된 문제 해결 프로세스 반영*
