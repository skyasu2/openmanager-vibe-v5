# 🤖 AI가 VM을 완전히 제어할 수 있는 고급 스크립트

param(
    [string]$Action = "dashboard",
    [string]$VmIP = "104.154.205.25",
    [string]$Port = "10000",
    [string]$Command = ""
)

$baseUrl = "http://$VmIP`:$Port"

# 색상 및 이모지 설정
function Write-ColorHost {
    param([string]$Message, [string]$Color = "White")
    
    $colorMap = @{
        Success = "Green"
        Warning = "Yellow" 
        Error = "Red"
        Info = "Cyan"
        Data = "White"
        Header = "Magenta"
    }
    
    $actualColor = if ($colorMap.ContainsKey($Color)) { $colorMap[$Color] } else { "White" }
    Write-Host $Message -ForegroundColor $actualColor
}

function Invoke-VmApi {
    param([string]$Endpoint, [string]$Method = "GET", [object]$Body = $null)
    
    try {
        $url = "$baseUrl$Endpoint"
        $headers = @{ 'User-Agent' = 'AI-VM-Controller/1.0' }
        
        if ($Method -eq "GET") {
            $response = Invoke-RestMethod -Uri $url -Method $Method -Headers $headers -TimeoutSec 15
        } else {
            $jsonBody = if ($Body) { $Body | ConvertTo-Json -Depth 5 } else { "{}" }
            $response = Invoke-RestMethod -Uri $url -Method $Method -Body $jsonBody -ContentType "application/json" -Headers $headers -TimeoutSec 15
        }
        return $response
    } catch {
        Write-ColorHost "❌ API 호출 실패: $Endpoint" "Error"
        Write-ColorHost "오류: $($_.Exception.Message)" "Warning"
        return $null
    }
}

function Show-Dashboard {
    Clear-Host
    Write-ColorHost "🤖 AI VM 제어 대시보드" "Header"
    Write-ColorHost "=" * 60 "Info"
    Write-ColorHost "VM: $VmIP`:$Port | $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" "Info"
    Write-ColorHost ""
    
    # 헬스체크
    $health = Invoke-VmApi "/health"
    if ($health) {
        Write-ColorHost "🟢 서버 상태: $($health.status)" "Success"
        Write-ColorHost "🕐 서버 시간: $($health.timestamp)" "Data"
    } else {
        Write-ColorHost "🔴 서버 연결 실패" "Error"
        return
    }
    
    # 시스템 상태
    $status = Invoke-VmApi "/api/status"
    if ($status) {
        Write-ColorHost "`n📊 시스템 정보:" "Header"
        Write-ColorHost "🖥️  호스트: $($status.hostname)" "Data"
        Write-ColorHost "⏱️  업타임: $([math]::Round($status.uptime / 3600, 2)) 시간" "Data"
        
        $memUsed = $status.memory.total - $status.memory.free
        $memPercent = [math]::Round(($memUsed / $status.memory.total) * 100, 1)
        Write-ColorHost "💾 메모리: $([math]::Round($memUsed / 1MB, 0))MB / $([math]::Round($status.memory.total / 1MB, 0))MB ($memPercent%)" "Data"
    }
    
    # 프로세스 메트릭
    $metrics = Invoke-VmApi "/api/metrics"
    if ($metrics) {
        Write-ColorHost "`n🔄 프로세스 정보:" "Header"
        Write-ColorHost "📈 힙 메모리: $([math]::Round($metrics.memory.heapUsed / 1MB, 1))MB / $([math]::Round($metrics.memory.heapTotal / 1MB, 1))MB" "Data"
        Write-ColorHost "⏰ 프로세스 업타임: $([math]::Round($metrics.uptime / 60, 1)) 분" "Data"
    }
    
    Write-ColorHost "`n🎛️ 사용 가능한 명령어:" "Header"
    Write-ColorHost "  dashboard  - 대시보드 표시 (기본값)" "Data"
    Write-ColorHost "  monitor    - 실시간 모니터링" "Data"
    Write-ColorHost "  logs       - 로그 확인" "Data"
    Write-ColorHost "  test       - 연결 테스트" "Data"
    Write-ColorHost "  deploy     - 배포 실행" "Data"
    Write-ColorHost "  backup     - 백업 생성" "Data"
    Write-ColorHost "  shell      - 원격 명령 실행" "Data"
    Write-ColorHost ""
}

