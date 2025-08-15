# 최종 완전 정리 스크립트

Write-Host "🧹 최종 완전 정리 작업..." -ForegroundColor Green

# 1. 남은 설정 디렉토리 제거
Write-Host "`n📁 남은 설정 디렉토리 제거..." -ForegroundColor Yellow

$dirsToRemove = @(
    "$env:USERPROFILE\.gemini",
    "$env:USERPROFILE\.qwen",
    "$env:USERPROFILE\.openai"
)

foreach ($dir in $dirsToRemove) {
    if (Test-Path $dir) {
        try {
            Remove-Item $dir -Recurse -Force
            Write-Host "✅ 제거됨: $dir" -ForegroundColor Green
        } catch {
            Write-Host "⚠️ 제거 실패: $dir - $_" -ForegroundColor Yellow
        }
    }
}

# 2. 프로젝트 디렉토리 WSL 관련 파일만 남기고 정리
Write-Host "`n📂 프로젝트 디렉토리 정리..." -ForegroundColor Yellow

$filesToRemove = @(
    ".claude",
    ".claude-code-memory-fix.sh"
)

foreach ($file in $filesToRemove) {
    if (Test-Path $file) {
        try {
            Remove-Item $file -Recurse -Force
            Write-Host "✅ 제거됨: $file" -ForegroundColor Green
        } catch {
            Write-Host "⚠️ 제거 실패: $file - $_" -ForegroundColor Yellow
        }
    }
}

# WSL 관련 파일들은 유지 (필요한 파일들)
$wslFiles = @(
    "claude-wsl-optimized.bat",
    "claude-wsl.bat",
    "gemini-wsl.bat", 
    "openai-wsl.bat",
    "qwen-wsl.bat",
    "ai-cli-wsl.bat"
)

Write-Host "`n✅ WSL 관련 파일들 유지됨:" -ForegroundColor Green
foreach ($file in $wslFiles) {
    if (Test-Path $file) {
        Write-Host "  - $file" -ForegroundColor Cyan
    }
}

Write-Host "`n✅ 최종 정리 완료!" -ForegroundColor Green