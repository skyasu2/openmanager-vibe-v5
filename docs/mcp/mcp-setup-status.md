ARCHIVED

> 최종 업데이트: 2025-08-12 22:55  
> Claude Code v1.0.73 | Windows 11 | Git Bash
> **🔍 정확한 분석**: 연결 성공 100% vs 도구 사용 가능 73% 분리 분석

## 📊 현재 MCP 서버 상태 (정밀 분석)

### 🔄 연결 vs 도구 사용 가능성 구분

**연결 성공률: 11/11 = 100%** ✅ (모든 서버 Connected)  
**도구 사용 가능률: 8/11 = 73%** ⚠️ (일부 서버 도구 등록 실패)

### ✅ 도구 사용 가능 서버 (8/11 = 73%)

| 서버명                  | 연결         | 도구 상태    | 용도                 | 실제 테스트 결과                  |
| ----------------------- | ------------ | ------------ | -------------------- | --------------------------------- |
| **filesystem**          | ✅ Connected | ✅ 사용 가능 | 파일 시스템 작업     | mcp**filesystem**\* 모두 정상     |
| **memory**              | ✅ Connected | ✅ 사용 가능 | 지식 그래프 관리     | mcp**memory**\* 모두 정상         |
| **github**              | ✅ Connected | ✅ 사용 가능 | GitHub 저장소 작업   | mcp**github**\* 모두 정상         |
| **sequential-thinking** | ✅ Connected | ✅ 사용 가능 | 복잡한 문제 해결     | mcp**sequential-thinking**\* 정상 |
| **time**                | ✅ Connected | ✅ 사용 가능 | 시간/시간대 변환     | mcp**time**\* 모두 정상           |
| **context7**            | ✅ Connected | ✅ 사용 가능 | 라이브러리 문서 검색 | mcp**context7**\* 모두 정상       |
| **shadcn-ui**           | ✅ Connected | ✅ 사용 가능 | UI 컴포넌트 개발     | mcp**shadcn_ui**\* 모두 정상      |
| **tavily-mcp**          | ✅ Connected | ✅ 사용 가능 | 웹 검색/크롤링       | mcp**tavily_mcp**\* 모두 정상     |

| 서버명         | 연결         | 도구 상태    | 근본 원인                | 실제 오류                                    |
| -------------- | ------------ | ------------ | ------------------------ | -------------------------------------------- |
| **supabase**   | ✅ Connected | ❌ 도구 없음 | 복잡한 DB 의존성         | `No such tool available: mcp__supabase__*`   |
| **playwright** | ✅ Connected | ❌ 도구 없음 | 브라우저 바이너리 의존성 | `No such tool available: mcp__playwright__*` |
| **serena**     | ✅ Connected | ❌ 도구 없음 | Git + LSP 복잡성         | `No such tool available: mcp__serena__*`     |

### 🔍 근본 원인 분석: 도구 초기화 vs 서버 연결

**핵심 발견**: Claude Code의 MCP 아키텍처는 **2단계 프로세스**

1. **서버 연결**: stdio 프로토콜로 MCP 서버 프로세스와 통신 연결
2. **도구 등록**: 서버에서 제공하는 도구들을 Claude의 도구 레지스트리에 등록

**실패 패턴**: 복잡한 의존성을 가진 서버들이 2단계(도구 등록)에서 실패

- **단순 의존성 서버**: 모든 단계 성공 (8개)
- **복잡 의존성 서버**: 1단계만 성공, 2단계 실패 (3개)

### 🔧 연결은 성공했으나 도구 등록이 실패한 서버들

| 원인 분류           | 서버       | 의존성 복잡도                   | 추정 실패 지점     |
| ------------------- | ---------- | ------------------------------- | ------------------ |
| **환경변수 복잡성** | supabase   | 4개 환경변수 + PostgreSQL 연결  | DB 초기화 과정     |
| **시스템 의존성**   | playwright | 브라우저 바이너리 + 시스템 권한 | 브라우저 검증 과정 |
| **다중 의존성**     | serena     | Git + Python + LSP + 코드 분석  | LSP 서버 시작 과정 |

## 🔧 Windows 환경 MCP 서버 설정 가이드

### 1️⃣ 기본 NPX 서버 설정 (filesystem, memory, github, sequential-thinking)

```bash
# Windows에서는 cmd /c wrapper 필수
claude mcp add filesystem "cmd /c npx -y @modelcontextprotocol/server-filesystem D:\cursor\openmanager-vibe-v5"
claude mcp add memory "cmd /c npx -y @modelcontextprotocol/server-memory"
claude mcp add github "cmd /c npx -y @modelcontextprotocol/server-github"
claude mcp add sequential-thinking "cmd /c npx -y @modelcontextprotocol/server-sequential-thinking"
```

**✅ 성공 요인:**

- `cmd /c` wrapper 사용으로 Windows 실행 컨텍스트 확보
- npx -y 플래그로 자동 설치 및 실행
- 환경변수 불필요한 단순 구조

