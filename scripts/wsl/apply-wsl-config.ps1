<#!
.SYNOPSIS
  OpenManager VIBE v5 WSL 설정 적용 도우미 (수동 반영 절차 자동화 보조)
.DESCRIPTION
  - 현재 사용자 프로필의 .wslconfig 변경 상태를 점검하고 적용 여부를 알려줍니다.
  - 바로 재시작 대신 '확인 → 사용자 동의 후 shutdown' 2단계.
  - 변경 전 메모리/프로세서/스왑 값을 백업 파일에 기록합니다.
.NOTES
  실행 전: PowerShell을 "관리자"로 권장.
#>

param(
    [switch]$AutoConfirm
)

$ConfigPath = Join-Path -Path $env:USERPROFILE -ChildPath '.wslconfig'
$BackupDir = Join-Path -Path $env:USERPROFILE -ChildPath 'wsl-config-backups'
$Stamp = Get-Date -Format 'yyyyMMdd_HHmmss'

Write-Host '🔍 WSL 설정 점검 시작...' -ForegroundColor Cyan
if (!(Test-Path $ConfigPath)) {
    Write-Host "❌ .wslconfig 파일을 찾을 수 없습니다: $ConfigPath" -ForegroundColor Red
    exit 1
}

# 백업 준비
if (!(Test-Path $BackupDir)) { New-Item -ItemType Directory -Path $BackupDir | Out-Null }
$BackupFile = Join-Path $BackupDir ".wslconfig.$Stamp.bak"
Copy-Item $ConfigPath $BackupFile
Write-Host "💾 기존 설정 백업: $BackupFile" -ForegroundColor DarkGray

# 현재 실행 중인 WSL 상태 파악 (wsl.exe --status 는 최신 Windows 필요)
$CurrentStatus = try { wsl.exe --status 2>$null } catch { '' }
Write-Host '--- 현재 WSL 상태 ---'
Write-Host $CurrentStatus

# 대상 설정 파싱 함수
function Get-KeyValue($content, $key) {
    $regex = "^$key=([^`r`n]+)"
    $m = [regex]::Match($content, $regex, 'IgnoreCase, Multiline')
    if ($m.Success) { return $m.Groups[1].Value.Trim() } else { return $null }
}

$content = Get-Content $ConfigPath -Raw
$TargetMemory = Get-KeyValue $content 'memory'
$TargetCPU = Get-KeyValue $content 'processors'
$TargetSwap = Get-KeyValue $content 'swap'

Write-Host "⚙️  목표 설정 -> memory=$TargetMemory, processors=$TargetCPU, swap=$TargetSwap" -ForegroundColor Yellow

# 실시간 적용 여부는 직접 측정 (wslctl 없음) → 사용자 안내
Write-Host 'ℹ️  현재 실행 중인 배포판 메모리/CPU는 재시작 후 반영됩니다.' -ForegroundColor DarkYellow

if (-not $AutoConfirm) {
    $r = Read-Host '지금 wsl --shutdown 을 실행하여 새 설정을 반영할까요? (y/N)'
    if ($r -notin @('y', 'Y')) {
        Write-Host '⏸ 재시작 보류. 나중에 수동으로 실행: wsl --shutdown' -ForegroundColor Cyan
        exit 0
    }
}

Write-Host '🛑 WSL 종료 중 (wsl --shutdown)...'
wsl --shutdown
if ($LASTEXITCODE -eq 0) {
    Write-Host '✅ 종료 완료. 새 WSL 세션을 열어 free -h / nproc 로 확인하세요.' -ForegroundColor Green
    Write-Host "예: free -h; nproc" -ForegroundColor DarkGreen
}
else {
    Write-Host '⚠️ 종료 명령이 완전히 성공하지 않았을 수 있습니다.' -ForegroundColor Yellow
}
