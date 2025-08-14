# 🚀 Windows에서 GCP VM 원격 개발 환경 구축 스크립트

param(
    [string]$VmIP = "104.154.205.25",
    [string]$VmUser = "skyasu2",
    [string]$Zone = "us-central1-a",
    [string]$Instance = "mcp-server",
    [string]$Project = "openmanager-free-tier"
)

Write-Host "🚀 GCP VM 원격 개발 환경 구축을 시작합니다..." -ForegroundColor Green
Write-Host "VM: $VmUser@$VmIP ($Instance)" -ForegroundColor Cyan

# 1. SSH 키 확인 및 생성
Write-Host "`n1️⃣ SSH 키 확인..." -ForegroundColor Yellow
$sshKeyPath = "$env:USERPROFILE\.ssh\google_compute_engine"
$sshPubKeyPath = "$env:USERPROFILE\.ssh\google_compute_engine.pub"

if (-not (Test-Path $sshKeyPath)) {
    Write-Host "SSH 키 생성 중..." -ForegroundColor Yellow
    ssh-keygen -t rsa -b 2048 -f $sshKeyPath -N ""
    Write-Host "✅ SSH 키 생성 완료" -ForegroundColor Green
} else {
    Write-Host "✅ SSH 키 존재함" -ForegroundColor Green
}

# 2. VS Code Remote SSH 설정 생성
Write-Host "`n2️⃣ VS Code Remote SSH 설정..." -ForegroundColor Yellow
$sshConfigPath = "$env:USERPROFILE\.ssh\config"
$sshConfigContent = @"
# GCP VM Remote Development
Host gcp-vm-dev
    HostName $VmIP
    User $VmUser
    IdentityFile $sshKeyPath
    StrictHostKeyChecking no
    UserKnownHostsFile /dev/null
    ServerAliveInterval 60
    ServerAliveCountMax 3
    
# GCP VM with Port Forwarding
Host gcp-vm-dev-ports
    HostName $VmIP
    User $VmUser
    IdentityFile $sshKeyPath
    StrictHostKeyChecking no
    UserKnownHostsFile /dev/null
    ServerAliveInterval 60
    ServerAliveCountMax 3
    LocalForward 3000 localhost:3000
    LocalForward 8080 localhost:8080
    LocalForward 10000 localhost:10000
    LocalForward 5432 localhost:5432
"@

# 기존 설정 백업 및 추가
if (Test-Path $sshConfigPath) {
    $existingConfig = Get-Content $sshConfigPath -Raw
    if ($existingConfig -notmatch "Host gcp-vm-dev") {
        Add-Content -Path $sshConfigPath -Value "`n$sshConfigContent"
        Write-Host "✅ SSH 설정 추가됨" -ForegroundColor Green
    } else {
        Write-Host "✅ SSH 설정 이미 존재함" -ForegroundColor Green
    }
} else {
    $sshConfigContent | Out-File -FilePath $sshConfigPath -Encoding UTF8
    Write-Host "✅ SSH 설정 파일 생성됨" -ForegroundColor Green
}

