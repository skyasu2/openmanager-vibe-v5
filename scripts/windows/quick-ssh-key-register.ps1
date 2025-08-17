# 🚀 빠른 SSH 키 등록 스크립트

Write-Host "🔑 SSH 키 등록을 위한 정보를 준비합니다..." -ForegroundColor Green

# SSH 공개 키 읽기
$pubKeyPath = "$env:USERPROFILE\.ssh\google_compute_engine.pub"
$pubKey = Get-Content $pubKeyPath -Raw

Write-Host "`n📋 다음 정보를 복사하여 Google Cloud Console에서 사용하세요:" -ForegroundColor Yellow
Write-Host "=" * 80 -ForegroundColor Cyan

Write-Host "`n🌐 Google Cloud Console URL:" -ForegroundColor Yellow
Write-Host "https://console.cloud.google.com/compute/instances/details/us-central1-a/mcp-server?project=openmanager-free-tier" -ForegroundColor White

Write-Host "`n🔑 SSH 공개 키 (전체 복사 필요):" -ForegroundColor Yellow
Write-Host $pubKey -ForegroundColor White

Write-Host "`n📝 등록 단계:" -ForegroundColor Yellow
Write-Host "1. 위 URL을 브라우저에서 열기" -ForegroundColor White
Write-Host "2. '편집' 버튼 클릭" -ForegroundColor White
Write-Host "3. '보안' 섹션의 'SSH 키' 찾기" -ForegroundColor White
Write-Host "4. '항목 추가' 클릭" -ForegroundColor White
Write-Host "5. 위의 SSH 공개 키 전체를 붙여넣기" -ForegroundColor White
Write-Host "6. '저장' 클릭" -ForegroundColor White
Write-Host "7. VM 재시작 대기 (1-2분)" -ForegroundColor White

Write-Host "`n🧪 등록 후 테스트:" -ForegroundColor Yellow
Write-Host "ssh gcp-vm-dev" -ForegroundColor White

Write-Host "`n" + "=" * 80 -ForegroundColor Cyan
Write-Host "💡 팁: Ctrl+C로 공개 키를 복사하고 브라우저에서 붙여넣으세요!" -ForegroundColor Green

# 클립보드에 공개 키 복사 시도
try {
    $pubKey | Set-Clipboard
    Write-Host "✅ SSH 공개 키가 클립보드에 복사되었습니다!" -ForegroundColor Green
} catch {
    Write-Host "⚠️ 클립보드 복사 실패. 수동으로 복사하세요." -ForegroundColor Yellow
}

# 브라우저에서 URL 열기 시도
try {
    Start-Process "https://console.cloud.google.com/compute/instances/details/us-central1-a/mcp-server?project=openmanager-free-tier"
    Write-Host "🌐 브라우저에서 Google Cloud Console을 열었습니다!" -ForegroundColor Green
} catch {
    Write-Host "⚠️ 브라우저 열기 실패. 수동으로 URL을 열어주세요." -ForegroundColor Yellow
}