# setup-mcp-complete.ps1
# MCP 완전 설정 스크립트 - 환경 변수와 경로 모두 설정

Write-Host "🚀 MCP 완전 설정 스크립트" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan

$projectPath = "D:\cursor\openmanager-vibe-v5"
Set-Location $projectPath

# 1단계: 환경 변수 설정
Write-Host "`n[1/4] 환경 변수 설정 중..." -ForegroundColor Yellow

$envFile = ".env.local"
if (-not (Test-Path $envFile)) {
    Write-Host "❌ .env.local 파일을 찾을 수 없습니다!" -ForegroundColor Red
    exit 1
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

# 필수 환경 변수 설정
$requiredVars = @(
    "GITHUB_TOKEN",
    "SUPABASE_SERVICE_ROLE_KEY",
    "GOOGLE_AI_API_KEY",
    "TAVILY_API_KEY"
)

foreach ($key in $requiredVars) {
    if ($envVars.ContainsKey($key)) {
        [Environment]::SetEnvironmentVariable($key, $envVars[$key], "Process")
        [Environment]::SetEnvironmentVariable($key, $envVars[$key], "User")
        Write-Host "✅ $key 설정됨" -ForegroundColor Green
    }
}

# SUPABASE_URL 설정 (NEXT_PUBLIC_ 없이)
if ($envVars.ContainsKey("NEXT_PUBLIC_SUPABASE_URL")) {
    [Environment]::SetEnvironmentVariable("SUPABASE_URL", $envVars["NEXT_PUBLIC_SUPABASE_URL"], "Process")
    [Environment]::SetEnvironmentVariable("SUPABASE_URL", $envVars["NEXT_PUBLIC_SUPABASE_URL"], "User")
    Write-Host "✅ SUPABASE_URL 설정됨" -ForegroundColor Green
}

# 2단계: MCP 경로 수정
Write-Host "`n[2/4] MCP 경로 수정 중..." -ForegroundColor Yellow

$mcpConfigPath = ".claude\mcp.json"
if (Test-Path $mcpConfigPath) {
    $config = Get-Content $mcpConfigPath -Raw | ConvertFrom-Json
    
    # filesystem 경로 수정
    if ($config.mcpServers.filesystem) {
        $config.mcpServers.filesystem.args = @(
            "-y",
            "@modelcontextprotocol/server-filesystem",
            "--allowed-directories",
            $projectPath
        )
    }
    
    # tavily 경로 수정
    if ($config.mcpServers.tavily) {
        $config.mcpServers.tavily.args = @("$projectPath\scripts\tavily-mcp-wrapper.mjs")
    }
    
    # gemini-cli-bridge 경로 수정
    if ($config.mcpServers."gemini-cli-bridge") {
        $config.mcpServers."gemini-cli-bridge".args = @("$projectPath\mcp-servers\gemini-cli-bridge\src\index.js")
    }
    
    # 백업 생성
    $backupPath = "$mcpConfigPath.backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
    Copy-Item $mcpConfigPath $backupPath
    
    # 저장
    $config | ConvertTo-Json -Depth 10 | Set-Content $mcpConfigPath -Encoding UTF8
    Write-Host "✅ MCP 경로 수정 완료" -ForegroundColor Green
}

# 3단계: brave-search 제거
Write-Host "`n[3/4] brave-search 정리 중..." -ForegroundColor Yellow

$userHome = [Environment]::GetFolderPath("UserProfile")
$settingsPaths = @(
    "$userHome\.claude\settings.json",
    "$userHome\AppData\Local\Claude\settings.json",
    "$userHome\AppData\Roaming\Claude\settings.json",
    ".claude\settings.local.json"
)

foreach ($path in $settingsPaths) {
    if (Test-Path $path) {
        $content = Get-Content $path -Raw
        if ($content -match "brave-search") {
            $jsonObj = $content | ConvertFrom-Json
            
            if ($jsonObj.enabledMcpjsonServers) {
                $jsonObj.enabledMcpjsonServers = @($jsonObj.enabledMcpjsonServers | Where-Object { $_ -ne "brave-search" })
                $jsonObj | ConvertTo-Json -Depth 10 | Set-Content $path -Encoding UTF8
                Write-Host "✅ $path 에서 brave-search 제거됨" -ForegroundColor Green
            }
        }
    }
}

# 4단계: 테스트
Write-Host "`n[4/4] MCP 서버 테스트..." -ForegroundColor Yellow

# Tavily 테스트
if (Test-Path "scripts\test-tavily-mcp.mjs") {
    Write-Host "`nTavily MCP 테스트 중..." -ForegroundColor Cyan
    & node scripts\test-tavily-mcp.mjs
}

# 최종 확인
Write-Host "`n📊 환경 변수 최종 확인:" -ForegroundColor Cyan
foreach ($key in $requiredVars) {
    $value = [Environment]::GetEnvironmentVariable($key, "Process")
    if ($value) {
        $maskedValue = $value.Substring(0, [Math]::Min(10, $value.Length)) + "..."
        Write-Host "  $key = $maskedValue" -ForegroundColor Gray
    } else {
        Write-Host "  $key = ❌ 미설정" -ForegroundColor Red
    }
}

Write-Host "`n✅ MCP 설정 완료!" -ForegroundColor Green
Write-Host "`n📋 다음 단계:" -ForegroundColor Cyan
Write-Host "1. Claude Code를 완전히 종료 (시스템 트레이 확인)" -ForegroundColor White
Write-Host "2. 새 PowerShell/터미널 열기 (환경 변수 적용)" -ForegroundColor White
Write-Host "3. Claude Code 재시작" -ForegroundColor White
Write-Host "4. 프로젝트 열기: $projectPath" -ForegroundColor White
Write-Host "5. /mcp 명령으로 상태 확인" -ForegroundColor White

Write-Host "`n💡 예상되는 MCP 상태:" -ForegroundColor Cyan
Write-Host "✅ filesystem - 연결됨" -ForegroundColor Green
Write-Host "✅ github - 연결됨" -ForegroundColor Green
Write-Host "✅ memory - 연결됨" -ForegroundColor Green
Write-Host "✅ supabase - 연결됨" -ForegroundColor Green
Write-Host "✅ context7 - 연결됨" -ForegroundColor Green
Write-Host "✅ tavily - 연결됨" -ForegroundColor Green
Write-Host "✅ gemini-cli-bridge - 연결됨" -ForegroundColor Green
Write-Host "❌ brave-search - 제거됨" -ForegroundColor Gray