# 3. gcloud 인증 확인
Write-Host "`n3️⃣ gcloud 인증 확인..." -ForegroundColor Yellow
try {
    $authAccount = ./google-cloud-sdk/bin/gcloud auth list --format="value(account)" --filter="status:ACTIVE" 2>$null
    if ($authAccount) {
        Write-Host "✅ 인증된 계정: $authAccount" -ForegroundColor Green
        
        # SSH 키를 VM 메타데이터에 추가
        Write-Host "`n4️⃣ VM에 SSH 키 등록..." -ForegroundColor Yellow
        $pubKey = Get-Content $sshPubKeyPath -Raw
        $sshMetadata = "${VmUser}:$pubKey"
        $tempFile = "$env:TEMP\ssh-keys-$(Get-Random).txt"
        $sshMetadata | Out-File -FilePath $tempFile -Encoding UTF8 -NoNewline
        
        try {
            ./google-cloud-sdk/bin/gcloud compute instances add-metadata $Instance `
                --zone=$Zone `
                --metadata-from-file ssh-keys=$tempFile `
                --project=$Project 2>$null
            
            Write-Host "✅ SSH 키 등록 완료" -ForegroundColor Green
            Remove-Item $tempFile -Force
        } catch {
            Write-Host "⚠️ SSH 키 등록 실패 (수동 등록 필요)" -ForegroundColor Yellow
            Remove-Item $tempFile -Force -ErrorAction SilentlyContinue
        }
    } else {
        Write-Host "❌ gcloud 인증 필요" -ForegroundColor Red
        Write-Host "다음 명령어로 인증하세요: ./google-cloud-sdk/bin/gcloud auth login" -ForegroundColor Cyan
    }
} catch {
    Write-Host "❌ gcloud 명령어 실행 실패" -ForegroundColor Red
}

# 5. SSH 연결 테스트
Write-Host "`n5️⃣ SSH 연결 테스트..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

try {
    $testResult = ssh -i $sshKeyPath -o ConnectTimeout=10 -o StrictHostKeyChecking=no $VmUser@$VmIP "echo 'SSH 연결 성공!'" 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ SSH 연결 성공!" -ForegroundColor Green
    } else {
        Write-Host "❌ SSH 연결 실패" -ForegroundColor Red
        Write-Host "수동으로 SSH 키를 등록해야 할 수 있습니다." -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ SSH 테스트 실패" -ForegroundColor Red
}

# 6. VS Code 확장 프로그램 설치 안내
Write-Host "`n6️⃣ VS Code 확장 프로그램 설치..." -ForegroundColor Yellow
$extensions = @(
    "ms-vscode-remote.remote-ssh",
    "ms-vscode-remote.remote-ssh-edit",
    "ms-vscode.remote-explorer"
)

foreach ($ext in $extensions) {
    try {
        code --install-extension $ext --force 2>$null
        Write-Host "✅ 설치됨: $ext" -ForegroundColor Green
    } catch {
        Write-Host "⚠️ 수동 설치 필요: $ext" -ForegroundColor Yellow
    }
}

# 7. 포트 포워딩 스크립트 생성
Write-Host "`n7️⃣ 포트 포워딩 스크립트 생성..." -ForegroundColor Yellow
$portForwardScript = @"
# 🚀 GCP VM 포트 포워딩 스크립트
# 사용법: ./port-forward.ps1

Write-Host "🔗 GCP VM 포트 포워딩 시작..." -ForegroundColor Green
Write-Host "로컬 포트 -> VM 포트" -ForegroundColor Cyan
Write-Host "3000 -> 3000 (Next.js 개발 서버)" -ForegroundColor White
Write-Host "8080 -> 8080 (백엔드 API)" -ForegroundColor White
Write-Host "10000 -> 10000 (MCP 서버)" -ForegroundColor White
Write-Host "5432 -> 5432 (PostgreSQL)" -ForegroundColor White

ssh -i $sshKeyPath -N -L 3000:localhost:3000 -L 8080:localhost:8080 -L 10000:localhost:10000 -L 5432:localhost:5432 $VmUser@$VmIP
"@

$portForwardScript | Out-File -FilePath "port-forward.ps1" -Encoding UTF8
Write-Host "✅ 포트 포워딩 스크립트 생성: port-forward.ps1" -ForegroundColor Green

# 8. 개발 환경 설정 완료 안내
Write-Host "`n🎉 원격 개발 환경 설정 완료!" -ForegroundColor Green
Write-Host "`n📋 사용 방법:" -ForegroundColor Yellow
Write-Host "1. VS Code에서 Ctrl+Shift+P -> 'Remote-SSH: Connect to Host'" -ForegroundColor White
Write-Host "2. 'gcp-vm-dev' 선택" -ForegroundColor White
Write-Host "3. 또는 터미널에서: ssh gcp-vm-dev" -ForegroundColor White
Write-Host "`n🔗 포트 포워딩:" -ForegroundColor Yellow
Write-Host "./port-forward.ps1 실행" -ForegroundColor White
Write-Host "`n🌐 VM 상태 확인:" -ForegroundColor Yellow
Write-Host "curl http://localhost:10000/health (포트 포워딩 후)" -ForegroundColor White
Write-Host "curl http://$VmIP`:10000/health (직접 접속)" -ForegroundColor White

Write-Host "`n✨ 설정 완료! 이제 VS Code로 원격 개발을 시작하세요!" -ForegroundColor Green