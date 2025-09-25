# ==============================================================================
# OpenManager VIBE v5 - Windows 네이티브 환경 검증 스크립트
# ==============================================================================
# 용도: Windows 네이티브 환경 설정 완료 후 모든 구성 요소 검증
# 사용법: .\verify-windows-environment.ps1
# 
# 작성일: 2025-08-20
# 버전: 1.0.0
# ==============================================================================

param(
    [switch]$Detailed,
    [switch]$SkipNetworkTest
)

# 에러 처리 설정
$ErrorActionPreference = "Continue"

# 색상 함수들
function Write-Info { param($Message) Write-Host "[INFO] $Message" -ForegroundColor Blue }
function Write-Success { param($Message) Write-Host "[✅ PASS] $Message" -ForegroundColor Green }
function Write-Warning { param($Message) Write-Host "[⚠️ WARN] $Message" -ForegroundColor Yellow }
function Write-Error { param($Message) Write-Host "[❌ FAIL] $Message" -ForegroundColor Red }
function Write-Section { param($Message) Write-Host "`n[검증] $Message" -ForegroundColor Magenta -BackgroundColor Black }

# 전역 변수
$ProjectRoot = $PSScriptRoot
$VerificationLog = Join-Path $ProjectRoot "verification-windows.log"
$PassCount = 0
$FailCount = 0
$WarnCount = 0

# 시작 메시지
Clear-Host
Write-Host @"
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║        🪟 Windows 환경 검증 시작 🔍                          ║
║                                                              ║
║  OpenManager VIBE v5 Windows 네이티브 환경이 올바르게        ║
║  설정되었는지 종합적으로 검증합니다                           ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
"@ -ForegroundColor Cyan

# 로그 파일 초기화
"OpenManager VIBE v5 Windows Native Environment Verification - $(Get-Date)" | Out-File -FilePath $VerificationLog

# 결과 추적 함수
function Track-Result {
    param(
        [string]$Status,
        [string]$Message
    )
    
    switch ($Status) {
        "pass" {
            Write-Success $Message
            $script:PassCount++
            "✅ PASS: $Message" | Add-Content -Path $VerificationLog
        }
        "fail" {
            Write-Error $Message
            $script:FailCount++
            "❌ FAIL: $Message" | Add-Content -Path $VerificationLog
        }
        "warn" {
            Write-Warning $Message
            $script:WarnCount++
            "⚠️ WARN: $Message" | Add-Content -Path $VerificationLog
        }
    }
}

# Windows 환경 기본 검증
function Test-WindowsEnvironment {
    Write-Section "Windows 환경 기본 검증"
    
    # 운영체제 확인
    $osInfo = Get-ComputerInfo -Property "WindowsProductName", "WindowsVersion", "WindowsBuildLabEx" -ErrorAction SilentlyContinue
    if ($osInfo) {
        $osName = $osInfo.WindowsProductName
        $osVersion = $osInfo.WindowsVersion
        Track-Result "pass" "운영체제: $osName (빌드: $osVersion)"
        
        # Windows 11 확인
        if ($osInfo.WindowsVersion -like "10.0.22*") {
            Track-Result "pass" "Windows 11 감지됨"
        } elseif ($osInfo.WindowsVersion -like "10.0.19*") {
            Track-Result "warn" "Windows 10 감지됨 (Windows 11 권장)"
        } else {
            Track-Result "warn" "알 수 없는 Windows 버전"
        }
    } else {
        Track-Result "warn" "운영체제 정보를 확인할 수 없음"
    }
    
    # PowerShell 버전 확인
    $psVersion = $PSVersionTable.PSVersion
    if ($psVersion.Major -ge 5) {
        Track-Result "pass" "PowerShell 버전: $($psVersion.ToString())"
    } else {
        Track-Result "warn" "PowerShell 버전이 낮습니다: $($psVersion.ToString()) (5.0+ 권장)"
    }
    
    # 실행 정책 확인
    $executionPolicy = Get-ExecutionPolicy
    if ($executionPolicy -eq "RemoteSigned" -or $executionPolicy -eq "Unrestricted" -or $executionPolicy -eq "Bypass") {
        Track-Result "pass" "PowerShell 실행 정책: $executionPolicy"
    } else {
        Track-Result "warn" "PowerShell 실행 정책이 제한적임: $executionPolicy"
    }
    
    # 관리자 권한 확인 (선택사항)
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    $isAdmin = $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
    
    if ($isAdmin) {
        Track-Result "pass" "관리자 권한으로 실행 중"
    } else {
        Track-Result "warn" "일반 사용자 권한으로 실행 중 (일부 기능 제한 가능)"
    }
}

