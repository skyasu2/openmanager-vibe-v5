# PowerShell GCP VM 관리 도구
# Windows 환경에서 GCP VM과 Cloud Functions를 효율적으로 관리

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("status", "optimize", "logs", "restart", "monitor", "deploy", "health")]
    [string]$Command,
    
    [Parameter()]
    [string]$Service = "all",
    
    [Parameter()]
    [int]$Lines = 100,
    
    [Parameter()]
    [switch]$Force
)

# 설정 변수
$VM_NAME = "mcp-server"
$VM_ZONE = "us-central1-a"
$VM_IP = "104.154.205.25"
$VM_PORT = "10000"
$PROJECT_ID = "openmanager-free-tier"

# 환경변수 로드
if (Test-Path ".env.local") {
    Get-Content ".env.local" | ForEach-Object {
        if ($_ -match "^VM_API_TOKEN=(.+)$") {
            $env:VM_API_TOKEN = $matches[1]
        }
        if ($_ -match "^GCP_PROJECT_ID=(.+)$") {
            $PROJECT_ID = $matches[1]
        }
    }
}

function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    
    $colorMap = @{
        "Red" = "Red"
        "Green" = "Green"
        "Yellow" = "Yellow"
        "Blue" = "Blue"
        "Magenta" = "Magenta"
        "Cyan" = "Cyan"
        "White" = "White"
    }
    
    Write-Host $Message -ForegroundColor $colorMap[$Color]
}

function Test-VMConnection {
    Write-ColorOutput "🔍 VM 연결 상태 확인..." "Blue"
    
    try {
        $response = Invoke-RestMethod -Uri "http://$VM_IP`:$VM_PORT/api/health" -Method GET -TimeoutSec 10
        Write-ColorOutput "✅ VM API 서버 정상 응답" "Green"
        return $true
    }
    catch {
        Write-ColorOutput "❌ VM 연결 실패: $($_.Exception.Message)" "Red"
        return $false
    }
}

function Get-VMStatus {
    Write-ColorOutput "📊 VM 상태 조회" "Blue"
    
    if (-not (Test-VMConnection)) {
        Write-ColorOutput "💡 VM이 중지되었거나 네트워크 문제가 있을 수 있습니다." "Yellow"
        return
    }
    
    try {
        # API 토큰을 사용한 인증된 요청
        $headers = @{
            'Authorization' = "Bearer $env:VM_API_TOKEN"
            'Content-Type' = 'application/json'
        }
        
        $status = Invoke-RestMethod -Uri "http://$VM_IP`:$VM_PORT/api/status" -Headers $headers -Method GET -TimeoutSec 15
        
        Write-ColorOutput "🖥️ 시스템 리소스:" "Cyan"
        if ($status.memory) {
            $memPercent = [math]::Round(($status.memory.used / $status.memory.total) * 100, 1)
            Write-Host "   💾 메모리: $($status.memory.used)MB / $($status.memory.total)MB ($memPercent%)"
        }
        
        if ($status.cpu) {
            Write-Host "   🔄 CPU: $($status.cpu.usage)%"
        }
        
        if ($status.disk) {
            Write-Host "   💿 디스크: $($status.disk.used)% 사용"
        }
        
        if ($status.uptime) {
            Write-Host "   ⏰ 업타임: $($status.uptime)초"
        }
        
        # PM2 프로세스 상태
        $pm2 = Invoke-RestMethod -Uri "http://$VM_IP`:$VM_PORT/api/pm2" -Headers $headers -Method GET -TimeoutSec 10
        
        if ($pm2.processes) {
            Write-ColorOutput "🔧 PM2 프로세스:" "Cyan"
            $pm2.processes | ForEach-Object {
                $statusIcon = if ($_.status -eq 'online') { '✅' } else { '❌' }
                $memory = if ($_.memory) { "$([math]::Round($_.memory / 1MB, 1))MB" } else { 'N/A' }
                Write-Host "   $statusIcon $($_.name): $($_.status) (메모리: $memory)"
            }
        }
        
    }
    catch {
        Write-ColorOutput "❌ VM 상태 조회 실패: $($_.Exception.Message)" "Red"
    }
}

