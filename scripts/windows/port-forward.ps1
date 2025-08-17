# 🚀 GCP VM 포트 포워딩 스크립트
# 사용법: ./port-forward.ps1

Write-Host "🔗 GCP VM 포트 포워딩 시작..." -ForegroundColor Green
Write-Host "로컬 포트 -> VM 포트" -ForegroundColor Cyan
Write-Host "3000 -> 3000 (Next.js 개발 서버)" -ForegroundColor White
Write-Host "8080 -> 8080 (백엔드 API)" -ForegroundColor White
Write-Host "10000 -> 10000 (MCP 서버)" -ForegroundColor White
Write-Host "5432 -> 5432 (PostgreSQL)" -ForegroundColor White

ssh -i C:\Users\skyas\.ssh\google_compute_engine -N -L 3000:localhost:3000 -L 8080:localhost:8080 -L 10000:localhost:10000 -L 5432:localhost:5432 skyasu2@104.154.205.25
