# 🚀 Claude Code 공식 MCP 서버 설정 가이드

**기반**: Claude Code 공식 문서 (docs.anthropic.com/claude-code/mcp)  
**환경**: WSL 2 + Ubuntu 24.04 LTS  
**날짜**: 2025-08-15

## 📋 **Claude Code 공식 MCP 명령어**

### 기본 구조

```bash
claude mcp add <name> [--scope <scope>] [--transport <transport>] [--env KEY=value] -- <command>
```

### 스코프 옵션

- `--scope local`: 프로젝트별 (기본값)
- `--scope project`: `.mcp.json`을 통해 공유
- `--scope user`: 모든 프로젝트에서 사용

## 🔧 **현재 적용된 MCP 서버 설정 (11개)**

### NPX 기반 JavaScript 서버 (9개)

#### 1. Filesystem 서버

```bash
claude mcp add filesystem --scope project -- npx -y @modelcontextprotocol/server-filesystem /mnt/d/cursor/openmanager-vibe-v5
```

#### 2. Memory 서버

```bash
claude mcp add memory --scope project -- npx -y @modelcontextprotocol/server-memory
```

#### 3. GitHub 서버 (환경변수 필요)

```bash
claude mcp add github --scope project --env GITHUB_PERSONAL_ACCESS_TOKEN="your_token" -- npx -y @modelcontextprotocol/server-github
```

#### 4. Supabase 서버 (환경변수 + 프로젝트 ID 필요)

```bash
claude mcp add supabase --scope project --env SUPABASE_ACCESS_TOKEN="your_token" -- npx -y @supabase/mcp-server-supabase@latest --project-ref "vnswjnltnhpsueosfhmw"
```

#### 5. Tavily 서버 (웹 검색, 환경변수 필요)

```bash
claude mcp add tavily --scope project --env TAVILY_API_KEY="your_key" -- npx -y tavily-mcp
```

#### 6. Playwright 서버 (브라우저 자동화)

```bash
claude mcp add playwright --scope project -- npx -y @executeautomation/playwright-mcp-server
```

#### 7. Sequential Thinking 서버

```bash
claude mcp add thinking --scope project -- npx -y @modelcontextprotocol/server-sequential-thinking
```

#### 8. Context7 서버 (라이브러리 문서, 환경변수 필요)

```bash
claude mcp add context7 --scope project --env UPSTASH_REDIS_REST_URL="your_url" --env UPSTASH_REDIS_REST_TOKEN="your_token" -- npx -y @upstash/context7-mcp
```

#### 9. ShadcN UI 서버

```bash
claude mcp add shadcn --scope project -- npx -y @magnusrodseth/shadcn-mcp-server
```

### UVX 기반 Python 서버 (2개)

#### 10. Time 서버

```bash
claude mcp add time --scope project -- /home/skyasu/.local/bin/uvx mcp-server-time
```

#### 11. Serena 서버 (특별 설정)

```bash
claude mcp add serena --scope project -- /home/skyasu/.local/bin/uvx --from "git+https://github.com/oraios/serena" serena-mcp-server
```

## 🔑 **환경변수 설정 (WSL 권장 방법)**

### 1. 영구 환경변수 설정

```bash
# ~/.bashrc 편집
nano ~/.bashrc

# 파일 끝에 추가 (실제 토큰으로 교체)
export GITHUB_PERSONAL_ACCESS_TOKEN="ghp_your_actual_token_here"
export SUPABASE_PROJECT_ID="vnswjnltnhpsueosfhmw"
export SUPABASE_ACCESS_TOKEN="sbp_your_actual_token_here"
export TAVILY_API_KEY="tvly-your_actual_key_here"
export UPSTASH_REDIS_REST_URL="https://your-redis.upstash.io"
export UPSTASH_REDIS_REST_TOKEN="your_actual_token_here"

# 변경사항 적용
source ~/.bashrc
```

### 2. 환경변수 확인

```bash
env | grep -E "(GITHUB|SUPABASE|TAVILY|UPSTASH)" | sort
```

## 📁 **생성된 .mcp.json 구조**

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/mnt/d/cursor/openmanager-vibe-v5"
      ]
    },
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_PERSONAL_ACCESS_TOKEN}"
      }
    },
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase@latest",
        "--project-ref",
        "${SUPABASE_PROJECT_ID}"
      ],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "${SUPABASE_ACCESS_TOKEN}"
      }
    },
    "tavily": {
      "command": "npx",
      "args": ["-y", "tavily-mcp"],
      "env": {
        "TAVILY_API_KEY": "${TAVILY_API_KEY}"
      }
    },
    "playwright": {
      "command": "npx",
      "args": ["-y", "@executeautomation/playwright-mcp-server"]
    },
    "time": {
      "command": "/home/skyasu/.local/bin/uvx",
      "args": ["mcp-server-time"]
    },
    "thinking": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"]
    },
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp"],
      "env": {
        "UPSTASH_REDIS_REST_URL": "${UPSTASH_REDIS_REST_URL}",
        "UPSTASH_REDIS_REST_TOKEN": "${UPSTASH_REDIS_REST_TOKEN}"
      }
    },
    "shadcn": {
      "command": "npx",
      "args": ["-y", "@magnusrodseth/shadcn-mcp-server"]
    },
    "serena": {
      "command": "/home/skyasu/.local/bin/uvx",
      "args": [
        "--from",
        "git+https://github.com/oraios/serena",
        "serena-mcp-server"
      ]
    }
  }
}
```

## 🛠️ **MCP 서버 관리 명령어**

### 상태 확인

```bash
# MCP 서버 목록 조회
claude mcp list