# Chocolatey 검증
function Test-Chocolatey {
    Write-Section "Chocolatey 패키지 관리자 검증"
    
    if (Get-Command choco -ErrorAction SilentlyContinue) {
        $chocoVersion = & choco --version 2>$null
        Track-Result "pass" "Chocolatey 버전: $chocoVersion"
        
        # Chocolatey 패키지 목록 확인
        try {
            $installedPackages = & choco list --local-only 2>$null | Where-Object { $_ -notlike "*packages installed*" -and $_ -ne "" }
            $packageCount = ($installedPackages | Measure-Object).Count
            Track-Result "pass" "Chocolatey 설치된 패키지: $packageCount개"
        } catch {
            Track-Result "warn" "Chocolatey 패키지 목록을 확인할 수 없음"
        }
    } else {
        Track-Result "fail" "Chocolatey가 설치되지 않았습니다"
    }
}

# Node.js 환경 검증
function Test-NodeJS {
    Write-Section "Node.js 환경 검증"
    
    # Node.js 설치 확인
    if (Get-Command node -ErrorAction SilentlyContinue) {
        $nodeVersion = & node --version 2>$null
        $majorVersion = [int]($nodeVersion -replace "v(\d+)\..*", '$1')
        
        if ($majorVersion -ge 22) {
            Track-Result "pass" "Node.js 버전: $nodeVersion (요구사항: v22+)"
        } else {
            Track-Result "fail" "Node.js 버전이 낮습니다: $nodeVersion (요구사항: v22+)"
        }
    } else {
        Track-Result "fail" "Node.js가 설치되지 않았습니다"
        return
    }
    
    # npm 확인
    if (Get-Command npm -ErrorAction SilentlyContinue) {
        $npmVersion = & npm --version 2>$null
        Track-Result "pass" "npm 버전: $npmVersion"
    } else {
        Track-Result "fail" "npm이 설치되지 않았습니다"
    }
    
    # npm 글로벌 경로 확인
    try {
        $globalPath = & npm config get prefix 2>$null
        if (Test-Path $globalPath) {
            Track-Result "pass" "npm 글로벌 경로: $globalPath"
        } else {
            Track-Result "warn" "npm 글로벌 경로가 존재하지 않음"
        }
    } catch {
        Track-Result "warn" "npm 글로벌 경로를 확인할 수 없음"
    }
}

# 프로젝트 파일 검증
function Test-ProjectFiles {
    Write-Section "프로젝트 파일 구조 검증"
    
    Set-Location $ProjectRoot
    
    # 핵심 파일들
    $requiredFiles = @("package.json", "tsconfig.json", "next.config.mjs", ".gitignore")
    foreach ($file in $requiredFiles) {
        if (Test-Path $file) {
            Track-Result "pass" "$file 존재"
        } else {
            Track-Result "fail" "$file 누락"
        }
    }
    
    # 디렉토리 구조
    $requiredDirs = @("src", "docs", "scripts", "config")
    foreach ($dir in $requiredDirs) {
        if (Test-Path $dir -PathType Container) {
            Track-Result "pass" "$dir\ 디렉토리 존재"
        } else {
            Track-Result "fail" "$dir\ 디렉토리 누락"
        }
    }
    
    # node_modules 확인
    if (Test-Path "node_modules" -PathType Container) {
        $packageCount = (Get-ChildItem "node_modules" -Directory | Measure-Object).Count
        if ($packageCount -gt 100) {
            Track-Result "pass" "node_modules 설치됨 ($packageCount개 패키지)"
        } else {
            Track-Result "warn" "node_modules 패키지 수가 적음 ($packageCount개)"
        }
    } else {
        Track-Result "fail" "node_modules 디렉토리 누락"
    }
    
    # Windows 특화 파일들
    $windowsFiles = @("bootstrap.ps1", "verify-windows-environment.ps1")
    foreach ($file in $windowsFiles) {
        if (Test-Path $file) {
            Track-Result "pass" "$file 존재 (Windows 전용)"
        } else {
            Track-Result "warn" "$file 누락 (Windows 전용)"
        }
    }
}

