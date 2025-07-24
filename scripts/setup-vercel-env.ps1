# 🚀 Vercel 환경변수 설정 스크립트 (PowerShell)
# GitHub OAuth 리다이렉트 문제 해결을 위한 필수 환경변수 설정

Write-Host "🚀 Vercel 환경변수 설정 시작..." -ForegroundColor Green

# Vercel CLI 설치 확인
try {
    $vercelVersion = vercel --version
    Write-Host "✅ Vercel CLI 확인됨: $vercelVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Vercel CLI가 설치되지 않았습니다." -ForegroundColor Red
    Write-Host "💡 설치 방법: npm install -g vercel" -ForegroundColor Yellow
    exit 1
}

# 프로젝트 루트 확인
if (-not (Test-Path "package.json")) {
    Write-Host "❌ package.json을 찾을 수 없습니다. 프로젝트 루트에서 실행해주세요." -ForegroundColor Red
    exit 1
}

$packageJson = Get-Content "package.json" | ConvertFrom-Json
Write-Host "📦 프로젝트: $($packageJson.name)" -ForegroundColor Cyan

# .env.local 파일 확인
if (-not (Test-Path ".env.local")) {
    Write-Host "❌ .env.local 파일을 찾을 수 없습니다." -ForegroundColor Red
    exit 1
}

Write-Host "📋 .env.local에서 환경변수 로드 중..." -ForegroundColor Cyan

# .env.local 파일 파싱
$envVars = @{}
Get-Content ".env.local" | ForEach-Object {
    if ($_ -match "^([^#][^=]+)=(.*)$") {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim()
        # 따옴표 제거
        $value = $value -replace '^"(.*)"$', '$1'
        $envVars[$key] = $value
    }
}

# 필수 환경변수 목록
$requiredVars = @(
    "NEXTAUTH_URL",
    "NEXT_PUBLIC_APP_URL", 
    "NEXT_PUBLIC_SITE_URL",
    "GITHUB_CLIENT_ID",
    "GITHUB_CLIENT_SECRET",
    "GITHUB_TOKEN",
    "SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "NEXTAUTH_SECRET",
    "ENCRYPTION_KEY"
)

# 환경변수 설정 함수
function Set-VercelEnv {
    param(
        [string]$VarName,
        [string]$VarValue,
        [string]$EnvType = "production,preview,development"
    )
    
    if ([string]::IsNullOrWhiteSpace($VarValue)) {
        Write-Host "❌ $VarName 값이 비어있습니다" -ForegroundColor Red
        return
    }
    
    Write-Host "🔧 설정 중: $VarName" -ForegroundColor Yellow
    
    try {
        # Vercel CLI를 사용하여 환경변수 설정
        $process = Start-Process -FilePath "vercel" -ArgumentList "env", "add", $VarName, $EnvType -NoNewWindow -PassThru -RedirectStandardInput -Wait
        $process.StandardInput.WriteLine($VarValue)
        $process.StandardInput.Close()
        
        if ($process.ExitCode -eq 0) {
            Write-Host "✅ $VarName 설정 완료" -ForegroundColor Green
        } else {
            Write-Host "⚠️ $VarName 설정 실패 (이미 존재할 수 있음)" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "⚠️ $VarName 설정 중 오류: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "🔐 필수 환경변수 설정 중..." -ForegroundColor Green

# 각 환경변수 설정
foreach ($varName in $requiredVars) {
    if ($envVars.ContainsKey($varName)) {
        Set-VercelEnv -VarName $varName -VarValue $envVars[$varName]
    } else {
        Write-Host "❌ $varName을 .env.local에서 찾을 수 없습니다" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "📊 추가 설정..." -ForegroundColor Cyan

# Vercel 특화 환경변수
Set-VercelEnv -VarName "VERCEL_ENV" -VarValue "production" -EnvType "production"
Set-VercelEnv -VarName "VERCEL_ENV" -VarValue "preview" -EnvType "preview"  
Set-VercelEnv -VarName "VERCEL_ENV" -VarValue "development" -EnvType "development"

Write-Host ""
Write-Host "🔍 설정된 환경변수 확인..." -ForegroundColor Cyan
vercel env ls

Write-Host ""
Write-Host "🎉 Vercel 환경변수 설정 완료!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 다음 단계:" -ForegroundColor Yellow
Write-Host "1. Supabase 대시보드에서 Site URL 확인"
Write-Host "2. GitHub OAuth App 콜백 URL 확인"  
Write-Host "3. Vercel에서 재배포: vercel --prod"
Write-Host ""
Write-Host "🔗 확인 URL:" -ForegroundColor Cyan
Write-Host "- Vercel: https://vercel.com/dashboard"
Write-Host "- Supabase: https://supabase.com/dashboard"
Write-Host "- GitHub: https://github.com/settings/developers"