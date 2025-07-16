# 🔐 환경변수 보안 수정 스크립트 (PowerShell)
# 작성일: 2025-07-16

Write-Host "🔐 환경변수 보안 수정 시작..." -ForegroundColor Yellow

# 1. Git 캐시에서 민감한 파일 제거
Write-Host "`n📋 Git 캐시에서 민감한 파일 제거 중..." -ForegroundColor Yellow

$filesToRemove = @(
    ".mcp.json",
    ".env.local",
    ".env",
    ".claude/mcp.json",
    "docs/environment-variables-production.md"
)

foreach ($file in $filesToRemove) {
    if (git ls-files --error-unmatch $file 2>$null) {
        Write-Host "❌ 제거: $file" -ForegroundColor Red
        git rm --cached $file 2>$null | Out-Null
    }
}

# 2. 백업 파일들의 민감한 정보 마스킹
Write-Host "`n📋 백업 파일 보안 처리 중..." -ForegroundColor Yellow

$backupFile = "docs/backup/mcp-2025-07-16/claude-mcp.json.backup"
if (Test-Path $backupFile) {
    $content = Get-Content $backupFile -Raw
    $content = $content -replace '"GITHUB_TOKEN": "ghp_[^"]*"', '"GITHUB_TOKEN": "[REDACTED]"'
    Set-Content $backupFile $content
}

# 3. 환경변수 체크
Write-Host "`n📋 환경변수 설정 확인..." -ForegroundColor Yellow

$requiredVars = @(
    "GITHUB_TOKEN",
    "TAVILY_API_KEY",
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY"
)

$missingVars = @()
foreach ($var in $requiredVars) {
    if (-not [Environment]::GetEnvironmentVariable($var)) {
        $missingVars += $var
    }
}

if ($missingVars.Count -eq 0) {
    Write-Host "✅ 모든 필수 환경변수가 설정되어 있습니다." -ForegroundColor Green
} else {
    Write-Host "❌ 다음 환경변수가 설정되지 않았습니다:" -ForegroundColor Red
    $missingVars | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
    Write-Host "💡 .env.local 파일을 확인하거나 시스템 환경변수를 설정하세요." -ForegroundColor Yellow
}

# 4. .gitignore 확인
Write-Host "`n📋 .gitignore 파일 확인..." -ForegroundColor Yellow

$gitignorePatterns = @(
    ".env*",
    ".mcp.json",
    ".claude/mcp.json",
    "*.token",
    "*.pat"
)

$gitignoreContent = Get-Content .gitignore -Raw
foreach ($pattern in $gitignorePatterns) {
    if (-not ($gitignoreContent -match [regex]::Escape($pattern))) {
        Write-Host "⚠️  .gitignore에 '$pattern' 패턴이 없습니다." -ForegroundColor Red
    }
}

# 5. 보안 경고 표시
Write-Host "`n⚠️  중요 보안 경고 ⚠️" -ForegroundColor Red -BackgroundColor Yellow
Write-Host "다음 작업을 즉시 수행하세요:" -ForegroundColor Yellow
Write-Host "1. GitHub Personal Access Token 재생성"
Write-Host "   - https://github.com/settings/tokens"
Write-Host "2. Tavily API Key 재생성 (필요시)"
Write-Host "   - Tavily 대시보드에서 재생성"
Write-Host "3. 새 토큰으로 .env.local 업데이트"
Write-Host "4. Claude Code 재시작"

Write-Host "`n✅ 보안 수정 스크립트 완료" -ForegroundColor Green
Write-Host "📚 자세한 내용은 docs/SECURITY-ALERT-2025-07-16.md 참조" -ForegroundColor Yellow

# Claude Code 재시작 제안
Write-Host "`n💡 Claude Code를 환경변수와 함께 재시작하려면:" -ForegroundColor Cyan
Write-Host '   $env:GITHUB_TOKEN="your_new_token"; claude' -ForegroundColor White