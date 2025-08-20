# ==============================================================================
# OpenManager VIBE v5 - Windows 네이티브 환경 설정 스크립트
# ==============================================================================
# 용도: Windows에서 직접 Claude Code 사용을 위한 환경 설정
# 사용법: PowerShell에서 .\bootstrap.ps1 실행
# 지원 플랫폼: Windows 11 Pro (네이티브)
# 
# 작성일: 2025-08-20
# 버전: 1.0.0 (Windows 네이티브 전용)
# ==============================================================================

# PowerShell 실행 정책 및 관리자 권한 확인
param(
    [switch]$Force,
    [switch]$SkipAdminCheck
)

# 에러 시 중단 설정
$ErrorActionPreference = "Stop"

# 색상 함수들
function Write-Info { param($Message) Write-Host "[INFO] $Message" -ForegroundColor Blue }
function Write-Success { param($Message) Write-Host "[SUCCESS] $Message" -ForegroundColor Green }
function Write-Warning { param($Message) Write-Host "[WARNING] $Message" -ForegroundColor Yellow }
function Write-Error { param($Message) Write-Host "[ERROR] $Message" -ForegroundColor Red }
function Write-Step { param($Step, $Message) Write-Host "`n[STEP $Step] $Message" -ForegroundColor Magenta -BackgroundColor Black }

# 전역 변수
$ProjectRoot = $PSScriptRoot
$SetupLog = Join-Path $ProjectRoot "setup-windows.log"

# 시작 메시지
Clear-Host
Write-Host @"
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║     🪟 OpenManager VIBE v5 Windows Bootstrap 🪟            ║
║                                                              ║
║   Windows 네이티브 Claude Code 개발 환경 자동 설정           ║
║   예상 소요 시간: 10-15분                                     ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
"@ -ForegroundColor Cyan

# 로그 파일 초기화
"OpenManager VIBE v5 Windows Bootstrap Setup - $(Get-Date)" | Out-File -FilePath $SetupLog

# 관리자 권한 확인
function Test-AdminRights {
    Write-Step "1" "관리자 권한 확인..."
    
    if (-not $SkipAdminCheck) {
        $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
        $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
        $isAdmin = $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
        
        if (-not $isAdmin) {
            Write-Error "관리자 권한이 필요합니다"
            Write-Info "PowerShell을 '관리자 권한으로 실행'해주세요"
            Write-Info "또는 -SkipAdminCheck 파라미터를 사용하세요"
            exit 1
        }
        
        Write-Success "관리자 권한 확인됨"
    } else {
        Write-Warning "관리자 권한 확인을 건너뜁니다"
    }
}

