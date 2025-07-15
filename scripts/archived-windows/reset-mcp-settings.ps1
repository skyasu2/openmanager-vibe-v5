# PowerShell script for resetting MCP settings
# This script resets Claude Code MCP configuration

Write-Host "🔄 MCP 설정 초기화를 시작합니다..." -ForegroundColor Yellow

# 프로젝트 루트 디렉토리 설정
$PROJECT_DIR = Split-Path -Parent $PSScriptRoot

# Claude 설정 디렉토리 경로
$LOCAL_CONFIG_DIR = Join-Path $PROJECT_DIR ".claude"
$APPDATA_CONFIG_DIR = Join-Path $env:APPDATA "Claude"
$LOCALAPPDATA_CONFIG_DIR = Join-Path $env:LOCALAPPDATA "Claude"

Write-Host "🔍 설정 디렉토리 확인 중..." -ForegroundColor Cyan
Write-Host "   - 로컬: $LOCAL_CONFIG_DIR" -ForegroundColor Gray
Write-Host "   - AppData: $APPDATA_CONFIG_DIR" -ForegroundColor Gray
Write-Host "   - LocalAppData: $LOCALAPPDATA_CONFIG_DIR" -ForegroundColor Gray

# 백업 함수
function Backup-ConfigDir {
    param($DirPath)
    if (Test-Path $DirPath) {
        $BackupPath = "${DirPath}_backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
        Copy-Item -Path $DirPath -Destination $BackupPath -Recurse
        Write-Host "✅ 백업 생성: $BackupPath" -ForegroundColor Green
    }
}

# 초기화 함수
function Reset-ConfigDir {
    param($DirPath, $DirName)
    
    if (Test-Path $DirPath) {
        Write-Host "`n📂 $DirName 디렉토리 발견" -ForegroundColor Yellow
        
        # 백업 생성
        Backup-ConfigDir $DirPath
        
        # MCP 관련 파일만 삭제
        $mcpFiles = @(
            "claude_workspace.json",
            "mcp-servers.json",
            "mcp.json"
        )
        
        foreach ($file in $mcpFiles) {
            $filePath = Join-Path $DirPath $file
            if (Test-Path $filePath) {
                Remove-Item $filePath -Force
                Write-Host "   ❌ 삭제됨: $file" -ForegroundColor Red
            }
        }
        
        # settings.local.json은 유지하되 MCP 관련 설정만 제거
        $settingsFile = Join-Path $DirPath "settings.local.json"
        if (Test-Path $settingsFile) {
            try {
                $settings = Get-Content $settingsFile -Raw | ConvertFrom-Json
                
                # MCP 관련 권한 제거
                if ($settings.permissions.allow) {
                    $settings.permissions.allow = $settings.permissions.allow | Where-Object { 
                        $_ -notlike "mcp__*"
                    }
                }
                
                $settings | ConvertTo-Json -Depth 10 | Set-Content $settingsFile -Encoding UTF8
                Write-Host "   ✏️ 수정됨: settings.local.json (MCP 권한 제거)" -ForegroundColor Yellow
            } catch {
                Write-Host "   ⚠️ settings.local.json 수정 실패: $_" -ForegroundColor Red
            }
        }
    } else {
        Write-Host "`n📂 $DirName 디렉토리가 존재하지 않습니다" -ForegroundColor DarkGray
    }
}

# 각 설정 디렉토리 초기화
Reset-ConfigDir $LOCAL_CONFIG_DIR "로컬 프로젝트"
Reset-ConfigDir $APPDATA_CONFIG_DIR "AppData"
Reset-ConfigDir $LOCALAPPDATA_CONFIG_DIR "LocalAppData"

Write-Host "`n🎯 초기화 완료!" -ForegroundColor Green
Write-Host "📝 다음 단계:" -ForegroundColor Yellow
Write-Host "   1. npm run mcp:setup 명령을 실행하여 MCP 서버를 다시 설정하세요" -ForegroundColor White
Write-Host "   2. Claude Code를 재시작하세요" -ForegroundColor White

Write-Host "`n💡 팁: 백업 파일은 _backup_날짜시간 형식으로 저장되었습니다" -ForegroundColor DarkGray