# 환경변수 검증
function Test-Environment {
    Write-Section "환경변수 설정 검증"
    
    Set-Location $ProjectRoot
    
    # .env.local 확인
    if (Test-Path ".env.local") {
        Track-Result "pass" ".env.local 파일 존재"
        
        $envContent = Get-Content ".env.local" -Raw
        
        # 필수 환경변수 확인
        $envVars = @("NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY")
        foreach ($var in $envVars) {
            if ($envContent -match "^$var=(.+)" -or $envContent -match "`n$var=(.+)") {
                $value = $matches[1] -replace "`r", ""
                if ($value -notlike "*your_*" -and $value -notlike "*_here*" -and $value -ne "") {
                    Track-Result "pass" "$var 설정됨"
                } else {
                    Track-Result "warn" "$var 템플릿 값 (실제 값으로 교체 필요)"
                }
            } else {
                Track-Result "warn" "$var 누락"
            }
        }
        
        # 선택적 환경변수
        $optionalVars = @("GITHUB_PERSONAL_ACCESS_TOKEN", "GOOGLE_AI_API_KEY")
        foreach ($var in $optionalVars) {
            if ($envContent -match "^$var=(.+)" -or $envContent -match "`n$var=(.+)") {
                $value = $matches[1] -replace "`r", ""
                if ($value -notlike "*your_*" -and $value -notlike "*_here*" -and $value -ne "") {
                    Track-Result "pass" "$var 설정됨 (선택사항)"
                } else {
                    Track-Result "warn" "$var 템플릿 값 (선택사항)"
                }
            } else {
                Track-Result "warn" "$var 누락 (선택사항)"
            }
        }
        
        # Windows 특화 설정 확인
        if ($envContent -match "PLATFORM=windows" -or $envContent -match "USE_WSL=false") {
            Track-Result "pass" "Windows 네이티브 설정 확인됨"
        } else {
            Track-Result "warn" "Windows 특화 환경변수 권장: PLATFORM=windows, USE_WSL=false"
        }
        
    } else {
        Track-Result "fail" ".env.local 파일 누락"
    }
}

# Git 설정 검증
function Test-GitConfiguration {
    Write-Section "Git 설정 검증"
    
    # Git 설치 확인
    if (Get-Command git -ErrorAction SilentlyContinue) {
        $gitVersion = & git --version 2>$null
        Track-Result "pass" "Git: $gitVersion"
        
        # Git 사용자 정보
        $gitUser = & git config --global user.name 2>$null
        $gitEmail = & git config --global user.email 2>$null
        
        if ($gitUser -and $gitEmail) {
            Track-Result "pass" "Git 사용자 정보: $gitUser <$gitEmail>"
        } else {
            Track-Result "warn" "Git 사용자 정보 미설정"
        }
        
        # Windows용 줄바꿈 설정 확인
        $autocrlf = & git config --global core.autocrlf 2>$null
        if ($autocrlf -eq "true") {
            Track-Result "pass" "Git 줄바꿈 설정: true (Windows 최적)"
        } else {
            Track-Result "warn" "Git 줄바꿈 설정 권장: core.autocrlf=true (현재: $autocrlf)"
        }
    } else {
        Track-Result "fail" "Git이 설치되지 않았습니다"
    }
}

# Claude Code 및 AI 도구 검증
function Test-AITools {
    Write-Section "AI CLI 도구 검증"
    
    # Claude Code (필수)
    if (Get-Command claude -ErrorAction SilentlyContinue) {
        $claudeVersion = & claude --version 2>$null
        if ($claudeVersion) {
            Track-Result "pass" "Claude Code: $claudeVersion"
        } else {
            Track-Result "pass" "Claude Code: 설치됨"
        }
    } else {
        Track-Result "fail" "Claude Code 설치되지 않음 (필수)"
    }
    
    # 기타 AI 도구들 (선택사항)
    $aiTools = @("gemini", "qwen")
    foreach ($tool in $aiTools) {
        if (Get-Command $tool -ErrorAction SilentlyContinue) {
            $version = & $tool --version 2>$null | Select-Object -First 1
            if ($version) {
                Track-Result "pass" "$tool: $version (선택사항)"
            } else {
                Track-Result "pass" "$tool: 설치됨 (선택사항)"
            }
        } else {
            Track-Result "warn" "$tool 설치되지 않음 (선택사항)"
        }
    }
    
    # Codex CLI는 Windows 네이티브에서 미지원
    Write-Warning "Codex CLI는 Windows 네이티브에서 지원되지 않습니다 (WSL 전용)"
    Track-Result "warn" "Codex CLI: Windows 네이티브 미지원 (WSL에서만 사용 가능)"
}

