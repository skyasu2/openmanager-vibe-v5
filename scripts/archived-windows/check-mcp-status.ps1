# MCP 서버 상태 확인 스크립트
Write-Host "=== MCP 서버 상태 확인 ===" -ForegroundColor Cyan
Write-Host ""

# 프로젝트 설정 확인
Write-Host "📁 프로젝트 설정 (.claude/mcp.json):" -ForegroundColor Yellow
if (Test-Path ".claude/mcp.json") {
    $config = Get-Content ".claude/mcp.json" | ConvertFrom-Json
    $servers = $config.mcpServers.PSObject.Properties | ForEach-Object { $_.Name }
    Write-Host "활성화된 서버: $($servers -join ', ')" -ForegroundColor Green
} else {
    Write-Host "설정 파일을 찾을 수 없습니다!" -ForegroundColor Red
}

Write-Host ""
Write-Host "📁 로컬 설정 (.claude/settings.local.json):" -ForegroundColor Yellow
if (Test-Path ".claude/settings.local.json") {
    $settings = Get-Content ".claude/settings.local.json" | ConvertFrom-Json
    $enabledServers = $settings.enabledMcpjsonServers
    Write-Host "활성화된 서버: $($enabledServers -join ', ')" -ForegroundColor Green
    
    # Brave 관련 권한 확인
    $bravePermissions = $settings.permissions.allow | Where-Object { $_ -like "*brave*" }
    if ($bravePermissions) {
        Write-Host ""
        Write-Host "⚠️ Brave 관련 권한이 발견되었습니다:" -ForegroundColor Yellow
        $bravePermissions | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
    }
} else {
    Write-Host "설정 파일을 찾을 수 없습니다!" -ForegroundColor Red
}

Write-Host ""
Write-Host "🌐 글로벌 설정 확인:" -ForegroundColor Yellow
$claudeDir = "$env:APPDATA\Claude"
if (Test-Path $claudeDir) {
    Write-Host "Claude 설정 폴더: $claudeDir" -ForegroundColor Gray
    
    # mcp.json 확인
    $globalMcp = "$claudeDir\mcp.json"
    if (Test-Path $globalMcp) {
        Write-Host "✓ 글로벌 mcp.json 발견" -ForegroundColor Yellow
        $content = Get-Content $globalMcp | ConvertFrom-Json
        if ($content.mcpServers.PSObject.Properties | Where-Object { $_.Name -eq "brave-search" }) {
            Write-Host "⚠️ 글로벌 설정에 brave-search가 있습니다!" -ForegroundColor Red
            Write-Host "  이 설정을 제거하거나 수정해야 합니다." -ForegroundColor Yellow
        }
    }
}

Write-Host ""
Write-Host "🔍 Tavily MCP 확인:" -ForegroundColor Yellow

# Tavily 패키지 확인
if (Test-Path "node_modules/tavily-mcp") {
    Write-Host "✓ tavily-mcp 패키지 설치됨" -ForegroundColor Green
} else {
    Write-Host "✗ tavily-mcp 패키지가 설치되지 않았습니다" -ForegroundColor Red
}

# Tavily 래퍼 확인
if (Test-Path "scripts/tavily-mcp-wrapper.mjs") {
    Write-Host "✓ Tavily 래퍼 스크립트 존재" -ForegroundColor Green
} else {
    Write-Host "✗ Tavily 래퍼 스크립트를 찾을 수 없습니다" -ForegroundColor Red
}

# Tavily API 키 확인
if (Test-Path "config/tavily-encrypted.json") {
    Write-Host "✓ Tavily API 키 설정 파일 존재" -ForegroundColor Green
} else {
    Write-Host "✗ Tavily API 키 설정 파일을 찾을 수 없습니다" -ForegroundColor Red
}

Write-Host ""
Write-Host "💡 다음 단계:" -ForegroundColor Cyan
Write-Host "1. 글로벌 설정에서 brave-search 제거: $env:APPDATA\Claude\mcp.json" -ForegroundColor White
Write-Host "2. Claude Code 완전히 종료 후 재시작" -ForegroundColor White
Write-Host "3. 프로젝트 다시 열기" -ForegroundColor White
Write-Host "4. '/mcp' 명령으로 상태 확인" -ForegroundColor White