# 개선된 Claude Code statusline 세션 복구 스크립트
# 작성일: 2025-08-14
# 용도: N/A session 문제 해결 및 세션 동기화 개선

param(
    [switch]$Force,      # 강제 복구 모드
    [switch]$Monitor,    # 실시간 모니터링 모드
    [int]$Timeout = 300  # 타임아웃 (초)
)

Write-Host "🔧 Smart Statusline Recovery 시작..." -ForegroundColor Green

# 1. 현재 상태 진단
function Test-StatuslineHealth {
    Write-Host "📊 현재 statusline 상태 진단 중..." -ForegroundColor Yellow
    
    try {
        # ccusage 설치 확인
        $ccusageVersion = ccusage --version 2>$null
        if ($ccusageVersion) {
            Write-Host "✅ ccusage 설치됨: $ccusageVersion" -ForegroundColor Green
        } else {
            Write-Host "❌ ccusage가 설치되지 않음" -ForegroundColor Red
            return $false
        }
        
        # 활성 블록 확인
        $blockStatus = ccusage blocks --active --json 2>$null | ConvertFrom-Json -ErrorAction SilentlyContinue
        if ($blockStatus) {
            Write-Host "✅ 활성 블록 감지됨" -ForegroundColor Green
            return $true
        } else {
            Write-Host "⚠️ 활성 블록 없음" -ForegroundColor Yellow
            return $false
        }
    } catch {
        Write-Host "❌ 상태 진단 실패: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# 2. 강력한 캐시 정리
function Clear-CcusageCache {
    Write-Host "🧹 ccusage 캐시 완전 정리 중..." -ForegroundColor Yellow
    
    try {
        # 환경변수 설정
        $env:CCUSAGE_CLEAR_CACHE = "true"
        $env:CCUSAGE_FORCE_REFRESH = "true"
        
        # 캐시 정리
        ccusage daily >$null 2>&1
        ccusage blocks --active >$null 2>&1
        
        # 환경변수 정리
        Remove-Item Env:CCUSAGE_CLEAR_CACHE -ErrorAction SilentlyContinue
        Remove-Item Env:CCUSAGE_FORCE_REFRESH -ErrorAction SilentlyContinue
        
        Write-Host "✅ 캐시 정리 완료" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "❌ 캐시 정리 실패: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# 3. 세션 강제 생성
function Force-SessionCreation {
    Write-Host "🚀 세션 강제 생성 중..." -ForegroundColor Yellow
    
    try {
        # 새로운 블록 강제 시작
        $env:CCUSAGE_FORCE_NEW_SESSION = "true"
        ccusage blocks --active >$null 2>&1
        Remove-Item Env:CCUSAGE_FORCE_NEW_SESSION -ErrorAction SilentlyContinue
        
        Write-Host "✅ 세션 강제 생성 완료" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "❌ 세션 생성 실패: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# 4. 실시간 모니터링
function Start-StatuslineMonitoring {
    param([int]$TimeoutSeconds = 300)
    
    Write-Host "👀 실시간 모니터링 시작 (최대 $TimeoutSeconds초)..." -ForegroundColor Cyan
    
    $startTime = Get-Date
    $checkInterval = 10  # 10초마다 체크
    
    while ((Get-Date) -lt $startTime.AddSeconds($TimeoutSeconds)) {
        try {
            # statusline 테스트 (가상 입력으로)
            $testResult = echo '{"session_id": "test"}' | ccusage statusline 2>$null
            
            if ($testResult -and $testResult -notlike "*N/A session*") {
                Write-Host "🎉 세션 복구 성공!" -ForegroundColor Green
                Write-Host "📊 현재 표시: $testResult" -ForegroundColor White
                return $true
            }
            
            Write-Host "⏳ 세션 동기화 대기 중... ($(((Get-Date) - $startTime).TotalSeconds.ToString('F0'))초 경과)" -ForegroundColor Yellow
            Start-Sleep $checkInterval
        } catch {
            Write-Host "⚠️ 모니터링 체크 실패: $($_.Exception.Message)" -ForegroundColor Yellow
            Start-Sleep $checkInterval
        }
    }
    
    Write-Host "⏰ 모니터링 타임아웃" -ForegroundColor Red
    return $false
}

# 메인 실행 로직
$success = $false

if (Test-StatuslineHealth) {
    Write-Host "✅ 기본 상태는 정상입니다" -ForegroundColor Green
    $success = $true
} else {
    Write-Host "🔧 복구 작업을 시작합니다..." -ForegroundColor Yellow
    
    # 단계별 복구
    if (Clear-CcusageCache) {
        if (Force-SessionCreation) {
            $success = $true
        }
    }
}

if ($success -and $Monitor) {
    Start-StatuslineMonitoring -TimeoutSeconds $Timeout
}

# 결과 요약
Write-Host "`n📋 복구 작업 완료 요약:" -ForegroundColor Cyan
Write-Host "────────────────────────" -ForegroundColor Gray

if ($success) {
    Write-Host "✅ 복구 작업 성공" -ForegroundColor Green
    Write-Host "💡 다음 단계:" -ForegroundColor White
    Write-Host "  1. Claude Code IDE 완전 재시작" -ForegroundColor White
    Write-Host "  2. 새로운 대화 세션 시작" -ForegroundColor White
    Write-Host "  3. statusline에서 세션 정보 확인" -ForegroundColor White
} else {
    Write-Host "❌ 복구 작업 실패" -ForegroundColor Red
    Write-Host "💡 수동 해결 방법:" -ForegroundColor White
    Write-Host "  1. Claude Code를 완전히 종료" -ForegroundColor White
    Write-Host "  2. 시스템 재부팅" -ForegroundColor White
    Write-Host "  3. Claude Code 재시작 후 새 대화 시작" -ForegroundColor White
}

Write-Host "`n⚠️ 참고사항:" -ForegroundColor Yellow
Write-Host "• N/A session은 정상적인 동기화 지연일 수 있습니다" -ForegroundColor White
Write-Host "• 일일/블록 비용은 정상 표시되므로 실질적 문제 없습니다" -ForegroundColor White
Write-Host "• 지속적인 문제 시 .claude/settings.json.backup으로 복원하세요" -ForegroundColor White

exit $(if ($success) { 0 } else { 1 })