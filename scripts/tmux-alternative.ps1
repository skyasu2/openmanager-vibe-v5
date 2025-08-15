# Windows Terminal tmux 대안 스크립트
# Windows 11에서 tmux 스타일 개발 환경 구성
# 작성일: 2025-08-14

param(
    [string]$SessionName = "openmanager-dev",
    [switch]$Clean,
    [switch]$Monitor
)

function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

function Show-Header {
    Clear-Host
    Write-ColorOutput Cyan "🪟 Windows Terminal 개발 환경 매니저"
    Write-ColorOutput Yellow "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    Write-Host ""
}

# tmux 스타일 레이아웃 생성
function Create-DevLayout {
    param([string]$SessionName)
    
    Show-Header
    Write-ColorOutput Green "🏗️ 개발 레이아웃 생성 중: $SessionName"
    
    # 현재 프로젝트 디렉토리
    $ProjectDir = Get-Location
    
    # 탭 구성 정의
    $tabs = @(
        @{
            Name = "Dev Server"
            Command = "npm run dev:turbo"
            Description = "Next.js 개발 서버 (Turbo 모드)"
        },
        @{
            Name = "Test Watch"
            Command = "npm run test:watch"
            Description = "Vitest 워치 모드"
        },
        @{
            Name = "Type Check"
            Command = "npm run type-check -- --watch"
            Description = "TypeScript 타입 체크"
        },
        @{
            Name = "MCP Status"
            Command = "node -e `"setInterval(() => console.log('MCP Status:', new Date().toLocaleTimeString()), 5000)`""
            Description = "MCP 서버 상태 모니터링"
        },
        @{
            Name = "Git Monitor"
            Command = "while (`$true) { Clear-Host; git status --short; Start-Sleep 10 }"
            Description = "Git 상태 모니터링"
        },
        @{
            Name = "Resource Monitor"
            Command = "./scripts/dev-env-optimizer.ps1 -Monitor"
            Description = "리소스 사용량 모니터링"
        }
    )
    
    # Windows Terminal 명령어 생성
    $wtCommand = "wt"
    
    # 첫 번째 탭 (Dev Server)
    $wtCommand += " new-tab --title `"$($tabs[0].Name)`" --suppressApplicationTitle"
    $wtCommand += " -- pwsh -NoExit -Command `"cd '$ProjectDir'; Write-Host '🚀 $($tabs[0].Description)'; $($tabs[0].Command)`""
    
    # 나머지 탭들
    for ($i = 1; $i -lt $tabs.Count; $i++) {
        $tab = $tabs[$i]
        $wtCommand += "; new-tab --title `"$($tab.Name)`" --suppressApplicationTitle"
        $wtCommand += " -- pwsh -NoExit -Command `"cd '$ProjectDir'; Write-Host '📊 $($tab.Description)'; $($tab.Command)`""
    }
    
    # 명령어 실행
    Write-Host "실행할 명령어:"
    Write-ColorOutput Yellow $wtCommand
    Write-Host ""
    
    # 실제 실행
    try {
        Invoke-Expression $wtCommand
        Write-ColorOutput Green "✅ 개발 환경이 새 Windows Terminal 창에서 시작되었습니다!"
    }
    catch {
        Write-ColorOutput Red "❌ Windows Terminal 실행 실패: $($_.Exception.Message)"
        Write-ColorOutput Yellow "💡 대안: 수동으로 탭 생성..."
        
        # 대안: 개별 PowerShell 창 생성
        foreach ($tab in $tabs) {
            Write-Host "새 창: $($tab.Name)"
            Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd '$ProjectDir'; Write-Host '$($tab.Description)'; $($tab.Command)"
            Start-Sleep 2
        }
    }
}

