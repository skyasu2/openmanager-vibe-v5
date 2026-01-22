# AI 도구 설치 가이드

> Claude Code, Codex, Gemini 및 MCP 서버 설치/설정

## 개요

Vibe Coding에 필요한 AI 도구들의 설치 및 설정 방법입니다.

```
┌─────────────────────────────────────────────────────────┐
│                    설치 순서                             │
├─────────────────────────────────────────────────────────┤
│  1. Claude Code  →  2. MCP 서버  →  3. Codex/Gemini    │
│     (메인 AI)         (확장 기능)      (코드 리뷰)       │
└─────────────────────────────────────────────────────────┘
```

---

## 1. Claude Code 설치

### macOS

```bash
# Homebrew로 설치 (권장)
brew install anthropic/tap/claude-code

# 또는 npm으로 설치
npm install -g @anthropic-ai/claude-code
```

### Linux (WSL 포함)

```bash
# npm으로 설치
npm install -g @anthropic-ai/claude-code

# 또는 직접 다운로드
curl -fsSL https://claude.ai/install.sh | sh
```

### 로그인 (OAuth)

```bash
# 최초 실행 시 브라우저 로그인
claude

# 브라우저가 열리면 Anthropic 계정으로 로그인
# 로그인 완료 후 터미널로 돌아옴
```

**Note**: API 키가 아닌 **브라우저 로그인** 방식입니다.

### 확인

```bash
claude --version
claude  # 대화형 모드 시작
```

---

## 2. MCP 서버 설치

### 설정 파일 위치

```bash
# 글로벌 설정
~/.claude/settings.json

# 프로젝트별 설정 (우선)
.claude/settings.local.json
```

### 전체 MCP 서버 설정

```json
{
  "mcpServers": {
    "serena": {
      "command": "uvx",
      "args": ["serena-mcp"],
      "env": {}
    },
    "context7": {
      "command": "npx",
      "args": ["-y", "@context7/mcp-server"]
    },
    "sequential-thinking": {
      "command": "npx",
      "args": ["-y", "@anthropic/sequential-thinking-mcp"]
    },
    "supabase": {
      "command": "npx",
      "args": ["-y", "@supabase/mcp-server"],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "${SUPABASE_ACCESS_TOKEN}"
      }
    },
    "vercel": {
      "command": "npx",
      "args": ["-y", "@vercel/mcp"],
      "env": {
        "VERCEL_TOKEN": "${VERCEL_TOKEN}"
      }
    },
    "playwright": {
      "command": "npx",
      "args": ["-y", "@anthropic/playwright-mcp"]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@anthropic/github-mcp"],
      "env": {
        "GITHUB_TOKEN": "${GITHUB_TOKEN}"
      }
    },
    "tavily": {
      "command": "npx",
      "args": ["-y", "@tavily/mcp-server"],
      "env": {
        "TAVILY_API_KEY": "${TAVILY_API_KEY}"
      }
    }
  }
}
```

### 개별 MCP 서버 설치

#### Serena (코드 분석)

```bash
# Python 환경 필요
pip install uvx
uvx serena-mcp --help
```

#### Context7 (문서 검색)

```bash
npx -y @context7/mcp-server --help
```

#### Supabase

```bash
# 토큰 발급: https://supabase.com/dashboard/account/tokens
export SUPABASE_ACCESS_TOKEN=sbp_...
```

#### Vercel

```bash
# 토큰 발급: https://vercel.com/account/tokens
export VERCEL_TOKEN=...
```

#### GitHub

```bash
# 토큰 발급: https://github.com/settings/tokens
# 필요 권한: repo, read:org
export GITHUB_TOKEN=ghp_...
```

#### Tavily (웹 검색)

```bash
# API 키 발급: https://tavily.com
export TAVILY_API_KEY=tvly-...
```

---

## 3. Codex CLI 설치 (코드 리뷰)

### 설치

```bash
# npm으로 설치
npm install -g @openai/codex
```

