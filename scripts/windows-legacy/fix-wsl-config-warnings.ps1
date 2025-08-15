# WSL 설정 파일 경고 수정 스크립트

Write-Host "⚙️ WSL 설정 파일 경고 수정..." -ForegroundColor Green

$wslConfigPath = "$env:USERPROFILE\.wslconfig"

if (Test-Path $wslConfigPath) {
    # 백업 생성
    $backupPath = "$wslConfigPath.backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    Copy-Item $wslConfigPath $backupPath -Force
    Write-Host "💾 백업 생성: $backupPath" -ForegroundColor Cyan
    
    # 수정된 WSL 설정 (경고 제거)
    $cleanWslConfig = @"
[wsl2]
# 메모리 설정 (10GB)
memory=10GB

# 스왑 설정 (8GB)
swap=8GB

# 프로세서 설정 (모든 코어 사용)
processors=8

# 로컬호스트 포워딩 활성화
localhostForwarding=true

# 네트워크 모드 (NAT)
networkingMode=NAT

# 커널 명령줄 매개변수
kernelCommandLine=cgroup_no_v1=all systemd.unified_cgroup_hierarchy=1

# 가상 하드 디스크 크기 제한
vmIdleTimeout=60000

# GUI 애플리케이션 지원
guiApplications=true

# 디버그 콘솔 비활성화 (성능 향상)
debugConsole=false

# 중첩 가상화 활성화
nestedVirtualization=true

[experimental]
# 자동 메모리 회수 활성화
autoMemoryReclaim=gradual

# 스파스 VHD 활성화
sparseVhd=true

# DNS 터널링 활성화
dnsTunneling=true

# 방화벽 활성화
firewall=true

# 자동 프록시 활성화
autoProxy=true
"@

    $cleanWslConfig | Out-File -FilePath $wslConfigPath -Encoding UTF8 -Force
    Write-Host "✅ WSL 설정 파일 수정 완료" -ForegroundColor Green
    
    # WSL 재시작
    Write-Host "`n🔄 WSL 재시작 중..." -ForegroundColor Yellow
    wsl --shutdown
    Start-Sleep -Seconds 3
    
    Write-Host "✅ WSL 설정 경고 수정 완료" -ForegroundColor Green
} else {
    Write-Host "❌ WSL 설정 파일을 찾을 수 없습니다" -ForegroundColor Red
}