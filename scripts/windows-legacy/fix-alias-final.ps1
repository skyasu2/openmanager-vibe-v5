# 최종 별칭 충돌 해결 스크립트

Write-Host "🔧 최종 별칭 충돌 해결..." -ForegroundColor Green

# 현재 세션에서 안전한 별칭들만 설정
Write-Host "`n⚡ 안전한 별칭들 설정..." -ForegroundColor Yellow

try {
    # Start-ClaudeProject 함수가 있는지 확인
    if (Get-Command Start-ClaudeProject -ErrorAction SilentlyContinue) {
        # 충돌하지 않는 별칭들만 설정
        Set-Alias -Name claude-p -Value Start-ClaudeProject -Force -Scope Global
        Set-Alias -Name cproj -Value Start-ClaudeProject -Force -Scope Global
        Set-Alias -Name claudep -Value Start-ClaudeProject -Force -Scope Global  # clp 대신
        
        Write-Host "✅ 안전한 별칭들 설정 완료:" -ForegroundColor Green
        Write-Host "  - claude-p" -ForegroundColor Cyan
        Write-Host "  - cproj" -ForegroundColor Cyan  
        Write-Host "  - claudep" -ForegroundColor Cyan
    } else {
        Write-Host "⚠️ Start-ClaudeProject 함수를 찾을 수 없습니다" -ForegroundColor Yellow
        
        # 함수를 직접 정의
        Write-Host "📝 Start-ClaudeProject 함수 정의..." -ForegroundColor Yellow
        
        $functionDef = @'
function Start-ClaudeProject {
    param([Parameter(ValueFromRemainingArguments=$true)][string[]]$Arguments)
    
    Write-Host "🚀 Claude Code를 현재 프로젝트에서 실행합니다..." -ForegroundColor Green
    Write-Host "프로젝트 디렉토리: $(Get-Location)" -ForegroundColor Cyan
    
    # 현재 디렉토리를 HOME으로 설정
    $originalHome = $env:HOME
    $env:HOME = (Get-Location).Path
    $env:CLAUDE_CONFIG_DIR = "$env:USERPROFILE\.claude"
    
    try {
        if ($Arguments) {
            & claude @Arguments
        } else {
            & claude
        }
    } catch {
        Write-Host "❌ 실행 오류: $_" -ForegroundColor Red
        Write-Host "💡 대안: .\claude-safe.bat 사용" -ForegroundColor Yellow
    } finally {
        # 원래 HOME 복원
        $env:HOME = $originalHome
    }
}
'@
        
        Invoke-Expression $functionDef
        
        # 별칭 설정
        Set-Alias -Name claude-p -Value Start-ClaudeProject -Force -Scope Global
        Set-Alias -Name cproj -Value Start-ClaudeProject -Force -Scope Global
        Set-Alias -Name claudep -Value Start-ClaudeProject -Force -Scope Global
        
        Write-Host "✅ 함수 정의 및 별칭 설정 완료" -ForegroundColor Green
    }
    
    # 별칭 확인
    Write-Host "`n📋 설정된 별칭들:" -ForegroundColor Cyan
    Get-Alias claude-p, cproj, claudep -ErrorAction SilentlyContinue | Format-Table -AutoSize
    
} catch {
    Write-Host "❌ 별칭 설정 실패: $_" -ForegroundColor Red
}

# 프로필 파일에서 clp 별칭 제거
Write-Host "`n🔧 프로필에서 충돌하는 별칭 제거..." -ForegroundColor Yellow

$profilePath = $PROFILE
if (Test-Path $profilePath) {
    $content = Get-Content $profilePath -Raw
    if ($content -like "*Set-Alias -Name clp*") {
        $content = $content -replace "Set-Alias -Name clp -Value Start-ClaudeProject -Force.*", "Set-Alias -Name claudep -Value Start-ClaudeProject -Force  # clp 대신 claudep 사용"
        $content | Out-File -FilePath $profilePath -Encoding UTF8 -Force
        Write-Host "✅ 프로필에서 clp → claudep 변경 완료" -ForegroundColor Green
    }
}

Write-Host "`n💡 사용 가능한 별칭들:" -ForegroundColor Green
Write-Host "  claude-p /status    # 가장 명확한 이름" -ForegroundColor White
Write-Host "  cproj /status       # claude project" -ForegroundColor White
Write-Host "  claudep /status     # claude project (짧은 버전)" -ForegroundColor White

Write-Host "`n✅ 최종 별칭 충돌 해결 완료!" -ForegroundColor Green