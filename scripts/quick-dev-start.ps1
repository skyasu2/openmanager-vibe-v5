# 빠른 개발 환경 시작 스크립트
# Windows 11 최적화 개발 환경 원클릭 시작
# 작성일: 2025-08-14

param(
    [switch]$Fast,        # 빠른 시작 (최소 기능)
    [switch]$Full,        # 전체 기능 시작
    [switch]$Clean,       # 정리 후 시작
    [switch]$Monitor      # 모니터링만
)

function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

function Show-Banner {
    Write-Host ""
    Write-ColorOutput Yellow "🚀 OpenManager VIBE v5 - 개발 환경 빠른 시작"
    Write-ColorOutput Cyan "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    Write-ColorOutput Green "💻 Windows 11 Pro 최적화 | Node.js v22.18.0 | TypeScript Strict"
    Write-Host ""
}

function Check-Prerequisites {
    Write-ColorOutput Blue "🔍 환경 검사 중..."
    
    # Node.js 버전 확인
    try {
        $nodeVersion = node -v
        Write-ColorOutput Green "✅ Node.js: $nodeVersion"
    }
    catch {
        Write-ColorOutput Red "❌ Node.js가 설치되지 않았습니다"
        return $false
    }
    
    # npm 확인
    try {
        $npmVersion = npm -v
        Write-ColorOutput Green "✅ npm: v$npmVersion"
    }
    catch {
        Write-ColorOutput Red "❌ npm을 찾을 수 없습니다"
        return $false
    }
    
    # 프로젝트 루트 확인
    if (-not (Test-Path "package.json")) {
        Write-ColorOutput Red "❌ 프로젝트 루트 디렉토리가 아닙니다"
        return $false
    }
    
    # Windows Terminal 확인
    $wtInstalled = Get-Command "wt" -ErrorAction SilentlyContinue
    if ($wtInstalled) {
        Write-ColorOutput Green "✅ Windows Terminal 사용 가능"
    } else {
        Write-ColorOutput Yellow "⚠️ Windows Terminal 미설치 (PowerShell 창 사용)"
    }
    
    return $true
}

function Cleanup-Environment {
    Write-ColorOutput Blue "🧹 환경 정리 중..."
    
    # 기존 개발 서버 프로세스 정리
    $nodeProcs = Get-Process -Name "node" -ErrorAction SilentlyContinue
    $cleanupCount = 0
    
    foreach ($proc in $nodeProcs) {
        $memMB = [math]::Round($proc.WorkingSet64 / 1MB, 2)
        
        # 100MB 이상 사용하는 비활성 프로세스 정리
        if ($memMB -gt 100) {
            $cpuTime = $proc.TotalProcessorTime.TotalSeconds
            if ($cpuTime -lt 30) {  # 30초 미만 CPU 시간 = 비활성으로 간주
                try {
                    Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
                    $cleanupCount++
                    Write-ColorOutput Yellow "🗑️ 정리: PID $($proc.Id) (${memMB}MB)"
                }
                catch {
                    # 무시
                }
            }
        }
    }
    
    if ($cleanupCount -gt 0) {
        Write-ColorOutput Green "✅ $cleanupCount 개 프로세스 정리 완료"
    } else {
        Write-ColorOutput Green "✅ 정리할 프로세스 없음"
    }
    
    # 메모리 가비지 컬렉션
    [System.GC]::Collect()
    Start-Sleep 2
}

function Start-FastMode {
    Write-ColorOutput Blue "⚡ 빠른 모드 시작..."
    
    # 최소한의 환경 변수 설정
    $env:NODE_OPTIONS = "--max-old-space-size=4096"
    $env:NEXT_TELEMETRY_DISABLED = "1"
    
    # 개발 서버만 시작
    Write-ColorOutput Green "🚀 개발 서버 시작 중..."
    wt new-tab --title "Dev Server (Fast)" -- pwsh -NoExit -Command "npm run dev:turbo"
    
    Write-ColorOutput Green "✅ 빠른 모드 완료!"
    Write-Host "📌 개발 서버가 http://localhost:3000 에서 실행됩니다"
}

