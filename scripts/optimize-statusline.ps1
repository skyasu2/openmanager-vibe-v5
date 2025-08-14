#!/usr/bin/env pwsh
# Statusline 종합 최적화 스크립트
# 작성일: 2025-08-14
# 용도: ccusage statusline 성능 최적화 및 설정 자동화

param(
    [switch]$SkipEnv = $false,
    [switch]$Benchmark = $false,
    [switch]$InstallBun = $false
)

Write-Host @"
╔══════════════════════════════════════════════╗
║     📊 Statusline 최적화 스크립트 v1.0      ║
║         Claude Code + ccusage 최적화         ║
╚══════════════════════════════════════════════╝
"@ -ForegroundColor Cyan

# 1. ccusage 설치 확인
Write-Host "`n[1/5] ccusage 설치 확인..." -ForegroundColor Yellow
$ccusageVersion = & ccusage --version 2>$null
if ($ccusageVersion) {
    Write-Host "  ✅ ccusage $ccusageVersion 설치됨" -ForegroundColor Green
} else {
    Write-Host "  ⚠️ ccusage가 설치되지 않았습니다. 설치 중..." -ForegroundColor Red
    npm install -g ccusage
    if ($?) {
        Write-Host "  ✅ ccusage 설치 완료!" -ForegroundColor Green
    } else {
        Write-Host "  ❌ 설치 실패. 수동 설치 필요: npm install -g ccusage" -ForegroundColor Red
        exit 1
    }
}

# 2. 환경변수 설정
if (-not $SkipEnv) {
    Write-Host "`n[2/5] 환경변수 설정..." -ForegroundColor Yellow
    
    # 사용자 환경변수 설정 (영구)
    [Environment]::SetEnvironmentVariable("CCUSAGE_CONTEXT_LOW_THRESHOLD", "60", "User")
    [Environment]::SetEnvironmentVariable("CCUSAGE_CONTEXT_MEDIUM_THRESHOLD", "85", "User")
    [Environment]::SetEnvironmentVariable("TZ", "Asia/Seoul", "User")
    
    # 현재 세션 적용
    $env:CCUSAGE_CONTEXT_LOW_THRESHOLD = "60"
    $env:CCUSAGE_CONTEXT_MEDIUM_THRESHOLD = "85"
    $env:TZ = "Asia/Seoul"
    
    Write-Host "  ✅ 환경변수 설정 완료" -ForegroundColor Green
    Write-Host "    - 컨텍스트 경고: 60% / 85%" -ForegroundColor Gray
    Write-Host "    - 타임존: Asia/Seoul" -ForegroundColor Gray
} else {
    Write-Host "`n[2/5] 환경변수 설정 건너뜀 (-SkipEnv)" -ForegroundColor Gray
}

# 3. Bun 확인 및 선택적 설치
Write-Host "`n[3/5] 런타임 최적화 확인..." -ForegroundColor Yellow
$bunPath = Get-Command bun -ErrorAction SilentlyContinue
if ($bunPath) {
    Write-Host "  ✅ Bun 설치됨 (최고 성능)" -ForegroundColor Green
    $runtime = "bun"
} elseif ($InstallBun) {
    Write-Host "  📦 Bun 설치 중..." -ForegroundColor Cyan
    try {
        # Windows용 Bun 설치
        powershell -c "irm bun.sh/install.ps1 | iex"
        Write-Host "  ✅ Bun 설치 완료!" -ForegroundColor Green
        $runtime = "bun"
    } catch {
        Write-Host "  ⚠️ Bun 설치 실패. 기본 모드 사용" -ForegroundColor Yellow
        $runtime = "ccusage"
    }
} else {
    Write-Host "  ℹ️ Bun 미설치. 기본 모드 사용" -ForegroundColor Gray
    Write-Host "    팁: -InstallBun 플래그로 Bun 설치 가능" -ForegroundColor Gray
    $runtime = "ccusage"
}

# 4. settings.json 업데이트
Write-Host "`n[4/5] Claude Code 설정 업데이트..." -ForegroundColor Yellow
$settingsPath = Join-Path $PSScriptRoot "..\\.claude\\settings.json"

