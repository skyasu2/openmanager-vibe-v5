# PowerShell GCP 인증 즉시 실행
Write-Host "🔐 GCP 인증 시작..." -ForegroundColor Green

# Git Bash가 있으면 사용
if (Get-Command git-bash -ErrorAction SilentlyContinue) {
    Write-Host "Git Bash에서 실행 중..." -ForegroundColor Yellow
    Start-Process git-bash -ArgumentList "-c", "./google-cloud-sdk/bin/gcloud auth login" -Wait
} 
# CMD 사용
else {
    Write-Host "CMD에서 실행 중..." -ForegroundColor Yellow
    Start-Process cmd -ArgumentList "/k", "cd /d D:\cursor\openmanager-vibe-v5 && google-cloud-sdk\bin\gcloud auth login"
}

Write-Host "`n✅ 브라우저에서 인증을 완료하세요!" -ForegroundColor Cyan
Write-Host "1. Google 계정 로그인" -ForegroundColor White
Write-Host "2. Allow 클릭" -ForegroundColor White
Write-Host "3. 성공 메시지 확인" -ForegroundColor White