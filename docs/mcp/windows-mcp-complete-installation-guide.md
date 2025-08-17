ARCHIVED

> 최종 업데이트: 2025-08-12 22:45  
> Claude Code v1.0.73 | Windows 11 | Git Bash/PowerShell  
> **성과**: 11/11 서버 100% 연결 성공! 🎉

## 🎯 개요

**Claude Code**용 MCP(Model Context Protocol) 서버 11개를 Windows 환경에서 100% 성공적으로 설치하는 완전 가이드입니다.

### 🏆 지원하는 MCP 서버 (11개 전체)

| 카테고리          | 서버 개수 | 서버 목록                                                                         | 난이도 |
| ----------------- | --------- | --------------------------------------------------------------------------------- | ------ |
| **NPX 기반**      | 7개       | filesystem, memory, github, sequential-thinking, supabase, tavily-mcp, playwright | ⭐⭐   |
| **Python 기반**   | 2개       | time, serena                                                                      | ⭐⭐⭐ |
| **npm 전역 기반** | 2개       | context7, shadcn-ui                                                               | ⭐⭐   |

### 📋 사전 요구사항

#### 필수 소프트웨어

- [x] **Windows 11** (Windows 10도 가능)
- [x] **Node.js v22+** ([다운로드](https://nodejs.org/))
- [x] **Python 3.11+** ([다운로드](https://python.org/downloads/))
- [x] **Git for Windows** ([다운로드](https://git-scm.com/download/win))
- [x] **Claude Code v1.0.73+** ([설치 가이드](https://docs.anthropic.com/en/docs/claude-code/quickstart))

#### 터미널 환경

- **Git Bash** (권장) 또는 **PowerShell**
- **관리자 권한** (일부 전역 설치 시)

---

## 🚀 빠른 시작 (자동 설치)

### PowerShell 자동 설치 스크립트

```powershell
# Windows PowerShell에서 실행 (관리자 권한 권장)
Write-Host "Windows MCP 서버 자동 설치 시작..." -ForegroundColor Green

# 1. NPX 기반 서버 (7개)
Write-Host "`n1️⃣ NPX 기반 서버 설치..." -ForegroundColor Cyan
claude mcp add filesystem "cmd /c npx -y @modelcontextprotocol/server-filesystem D:\cursor\openmanager-vibe-v5"
claude mcp add memory "cmd /c npx -y @modelcontextprotocol/server-memory"
claude mcp add github "cmd /c npx -y @modelcontextprotocol/server-github"
claude mcp add sequential-thinking "cmd /c npx -y @modelcontextprotocol/server-sequential-thinking"

# 2. Python 기반 서버 (2개)
Write-Host "`n2️⃣ Python 기반 서버 설치..." -ForegroundColor Cyan
claude mcp add time "C:\Users\$env:USERNAME\AppData\Local\Programs\Python\Python311\Scripts\uvx.exe mcp-server-time"

# 3. npm 전역 서버 사전 설치 (2개)
Write-Host "`n3️⃣ npm 전역 패키지 설치..." -ForegroundColor Cyan
npm install -g context7-mcp-server shadcn-ui-mcp-server

# 4. npm 전역 서버 등록 (2개)
Write-Host "`n4️⃣ npm 전역 서버 등록..." -ForegroundColor Cyan
claude mcp add context7 "npx -y context7-mcp-server"
claude mcp add shadcn-ui "npx -y shadcn-ui-mcp-server"

# 완료
Write-Host "`n✅ 기본 서버 설치 완료!" -ForegroundColor Green
Write-Host "환경변수가 필요한 서버(supabase, tavily-mcp, serena, playwright)는 수동 설치 필요" -ForegroundColor Yellow
Write-Host "`n다음 명령어로 확인: claude api restart && claude mcp list" -ForegroundColor Cyan
```

---

## 📦 카테고리별 상세 설치 가이드

### 1️⃣ NPX 기반 서버 (7개) - cmd wrapper 사용

**핵심 원리**: Windows에서는 `cmd /c` wrapper를 사용하여 npx 명령어를 실행합니다.

#### 1.1 기본 NPX 서버 (환경변수 불필요) - 4개

```bash
# Git Bash 또는 PowerShell에서 실행
claude mcp add filesystem "cmd /c npx -y @modelcontextprotocol/server-filesystem D:\\cursor\\openmanager-vibe-v5"
claude mcp add memory "cmd /c npx -y @modelcontextprotocol/server-memory"
claude mcp add github "cmd /c npx -y @modelcontextprotocol/server-github"
claude mcp add sequential-thinking "cmd /c npx -y @modelcontextprotocol/server-sequential-thinking"
```

**설정 결과 (.claude.json)**:

```json
"filesystem": {
  "type": "stdio",
  "command": "cmd",
  "args": ["/c", "npx -y @modelcontextprotocol/server-filesystem D:\\cursor\\openmanager-vibe-v5"],
  "env": {}
}
```

#### 1.2 환경변수 필요 NPX 서버 - 3개

##### Supabase MCP 서버

```bash
# JSON 방식 설정 (권장)
claude mcp add-json supabase '{
  "type": "stdio",
  "command": "cmd",
  "args": ["/c", "npx", "-y", "@supabase/mcp-server-supabase@latest"],
  "env": {
    "SUPABASE_URL": "YOUR_SUPABASE_PROJECT_URL",
    "SUPABASE_ANON_KEY": "YOUR_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY": "YOUR_SERVICE_ROLE_KEY",
    "SUPABASE_ACCESS_TOKEN": "YOUR_SERVICE_ROLE_KEY"
  }
}'
```

**환경변수 설정 방법**:

1. Supabase 대시보드 → Settings → API
2. Project URL, anon key, service_role key 복사
3. `SUPABASE_ACCESS_TOKEN`은 `service_role key`와 동일값 사용

##### Tavily MCP 서버 (웹 검색)

```bash
# Tavily API 키 발급: https://tavily.com
claude mcp add-json tavily-mcp '{
  "type": "stdio",
  "command": "cmd",
  "args": ["/c", "npx", "-y", "tavily-mcp@latest"],
  "env": {
    "TAVILY_API_KEY": "tvly-YOUR_API_KEY_HERE"
  }
}'
```

##### Playwright MCP 서버 (브라우저 자동화)

```bash
# 환경변수 불필요
claude mcp add playwright "cmd /c npx -y @playwright/mcp@latest"
```

### 2️⃣ Python 기반 서버 (2개) - uvx 직접 사용

**핵심 원리**: Python uvx 실행 파일의 절대 경로를 사용합니다.

#### 2.1 Time MCP 서버

```bash
# Python uvx 절대 경로 확인
where python
# 결과: C:\Users\USERNAME\AppData\Local\Programs\Python\Python311\Scripts\python.exe

# uvx 경로 구성하여 설치
claude mcp add time "C:\\Users\\USERNAME\\AppData\\Local\\Programs\\Python\\Python311\\Scripts\\uvx.exe mcp-server-time"
```

**설정 결과**:

```json
"time": {
  "type": "stdio",
  "command": "C:\\Users\\USERNAME\\AppData\\Local\\Programs\\Python\\Python311\\Scripts\\uvx.exe",
  "args": ["mcp-server-time"],
  "env": {}
}
```

#### 2.2 Serena MCP 서버 (고급 코드 분석)

```bash
# GitHub에서 직접 설치
claude mcp add-json serena '{
  "type": "stdio",
  "command": "C:\\Users\\USERNAME\\AppData\\Local\\Programs\\Python\\Python311\\Scripts\\uvx.exe",
  "args": ["--from", "git+https://github.com/oraios/serena", "serena-mcp-server"],
  "env": {}
}'
```

**주의사항**:

- `USERNAME`을 실제 사용자명으로 변경
- Python 3.11 이상 필수
- 처음 실행 시 GitHub에서 다운로드하므로 시간이 걸림

### 3️⃣ npm 전역 기반 서버 (2개) - 사전 설치 필요

**핵심 원리**: npm으로 전역 설치 후 npx로 직접 호출합니다.

#### 3.1 사전 설치

```bash
# npm 전역 설치 (관리자 권한 권장)
npm install -g context7-mcp-server shadcn-ui-mcp-server
```

#### 3.2 MCP 서버 등록

```bash
# Context7 (라이브러리 문서 검색)
claude mcp add context7 "npx -y context7-mcp-server"

# Shadcn-UI (UI 컴포넌트 개발)
claude mcp add shadcn-ui "npx -y shadcn-ui-mcp-server"
```

**설정 결과**:

```json
"context7": {
  "type": "stdio",
  "command": "npx -y context7-mcp-server",
  "args": [],
  "env": {}
}
```

---

## ✅ 설치 검증 및 테스트

### 1단계: API 재시작

```bash
claude api restart
# 30초 대기
```

### 2단계: 연결 상태 확인

```bash
claude mcp list
```

**예상 결과**:

```
Checking MCP server health...

filesystem: cmd /c npx -y @modelcontextprotocol/server-filesystem ... - ✓ Connected
memory: cmd /c npx -y @modelcontextprotocol/server-memory - ✓ Connected
github: cmd /c npx -y @modelcontextprotocol/server-github - ✓ Connected
sequential-thinking: cmd /c npx -y @modelcontextprotocol/server-sequential-thinking - ✓ Connected
time: C:\Users\...\uvx.exe mcp-server-time - ✓ Connected
context7: npx -y context7-mcp-server - ✓ Connected
shadcn-ui: npx -y shadcn-ui-mcp-server - ✓ Connected
serena: C:\Users\...\uvx.exe --from git+... - ✓ Connected
supabase: cmd /c npx -y @supabase/mcp-server-supabase@latest - ✓ Connected
tavily-mcp: cmd /c npx -y tavily-mcp@latest - ✓ Connected
playwright: cmd /c npx -y @playwright/mcp@latest - ✓ Connected
```

### 3단계: 개별 서버 기능 테스트

```bash
# Claude Code에서 테스트
# 예: filesystem 테스트
# "프로젝트 루트의 파일 목록을 보여줘"

# 예: time 테스트
# "현재 서울 시간을 알려줘"

# 예: tavily-mcp 테스트
# "최신 AI 뉴스를 웹에서 검색해줘"
```

---

## 🔧 문제 해결 가이드

### 자주 발생하는 문제들

#### 1. "Failed to connect" 오류

**원인**: 서버 초기화 실패 또는 설정 오류

**해결책**:

```bash
# 1. API 재시작
claude api restart

# 2. 30초 대기 후 재확인
claude mcp list

# 3. 특정 서버 재설정
claude mcp remove 서버명
claude mcp add 서버명 "설정내용"
```

#### 2. Python 서버 실패 (time, serena)

**원인**: Python/uvx 경로 문제

**해결책**:

```bash
# 1. Python 경로 확인
where python
py --version

# 2. uvx 설치 확인
pip install uv

# 3. 절대 경로 사용
claude mcp add time "C:\\Users\\실제사용자명\\AppData\\Local\\Programs\\Python\\Python311\\Scripts\\uvx.exe mcp-server-time"
```

#### 3. npm 전역 서버 실패

**원인**: 전역 설치 누락 또는 PATH 문제

**해결책**:

```bash
# 1. 전역 설치 확인
npm list -g --depth=0 | findstr context7
npm list -g --depth=0 | findstr shadcn-ui

# 2. 재설치
npm install -g context7-mcp-server shadcn-ui-mcp-server

# 3. PATH 확인
npm config get prefix
```

#### 4. 환경변수 서버 실패 (supabase, tavily-mcp)

**원인**: 환경변수 누락 또는 잘못된 형식

**해결책**:

```bash
# 1. 환경변수 확인
# Supabase: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ACCESS_TOKEN
# Tavily: TAVILY_API_KEY

# 2. JSON 형식으로 재설정
claude mcp remove supabase
claude mcp add-json supabase '{설정내용}'
```

### 고급 문제 해결

#### MCP 서버 디버그 모드

```bash
# MCP 디버그 정보 활성화
claude --mcp-debug mcp list

# 상세 로그 확인
$env:MCP_DEBUG=1  # PowerShell
export MCP_DEBUG=1  # Git Bash
```

#### 설정 파일 직접 편집

```bash
# .claude.json 위치: C:\Users\USERNAME\.claude.json
# 백업 생성 후 직접 편집 가능

# 백업
cp C:\Users\USERNAME\.claude.json C:\Users\USERNAME\.claude.json.backup

# 편집 후 재시작
claude api restart
```

---

## 📚 각 MCP 서버 활용 방법

### 🗂️ filesystem

```
- 파일/폴더 읽기, 쓰기, 검색
- 예: "src 폴더의 TypeScript 파일들을 찾아줘"
```

### 🧠 memory

```
- 지식 그래프 관리, 정보 저장
- 예: "이 버그 해결 방법을 기억해둬"
```

### 🐙 github

```
- GitHub 저장소 관리
- 예: "새 이슈를 생성해줘"
```

### 🤔 sequential-thinking

```
- 복잡한 문제 단계별 해결
- 예: "이 알고리즘을 단계별로 분석해줘"
```

### ⏰ time

```
- 시간대 변환, 현재 시간
- 예: "뉴욕과 서울의 현재 시간 차이는?"
```

### 📖 context7

```
- 라이브러리 문서 검색
- 예: "React Hook 사용법을 찾아줘"
```

### 🎨 shadcn-ui

```
- UI 컴포넌트 개발 지원
- 예: "Button 컴포넌트 예시를 보여줘"
```

### 🔍 serena

```
- 고급 코드 분석 (LSP)
- 예: "이 함수의 사용처를 모두 찾아줘"
```

### 🗄️ supabase

```
- PostgreSQL 데이터베이스 관리
- 예: "users 테이블 구조를 보여줘"
```

### 🌐 tavily-mcp

```
- 웹 검색, 크롤링, 콘텐츠 추출
- 예: "최신 Next.js 15 기능을 웹에서 검색해줘"
```

### 🎭 playwright

```
- 브라우저 자동화, E2E 테스트
- 예: "이 웹페이지의 스크린샷을 찍어줘"
```

---

## 🚀 성능 최적화 팁

### 1. 메모리 사용량 최적화

```bash
# Node.js 메모리 제한 설정
set NODE_OPTIONS=--max-old-space-size=4096
```

### 2. 연결 시간 단축

```bash
# MCP 타임아웃 설정
set MCP_TIMEOUT=30000  # 30초
```

### 3. 캐시 활용

- NPX 패키지는 자동으로 캐시됨
- Python uvx도 패키지 캐시 활용
- 재연결 시 빠른 속도 보장

---

## 📈 업그레이드 및 유지보수

### MCP 서버 업데이트

```bash
# NPX 기반 서버 (자동 최신 버전)
# -y 플래그로 항상 최신 버전 다운로드

# Python 기반 서버 업데이트
pip install --upgrade uv

# npm 전역 서버 업데이트
npm update -g context7-mcp-server shadcn-ui-mcp-server
```

### 정기 점검 (주 1회 권장)

```bash
# 1. 서버 상태 확인
claude mcp list

# 2. 업데이트 확인
claude --version
npm update -g

# 3. 사용하지 않는 서버 제거
claude mcp remove 서버명
```

---

## 🎯 완료 체크리스트

### 설치 완료 확인

- [ ] Node.js v22+ 설치
- [ ] Python 3.11+ 설치
- [ ] Claude Code v1.0.73+ 설치
- [ ] 11개 서버 모두 ✓ Connected 상태
- [ ] 각 서버 기본 기능 테스트 완료

### 고급 설정

- [ ] 환경변수 서버 API 키 설정 (supabase, tavily-mcp)
- [ ] 프로젝트별 filesystem 경로 설정
- [ ] 성능 최적화 옵션 적용

### 유지보수 설정

- [ ] 백업 설정 (.claude.json)
- [ ] 업데이트 주기 설정 (주 1회)
- [ ] 문제 해결 가이드 숙지

---

## 🆘 지원 및 커뮤니티

### 공식 문서

- [Claude Code 공식 문서](https://docs.anthropic.com/en/docs/claude-code)
- [MCP 공식 문서](https://docs.anthropic.com/en/docs/claude-code/mcp)

### 커뮤니티

- [Claude Code GitHub Issues](https://github.com/anthropics/claude-code/issues)
- [MCP GitHub Repository](https://github.com/modelcontextprotocol)

### 프로젝트 문의

- GitHub: [OpenManager VIBE v5 이슈](https://github.com/your-repo/issues)
- 개발팀 연락처: skyasu2@gmail.com

---

**🎉 축하합니다!** Windows 환경에서 Claude Code MCP 서버 11개를 모두 성공적으로 설치하셨습니다. 이제 AI 개발의 모든 기능을 활용하실 수 있습니다!