function Optimize-VM {
    Write-ColorOutput "⚡ VM 최적화 실행" "Blue"
    
    if (-not (Test-VMConnection)) {
        return
    }
    
    $optimizations = @(
        @{
            Name = "스왑 파일 생성"
            Command = "sudo fallocate -l 1G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile"
            Description = "메모리 부족 상황 대비 1GB 스왑 파일 생성"
        },
        @{
            Name = "PM2 메모리 제한"
            Command = "pm2 restart all --max-memory-restart 800M"
            Description = "PM2 프로세스 메모리 제한 설정"
        },
        @{
            Name = "불필요한 서비스 중지"
            Command = "sudo systemctl disable snapd && sudo systemctl stop snapd"
            Description = "snapd 서비스 비활성화로 리소스 절약"
        },
        @{
            Name = "로그 로테이션"
            Command = "sudo logrotate -f /etc/logrotate.conf"
            Description = "로그 파일 정리로 디스크 공간 확보"
        }
    )
    
    foreach ($opt in $optimizations) {
        Write-ColorOutput "🔧 $($opt.Name) 실행 중..." "Yellow"
        Write-Host "   설명: $($opt.Description)"
        
        try {
            $headers = @{
                'Authorization' = "Bearer $env:VM_API_TOKEN"
                'Content-Type' = 'application/json'
            }
            
            $body = @{
                command = $opt.Command
            } | ConvertTo-Json
            
            $result = Invoke-RestMethod -Uri "http://$VM_IP`:$VM_PORT/api/execute" -Headers $headers -Method POST -Body $body -TimeoutSec 30
            
            if ($result.success) {
                Write-ColorOutput "   ✅ 완료" "Green"
            } else {
                Write-ColorOutput "   ⚠️ 경고: $($result.error)" "Yellow"
            }
        }
        catch {
            Write-ColorOutput "   ❌ 실패: $($_.Exception.Message)" "Red"
        }
        
        Start-Sleep -Seconds 2
    }
    
    Write-ColorOutput "✅ VM 최적화 완료" "Green"
}

function Get-VMLogs {
    param([int]$LogLines = $Lines)
    
    Write-ColorOutput "📝 VM 로그 조회 (최근 $LogLines줄)" "Blue"
    
    if (-not (Test-VMConnection)) {
        return
    }
    
    try {
        $headers = @{
            'Authorization' = "Bearer $env:VM_API_TOKEN"
            'Content-Type' = 'application/json'
        }
        
        $logs = Invoke-RestMethod -Uri "http://$VM_IP`:$VM_PORT/api/logs?lines=$LogLines" -Headers $headers -Method GET -TimeoutSec 15
        
        if ($logs.logs) {
            Write-ColorOutput "최근 로그:" "Cyan"
            $logs.logs | ForEach-Object {
                Write-Host "   $_"
            }
        } else {
            Write-ColorOutput "로그 데이터를 찾을 수 없습니다." "Yellow"
        }
    }
    catch {
        Write-ColorOutput "❌ 로그 조회 실패: $($_.Exception.Message)" "Red"
    }
}

function Restart-VMService {
    param([string]$ServiceName = $Service)
    
    Write-ColorOutput "🔄 VM 서비스 재시작: $ServiceName" "Blue"
    
    if (-not (Test-VMConnection)) {
        return
    }
    
    try {
        $headers = @{
            'Authorization' = "Bearer $env:VM_API_TOKEN"
            'Content-Type' = 'application/json'
        }
        
        $body = @{
            service = $ServiceName
        } | ConvertTo-Json
        
        $result = Invoke-RestMethod -Uri "http://$VM_IP`:$VM_PORT/api/restart" -Headers $headers -Method POST -Body $body -TimeoutSec 30
        
        if ($result.success) {
            Write-ColorOutput "✅ 서비스 재시작 완료: $ServiceName" "Green"
        } else {
            Write-ColorOutput "❌ 재시작 실패: $($result.error)" "Red"
        }
    }
    catch {
        Write-ColorOutput "❌ 서비스 재시작 실패: $($_.Exception.Message)" "Red"
    }
}

function Start-VMMonitoring {
    Write-ColorOutput "📊 VM 실시간 모니터링 시작 (Ctrl+C로 종료)" "Blue"
    
    while ($true) {
        Clear-Host
        Write-ColorOutput "🖥️ OpenManager VIBE v5 - GCP VM 대시보드" "Magenta"
        Write-ColorOutput "=================================================" "Magenta"
        Write-ColorOutput "⏰ $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss KST')" "White"
        Write-Host ""
        
        Write-ColorOutput "🎯 VM 인스턴스: $VM_NAME ($VM_ZONE)" "Cyan"
        Write-ColorOutput "🌐 외부 IP: $VM_IP" "Cyan"
        Write-Host ""
        
        if (Test-VMConnection) {
            Get-VMStatus
        } else {
            Write-ColorOutput "❌ VM 연결 실패 - VM이 중지되었거나 네트워크 문제" "Red"
        }
        
        Write-Host ""
        Write-ColorOutput "Press Ctrl+C to exit..." "Yellow"
        Start-Sleep -Seconds 10
    }
}

