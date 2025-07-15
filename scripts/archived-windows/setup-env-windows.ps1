# setup-env-windows.ps1
# .env.local 파일에서 환경 변수를 읽어 Windows 환경 변수로 설정

Write-Host "🔐 환경 변수 설정 스크립트" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan

$envFile = ".env.local"
if (-not (Test-Path $envFile)) {
    Write-Host "❌ .env.local 파일을 찾을 수 없습니다!" -ForegroundColor Red
    exit 1
}

# MCP에 필요한 핵심 환경 변수들
$requiredVars = @{
    "GITHUB_TOKEN" = "GitHub API 액세스"
    "SUPABASE_URL" = "Supabase 프로젝트 URL"  
    "SUPABASE_SERVICE_ROLE_KEY" = "Supabase 서비스 키"
    "TAVILY_API_KEY" = "Tavily 검색 API"
    "GOOGLE_AI_API_KEY" = "Google AI API"
}

# .env.local 파일 읽기
$envContent = Get-Content $envFile
$envVars = @{}

foreach ($line in $envContent) {
    if ($line -match '^\s*#' -or $line -match '^\s*$') {
        continue
    }
    
    if ($line -match '^([^=]+)=(.*)$') {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim()
        
        # 따옴표 제거
        if ($value -match '^["''](.*)["'']$') {
            $value = $matches[1]
        }
        
        $envVars[$key] = $value
    }
}

Write-Host "`n📋 환경 변수 설정 중..." -ForegroundColor Yellow

# 세션 환경 변수 설정 (현재 PowerShell 세션)
foreach ($key in $requiredVars.Keys) {
    if ($envVars.ContainsKey($key)) {
        [Environment]::SetEnvironmentVariable($key, $envVars[$key], "Process")
        Write-Host "✅ $key - 세션 환경 변수 설정됨" -ForegroundColor Green
    } else {
        Write-Host "⚠️  $key - .env.local에 없음" -ForegroundColor Yellow
    }
}

# Supabase URL도 설정 (NEXT_PUBLIC_ 프리픽스 없이)
if ($envVars.ContainsKey("NEXT_PUBLIC_SUPABASE_URL")) {
    [Environment]::SetEnvironmentVariable("SUPABASE_URL", $envVars["NEXT_PUBLIC_SUPABASE_URL"], "Process")
    Write-Host "✅ SUPABASE_URL - 세션 환경 변수 설정됨 (NEXT_PUBLIC_SUPABASE_URL에서)" -ForegroundColor Green
}

# 영구 설정 여부 확인
Write-Host "`n💡 영구적으로 환경 변수를 설정하시겠습니까? (사용자 환경 변수)" -ForegroundColor Cyan
$permanent = Read-Host "설정하려면 'Y' 입력 (Y/N)"

if ($permanent -eq 'Y' -or $permanent -eq 'y') {
    Write-Host "`n🔧 사용자 환경 변수 설정 중..." -ForegroundColor Yellow
    
    foreach ($key in $requiredVars.Keys) {
        if ($envVars.ContainsKey($key)) {
            [Environment]::SetEnvironmentVariable($key, $envVars[$key], "User")
            Write-Host "✅ $key - 사용자 환경 변수 설정됨" -ForegroundColor Green
        }
    }
    
    if ($envVars.ContainsKey("NEXT_PUBLIC_SUPABASE_URL")) {
        [Environment]::SetEnvironmentVariable("SUPABASE_URL", $envVars["NEXT_PUBLIC_SUPABASE_URL"], "User")
        Write-Host "✅ SUPABASE_URL - 사용자 환경 변수 설정됨" -ForegroundColor Green
    }
    
    Write-Host "`n✅ 영구 환경 변수 설정 완료!" -ForegroundColor Green
    Write-Host "⚠️  새 PowerShell/터미널을 열어야 적용됩니다." -ForegroundColor Yellow
} else {
    Write-Host "`n💡 현재 세션에만 환경 변수가 설정되었습니다." -ForegroundColor Cyan
}

# 설정된 환경 변수 확인
Write-Host "`n📊 설정된 환경 변수 확인:" -ForegroundColor Cyan
foreach ($key in $requiredVars.Keys) {
    $value = [Environment]::GetEnvironmentVariable($key, "Process")
    if ($value) {
        $maskedValue = $value.Substring(0, [Math]::Min(10, $value.Length)) + "..."
        Write-Host "  $key = $maskedValue" -ForegroundColor Gray
    }
}

Write-Host "`n✅ 환경 변수 설정 완료!" -ForegroundColor Green
Write-Host "`n다음 단계:" -ForegroundColor Cyan
Write-Host "1. Claude Code 재시작" -ForegroundColor White
Write-Host "2. 프로젝트 열기" -ForegroundColor White
Write-Host "3. /mcp 명령으로 상태 확인" -ForegroundColor White