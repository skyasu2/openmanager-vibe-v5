# 🚀 VM 원격 제어 스크립트 - AI가 VM을 관리할 수 있도록

param(
    [string]$Action = "status",
    [string]$VmIP = "104.154.205.25",
    [string]$Port = "10000"
)

$baseUrl = "http://$VmIP`:$Port"

Write-Host "🤖 AI가 VM을 원격으로 관리합니다..." -ForegroundColor Green
Write-Host "VM: $VmIP`:$Port" -ForegroundColor Cyan

function Invoke-VmApi {
    param([string]$Endpoint, [string]$Method = "GET", [object]$Body = $null)
    
    try {
        $url = "$baseUrl$Endpoint"
        if ($Method -eq "GET") {
            $response = Invoke-RestMethod -Uri $url -Method $Method -TimeoutSec 10
        } else {
            $response = Invoke-RestMethod -Uri $url -Method $Method -Body ($Body | ConvertTo-Json) -ContentType "application/json" -TimeoutSec 10
        }
        return $response
    } catch {
        Write-Host "❌ API 호출 실패: $Endpoint" -ForegroundColor Red
        Write-Host "오류: $($_.Exception.Message)" -ForegroundColor Yellow
        return $null
    }
}

switch ($Action.ToLower()) {
    "status" {
        Write-Host "`n📊 VM 상태 확인..." -ForegroundColor Yellow
        
        $health = Invoke-VmApi "/health"
        if ($health) {
            Write-Host "✅ 헬스체크: $($health.status)" -ForegroundColor Green
            Write-Host "🕐 타임스탬프: $($health.timestamp)" -ForegroundColor White
        }
        
        $status = Invoke-VmApi "/api/status"
        if ($status) {
            Write-Host "✅ 서버 상태: $($status.status)" -ForegroundColor Green
            Write-Host "🖥️ 호스트명: $($status.hostname)" -ForegroundColor White
            Write-Host "⏱️ 업타임: $([math]::Round($status.uptime / 3600, 2)) 시간" -ForegroundColor White
            Write-Host "💾 메모리: $([math]::Round($status.memory.free / 1MB, 0))MB / $([math]::Round($status.memory.total / 1MB, 0))MB 사용 가능" -ForegroundColor White
        }
        
        $metrics = Invoke-VmApi "/api/metrics"
        if ($metrics) {
            Write-Host "📈 프로세스 메모리: $([math]::Round($metrics.memory.heapUsed / 1MB, 1))MB" -ForegroundColor White
            Write-Host "🔄 프로세스 업타임: $([math]::Round($metrics.uptime / 60, 1)) 분" -ForegroundColor White
        }
    }
    
    "logs" {
        Write-Host "`n📋 로그 확인..." -ForegroundColor Yellow
        $logs = Invoke-VmApi "/api/logs"
        if ($logs) {
            $logs | ForEach-Object { Write-Host $_ -ForegroundColor White }
        }
    }
    
    "processes" {
        Write-Host "`n🔍 프로세스 확인..." -ForegroundColor Yellow
        $processes = Invoke-VmApi "/api/processes"
        if ($processes) {
            $processes | ConvertTo-Json -Depth 3 | Write-Host -ForegroundColor White
        }
    }
    
    "restart" {
        Write-Host "`n🔄 서비스 재시작..." -ForegroundColor Yellow
        $result = Invoke-VmApi "/api/restart" "POST"
        if ($result) {
            Write-Host "✅ 재시작 명령 전송됨" -ForegroundColor Green
        }
    }
    
    "deploy" {
        Write-Host "`n🚀 배포 실행..." -ForegroundColor Yellow
        $result = Invoke-VmApi "/api/deploy" "POST"
        if ($result) {
            Write-Host "✅ 배포 명령 전송됨" -ForegroundColor Green
            Write-Host "결과: $($result | ConvertTo-Json)" -ForegroundColor White
        }
    }
    
    "shell" {
        Write-Host "`n💻 원격 명령 실행..." -ForegroundColor Yellow
        $command = Read-Host "실행할 명령어를 입력하세요"
        $body = @{ command = $command }
        $result = Invoke-VmApi "/api/execute" "POST" $body
        if ($result) {
            Write-Host "📤 명령어: $command" -ForegroundColor Cyan
            Write-Host "📥 결과:" -ForegroundColor Green
            Write-Host $result.output -ForegroundColor White
            if ($result.error) {
                Write-Host "❌ 오류: $($result.error)" -ForegroundColor Red
            }
        }
    }
    
    "monitor" {
        Write-Host "`n📊 실시간 모니터링 시작..." -ForegroundColor Yellow
        Write-Host "Ctrl+C로 중지" -ForegroundColor Gray
        
        while ($true) {
            Clear-Host
            Write-Host "🤖 VM 실시간 모니터링 - $(Get-Date -Format 'HH:mm:ss')" -ForegroundColor Green
            Write-Host "=" * 60 -ForegroundColor Cyan
            
            & $PSCommandPath -Action "status"
            
            Start-Sleep -Seconds 5
        }
    }
    
    default {
        Write-Host "`n🤖 AI VM 원격 제어 도구" -ForegroundColor Green
        Write-Host "사용법: ./vm-remote-control.ps1 -Action <명령어>" -ForegroundColor Yellow
        Write-Host "`n📋 사용 가능한 명령어:" -ForegroundColor Yellow
        Write-Host "  status     - VM 상태 확인 (기본값)" -ForegroundColor White
        Write-Host "  logs       - 로그 확인" -ForegroundColor White
        Write-Host "  processes  - 프로세스 목록" -ForegroundColor White
        Write-Host "  restart    - 서비스 재시작" -ForegroundColor White
        Write-Host "  deploy     - 배포 실행" -ForegroundColor White
        Write-Host "  shell      - 원격 명령 실행" -ForegroundColor White
        Write-Host "  monitor    - 실시간 모니터링" -ForegroundColor White
        Write-Host "`n💡 예시:" -ForegroundColor Yellow
        Write-Host "  ./vm-remote-control.ps1 -Action status" -ForegroundColor Cyan
        Write-Host "  ./vm-remote-control.ps1 -Action shell" -ForegroundColor Cyan
        Write-Host "  ./vm-remote-control.ps1 -Action monitor" -ForegroundColor Cyan
    }
}

Write-Host "`n✨ 완료!" -ForegroundColor Green