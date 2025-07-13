# Tavily MCP 설정 스크립트
# PowerShell 환경에서 Tavily API 키를 안전하게 설정

$ErrorActionPreference = "Stop"

Write-Host "🔐 Tavily MCP 설정 시작..." -ForegroundColor Cyan

# 키 로더 실행하여 복호화된 키 가져오기
$keyLoaderPath = Join-Path $PSScriptRoot "tavily-key-loader.cjs"
$result = & node $keyLoaderPath

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Tavily API 키 로드 성공" -ForegroundColor Green
    
    # 환경 변수 설정
    $env:TAVILY_API_KEY = (& node -e "const {loadTavilyApiKey} = require('$keyLoaderPath'); console.log(loadTavilyApiKey())")
    
    Write-Host "📋 환경 변수 설정 완료" -ForegroundColor Green
    Write-Host "💡 Claude Code를 재시작하면 Tavily MCP가 활성화됩니다." -ForegroundColor Yellow
    
    # 사용 가능한 기능 안내
    Write-Host "`n🚀 Tavily MCP 기능:" -ForegroundColor Cyan
    Write-Host "  - tavily-search: 실시간 웹 검색" -ForegroundColor White
    Write-Host "  - tavily-extract: 웹 페이지 콘텐츠 추출" -ForegroundColor White
    Write-Host "  - RAG 워크플로우에 최적화" -ForegroundColor White
    Write-Host "`n📊 사용 제한:" -ForegroundColor Yellow
    Write-Host "  - 월 1,000회 무료" -ForegroundColor White
    Write-Host "  - 일일 약 33회" -ForegroundColor White
    Write-Host "  - 초당 1회 요청 제한" -ForegroundColor White
} else {
    Write-Host "❌ Tavily API 키 로드 실패" -ForegroundColor Red
    exit 1
}