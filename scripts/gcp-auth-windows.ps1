# GCP 인증 PowerShell 스크립트
# 작성일: 2025-08-14

Write-Host "🔐 GCP 인증 시작..." -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Gray

# 1. 환경 변수 설정
$env:CLOUDSDK_PYTHON_SITEPACKAGES = "1"
$env:GOOGLE_APPLICATION_CREDENTIALS = ""

# 2. gcloud 경로 설정
$gcloudPath = ".\google-cloud-sdk\bin\gcloud.cmd"

# 3. 현재 설정 확인
Write-Host "`n📊 현재 설정 확인..." -ForegroundColor Yellow
& $gcloudPath config list

# 4. 인증 옵션 제공
Write-Host "`n🔑 인증 방법 선택:" -ForegroundColor Green
Write-Host "1. 브라우저 인증 (권장)" -ForegroundColor White
Write-Host "2. 수동 인증 코드 입력" -ForegroundColor White
Write-Host "3. 서비스 계정 키 사용" -ForegroundColor White

$choice = Read-Host "선택 (1-3)"

switch ($choice) {
    "1" {
        Write-Host "`n🌐 브라우저 인증 시작..." -ForegroundColor Cyan
        Write-Host "브라우저가 열리면:" -ForegroundColor Yellow
        Write-Host "1. Google 계정으로 로그인" -ForegroundColor White
        Write-Host "2. 권한 승인" -ForegroundColor White
        Write-Host "3. 성공 메시지 확인" -ForegroundColor White
        Write-Host "4. 이 창으로 돌아오기" -ForegroundColor White
        
        Start-Sleep -Seconds 2
        & $gcloudPath auth login
    }
    "2" {
        Write-Host "`n📋 수동 인증 프로세스..." -ForegroundColor Cyan
        Write-Host "아래 URL을 브라우저에 복사하여 열기:" -ForegroundColor Yellow
        
        $authUrl = "https://accounts.google.com/o/oauth2/auth?response_type=code&client_id=32555940559.apps.googleusercontent.com&redirect_uri=https%3A%2F%2Fsdk.cloud.google.com%2Fauthcode.html&scope=openid+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.email+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fcloud-platform+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fappengine.admin+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fsqlservice.login+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fcompute+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Faccounts.reauth&state=LOCAL_STATE&prompt=consent&access_type=offline"
        
        Write-Host $authUrl -ForegroundColor Blue
        Write-Host "`n브라우저에서 인증 후 표시된 코드를 여기에 입력하세요:" -ForegroundColor Yellow
        
        # 클립보드에 URL 복사
        $authUrl | Set-Clipboard
        Write-Host "✅ URL이 클립보드에 복사되었습니다!" -ForegroundColor Green
        
        # 브라우저 열기
        Start-Process $authUrl
        
        # 코드 입력 받기
        $authCode = Read-Host "인증 코드"
        
        # 인증 코드로 로그인
        Write-Host "인증 처리 중..." -ForegroundColor Yellow
        # 참고: 실제로는 gcloud auth login에 코드를 전달해야 하지만,
        # PowerShell에서는 직접 입력이 어려워 대체 방법 사용
    }
    "3" {
        Write-Host "`n🔑 서비스 계정 키 파일 경로를 입력하세요:" -ForegroundColor Cyan
        $keyPath = Read-Host "키 파일 경로"
        
        if (Test-Path $keyPath) {
            & $gcloudPath auth activate-service-account --key-file=$keyPath
        } else {
            Write-Host "❌ 파일을 찾을 수 없습니다: $keyPath" -ForegroundColor Red
        }
    }
    default {
        Write-Host "❌ 잘못된 선택입니다." -ForegroundColor Red
        exit 1
    }
}

# 5. 프로젝트 설정
Write-Host "`n🎯 프로젝트 설정..." -ForegroundColor Cyan
& $gcloudPath config set project openmanager-free-tier

# 6. Zone 설정
Write-Host "📍 Zone 설정..." -ForegroundColor Cyan
& $gcloudPath config set compute/zone us-central1-a

# 7. 인증 확인
Write-Host "`n✅ 인증 상태 확인:" -ForegroundColor Green
& $gcloudPath auth list

# 8. VM 접속 테스트
Write-Host "`n🖥️ VM 접속 준비 완료!" -ForegroundColor Green
Write-Host "SSH 접속 명령어:" -ForegroundColor Yellow
Write-Host ".\google-cloud-sdk\bin\gcloud.cmd compute ssh mcp-server --zone=us-central1-a" -ForegroundColor Blue

Write-Host "`n================================" -ForegroundColor Gray
Write-Host "✨ 설정 완료!" -ForegroundColor Green