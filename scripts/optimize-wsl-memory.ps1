# WSL 메모리 최적화 스크립트
# 메모리: 8GB, 스왑: 16GB로 설정

param(
    [switch]$Apply,
    [switch]$Status,
    [switch]$Reset
)

$ErrorActionPreference = "Stop"

# WSL 설정 파일 경로
$wslConfigPath = "$env:USERPROFILE\.wslconfig"

Write-Host "=== WSL 메모리 최적화 도구 ===" -ForegroundColor Cyan

if ($Status) {
    Write-Host "`n📊 현재 시스템 상태:" -ForegroundColor Yellow
    
    # 시스템 메모리 정보
    $totalMemory = [math]::Round((Get-WmiObject -Class Win32_ComputerSystem).TotalPhysicalMemory / 1GB, 2)
    Write-Host "   총 물리 메모리: $totalMemory GB" -ForegroundColor White
    
    # WSL 상태
    $wslStatus = wsl --list --verbose
    Write-Host "   WSL 상태:" -ForegroundColor White
    $wslStatus | ForEach-Object { Write-Host "     $_" -ForegroundColor Gray }
    
    # 현재 WSL 설정
    if (Test-Path $wslConfigPath) {
        Write-Host "`n📋 현재 WSL 설정:" -ForegroundColor Yellow
        Get-Content $wslConfigPath | ForEach-Object { Write-Host "   $_" -ForegroundColor Gray }
    } else {
        Write-Host "`n⚠️  WSL 설정 파일이 없습니다" -ForegroundColor Yellow
    }
    
    return
}

if ($Reset) {
    Write-Host "`n🔄 WSL 설정 초기화 중..." -ForegroundColor Yellow
    
    if (Test-Path $wslConfigPath) {
        $backupPath = "$wslConfigPath.backup.$(Get-Date -Format 'yyyyMMdd-HHmmss')"
        Copy-Item $wslConfigPath $backupPath
        Write-Host "   기존 설정 백업: $backupPath" -ForegroundColor Green
        Remove-Item $wslConfigPath
    }
    
    Write-Host "✅ WSL 설정이 초기화되었습니다" -ForegroundColor Green
    Write-Host "💡 WSL을 재시작하려면: wsl --shutdown" -ForegroundColor Cyan
    return
}

if ($Apply) {
    Write-Host "`n⚙️  WSL 메모리 설정 적용 중..." -ForegroundColor Yellow
    
    # 기존 설정 백업
    if (Test-Path $wslConfigPath) {
        $backupPath = "$wslConfigPath.backup.$(Get-Date -Format 'yyyyMMdd-HHmmss')"
        Copy-Item $wslConfigPath $backupPath
        Write-Host "   기존 설정 백업: $backupPath" -ForegroundColor Green
    }
    
    # 최적화된 WSL 설정 생성
    $wslConfig = @"
# WSL 메모리 최적화 설정
# 생성일: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
# 시스템: 16GB RAM, AMD Ryzen 5 7430U

[wsl2]
# 메모리 설정 (8GB - 내장 그래픽 고려)
memory=8GB
processors=6

# 스왑 설정 (16GB)
swap=16GB
swapfile=C:\temp\wsl-swap.vhdx

# 네트워크 설정
localhostForwarding=true
networkingMode=mirrored

# 성능 최적화
nestedVirtualization=false
pageReporting=true
kernelCommandLine=cgroup_no_v1=all systemd.unified_cgroup_hierarchy=1

# 메모리 회수 설정
vmIdleTimeout=60000
"@

    # 스왑 파일 디렉토리 생성
    $swapDir = "C:\temp"
    if (!(Test-Path $swapDir)) {
        New-Item -ItemType Directory -Path $swapDir -Force | Out-Null
        Write-Host "   스왑 디렉토리 생성: $swapDir" -ForegroundColor Green
    }
    
    # 설정 파일 저장
    $wslConfig | Out-File -FilePath $wslConfigPath -Encoding UTF8 -Force
    Write-Host "   WSL 설정 파일 생성: $wslConfigPath" -ForegroundColor Green
    
    Write-Host "`n✅ WSL 메모리 최적화 설정 완료!" -ForegroundColor Green
    Write-Host "`n📋 적용된 설정:" -ForegroundColor Yellow
    Write-Host "   • 메모리: 8GB (내장 그래픽 고려)" -ForegroundColor White
    Write-Host "   • 프로세서: 6코어" -ForegroundColor White
    Write-Host "   • 스왑: 16GB" -ForegroundColor White
    Write-Host "   • 네트워킹: 미러링 모드" -ForegroundColor White
    Write-Host "   • 메모리 회수: 60초 후" -ForegroundColor White
    
    Write-Host "`n🔄 설정 적용을 위해 WSL을 재시작합니다..." -ForegroundColor Cyan
    wsl --shutdown
    Start-Sleep -Seconds 3
    
    Write-Host "✅ WSL 재시작 완료!" -ForegroundColor Green
    Write-Host "`n💡 설정 확인: .\scripts\optimize-wsl-memory.ps1 -Status" -ForegroundColor Cyan
    
} else {
    Write-Host "`n📖 사용법:" -ForegroundColor Yellow
    Write-Host "   .\scripts\optimize-wsl-memory.ps1 -Apply    # 메모리 최적화 적용" -ForegroundColor White
    Write-Host "   .\scripts\optimize-wsl-memory.ps1 -Status   # 현재 상태 확인" -ForegroundColor White
    Write-Host "   .\scripts\optimize-wsl-memory.ps1 -Reset    # 설정 초기화" -ForegroundColor White
    
    Write-Host "`n🎯 권장 설정 (현재 시스템 기준):" -ForegroundColor Yellow
    Write-Host "   • 총 메모리: 16GB" -ForegroundColor Gray
    Write-Host "   • 내장 그래픽: ~2GB" -ForegroundColor Gray
    Write-Host "   • Windows 시스템: ~4GB" -ForegroundColor Gray
    Write-Host "   • WSL 할당: 8GB (적정)" -ForegroundColor Green
    Write-Host "   • 스왑: 16GB (여유)" -ForegroundColor Green
}