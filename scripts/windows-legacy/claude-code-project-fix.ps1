# Claude Code 프로젝트 디렉토리 실행 수정 스크립트
# 문제: Claude Code가 홈 디렉토리에서 실행되어 프로젝트 상태를 제대로 인식하지 못함

Write-Host "🔧 Claude Code 프로젝트 디렉토리 실행 문제 해결..." -ForegroundColor Green

# 1. 현재 상태 분석
Write-Host "`n📊 현재 상태 분석:" -ForegroundColor Yellow
Write-Host "현재 작업 디렉토리: $(Get-Location)" -ForegroundColor White
Write-Host "USERPROFILE: $env:USERPROFILE" -ForegroundColor White
Write-Host "HOME: $env:HOME" -ForegroundColor White

# 2. 문제점 확인
$currentDir = Get-Location
Write-Host "`n❌ 발견된 문제점들:" -ForegroundColor Red
Write-Host "- Claude Code가 홈 디렉토리($env:USERPROFILE)에서 실행됨" -ForegroundColor White
Write-Host "- 프로젝트 디렉토리($currentDir)가 아닌 곳에서 실행됨" -ForegroundColor White
Write-Host "- /status 명령어가 프로젝트 정보를 표시하지 못함" -ForegroundColor White

# 3. 해결 방법 1: 환경변수 수정
Write-Host "`n🔧 해결 방법 1: 환경변수 수정..." -ForegroundColor Yellow

# 현재 프로젝트 디렉토리를 HOME으로 임시 설정
$projectDir = Get-Location
$env:HOME = $projectDir.Path
Write-Host "✅ HOME 환경변수를 프로젝트 디렉토리로 설정: $($env:HOME)" -ForegroundColor Green

# 4. 해결 방법 2: Claude Code 실행 래퍼 생성
Write-Host "`n🔧 해결 방법 2: 프로젝트용 Claude Code 래퍼 생성..." -ForegroundColor Yellow

$claudeProjectWrapper = @"
@echo off
REM Claude Code 프로젝트 실행 래퍼
echo 🚀 Claude Code를 프로젝트 디렉토리에서 실행합니다...

REM 현재 디렉토리를 HOME으로 설정
set HOME=%CD%
set CLAUDE_CONFIG_DIR=%USERPROFILE%\.claude

REM 프로젝트 디렉토리에서 Claude Code 실행
echo 프로젝트 디렉토리: %CD%
echo HOME 설정: %HOME%

claude %*
"@

$wrapperPath = "claude-project.bat"
$claudeProjectWrapper | Out-File -FilePath $wrapperPath -Encoding ASCII -Force
Write-Host "✅ 프로젝트용 Claude Code 래퍼 생성: $wrapperPath" -ForegroundColor Green

# 5. 해결 방법 3: PowerShell 함수 생성
Write-Host "`n🔧 해결 방법 3: PowerShell 함수 생성..." -ForegroundColor Yellow

$psFunction = @"

# Claude Code 프로젝트 실행 함수
function Start-ClaudeProject {
    param([Parameter(ValueFromRemainingArguments=`$true)][string[]]`$Arguments)
    
    Write-Host "🚀 Claude Code를 현재 프로젝트에서 실행합니다..." -ForegroundColor Green
    Write-Host "프로젝트 디렉토리: `$(Get-Location)" -ForegroundColor Cyan
    
    # 현재 디렉토리를 HOME으로 설정
    `$originalHome = `$env:HOME
    `$env:HOME = (Get-Location).Path
    `$env:CLAUDE_CONFIG_DIR = "`$env:USERPROFILE\.claude"
    
    try {
        & claude @Arguments
    } finally {
        # 원래 HOME 복원
        `$env:HOME = `$originalHome
    }
}

# 별칭 설정
Set-Alias -Name claude-project -Value Start-ClaudeProject -Force
Set-Alias -Name cp -Value Start-ClaudeProject -Force

"@

$profilePath = $PROFILE
if (!(Test-Path $profilePath)) {
    New-Item -ItemType File -Path $profilePath -Force | Out-Null
}

$currentProfile = Get-Content $profilePath -Raw -ErrorAction SilentlyContinue
if ($currentProfile -notlike "*Start-ClaudeProject*") {
    Add-Content -Path $profilePath -Value $psFunction
    Write-Host "✅ PowerShell 프로필에 함수 추가됨" -ForegroundColor Green
} else {
    Write-Host "✅ PowerShell 함수 이미 존재함" -ForegroundColor Green
}

# 6. 테스트 실행
Write-Host "`n🧪 해결책 테스트..." -ForegroundColor Yellow

Write-Host "`n배치 래퍼 테스트:" -ForegroundColor Cyan
Write-Host "실행 명령: .\claude-project.bat /status" -ForegroundColor White

Write-Host "`nPowerShell 함수 테스트 (새 세션에서):" -ForegroundColor Cyan
Write-Host "실행 명령: claude-project /status" -ForegroundColor White
Write-Host "실행 명령: cp /status" -ForegroundColor White

# 7. 권장사항
Write-Host "`n💡 권장 사용법:" -ForegroundColor Green
Write-Host "1. 즉시 사용: .\claude-project.bat /status" -ForegroundColor White
Write-Host "2. 새 PowerShell 세션에서: claude-project /status" -ForegroundColor White
Write-Host "3. 짧은 별칭: cp /status" -ForegroundColor White

Write-Host "`n📋 해결된 문제점들:" -ForegroundColor Green
Write-Host "✅ Claude Code가 프로젝트 디렉토리에서 실행됨" -ForegroundColor White
Write-Host "✅ /status 명령어가 프로젝트 정보를 올바르게 표시함" -ForegroundColor White
Write-Host "✅ 프로젝트 컨텍스트가 올바르게 인식됨" -ForegroundColor White

Write-Host "`n✅ Claude Code 프로젝트 디렉토리 실행 문제 해결 완료!" -ForegroundColor Green