# PowerShell script for setting up MCP servers
# This script configures MCP servers for Claude Code

Write-Host "🔧 MCP 서버 설정을 시작합니다..." -ForegroundColor Cyan

# 프로젝트 루트 디렉토리 설정
$PROJECT_DIR = Split-Path -Parent $PSScriptRoot

# Claude 설정 디렉토리 경로
$CLAUDE_CONFIG_DIR = Join-Path $PROJECT_DIR ".claude"

# 설정 파일 경로
$CLAUDE_WORKSPACE = Join-Path $CLAUDE_CONFIG_DIR "claude_workspace.json"
$SETTINGS_LOCAL = Join-Path $CLAUDE_CONFIG_DIR "settings.local.json"

Write-Host "📂 프로젝트 디렉토리: $PROJECT_DIR" -ForegroundColor Yellow
Write-Host "📂 Claude 설정 디렉토리: $CLAUDE_CONFIG_DIR" -ForegroundColor Yellow

# 디렉토리 생성
if (!(Test-Path $CLAUDE_CONFIG_DIR)) {
    New-Item -ItemType Directory -Path $CLAUDE_CONFIG_DIR -Force | Out-Null
    Write-Host "✅ Claude 설정 디렉토리 생성됨" -ForegroundColor Green
}

# 기존 파일 백업
function Backup-File {
    param($FilePath)
    if (Test-Path $FilePath) {
        $BackupPath = "$FilePath.backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
        Copy-Item $FilePath $BackupPath
        Write-Host "📋 백업 생성: $BackupPath" -ForegroundColor Gray
    }
}

# 환경 변수 확인
function Check-EnvVar {
    param($VarName, $DefaultValue)
    $Value = [Environment]::GetEnvironmentVariable($VarName, [EnvironmentVariableTarget]::User)
    if ([string]::IsNullOrEmpty($Value)) {
        $Value = [Environment]::GetEnvironmentVariable($VarName, [EnvironmentVariableTarget]::Process)
    }
    if ([string]::IsNullOrEmpty($Value) -and $DefaultValue) {
        $Value = $DefaultValue
    }
    return $Value
}

# GitHub 토큰 확인
$GITHUB_TOKEN = Check-EnvVar "GITHUB_TOKEN" ""

# MCP 서버 설정 생성
$mcpConfig = @{
    mcpServers = @{
        filesystem          = @{
            command = "node"
            args    = @(
                "$PROJECT_DIR\node_modules\@modelcontextprotocol\server-filesystem\dist\index.js",
                "$PROJECT_DIR"
            )
            env     = @{
                ALLOWED_DIRECTORIES = "$PROJECT_DIR"
            }
        }
        github              = @{
            command = "node"
            args    = @(
                "$PROJECT_DIR\node_modules\@modelcontextprotocol\server-github\dist\index.js"
            )
            env     = @{
                GITHUB_PERSONAL_ACCESS_TOKEN = "`${GITHUB_TOKEN}"
            }
        }
        memory              = @{
            command = "node"
            args    = @(
                "$PROJECT_DIR\node_modules\@modelcontextprotocol\server-memory\dist\index.js"
            )
        }
        supabase            = @{
            command = "node"
            args    = @(
                "$PROJECT_DIR\node_modules\@supabase\mcp-server-supabase\dist\index.js"
            )
            env     = @{
                SUPABASE_URL              = "`${SUPABASE_URL}"
                SUPABASE_SERVICE_ROLE_KEY = "`${SUPABASE_SERVICE_ROLE_KEY}"
            }
        }
        context7            = @{
            command = "node"
            args    = @(
                "$PROJECT_DIR\node_modules\@upstash\context7-mcp\dist\index.js"
            )
        }
        tavily              = @{
            command = "node"
            args    = @(
                "$PROJECT_DIR\node_modules\tavily-mcp\dist\index.js"
            )
            env     = @{
                TAVILY_API_KEY = "`${TAVILY_API_KEY}"
            }
        }
        "gemini-cli-bridge" = @{
            command = "node"
            args    = @(
                "$PROJECT_DIR\mcp-servers\gemini-cli-bridge\src\index.js"
            )
        }
    }
}

