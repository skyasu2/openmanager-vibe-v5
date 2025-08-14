# Windows에서 GCP VM SSH 접속 설정 스크립트

Write-Host "🔧 Windows GCP VM SSH 접속 설정을 시작합니다..." -ForegroundColor Green

# 1. gcloud 인증 확인
Write-Host "`n1️⃣ gcloud 인증 상태 확인..." -ForegroundColor Yellow
$authStatus = ./google-cloud-sdk/bin/gcloud auth list --format="value(account)" 2>$null

if (-not $authStatus) {
    Write-Host "❌ gcloud 인증이 필요합니다." -ForegroundColor Red
    Write-Host "다음 명령어를 실행하여 인증하세요:" -ForegroundColor Cyan
    Write-Host "./google-cloud-sdk/bin/gcloud auth login" -ForegroundColor White
    Write-Host "`n또는 브라우저에서 Cloud Shell을 사용하세요:" -ForegroundColor Cyan
    Write-Host "https://shell.cloud.google.com/?project=openmanager-free-tier" -ForegroundColor White
    exit 1
}

Write-Host "✅ 인증된 계정: $authStatus" -ForegroundColor Green

# 2. SSH 키 확인
Write-Host "`n2️⃣ SSH 키 확인..." -ForegroundColor Yellow
$sshKeyPath = "$env:USERPROFILE\.ssh\google_compute_engine"
$sshPubKeyPath = "$env:USERPROFILE\.ssh\google_compute_engine.pub"

if (Test-Path $sshKeyPath) {
    Write-Host "✅ SSH 키가 존재합니다: $sshKeyPath" -ForegroundColor Green
} else {
    Write-Host "❌ SSH 키가 없습니다. 생성 중..." -ForegroundColor Red
    ssh-keygen -t rsa -b 2048 -f $sshKeyPath -N ""
    Write-Host "✅ SSH 키가 생성되었습니다." -ForegroundColor Green
}

# 3. 공개 키를 VM 메타데이터에 추가
Write-Host "`n3️⃣ VM에 SSH 키 등록..." -ForegroundColor Yellow
$pubKey = Get-Content $sshPubKeyPath
$sshMetadata = "skyasu2:$pubKey"

# 임시 파일에 SSH 키 저장
$tempFile = "$env:TEMP\ssh-keys.txt"
$sshMetadata | Out-File -FilePath $tempFile -Encoding UTF8

try {
    ./google-cloud-sdk/bin/gcloud compute instances add-metadata mcp-server `
        --zone=us-central1-a `
        --metadata-from-file ssh-keys=$tempFile `
        --project=openmanager-free-tier
    
    Write-Host "✅ SSH 키가 VM에 등록되었습니다." -ForegroundColor Green
    Remove-Item $tempFile -Force
} catch {
    Write-Host "❌ SSH 키 등록 실패: $($_.Exception.Message)" -ForegroundColor Red
    Remove-Item $tempFile -Force -ErrorAction SilentlyContinue
}

# 4. SSH 접속 테스트
Write-Host "`n4️⃣ SSH 접속 테스트..." -ForegroundColor Yellow
Start-Sleep -Seconds 5  # 메타데이터 적용 대기

$vmIP = "104.154.205.25"
try {
    $result = ssh -i $sshKeyPath -o StrictHostKeyChecking=no -o ConnectTimeout=10 skyasu2@$vmIP "echo 'SSH 연결 성공!'"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ SSH 접속 성공!" -ForegroundColor Green
        Write-Host "연결 명령어: ssh -i $sshKeyPath skyasu2@$vmIP" -ForegroundColor Cyan
    } else {
        Write-Host "❌ SSH 접속 실패" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ SSH 접속 오류: $($_.Exception.Message)" -ForegroundColor Red
}

# 5. 대안 방법 안내
Write-Host "`n🌟 대안 접속 방법:" -ForegroundColor Yellow
Write-Host "1. Cloud Shell (권장): https://shell.cloud.google.com/?project=openmanager-free-tier" -ForegroundColor Cyan
Write-Host "2. 직접 SSH: ssh -i $sshKeyPath skyasu2@$vmIP" -ForegroundColor Cyan
Write-Host "3. VM 상태 확인: curl http://$vmIP`:10000/health" -ForegroundColor Cyan

Write-Host "`n✨ 설정 완료!" -ForegroundColor Green