### 2️⃣ Python 기반 서버 설정 (time)

```bash
# Python uvx 절대 경로 사용
claude mcp add time "C:\Users\skyas\AppData\Local\Programs\Python\Python311\Scripts\uvx.exe mcp-server-time"
```

**✅ 성공 요인:**

- uvx.exe 절대 경로 사용
- 단순한 인자 구조
- Python 3.11 이상 필수

### 3️⃣ npm 전역 설치 서버 (context7, shadcn-ui)

```bash
# 먼저 npm 전역 설치
npm install -g context7-mcp-server shadcn-ui-mcp-server

# npx로 실행 (cmd /c 없이도 작동)
claude mcp add context7 "npx -y context7-mcp-server"
claude mcp add shadcn-ui "npx -y shadcn-ui-mcp-server"
```

**✅ 성공 요인:**

- npm 전역 설치 후 npx 직접 호출
- Windows PATH에 등록된 명령어
- cmd /c wrapper 불필요

### 4️⃣ 환경변수 필요 서버 (tavily-mcp) 🆕

```bash
# JSON 방식으로 환경변수 포함하여 추가 (Windows에서 권장)
claude mcp add-json tavily-mcp '{"command":"cmd","args":["/c","npx","-y","tavily-mcp@latest"],"env":{"TAVILY_API_KEY":"your-api-key-here"}}'
```

**✅ 성공 요인:**

- `add-json` 명령어 사용으로 환경변수 정확히 전달
- cmd /c wrapper 사용
- JSON 형식으로 구조화된 설정

## 🚀 빠른 설정 스크립트

### PowerShell 스크립트 (권장)

```powershell
# setup-working-mcp.ps1
Write-Host "Windows MCP 서버 설정 시작..." -ForegroundColor Green

# 기본 NPX 서버들
$npxServers = @{
    "filesystem" = "cmd /c npx -y @modelcontextprotocol/server-filesystem D:\cursor\openmanager-vibe-v5"
    "memory" = "cmd /c npx -y @modelcontextprotocol/server-memory"
    "github" = "cmd /c npx -y @modelcontextprotocol/server-github"
    "sequential-thinking" = "cmd /c npx -y @modelcontextprotocol/server-sequential-thinking"
}

foreach ($server in $npxServers.GetEnumerator()) {
    Write-Host "Adding $($server.Key)..." -ForegroundColor Cyan
    claude mcp add $server.Key $server.Value
}

# Python 서버
Write-Host "Adding time server..." -ForegroundColor Cyan
claude mcp add time "C:\Users\skyas\AppData\Local\Programs\Python\Python311\Scripts\uvx.exe mcp-server-time"

# npm 전역 서버
Write-Host "Installing npm global packages..." -ForegroundColor Cyan
npm install -g context7-mcp-server shadcn-ui-mcp-server --silent

Write-Host "Adding npm global servers..." -ForegroundColor Cyan
claude mcp add context7 "npx -y context7-mcp-server"
claude mcp add shadcn-ui "npx -y shadcn-ui-mcp-server"

Write-Host "✅ 설정 완료! 'claude api restart'를 실행하세요." -ForegroundColor Green
```

### Git Bash 스크립트

```bash
#!/bin/bash
# setup-working-mcp.sh

echo "Windows MCP 서버 설정 시작..."

# 기본 NPX 서버들
claude mcp add filesystem "cmd /c npx -y @modelcontextprotocol/server-filesystem D:\\cursor\\openmanager-vibe-v5"
claude mcp add memory "cmd /c npx -y @modelcontextprotocol/server-memory"
claude mcp add github "cmd /c npx -y @modelcontextprotocol/server-github"
claude mcp add sequential-thinking "cmd /c npx -y @modelcontextprotocol/server-sequential-thinking"

# Python 서버
claude mcp add time "C:\\Users\\skyas\\AppData\\Local\\Programs\\Python\\Python311\\Scripts\\uvx.exe mcp-server-time"

# npm 전역 서버
npm install -g context7-mcp-server shadcn-ui-mcp-server
claude mcp add context7 "npx -y context7-mcp-server"
claude mcp add shadcn-ui "npx -y shadcn-ui-mcp-server"

echo "✅ 설정 완료! 'claude api restart'를 실행하세요."
```

## 📋 체크리스트

### 사전 요구사항

- [ ] Node.js v22+ 설치
- [ ] Python 3.11+ 설치
- [ ] Git for Windows 설치
- [ ] Claude Code v1.0.73+ 설치

### 설정 단계

- [ ] 기본 NPX 서버 4개 추가
- [ ] Python time 서버 추가
- [ ] npm 전역 패키지 설치
- [ ] context7, shadcn-ui 서버 추가
- [ ] `claude api restart` 실행
- [ ] `claude mcp list`로 연결 확인

## 🔍 문제 해결

### "Failed to connect" 에러

