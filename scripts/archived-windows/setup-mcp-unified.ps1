# setup-mcp-unified.ps1
# WSL과 Windows 환경을 위한 통합 MCP 설정 스크립트

param(
    [switch]$UseGlobal,
    [switch]$UseProject
)

Write-Host "🚀 MCP 통합 설정 스크립트" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan

# 기본값: 프로젝트 설정 사용
if (-not $UseGlobal -and -not $UseProject) {
    $UseProject = $true
}

$projectPath = "D:\cursor\openmanager-vibe-v5"
$userHome = [Environment]::GetFolderPath("UserProfile")

# 1. 환경변수 확인
Write-Host "`n🔍 환경변수 확인..." -ForegroundColor Yellow
$requiredEnvVars = @{
    "GITHUB_TOKEN" = "GitHub API 접근용"
    "SUPABASE_URL" = "Supabase 프로젝트 URL"
    "SUPABASE_SERVICE_ROLE_KEY" = "Supabase 서비스 키"
    "TAVILY_API_KEY" = "Tavily 검색 API (선택사항)"
}

$missingVars = @()
foreach ($var in $requiredEnvVars.Keys) {
    if ([Environment]::GetEnvironmentVariable($var, "User")) {
        Write-Host "✅ $var 설정됨" -ForegroundColor Green
    } else {
        Write-Host "❌ $var 미설정 - $($requiredEnvVars[$var])" -ForegroundColor Red
        $missingVars += $var
    }
}

if ($missingVars.Count -gt 0) {
    Write-Host "`n⚠️  다음 환경변수를 설정해주세요:" -ForegroundColor Yellow
    Write-Host "1. Windows 설정 > 시스템 > 고급 시스템 설정 > 환경 변수" -ForegroundColor White
    Write-Host "2. 사용자 변수에 추가" -ForegroundColor White
    
    # 일단 계속 진행
}

# 2. MCP 설정 결정
if ($UseGlobal) {
    Write-Host "`n📋 글로벌 설정 모드 선택됨" -ForegroundColor Cyan
    
    # 글로벌 설정 파일 생성/업데이트
    $globalMcpPath = "$userHome\.claude\mcp.json"
    $globalMcpDir = Split-Path $globalMcpPath -Parent
    
    if (-not (Test-Path $globalMcpDir)) {
        New-Item -ItemType Directory -Path $globalMcpDir -Force | Out-Null
    }
    
    # 글로벌 MCP 설정 생성
    $globalConfig = @{
        mcpServers = @{
            filesystem = @{
                type = "stdio"
                command = "npx"
                args = @("-y", "@modelcontextprotocol/server-filesystem", "--allowed-directories", $projectPath)
                env = @{}
            }
            github = @{
                type = "stdio"
                command = "npx"
                args = @("-y", "@modelcontextprotocol/server-github")
                env = @{
                    GITHUB_TOKEN = '${GITHUB_TOKEN}'
                }
            }
            memory = @{
                type = "stdio"
                command = "npx"
                args = @("-y", "@modelcontextprotocol/server-memory")
                env = @{}
            }
        }
    }
    
    $globalConfig | ConvertTo-Json -Depth 10 | Set-Content $globalMcpPath -Encoding UTF8
    Write-Host "✅ 글로벌 MCP 설정 생성: $globalMcpPath" -ForegroundColor Green
    
} else {
    Write-Host "`n📋 프로젝트 설정 모드 (권장)" -ForegroundColor Cyan
    
    # 프로젝트 MCP 설정 수정
    $projectMcpPath = "$projectPath\.claude\mcp.json"
    
    if (Test-Path $projectMcpPath) {
        # 백업 생성
        $backupPath = "$projectMcpPath.backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
        Copy-Item $projectMcpPath $backupPath
        Write-Host "📄 백업 생성: $backupPath" -ForegroundColor Cyan
        
        # 설정 읽기 및 수정
        $config = Get-Content $projectMcpPath -Raw | ConvertFrom-Json
        
        # Windows 경로로 수정
        if ($config.mcpServers.filesystem) {
            $config.mcpServers.filesystem.args[3] = $projectPath
        }
        
        if ($config.mcpServers.tavily) {
            $config.mcpServers.tavily.args[0] = "$projectPath\scripts\tavily-mcp-wrapper.mjs"
        }
        
        if ($config.mcpServers."gemini-cli-bridge") {
            $config.mcpServers."gemini-cli-bridge".args[0] = "$projectPath\mcp-servers\gemini-cli-bridge\src\index.js"
        }
        
        # 저장
        $config | ConvertTo-Json -Depth 10 | Set-Content $projectMcpPath -Encoding UTF8
        Write-Host "✅ 프로젝트 MCP 설정 수정 완료" -ForegroundColor Green
    }
}

# 3. brave-search 제거
Write-Host "`n🧹 brave-search 정리 중..." -ForegroundColor Yellow

$configPaths = @(
    "$userHome\.claude\settings.json",
    "$userHome\AppData\Local\Claude\settings.json",
    "$userHome\AppData\Roaming\Claude\settings.json"
)

foreach ($path in $configPaths) {
    if (Test-Path $path) {
        $content = Get-Content $path -Raw
        if ($content -match "brave-search") {
            Write-Host "  ⚠️  $path 에서 brave-search 제거 중..." -ForegroundColor Yellow
            
            $jsonObj = $content | ConvertFrom-Json
            
            if ($jsonObj.enabledMcpjsonServers) {
                $jsonObj.enabledMcpjsonServers = @($jsonObj.enabledMcpjsonServers | Where-Object { $_ -ne "brave-search" })
                $jsonObj | ConvertTo-Json -Depth 10 | Set-Content $path -Encoding UTF8
                Write-Host "  ✅ 제거 완료" -ForegroundColor Green
            }
        }
    }
}

# 4. 최종 안내
Write-Host "`n✅ MCP 설정 완료!" -ForegroundColor Green
Write-Host "`n📋 다음 단계:" -ForegroundColor Cyan
Write-Host "1. Claude Code 완전 종료 (시스템 트레이 확인)" -ForegroundColor White
Write-Host "2. Claude Code 재시작" -ForegroundColor White
Write-Host "3. 프로젝트 열기: $projectPath" -ForegroundColor White
Write-Host "4. /mcp 명령으로 상태 확인" -ForegroundColor White

if ($missingVars.Count -gt 0) {
    Write-Host "`n⚠️  중요: 환경변수 설정 후 Windows 재시작 필요" -ForegroundColor Yellow
}

Write-Host "`n💡 사용 팁:" -ForegroundColor Cyan
Write-Host "- 프로젝트 설정 사용 (기본): .\scripts\setup-mcp-unified.ps1" -ForegroundColor White
Write-Host "- 글로벌 설정 사용: .\scripts\setup-mcp-unified.ps1 -UseGlobal" -ForegroundColor White