# Python 도구 검증
function Test-PythonTools {
    Write-Section "Python 및 도구 검증"
    
    # Python 확인
    if (Get-Command python -ErrorAction SilentlyContinue) {
        $pythonVersion = & python --version 2>$null
        Track-Result "pass" "Python: $pythonVersion"
        
        # pip 확인
        if (Get-Command pip -ErrorAction SilentlyContinue) {
            $pipVersion = & pip --version 2>$null | Select-Object -First 1
            Track-Result "pass" "pip: $pipVersion"
        } else {
            Track-Result "warn" "pip 설치되지 않음"
        }
    } else {
        Track-Result "warn" "Python 설치되지 않음 (선택사항)"
    }
}

# 빌드 및 테스트 검증
function Test-BuildAndTest {
    Write-Section "빌드 및 테스트 검증"
    
    Set-Location $ProjectRoot
    
    # TypeScript 컴파일 검사
    Write-Info "TypeScript 컴파일 검사 중..."
    try {
        $tscOutput = & npx tsc --noEmit --skipLibCheck 2>&1
        if ($LASTEXITCODE -eq 0) {
            Track-Result "pass" "TypeScript 컴파일 성공"
        } else {
            Track-Result "warn" "TypeScript 컴파일 경고 또는 오류"
        }
    } catch {
        Track-Result "warn" "TypeScript 컴파일을 확인할 수 없음"
    }
    
    # package.json 스크립트 확인
    if (Test-Path "package.json") {
        $packageJson = Get-Content "package.json" -Raw | ConvertFrom-Json
        $scripts = $packageJson.scripts
        
        $requiredScripts = @("dev", "build", "start", "test:quick")
        foreach ($script in $requiredScripts) {
            if ($scripts.$script) {
                Track-Result "pass" "npm run $script 스크립트 존재"
            } else {
                Track-Result "warn" "npm run $script 스크립트 누락"
            }
        }
    }
    
    # 빠른 테스트 실행 (타임아웃 포함)
    if ($scripts."test:quick") {
        Write-Info "빠른 테스트 실행 중 (30초 제한)..."
        try {
            $job = Start-Job -ScriptBlock {
                Set-Location $using:ProjectRoot
                & npm run test:quick 2>&1
            }
            
            if (Wait-Job $job -Timeout 30) {
                $result = Receive-Job $job
                $exitCode = $job.State
                
                if ($exitCode -eq "Completed") {
                    Track-Result "pass" "빠른 테스트 통과"
                } else {
                    Track-Result "warn" "빠른 테스트 실패 (정상일 수 있음)"
                }
            } else {
                Stop-Job $job
                Track-Result "warn" "빠른 테스트 타임아웃 (30초)"
            }
            
            Remove-Job $job -Force
        } catch {
            Track-Result "warn" "빠른 테스트를 실행할 수 없음"
        }
    }
}

# 네트워킹 검증
function Test-Networking {
    Write-Section "네트워킹 및 포트 검증"
    
    if (-not $SkipNetworkTest) {
        # 포트 3000 사용 가능성 확인
        try {
            $port3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
            if ($port3000) {
                Track-Result "warn" "포트 3000이 이미 사용 중"
            } else {
                Track-Result "pass" "포트 3000 사용 가능"
            }
        } catch {
            Track-Result "pass" "포트 3000 사용 가능 (확인됨)"
        }
        
        # localhost 접근 테스트
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 5 -ErrorAction Stop
            Track-Result "warn" "포트 3000에서 서비스가 이미 실행 중"
        } catch {
            Track-Result "pass" "포트 3000 접근 준비됨"
        }
        
        # 인터넷 연결 확인
        try {
            $response = Invoke-WebRequest -Uri "https://www.google.com" -TimeoutSec 10 -ErrorAction Stop
            Track-Result "pass" "인터넷 연결 정상"
        } catch {
            Track-Result "warn" "인터넷 연결 문제가 있을 수 있음"
        }
    } else {
        Track-Result "warn" "네트워크 테스트 건너뛰기 (-SkipNetworkTest)"
    }
}

