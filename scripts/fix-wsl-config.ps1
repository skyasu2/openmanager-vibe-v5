# WSL 설정 파일 수정 스크립트

$wslConfigPath = "$env:USERPROFILE\.wslconfig"

Write-Host "🔧 WSL 설정 파일 수정 중..." -ForegroundColor Yellow

# 호환성 문제 해결된 설정
$fixedConfig = @"
# WSL 메모리 최적화 설정 (수정됨)
# 생성일: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
# 시스템: 16GB RAM, AMD Ryzen 5 7430U

[wsl2]
# 메모리 설정 (8GB - 내장 그래픽 고려)
memory=8GB
processors=6

# 스왑 설정 (16GB)
swap=16GB
swapfile=C:\temp\wsl-swap.vhdx

# 네트워크 설정 (mirrored 모드에서는 localhostForwarding 불필요)
networkingMode=mirrored

# 성능 최적화
nestedVirtualization=false

# 메모리 회수 설정
vmIdleTimeout=60000

# 실험적 기능
[experimental]
autoMemoryReclaim=gradual
sparseVhd=true
"@

# 기존 설정 백업
$backupPath = "$wslConfigPath.backup.$(Get-Date -Format 'yyyyMMdd-HHmmss')"
Copy-Item $wslConfigPath $backupPath
Write-Host "   기존 설정 백업: $backupPath" -ForegroundColor Green

# 수정된 설정 저장
$fixedConfig | Out-File -FilePath $wslConfigPath -Encoding UTF8 -Force
Write-Host "   WSL 설정 파일 수정 완료" -ForegroundColor Green

Write-Host "✅ WSL 설정 수정 완료!" -ForegroundColor Green
Write-Host "🔄 WSL 재시작 중..." -ForegroundColor Cyan

wsl --shutdown
Start-Sleep -Seconds 3

Write-Host "✅ WSL 재시작 완료!" -ForegroundColor Green