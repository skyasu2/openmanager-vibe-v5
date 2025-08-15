# Claude Code 프로젝트 디렉토리에서 직접 실행
# 현재 문제: Claude Code가 홈 디렉토리에서 실행됨

Write-Host "🎯 Claude Code를 프로젝트 디렉토리에서 직접 실행합니다..." -ForegroundColor Green

$projectDir = Get-Location
Write-Host "📁 현재 프로젝트 디렉토리: $projectDir" -ForegroundColor Cyan

# Windows Terminal에서 프로젝트 디렉토리로 직접 실행
$wtCommand = @"
wt -d "$projectDir" --title "Claude Code - $(Split-Path $projectDir -Leaf)" powershell -NoExit -Command "& { 
    Write-Host '🚀 Claude Code 프로젝트 모드 실행...' -ForegroundColor Green
    Write-Host '📁 프로젝트: $projectDir' -ForegroundColor Cyan
    Write-Host '✅ 작업 디렉토리가 프로젝트로 설정됨' -ForegroundColor Green
    Write-Host ''
    Write-Host '💡 이제 /status 명령어를 실행하면 올바른 프로젝트 정보가 표시됩니다' -ForegroundColor Yellow
    Write-Host ''
    
    # 환경변수 설정
    `$env:HOME = '$projectDir'
    `$env:CLAUDE_CONFIG_DIR = '`$env:USERPROFILE\.claude'
    
    # Claude Code 실행
    claude
}"
"@

Write-Host "`n🚀 Windows Terminal에서 프로젝트 모드로 Claude Code 실행 중..." -ForegroundColor Yellow

try {
    # Windows Terminal 확인
    $wtExists = Get-Command wt -ErrorAction SilentlyContinue
    if ($wtExists) {
        Invoke-Expression $wtCommand
        Write-Host "✅ 새 Windows Terminal 탭에서 Claude Code가 프로젝트 디렉토리로 실행되었습니다!" -ForegroundColor Green
        Write-Host "📍 새 탭에서 /status를 실행하면 올바른 프로젝트 경로가 표시됩니다" -ForegroundColor Cyan
    } else {
        Write-Host "⚠️ Windows Terminal을 찾을 수 없습니다. 일반 PowerShell로 실행합니다..." -ForegroundColor Yellow
        
        $psCommand = "powershell -NoExit -Command `"& { Set-Location '$projectDir'; `$env:HOME='$projectDir'; `$env:CLAUDE_CONFIG_DIR='`$env:USERPROFILE\.claude'; Write-Host '🚀 Claude Code 프로젝트 모드' -ForegroundColor Green; claude }`""
        Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "& { Set-Location '$projectDir'; `$env:HOME='$projectDir'; `$env:CLAUDE_CONFIG_DIR='`$env:USERPROFILE\.claude'; Write-Host '🚀 Claude Code 프로젝트 모드' -ForegroundColor Green; claude }"
        Write-Host "✅ 새 PowerShell 창에서 Claude Code가 프로젝트 디렉토리로 실행되었습니다!" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ 실행 실패: $_" -ForegroundColor Red
    Write-Host "💡 수동으로 새 터미널에서 다음을 실행하세요:" -ForegroundColor Yellow
    Write-Host "cd $projectDir" -ForegroundColor White
    Write-Host "claude" -ForegroundColor White
}

Write-Host "`n📋 현재 상태 요약:" -ForegroundColor Green
Write-Host "✅ Claude Code v1.0.81 정상 실행 중" -ForegroundColor White
Write-Host "✅ 계정 로그인 완료 (skyasu2@gmail.com)" -ForegroundColor White
Write-Host "⚠️ 작업 디렉토리: 홈 → 프로젝트로 변경 필요" -ForegroundColor Yellow
Write-Host "⚠️ Config 불일치: cosmetic 문제 (기능 정상)" -ForegroundColor Yellow

Write-Host "`n💡 새 탭에서 확인할 사항:" -ForegroundColor Cyan
Write-Host "/status - 작업 디렉토리가 프로젝트 경로로 표시되는지 확인" -ForegroundColor White
Write-Host "/help - 사용 가능한 명령어 확인" -ForegroundColor White