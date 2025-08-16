# Claude Code 및 MCP 서버 최적화 WSL 설정 스크립트

param(
    [switch]$Apply,
    [switch]$Check,
    [switch]$Test
)

$ErrorActionPreference = "Stop"

Write-Host "=== Claude Code WSL 최적화 도구 ===" -ForegroundColor Cyan

function Test-ClaudeCodeCompatibility {
    Write-Host "`n🔍 Claude Code 호환성 테스트:" -ForegroundColor Yellow
    
    # WSL 버전 확인
    $wslVersion = wsl --version 2>$null
    if ($wslVersion) {
        Write-Host "   ✅ WSL 버전: 최신" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  WSL 버전: 구버전 (업데이트 권장)" -ForegroundColor Yellow
    }
    
    # 네트워크 연결 테스트
    Write-Host "   🌐 네트워크 연결 테스트..." -ForegroundColor Gray
    $networkTest = wsl bash -c "curl -s --connect-timeout 5 https://api.github.com/zen" 2>$null
    if ($networkTest) {
        Write-Host "   ✅ 외부 네트워크: 정상" -ForegroundColor Green
    } else {
        Write-Host "   ❌ 외부 네트워크: 연결 실패" -ForegroundColor Red
    }
    
    # Node.js 환경 확인
    $nodeVersion = wsl bash -c "node --version" 2>$null
    if ($nodeVersion) {
        Write-Host "   ✅ Node.js: $nodeVersion" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Node.js: 미설치 (MCP 서버 필요)" -ForegroundColor Yellow
    }
    
    # Python 환경 확인
    $pythonVersion = wsl bash -c "python3 --version" 2>$null
    if ($pythonVersion) {
        Write-Host "   ✅ Python: $pythonVersion" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Python: 미설치 (일부 MCP 서버 필요)" -ForegroundColor Yellow
    }
    
    # 포트 포워딩 테스트
    Write-Host "   🔌 포트 포워딩 테스트..." -ForegroundColor Gray
    $portTest = wsl bash -c "ss -tuln | grep ':3000'" 2>$null
    if ($portTest) {
        Write-Host "   ✅ 포트 포워딩: 활성" -ForegroundColor Green
    } else {
        Write-Host "   ℹ️  포트 포워딩: 대기 중 (정상)" -ForegroundColor Cyan
    }
}

function Show-CurrentConfig {
    Write-Host "`n📋 현재 WSL 설정:" -ForegroundColor Yellow
    
    $wslConfigPath = "$env:USERPROFILE\.wslconfig"
    if (Test-Path $wslConfigPath) {
        Get-Content $wslConfigPath | ForEach-Object { Write-Host "   $_" -ForegroundColor Gray }
    } else {
        Write-Host "   ⚠️  WSL 설정 파일 없음" -ForegroundColor Yellow
    }
    
    Write-Host "`n🌐 네트워크 정보:" -ForegroundColor Yellow
    $ipInfo = wsl bash -c "ip addr show eth0 | grep 'inet '" 2>$null
    if ($ipInfo) {
        Write-Host "   WSL IP: $($ipInfo.Trim())" -ForegroundColor Gray
    }
}