# 개발 환경 정리
function Clean-DevEnvironment {
    Show-Header
    Write-ColorOutput Green "🧹 개발 환경 정리 중..."
    
    # Node.js 프로세스 정리
    $nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
    if ($nodeProcesses) {
        Write-Host "Node.js 프로세스 $($nodeProcesses.Count)개 발견"
        
        # 개발 서버 프로세스 식별 (포트 3000-3010 사용)
        $devServerPorts = 3000..3010
        $devProcesses = @()
        
        foreach ($proc in $nodeProcesses) {
            $connections = netstat -ano | Select-String $proc.Id
            $isDevServer = $false
            
            foreach ($conn in $connections) {
                foreach ($port in $devServerPorts) {
                    if ($conn -match ":$port ") {
                        $isDevServer = $true
                        break
                    }
                }
                if ($isDevServer) { break }
            }
            
            if (-not $isDevServer) {
                $memMB = [math]::Round($proc.WorkingSet64 / 1MB, 2)
                Write-ColorOutput Yellow "정리 대상: PID $($proc.Id) (${memMB}MB)"
                try {
                    Stop-Process -Id $proc.Id -Force
                }
                catch {
                    Write-ColorOutput Red "정리 실패: PID $($proc.Id)"
                }
            }
        }
    }
    
    # Windows Terminal 프로세스 체크
    $wtProcesses = Get-Process -Name "WindowsTerminal" -ErrorAction SilentlyContinue
    Write-Host "Windows Terminal 프로세스: $($wtProcesses.Count)개"
    
    Write-ColorOutput Green "✅ 환경 정리 완료"
}

# 리소스 모니터링
function Start-ResourceMonitor {
    Show-Header
    Write-ColorOutput Green "📊 개발 환경 리소스 모니터링"
    
    while ($true) {
        Clear-Host
        Write-ColorOutput Cyan "🔍 OpenManager VIBE v5 - 리소스 모니터 ($(Get-Date -Format 'yyyy-MM-dd HH:mm:ss'))"
        Write-ColorOutput Yellow "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        Write-Host ""
        
        # Node.js 프로세스 상태
        $nodeProcs = Get-Process -Name "node" -ErrorAction SilentlyContinue
        if ($nodeProcs) {
            $totalMemory = ($nodeProcs | Measure-Object WorkingSet64 -Sum).Sum / 1MB
            Write-ColorOutput Green "🟢 Node.js 프로세스: $($nodeProcs.Count)개 (총 메모리: $([math]::Round($totalMemory, 1))MB)"
            
            # 상위 프로세스
            $topProcs = $nodeProcs | Sort-Object WorkingSet64 -Descending | Select-Object -First 3
            foreach ($proc in $topProcs) {
                $memMB = [math]::Round($proc.WorkingSet64 / 1MB, 1)
                $cpuTime = [math]::Round($proc.TotalProcessorTime.TotalSeconds, 1)
                Write-Host "  📊 PID $($proc.Id): ${memMB}MB (CPU: ${cpuTime}s)"
            }
        } else {
            Write-ColorOutput Red "🔴 Node.js 프로세스 없음"
        }
        
        Write-Host ""
        
        # 개발 서버 포트 상태
        $devPorts = @(3000, 3001, 3002, 5432)
        Write-ColorOutput Cyan "🌐 개발 서버 포트 상태:"
        foreach ($port in $devPorts) {
            $listening = netstat -an | Select-String ":$port.*LISTENING"
            if ($listening) {
                Write-ColorOutput Green "  ✅ :$port - 활성"
            } else {
                Write-ColorOutput Gray "  ⚪ :$port - 비활성"
            }
        }
        
        Write-Host ""
        
        # 시스템 리소스 (간단히)
        $mem = Get-Counter "\Memory\Available MBytes" -ErrorAction SilentlyContinue
        if ($mem) {
            $availableMB = [math]::Round($mem.CounterSamples[0].CookedValue, 0)
            Write-ColorOutput Cyan "💾 사용 가능 메모리: ${availableMB}MB"
        }
        
        # TypeScript 컴파일 상태 (tsc 프로세스 확인)
        $tscProcs = Get-Process -Name "*tsc*" -ErrorAction SilentlyContinue
        if ($tscProcs) {
            Write-ColorOutput Blue "🔷 TypeScript 컴파일러 실행 중"
        }
        
        Write-Host ""
        Write-ColorOutput Magenta "⏹️ Ctrl+C를 눌러 모니터링 종료"
        
        Start-Sleep -Seconds 5
    }
}

# 메인 로직
switch ($true) {
    $Clean {
        Clean-DevEnvironment
    }
    $Monitor {
        Start-ResourceMonitor
    }
    default {
        Create-DevLayout -SessionName $SessionName
    }
}