#!/usr/bin/env pwsh
# MCP 완벽 설정 자동화 스크립트 (Windows)
# 검증된 성공 사례 기반 (2025-06-09)

Write-Host "🚀 MCP 완벽 설정을 시작합니다..." -ForegroundColor Green
Write-Host "📌 검증된 성공 사례 기반으로 설정합니다." -ForegroundColor Yellow

# 1. 환경 확인
Write-Host "`n🔍 환경 확인 중..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
}
catch {
    Write-Host "❌ Node.js가 설치되지 않았습니다. Node.js 18+ 설치가 필요합니다." -ForegroundColor Red
    exit 1
}

try {
    $npmVersion = npm --version
    Write-Host "✅ npm: $npmVersion" -ForegroundColor Green
}
catch {
    Write-Host "❌ npm이 설치되지 않았습니다." -ForegroundColor Red
    exit 1
}

# 2. 디렉토리 생성
Write-Host "`n📁 디렉토리 구조 생성 중..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path ".cursor" | Out-Null
New-Item -ItemType Directory -Force -Path "mcp-memory" | Out-Null
Write-Host "✅ .cursor/ 디렉토리 생성 완료" -ForegroundColor Green
Write-Host "✅ mcp-memory/ 디렉토리 생성 완료" -ForegroundColor Green

# 3. MCP 설정 파일 생성
Write-Host "`n⚙️ MCP 설정 파일 생성 중..." -ForegroundColor Yellow

$mcpConfig = @'
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "."],
      "env": {
        "NODE_OPTIONS": "--max-old-space-size=512"
      },
      "description": "프로젝트 파일 시스템 접근",
      "enabled": true
    },
    "memory": {
      "command": "npx", 
      "args": ["-y", "@modelcontextprotocol/server-memory"],
      "env": {
        "MEMORY_STORE_PATH": "./mcp-memory"
      },
      "description": "지식 그래프 기반 메모리 시스템",
      "enabled": true
    },
    "duckduckgo-search": {
      "command": "npx",
      "args": ["-y", "duckduckgo-mcp-server"],
      "env": {
        "NODE_OPTIONS": "--max-old-space-size=256"
      },
      "description": "DuckDuckGo 웹 검색 (프라이버시 중심)",
      "enabled": true
    },
    "sequential-thinking": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"],
      "env": {
        "THINKING_MODE": "development",
        "MAX_DEPTH": "10"
      },
      "description": "고급 순차적 사고 처리",
      "enabled": true
    }
  }
}
'@

# 파일 생성
$mcpConfig | Out-File -FilePath ".cursor\mcp.json" -Encoding UTF8
$mcpConfig | Out-File -FilePath "cursor.mcp.json" -Encoding UTF8
Write-Host "✅ .cursor/mcp.json 생성 완료" -ForegroundColor Green
Write-Host "✅ cursor.mcp.json 생성 완료" -ForegroundColor Green

# 4. Cursor 설정 파일 생성
Write-Host "`n⚙️ Cursor IDE 설정 파일 생성 중..." -ForegroundColor Yellow
$cursorSettings = @'
{
  "mcp.enabled": true,
  "mcp.servers": {},
  "workbench.sideBar.location": "left",
  "editor.minimap.enabled": true,
  "editor.lineNumbers": "on",
  "files.autoSave": "afterDelay",
  "files.autoSaveDelay": 1000,
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll": "explicit"
  }
}
'@

$cursorSettings | Out-File -FilePath ".cursor\settings.json" -Encoding UTF8
Write-Host "✅ .cursor/settings.json 생성 완료" -ForegroundColor Green

# 5. 패키지 사전 다운로드 (선택사항)
Write-Host "`n📦 MCP 서버 패키지 사전 캐시 중..." -ForegroundColor Yellow
Write-Host "   이 과정은 첫 실행 시간을 단축시킵니다..." -ForegroundColor Cyan

try {
    npx -y @modelcontextprotocol/server-filesystem --version 2>$null
    Write-Host "✅ filesystem 서버 캐시 완료" -ForegroundColor Green
}
catch {
    Write-Host "⚠️ filesystem 서버 캐시 실패 (첫 실행 시 다운로드됩니다)" -ForegroundColor Yellow
}

try {
    npx -y @modelcontextprotocol/server-memory --version 2>$null
    Write-Host "✅ memory 서버 캐시 완료" -ForegroundColor Green
}
catch {
    Write-Host "⚠️ memory 서버 캐시 실패 (첫 실행 시 다운로드됩니다)" -ForegroundColor Yellow
}

try {
    npx -y duckduckgo-mcp-server --version 2>$null
    Write-Host "✅ duckduckgo-search 서버 캐시 완료" -ForegroundColor Green
}
catch {
    Write-Host "⚠️ duckduckgo-search 서버 캐시 실패 (첫 실행 시 다운로드됩니다)" -ForegroundColor Yellow
}

try {
    npx -y @modelcontextprotocol/server-sequential-thinking --version 2>$null
    Write-Host "✅ sequential-thinking 서버 캐시 완료" -ForegroundColor Green
}
catch {
    Write-Host "⚠️ sequential-thinking 서버 캐시 실패 (첫 실행 시 다운로드됩니다)" -ForegroundColor Yellow
}

# 6. 설정 완료 안내
Write-Host "`n🎉 MCP 설정이 완료되었습니다!" -ForegroundColor Green
Write-Host ""
Write-Host "📂 생성된 파일들:" -ForegroundColor Cyan
Write-Host "  ├── .cursor/mcp.json" -ForegroundColor White
Write-Host "  ├── .cursor/settings.json" -ForegroundColor White
Write-Host "  ├── cursor.mcp.json" -ForegroundColor White
Write-Host "  └── mcp-memory/" -ForegroundColor White
Write-Host ""
Write-Host "🚀 다음 단계:" -ForegroundColor Cyan
Write-Host "  1. Cursor IDE를 완전히 종료하세요" -ForegroundColor Yellow
Write-Host "  2. Cursor IDE를 다시 시작하세요" -ForegroundColor Yellow
Write-Host "  3. Cmd+Shift+P → 'MCP' 검색으로 패널 확인" -ForegroundColor Yellow
Write-Host "  4. 모든 서버가 Active 상태인지 확인하세요" -ForegroundColor Yellow
Write-Host ""
Write-Host "✨ 성공하면 4개 MCP 서버가 모두 활성화됩니다!" -ForegroundColor Green
Write-Host "   - filesystem (파일 접근)" -ForegroundColor White
Write-Host "   - memory (정보 저장)" -ForegroundColor White
Write-Host "   - duckduckgo-search (웹 검색)" -ForegroundColor White
Write-Host "   - sequential-thinking (고급 사고)" -ForegroundColor White
Write-Host ""
Write-Host "❓ 문제가 있다면 docs/MCP_완벽_설정_가이드.md를 확인하세요." -ForegroundColor Cyan 