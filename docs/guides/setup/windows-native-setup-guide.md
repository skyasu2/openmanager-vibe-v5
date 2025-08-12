# 🚀 Windows Native 개발 환경 설정 가이드

## 📋 목차

1. [시스템 요구사항](#시스템-요구사항)
2. [개발 도구 설치](#개발-도구-설치)
3. [프로젝트 설정](#프로젝트-설정)
4. [MCP 서버 설정](#mcp-서버-설정)
5. [환경변수 설정](#환경변수-설정)
6. [개발 워크플로우](#개발-워크플로우)
7. [트러블슈팅](#트러블슈팅)

## 🎯 시스템 요구사항

### 필수 소프트웨어
- **Windows 10/11** (64-bit)
- **Node.js** v22.15.1 이상
- **Git for Windows** (Git Bash 포함)
- **PowerShell** 5.1 이상 또는 PowerShell Core 7+
- **Python** 3.11+ (MCP 서버용)
- **Claude Code** 최신 버전

### 권장 개발 도구
- **Windows Terminal** (다중 터미널 관리)
- **Visual Studio Code** (코드 편집)
- **Chrome/Edge** (개발자 도구)

## 🛠️ 개발 도구 설치

### 1. Node.js 설치
```powershell
# winget으로 설치 (권장)
winget install OpenJS.NodeJS

# 또는 공식 사이트에서 다운로드
# https://nodejs.org/
```

### 2. Git for Windows 설치
```powershell
# winget으로 설치
winget install Git.Git

# Git Bash 포함 설치
# 설치 시 "Git Bash Here" 옵션 체크
```

### 3. Python 설치
```powershell
# winget으로 설치
winget install Python.Python.3.11

# pip 업그레이드
python -m pip install --upgrade pip

# uvx 설치 (MCP 서버용)
pip install uvx
```

### 4. Windows Terminal 설치
```powershell
# Microsoft Store 또는 winget
winget install Microsoft.WindowsTerminal
```

## 📁 프로젝트 설정

### 1. 프로젝트 클론
```bash
# Git Bash 또는 PowerShell
cd D:\cursor
git clone https://github.com/yourusername/openmanager-vibe-v5.git
cd openmanager-vibe-v5
```

### 2. 의존성 설치
```bash
# npm 패키지 설치
npm install

# Python 패키지 설치 (필요 시)
pip install -r requirements.txt
```

### 3. 환경변수 파일 생성
```bash
# .env.local 파일 복사
cp .env.local.template .env.local

# 편집기로 열어서 API 키 설정
notepad .env.local
```

## 🔌 MCP 서버 설정

### 자동 설치 (권장)

#### PowerShell 버전
```powershell
# 전체 MCP 서버 자동 설치
.\scripts\install-all-mcp-servers.ps1

# 환경변수 자동 로드
.\scripts\load-mcp-env.ps1

# Claude Code 시작
.\scripts\start-claude-with-mcp.ps1
```

#### Git Bash 버전
```bash
# 전체 MCP 서버 자동 설치
./scripts/install-all-mcp-servers.sh

# 환경변수 자동 로드
source scripts/load-mcp-env.sh

# Claude Code 시작
./scripts/start-claude-with-mcp.sh
```

### 수동 설치 (필요 시)

```bash
# Node.js 기반 서버
claude mcp add filesystem npx -- -y @modelcontextprotocol/server-filesystem@latest D:\cursor\openmanager-vibe-v5
claude mcp add github npx -- -y @modelcontextprotocol/server-github@latest
claude mcp add memory npx -- -y @modelcontextprotocol/server-memory@latest
claude mcp add supabase npx -- -y @supabase/mcp-server-supabase@latest
claude mcp add tavily-mcp npx -- -y tavily-mcp@latest
claude mcp add sequential-thinking npx -- -y @modelcontextprotocol/server-sequential-thinking@latest
claude mcp add playwright npx -- -y @playwright/mcp@latest

# Python 기반 서버
claude mcp add time uvx -- mcp-server-time
claude mcp add serena uvx -- --from git+https://github.com/oraios/serena serena-mcp-server --context ide-assistant --project D:\cursor\openmanager-vibe-v5

# npm 전역 설치 기반
npm install -g @upstash/context7-mcp @upstash/shadcn-ui-mcp
claude mcp add context7 context7-mcp
claude mcp add shadcn-ui shadcn-ui-mcp

# API 재시작
claude api restart
```

## 🔐 환경변수 설정

### 필수 환경변수 (.env.local)
```env
# GitHub
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxx
GITHUB_PERSONAL_ACCESS_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxx

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxxxxxxxxxxxxxxxxxx
SUPABASE_ANON_KEY=eyJxxxxxxxxxxxxxxxxxx
SUPABASE_ACCESS_TOKEN=sbp_xxxxxxxxxxxxxxxxxxxxx

# Tavily (웹 검색)
TAVILY_API_KEY=tvly-xxxxxxxxxxxxxxxxxxxxx

# Google AI (Gemini)
GOOGLE_AI_API_KEY=AIzaxxxxxxxxxxxxxxxxxxxxx
```

### Windows 시스템 환경변수 설정 (선택)
```powershell
# PowerShell (관리자 권한)
[Environment]::SetEnvironmentVariable("GITHUB_TOKEN", "ghp_xxx", "User")
[Environment]::SetEnvironmentVariable("TAVILY_API_KEY", "tvly-xxx", "User")
```

## 💻 개발 워크플로우

### 개발 서버 시작
```bash
# Git Bash 또는 PowerShell
npm run dev

# 메모리 증가 옵션과 함께 실행
NODE_OPTIONS='--max-old-space-size=8192' npm run dev
```

### 빌드 및 테스트
```bash
# 프로덕션 빌드
npm run build

# 테스트 실행
npm test
npm run test:e2e

# 린트 및 타입 체크
npm run lint
npm run type-check
```

### Git 작업
```bash
# 변경사항 커밋
git add .
git commit -m "feat: 기능 추가"

# 푸시 (CI/CD 자동 실행)
git push origin main
```

## 🐛 트러블슈팅

### 1. MCP 서버 연결 오류
```bash
# MCP 서버 재시작
claude api restart

# 설정 확인
claude mcp list
```

### 2. 경로 관련 문제
- Windows 경로 사용: `D:\cursor\openmanager-vibe-v5`
- Git Bash에서는 `/d/cursor/openmanager-vibe-v5` 형식도 사용 가능

### 3. 권한 문제
```powershell
# PowerShell을 관리자 권한으로 실행
# 실행 정책 변경 (필요 시)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### 4. Node.js 메모리 부족
```bash
# package.json의 scripts 섹션에 추가
"dev": "NODE_OPTIONS='--max-old-space-size=8192' next dev"
```

### 5. Python 패키지 문제
```bash
# pip 업그레이드
python -m pip install --upgrade pip

# uvx 재설치
pip uninstall uvx
pip install uvx
```

## 🚀 Windows Terminal 프로필 설정

Windows Terminal의 `settings.json`에 추가:

```json
{
  "profiles": {
    "list": [
      {
        "name": "OpenManager Dev",
        "commandline": "powershell.exe -NoExit -Command \"cd D:\\cursor\\openmanager-vibe-v5; .\\scripts\\start-claude-with-mcp.ps1\"",
        "startingDirectory": "D:\\cursor\\openmanager-vibe-v5",
        "icon": "🚀"
      },
      {
        "name": "OpenManager Git Bash",
        "commandline": "C:\\Program Files\\Git\\bin\\bash.exe",
        "startingDirectory": "D:\\cursor\\openmanager-vibe-v5",
        "icon": "🐚"
      }
    ]
  }
}
```

## 📊 성능 모니터링

### Windows 네이티브 도구 활용
```powershell
# 리소스 모니터 실행
resmon

# 작업 관리자 (성능 탭)
taskmgr

# PowerShell로 프로세스 확인
Get-Process node | Format-Table Name, CPU, WS -AutoSize
```

## 🔄 자동 업데이트

### MCP 서버 업데이트
```bash
# 스크립트로 자동 업데이트
./scripts/update-mcp-servers.sh

# 또는 개별 업데이트
claude mcp remove [server-name]
claude mcp add [server-name] [command]
```

## 📚 추가 리소스

- [Claude Code 공식 문서](https://docs.anthropic.com/en/docs/claude-code)
- [MCP 프로토콜 문서](https://docs.anthropic.com/en/docs/claude-code/mcp)
- [Windows Terminal 가이드](https://docs.microsoft.com/windows/terminal)
- [Node.js Windows 최적화](https://nodejs.org/en/docs/guides/getting-started-guide)

---

💡 **팁**: Windows Defender 예외 추가로 개발 성능 향상
```powershell
# PowerShell (관리자 권한)
Add-MpPreference -ExclusionPath "D:\cursor\openmanager-vibe-v5"
Add-MpPreference -ExclusionProcess "node.exe"
```