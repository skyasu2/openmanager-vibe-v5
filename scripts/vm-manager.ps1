# vm-manager.ps1 - PowerShell용 VM 관리 래퍼
# GCP VM Specialist v2.0 - Windows 최적화 VM API 관리

param(
    [Parameter(Mandatory=$true)]
    [string]$Command,
    
    [Parameter()]
    [string[]]$Args = @()
)

# 환경변수 로드 (.env.local)
if (Test-Path ".env.local") {
    Write-Host "🔧 환경변수 로드 중..." -ForegroundColor Cyan
    Get-Content ".env.local" | ForEach-Object {
        if ($_ -match "^VM_API_TOKEN=(.+)$") {
            $env:VM_API_TOKEN = $matches[1]
            Write-Host "✅ VM_API_TOKEN 로드됨" -ForegroundColor Green
        }
    }
}

# API 토큰 확인
if (-not $env:VM_API_TOKEN) {
    Write-Error "❌ VM_API_TOKEN 환경변수가 설정되지 않았습니다."
    Write-Host "💡 .env.local 파일에 VM_API_TOKEN=[토큰] 을 추가하세요." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "🔑 토큰 설정 방법:" -ForegroundColor Cyan
    Write-Host "  1. .env.local 파일을 열거나 생성"
    Write-Host "  2. 다음 줄 추가: VM_API_TOKEN=your_token_here"
    Write-Host "  3. 파일 저장 후 다시 실행"
    exit 1
}

# Node.js 클라이언트 실행
$clientScript = "scripts/vm-api-client.js"
if (-not (Test-Path $clientScript)) {
    Write-Error "❌ $clientScript 파일을 찾을 수 없습니다."
    Write-Host "💡 프로젝트 루트 디렉토리에서 실행하세요." -ForegroundColor Yellow
    exit 1
}

Write-Host "🚀 VM API 클라이언트 실행: $Command" -ForegroundColor Green

$allArgs = @($Command) + $Args
& node $clientScript @allArgs

if ($LASTEXITCODE -ne 0) {
    Write-Error "❌ VM API 명령 실행 실패 (종료 코드: $LASTEXITCODE)"
    exit $LASTEXITCODE
}

Write-Host "✅ 명령 실행 완료" -ForegroundColor Green