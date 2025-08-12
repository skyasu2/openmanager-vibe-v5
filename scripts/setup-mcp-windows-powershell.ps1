# Windows PowerShell MCP Setup Script
# 2025.08.12 - 11개 MCP 서버 설정

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "MCP 서버 설정 시작 (Windows)" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan

# Python 경로 설정
$pythonPath = "C:\Users\skyas\AppData\Local\Programs\Python\Python311"
$uvxPath = "$pythonPath\Scripts\uvx.exe"

# 기존 서버 모두 제거
Write-Host "`n기존 MCP 서버 제거 중..." -ForegroundColor Yellow
$servers = @(
    "filesystem", "memory", "github", "supabase", 
    "sequential-thinking", "playwright", "context7", 
    "shadcn-ui", "time", "serena", "tavily-mcp"
)

foreach ($server in $servers) {
    Write-Host "  - $server 제거 중..."
    & claude mcp remove $server 2>$null
}

Write-Host "`n새 MCP 서버 추가 중..." -ForegroundColor Green

# Node.js 기반 서버 (cmd /c npx 래퍼 사용으로 Windows 호환성 향상)
Write-Host "  [1/11] filesystem 추가..."
& claude mcp add filesystem cmd /c "npx -y @modelcontextprotocol/server-filesystem D:\cursor\openmanager-vibe-v5"

Write-Host "  [2/11] memory 추가..."
& claude mcp add memory cmd /c "npx -y @modelcontextprotocol/server-memory"

Write-Host "  [3/11] github 추가..."
& claude mcp add github cmd /c "npx -y @modelcontextprotocol/server-github"

Write-Host "  [4/11] supabase 추가..."
& claude mcp add supabase cmd /c "npx -y @supabase/mcp-server-supabase"

Write-Host "  [5/11] sequential-thinking 추가..."
& claude mcp add sequential-thinking cmd /c "npx -y @modelcontextprotocol/server-sequential-thinking"

Write-Host "  [6/11] playwright 추가..."
& claude mcp add playwright cmd /c "npx -y @modelcontextprotocol/server-playwright"

Write-Host "  [7/11] context7 추가..."
& claude mcp add context7 cmd /c "npx -y context7-mcp"

Write-Host "  [8/11] shadcn-ui 추가..."
& claude mcp add shadcn-ui cmd /c "npx -y @ozanbaskan/mcp-server-shadcn"

Write-Host "  [9/11] tavily-mcp 추가..."
& claude mcp add tavily-mcp cmd /c "npx -y tavily-mcp"

# Python 기반 서버 (uvx 사용)
Write-Host "  [10/11] time 추가..."
& claude mcp add time $uvxPath "mcp-server-time"

Write-Host "  [11/11] serena 추가..."
& claude mcp add serena $uvxPath "serena"

# API 재시작
Write-Host "`nClaude API 재시작 중..." -ForegroundColor Yellow
& claude api restart

Start-Sleep -Seconds 3

# 연결 확인
Write-Host "`n==================================" -ForegroundColor Cyan
Write-Host "MCP 서버 연결 상태 확인" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
& claude mcp list

Write-Host "`n설정 완료!" -ForegroundColor Green
Write-Host "문제가 있는 서버는 환경변수 설정이 필요할 수 있습니다." -ForegroundColor Yellow
Write-Host "  - tavily-mcp: TAVILY_API_KEY 필요" -ForegroundColor Yellow
Write-Host "  - supabase: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY 필요" -ForegroundColor Yellow
Write-Host "  - github: GITHUB_TOKEN 필요" -ForegroundColor Yellow
Write-Host "  - serena: 프로젝트 루트 경로 설정 필요" -ForegroundColor Yellow