# 특정 서버 상세 정보
claude mcp get <server_name>

# MCP 상태 확인 (대화형)
/mcp
```

### 서버 제거

```bash
claude mcp remove <server_name>
```

### 서버 재시작

```bash
# Claude Code 재시작으로 모든 MCP 서버 재시작
# 환경변수 변경 후 필수
```

## ⚙️ **개별 서버 기능 테스트**

### NPX 서버 테스트

```bash
# Memory 서버 (stdio 모드)
timeout 5s npx -y @modelcontextprotocol/server-memory --help

# Playwright 서버
timeout 5s npx -y @executeautomation/playwright-mcp-server --help
```

### UVX 서버 테스트

```bash
# Time 서버
uvx mcp-server-time --help

# Serena 서버
uvx --from "git+https://github.com/oraios/serena" serena-mcp-server --help
```

## 🔐 **보안 고려사항**

### 1. 환경변수 보안

```bash
# .bashrc 권한 설정
chmod 600 ~/.bashrc

# 환경변수 파일 분리 (선택사항)
touch ~/.mcp_env
chmod 600 ~/.mcp_env
echo "source ~/.mcp_env" >> ~/.bashrc
```

### 2. 토큰 권한 최소화

- **GitHub PAT**: `repo`, `read:org` 최소 권한
- **Supabase**: 필요한 테이블만 접근 가능한 키
- **Tavily**: 무료 티어 (1000회/월)
- **Upstash**: 무료 티어 (10MB + 10K req/일)

## 🚨 **문제 해결**

### 환경변수 인식 안 됨

```bash
# 1. 환경변수 확인
env | grep -E "(GITHUB|SUPABASE|TAVILY|UPSTASH)"

# 2. .bashrc 다시 로드
source ~/.bashrc

# 3. Claude Code 재시작
# 완전 종료 후 재시작 필요
```

### MCP 서버 연결 실패

```bash
# 1. 개별 서버 테스트
npx -y @modelcontextprotocol/server-memory --help

# 2. 패키지 캐시 정리
npm cache clean --force

# 3. MCP 설정 확인
claude mcp list
```

### WSL 관련 문제

```bash
# Windows cmd 명령어 사용 금지
# ❌ cmd /c npx ...
# ✅ npx ...

# WSL 환경변수만 사용
unset WINDOWS_ENV_VARS
```

## 📊 **현재 설정 상태**

### ✅ **완성된 서버 (11개)**

1. **filesystem** - 파일 시스템 작업 ✅
2. **memory** - 지식 그래프 관리 ✅
3. **github** - GitHub 저장소 관리 ✅
4. **supabase** - PostgreSQL DB 관리 ✅
5. **tavily** - 웹 검색/크롤링 ✅
6. **playwright** - 브라우저 자동화 ✅
7. **time** - 시간/시간대 변환 ✅
8. **thinking** - 복잡한 문제 해결 ✅
9. **context7** - 라이브러리 문서 ✅
10. **shadcn** - UI 컴포넌트 관리 ✅
11. **serena** - LSP 기반 코드 분석 ✅

### 🔑 **환경변수 상태**

- **GitHub**: GITHUB_PERSONAL_ACCESS_TOKEN ⚠️ (더미값)
- **Supabase**: SUPABASE_ACCESS_TOKEN ⚠️ (더미값)
- **Tavily**: TAVILY_API_KEY ⚠️ (더미값)
- **Upstash**: UPSTASH*REDIS*\* ⚠️ (더미값)

## 🎯 **다음 단계**

### 1. 실제 API 키 설정

```bash
# 각 서비스에서 실제 API 키 발급 후 ~/.bashrc 업데이트
# GitHub: https://github.com/settings/tokens
# Supabase: https://supabase.com/dashboard/account/tokens
# Tavily: https://tavily.com/
# Upstash: https://console.upstash.com/
```

### 2. Claude Code 재시작

```bash
# 환경변수 적용을 위해 완전 재시작 필요
# WSL 터미널도 재시작 권장
```

### 3. 연결 상태 확인

```bash
claude mcp list
# 또는 대화형 모드에서
/mcp
```

---

💡 **핵심**: Claude Code 공식 방법 사용 ✅, npx/uvx 적절히 활용 ✅, 환경변수 WSL 방식 설정 ✅, 모든 서버 설정 완료 ✅

🔧 **현재 상태**: 설정 완료, 실제 API 키 교체 후 즉시 사용 가능
