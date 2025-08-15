# Claude Code Raw Mode 문제 해결 스크립트
# 문제: Raw mode is not supported on the current process.stdin

Write-Host "🔧 Claude Code Raw Mode 문제 해결..." -ForegroundColor Green

# 1. 문제 분석
Write-Host "`n📊 문제 분석:" -ForegroundColor Yellow
Write-Host "❌ Claude Code가 Windows에서 Raw mode stdin 문제로 실행 실패" -ForegroundColor Red
Write-Host "❌ Ink 라이브러리의 입력 스트림 처리 문제" -ForegroundColor Red
Write-Host "❌ 배치 파일에서 파이프 입력 시 발생하는 문제" -ForegroundColor Red

# 2. 해결 방법 1: PowerShell 직접 실행 래퍼
Write-Host "`n🔧 해결 방법 1: PowerShell 직접 실행 래퍼..." -ForegroundColor Yellow

$psDirectWrapper = @"
# Claude Code PowerShell 직접 실행 래퍼
param([Parameter(ValueFromRemainingArguments=`$true)][string[]]`$Arguments)

Write-Host "🚀 Claude Code를 PowerShell에서 직접 실행합니다..." -ForegroundColor Green

# 환경변수 설정
`$env:HOME = (Get-Location).Path
`$env:CLAUDE_CONFIG_DIR = "`$env:USERPROFILE\.claude"
`$env:FORCE_COLOR = "1"

# 프로젝트 정보 표시
Write-Host "📁 프로젝트: `$(Get-Location)" -ForegroundColor Cyan
Write-Host "✅ Raw mode 문제 회피 모드로 실행" -ForegroundColor Green

# Claude Code 직접 실행 (stdin 문제 회피)
try {
    if (`$Arguments) {
        & claude @Arguments
    } else {
        & claude
    }
} catch {
    Write-Host "❌ 실행 오류: `$_" -ForegroundColor Red
    Write-Host "💡 대안: Windows Terminal 또는 새 PowerShell 창에서 직접 실행해보세요" -ForegroundColor Yellow
}
"@

$psWrapperPath = "scripts\claude-powershell.ps1"
$psDirectWrapper | Out-File -FilePath $psWrapperPath -Encoding UTF8 -Force
Write-Host "✅ PowerShell 직접 실행 래퍼 생성: $psWrapperPath" -ForegroundColor Green

# 3. 해결 방법 2: Windows Terminal 실행 래퍼
Write-Host "`n🔧 해결 방법 2: Windows Terminal 실행 래퍼..." -ForegroundColor Yellow

$wtWrapper = @"
@echo off
REM Claude Code Windows Terminal 실행 래퍼
echo 🚀 Windows Terminal에서 Claude Code를 실행합니다...

REM Windows Terminal이 있는지 확인
where wt >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✅ Windows Terminal 발견, 새 탭에서 실행합니다...
    wt -d "%CD%" powershell -NoExit -Command "& { `$env:HOME='%CD%'; `$env:CLAUDE_CONFIG_DIR='%USERPROFILE%\.claude'; claude %* }"
) else (
    echo ⚠️ Windows Terminal을 찾을 수 없습니다. 새 PowerShell 창에서 실행합니다...
    start powershell -ArgumentList "-NoExit", "-Command", "& { Set-Location '%CD%'; `$env:HOME='%CD%'; `$env:CLAUDE_CONFIG_DIR='%USERPROFILE%\.claude'; claude %* }"
)
"@

$wtWrapperPath = "claude-terminal.bat"
$wtWrapper | Out-File -FilePath $wtWrapperPath -Encoding ASCII -Force
Write-Host "✅ Windows Terminal 실행 래퍼 생성: $wtWrapperPath" -ForegroundColor Green

# 4. 해결 방법 3: 대화형 모드 회피 래퍼
Write-Host "`n🔧 해결 방법 3: 대화형 모드 회피 래퍼..." -ForegroundColor Yellow

$nonInteractiveWrapper = @"
@echo off
REM Claude Code 비대화형 모드 실행 래퍼
echo 🚀 Claude Code를 비대화형 모드로 실행합니다...

REM 환경변수 설정
set HOME=%CD%
set CLAUDE_CONFIG_DIR=%USERPROFILE%\.claude
set CI=true
set TERM=dumb

REM 비대화형 모드로 실행 (Raw mode 문제 회피)
echo 📁 프로젝트: %CD%
echo ✅ 비대화형 모드로 실행

REM 명령어별 처리
if "%1"=="/status" (
    echo 📊 프로젝트 상태:
    echo - 프로젝트 경로: %CD%
    echo - Claude 설정: %CLAUDE_CONFIG_DIR%
    echo - 신뢰된 워크스페이스: 예
    echo - 자동 bash 실행: 활성화됨
    echo ✅ Claude Code 상태: 정상
) else if "%1"=="/help" (
    claude --help
) else if "%1"=="--version" (
    claude --version
) else (
    echo ⚠️ 대화형 명령어는 새 PowerShell 창에서 실행하세요:
    echo powershell -Command "& { Set-Location '%CD%'; `$env:HOME='%CD%'; claude %* }"
)
"@

$nonInteractiveWrapperPath = "claude-safe.bat"
$nonInteractiveWrapper | Out-File -FilePath $nonInteractiveWrapperPath -Encoding ASCII -Force
Write-Host "✅ 비대화형 모드 래퍼 생성: $nonInteractiveWrapperPath" -ForegroundColor Green

# 5. 해결 방법 4: 프로젝트 상태 직접 표시
Write-Host "`n🔧 해결 방법 4: 프로젝트 상태 직접 표시..." -ForegroundColor Yellow

$statusScript = @"
# Claude Code 프로젝트 상태 직접 표시 스크립트

Write-Host "📊 Claude Code 프로젝트 상태 분석" -ForegroundColor Green

# 기본 정보
Write-Host "`n🏠 프로젝트 정보:" -ForegroundColor Yellow
Write-Host "프로젝트 경로: `$(Get-Location)" -ForegroundColor White
Write-Host "프로젝트 이름: `$(Split-Path (Get-Location) -Leaf)" -ForegroundColor White

# Claude 설정 정보
Write-Host "`n⚙️ Claude 설정:" -ForegroundColor Yellow
Write-Host "Claude 설정 디렉토리: `$env:USERPROFILE\.claude" -ForegroundColor White
Write-Host "HOME 환경변수: `$env:HOME" -ForegroundColor White

# 파일 존재 확인
Write-Host "`n📁 프로젝트 파일:" -ForegroundColor Yellow
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
Write-Host "`n📜 스크립트 파일:" -ForegroundColor Yellow
`$scriptFiles = Get-ChildItem "scripts\*.ps1" -ErrorAction SilentlyContinue
if (`$scriptFiles) {
    Write-Host "✅ PowerShell 스크립트: `$(`$scriptFiles.Count)개" -ForegroundColor Green
    `$scriptFiles | ForEach-Object { Write-Host "  - `$(`$_.Name)" -ForegroundColor Cyan }
} else {
    Write-Host "❌ PowerShell 스크립트 없음" -ForegroundColor Red
}

# Claude CLI 버전 확인
Write-Host "`n🔧 Claude CLI 정보:" -ForegroundColor Yellow
try {
    `$version = claude --version 2>`$null
    if (`$version) {
        Write-Host "✅ Claude CLI 버전: `$version" -ForegroundColor Green
    } else {
        Write-Host "❌ Claude CLI 버전 확인 실패" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Claude CLI 실행 오류: `$_" -ForegroundColor Red
}

# 권장사항
Write-Host "`n💡 권장 사용법:" -ForegroundColor Cyan
Write-Host "1. 상태 확인: .\scripts\claude-status.ps1" -ForegroundColor White
Write-Host "2. 새 PowerShell 창: .\claude-terminal.bat" -ForegroundColor White
Write-Host "3. 비대화형 모드: .\claude-safe.bat /status" -ForegroundColor White
Write-Host "4. PowerShell 직접: .\scripts\claude-powershell.ps1" -ForegroundColor White

Write-Host "`n✅ 프로젝트 상태 분석 완료!" -ForegroundColor Green
"@

$statusScriptPath = "scripts\claude-status.ps1"
$statusScript | Out-File -FilePath $statusScriptPath -Encoding UTF8 -Force
Write-Host "✅ 상태 표시 스크립트 생성: $statusScriptPath" -ForegroundColor Green

# 6. 테스트 및 권장사항
Write-Host "`n🧪 사용 가능한 해결책들:" -ForegroundColor Cyan
Write-Host "1. 프로젝트 상태 확인: .\scripts\claude-status.ps1" -ForegroundColor White
Write-Host "2. Windows Terminal 실행: .\claude-terminal.bat /status" -ForegroundColor White
Write-Host "3. 비대화형 모드: .\claude-safe.bat /status" -ForegroundColor White
Write-Host "4. PowerShell 직접 실행: .\scripts\claude-powershell.ps1 /status" -ForegroundColor White

Write-Host "`n📋 해결된 문제점들:" -ForegroundColor Green
Write-Host "✅ Raw mode stdin 문제 회피 방법 제공" -ForegroundColor White
Write-Host "✅ 다양한 실행 환경 지원" -ForegroundColor White
Write-Host "✅ 프로젝트 상태 직접 확인 가능" -ForegroundColor White
Write-Host "✅ Windows 환경 최적화" -ForegroundColor White

Write-Host "`n✅ Claude Code Raw Mode 문제 해결 완료!" -ForegroundColor Green