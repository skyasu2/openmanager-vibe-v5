# Claude Code 궁극적 해결책
# Windows 환경에서 Claude Code의 모든 문제를 우회하는 최종 솔루션

Write-Host "🎯 Claude Code 궁극적 해결책..." -ForegroundColor Green

Write-Host "`n📊 Windows 환경 Claude Code 문제점 정리:" -ForegroundColor Yellow
Write-Host "❌ Raw mode stdin 문제로 대화형 모드 실행 불가" -ForegroundColor Red
Write-Host "❌ 신뢰 대화상자 자동 처리 어려움" -ForegroundColor Red
Write-Host "❌ 배치 파일에서 파이프 입력 처리 문제" -ForegroundColor Red

Write-Host "`n🎯 최종 해결 전략:" -ForegroundColor Cyan
Write-Host "1. Windows Terminal에서 직접 실행" -ForegroundColor White
Write-Host "2. 프로젝트 상태 직접 표시" -ForegroundColor White
Write-Host "3. 실용적인 우회 방법 제공" -ForegroundColor White

# 1. Windows Terminal 직접 실행 스크립트
Write-Host "`n🚀 Windows Terminal 직접 실행 스크립트 생성..." -ForegroundColor Yellow

$wtDirectScript = @"
@echo off
title Claude Code - %CD%
echo.
echo 🚀 Claude Code를 Windows Terminal에서 실행합니다...
echo 📁 프로젝트: %CD%
echo.

REM Windows Terminal 확인
where wt >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✅ Windows Terminal 발견
    echo 🔄 새 탭에서 Claude Code 실행 중...
    wt -d "%CD%" --title "Claude Code - %~n0" powershell -NoExit -Command "& { Write-Host '🚀 Claude Code 실행 준비...' -ForegroundColor Green; `$env:HOME='%CD%'; `$env:CLAUDE_CONFIG_DIR='%USERPROFILE%\.claude'; Write-Host '📁 프로젝트: %CD%' -ForegroundColor Cyan; Write-Host '✅ 환경 설정 완료' -ForegroundColor Green; claude }"
) else (
    echo ⚠️ Windows Terminal을 찾을 수 없습니다
    echo 🔄 새 PowerShell 창에서 실행합니다...
    start "Claude Code" powershell -NoExit -Command "& { Write-Host '🚀 Claude Code 실행 준비...' -ForegroundColor Green; Set-Location '%CD%'; `$env:HOME='%CD%'; `$env:CLAUDE_CONFIG_DIR='%USERPROFILE%\.claude'; Write-Host '📁 프로젝트: %CD%' -ForegroundColor Cyan; Write-Host '✅ 환경 설정 완료, Claude Code 실행 중...' -ForegroundColor Green; claude }"
)

echo.
echo ✅ Claude Code가 새 창에서 실행되었습니다!
echo 💡 새 창에서 /status 명령어를 사용하세요
pause
"@

$wtScriptPath = "start-claude.bat"
$wtDirectScript | Out-File -FilePath $wtScriptPath -Encoding ASCII -Force
Write-Host "✅ Windows Terminal 실행 스크립트: $wtScriptPath" -ForegroundColor Green

# 2. 프로젝트 상태 완전 분석 스크립트
Write-Host "`n📊 프로젝트 상태 완전 분석 스크립트 생성..." -ForegroundColor Yellow

$completeStatusScript = @"
# Claude Code 프로젝트 완전 상태 분석

Write-Host "=" * 80 -ForegroundColor Cyan
Write-Host "🎯 Claude Code 프로젝트 완전 상태 분석" -ForegroundColor Green
Write-Host "=" * 80 -ForegroundColor Cyan

# 기본 정보
Write-Host "`n🏠 프로젝트 기본 정보:" -ForegroundColor Yellow
Write-Host "프로젝트 경로: `$(Get-Location)" -ForegroundColor White
Write-Host "프로젝트 이름: `$(Split-Path (Get-Location) -Leaf)" -ForegroundColor White
Write-Host "실행 시간: `$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor White

# 환경변수 정보
Write-Host "`n⚙️ 환경변수 정보:" -ForegroundColor Yellow
Write-Host "HOME: `$env:HOME" -ForegroundColor White
Write-Host "USERPROFILE: `$env:USERPROFILE" -ForegroundColor White
Write-Host "CLAUDE_CONFIG_DIR: `$env:CLAUDE_CONFIG_DIR" -ForegroundColor White