function Start-FullMode {
    Write-ColorOutput Blue "🎯 전체 모드 시작..."
    
    # 최적화된 환경 변수 설정
    $env:NODE_OPTIONS = "--max-old-space-size=6144 --optimize-for-size"
    $env:NEXT_TELEMETRY_DISABLED = "1"
    $env:NODE_ENV = "development"
    
    # 전체 개발 환경 구성
    $commands = @(
        @{
            Title = "Dev Server"
            Command = "npm run dev:turbo"
            Icon = "🚀"
        },
        @{
            Title = "Test Watch"
            Command = "npm run test:watch"
            Icon = "🧪"
        },
        @{
            Title = "Type Check"
            Command = "npm run type-check -- --watch"
            Icon = "🔷"
        },
        @{
            Title = "Lint Watch"
            Command = "npm run lint:quick -- --watch"
            Icon = "🔍"
        },
        @{
            Title = "Resource Monitor"
            Command = "./scripts/dev-env-optimizer.ps1 -Monitor"
            Icon = "📊"
        }
    )
    
    # 첫 번째 탭
    $firstCmd = $commands[0]
    Write-ColorOutput Green "$($firstCmd.Icon) $($firstCmd.Title) 시작..."
    wt new-tab --title "$($firstCmd.Title)" -- pwsh -NoExit -Command "$($firstCmd.Command)"
    
    # 추가 탭들 (간격을 두고 시작)
    for ($i = 1; $i -lt $commands.Length; $i++) {
        Start-Sleep 3
        $cmd = $commands[$i]
        Write-ColorOutput Green "$($cmd.Icon) $($cmd.Title) 시작..."
        wt new-tab --title "$($cmd.Title)" -- pwsh -NoExit -Command "$($cmd.Command)"
    }
    
    Write-ColorOutput Green "✅ 전체 개발 환경 완료!"
    Write-Host ""
    Write-ColorOutput Cyan "📚 사용 가능한 서비스:"
    Write-Host "  🌐 개발 서버: http://localhost:3000"
    Write-Host "  🧪 테스트: 자동 실행 중"
    Write-Host "  🔷 타입 체크: 자동 실행 중"
    Write-Host "  📊 리소스 모니터: 실시간 표시"
}

function Start-MonitorOnly {
    Write-ColorOutput Blue "📊 모니터링 모드..."
    
    # 리소스 모니터만 시작
    wt new-tab --title "Resource Monitor" -- pwsh -NoExit -Command "./scripts/dev-env-optimizer.ps1 -Monitor"
    
    Write-ColorOutput Green "✅ 모니터링 시작 완료!"
}

# 메인 실행 로직
Show-Banner

# 환경 검사
if (-not (Check-Prerequisites)) {
    Write-ColorOutput Red "❌ 환경 검사 실패. 종료합니다."
    exit 1
}

# 모드별 실행
switch ($true) {
    $Clean {
        Cleanup-Environment
        Write-Host ""
        if ($Fast) {
            Start-FastMode
        } elseif ($Full) {
            Start-FullMode
        } else {
            Start-FastMode  # 기본값
        }
    }
    $Monitor {
        Start-MonitorOnly
    }
    $Fast {
        Start-FastMode
    }
    $Full {
        Start-FullMode
    }
    default {
        # 기본: 인터랙티브 모드
        Write-ColorOutput Yellow "시작 모드를 선택하세요:"
        Write-Host "  1. 빠른 시작 (개발 서버만)"
        Write-Host "  2. 전체 시작 (모든 도구)"
        Write-Host "  3. 정리 후 빠른 시작"
        Write-Host "  4. 모니터링만"
        Write-Host ""
        
        do {
            $choice = Read-Host "선택 (1-4)"
        } while ($choice -notmatch "^[1-4]$")
        
        switch ($choice) {
            "1" { Start-FastMode }
            "2" { Start-FullMode }
            "3" { 
                Cleanup-Environment
                Start-FastMode 
            }
            "4" { Start-MonitorOnly }
        }
    }
}

Write-Host ""
Write-ColorOutput Magenta "💡 추가 명령어:"
Write-Host "  .\scripts\dev-env-optimizer.ps1 -All    # 환경 최적화"
Write-Host "  .\scripts\tmux-alternative.ps1           # 고급 레이아웃"
Write-Host "  npm run validate:all                     # 전체 검증"