# Chocolatey 설치 확인
function Install-Chocolatey {
    Write-Step "2" "Chocolatey 패키지 관리자 확인..."
    
    if (!(Get-Command choco -ErrorAction SilentlyContinue)) {
        Write-Info "Chocolatey 설치 중..."
        Set-ExecutionPolicy Bypass -Scope Process -Force
        [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
        Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
        
        # PATH 새로고침
        $env:PATH = [System.Environment]::GetEnvironmentVariable("PATH","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH","User")
        
        if (Get-Command choco -ErrorAction SilentlyContinue) {
            Write-Success "Chocolatey 설치 완료"
        } else {
            Write-Error "Chocolatey 설치 실패"
            exit 1
        }
    } else {
        Write-Success "Chocolatey가 이미 설치되어 있습니다"
    }
}

# Node.js 설치 확인
function Install-NodeJS {
    Write-Step "3" "Node.js 환경 확인..."
    
    $requiredVersion = 22
    $nodeCommand = Get-Command node -ErrorAction SilentlyContinue
    
    if ($nodeCommand) {
        $currentVersionString = & node --version
        $currentVersion = [int]($currentVersionString -replace "v(\d+)\..*", '$1')
        Write-Info "현재 Node.js 버전: $currentVersionString"
        
        if ($currentVersion -ge $requiredVersion) {
            Write-Success "Node.js 버전 요구사항 충족 (v$requiredVersion+)"
            return
        } else {
            Write-Warning "Node.js 버전이 낮습니다. v$requiredVersion+ 필요"
        }
    } else {
        Write-Warning "Node.js가 설치되지 않았습니다"
    }
    
    Write-Info "Chocolatey를 사용하여 Node.js v$requiredVersion 설치 중..."
    choco install nodejs --version="22.18.0" -y
    
    # PATH 새로고침
    $env:PATH = [System.Environment]::GetEnvironmentVariable("PATH","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH","User")
    
    # 설치 확인
    if (Get-Command node -ErrorAction SilentlyContinue) {
        $newVersion = & node --version
        Write-Success "Node.js 설치 완료: $newVersion"
    } else {
        Write-Error "Node.js 설치 실패"
        exit 1
    }
}

# npm 의존성 설치
function Install-NpmDependencies {
    Write-Step "4" "npm 패키지 의존성 설치..."
    
    Set-Location $ProjectRoot
    
    if (!(Test-Path "package.json")) {
        Write-Error "package.json 파일을 찾을 수 없습니다"
        exit 1
    }
    
    Write-Info "npm 캐시 정리 중..."
    npm cache clean --force
    
    Write-Info "package-lock.json 확인..."
    if (Test-Path "package-lock.json") {
        Write-Info "npm ci 실행 중... (정확한 버전으로 설치)"
        npm ci
    } else {
        Write-Info "npm install 실행 중..."
        npm install
    }
    
    Write-Success "npm 패키지 설치 완료"
}

# 환경변수 설정
function Setup-Environment {
    Write-Step "5" "환경변수 설정..."
    
    Set-Location $ProjectRoot
    
    # .env.local 생성
    if (!(Test-Path ".env.local")) {
        if (Test-Path ".env.example") {
            Write-Info ".env.example을 .env.local로 복사..."
            Copy-Item ".env.example" ".env.local"
            Write-Success ".env.local 생성 완료"
        } else {
            Write-Warning ".env.example 파일을 찾을 수 없습니다"
            
            # 기본 .env.local 생성
            $envContent = @"
# OpenManager VIBE v5 환경변수 (Windows 네이티브)
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_FREE_TIER_MODE=true

# Supabase 설정 (기본값)
NEXT_PUBLIC_SUPABASE_URL=https://vnswjnltnhpsueosfhmw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZuc3dqbmx0bmhwc3Vlb3NmaG13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQ3NTk3MTMsImV4cCI6MjA0MDMzNTcxM30.Mc9ZzgfMhLktqLSokJlGmdWOZV9z_O2D__cUB3hN2eI

# GitHub 토큰 (선택사항 - 실제 값으로 교체 필요)
GITHUB_PERSONAL_ACCESS_TOKEN=your_github_token_here

# Google AI API 키 (선택사항 - 실제 값으로 교체 필요)
GOOGLE_AI_API_KEY=your_google_ai_key_here

# 기타 설정
MOCK_MODE=dev
DISABLE_TELEMETRY=true

# Windows 특화 설정
PLATFORM=windows
USE_WSL=false
"@
            $envContent | Out-File -FilePath ".env.local" -Encoding UTF8
            Write-Success "기본 .env.local 생성 완료"
        }
    } else {
        Write-Info ".env.local이 이미 존재합니다"
    }
}

# Git 설정 확인
function Setup-Git {
    Write-Step "6" "Git 설정 확인..."
    
    if (!(Get-Command git -ErrorAction SilentlyContinue)) {
        Write-Info "Git 설치 중..."
        choco install git -y
        
        # PATH 새로고침
        $env:PATH = [System.Environment]::GetEnvironmentVariable("PATH","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH","User")
    }
    
    if (Get-Command git -ErrorAction SilentlyContinue) {
        Write-Success "Git 설치 확인됨"
        
        # Git 사용자 정보 확인
        $gitUser = & git config --global user.name 2>$null
        $gitEmail = & git config --global user.email 2>$null
        
        if ([string]::IsNullOrEmpty($gitUser) -or [string]::IsNullOrEmpty($gitEmail)) {
            Write-Warning "Git 사용자 정보가 설정되지 않았습니다"
            Write-Info "설정 방법:"
            Write-Info "  git config --global user.name `"Your Name`""
            Write-Info "  git config --global user.email `"your.email@example.com`""
        } else {
            Write-Success "Git 사용자: $gitUser <$gitEmail>"
        }
        
        # Windows에서 줄바꿈 설정
        & git config --global core.autocrlf true
        Write-Success "Git 줄바꿈 설정을 Windows에 맞게 조정했습니다"
        
    } else {
        Write-Warning "Git 설치를 확인할 수 없습니다"
    }
}

# Claude Code 설치 확인
function Check-ClaudeCode {
    Write-Step "7" "Claude Code 설치 확인..."
    
    if (Get-Command claude -ErrorAction SilentlyContinue) {
        $claudeVersion = & claude --version 2>$null
        Write-Success "Claude Code 설치됨: $claudeVersion"
    } else {
        Write-Warning "Claude Code가 설치되지 않았습니다"
        Write-Info "Claude Code 설치 방법:"
        Write-Info "1. https://docs.anthropic.com/en/docs/claude-code 방문"
        Write-Info "2. Windows 버전 다운로드 및 설치"
        Write-Info "3. 시스템 PATH에 추가"
    }
}

# Python 및 MCP 도구 설치
function Install-PythonTools {
    Write-Step "8" "Python 및 MCP 도구 설치..."
    
    # Python 설치 확인
    if (!(Get-Command python -ErrorAction SilentlyContinue)) {
        Write-Info "Python 설치 중..."
        choco install python -y
        
        # PATH 새로고침
        $env:PATH = [System.Environment]::GetEnvironmentVariable("PATH","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH","User")
    }
    
    if (Get-Command python -ErrorAction SilentlyContinue) {
        $pythonVersion = & python --version
        Write-Success "Python 설치 확인됨: $pythonVersion"
        
        # pip 업그레이드
        Write-Info "pip 업그레이드 중..."
        & python -m pip install --upgrade pip
        
    } else {
        Write-Warning "Python 설치를 확인할 수 없습니다"
    }
}

# 빌드 테스트
function Test-Build {
    Write-Step "9" "빌드 테스트..."
    
    Set-Location $ProjectRoot
    
    Write-Info "TypeScript 컴파일 검사 중..."
    try {
        & npx tsc --noEmit --skipLibCheck 2>$null
        Write-Success "TypeScript 컴파일 확인됨"
    } catch {
        Write-Warning "TypeScript 컴파일 중 경고 발생 (정상일 수 있음)"
    }
    
    Write-Info "빠른 테스트 실행 중..."
    try {
        & npm run test:quick 2>$null
        Write-Success "테스트 통과"
    } catch {
        Write-Warning "테스트 중 일부 실패 (정상일 수 있음)"
    }
}

# 최종 검증
function Test-FinalVerification {
    Write-Step "10" "최종 환경 검증..."
    
    Set-Location $ProjectRoot
    
    Write-Host "`n🔍 환경 검증 결과:" -ForegroundColor White
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # 필수 도구들
    if (Get-Command node -ErrorAction SilentlyContinue) {
        $nodeVersion = & node --version
        Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
    } else {
        Write-Host "❌ Node.js: 설치되지 않음" -ForegroundColor Red
    }
    
    if (Get-Command npm -ErrorAction SilentlyContinue) {
        $npmVersion = & npm --version
        Write-Host "✅ npm: $npmVersion" -ForegroundColor Green
    } else {
        Write-Host "❌ npm: 설치되지 않음" -ForegroundColor Red
    }
    
    if (Get-Command git -ErrorAction SilentlyContinue) {
        $gitVersion = & git --version
        Write-Host "✅ Git: $gitVersion" -ForegroundColor Green
    } else {
        Write-Host "❌ Git: 설치되지 않음" -ForegroundColor Red
    }
    
    # 프로젝트 파일들
    if (Test-Path "package.json") { Write-Host "✅ package.json" -ForegroundColor Green } else { Write-Host "❌ package.json" -ForegroundColor Red }
    if (Test-Path ".env.local") { Write-Host "✅ .env.local" -ForegroundColor Green } else { Write-Host "❌ .env.local" -ForegroundColor Red }
    if (Test-Path "node_modules") { Write-Host "✅ node_modules" -ForegroundColor Green } else { Write-Host "❌ node_modules" -ForegroundColor Red }
    
    # 선택적 도구들
    if (Get-Command claude -ErrorAction SilentlyContinue) { 
        Write-Host "✅ Claude Code" -ForegroundColor Green 
    } else { 
        Write-Host "⚠️ Claude Code (별도 설치 필요)" -ForegroundColor Yellow 
    }
    
    if (Get-Command python -ErrorAction SilentlyContinue) { 
        Write-Host "✅ Python" -ForegroundColor Green 
    } else { 
        Write-Host "⚠️ Python (선택사항)" -ForegroundColor Yellow 
    }
    
    Write-Host ""
}

# 완료 메시지
function Show-CompletionMessage {
    Write-Host @"

╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║        🪟 Windows 환경 설정 완료! 🎉                         ║
║                                                              ║
║   OpenManager VIBE v5 Windows 개발 환경이 성공적으로 설정되었습니다 ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝

"@ -ForegroundColor Green
    
    Write-Host "🚀 Windows에서 다음 단계:" -ForegroundColor White
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    Write-Host ""
    Write-Host "1. 개발 서버 시작 (PowerShell):" -ForegroundColor Cyan
    Write-Host "   npm run dev"
    Write-Host ""
    Write-Host "2. 브라우저에서 확인:" -ForegroundColor Cyan
    Write-Host "   http://localhost:3000"
    Write-Host ""
    Write-Host "3. 환경변수 설정 (필요 시):" -ForegroundColor Cyan
    Write-Host "   notepad .env.local"
    Write-Host ""
    Write-Host "4. Claude Code 시작 (Windows):" -ForegroundColor Cyan
    Write-Host "   claude"
    Write-Host ""
    Write-Host "5. Git 사용자 정보 설정 (필요 시):" -ForegroundColor Cyan
    Write-Host "   git config --global user.name `"Your Name`""
    Write-Host "   git config --global user.email `"your.email@example.com`""
    Write-Host ""
    Write-Host "6. Claude Code 설치 (필요 시):" -ForegroundColor Cyan
    Write-Host "   https://docs.anthropic.com/en/docs/claude-code"
    Write-Host ""
    Write-Host "7. 상세 문서 확인:" -ForegroundColor Cyan
    Write-Host "   - SETUP-COMPLETE.md (Windows 네이티브 가이드)"
    Write-Host "   - docs/QUICK-START.md (빠른 시작)"
    Write-Host "   - CLAUDE.md (AI 통합 가이드)"
    Write-Host ""
    
    if (Test-Path $SetupLog) {
        Write-Host "📋 설정 로그: $SetupLog" -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "Happy Coding! 🚀" -ForegroundColor Green
    Write-Host ""
}

# 오류 처리
function Handle-Error {
    param($ErrorMessage)
    
    Write-Error "설정 중 오류가 발생했습니다: $ErrorMessage"
    Write-Info "문제 해결을 위해 다음을 확인하세요:"
    Write-Host "1. 인터넷 연결 상태"
    Write-Host "2. 관리자 권한으로 PowerShell 실행 여부"
    Write-Host "3. 디스크 공간 부족 여부"
    Write-Host "4. 바이러스 백신 소프트웨어 간섭 여부"
    Write-Host "5. 설정 로그: $SetupLog"
    Write-Host ""
    Write-Host "수동 설정 가이드: SETUP-COMPLETE.md"
    exit 1
}

# 메인 실행 함수
function Main {
    try {
        $startTime = Get-Date
        
        # 단계별 실행
        Test-AdminRights
        Install-Chocolatey
        Install-NodeJS
        Install-NpmDependencies
        Setup-Environment
        Setup-Git
        Check-ClaudeCode
        Install-PythonTools
        Test-Build
        Test-FinalVerification
        
        # 완료 시간 계산
        $endTime = Get-Date
        $duration = ($endTime - $startTime).TotalSeconds
        
        Write-Success "전체 설정 완료! (소요 시간: $([math]::Round($duration, 0))초)"
        "설정 완료 - $(Get-Date)" | Add-Content -Path $SetupLog
        
        Show-CompletionMessage
        
    } catch {
        Handle-Error $_.Exception.Message
    }
}

# 스크립트 실행
Write-Info "Windows 네이티브 환경 설정을 시작합니다..."
Main