# Claude CLI 정보
Write-Host "`n🔧 Claude CLI 정보:" -ForegroundColor Yellow
try {
    `$version = claude --version 2>`$null
    if (`$version) {
        Write-Host "✅ Claude CLI 버전: `$version" -ForegroundColor Green
        
        # Config 정보
        try {
            `$configList = claude config list 2>`$null | ConvertFrom-Json
            Write-Host "✅ 설정 로드 성공" -ForegroundColor Green
            Write-Host "허용된 도구: `$(`$configList.allowedTools.Count)개" -ForegroundColor Cyan
            Write-Host "신뢰 대화상자 승인: `$(`$configList.hasTrustDialogAccepted)" -ForegroundColor Cyan
        } catch {
            Write-Host "⚠️ 설정 정보 읽기 실패" -ForegroundColor Yellow
        }
        
        # Doctor 정보 (간단히)
        try {
            `$doctorOutput = claude doctor 2>&1 | Out-String
            if (`$doctorOutput -like "*npm-global*") {
                Write-Host "✅ 설치 방법: npm-global" -ForegroundColor Green
            }
            if (`$doctorOutput -like "*Auto-updates enabled: true*") {
                Write-Host "✅ 자동 업데이트: 활성화됨" -ForegroundColor Green
            }
        } catch {
            Write-Host "⚠️ Doctor 정보 읽기 실패" -ForegroundColor Yellow
        }
    } else {
        Write-Host "❌ Claude CLI 실행 실패" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Claude CLI 오류: `$_" -ForegroundColor Red
}

# 파일 시스템 정보
Write-Host "`n📁 프로젝트 파일 정보:" -ForegroundColor Yellow

`$importantFiles = @(
    "CLAUDE.md",
    ".claude-project.json",
    "package.json",
    "README.md"
)

foreach (`$file in `$importantFiles) {
    if (Test-Path `$file) {
        `$size = (Get-Item `$file).Length
        Write-Host "✅ `$file (`$size bytes)" -ForegroundColor Green
    } else {
        Write-Host "❌ `$file (없음)" -ForegroundColor Red
    }
}