### 로그인 (OAuth)

```bash
# 최초 실행 시 브라우저 로그인
codex

# 브라우저가 열리면 OpenAI 계정으로 로그인
# Pro/Plus 구독 필요
```

**Note**: API 키가 아닌 **브라우저 로그인** 방식입니다.

### 확인

```bash
codex --version
```

---

## 4. Gemini CLI 설치 (코드 리뷰)

### 설치

```bash
# npm으로 설치
npm install -g @google/gemini-cli
```

### 로그인 (OAuth)

```bash
# 최초 실행 시 브라우저 로그인
gemini

# 브라우저가 열리면 Google 계정으로 로그인
```

**Note**: API 키가 아닌 **브라우저 로그인** 방식입니다.

### 확인

```bash
gemini --version
```

---

## 5. Git Hooks 설정 (자동 AI 리뷰)

### Husky 설치

```bash
npm install -D husky
npx husky init
```

### post-commit Hook

프로젝트에 이미 설정되어 있습니다:
- `.husky/post-commit`
- `scripts/hooks/post-commit.js`

**동작 방식**:
1. 커밋 번호로 리뷰어 결정 (홀수: Codex, 짝수: Gemini)
2. 변경된 파일 목록 추출
3. AI 리뷰 실행
4. 결과를 `reports/ai-review/pending/`에 저장

---

## 6. 환경변수 (MCP 서버용)

MCP 서버 중 일부는 토큰이 필요합니다.

### .env.local 예시

```bash
# ===========================================
# MCP Server Tokens (토큰 필요한 것만)
# ===========================================

# Supabase MCP
SUPABASE_ACCESS_TOKEN=sbp_...

# Vercel MCP
VERCEL_TOKEN=...

# GitHub MCP
GITHUB_TOKEN=ghp_...

# Tavily MCP
TAVILY_API_KEY=tvly-...
```

### 환경변수 로드

```bash
# .bashrc 또는 .zshrc에 추가
if [ -f .env.local ]; then
  set -a
  source .env.local
  set +a
fi
```

---

## 7. 설치 확인

### 로그인 상태 확인

```bash
# Claude Code - 로그인 필요 시 브라우저 열림
claude

# Codex - 로그인 필요 시 브라우저 열림
codex

# Gemini - 로그인 필요 시 브라우저 열림
gemini
```

### MCP 서버 확인

Claude Code 내에서:
```
You: "MCP 서버 상태 확인해줘"
Claude: [serena, context7, supabase 등 사용 가능 여부 표시]
```

---

## 트러블슈팅

### 로그인 실패

```
증상: 브라우저가 열리지 않음
해결:
1. WSL에서는 Windows 브라우저 연동 확인
2. BROWSER 환경변수 설정: export BROWSER=wslview
3. 수동으로 URL 복사하여 브라우저에서 열기
```

### MCP 서버 시작 안 됨

```
증상: "MCP server not available"
해결:
1. 의존성 설치: npm install / pip install uvx
2. 환경변수 확인: echo $SUPABASE_ACCESS_TOKEN
3. 로그 확인: claude --debug
```

### WSL 브라우저 연동

```bash
# WSL에서 Windows 브라우저 열기 설정
sudo apt install wslu
export BROWSER=wslview

# .bashrc에 추가
echo 'export BROWSER=wslview' >> ~/.bashrc
```

---

## 인증 방식 요약

| 도구 | 인증 방식 | 필요 조건 |
|------|----------|----------|
| Claude Code | OAuth (브라우저 로그인) | Anthropic 계정 |
| Codex | OAuth (브라우저 로그인) | OpenAI Pro/Plus |
| Gemini | OAuth (브라우저 로그인) | Google 계정 |
| MCP 서버 | 토큰/API 키 | 각 서비스 발급 |

---

## 관련 문서

- [Claude Code](./claude-code.md)
- [MCP 서버](./mcp-servers.md)
- [AI 도구들](./ai-tools.md)
- [워크플로우](./workflows.md)
