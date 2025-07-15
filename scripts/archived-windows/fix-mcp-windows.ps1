# MCP 설정을 Windows 환경에 맞게 수정하는 PowerShell 스크립트

Write-Host "🔧 Windows용 MCP 설정 수정 중..." -ForegroundColor Cyan

# 현재 설정 백업
$timestamp = Get-Date -Format "yyyyMMddHHmmss"
Copy-Item ".claude/mcp.json" ".claude/mcp.json.backup.$timestamp" -Force

# Windows 호환 설정으로 교체
$mcpConfig = @{
    mcpServers = @{
        filesystem = @{
            command = "npx"
            args = @("-y", "@modelcontextprotocol/server-filesystem", (Get-Location).Path)
            env = @{}
        }
        github = @{
            command = "npx"
            args = @("-y", "@modelcontextprotocol/server-github")
            env = @{
                GITHUB_TOKEN = '$env:GITHUB_TOKEN'
            }
        }
        memory = @{
            command = "npx"
            args = @("-y", "@modelcontextprotocol/server-memory")
            env = @{}
        }
        supabase = @{
            command = "npx"
            args = @("-y", "@supabase/mcp-server-supabase")
            env = @{
                SUPABASE_URL = '$env:SUPABASE_URL'
                SUPABASE_SERVICE_ROLE_KEY = '$env:SUPABASE_SERVICE_ROLE_KEY'
            }
        }
        context7 = @{
            command = "npx"
            args = @("-y", "@upstash/context7-mcp")
            env = @{}
        }
    }
}

# JSON으로 저장
$mcpConfig | ConvertTo-Json -Depth 10 | Set-Content ".claude/mcp.json" -Encoding UTF8

Write-Host "✅ MCP 설정이 Windows 환경에 맞게 수정되었습니다." -ForegroundColor Green
Write-Host ""
Write-Host "📋 다음 단계:" -ForegroundColor Yellow
Write-Host "1. Claude Code를 완전히 종료하세요"
Write-Host "2. 다시 시작하세요"
Write-Host "3. '/mcp' 명령으로 상태를 확인하세요"
Write-Host ""
Write-Host "💡 팁: 문제가 지속되면 'scripts/reset-mcp-settings.ps1'을 실행하세요" -ForegroundColor Gray