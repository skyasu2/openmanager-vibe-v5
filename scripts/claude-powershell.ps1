# Claude Code PowerShell 직접 실행 래퍼
param([Parameter(ValueFromRemainingArguments=$true)][string[]]$Arguments)

Write-Host "🚀 Claude Code를 PowerShell에서 직접 실행합니다..." -ForegroundColor Green

# 환경변수 설정
$env:HOME = (Get-Location).Path
$env:CLAUDE_CONFIG_DIR = "$env:USERPROFILE\.claude"
$env:FORCE_COLOR = "1"

# 프로젝트 정보 표시
Write-Host "📁 프로젝트: $(Get-Location)" -ForegroundColor Cyan
Write-Host "✅ Raw mode 문제 회피 모드로 실행" -ForegroundColor Green

# Claude Code 직접 실행 (stdin 문제 회피)
try {
    if ($Arguments) {
        & claude @Arguments
    } else {
        & claude
    }
} catch {
    Write-Host "❌ 실행 오류: $_" -ForegroundColor Red
    Write-Host "💡 대안: Windows Terminal 또는 새 PowerShell 창에서 직접 실행해보세요" -ForegroundColor Yellow
}