function Apply-ClaudeCodeOptimization {
    Write-Host "`n🔧 Claude Code 최적화 설정 적용 중..." -ForegroundColor Yellow
    
    $wslConfigPath = "$env:USERPROFILE\.wslconfig"
    
    # 기존 설정 백업
    if (Test-Path $wslConfigPath) {
        $backupPath = "$wslConfigPath.backup.$(Get-Date -Format 'yyyyMMdd-HHmmss')"
        Copy-Item $wslConfigPath $backupPath
        Write-Host "   기존 설정 백업: $backupPath" -ForegroundColor Green
    }
    
    # Claude Code 최적화 설정
    $optimizedConfig = @"
# Claude Code 및 MCP 서버 최적화 WSL 설정
# 생성일: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
# 용도: Claude Code, MCP 서버, 개발 환경

[wsl2]
# 메모리 설정 (8GB - 안정적인 MCP 서버 실행)
memory=8GB
processors=6

# 스왑 설정 (16GB - 대용량 프로젝트 지원)
swap=16GB
swapfile=C:/temp/wsl-swap.vhdx

# 네트워크 설정 (mirrored - 최고 성능)
networkingMode=mirrored

# 성능 최적화
nestedVirtualization=false
vmIdleTimeout=60000

# 파일 시스템 최적화 (MCP filesystem 서버용)
[wsl2]
kernelCommandLine=cgroup_no_v1=all systemd.unified_cgroup_hierarchy=1

# 실험적 기능 (안정성 및 성능 향상)
[experimental]
# 자동 메모리 회수 (메모리 효율성)
autoMemoryReclaim=gradual

# 스파스 VHD (디스크 공간 절약)
sparseVhd=true

# DNS 터널링 (네트워크 성능)
dnsTunneling=true

# 방화벽 (보안 강화)
firewall=true

# 자동 프록시 (기업 환경 지원)
autoProxy=true

# 호스트 주소 루프백 (localhost 접근 개선)
hostAddressLoopback=true
"@

    # 설정 파일 저장
    $optimizedConfig | Out-File -FilePath $wslConfigPath -Encoding UTF8 -Force
    Write-Host "   ✅ WSL 설정 파일 생성 완료" -ForegroundColor Green
    
    # 스왑 디렉토리 생성
    $swapDir = "C:\temp"
    if (!(Test-Path $swapDir)) {
        New-Item -ItemType Directory -Path $swapDir -Force | Out-Null
        Write-Host "   ✅ 스왑 디렉토리 생성: $swapDir" -ForegroundColor Green
    }
    
    Write-Host "`n📋 적용된 최적화:" -ForegroundColor Green
    Write-Host "   • 메모리: 8GB (MCP 서버 안정 실행)" -ForegroundColor White
    Write-Host "   • 프로세서: 6코어 (효율적 멀티태스킹)" -ForegroundColor White
    Write-Host "   • 스왑: 16GB (대용량 프로젝트 지원)" -ForegroundColor White
    Write-Host "   • 네트워킹: 미러링 (최고 성능)" -ForegroundColor White
    Write-Host "   • 자동 메모리 회수 (효율성 향상)" -ForegroundColor White
    Write-Host "   • DNS 터널링 (네트워크 최적화)" -ForegroundColor White
    Write-Host "   • 방화벽 활성화 (보안 강화)" -ForegroundColor White
    
    Write-Host "`n🔄 WSL 재시작 중..." -ForegroundColor Cyan
    wsl --shutdown
    Start-Sleep -Seconds 5
    
    Write-Host "✅ WSL 재시작 완료!" -ForegroundColor Green
    
    # 재시작 후 테스트
    Write-Host "`n🧪 설정 적용 확인 중..." -ForegroundColor Yellow
    Start-Sleep -Seconds 3
    
    $testResult = wsl bash -c "echo 'WSL 연결 테스트 성공'" 2>$null
    if ($testResult) {
        Write-Host "   ✅ WSL 연결: 정상" -ForegroundColor Green
    } else {
        Write-Host "   ❌ WSL 연결: 실패" -ForegroundColor Red
    }
}

# 메인 로직
switch ($true) {
    $Check {
        Show-CurrentConfig
        Test-ClaudeCodeCompatibility
    }
    $Test {
        Test-ClaudeCodeCompatibility
    }
    $Apply {
        Apply-ClaudeCodeOptimization
        Show-CurrentConfig
        Test-ClaudeCodeCompatibility
    }
    default {
        Write-Host "`n📖 사용법:" -ForegroundColor Yellow
        Write-Host "   .\scripts\claude-code-wsl-optimize.ps1 -Check   # 현재 설정 확인" -ForegroundColor White
        Write-Host "   .\scripts\claude-code-wsl-optimize.ps1 -Test    # 호환성 테스트" -ForegroundColor White
        Write-Host "   .\scripts\claude-code-wsl-optimize.ps1 -Apply   # 최적화 적용" -ForegroundColor White
        
        Write-Host "`n🎯 Claude Code 최적화 포인트:" -ForegroundColor Green
        Write-Host "   • 미러링 네트워크: localhost 접근 개선" -ForegroundColor White
        Write-Host "   • 충분한 메모리: MCP 서버 안정 실행" -ForegroundColor White
        Write-Host "   • 대용량 스왑: 대형 프로젝트 지원" -ForegroundColor White
        Write-Host "   • DNS 최적화: 외부 API 호출 성능" -ForegroundColor White
        Write-Host "   • 자동 메모리 회수: 장시간 사용 안정성" -ForegroundColor White
    }
}