function Deploy-CloudFunctions {
    Write-ColorOutput "🚀 Cloud Functions 배포 시작" "Blue"
    
    # 배포 스크립트 실행 (Git Bash 필요)
    $deployScript = ".\gcp-functions\deployment\deploy-all.sh"
    
    if (Test-Path $deployScript) {
        Write-ColorOutput "📦 배포 스크립트 실행 중..." "Yellow"
        
        try {
            # Git Bash를 통한 스크립트 실행
            $result = & "C:\Program Files\Git\bin\bash.exe" -c $deployScript
            Write-ColorOutput "✅ Cloud Functions 배포 완료" "Green"
        }
        catch {
            Write-ColorOutput "❌ 배포 실패: $($_.Exception.Message)" "Red"
            Write-ColorOutput "💡 Git Bash가 설치되어 있는지 확인하세요." "Yellow"
        }
    } else {
        Write-ColorOutput "❌ 배포 스크립트를 찾을 수 없습니다: $deployScript" "Red"
    }
}

function Get-HealthCheck {
    Write-ColorOutput "🏥 GCP 시스템 종합 헬스체크" "Blue"
    
    # VM 상태
    Write-ColorOutput "1️⃣ VM 상태 점검..." "Cyan"
    Get-VMStatus
    
    Write-Host ""
    
    # Cloud Functions 상태 (추정)
    Write-ColorOutput "2️⃣ Cloud Functions 상태 점검..." "Cyan"
    $functions = @("enhanced-korean-nlp", "ml-analytics-engine", "unified-ai-processor")
    
    foreach ($func in $functions) {
        $url = "https://asia-northeast3-$PROJECT_ID.cloudfunctions.net/$func"
        Write-Host "   📡 $func 테스트 중..."
        
        try {
            $response = Invoke-RestMethod -Uri $url -Method POST -Body '{"test": true}' -ContentType "application/json" -TimeoutSec 10
            Write-ColorOutput "   ✅ $func: 정상 응답" "Green"
        }
        catch {
            Write-ColorOutput "   ❌ $func: 응답 없음 또는 오류" "Red"
        }
    }
    
    Write-Host ""
    
    # 무료 티어 사용량 분석 실행
    Write-ColorOutput "3️⃣ 무료 티어 사용량 분석..." "Cyan"
    try {
        & node "gcp-free-tier-optimizer.js"
    }
    catch {
        Write-ColorOutput "   ⚠️ 사용량 분석 도구 실행 실패" "Yellow"
    }
}

# 메인 실행 로직
function Main {
    Write-ColorOutput "🚀 GCP VM 관리 도구 v1.0 (PowerShell)" "Magenta"
    Write-ColorOutput "=========================================" "Magenta"
    
    # API 토큰 확인
    if (-not $env:VM_API_TOKEN) {
        Write-ColorOutput "❌ VM_API_TOKEN 환경변수가 설정되지 않았습니다." "Red"
        Write-ColorOutput "💡 .env.local 파일에 VM_API_TOKEN을 추가하세요." "Yellow"
        return
    }
    
    switch ($Command.ToLower()) {
        "status" {
            Get-VMStatus
        }
        "optimize" {
            Optimize-VM
        }
        "logs" {
            Get-VMLogs -LogLines $Lines
        }
        "restart" {
            Restart-VMService -ServiceName $Service
        }
        "monitor" {
            Start-VMMonitoring
        }
        "deploy" {
            Deploy-CloudFunctions
        }
        "health" {
            Get-HealthCheck
        }
        default {
            Write-ColorOutput "사용법:" "Yellow"
            Write-Host "  .\gcp-vm-manager.ps1 -Command <명령어> [옵션]"
            Write-Host ""
            Write-Host "명령어:"
            Write-Host "  status     VM 상태 확인"
            Write-Host "  optimize   VM 성능 최적화"
            Write-Host "  logs       로그 조회 (-Lines 100)"
            Write-Host "  restart    서비스 재시작 (-Service all)"
            Write-Host "  monitor    실시간 모니터링"
            Write-Host "  deploy     Cloud Functions 배포"
            Write-Host "  health     종합 헬스체크"
            Write-Host ""
            Write-Host "예시:"
            Write-Host "  .\gcp-vm-manager.ps1 -Command status"
            Write-Host "  .\gcp-vm-manager.ps1 -Command logs -Lines 50"
            Write-Host "  .\gcp-vm-manager.ps1 -Command restart -Service mgmt-api"
        }
    }
}

# 스크립트 실행
try {
    Main
}
catch {
    Write-ColorOutput "❌ 실행 중 오류: $($_.Exception.Message)" "Red"
    exit 1
}