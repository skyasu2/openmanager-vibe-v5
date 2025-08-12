# Windows MCP 서버 자동 설치 스크립트 (PowerShell)
# 작성일: 2025-08-12
# Claude Code v1.0.73 용
# 11개 MCP 서버 완전 자동 설치

param(
    [switch]$SkipEnvServers,  # 환경변수 필요 서버 스킵
    [switch]$TestOnly,        # 테스트만 실행
    [string]$ProjectPath = "D:\cursor\openmanager-vibe-v5"
)

# 색상 정의
$Colors = @{
    Success = "Green"
    Warning = "Yellow" 
    Error = "Red"
    Info = "Cyan"
    Header = "Magenta"
}

# 로그 함수
function Write-Log {
    param($Message, $Color = "White")
    Write-Host "🤖 [$(Get-Date -Format 'HH:mm:ss')] $Message" -ForegroundColor $Color
}

function Write-Header {
    param($Title)
    Write-Host ""
    Write-Host "=" * 60 -ForegroundColor $Colors.Header
    Write-Host "  $Title" -ForegroundColor $Colors.Header
    Write-Host "=" * 60 -ForegroundColor $Colors.Header
}

# 사전 요구사항 검사
function Test-Prerequisites {
    Write-Header "사전 요구사항 검사"
    
    $errors = @()
    
    # Node.js 검사
    try {
        $nodeVersion = node --version
        if ([version]($nodeVersion -replace "v", "") -lt [version]"22.0") {
            $errors += "Node.js v22+ 필요 (현재: $nodeVersion)"
        } else {
            Write-Log "✅ Node.js $nodeVersion" $Colors.Success
        }
    } catch {
        $errors += "Node.js가 설치되지 않음"
    }
    
    # Python 검사
    try {
        $pythonVersion = python --version 2>$null
        if (-not $pythonVersion) { $pythonVersion = py --version }
        Write-Log "✅ Python $pythonVersion" $Colors.Success
        
        # uvx 검사
        $uvxPath = "$env:USERPROFILE\AppData\Local\Programs\Python\Python311\Scripts\uvx.exe"
        if (Test-Path $uvxPath) {
            Write-Log "✅ uvx 설치됨: $uvxPath" $Colors.Success
        } else {
            Write-Log "⚠️  uvx 경로를 찾을 수 없음, pip install uv 실행 중..." $Colors.Warning
            pip install uv
        }
    } catch {
        $errors += "Python 3.11+ 필요"
    }
    
    # Claude Code 검사
    try {
        $claudeVersion = claude --version
        Write-Log "✅ Claude Code $claudeVersion" $Colors.Success
    } catch {
        $errors += "Claude Code가 설치되지 않음"
    }
    
    if ($errors.Count -gt 0) {
        Write-Log "❌ 사전 요구사항 실패:" $Colors.Error
        foreach ($error in $errors) {
            Write-Log "   - $error" $Colors.Error
        }
        exit 1
    }
    
    Write-Log "✅ 모든 사전 요구사항 통과!" $Colors.Success
}

# NPX 기반 서버 설치
function Install-NpxServers {
    Write-Header "1️⃣ NPX 기반 서버 설치 (4개)"
    
    $npxServers = @{
        "filesystem" = "cmd /c npx -y @modelcontextprotocol/server-filesystem $ProjectPath"
        "memory" = "cmd /c npx -y @modelcontextprotocol/server-memory"
        "github" = "cmd /c npx -y @modelcontextprotocol/server-github"
        "sequential-thinking" = "cmd /c npx -y @modelcontextprotocol/server-sequential-thinking"
    }
    
    foreach ($server in $npxServers.GetEnumerator()) {
        Write-Log "설치 중: $($server.Key)" $Colors.Info
        try {
            claude mcp add $server.Key $server.Value
            Write-Log "✅ $($server.Key) 설치 완료" $Colors.Success
        } catch {
            Write-Log "❌ $($server.Key) 설치 실패: $_" $Colors.Error
        }
    }
}

# Python 기반 서버 설치
function Install-PythonServers {
    Write-Header "2️⃣ Python 기반 서버 설치 (2개)"
    
    $username = $env:USERNAME
    $uvxPath = "C:\Users\$username\AppData\Local\Programs\Python\Python311\Scripts\uvx.exe"
    
    if (-not (Test-Path $uvxPath)) {
        Write-Log "❌ uvx 경로를 찾을 수 없습니다: $uvxPath" $Colors.Error
        Write-Log "🔧 다음 명령어로 설치하세요: pip install uv" $Colors.Info
        return
    }
    
    # Time 서버
    Write-Log "설치 중: time" $Colors.Info
    try {
        claude mcp add time "`"$uvxPath`" mcp-server-time"
        Write-Log "✅ time 설치 완료" $Colors.Success
    } catch {
        Write-Log "❌ time 설치 실패: $_" $Colors.Error
    }
    
    # Serena 서버 (시간이 오래 걸릴 수 있음)
    if (-not $TestOnly) {
        Write-Log "설치 중: serena (GitHub에서 다운로드 중...)" $Colors.Info
        try {
            $serenaCommand = "`"$uvxPath`" --from git+https://github.com/oraios/serena serena-mcp-server"
            claude mcp add serena $serenaCommand
            Write-Log "✅ serena 설치 완료" $Colors.Success
        } catch {
            Write-Log "❌ serena 설치 실패: $_" $Colors.Error
            Write-Log "💡 인터넷 연결 확인 또는 나중에 수동 설치 필요" $Colors.Warning
        }
    } else {
        Write-Log "⏩ serena 설치 스킵 (테스트 모드)" $Colors.Warning
    }
}

