# 빠른 개발 환경 시작 스크립트
param (
    [switch]$Fast,        # 빠른 시작 모드 (타입 체크 건너뛰기)
    [switch]$Full,        # 전체 검증 모드
    [switch]$NoCache     # 캐시 초기화 후 시작
)

$ErrorActionPreference = 'Stop'
$Host.UI.RawUI.WindowTitle = "🚀 OpenManager VIBE v5 개발 환경"

function Write-Step {
    param($Message)
    Write-Host "`n🔷 $Message" -ForegroundColor Cyan
}

function Write-Success {
    param($Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Error {
    param($Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

# 환경 정리
if ($NoCache) {
    Write-Step "캐시 정리 중..."
    if (Test-Path ".next") { Remove-Item -Recurse -Force .next }
    if (Test-Path "node_modules/.cache") { Remove-Item -Recurse -Force node_modules/.cache }
    Write-Success "캐시 정리 완료"
}

# 기본 환경 체크
Write-Step "개발 환경 체크 중..."
try {
    $nodeVersion = node --version
    $npmVersion = npm --version
    Write-Success "Node.js: $nodeVersion"
    Write-Success "npm: $npmVersion"
} catch {
    Write-Error "Node.js 또는 npm이 설치되어 있지 않습니다."
    exit 1
}

# 의존성 확인
Write-Step "의존성 체크 중..."
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 node_modules가 없습니다. 설치를 시작합니다..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Error "의존성 설치 실패"
        exit 1
    }
    Write-Success "의존성 설치 완료"
}

# 환경 변수 확인
Write-Step "환경 설정 확인 중..."
if (-not (Test-Path ".env.local")) {
    if (Test-Path ".env.local.template") {
        Copy-Item ".env.local.template" ".env.local"
        Write-Host "⚠️ .env.local 파일이 생성되었습니다. 필요한 값을 설정해주세요." -ForegroundColor Yellow
    } else {
        Write-Error ".env.local.template 파일을 찾을 수 없습니다."
        exit 1
    }
}

# 타입 체크 (Fast 모드가 아닐 때)
if (-not $Fast) {
    Write-Step "타입 체크 중..."
    npm run type-check
    if ($LASTEXITCODE -ne 0) {
        Write-Error "타입 체크 실패"
        exit 1
    }
    Write-Success "타입 체크 완료"
}

# 전체 검증 모드
if ($Full) {
    Write-Step "전체 검증 실행 중..."
    npm run validate:quick
    if ($LASTEXITCODE -ne 0) {
        Write-Error "전체 검증 실패"
        exit 1
    }
    Write-Success "전체 검증 완료"
}

# 개발 서버 시작
Write-Step "개발 서버 시작 중..."
if ($Fast) {
    Write-Host "🚀 빠른 시작 모드로 실행합니다..." -ForegroundColor Yellow
    npm run dev:optimized
} else {
    npm run dev
}
