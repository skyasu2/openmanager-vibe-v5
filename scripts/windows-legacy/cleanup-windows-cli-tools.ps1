# Windows CLI 도구 완전 정리 스크립트
# Claude Code, Gemini CLI, Qwen CLI 및 관련 설정 모두 제거

Write-Host "🧹 Windows CLI 도구 완전 정리 시작..." -ForegroundColor Green

# 1. 현재 설치된 글로벌 npm 패키지 확인
Write-Host "`n📦 현재 설치된 글로벌 npm 패키지 확인..." -ForegroundColor Yellow

try {
    $globalPackages = npm list -g --depth=0 2>$null
    Write-Host "현재 글로벌 패키지:" -ForegroundColor Cyan
    Write-Host $globalPackages -ForegroundColor White
} catch {
    Write-Host "⚠️ npm 패키지 목록 확인 실패" -ForegroundColor Yellow
}

# 2. Claude Code 제거
Write-Host "`n🗑️ Claude Code 제거..." -ForegroundColor Yellow

try {
    npm uninstall -g @anthropic-ai/claude-code 2>$null
    Write-Host "✅ Claude Code 제거 완료" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Claude Code 제거 실패 또는 이미 제거됨" -ForegroundColor Yellow
}

# 3. Gemini CLI 제거
Write-Host "`n🗑️ Gemini CLI 제거..." -ForegroundColor Yellow

$geminiPackages = @(
    "@google-ai/generativelanguage",
    "gemini-cli",
    "@google/generative-ai",
    "google-generative-ai"
)

foreach ($package in $geminiPackages) {
    try {
        npm uninstall -g $package 2>$null
        Write-Host "✅ $package 제거 완료" -ForegroundColor Green
    } catch {
        Write-Host "⚠️ $package 제거 실패 또는 이미 제거됨" -ForegroundColor Yellow
    }
}

# 4. Qwen CLI 제거
Write-Host "`n🗑️ Qwen CLI 제거..." -ForegroundColor Yellow

$qwenPackages = @(
    "qwen-cli",
    "@qwen/cli",
    "qwen"
)

foreach ($package in $qwenPackages) {
    try {
        npm uninstall -g $package 2>$null
        Write-Host "✅ $package 제거 완료" -ForegroundColor Green
    } catch {
        Write-Host "⚠️ $package 제거 실패 또는 이미 제거됨" -ForegroundColor Yellow
    }
}

# 5. 기타 AI CLI 도구들 제거
Write-Host "`n🗑️ 기타 AI CLI 도구들 제거..." -ForegroundColor Yellow

$otherAIPackages = @(
    "openai-cli",
    "anthropic-cli",
    "ai-cli",
    "chatgpt-cli"
)

foreach ($package in $otherAIPackages) {
    try {
        npm uninstall -g $package 2>$null
        Write-Host "✅ $package 제거 시도 완료" -ForegroundColor Green
    } catch {
        Write-Host "⚠️ $package 제거 실패 또는 이미 제거됨" -ForegroundColor Yellow
    }
}

# 6. npm 캐시 정리
Write-Host "`n🧹 npm 캐시 정리..." -ForegroundColor Yellow

try {
    npm cache clean --force 2>$null
    Write-Host "✅ npm 캐시 정리 완료" -ForegroundColor Green
} catch {
    Write-Host "⚠️ npm 캐시 정리 실패" -ForegroundColor Yellow
}

# 7. Claude 설정 디렉토리 백업 및 정리
Write-Host "`n📁 Claude 설정 디렉토리 정리..." -ForegroundColor Yellow

$claudeConfigDir = "$env:USERPROFILE\.claude"
if (Test-Path $claudeConfigDir) {
    $backupDir = "$env:USERPROFILE\.claude-backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    try {
        Copy-Item $claudeConfigDir -Destination $backupDir -Recurse -Force
        Write-Host "✅ Claude 설정 백업: $backupDir" -ForegroundColor Green
        
        Remove-Item $claudeConfigDir -Recurse -Force
        Write-Host "✅ Claude 설정 디렉토리 제거 완료" -ForegroundColor Green
    } catch {
        Write-Host "⚠️ Claude 설정 디렉토리 정리 실패: $_" -ForegroundColor Yellow
    }
} else {
    Write-Host "ℹ️ Claude 설정 디렉토리가 존재하지 않음" -ForegroundColor Cyan
}

# 8. PowerShell 프로필에서 관련 설정 제거
Write-Host "`n📝 PowerShell 프로필 정리..." -ForegroundColor Yellow

