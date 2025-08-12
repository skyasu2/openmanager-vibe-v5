# MCP 서버 환경변수 설정 가이드

> 최종 업데이트: 2025-08-12 23:20  
> Claude Code v1.0.73 | Windows 11  
> **🎯 핵심**: .env.local 파일을 활용한 MCP 환경변수 자동 설정

## 📋 MCP 서버별 필요 환경변수

| MCP 서버 | 필요 환경변수 | .env.example 위치 | 용도 |
|----------|--------------|------------------|------|
| **Tavily MCP** | `TAVILY_API_KEY` | Line 154 | 웹 검색, 크롤링 API |
| **Supabase MCP** | `SUPABASE_ACCESS_TOKEN` | Line 159 | Supabase 프로젝트 관리 |
| **GitHub MCP** | `GITHUB_TOKEN` | Line 57 | GitHub API 접근 |
| **Google AI** | `GOOGLE_AI_API_KEY` | Line 34 | Gemini API (간접 활용) |

## 🔧 환경변수 설정 방법

### 방법 1: PowerShell 자동 로드 스크립트 (권장)

**`scripts/load-mcp-env.ps1` 생성:**

```powershell
# MCP 환경변수 자동 로드 스크립트
# .env.local 파일에서 MCP 관련 환경변수를 읽어 시스템에 설정

$envFile = ".env.local"

if (Test-Path $envFile) {
    Write-Host "📋 Loading MCP environment variables from $envFile" -ForegroundColor Green
    
    # .env.local 파일 읽기
    $envContent = Get-Content $envFile
    
    # MCP 관련 환경변수 목록
    $mcpVars = @(
        "TAVILY_API_KEY",
        "SUPABASE_ACCESS_TOKEN", 
        "GITHUB_TOKEN",
        "GOOGLE_AI_API_KEY",
        "SUPABASE_URL",
        "SUPABASE_SERVICE_ROLE_KEY",
        "SUPABASE_PROJECT_REF"
    )
    
    foreach ($line in $envContent) {
        # 주석과 빈 줄 건너뛰기
        if ($line -match "^\s*#" -or $line -match "^\s*$") {
            continue
        }
        
        # KEY=VALUE 형식 파싱
        if ($line -match "^([^=]+)=(.*)$") {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            
            # MCP 관련 변수만 설정
            if ($mcpVars -contains $key) {
                # 따옴표 제거
                $value = $value -replace '^["'']|["'']$', ''
                
                # 환경변수 설정
                [System.Environment]::SetEnvironmentVariable($key, $value, [System.EnvironmentVariableTarget]::Process)
                Write-Host "  ✅ $key configured" -ForegroundColor Gray
            }
        }
    }
    
    Write-Host "✨ MCP environment variables loaded successfully!" -ForegroundColor Green
} else {
    Write-Host "⚠️ .env.local file not found. Please create it from .env.example" -ForegroundColor Yellow
}
```

**사용법:**
```powershell
# PowerShell에서 실행
./scripts/load-mcp-env.ps1

# 또는 Claude Code 시작 전 실행
./scripts/load-mcp-env.ps1 && claude
```

### 방법 2: Git Bash 자동 로드 스크립트

**`scripts/load-mcp-env.sh` 생성:**

```bash
#!/bin/bash
# MCP 환경변수 자동 로드 스크립트

ENV_FILE=".env.local"

if [ -f "$ENV_FILE" ]; then
    echo "📋 Loading MCP environment variables from $ENV_FILE"
    
    # MCP 관련 환경변수만 export
    export $(grep -E '^(TAVILY_API_KEY|SUPABASE_ACCESS_TOKEN|GITHUB_TOKEN|GOOGLE_AI_API_KEY|SUPABASE_URL|SUPABASE_SERVICE_ROLE_KEY|SUPABASE_PROJECT_REF)=' $ENV_FILE | xargs)
    
    echo "✨ MCP environment variables loaded successfully!"
    
    # 로드된 변수 확인 (값은 마스킹)
    echo "Loaded variables:"
    [ ! -z "$TAVILY_API_KEY" ] && echo "  ✅ TAVILY_API_KEY ($(echo $TAVILY_API_KEY | cut -c1-10)...)"
    [ ! -z "$SUPABASE_ACCESS_TOKEN" ] && echo "  ✅ SUPABASE_ACCESS_TOKEN ($(echo $SUPABASE_ACCESS_TOKEN | cut -c1-10)...)"
    [ ! -z "$GITHUB_TOKEN" ] && echo "  ✅ GITHUB_TOKEN ($(echo $GITHUB_TOKEN | cut -c1-10)...)"
else
    echo "⚠️ .env.local file not found. Please create it from .env.example"
fi
```