1. `claude api restart` 실행
2. 30초 대기
3. `claude mcp list` 재확인

### Python 서버 실패

1. Python 경로 확인: `where python`
2. uvx 설치: `pip install uv`
3. 절대 경로 사용

### npm 서버 실패

1. npm 전역 설치 확인: `npm list -g --depth=0`
2. PATH 환경변수 확인
3. 재설치: `npm install -g <package-name>`

## 🎯 성공 사례: 근본 원인 분석 및 해결

### 🔍 근본 문제 분석

| 문제 유형         | 서버               | 근본 원인                              | 해결책                   |
| ----------------- | ------------------ | -------------------------------------- | ------------------------ |
| **구조적 오류**   | serena, playwright | command 필드에 전체 명령어 문자열 혼재 | command와 args 명확 분리 |
| **프로토콜 누락** | supabase           | `"type": "stdio"` 필드 누락            | stdio 타입 명시 추가     |
| **환경변수 누락** | supabase           | `SUPABASE_ACCESS_TOKEN` 누락           | 필수 환경변수 추가       |

### 🛠️ 적용한 해결책

#### 1. Command/Args 구조 정규화

```json
// ❌ 잘못된 구조
"command": "C:\\...\\uvx.exe --from git+... serena-mcp-server"

// ✅ 올바른 구조
"command": "C:\\...\\uvx.exe",
"args": ["--from", "git+...", "serena-mcp-server"]
```

#### 2. 환경변수 완전성 검증

```json
// ✅ 완전한 Supabase 환경변수
"env": {
  "SUPABASE_URL": "...",
  "SUPABASE_ANON_KEY": "...",
  "SUPABASE_SERVICE_ROLE_KEY": "...",
  "SUPABASE_ACCESS_TOKEN": "..." // 누락되었던 핵심 변수
}
```

## 📈 정확한 성공률 분석 (실제 테스트 기준)

### 연결 vs 도구 사용 분리 분석

| 분석 기준          | 성공 서버 | 전체 서버 | 성공률   | 상태         |
| ------------------ | --------- | --------- | -------- | ------------ |
| **서버 연결**      | 11개      | 11개      | **100%** | ✅ 완벽      |
| **도구 사용 가능** | 8개       | 11개      | **73%**  | ⚠️ 일부 제한 |

### 카테고리별 상세 분석

| 카테고리            | 연결 성공 | 도구 사용 | 도구 성공률 | 대표 서버                    |
| ------------------- | --------- | --------- | ----------- | ---------------------------- |
| **NPX 기본**        | 4/4       | 4/4       | **100%**    | filesystem, memory           |
| **Python 기반**     | 2/2       | 1/2       | **50%**     | time(✅), serena(❌)         |
| **npm 전역**        | 2/2       | 2/2       | **100%**    | context7, shadcn-ui          |
| **웹/API 서비스**   | 2/2       | 1/2       | **50%**     | tavily-mcp(✅), supabase(❌) |
| **브라우저 자동화** | 1/1       | 0/1       | **0%**      | playwright(❌)               |
| **전체**            | **11/11** | **8/11**  | **73%**     | -                            |

### 🔍 실제 상황 요약

- **연결 성공률**: 100% (모든 서버가 Connected로 표시)
- **실용 성공률**: 73% (실제 도구를 사용할 수 있는 서버)
- **핵심 발견**: Claude Code MCP의 2단계 프로세스 중 도구 등록 단계에서 복잡한 의존성 서버들이 실패
- **권장사항**: 8개 정상 작동 서버만으로도 대부분의 개발 작업 가능

## 💡 핵심 인사이트

### Windows 환경 특성

1. **cmd /c wrapper**: Windows 네이티브 실행 컨텍스트 필요
2. **절대 경로**: Python 실행 파일은 절대 경로 필수
3. **환경변수 전달**: 현재 Windows에서 불안정

### 권장사항

- ✅ **핵심 활용**: 정상 작동하는 8개 서버로 대부분 개발 작업 가능
- 🔧 **대안 사용**: 3개 실패 서버는 외부 도구로 대체
  - Supabase → 직접 REST API 호출 (`curl` 명령어)
  - Playwright → Puppeteer, Selenium 등 대체 브라우저 자동화 도구
  - Serena → VSCode 내장 코드 분석 기능 또는 TypeScript LSP
- 📚 **활용 가이드**: [MCP 활용 가이드 2025](/docs/mcp-usage-guide-2025.md) 참조

## 📚 참고 자료

- [Claude Code 공식 문서](https://docs.anthropic.com/en/docs/claude-code/mcp)
- [MCP GitHub Repository](https://github.com/modelcontextprotocol)
- [Windows 환경 설정 이슈](https://github.com/anthropics/claude-code/issues)

---

_이 문서는 Windows 11 + Git Bash 환경에서 테스트되었습니다._
_문제 발생 시 GitHub 이슈에 보고해주세요._
