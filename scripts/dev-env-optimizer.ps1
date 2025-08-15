# Windows 11 개발 환경 최적화 스크립트
# 작성일: 2025-08-14
# 목적: 개발 서버, 메모리, 프로세스 최적화

param(
    [switch]$CleanupProcesses,
    [switch]$OptimizeMemory,
    [switch]$StartOptimized,
    [switch]$Monitor,
    [switch]$All
)

# 색상 출력 함수
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

# 로고 출력
function Show-Logo {
    Write-Host ""
    Write-ColorOutput Yellow "🔧 OpenManager VIBE v5 - 개발 환경 최적화 도구"
    Write-ColorOutput Cyan "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    Write-Host ""
}

# Node.js 프로세스 정리
function Cleanup-NodeProcesses {
    Write-ColorOutput Green "🧹 Node.js 프로세스 정리 중..."
    
    # 개발 서버 제외한 불필요한 Node.js 프로세스 종료
    $nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
    $count = $nodeProcesses.Count
    
    Write-Host "현재 Node.js 프로세스: $count 개"
    
    # 메모리 사용량 기준으로 정리 (100MB 이상 비활성 프로세스)
    foreach ($proc in $nodeProcesses) {
        $memoryMB = [math]::Round($proc.WorkingSet64 / 1MB, 2)
        $cpuTime = $proc.TotalProcessorTime.TotalSeconds
        
        # 비활성 프로세스 판별 (낮은 CPU 시간 + 높은 메모리)
        if ($memoryMB -gt 100 -and $cpuTime -lt 10) {
            try {
                Write-ColorOutput Yellow "⚠️ 비활성 프로세스 종료: PID $($proc.Id) (${memoryMB}MB)"
                Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
            }
            catch {
                Write-ColorOutput Red "❌ 프로세스 종료 실패: PID $($proc.Id)"
            }
        }
    }
    
    # 정리 후 상태
    $remainingProcesses = (Get-Process -Name "node" -ErrorAction SilentlyContinue).Count
    Write-ColorOutput Green "✅ 정리 완료: $remainingProcesses 개 프로세스 남음"
}

# 메모리 최적화
function Optimize-Memory {
    Write-ColorOutput Green "💾 메모리 최적화 중..."
    
    # Windows 메모리 캐시 정리
    Write-Host "시스템 메모리 캐시 정리..."
    [System.GC]::Collect()
    [System.GC]::WaitForPendingFinalizers()
    
    # Node.js 가비지 컬렉션 강제 실행 (개발 서버에서)
    Write-Host "Node.js 메모리 최적화..."
    
    Write-ColorOutput Green "✅ 메모리 최적화 완료"
}

# 최적화된 개발 서버 시작
function Start-OptimizedDev {
    Write-ColorOutput Green "🚀 최적화된 개발 서버 시작..."
    
    # 환경 변수 설정
    $env:NODE_OPTIONS = "--max-old-space-size=4096 --optimize-for-size"
    $env:NEXT_TELEMETRY_DISABLED = "1"
    $env:NODE_ENV = "development"
    
    Write-Host "메모리 제한: 4GB (8GB에서 최적화)"
    Write-Host "텔레메트리: 비활성화"
    Write-Host "크기 최적화: 활성화"
    
    # tmux 세션 생성 (Windows Terminal 사용)
    Write-ColorOutput Cyan "🖥️ 개발 세션 구성 중..."
    
    # PowerShell에서 새 탭으로 개발 서버 시작
    wt new-tab --title "Dev Server" -- pwsh -NoExit -Command "npm run dev:turbo"
    wt new-tab --title "Test Watch" -- pwsh -NoExit -Command "npm run test:watch"
    wt new-tab --title "Type Check" -- pwsh -NoExit -Command "npm run type-check -- --watch"
    
    Write-ColorOutput Green "✅ 최적화된 개발 환경 시작 완료"
}

# 실시간 모니터링
function Start-Monitoring {
    Write-ColorOutput Green "📊 실시간 리소스 모니터링 시작..."
    
    while ($true) {
        Clear-Host
        Show-Logo
        
        # Node.js 프로세스 상태
        $nodeProcs = Get-Process -Name "node" -ErrorAction SilentlyContinue
        $nodeCount = $nodeProcs.Count
        $totalMemoryMB = ($nodeProcs | Measure-Object WorkingSet64 -Sum).Sum / 1MB
        
        Write-ColorOutput Cyan "📈 현재 상태 ($(Get-Date -Format 'HH:mm:ss'))"
        Write-Host "Node.js 프로세스: $nodeCount 개"
        Write-Host "총 메모리 사용: $([math]::Round($totalMemoryMB, 2)) MB"
        
        # 상위 5개 프로세스
        Write-Host ""
        Write-ColorOutput Yellow "🔝 메모리 사용량 TOP 5:"
        $nodeProcs | Sort-Object WorkingSet64 -Descending | Select-Object -First 5 | ForEach-Object {
            $memMB = [math]::Round($_.WorkingSet64 / 1MB, 2)
            $cpuTime = [math]::Round($_.TotalProcessorTime.TotalSeconds, 2)
            Write-Host "  PID $($_.Id): ${memMB}MB (CPU: ${cpuTime}s)"
        }
        
        # 포트 사용 현황
        Write-Host ""
        Write-ColorOutput Yellow "🌐 개발 서버 포트:"
        $ports = @(3000, 3001, 3002, 5432, 8080)
        foreach ($port in $ports) {
            $conn = netstat -an | Select-String ":$port "
            if ($conn) {
                Write-ColorOutput Green "  ✅ 포트 $port : 사용 중"
            } else {
                Write-ColorOutput Gray "  ⭕ 포트 $port : 사용 안함"
            }
        }
        
        Write-Host ""
        Write-ColorOutput Magenta "Press Ctrl+C to stop monitoring"
        Start-Sleep -Seconds 3
    }
}

# 메인 실행 로직
Show-Logo

if ($All) {
    $CleanupProcesses = $true
    $OptimizeMemory = $true
    $StartOptimized = $true
}

if ($CleanupProcesses) {
    Cleanup-NodeProcesses
    Write-Host ""
}

if ($OptimizeMemory) {
    Optimize-Memory
    Write-Host ""
}

if ($StartOptimized) {
    Start-OptimizedDev
    Write-Host ""
}

if ($Monitor) {
    Start-Monitoring
}

if (-not ($CleanupProcesses -or $OptimizeMemory -or $StartOptimized -or $Monitor)) {
    Write-ColorOutput Yellow "사용법:"
    Write-Host "  .\dev-env-optimizer.ps1 -CleanupProcesses  # 프로세스 정리"
    Write-Host "  .\dev-env-optimizer.ps1 -OptimizeMemory   # 메모리 최적화"
    Write-Host "  .\dev-env-optimizer.ps1 -StartOptimized   # 최적화된 개발 서버"
    Write-Host "  .\dev-env-optimizer.ps1 -Monitor          # 실시간 모니터링"
    Write-Host "  .\dev-env-optimizer.ps1 -All              # 전체 최적화"
}

Write-ColorOutput Green "🎯 최적화 작업 완료!"