function Start-Monitoring {
    Write-ColorHost "📊 실시간 모니터링 시작..." "Info"
    Write-ColorHost "Ctrl+C로 중지" "Warning"
    
    $iteration = 0
    while ($true) {
        $iteration++
        Clear-Host
        Write-ColorHost "🤖 실시간 VM 모니터링 #$iteration" "Header"
        Write-ColorHost "=" * 60 "Info"
        Write-ColorHost "시간: $(Get-Date -Format 'HH:mm:ss') | Ctrl+C로 중지" "Info"
        Write-ColorHost ""
        
        # 빠른 상태 체크
        $startTime = Get-Date
        $health = Invoke-VmApi "/health"
        $responseTime = ((Get-Date) - $startTime).TotalMilliseconds
        
        if ($health) {
            Write-ColorHost "🟢 응답시간: $([math]::Round($responseTime, 0))ms" "Success"
            
            $status = Invoke-VmApi "/api/status"
            if ($status) {
                $memUsed = $status.memory.total - $status.memory.free
                $memPercent = [math]::Round(($memUsed / $status.memory.total) * 100, 1)
                
                Write-ColorHost "💾 메모리: $memPercent% ($([math]::Round($memUsed / 1MB, 0))MB)" "Data"
                Write-ColorHost "⏱️ 업타임: $([math]::Round($status.uptime / 3600, 2))h" "Data"
            }
            
            $metrics = Invoke-VmApi "/api/metrics"
            if ($metrics) {
                Write-ColorHost "🔄 힙: $([math]::Round($metrics.memory.heapUsed / 1MB, 1))MB" "Data"
            }
        } else {
            Write-ColorHost "🔴 서버 응답 없음" "Error"
        }
        
        Write-ColorHost "`n📈 모니터링 통계:" "Header"
        Write-ColorHost "반복: $iteration | 간격: 3초" "Data"
        
        Start-Sleep -Seconds 3
    }
}

function Test-Connection {
    Write-ColorHost "🧪 연결 테스트 실행..." "Info"
    
    $tests = @(
        @{ Name = "기본 헬스체크"; Endpoint = "/health" },
        @{ Name = "시스템 상태"; Endpoint = "/api/status" },
        @{ Name = "메트릭"; Endpoint = "/api/metrics" }
    )
    
    foreach ($test in $tests) {
        Write-Host "  테스트: $($test.Name)... " -NoNewline
        $startTime = Get-Date
        $result = Invoke-VmApi $test.Endpoint
        $responseTime = ((Get-Date) - $startTime).TotalMilliseconds
        
        if ($result) {
            Write-ColorHost "✅ ($([math]::Round($responseTime, 0))ms)" "Success"
        } else {
            Write-ColorHost "❌ 실패" "Error"
        }
    }
    
    Write-ColorHost "`n🌐 네트워크 테스트:" "Header"
    Write-Host "  포트 10000 연결... " -NoNewline
    try {
        $tcpClient = New-Object System.Net.Sockets.TcpClient
        $tcpClient.ConnectAsync($VmIP, $Port).Wait(5000)
        if ($tcpClient.Connected) {
            Write-ColorHost "✅ 연결됨" "Success"
            $tcpClient.Close()
        } else {
            Write-ColorHost "❌ 연결 실패" "Error"
        }
    } catch {
        Write-ColorHost "❌ 오류: $($_.Exception.Message)" "Error"
    }
}

function Invoke-RemoteCommand {
    if (-not $Command) {
        $Command = Read-Host "실행할 명령어를 입력하세요"
    }
    
    Write-ColorHost "💻 원격 명령 실행: $Command" "Info"
    
    # 가상의 명령 실행 API (실제로는 구현되어 있지 않을 수 있음)
    $body = @{ 
        command = $Command
        timestamp = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssZ")
    }
    
    $result = Invoke-VmApi "/api/execute" "POST" $body
    
    if ($result) {
        Write-ColorHost "📤 명령어: $Command" "Info"
        Write-ColorHost "📥 결과:" "Success"
        Write-ColorHost $result.output "Data"
        if ($result.error) {
            Write-ColorHost "❌ 오류: $($result.error)" "Error"
        }
    } else {
        Write-ColorHost "⚠️ 원격 명령 실행 API가 구현되지 않았을 수 있습니다." "Warning"
        Write-ColorHost "대신 Cloud Shell이나 SSH를 사용하세요." "Info"
    }
}

# 메인 실행 로직
switch ($Action.ToLower()) {
    "dashboard" { Show-Dashboard }
    "monitor" { Start-Monitoring }
    "test" { Test-Connection }
    "shell" { Invoke-RemoteCommand }
    "logs" {
        Write-ColorHost "📋 로그 확인..." "Info"
        $logs = Invoke-VmApi "/api/logs"
        if ($logs) {
            $logs | ForEach-Object { Write-ColorHost $_ "Data" }
        } else {
            Write-ColorHost "⚠️ 로그 API가 구현되지 않았을 수 있습니다." "Warning"
        }
    }
    "deploy" {
        Write-ColorHost "🚀 배포 실행..." "Info"
        $result = Invoke-VmApi "/api/deploy" "POST"
        if ($result) {
            Write-ColorHost "✅ 배포 명령 전송됨" "Success"
            Write-ColorHost ($result | ConvertTo-Json -Depth 3) "Data"
        } else {
            Write-ColorHost "⚠️ 배포 API가 구현되지 않았을 수 있습니다." "Warning"
        }
    }
    "backup" {
        Write-ColorHost "💾 백업 생성..." "Info"
        $result = Invoke-VmApi "/api/backup" "POST"
        if ($result) {
            Write-ColorHost "✅ 백업 명령 전송됨" "Success"
        } else {
            Write-ColorHost "⚠️ 백업 API가 구현되지 않았을 수 있습니다." "Warning"
        }
    }
    default {
        Show-Dashboard
    }
}

Write-ColorHost "`n✨ 완료!" "Success"