# 명령어 결정
$command = if ($runtime -eq "bun") {
    "bun x ccusage statusline"
} else {
    "ccusage statusline"
}

# 현재 설정 읽기
if (Test-Path $settingsPath) {
    $currentSettings = Get-Content $settingsPath -Raw | ConvertFrom-Json
    
    # statusLine 명령어 업데이트
    if ($currentSettings.statusLine.command -ne $command) {
        $currentSettings.statusLine.command = $command
        $currentSettings | ConvertTo-Json -Depth 10 | Set-Content $settingsPath
        Write-Host "  ✅ settings.json 업데이트 완료" -ForegroundColor Green
        Write-Host "    명령어: $command" -ForegroundColor Gray
    } else {
        Write-Host "  ✅ settings.json 이미 최적화됨" -ForegroundColor Green
    }
} else {
    Write-Host "  ⚠️ settings.json 파일을 찾을 수 없습니다." -ForegroundColor Red
}

# 5. 성능 벤치마크 (선택적)
if ($Benchmark) {
    Write-Host "`n[5/5] 성능 벤치마크..." -ForegroundColor Yellow
    Write-Host "  테스트 중... (10회 실행)" -ForegroundColor Cyan
    
    $times = @()
    for ($i = 1; $i -le 10; $i++) {
        $start = Get-Date
        & ccusage statusline > $null 2>&1
        $end = Get-Date
        $duration = ($end - $start).TotalMilliseconds
        $times += $duration
        Write-Progress -Activity "벤치마크" -Status "$i/10" -PercentComplete ($i * 10)
    }
    
    $avg = ($times | Measure-Object -Average).Average
    $min = ($times | Measure-Object -Minimum).Minimum
    $max = ($times | Measure-Object -Maximum).Maximum
    
    Write-Host "`n  📊 벤치마크 결과:" -ForegroundColor Green
    Write-Host "    - 평균: $([math]::Round($avg, 2))ms" -ForegroundColor Gray
    Write-Host "    - 최소: $([math]::Round($min, 2))ms" -ForegroundColor Gray
    Write-Host "    - 최대: $([math]::Round($max, 2))ms" -ForegroundColor Gray
    
    if ($avg -lt 100) {
        Write-Host "    ⚡ 최적 성능!" -ForegroundColor Green
    } elseif ($avg -lt 200) {
        Write-Host "    ✅ 양호한 성능" -ForegroundColor Yellow
    } else {
        Write-Host "    ⚠️ 성능 개선 필요" -ForegroundColor Red
    }
} else {
    Write-Host "`n[5/5] 벤치마크 건너뜀 (-Benchmark로 실행 가능)" -ForegroundColor Gray
}

# 최종 요약
Write-Host "`n" -NoNewline
Write-Host "═══════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✨ 최적화 완료!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════" -ForegroundColor Cyan

Write-Host "`n📋 설정 요약:" -ForegroundColor Yellow
Write-Host "  런타임: $runtime" -ForegroundColor Gray
Write-Host "  명령어: $command" -ForegroundColor Gray
Write-Host "  컨텍스트 임계값: 60% / 85%" -ForegroundColor Gray

Write-Host "`n💡 다음 단계:" -ForegroundColor Cyan
Write-Host "  1. Claude Code 재시작" -ForegroundColor Gray
Write-Host "  2. statusline 확인" -ForegroundColor Gray
Write-Host "  3. 문제 발생 시: ./scripts/fix-statusline-session.ps1" -ForegroundColor Gray

Write-Host "`n📊 사용량 확인:" -ForegroundColor Yellow
Write-Host "  ccusage blocks --active    # 현재 블록" -ForegroundColor Gray
Write-Host "  ccusage blocks --live      # 실시간 모니터링" -ForegroundColor Gray
Write-Host "  ccusage daily              # 일일 사용량" -ForegroundColor Gray

# 현재 상태 표시
Write-Host "`n🔍 현재 statusline 테스트:" -ForegroundColor Cyan
try {
    $statusline = & ccusage statusline 2>$null
    if ($statusline) {
        Write-Host "  $statusline" -ForegroundColor Green
    }
} catch {
    Write-Host "  Test failed. Works normally inside IDE." -ForegroundColor Yellow
}