$profilePath = $PROFILE
if (Test-Path $profilePath) {
    $profileBackup = "$profilePath.backup-cleanup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    Copy-Item $profilePath $profileBackup -Force
    Write-Host "✅ PowerShell 프로필 백업: $profileBackup" -ForegroundColor Green
    
    $content = Get-Content $profilePath -Raw
    
    # Claude 관련 설정 제거
    $content = $content -replace "(?s)# Claude.*?(?=\n\n|\n#|\z)", ""
    $content = $content -replace ".*Claude.*\n", ""
    $content = $content -replace ".*claude.*\n", ""
    $content = $content -replace ".*Start-ClaudeProject.*\n", ""
    $content = $content -replace ".*Set-Alias.*claude.*\n", ""
    
    # Gemini 관련 설정 제거
    $content = $content -replace ".*gemini.*\n", ""
    $content = $content -replace ".*Gemini.*\n", ""
    
    # Qwen 관련 설정 제거
    $content = $content -replace ".*qwen.*\n", ""
    $content = $content -replace ".*Qwen.*\n", ""
    
    # 빈 줄 정리
    $content = $content -replace "\n\n\n+", "`n`n"
    
    $content | Out-File -FilePath $profilePath -Encoding UTF8 -Force
    Write-Host "✅ PowerShell 프로필 정리 완료" -ForegroundColor Green
} else {
    Write-Host "ℹ️ PowerShell 프로필이 존재하지 않음" -ForegroundColor Cyan
}

# 9. 환경변수 정리
Write-Host "`n⚙️ 환경변수 정리..." -ForegroundColor Yellow

$envVarsToRemove = @(
    "CLAUDE_CONFIG_DIR",
    "CLAUDE_API_KEY",
    "GEMINI_API_KEY",
    "QWEN_API_KEY",
    "CLAUDE_AUTO_TRUST",
    "CLAUDE_SKIP_TRUST_DIALOG"
)

foreach ($envVar in $envVarsToRemove) {
    try {
        [Environment]::SetEnvironmentVariable($envVar, $null, "User")
        [Environment]::SetEnvironmentVariable($envVar, $null, "Machine")
        Write-Host "✅ 환경변수 제거: $envVar" -ForegroundColor Green
    } catch {
        Write-Host "⚠️ 환경변수 제거 실패: $envVar" -ForegroundColor Yellow
    }
}

# 10. 프로젝트 디렉토리 정리
Write-Host "`n📁 프로젝트 디렉토리 정리..." -ForegroundColor Yellow

$filesToRemove = @(
    "claude-*.bat",
    "start-claude.bat",
    ".claude-project.json",
    "setup-claude-wsl.sh"
)

foreach ($pattern in $filesToRemove) {
    $files = Get-ChildItem -Path . -Name $pattern -ErrorAction SilentlyContinue
    foreach ($file in $files) {
        try {
            Remove-Item $file -Force
            Write-Host "✅ 파일 제거: $file" -ForegroundColor Green
        } catch {
            Write-Host "⚠️ 파일 제거 실패: $file" -ForegroundColor Yellow
        }
    }
}

# 11. 최종 확인
Write-Host "`n🔍 정리 결과 확인..." -ForegroundColor Yellow

try {
    $remainingPackages = npm list -g --depth=0 2>$null
    Write-Host "남은 글로벌 패키지:" -ForegroundColor Cyan
    Write-Host $remainingPackages -ForegroundColor White
} catch {
    Write-Host "⚠️ 패키지 목록 확인 실패" -ForegroundColor Yellow
}

Write-Host "`n📋 정리 완료 요약:" -ForegroundColor Green
Write-Host "✅ Claude Code 제거됨" -ForegroundColor White
Write-Host "✅ Gemini CLI 제거됨" -ForegroundColor White
Write-Host "✅ Qwen CLI 제거됨" -ForegroundColor White
Write-Host "✅ npm 캐시 정리됨" -ForegroundColor White
Write-Host "✅ 설정 파일들 백업 후 제거됨" -ForegroundColor White
Write-Host "✅ PowerShell 프로필 정리됨" -ForegroundColor White
Write-Host "✅ 환경변수 정리됨" -ForegroundColor White

Write-Host "`n🎯 다음 단계: WSL 설정 최적화" -ForegroundColor Yellow
Write-Host "✅ Windows CLI 도구 정리 완료!" -ForegroundColor Green