# npm 전역 서버 설치
function Install-NpmGlobalServers {
    Write-Header "3️⃣ npm 전역 서버 설치 (2개)"
    
    # 전역 패키지 설치
    Write-Log "npm 전역 패키지 설치 중..." $Colors.Info
    try {
        npm install -g context7-mcp-server shadcn-ui-mcp-server --silent
        Write-Log "✅ 전역 패키지 설치 완료" $Colors.Success
    } catch {
        Write-Log "❌ 전역 패키지 설치 실패: $_" $Colors.Error
        return
    }
    
    # MCP 서버 등록
    $globalServers = @{
        "context7" = "npx -y context7-mcp-server"
        "shadcn-ui" = "npx -y shadcn-ui-mcp-server"
    }
    
    foreach ($server in $globalServers.GetEnumerator()) {
        Write-Log "등록 중: $($server.Key)" $Colors.Info
        try {
            claude mcp add $server.Key $server.Value
            Write-Log "✅ $($server.Key) 등록 완료" $Colors.Success
        } catch {
            Write-Log "❌ $($server.Key) 등록 실패: $_" $Colors.Error
        }
    }
}

# 기본 서버 (환경변수 불필요) 설치
function Install-BasicServers {
    Write-Header "4️⃣ 기본 서버 (환경변수 불필요) 설치"
    
    Write-Log "설치 중: playwright" $Colors.Info
    try {
        claude mcp add playwright "cmd /c npx -y @playwright/mcp@latest"
        Write-Log "✅ playwright 설치 완료" $Colors.Success
    } catch {
        Write-Log "❌ playwright 설치 실패: $_" $Colors.Error
    }
}

# 환경변수 필요 서버 안내
function Show-EnvServerGuide {
    Write-Header "5️⃣ 환경변수 필요 서버 안내"
    
    if ($SkipEnvServers) {
        Write-Log "⏩ 환경변수 서버 설치 스킵됨" $Colors.Warning
        return
    }
    
    Write-Log "🔐 다음 서버들은 API 키가 필요합니다:" $Colors.Info
    Write-Log ""
    
    Write-Log "📊 Supabase MCP (PostgreSQL 데이터베이스)" $Colors.Info
    Write-Log "   - SUPABASE_URL" $Colors.Warning
    Write-Log "   - SUPABASE_ANON_KEY" $Colors.Warning  
    Write-Log "   - SUPABASE_SERVICE_ROLE_KEY" $Colors.Warning
    Write-Log "   - SUPABASE_ACCESS_TOKEN (service_role_key와 동일)" $Colors.Warning
    Write-Log ""
    
    Write-Log "🌐 Tavily MCP (웹 검색)" $Colors.Info
    Write-Log "   - TAVILY_API_KEY (https://tavily.com에서 발급)" $Colors.Warning
    Write-Log ""
    
    Write-Log "💡 수동 설치 방법은 docs/windows-mcp-complete-installation-guide.md 참조" $Colors.Info
}

# 설치 검증
function Test-Installation {
    Write-Header "✅ 설치 검증"
    
    Write-Log "API 재시작 중..." $Colors.Info
    try {
        claude api restart
        Start-Sleep -Seconds 10
        Write-Log "✅ API 재시작 완료" $Colors.Success
    } catch {
        Write-Log "❌ API 재시작 실패: $_" $Colors.Error
    }
    
    Write-Log "MCP 서버 상태 확인 중..." $Colors.Info
    try {
        $mcpStatus = claude mcp list 2>&1
        
        $connectedCount = ($mcpStatus | Select-String "✓ Connected").Count
        $failedCount = ($mcpStatus | Select-String "✗ Failed").Count
        
        Write-Log "📊 연결 결과: $connectedCount 성공, $failedCount 실패" -Color $(if($failedCount -eq 0) { $Colors.Success } else { $Colors.Warning })
        
        if ($failedCount -gt 0) {
            Write-Log "⚠️  실패한 서버가 있습니다. 상세 내용:" $Colors.Warning
            $mcpStatus | Select-String "✗ Failed" | ForEach-Object {
                Write-Log "   $($_.Line)" $Colors.Error
            }
        }
    } catch {
        Write-Log "❌ 상태 확인 실패: $_" $Colors.Error
    }
}

# 메인 실행
function Main {
    Write-Header "🚀 Windows MCP 서버 자동 설치"
    Write-Log "Claude Code v1.0.73 용 MCP 서버 11개 설치" $Colors.Info
    Write-Log "프로젝트 경로: $ProjectPath" $Colors.Info
    
    if ($TestOnly) {
        Write-Log "🧪 테스트 모드 실행" $Colors.Warning
    }
    
    # 실행
    Test-Prerequisites
    Install-NpxServers
    Install-PythonServers
    Install-NpmGlobalServers
    Install-BasicServers
    Show-EnvServerGuide
    Test-Installation
    
    Write-Header "🎉 설치 완료!"
    Write-Log "✅ 기본 MCP 서버 설치가 완료되었습니다." $Colors.Success
    Write-Log "🔧 환경변수 필요 서버는 수동 설치 필요" $Colors.Info
    Write-Log "📖 상세 가이드: docs/windows-mcp-complete-installation-guide.md" $Colors.Info
    Write-Log ""
    Write-Log "다음 명령어로 최종 확인:" $Colors.Header
    Write-Log "  claude mcp list" $Colors.Info
}

# 스크립트 실행
Main