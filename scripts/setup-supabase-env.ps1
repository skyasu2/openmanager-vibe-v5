# Supabase MCP 환경변수 설정 스크립트
# 실행 방법: PowerShell 관리자 권한으로 실행
# .\scripts\setup-supabase-env.ps1

Write-Host "==================================" -ForegroundColor Cyan
Write-Host " Supabase MCP 환경변수 설정" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan

# .env.local 파일에서 토큰 읽기
$envFile = "D:\cursor\openmanager-vibe-v5\.env.local"

if (Test-Path $envFile) {
    Write-Host "📄 .env.local 파일 읽는 중..." -ForegroundColor Yellow
    
    # SUPABASE_PAT 또는 SUPABASE_PERSONAL_ACCESS_TOKEN 찾기
    $content = Get-Content $envFile
    $patLine = $content | Where-Object { $_ -match "^SUPABASE_PAT=" -or $_ -match "^SUPABASE_PERSONAL_ACCESS_TOKEN=" }
    
    if ($patLine) {
        $token = ($patLine -split "=", 2)[1].Trim()
        
        Write-Host "✅ Personal Access Token 발견" -ForegroundColor Green
        Write-Host "토큰 시작: $($token.Substring(0, 10))..." -ForegroundColor Gray
        
        # 사용자 환경변수 설정 (시스템 재시작 불필요)
        Write-Host "🔧 사용자 환경변수 설정 중..." -ForegroundColor Yellow
        [System.Environment]::SetEnvironmentVariable("SUPABASE_ACCESS_TOKEN", $token, "User")
        
        # 현재 세션에도 설정
        $env:SUPABASE_ACCESS_TOKEN = $token
        
        Write-Host "✅ 환경변수 설정 완료!" -ForegroundColor Green
        Write-Host ""
        Write-Host "다음 단계:" -ForegroundColor Cyan
        Write-Host "1. Claude Code를 재시작하세요" -ForegroundColor White
        Write-Host "2. 'claude api restart' 명령 실행" -ForegroundColor White
        Write-Host "3. 'claude mcp list'로 연결 확인" -ForegroundColor White
        
    } else {
        Write-Host "❌ .env.local에서 SUPABASE_PAT를 찾을 수 없습니다" -ForegroundColor Red
        Write-Host "수동으로 설정하려면:" -ForegroundColor Yellow
        Write-Host '[System.Environment]::SetEnvironmentVariable("SUPABASE_ACCESS_TOKEN", "sbp_YOUR_TOKEN_HERE", "User")' -ForegroundColor Gray
    }
} else {
    Write-Host "❌ .env.local 파일을 찾을 수 없습니다" -ForegroundColor Red
    Write-Host "경로: $envFile" -ForegroundColor Gray
}

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host " 설정 완료" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan