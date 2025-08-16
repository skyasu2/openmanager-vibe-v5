# Kiro IDE 터미널 초기화 스크립트
# 터미널이 항상 워크스페이스 폴더에서 시작되도록 설정

param(
    [switch]$Force,
    [switch]$Verbose
)

$ErrorActionPreference = "Stop"

# 프로젝트 루트 경로
$ProjectRoot = "D:\cursor\openmanager-vibe-v5"
$CurrentPath = Get-Location

Write-Host "=== Kiro IDE 터미널 초기화 ===" -ForegroundColor Cyan

# 현재 위치 확인
if ($Verbose) {
    Write-Host "현재 위치: $CurrentPath" -ForegroundColor Gray
    Write-Host "프로젝트 루트: $ProjectRoot" -ForegroundColor Gray
}

# 워크스페이스로 이동
if ($CurrentPath.Path -ne $ProjectRoot) {
    if (Test-Path $ProjectRoot) {
        Set-Location $ProjectRoot
        Write-Host "✅ 워크스페이스로 이동: $ProjectRoot" -ForegroundColor Green
    } else {
        Write-Host "❌ 프로젝트 루트를 찾을 수 없습니다: $ProjectRoot" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✅ 이미 워크스페이스에 있습니다" -ForegroundColor Green
}

# 환경 변수 설정
$env:KIRO_WORKSPACE = $ProjectRoot
$env:KIRO_TERMINAL_INITIALIZED = "true"

# Git 상태 확인 (선택사항)
if (Get-Command git -ErrorAction SilentlyContinue) {
    try {
        $gitBranch = git branch --show-current 2>$null
        if ($gitBranch) {
            Write-Host "📂 Git 브랜치: $gitBranch" -ForegroundColor Yellow
        }
    } catch {
        # Git 정보 없음 - 무시
    }
}

# Node.js 버전 확인 (선택사항)
if (Get-Command node -ErrorAction SilentlyContinue) {
    try {
        $nodeVersion = node --version 2>$null
        Write-Host "🟢 Node.js: $nodeVersion" -ForegroundColor Green
    } catch {
        # Node.js 정보 없음 - 무시
    }
}

# 프로젝트 상태 요약
Write-Host "`n📋 프로젝트 상태:" -ForegroundColor White
Write-Host "   위치: $(Get-Location)" -ForegroundColor Gray
Write-Host "   준비: 완료" -ForegroundColor Green

if ($Verbose) {
    Write-Host "`n🔧 사용 가능한 명령어:" -ForegroundColor White
    Write-Host "   proj  - 프로젝트 루트로 이동" -ForegroundColor Gray
    Write-Host "   src   - src 폴더로 이동" -ForegroundColor Gray
    Write-Host "   ll    - 파일 목록 보기" -ForegroundColor Gray
}

Write-Host "=== 초기화 완료 ===" -ForegroundColor Cyan