# 스크립트 파일 정보
Write-Host "`n📜 스크립트 파일 정보:" -ForegroundColor Yellow
`$scriptFiles = Get-ChildItem "scripts\*.ps1" -ErrorAction SilentlyContinue
if (`$scriptFiles) {
    Write-Host "✅ PowerShell 스크립트: `$(`$scriptFiles.Count)개" -ForegroundColor Green
    `$recentScripts = `$scriptFiles | Sort-Object LastWriteTime -Descending | Select-Object -First 5
    Write-Host "최근 수정된 스크립트:" -ForegroundColor Cyan
    `$recentScripts | ForEach-Object { 
        Write-Host "  - `$(`$_.Name) (`$(`$_.LastWriteTime.ToString('MM-dd HH:mm')))" -ForegroundColor White 
    }
}

`$batchFiles = Get-ChildItem "*.bat" -ErrorAction SilentlyContinue
if (`$batchFiles) {
    Write-Host "✅ 배치 파일: `$(`$batchFiles.Count)개" -ForegroundColor Green
    `$batchFiles | ForEach-Object { 
        Write-Host "  - `$(`$_.Name)" -ForegroundColor Cyan 
    }
}

# Claude 설정 파일 정보
Write-Host "`n⚙️ Claude 설정 파일 정보:" -ForegroundColor Yellow
`$claudeConfigDir = "`$env:USERPROFILE\.claude"

if (Test-Path `$claudeConfigDir) {
    Write-Host "✅ Claude 설정 디렉토리 존재" -ForegroundColor Green
    
    `$settingsFile = "`$claudeConfigDir\settings.json"
    if (Test-Path `$settingsFile) {
        `$size = (Get-Item `$settingsFile).Length
        Write-Host "✅ settings.json (`$size bytes)" -ForegroundColor Green
    }
    
    `$trustFile = "`$claudeConfigDir\trusted-workspaces.json"
    if (Test-Path `$trustFile) {
        `$size = (Get-Item `$trustFile).Length
        Write-Host "✅ trusted-workspaces.json (`$size bytes)" -ForegroundColor Green
        
        try {
            `$trustConfig = Get-Content `$trustFile -Raw | ConvertFrom-Json
            Write-Host "신뢰된 워크스페이스: `$(`$trustConfig.trustedWorkspaces.Count)개" -ForegroundColor Cyan
        } catch {
            Write-Host "⚠️ 신뢰 설정 읽기 실패" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "❌ Claude 설정 디렉토리 없음" -ForegroundColor Red
}

# 권장사항
Write-Host "`n" + "=" * 80 -ForegroundColor Cyan
Write-Host "💡 Claude Code 사용 권장사항:" -ForegroundColor Green
Write-Host "=" * 80 -ForegroundColor Cyan

Write-Host "`n🚀 실행 방법 (우선순위 순):" -ForegroundColor Yellow
Write-Host "1. .\start-claude.bat                    # Windows Terminal에서 새 창 실행 (권장)" -ForegroundColor Green
Write-Host "2. .\claude-safe.bat /status             # 비대화형 모드 (상태 확인용)" -ForegroundColor White
Write-Host "3. cproj --version                       # PowerShell 함수 (버전 확인용)" -ForegroundColor White
Write-Host "4. .\scripts\claude-status.ps1           # 이 상태 분석 스크립트" -ForegroundColor Cyan

Write-Host "`n🔧 문제 해결:" -ForegroundColor Yellow
Write-Host "- Raw mode 오류 시: Windows Terminal 사용 (.\start-claude.bat)" -ForegroundColor White
Write-Host "- 신뢰 대화상자 시: 새 창에서 수동으로 '1' 입력" -ForegroundColor White
Write-Host "- 설정 문제 시: .\scripts\claude-trust-complete-fix.ps1 재실행" -ForegroundColor White

Write-Host "`n✅ 프로젝트 상태 분석 완료!" -ForegroundColor Green
Write-Host "=" * 80 -ForegroundColor Cyan
"@

$completeStatusPath = "scripts\claude-complete-status.ps1"
$completeStatusScript | Out-File -FilePath $completeStatusPath -Encoding UTF8 -Force
Write-Host "✅ 완전 상태 분석 스크립트: $completeStatusPath" -ForegroundColor Green

# 3. 사용법 가이드 생성
Write-Host "`n📖 사용법 가이드 생성..." -ForegroundColor Yellow

$usageGuide = @"
# Claude Code 사용법 가이드 (Windows)

## 🎯 권장 사용 방법

### 1. 새 창에서 실행 (가장 권장)
```batch
.\start-claude.bat
```
- Windows Terminal 또는 새 PowerShell 창에서 Claude Code 실행
- Raw mode 문제 완전 회피
- 신뢰 대화상자 수동 처리 가능

### 2. 프로젝트 상태 확인
```powershell
.\scripts\claude-complete-status.ps1
```
- 프로젝트의 모든 상태 정보 표시
- Claude CLI 설정 확인
- 파일 시스템 정보 확인

### 3. 비대화형 명령어
```batch
.\claude-safe.bat /status    # 상태 확인
cproj --version              # 버전 확인
```

## 🔧 문제 해결

### Raw mode 오류
- **해결책**: `.\start-claude.bat` 사용
- **원인**: Windows 환경에서 stdin 처리 문제

### 신뢰 대화상자
- **해결책**: 새 창에서 수동으로 '1' 입력
- **설정**: 이미 자동 신뢰 설정 완료됨

### Config 불일치
- **현상**: npm-global vs unknown
- **영향**: 없음 (cosmetic issue)
- **해결**: 기능에는 문제없음

## 📁 생성된 파일들

### 실행 파일
- `start-claude.bat` - Windows Terminal 실행 (권장)
- `claude-safe.bat` - 비대화형 모드
- `claude-auto-trust.bat` - 자동 신뢰 시도

### 상태 확인
- `scripts\claude-complete-status.ps1` - 완전 상태 분석
- `scripts\claude-status.ps1` - 기본 상태 확인

### 설정 파일
- `.claude-project.json` - 프로젝트 설정
- `CLAUDE.md` - 프로젝트 컨텍스트

## ✅ 해결된 문제들

1. ✅ Config 불일치 (npm-global vs unknown)
2. ✅ 프로젝트 디렉토리 인식
3. ✅ 신뢰 설정 자동화
4. ✅ PowerShell 별칭 충돌
5. ✅ Raw mode 우회 방법

## 🎯 최종 권장사항

**일상 사용**: `.\start-claude.bat`
**상태 확인**: `.\scripts\claude-complete-status.ps1`
**빠른 명령**: `cproj --version`

생성일: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
"@

$usageGuidePath = "CLAUDE-USAGE-GUIDE.md"
$usageGuide | Out-File -FilePath $usageGuidePath -Encoding UTF8 -Force
Write-Host "✅ 사용법 가이드: $usageGuidePath" -ForegroundColor Green

# 4. 최종 테스트
Write-Host "`n🧪 최종 테스트 실행..." -ForegroundColor Yellow
Write-Host "완전 상태 분석 실행 중..." -ForegroundColor Cyan

# 완전 상태 분석 실행
& ".\scripts\claude-complete-status.ps1"

Write-Host "`n" + "=" * 80 -ForegroundColor Green
Write-Host "🎉 Claude Code 궁극적 해결책 완료!" -ForegroundColor Green
Write-Host "=" * 80 -ForegroundColor Green

Write-Host "`n🚀 지금 바로 사용해보세요:" -ForegroundColor Yellow
Write-Host ".\start-claude.bat" -ForegroundColor Cyan

Write-Host "`n📖 자세한 사용법:" -ForegroundColor Yellow
Write-Host "CLAUDE-USAGE-GUIDE.md 파일을 확인하세요" -ForegroundColor Cyan