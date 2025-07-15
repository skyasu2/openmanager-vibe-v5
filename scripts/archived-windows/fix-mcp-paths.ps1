# fix-mcp-paths.ps1
# MCP 설정을 Windows 환경에 맞게 수정하는 스크립트

Write-Host "🔧 MCP 경로 설정 수정 시작..." -ForegroundColor Green

# 프로젝트 경로
$projectPath = "D:\cursor\openmanager-vibe-v5"
$mcpConfigPath = "$projectPath\.claude\mcp.json"

# MCP 설정 읽기
$config = Get-Content $mcpConfigPath -Raw | ConvertFrom-Json

# filesystem 경로를 Windows 형식으로 수정
if ($config.mcpServers.filesystem) {
    $config.mcpServers.filesystem.args = @(
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "--allowed-directories",
        $projectPath
    )
    Write-Host "✅ filesystem 경로 수정: $projectPath" -ForegroundColor Green
}

# tavily 래퍼 경로 수정
if ($config.mcpServers.tavily) {
    $config.mcpServers.tavily.args = @("$projectPath\scripts\tavily-mcp-wrapper.mjs")
    Write-Host "✅ tavily 래퍼 경로 수정" -ForegroundColor Green
}

# gemini-cli-bridge 경로 수정
if ($config.mcpServers."gemini-cli-bridge") {
    $config.mcpServers."gemini-cli-bridge".args = @("$projectPath\mcp-servers\gemini-cli-bridge\src\index.js")
    Write-Host "✅ gemini-cli-bridge 경로 수정" -ForegroundColor Green
}

# 백업 생성
$backupPath = "$mcpConfigPath.backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
Copy-Item $mcpConfigPath $backupPath
Write-Host "📄 백업 생성: $backupPath" -ForegroundColor Cyan

# 수정된 설정 저장
$config | ConvertTo-Json -Depth 10 | Set-Content $mcpConfigPath -Encoding UTF8
Write-Host "💾 설정 파일 저장 완료" -ForegroundColor Green

# 환경변수 확인
Write-Host "`n🔍 환경변수 확인..." -ForegroundColor Yellow

$envVars = @{
    "GITHUB_TOKEN" = $env:GITHUB_TOKEN
    "SUPABASE_URL" = $env:SUPABASE_URL
    "SUPABASE_SERVICE_ROLE_KEY" = $env:SUPABASE_SERVICE_ROLE_KEY
    "TAVILY_API_KEY" = $env:TAVILY_API_KEY
}

foreach ($key in $envVars.Keys) {
    if ($envVars[$key]) {
        Write-Host "✅ $key 설정됨" -ForegroundColor Green
    } else {
        Write-Host "❌ $key 설정 필요" -ForegroundColor Red
    }
}

Write-Host "`n📋 다음 단계:" -ForegroundColor Cyan
Write-Host "1. Claude Code를 완전히 종료 (시스템 트레이 확인)" -ForegroundColor White
Write-Host "2. Claude Code 재시작" -ForegroundColor White
Write-Host "3. 프로젝트 열기: $projectPath" -ForegroundColor White
Write-Host "4. /mcp 명령으로 상태 확인" -ForegroundColor White

Write-Host "`n✅ 스크립트 완료!" -ForegroundColor Green