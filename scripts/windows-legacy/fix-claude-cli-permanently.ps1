# Claude CLI 영구 수정 스크립트
# 문제: Claude CLI가 Windows 환경변수 해석에 실패하는 문제 영구 해결

Write-Host "🔧 Claude CLI 영구 수정 시작..." -ForegroundColor Green

# 1. 현재 상태 진단
Write-Host "`n📊 현재 상태 진단..." -ForegroundColor Yellow
Write-Host "USERPROFILE: $env:USERPROFILE" -ForegroundColor White
Write-Host "HOME: $env:HOME" -ForegroundColor White
Write-Host "CLAUDE_CONFIG_DIR: $env:CLAUDE_CONFIG_DIR" -ForegroundColor White

# 2. Claude CLI 위치 확인
$claudePath = Get-Command claude -ErrorAction SilentlyContinue
if ($claudePath) {
    Write-Host "Claude CLI 위치: $($claudePath.Source)" -ForegroundColor Cyan
} else {
    Write-Host "❌ Claude CLI를 찾을 수 없습니다" -ForegroundColor Red
    exit 1
}

# 3. 환경변수 영구 설정
Write-Host "`n⚙️ 환경변수 영구 설정..." -ForegroundColor Yellow

# 시스템 레벨 환경변수 설정 (관리자 권한 필요)
try {
    [Environment]::SetEnvironmentVariable("HOME", $env:USERPROFILE, "Machine")
    Write-Host "✅ 시스템 HOME 환경변수 설정 완료" -ForegroundColor Green
} catch {
    Write-Host "⚠️ 시스템 환경변수 설정 실패 (관리자 권한 필요): $_" -ForegroundColor Yellow
}

# 사용자 레벨 환경변수 설정
[Environment]::SetEnvironmentVariable("HOME", $env:USERPROFILE, "User")
[Environment]::SetEnvironmentVariable("CLAUDE_CONFIG_DIR", "$env:USERPROFILE\.claude", "User")
Write-Host "✅ 사용자 환경변수 설정 완료" -ForegroundColor Green

# 4. PowerShell 프로필 업데이트
Write-Host "`n📝 PowerShell 프로필 업데이트..." -ForegroundColor Yellow

$profileContent = @"

# Claude CLI 환경변수 설정 (자동 생성)
`$env:HOME = `$env:USERPROFILE
`$env:CLAUDE_CONFIG_DIR = "`$env:USERPROFILE\.claude"

# Claude CLI 별칭 (오류 방지)
function Invoke-ClaudeCLI {
    param([string[]]`$Arguments)
    `$env:HOME = `$env:USERPROFILE
    `$env:CLAUDE_CONFIG_DIR = "`$env:USERPROFILE\.claude"
    & claude @Arguments
}
Set-Alias -Name claude-safe -Value Invoke-ClaudeCLI

"@

$profilePath = $PROFILE
if (!(Test-Path $profilePath)) {
    New-Item -ItemType File -Path $profilePath -Force | Out-Null
}

$currentProfile = Get-Content $profilePath -Raw -ErrorAction SilentlyContinue
if ($currentProfile -notlike "*Claude CLI 환경변수 설정*") {
    Add-Content -Path $profilePath -Value $profileContent
    Write-Host "✅ PowerShell 프로필 업데이트 완료" -ForegroundColor Green
} else {
    Write-Host "✅ PowerShell 프로필 이미 설정됨" -ForegroundColor Green
}

# 5. Claude 설정 디렉토리 확인
Write-Host "`n📁 Claude 설정 디렉토리 확인..." -ForegroundColor Yellow
$claudeDir = "$env:USERPROFILE\.claude"
if (!(Test-Path $claudeDir)) {
    New-Item -ItemType Directory -Path $claudeDir -Force | Out-Null
    Write-Host "✅ Claude 설정 디렉토리 생성: $claudeDir" -ForegroundColor Green
} else {
    Write-Host "✅ Claude 설정 디렉토리 존재: $claudeDir" -ForegroundColor Green
}

# 6. 배치 파일 생성 (최후의 수단)
Write-Host "`n📄 Claude CLI 래퍼 배치 파일 생성..." -ForegroundColor Yellow
$batchContent = @"
@echo off
set HOME=%USERPROFILE%
set CLAUDE_CONFIG_DIR=%USERPROFILE%\.claude
claude %*
"@

$batchPath = "scripts\claude-wrapper.bat"
$batchContent | Out-File -FilePath $batchPath -Encoding ASCII -Force
Write-Host "✅ Claude 래퍼 배치 파일 생성: $batchPath" -ForegroundColor Green

# 7. 테스트 실행
Write-Host "`n🧪 수정 결과 테스트..." -ForegroundColor Yellow
try {
    # 현재 세션에서 환경변수 설정
    $env:HOME = $env:USERPROFILE
    $env:CLAUDE_CONFIG_DIR = "$env:USERPROFILE\.claude"
    
    $version = claude --version 2>$null
    if ($version) {
        Write-Host "✅ Claude CLI 정상 작동: $version" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Claude CLI 여전히 문제 있음" -ForegroundColor Yellow
        Write-Host "💡 대안: scripts\claude-wrapper.bat 사용" -ForegroundColor Cyan
        Write-Host "💡 대안: claude-safe 별칭 사용 (새 세션에서)" -ForegroundColor Cyan
    }
} catch {
    Write-Host "❌ Claude CLI 테스트 실패: $_" -ForegroundColor Red
    Write-Host "💡 scripts\claude-wrapper.bat 또는 ccusage 사용 권장" -ForegroundColor Yellow
}

Write-Host "`n✅ Claude CLI 영구 수정 작업 완료!" -ForegroundColor Green
Write-Host "💡 새 PowerShell 세션에서 변경사항이 완전히 적용됩니다." -ForegroundColor Yellow
Write-Host "💡 문제 지속 시 scripts\claude-wrapper.bat 사용하세요." -ForegroundColor Yellow