# GCP VM Management API 배포 가이드 (Windows PowerShell)
# Cloud Shell을 통해 배포

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   VM Management API v2.0 배포 가이드   " -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# API 토큰 정보
$API_TOKEN = "f3b06ab39909bb0bdd61f15ae0d5d1deb03b9c5d6a6dc00daba684ec49035c00"

Write-Host "📋 단계별 배포 가이드:" -ForegroundColor Green
Write-Host ""
Write-Host "1️⃣ Cloud Shell 열기:" -ForegroundColor Yellow
Write-Host "   https://shell.cloud.google.com/?project=openmanager-free-tier" -ForegroundColor Cyan
Write-Host ""

Write-Host "2️⃣ VM에 SSH 접속:" -ForegroundColor Yellow
Write-Host "   gcloud compute ssh mcp-server --zone=us-central1-a" -ForegroundColor Gray
Write-Host ""

Write-Host "3️⃣ 다음 명령어를 Cloud Shell에서 실행:" -ForegroundColor Yellow
Write-Host ""

# 배포 스크립트 생성
$deployScript = @'
# 백업 생성
cp /tmp/simple.js /tmp/simple.js.backup-$(date +%Y%m%d-%H%M%S)

# Management API 다운로드 (GitHub Gist나 직접 붙여넣기)
cat > /tmp/management-api.js << 'EOF'
[여기에 vm-management-api.js 내용 붙여넣기]
EOF

# 환경변수 설정
export API_TOKEN="f3b06ab39909bb0bdd61f15ae0d5d1deb03b9c5d6a6dc00daba684ec49035c00"

# PM2로 교체
pm2 stop simple
pm2 delete simple
pm2 start /tmp/management-api.js --name management-api
pm2 save

# 상태 확인
pm2 status
curl http://localhost:10000/health
'@

Write-Host $deployScript -ForegroundColor Gray
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "4️⃣ 로컬에서 테스트:" -ForegroundColor Yellow
Write-Host ""

# 테스트 명령어 표시
Write-Host "# .env.local 파일 확인" -ForegroundColor Gray
Write-Host "type .env.local | findstr VM_API" -ForegroundColor White
Write-Host ""

Write-Host "# 헬스체크" -ForegroundColor Gray
Write-Host "npm run vm:health" -ForegroundColor White
Write-Host ""

Write-Host "# VM 상태 확인" -ForegroundColor Gray
Write-Host "npm run vm:status" -ForegroundColor White
Write-Host ""

Write-Host "# PM2 프로세스 확인" -ForegroundColor Gray
Write-Host "npm run vm:pm2" -ForegroundColor White
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "📝 중요 정보:" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "API 엔드포인트: http://104.154.205.25:10000" -ForegroundColor White
Write-Host "API 토큰: $API_TOKEN" -ForegroundColor White
Write-Host ""
Write-Host "이 토큰은 .env.local에 이미 저장되어 있습니다." -ForegroundColor Green
Write-Host ""

# 실제 테스트 실행 옵션
$runTest = Read-Host "지금 로컬 테스트를 실행하시겠습니까? (y/n)"
if ($runTest -eq "y") {
    Write-Host ""
    Write-Host "🧪 로컬 테스트 실행 중..." -ForegroundColor Yellow
    
    # 환경변수 로드
    Get-Content .env.local | Where-Object { $_ -match "^VM_" } | ForEach-Object {
        $name, $value = $_.Split('=')
        [Environment]::SetEnvironmentVariable($name, $value, "Process")
    }
    
    # 헬스체크 실행
    Write-Host ""
    Write-Host "헬스체크:" -ForegroundColor Cyan
    node scripts/vm-api-client.js health
    
    Write-Host ""
    Write-Host "테스트 완료!" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   배포 가이드 완료!                    " -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan