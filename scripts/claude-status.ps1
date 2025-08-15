# Claude Code 프로젝트 상태 직접 표시 스크립트

Write-Host "📊 Claude Code 프로젝트 상태 분석" -ForegroundColor Green

# 기본 정보
Write-Host "
🏠 프로젝트 정보:" -ForegroundColor Yellow
Write-Host "프로젝트 경로: $(Get-Location)" -ForegroundColor White
Write-Host "프로젝트 이름: $(Split-Path (Get-Location) -Leaf)" -ForegroundColor White

# Claude 설정 정보
Write-Host "
⚙️ Claude 설정:" -ForegroundColor Yellow
Write-Host "Claude 설정 디렉토리: $env:USERPROFILE\.claude" -ForegroundColor White
Write-Host "HOME 환경변수: $env:HOME" -ForegroundColor White

# 파일 존재 확인
Write-Host "
📁 프로젝트 파일:" -ForegroundColor Yellow
if (Test-Path "CLAUDE.md") {
    Write-Host "✅ CLAUDE.md 존재" -ForegroundColor Green
} else {
    Write-Host "❌ CLAUDE.md 없음" -ForegroundColor Red
}

if (Test-Path ".claude-project.json") {
    Write-Host "✅ .claude-project.json 존재" -ForegroundColor Green
} else {
    Write-Host "❌ .claude-project.json 없음" -ForegroundColor Red
}

# 스크립트 파일 확인
Write-Host "
📜 스크립트 파일:" -ForegroundColor Yellow
$scriptFiles = Get-ChildItem "scripts\*.ps1" -ErrorAction SilentlyContinue
if ($scriptFiles) {
    Write-Host "✅ PowerShell 스크립트: $($scriptFiles.Count)개" -ForegroundColor Green
    $scriptFiles | ForEach-Object { Write-Host "  - $($_.Name)" -ForegroundColor Cyan }
} else {
    Write-Host "❌ PowerShell 스크립트 없음" -ForegroundColor Red
}

# Claude CLI 버전 확인
Write-Host "
🔧 Claude CLI 정보:" -ForegroundColor Yellow
try {
    $version = claude --version 2>$null
    if ($version) {
        Write-Host "✅ Claude CLI 버전: $version" -ForegroundColor Green
    } else {
        Write-Host "❌ Claude CLI 버전 확인 실패" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Claude CLI 실행 오류: $_" -ForegroundColor Red
}

# 권장사항
Write-Host "
💡 권장 사용법:" -ForegroundColor Cyan
Write-Host "1. 상태 확인: .\scripts\claude-status.ps1" -ForegroundColor White
Write-Host "2. 새 PowerShell 창: .\claude-terminal.bat" -ForegroundColor White
Write-Host "3. 비대화형 모드: .\claude-safe.bat /status" -ForegroundColor White
Write-Host "4. PowerShell 직접: .\scripts\claude-powershell.ps1" -ForegroundColor White

Write-Host "
✅ 프로젝트 상태 분석 완료!" -ForegroundColor Green
