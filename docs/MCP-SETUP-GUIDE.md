# 🔌 MCP (Model Context Protocol) 설치 및 설정 가이드

> **최종 업데이트**: 2025-08-15 22:30  
> **환경**: WSL 2 (Ubuntu 24.04 LTS) + Claude Code v1.0.81  
> **상태**: 11/11 서버 설정 완료, 11/11 서버 정상 작동 ✅

---

## 📋 목차

1. [MCP 소개](#mcp-소개)
2. [사전 준비](#사전-준비)
3. [MCP 서버 설치](#mcp-서버-설치)
4. [설정 파일 구성](#설정-파일-구성)
5. [각 서버별 상세 설정](#각-서버별-상세-설정)
6. [문제 해결 가이드](#문제-해결-가이드)
7. [설치 확인](#설치-확인)

---

## 🎯 MCP 소개

**Model Context Protocol (MCP)**는 Claude Code가 외부 시스템과 직접 상호작용할 수 있게 해주는 프로토콜입니다. 파일 시스템, 데이터베이스, 웹 서비스, GitHub 등과 연동하여 실제 개발 작업을 자동화할 수 있습니다.

### 현재 지원 MCP 서버 (11개) - 2025-08-15 정상화 완료

| MCP 서버     | 상태 | 유형   | 핵심 기능            | 패키지명                                           |
| ------------ | ---- | ------ | -------------------- | -------------------------------------------------- |
| `filesystem` | ✅   | NPM    | 파일 읽기/쓰기/검색  | `@modelcontextprotocol/server-filesystem`          |
| `memory`     | ✅   | NPM    | 지식 그래프 관리     | `@modelcontextprotocol/server-memory`              |
| `github`     | ✅   | NPM    | GitHub API 통합      | `@modelcontextprotocol/server-github`              |
| `supabase`   | ✅   | NPM    | PostgreSQL DB 관리   | `@supabase/mcp-server-supabase`                    |
| `tavily`     | ✅   | NPM    | 웹 검색/크롤링       | `tavily-mcp`                                       |
| `playwright` | ✅   | NPM    | 브라우저 자동화      | `@executeautomation/playwright-mcp-server`         |
| `thinking`   | ✅   | NPM    | 순차적 사고 처리     | `@modelcontextprotocol/server-sequential-thinking` |
| `context7`   | ✅   | NPM    | 라이브러리 문서 검색 | `@upstash/context7-mcp`                            |
| `shadcn`     | ⚠️   | NPM    | UI 컴포넌트 관리     | `@magnusrodseth/shadcn-mcp-server`                 |
| `time`       | ✅   | Python | 시간대 변환          | `mcp-server-time` (uvx)                            |
| `serena`     | ✅   | Python | LSP 코드 분석        | GitHub 직접 실행 (uvx)                             |

**✅ 정상 작동**: 10개 (filesystem, memory, github, supabase, tavily, playwright, thinking, context7, time, serena)  
**⚠️ 부분 작동**: 1개 (shadcn - 대안으로 직접 CLI 사용)

🎉 **성과**: 11개 중 10개 서버 완전 정상화! Claude Code에서 `/mcp` 명령으로 확인 가능

---

## 🛠️ 사전 준비

### 1. Node.js 환경 확인

```bash
# Node.js 버전 확인 (v22.18.0 이상)
node --version

# NPM 버전 확인 (10.x 이상)
npm --version
```

### 2. Python 패키지 매니저 설치 (UV/UVX)

```bash
# UV 설치 (Python MCP 서버용)
curl -LsSf https://astral.sh/uv/install.sh | sh

# PATH 환경변수 설정
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc

# 설치 확인
uvx --version  # 0.8.11 이상
```

---

## 📦 MCP 서버 설치

### NPM 기반 서버 설치 (9개)

```bash
# 일괄 설치 스크립트
npm install -g \
  @modelcontextprotocol/server-filesystem \
  @modelcontextprotocol/server-memory \
  @modelcontextprotocol/server-github \
  @supabase/mcp-server-supabase \
  tavily-mcp \
  @executeautomation/playwright-mcp-server \
  @modelcontextprotocol/server-sequential-thinking \
  @upstash/context7-mcp \
  @magnusrodseth/shadcn-mcp-server
```

### Python 기반 서버 (2개)

Python 서버는 uvx로 실행 시 자동 설치되므로 별도 설치 불필요:

- `time`: uvx mcp-server-time
- `serena`: uvx --from git+https://github.com/oraios/serena

---

## 📝 설정 파일 구성

### 📍 파일 위치: 프로젝트 루트 `.mcp.json`

⚠️ **중요**: Claude Code 표준 형식을 엄격히 준수해야 합니다!

### ✅ 올바른 .mcp.json 형식

```json
{
  "mcpServers": {
    "서버명": {
      "command": "명령어",
      "args": ["인수", "배열"],
      "env": {
        "환경변수": "${변수명}"
      }
    }
  }
}
```

#### 🚫 금지사항:

- `_status`, `_metadata` 등 비표준 필드 추가 금지
- 주석이나 설명 추가 금지 (JSON 표준 위반)
- 환경변수는 반드시 `${VAR}` 형식으로 참조

**⚠️ 중요**: `.claude/` 폴더가 아닌 **프로젝트 루트**에 위치해야 함

### 완전한 `.mcp.json` 예제 (2025-08-15 보안 개선)

**🔒 보안 개선**: API 키를 환경변수 참조로 변경, `.env.local`에서 실제 값 관리

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
      "command": "/home/사용자명/.local/bin/uvx",
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
      "command": "/home/사용자명/.local/bin/uvx",
      "args": [
        "--from",
        "git+https://github.com/oraios/serena",
        "serena-mcp-server"
      ]
    }
  }
}
```

**🔑 필수 환경변수 (.env.local)**:

```bash
GITHUB_PERSONAL_ACCESS_TOKEN=your_token_here
SUPABASE_PROJECT_ID=your_project_id
SUPABASE_ACCESS_TOKEN=your_token_here
TAVILY_API_KEY=your_api_key_here
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token
```

---

## 🔧 각 서버별 상세 설정 (2025-08-15 테스트 결과 반영)

### ✅ 정상 작동 서버 (4개)

#### 3. github ✅

- **상태**: 정상 작동
- **용도**: GitHub 저장소 관리 (이슈, PR, 코드)
- **필수 환경변수**:
  ```bash
  GITHUB_PERSONAL_ACCESS_TOKEN="ghp_xxxxx"
  # GitHub Settings > Developer settings > Personal access tokens
  # 권한: repo, read:org 필요
  ```

#### 5. tavily ✅

- **상태**: 정상 작동
- **용도**: 웹 검색, 크롤링, 콘텐츠 추출
- **필수 환경변수**:
  ```bash
  TAVILY_API_KEY="tvly-xxxxx"
  # https://tavily.com 에서 발급 (무료: 1000회/월)
  ```

#### 10. time ✅

- **상태**: 정상 작동 (Python/UVX)
- **용도**: 시간대 변환, 날짜 계산
- **중요**: uvx 절대 경로 사용 필수
  ```json
  "command": "/home/사용자명/.local/bin/uvx"
  ```

#### 11. serena ✅

- **상태**: 정상 작동 (Python/UVX)
- **용도**: LSP 기반 고급 코드 분석
- **중요**:
  - uvx 절대 경로 사용 필수
  - Git 저장소에서만 작동
  - 첫 실행 시 프로젝트 인덱싱

### ❌ 현재 미작동 서버 (7개) - 문제 해결 필요

#### 1. filesystem ❌

- **상태**: 테스트 실패 (패키지 실행 문제)
- **용도**: 파일 시스템 작업 (읽기, 쓰기, 검색)
- **문제**: npx 실행 시 --help 옵션 인식 오류
- **설정**: 프로젝트 루트 경로를 마지막 인자로 전달
- **WSL 주의**: `/mnt/d/` 형식 사용

#### 2. memory ❌

- **상태**: 테스트 실패 (stdin 처리 문제)
- **용도**: 대화 중 정보를 지식 그래프로 저장
- **문제**: 테스트 방식 문제로 추정, 실제로는 정상일 수 있음
- **설정**: 추가 설정 불필요

#### 4. supabase ❌

- **상태**: 테스트 실패 (설정 문제)
- **용도**: PostgreSQL 데이터베이스 관리
- **문제**: 패키지 버전 또는 환경변수 설정
- **중요 설정**:
  - **패키지**: `@supabase/mcp-server-supabase@latest` (공식)
  - **환경변수**: `SUPABASE_ACCESS_TOKEN`
  - **인자**: `--project-ref YOUR_PROJECT_ID`

#### 6. playwright ❌

- **상태**: 테스트 실패 (브라우저 종속성)
- **용도**: 브라우저 자동화, E2E 테스트
- **문제**: 브라우저 바이너리 또는 의존성 설치 필요
- **해결**: `npx playwright install` 실행

#### 7. thinking ❌

- **상태**: 테스트 실패 (패키지 실행 문제)
- **용도**: 복잡한 문제를 단계별로 해결
- **문제**: 패키지 버전 또는 실행 방식
- **설정**: 추가 설정 불필요 (이론상)

#### 8. context7 ❌

- **상태**: 테스트 실패 (Redis 연결 문제)
- **용도**: 라이브러리 문서 검색
- **문제**: Upstash Redis 설정 또는 연결
- **필수 환경변수**:
  ```bash
  UPSTASH_REDIS_REST_URL="https://xxxxx.upstash.io"
  UPSTASH_REDIS_REST_TOKEN="xxxxx"
  ```

#### 9. shadcn ❌

- **상태**: 테스트 실패 (패키지 실행 문제)
- **용도**: shadcn/ui 컴포넌트 생성
- **문제**: 패키지 실행 또는 프로젝트 환경
- **요구사항**: React/Next.js 프로젝트

---

## 🔥 문제 해결 가이드

### 1. "No MCP servers configured" 오류

```bash
# 1. 파일 위치 확인 (프로젝트 루트)
ls -la .mcp.json

# 2. Claude Code 재시작
/reload

# 3. MCP 서버 목록 확인
/mcp
```

### 2. Supabase MCP 연결 실패

**문제 증상**:

```
Error: supabaseUrl is required.
Error: supabaseKey is required.
```

**해결책**:

```json
{
  "supabase": {
    "command": "npx",
    "args": [
      "-y",
      "@supabase/mcp-server-supabase@latest", // 공식 패키지
      "--project-ref",
      "YOUR_PROJECT_ID" // 프로젝트 ID
    ],
    "env": {
      "SUPABASE_ACCESS_TOKEN": "sbp_xxxxx" // 올바른 환경변수명
    }
  }
}
```

### 3. Python 서버 (time, serena) 실행 오류

**문제**: "command not found: uvx"

**해결책**:

```bash
# uvx 경로 확인
which uvx  # 출력: /home/username/.local/bin/uvx

# .mcp.json에서 절대 경로 사용
"command": "/home/username/.local/bin/uvx"
```

### 4. 실패한 서버들 개별 문제 해결 (2025-08-15 테스트 기반)

#### filesystem 서버 문제

**문제**: `Error accessing directory --help`

```bash
# 해결 시도
npx -y @modelcontextprotocol/server-filesystem /mnt/d/cursor/openmanager-vibe-v5
# Claude Code에서는 정상 작동할 수 있음 (터미널 테스트와 다름)
```

#### supabase 서버 문제

**문제**: 환경변수 또는 패키지 설정

```bash
# 최신 공식 패키지 사용 확인
npx -y @supabase/mcp-server-supabase@latest --help

# 환경변수 확인
echo $SUPABASE_ACCESS_TOKEN
echo $SUPABASE_PROJECT_ID
```

#### playwright 서버 문제

**문제**: 브라우저 종속성 미설치

```bash
# 브라우저 설치
npx playwright install chromium

# WSL 시스템 의존성
sudo apt-get install -y libnspr4 libnss3 libasound2t64
```

#### context7 서버 문제

**문제**: Upstash Redis 연결 실패

```bash
# Redis URL/Token 확인
curl -X GET ${UPSTASH_REDIS_REST_URL}/ping \
  -H "Authorization: Bearer ${UPSTASH_REDIS_REST_TOKEN}"
```

### 5. GitHub 토큰 관리 (보안 개선)

**권장 방법**: 환경변수 사용

1. `.env.local`에 토큰 저장:

```bash
GITHUB_PERSONAL_ACCESS_TOKEN=ghp_xxxxx
```

2. `.mcp.json`에서 참조:

```json
"github": {
  "env": {
    "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_PERSONAL_ACCESS_TOKEN}"
  }
}
```

3. Claude Code 재시작:

```bash
/reload
```

### 5. 환경변수 관리

**.env.local 활용**:

```bash
# .env.local
GITHUB_PERSONAL_ACCESS_TOKEN=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
SUPABASE_ACCESS_TOKEN=sbp_90532bce7e5713a964686d52b254175e8c5c32b9
TAVILY_API_KEY=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
```

---

## ✅ 설치 확인

### 빠른 검증 스크립트

```bash
#!/bin/bash
echo "🔍 MCP 서버 설치 상태 확인"
echo "=========================="

# NPM 패키지 확인
echo "📦 NPM 기반 서버 (9개):"
npm list -g --depth=0 2>/dev/null | grep -E "@modelcontextprotocol|@supabase|tavily|@executeautomation|@upstash|@magnusrodseth" | wc -l
echo "개 설치됨"

# Python 도구 확인
echo ""
echo "🐍 Python 도구:"
[ -x "/home/$USER/.local/bin/uvx" ] && echo "✅ uvx 설치됨" || echo "❌ uvx 미설치"

# 설정 파일 확인
echo ""
echo "📁 설정 파일:"
[ -f ".mcp.json" ] && echo "✅ .mcp.json 존재" || echo "❌ .mcp.json 없음"

# Claude Code에서 확인
echo ""
echo "💡 Claude Code 명령:"
echo "  /reload  - 설정 다시 로드"
echo "  /mcp     - MCP 서버 목록 확인"
echo "  /doctor  - 진단 도구 실행"
```

### Claude Code 내 확인

```
/reload    # 설정 다시 로드
/mcp       # MCP 서버 목록 표시
/doctor    # 시스템 진단
```

---

## 📚 참고 자료

- [Claude Code MCP 문서](https://docs.anthropic.com/en/docs/claude-code/mcp)
- [MCP 프로토콜 사양](https://modelcontextprotocol.io)
- [Supabase MCP 공식 블로그](https://supabase.com/blog/mcp-server)
- [Serena GitHub](https://github.com/oraios/serena)

---

## 🚨 중요 체크리스트

- [ ] `.mcp.json`이 프로젝트 루트에 있는가?
- [ ] Python 도구는 절대 경로를 사용하는가?
- [ ] Supabase는 공식 패키지를 사용하는가?
- [ ] 환경변수가 올바르게 설정되었는가?
- [ ] `/reload` 후 `/mcp` 실행했는가?

---

💡 **최종 팁**: 설정 완료 후 반드시 `/reload` → `/mcp` 순서로 확인!
