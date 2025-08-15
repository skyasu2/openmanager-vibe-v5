# Claude Code 신뢰 설정 및 상태 확인 스크립트
# 프로젝트 폴더 신뢰 설정 후 상태 확인

Write-Host "🔧 Claude Code 신뢰 설정 및 상태 확인..." -ForegroundColor Green

# 1. 현재 프로젝트 디렉토리 확인
$projectDir = Get-Location
Write-Host "`n📁 현재 프로젝트 디렉토리: $projectDir" -ForegroundColor Cyan

# 2. Claude 설정 디렉토리 확인
$claudeConfigDir = "$env:USERPROFILE\.claude"
Write-Host "📁 Claude 설정 디렉토리: $claudeConfigDir" -ForegroundColor Cyan

# 3. 신뢰 설정 파일 확인/생성
Write-Host "`n⚙️ 프로젝트 신뢰 설정 확인..." -ForegroundColor Yellow

$trustConfigPath = "$claudeConfigDir\trusted-workspaces.json"
$currentProjectPath = $projectDir.Path

# 기존 신뢰 설정 읽기
$trustedWorkspaces = @()
if (Test-Path $trustConfigPath) {
    try {
        $existingTrust = Get-Content $trustConfigPath -Raw | ConvertFrom-Json
        if ($existingTrust.trustedWorkspaces) {
            $trustedWorkspaces = $existingTrust.trustedWorkspaces
        }
    } catch {
        Write-Host "⚠️ 기존 신뢰 설정 파일 읽기 실패, 새로 생성합니다" -ForegroundColor Yellow
    }
}

# 현재 프로젝트가 신뢰 목록에 있는지 확인
$isAlreadyTrusted = $trustedWorkspaces -contains $currentProjectPath
if ($isAlreadyTrusted) {
    Write-Host "✅ 현재 프로젝트가 이미 신뢰 목록에 있습니다" -ForegroundColor Green
} else {
    Write-Host "➕ 현재 프로젝트를 신뢰 목록에 추가합니다..." -ForegroundColor Yellow
    $trustedWorkspaces += $currentProjectPath
    
    # 신뢰 설정 파일 업데이트
    $trustConfig = @{
        trustedWorkspaces = $trustedWorkspaces
        lastUpdated = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    }
    
    $trustConfig | ConvertTo-Json -Depth 3 | Out-File -FilePath $trustConfigPath -Encoding UTF8 -Force
    Write-Host "✅ 프로젝트가 신뢰 목록에 추가되었습니다" -ForegroundColor Green
}

# 4. 프로젝트별 Claude 설정 생성
Write-Host "`n📝 프로젝트별 Claude 설정 생성..." -ForegroundColor Yellow

$projectClaudeConfig = @{
    projectName = Split-Path $currentProjectPath -Leaf
    projectPath = $currentProjectPath
    trusted = $true
    allowBashExecution = $true
    createdAt = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
}

$projectConfigPath = ".claude-project.json"
$projectClaudeConfig | ConvertTo-Json -Depth 3 | Out-File -FilePath $projectConfigPath -Encoding UTF8 -Force
Write-Host "✅ 프로젝트 설정 파일 생성: $projectConfigPath" -ForegroundColor Green

# 5. CLAUDE.md 파일 생성 (프로젝트 컨텍스트용)
Write-Host "`n📄 CLAUDE.md 파일 생성..." -ForegroundColor Yellow

$claudeMdContent = @"
# OpenManager Vibe V5 프로젝트

이 프로젝트는 OpenManager Vibe V5 애플리케이션입니다.

## 프로젝트 구조
- `scripts/`: PowerShell 스크립트 파일들
- Claude CLI 관련 수정 스크립트들이 포함되어 있습니다

## Claude Code 사용 가이드
- 이 프로젝트는 Claude Code에서 안전하게 실행할 수 있도록 설정되었습니다
- `/status` 명령어로 현재 상태를 확인할 수 있습니다
- 자동 bash 실행이 활성화되어 있습니다

## 최근 작업
- Claude CLI 설정 불일치 문제 해결
- 프로젝트 디렉토리에서 Claude Code 실행 문제 해결
- 다양한 수정 스크립트 생성

생성일: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
"@

if (!(Test-Path "CLAUDE.md")) {
    $claudeMdContent | Out-File -FilePath "CLAUDE.md" -Encoding UTF8 -Force
    Write-Host "✅ CLAUDE.md 파일 생성됨" -ForegroundColor Green
} else {
    Write-Host "✅ CLAUDE.md 파일 이미 존재함" -ForegroundColor Green
}

# 6. 개선된 Claude 실행 래퍼 생성
Write-Host "`n🚀 개선된 Claude 실행 래퍼 생성..." -ForegroundColor Yellow

$improvedWrapper = @"
@echo off
REM Claude Code 개선된 프로젝트 실행 래퍼
echo 🚀 Claude Code를 신뢰된 프로젝트에서 실행합니다...

REM 환경변수 설정
set HOME=%CD%
set CLAUDE_CONFIG_DIR=%USERPROFILE%\.claude
set CLAUDE_PROJECT_TRUSTED=true

REM 프로젝트 정보 표시
echo 📁 프로젝트: %CD%
echo ✅ 신뢰된 워크스페이스로 설정됨

REM Claude Code 실행 (신뢰 확인 자동 승인)
echo 1 | claude %*
"@

$improvedWrapperPath = "claude-trusted.bat"
$improvedWrapper | Out-File -FilePath $improvedWrapperPath -Encoding ASCII -Force
Write-Host "✅ 개선된 래퍼 생성: $improvedWrapperPath" -ForegroundColor Green

Write-Host "`n🧪 이제 다음 명령어로 테스트해보세요:" -ForegroundColor Cyan
Write-Host ".\claude-trusted.bat /status" -ForegroundColor White

Write-Host "`n📋 해결된 문제점들:" -ForegroundColor Green
Write-Host "✅ 프로젝트가 신뢰 목록에 추가됨" -ForegroundColor White
Write-Host "✅ 프로젝트별 Claude 설정 생성됨" -ForegroundColor White
Write-Host "✅ CLAUDE.md 컨텍스트 파일 생성됨" -ForegroundColor White
Write-Host "✅ 신뢰 확인 자동 승인 래퍼 생성됨" -ForegroundColor White

Write-Host "`n✅ Claude Code 신뢰 설정 및 상태 확인 준비 완료!" -ForegroundColor Green