# settings.local.json 업데이트
$settingsConfig = @{
    permissions                    = @{
        allow = @(
            "WebFetch(domain:docs.anthropic.com)",
            "PowerShell(npm test)",
            "PowerShell(npm run test:unit:*)",
            "PowerShell(uv tool install:*)",
            
            "PowerShell($env:*)",
            "PowerShell(Get-ChildItem:*)",
            
            "PowerShell(echo $env:SHELL)",
            "PowerShell(Get-Content ~/.bashrc)",
            "PowerShell(Remove-Item:*)",
            "PowerShell(npm install:*)",
            "PowerShell(cm)",
            "PowerShell(git push:*)",
            "PowerShell(git config:*)",
            "PowerShell(Get-Command:*)",
            "PowerShell(Get-ChildItem:*)",
            "PowerShell(npm run:*)",
            "PowerShell(Select-String:*)",
            "PowerShell(claude --version)",
            "PowerShell(claude config --help)",
            "PowerShell(claude config list)",
            "PowerShell(claude usage)",
            "PowerShell(claude monitor)",
            "PowerShell(ccusage)",
            "PowerShell(npx ccusage@latest:*)",
            "PowerShell(claude --usage)",
            "PowerShell(npm uninstall:*)",
            "PowerShell(pip3 list:*)",
            "PowerShell(uv tool:*)",
            "PowerShell(claude-usage-monitor)",
            "PowerShell(python:*)",
            "PowerShell(git add:*)",
            "PowerShell(git commit:*)",
            "PowerShell(Start-Process:*)",
            "PowerShell(Get-Process:*)",
            "PowerShell(Stop-Process:*)",
            "PowerShell(Set-ExecutionPolicy:*)",
            "PowerShell(pip3 install:*)",
            "PowerShell(Start-Job:*)",
            "PowerShell(Start-Sleep 30; npm run dev)",
            "PowerShell(Start-Sleep 180; npm run build)",
            "PowerShell(New-Item:*)",
            "PowerShell(Move-Item:*)",
            "PowerShell(git clone:*)",
            "PowerShell(pip install:*)",
            "PowerShell(./setup_claude_monitor.ps1:*)",
            "PowerShell(powershell:*)",
            "PowerShell(Copy-Item:*)",
            "PowerShell(Start-Sleep 10; python3:*)",
            "PowerShell(git ls-tree:*)",
            "PowerShell(vercel:*)",
            "WebFetch(domain:openmanager-vibe-v5.vercel.app)",
            "PowerShell(Invoke-WebRequest:*)",
            "PowerShell(Start-Sleep:*)",
            
            "PowerShell(Stop-Process:*)",
            "PowerShell(sudo npm uninstall -g @anthropic-ai/claude-code)",
            "PowerShell(echo $env:PATH)",
            "PowerShell(Get-Content:*)",
            "PowerShell(npm search:*)",
            "PowerShell(sudo npm install:*)",
            "PowerShell($env:HUSKY=0; git commit --allow-empty -m 'test: Git hooks 테스트용 빈 커밋')",
            "PowerShell(ccusage --help)",
            "PowerShell(ccusage monthly)",
            "PowerShell(git rm:*)",
            "PowerShell(npm update:*)",
            "PowerShell(npx next lint:*)",
            "PowerShell(node:*)",
            "PowerShell(npx tsx:*)",
            "PowerShell(./scripts/show-claude-usage.ps1:*)",
            "PowerShell(Get-Command:*)",
            "PowerShell(pip show:*)",
            "PowerShell(git clean:*)",
            "PowerShell(New-Item:*)",
            "PowerShell(uv:*)",
            "PowerShell(git remote set-url:*)",
            "PowerShell(ssh:*)",
            "PowerShell(gh auth:*)",
            "PowerShell(Get-ChildItem Env:)",
            "PowerShell(git fetch:*)",
            "PowerShell(git remote get-url:*)",
            "PowerShell(Remove-Item Env:GITHUB_TOKEN)",
            "PowerShell($env:HUSKY=0; git push origin main)",
            "PowerShell(git pull:*)",
            "PowerShell(git stash:*)",
            "PowerShell(git restore:*)",
            "PowerShell(jq:*)",
            "PowerShell(rg:*)",
            "PowerShell($env:HUSKY=0; git add .)",
            "PowerShell($env:HUSKY=0; git commit -m '🔧 Claude 설정 업데이트 및 TypeScript 오류 수정`n`n- Claude usage 명령어 허용 추가`n- AuthUser 타입 호환성 문제 해결`n- @supabase/auth-helpers-nextjs 패키지 설치')",
            "PowerShell(Get-Job:*)",
            "PowerShell($env:HUSKY=0; git commit -m '🔧 MCP 서버 설정 개선: PowerShell 백그라운드 지원`n`n- npm 스크립트 중복 제거`n- PowerShell 스크립트 통합`n- Git hooks 최적화')", hooks 최적화 (--quiet 옵션 추가)`n- CLAUDE_MONITOR_GUIDE.md 문서 업데이트')",
            "PowerShell(npm:*)",
            "PowerShell(Test-Path:*)",
            "PowerShell(git checkout:*)",
            "PowerShell(fnm:*)",
            "PowerShell($env:HUSKY=0; git commit -m '🚀 Node.js v22.15.1 업그레이드 및 전체 프로젝트 최적화`n`n## 주요 변경사항:`n`n### 1. Node.js 환경 업그레이드`n- Node.js v18 → v22.15.1 업그레이드 완료`n- fnm (Fast Node Manager) 사용하여 버전 관리`n- package.json 엔진 요구사항 업데이트 (>=22.0.0)`n`n### 2. 코드 품질 개선`n- TypeScript 타입 오류 전체 수정`n- ESLint 오류 해결 (require → ES6 import 변환)`n- Framer Motion 애니메이션 타입 안정성 개선`n- @ts-nocheck 주석 제거 및 타입 안전성 강화`n`n### 3. 문서 및 설정 업데이트`n- 모든 문서에서 Node.js 버전 참조 업데이트`n- GitHub Actions 워크플로우 Node.js 22 사용`n- .nvmrc 파일 v22.15.1로 업데이트`n- GCP Functions 런타임 nodejs22로 업데이트`n`n### 4. 개발 환경 개선`n- Claude 설정에 fnm 명령어 허용 추가`n- 환경 변수 빌드 시 검증 로직 개선`n- .env.local 템플릿 파일 추가`n`n### 5. 패키지 업데이트`n- 전체 npm 패키지 재설치 (1,165개)`n- 취약점 4개 감소 (중간 수준)`n- package-lock.json 재생성`n`n이번 업그레이드로 최신 Node.js LTS 버전에서의 성능과 보안이 향상되었습니다.`n`n🤖 Generated with Claude Code`n`nCo-Authored-By: Claude <noreply@anthropic.com>')",
            "PowerShell(gemini)",
            "PowerShell(gemini:*)",
            "PowerShell($true)",
            "PowerShell(Get-TTY)",
            "PowerShell(echo $env:TERM)",
            "PowerShell(ccusage blocks:*)",
            "PowerShell(Write-Output:*)",
            "PowerShell(./unified-deployment-tools.ps1:*)",
            "PowerShell(npx tsc:*)",
            "PowerShell(Set-Alias cm 'cd ~/Claude-Code-Usage-Monitor; python3 claude_monitor_korean.py --plan max20 --timezone Asia/Seoul')",
            "PowerShell(Write-Output:*)",
            "PowerShell(Get-Alias cm)",
            "PowerShell(claude mcp:*)",
            "PowerShell(claude:*)",
            "PowerShell(cmd.exe:*)",
            "PowerShell(powershell.exe:*)",
            "PowerShell(Get-ChildItem Env:)",
            "mcp__filesystem__read_file",
            "PowerShell($env:HUSKY=0; git commit -m '🔧 MCP 설정 문제 근본 해결 및 프로젝트 정리`n`n## 핵심 개선사항:`n`n### 1. MCP 설정 구조 수정`n- Claude 설정 파일 JSON 구조 표준화 (\"mcp.servers\" → \"mcpServers\")\`n- 커스텀 Gemini CLI Bridge MCP 서버 정상 등록`n- 모든 MCP 서버 (8개) 정상 동작 확인`n`n### 2. 프로젝트 구조 정리`n- Gemini CLI 관련 중복/불필요 파일 제거`n- MCP 서버 디렉토리 구조 표준화`n- 문서 정리 및 통합`n`n### 3. 스크립트 및 설정 개선`n- MCP 설정 스크립트 업데이트`n- 환경 변수 관리 개선`n- Claude Code와 Gemini CLI 협업 최적화`n`n### 4. 보안 및 안정성`n- 설정 변경 전 자동 백업 생성`n- 모든 API 키 및 토큰 보안 검증`n- 의존성 및 파일 경로 검증 완료`n`n이제 MCP 서버들이 경고 없이 정상 동작하며, 프로젝트 구조도 더욱 깔끔해졌습니다.`n`n🤖 Generated with Claude Code`n`nCo-Authored-By: Claude <noreply@anthropic.com>')",
            "PowerShell($env:HUSKY=0; git commit -m '🔧 Gemini CLI 브릿지 PowerShell 경로 문제 해결`n`n## 핵심 개선사항:`n`n### 1. PowerShell 경로 자동 탐지`n- 하드코딩된 경로에서 동적 경로 탐지로 변경`n- 대소문자 차이 문제 해결 (/mnt/c/Windows → /mnt/c/WINDOWS)`n- 여러 가능한 경로 시도 및 폴백 로직 추가`n`n### 2. 견고한 실행 환경 구축`n- PowerShell 실행 실패 시 WSL 직접 실행으로 폴백`n- Gemini CLI 가용성 사전 확인 로직 추가`n- ES 모듈 호환성 문제 해결 (require → import)`n`n### 3. 오류 처리 강화`n- 구체적인 오류 메시지 및 디버깅 정보 제공`n- 재시도 로직 및 타임아웃 개선`n- PowerShell과 WSL 양쪽 환경 지원`n`n### 4. 테스트 결과`n- PowerShell 경로 자동 탐지 성공`n- Gemini CLI 버전 확인 정상 작동 (0.1.11)`n- MCP 서버 stdio 모드 정상 시작`n`n이제 Gemini CLI 브릿지가 WSL과 Windows 환경 모두에서 안정적으로 작동합니다.`n`n🤖 Generated with Claude Code`n`nCo-Authored-By: Claude <noreply@anthropic.com>')",
            "mcp__gemini-cli-bridge__gemini_chat",
            "mcp__gemini-cli-bridge__gemini_stats",
            "PowerShell($env:BRAVE_API_KEY='$env:BRAVE_API_KEY'; node node_modules/@modelcontextprotocol/server-brave-search/dist/index.js)",
            "PowerShell($env:GITHUB_TOKEN=dummy; $env:BRAVE_API_KEY=dummy; node node_modules/@modelcontextprotocol/server-supabase/dist/index.js --help)",
            "PowerShell(nvm use:*)",
            "PowerShell($env:SUPABASE_URL='https://your_project_id.supabase.co'; $env:SUPABASE_SERVICE_ROLE_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZuc3dqbmx0bmhwc3Vlb3NmaG13Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzkyMzMyNywiZXhwIjoyMDYzNDk5MzI3fQ.xk2DUcqBZnaF-iuO7sbeXS-H43h8D5gppIlsJYw7xi8'; node node_modules/@supabase/mcp-server-supabase/dist/index.js --help)",
            "PowerShell($env:SUPABASE_URL='dummy'; $env:SUPABASE_SERVICE_ROLE_KEY='dummy'; node node_modules/@supabase/mcp-server-supabase/dist/index.js)",
            "PowerShell($env:SUPABASE_URL='https://test.supabase.co'; $env:SUPABASE_SERVICE_ROLE_KEY='test_key'; Start-Sleep 5; node node_modules/@supabase/mcp-server-supabase/dist/index.js)",
            "mcp__filesystem__list_directory",
            "mcp__memory__read_graph",
            "mcp__brave-search__brave_web_search",
            "mcp__gemini-cli-bridge__gemini_context_info",
            "PowerShell(powershell:*)",
            "PowerShell(Get-ChildItem:*)",
            "PowerShell($env:GITHUB_PERSONAL_ACCESS_TOKEN='$env:GITHUB_TOKEN'; Start-Sleep 5; node node_modules/@modelcontextprotocol/server-github/dist/index.js)",
            "PowerShell($env:ALLOWED_DIRECTORIES='D:/cursor/openmanager-vibe-v5'; node node_modules/@modelcontextprotocol/server-filesystem/dist/index.js D:/cursor/openmanager-vibe-v5)",
            "PowerShell($env:USERPROFILE)",
            "PowerShell(Get-Command node)",
            "PowerShell(Move-Item:*)",
            "PowerShell(Rename-Item:*)",
            "PowerShell(Remove-Item scriptsverify-mcp-servers.js)",
            "PowerShell($env:SUPABASE_URL='https://your_project_id.supabase.co')",
            "PowerShell($env:* = *)",
            "PowerShell($env:SUPABASE_URL='https://your_project_id.supabase.co'; $env:SUPABASE_SERVICE_ROLE_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZuc3dqbmx0bmhwc3Vlb3NmaG13Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzkyMzMyNywiZXhwIjoyMDYzNDk5MzI3fQ.xk2DUcqBZnaF-iuO7sbeXS-H43h8D5gppIlsJYw7xi8'; Start-Sleep 10; node 'D:\cursor\openmanager-vibe-v5\node_modules\@supabase\mcp-server-supabase\dist\index.js' --help)"
            ]
            deny = @()
        }
        enableAllProjectMcpServers = $true
        enabledMcpjsonServers      = @(
            "filesystem",
            "github",
            "brave-search",
            "memory",
            "supabase",
            "context7",
            "tavily",
            "gemini-cli-bridge"
        )
    }

    # 파일 백업
    Backup-File $SETTINGS_LOCAL

    # 설정 파일 저장
    $settingsConfig | ConvertTo-Json -Depth 10 | Set-Content $SETTINGS_LOCAL -Encoding UTF8

    Write-Host "✅ settings.local.json 업데이트 완료" -ForegroundColor Green

    # 환경 변수 설정 안내
    Write-Host ""
    Write-Host "📋 다음 단계:" -ForegroundColor Cyan
    Write-Host "1. GitHub 토큰 설정 (없으면 GitHub MCP가 작동하지 않음):" -ForegroundColor Yellow
    Write-Host "   [Environment]::SetEnvironmentVariable('GITHUB_TOKEN', 'your-github-token', 'User')" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. Brave Search API 키 설정 (선택사항):" -ForegroundColor Yellow
    Write-Host "   [Environment]::SetEnvironmentVariable('BRAVE_API_KEY', 'your-brave-api-key', 'User')" -ForegroundColor Gray
    Write-Host ""
    Write-Host "3. Claude Code 재시작:" -ForegroundColor Yellow
    Write-Host "   - 모든 Claude 프로세스 종료: Stop-Process -Name claude -Force" -ForegroundColor Gray
    Write-Host "   - 새 터미널에서 Claude 시작: claude" -ForegroundColor Gray
    Write-Host ""
    Write-Host "4. MCP 서버 확인:" -ForegroundColor Yellow
    Write-Host "   - Claude에서 /mcp 명령 실행" -ForegroundColor Gray
    Write-Host "   - 또는: npm run mcp:verify" -ForegroundColor Gray
    Write-Host ""
    Write-Host "💡 문제 해결 팁:" -ForegroundColor Cyan
    Write-Host "   - ~/.claude/logs/ 디렉토리의 로그 확인" -ForegroundColor Gray
    Write-Host "   - PowerShell 실행 정책 확인: Get-ExecutionPolicy" -ForegroundColor Gray
    Write-Host "   - 필요시 실행 정책 변경: Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser" -ForegroundColor Gray

    Write-Host ""
    Write-Host "🎉 PowerShell 기반 MCP 서버 설정 완료!" -ForegroundColor Green