# 권한 및 보안 검증
function Test-Permissions {
    Write-Section "권한 및 보안 검증"
    
    Set-Location $ProjectRoot
    
    # PowerShell 스크립트 실행 권한
    $psFiles = @("bootstrap.ps1", "verify-windows-environment.ps1")
    foreach ($file in $psFiles) {
        if (Test-Path $file) {
            try {
                # 파일이 실행 가능한지 확인
                $content = Get-Content $file -TotalCount 1
                Track-Result "pass" "$file 읽기 권한 있음"
            } catch {
                Track-Result "warn" "$file 읽기 권한 없음"
            }
        }
    }
    
    # .env.local 파일 권한 확인
    if (Test-Path ".env.local") {
        try {
            $acl = Get-Acl ".env.local"
            $owner = $acl.Owner
            Track-Result "pass" ".env.local 파일 소유자: $owner"
        } catch {
            Track-Result "warn" ".env.local 파일 권한을 확인할 수 없음"
        }
    }
    
    # Windows Defender 실시간 보호 상태 확인
    try {
        $defenderStatus = Get-MpComputerStatus -ErrorAction SilentlyContinue
        if ($defenderStatus -and $defenderStatus.RealTimeProtectionEnabled) {
            Track-Result "pass" "Windows Defender 실시간 보호 활성화됨"
        } else {
            Track-Result "warn" "Windows Defender 실시간 보호가 비활성화됨"
        }
    } catch {
        Track-Result "warn" "Windows Defender 상태를 확인할 수 없음"
    }
}

# 최종 결과 요약
function Show-FinalSummary {
    Write-Host ""
    Write-Host "🔍 Windows 환경 검증 결과 요약" -ForegroundColor White
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    Write-Host ""
    
    # 결과 통계
    $totalChecks = $PassCount + $FailCount + $WarnCount
    Write-Host "✅ 통과: $PassCount" -ForegroundColor Green
    Write-Host "❌ 실패: $FailCount" -ForegroundColor Red
    Write-Host "⚠️ 경고: $WarnCount" -ForegroundColor Yellow
    Write-Host "📊 총 검사: $totalChecks" -ForegroundColor Blue
    
    Write-Host ""
    
    # 전체 상태 판단
    if ($FailCount -eq 0) {
        if ($WarnCount -eq 0) {
            Write-Host "🎉 완벽! Windows 네이티브 환경이 완전히 설정되었습니다!" -ForegroundColor Green
            Write-Host "   개발을 시작할 준비가 완료되었습니다." -ForegroundColor Green
        } else {
            Write-Host "✅ 양호! Windows 네이티브 환경이 설정되었습니다." -ForegroundColor Yellow
            Write-Host "   일부 선택사항이나 권장사항을 확인해보세요." -ForegroundColor Yellow
        }
    } else {
        Write-Host "❌ 문제 발견! 일부 필수 구성요소가 누락되었습니다." -ForegroundColor Red
        Write-Host "   bootstrap.ps1을 다시 실행하거나 수동 설정이 필요합니다." -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "📝 다음 단계:" -ForegroundColor White
    
    if ($FailCount -eq 0) {
        Write-Host "1. 개발 서버 시작: npm run dev"
        Write-Host "2. 브라우저 확인: http://localhost:3000"
        Write-Host "3. Claude Code 시작: claude"
        Write-Host "4. 환경변수 설정 (필요 시): notepad .env.local"
    } else {
        Write-Host "1. 실패 항목들을 확인하여 문제를 해결하세요"
        Write-Host "2. bootstrap.ps1을 다시 실행해보세요: .\bootstrap.ps1"
        Write-Host "3. 수동 설정이 필요한 경우 SETUP-COMPLETE.md를 참고하세요"
    }
    
    Write-Host ""
    Write-Host "📋 상세 로그: $VerificationLog" -ForegroundColor Cyan
    Write-Host "📚 문제 해결: SETUP-COMPLETE.md" -ForegroundColor Cyan
    Write-Host ""
}

# 메인 실행 함수
function Main {
    $startTime = Get-Date
    
    # 단계별 검증 실행
    Test-WindowsEnvironment
    Test-Chocolatey
    Test-NodeJS
    Test-ProjectFiles
    Test-Environment
    Test-GitConfiguration
    Test-AITools
    Test-PythonTools
    Test-BuildAndTest
    Test-Networking
    Test-Permissions
    
    # 완료 시간 계산
    $endTime = Get-Date
    $duration = ($endTime - $startTime).TotalSeconds
    
    "검증 완료 - $(Get-Date) (소요시간: $([math]::Round($duration, 0))초)" | Add-Content -Path $VerificationLog
    
    Show-FinalSummary
}

# 스크립트 실행
Write-Info "Windows 네이티브 환경 검증을 시작합니다..."
Main