# 🤖 AI가 VM과 직접 소통할 수 있는 인터페이스

param([string]$Query = "")

$VmIP = "104.154.205.25"
$Port = "10000"
$baseUrl = "http://$VmIP`:$Port"

function Get-VmData {
    param([string]$Type)
    
    try {
        switch ($Type) {
            "health" { 
                return Invoke-RestMethod -Uri "$baseUrl/health" -TimeoutSec 10
            }
            "status" { 
                return Invoke-RestMethod -Uri "$baseUrl/api/status" -TimeoutSec 10
            }
            "metrics" { 
                return Invoke-RestMethod -Uri "$baseUrl/api/metrics" -TimeoutSec 10
            }
            default { 
                return $null 
            }
        }
    } catch {
        return @{ error = $_.Exception.Message }
    }
}

function Format-VmInfo {
    $health = Get-VmData "health"
    $status = Get-VmData "status" 
    $metrics = Get-VmData "metrics"
    
    $info = @{
        timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        vm_ip = $VmIP
        connection = if ($health.status -eq "healthy") { "✅ 연결됨" } else { "❌ 연결 실패" }
        uptime_hours = if ($status.uptime) { [math]::Round($status.uptime / 3600, 2) } else { "N/A" }
        memory_usage = if ($status.memory) { 
            $used = $status.memory.total - $status.memory.free
            "$([math]::Round($used / 1MB, 0))MB / $([math]::Round($status.memory.total / 1MB, 0))MB"
        } else { "N/A" }
        process_memory = if ($metrics.memory) { 
            "$([math]::Round($metrics.memory.heapUsed / 1MB, 1))MB"
        } else { "N/A" }
        hostname = if ($status.hostname) { $status.hostname } else { "unknown" }
    }
    
    return $info
}

if ($Query) {
    Write-Host "🤖 AI VM 쿼리: $Query" -ForegroundColor Cyan
    Write-Host ""
}

$vmInfo = Format-VmInfo
Write-Host "📊 VM 상태 리포트:" -ForegroundColor Green
$vmInfo | Format-Table -AutoSize

Write-Host "🔗 VM 접속 정보:" -ForegroundColor Yellow
Write-Host "IP: $VmIP"
Write-Host "포트: $Port"
Write-Host "헬스체크: $baseUrl/health"
Write-Host ""