**사용법:**
```bash
# Git Bash에서 실행
source scripts/load-mcp-env.sh

# 또는 .bashrc에 추가하여 자동 로드
echo "source ~/projects/openmanager-vibe-v5/scripts/load-mcp-env.sh" >> ~/.bashrc
```

### 방법 3: Windows 배치 파일

**`scripts/load-mcp-env.bat` 생성:**

```batch
@echo off
setlocal enabledelayedexpansion

set ENV_FILE=.env.local

if exist %ENV_FILE% (
    echo Loading MCP environment variables from %ENV_FILE%
    
    for /f "usebackq tokens=1,2 delims==" %%a in ("%ENV_FILE%") do (
        set key=%%a
        set value=%%b
        
        REM MCP 관련 변수만 설정
        if "!key!"=="TAVILY_API_KEY" set TAVILY_API_KEY=%%b
        if "!key!"=="SUPABASE_ACCESS_TOKEN" set SUPABASE_ACCESS_TOKEN=%%b
        if "!key!"=="GITHUB_TOKEN" set GITHUB_TOKEN=%%b
        if "!key!"=="GOOGLE_AI_API_KEY" set GOOGLE_AI_API_KEY=%%b
    )
    
    echo MCP environment variables loaded successfully!
) else (
    echo .env.local file not found. Please create it from .env.example
)
```

## 🚀 자동화된 MCP 시작 스크립트

### PowerShell 통합 스크립트

**`scripts/start-claude-with-mcp.ps1` 생성:**

```powershell
# Claude Code with MCP 환경변수 자동 로드

Write-Host "🚀 Starting Claude Code with MCP configuration..." -ForegroundColor Cyan

# 1. 환경변수 로드
& "$PSScriptRoot\load-mcp-env.ps1"

# 2. MCP 서버 상태 확인
Write-Host "`n📊 Checking MCP servers status..." -ForegroundColor Cyan
claude mcp list

# 3. 환경변수 검증
Write-Host "`n🔍 Verifying environment variables..." -ForegroundColor Cyan
$requiredVars = @{
    "TAVILY_API_KEY" = "Tavily MCP (Web Search)"
    "SUPABASE_ACCESS_TOKEN" = "Supabase MCP (Database)"
    "GITHUB_TOKEN" = "GitHub MCP (Optional)"
}

$allSet = $true
foreach ($var in $requiredVars.Keys) {
    $value = [System.Environment]::GetEnvironmentVariable($var)
    if ($value) {
        Write-Host "  ✅ $var is set for $($requiredVars[$var])" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️ $var is not set (required for $($requiredVars[$var]))" -ForegroundColor Yellow
        $allSet = $false
    }
}

if ($allSet) {
    Write-Host "`n✨ All required environment variables are configured!" -ForegroundColor Green
} else {
    Write-Host "`n⚠️ Some MCP servers may not function properly without their API keys" -ForegroundColor Yellow
}

Write-Host "`n🎯 Claude Code is ready with MCP servers!" -ForegroundColor Green
```

### Git Bash 통합 스크립트

**`scripts/start-claude-with-mcp.sh` 생성:**

```bash
#!/bin/bash

echo "🚀 Starting Claude Code with MCP configuration..."

# 1. 환경변수 로드
source "$(dirname "$0")/load-mcp-env.sh"

# 2. MCP 서버 상태 확인
echo -e "\n📊 Checking MCP servers status..."
claude mcp list

# 3. 환경변수 검증
echo -e "\n🔍 Verifying environment variables..."

check_var() {
    if [ ! -z "${!1}" ]; then
        echo "  ✅ $1 is set for $2"
        return 0
    else
        echo "  ⚠️ $1 is not set (required for $2)"
        return 1
    fi
}

all_set=true
check_var "TAVILY_API_KEY" "Tavily MCP (Web Search)" || all_set=false
check_var "SUPABASE_ACCESS_TOKEN" "Supabase MCP (Database)" || all_set=false
check_var "GITHUB_TOKEN" "GitHub MCP (Optional)" || true

if [ "$all_set" = true ]; then
    echo -e "\n✨ All required environment variables are configured!"
else
    echo -e "\n⚠️ Some MCP servers may not function properly without their API keys"
fi

echo -e "\n🎯 Claude Code is ready with MCP servers!"
```

## 📝 .env.local 설정 예시

```bash
# MCP 서버 필수 환경변수
# ========================================

# 🔍 Tavily AI 검색 (MCP)
# https://tavily.com에서 무료 API 키 발급
TAVILY_API_KEY=tvly-xxxxxxxxxxxxxxxxxxxxx

# 🗄️ Supabase MCP
# Supabase 대시보드 > Account > Access Tokens에서 생성
SUPABASE_ACCESS_TOKEN=sbp_xxxxxxxxxxxxxxxxxxxxx
SUPABASE_PROJECT_REF=vnswjnltnhpsueosfhmw

# 🐙 GitHub MCP (선택사항)
# GitHub Settings > Developer settings > Personal access tokens
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxx

# 🤖 Google AI (간접 활용)
GOOGLE_AI_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxxx

# Supabase 프로젝트 설정 (MCP에서 활용)
SUPABASE_URL=https://vnswjnltnhpsueosfhmw.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 🔐 보안 모범 사례

### 1. 절대 하지 말아야 할 것
- ❌ .env.local 파일을 Git에 커밋
- ❌ 환경변수 값을 코드에 하드코딩
- ❌ 로그나 에러 메시지에 API 키 노출

### 2. 반드시 해야 할 것
- ✅ .gitignore에 .env.local 포함 확인
- ✅ .env.example 템플릿 유지관리
- ✅ API 키는 필요한 권한만 부여
- ✅ 정기적으로 API 키 로테이션

### 3. Git 보안 설정
```bash
# .gitignore 확인
echo ".env.local" >> .gitignore
echo ".env.*.local" >> .gitignore

# 실수로 커밋된 경우 제거
git rm --cached .env.local
git commit -m "Remove .env.local from tracking"
```

## 🚀 빠른 시작 가이드

### Windows (PowerShell)
```powershell
# 1. .env.local 생성
Copy-Item .env.example .env.local

# 2. .env.local 편집하여 API 키 입력
notepad .env.local

# 3. MCP 환경변수 로드 및 시작
./scripts/start-claude-with-mcp.ps1
```

### Windows (Git Bash)
```bash
# 1. .env.local 생성
cp .env.example .env.local

# 2. .env.local 편집하여 API 키 입력
nano .env.local  # 또는 선호하는 에디터

# 3. MCP 환경변수 로드 및 시작
./scripts/start-claude-with-mcp.sh
```

## 🔍 환경변수 확인 방법

### PowerShell
```powershell
# 개별 확인
echo $env:TAVILY_API_KEY
echo $env:SUPABASE_ACCESS_TOKEN

# 모든 MCP 관련 변수 확인
Get-ChildItem env: | Where-Object {$_.Name -match "TAVILY|SUPABASE|GITHUB_TOKEN"}
```

### Git Bash
```bash
# 개별 확인
echo $TAVILY_API_KEY
echo $SUPABASE_ACCESS_TOKEN

# 모든 MCP 관련 변수 확인
env | grep -E "TAVILY|SUPABASE|GITHUB_TOKEN"
```

## 🛠️ 트러블슈팅

### 문제: 환경변수가 로드되지 않음
```bash
# 해결 1: 수동으로 export
export TAVILY_API_KEY="your-key-here"
export SUPABASE_ACCESS_TOKEN="your-token-here"

# 해결 2: Claude 재시작
claude api restart
```

### 문제: MCP 서버가 환경변수를 인식하지 못함
```bash
# 해결: 시스템 환경변수로 설정 (Windows)
setx TAVILY_API_KEY "your-key-here"
setx SUPABASE_ACCESS_TOKEN "your-token-here"
# 주의: 새 터미널에서 적용됨
```

### 문제: 권한 오류
```bash
# Git Bash에서 스크립트 실행 권한 부여
chmod +x scripts/load-mcp-env.sh
chmod +x scripts/start-claude-with-mcp.sh
```

## 📚 관련 문서

- [MCP 서버 활용 가이드](/docs/mcp-usage-guide-2025.md)
- [Windows MCP 설치 가이드](/docs/windows-mcp-complete-installation-guide.md)
- [환경변수 보안 가이드](/docs/environment-variables-guide.md)

---

**💡 핵심 포인트**: .env.local 파일 하나로 모든 MCP 서버의 환경변수를 중앙 관리하여 보안과 편의성을 동시에 확보! 🔐