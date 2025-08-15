# Claude CLI 경로 오류 우회 스크립트
# 문제: Claude CLI가 :USERPROFILE 환경변수를 제대로 해석하지 못함

param(
    [string]$Command = "",
    [string[]]$Args = @()
)

Write-Host "🔧 Claude CLI 우회 실행..." -ForegroundColor Green

# 1. 환경변수 강제 설정
$env:HOME = $env:USERPROFILE
$env:CLAUDE_CONFIG_DIR = "$env:USERPROFILE\.claude"

# 2. Claude 설정 디렉토리 확인
if (!(Test-Path $env:CLAUDE_CONFIG_DIR)) {
    New-Item -ItemType Directory -Path $env:CLAUDE_CONFIG_DIR -Force | Out-Null
    Write-Host "✅ Claude 설정 디렉토리 생성: $env:CLAUDE_CONFIG_DIR" -ForegroundColor Green
}

# 3. 임시 환경에서 Claude CLI 실행
try {
    if ($Command -eq "") {
        Write-Host "사용법: ./scripts/claude-cli-workaround.ps1 [명령어] [인수...]" -ForegroundColor Yellow
        Write-Host "예시: ./scripts/claude-cli-workaround.ps1 --version" -ForegroundColor Yellow
        Write-Host "예시: ./scripts/claude-cli-workaround.ps1 mcp list" -ForegroundColor Yellow
        exit 0
    }
    
    # 환경변수를 명시적으로 설정하고 Claude CLI 실행
    $env:USERPROFILE = $env:USERPROFILE  # 명시적 설정
    
    if ($Args.Count -gt 0) {
        $fullCommand = "claude $Command $($Args -join ' ')"
    } else {
        $fullCommand = "claude $Command"
    }
    
    Write-Host "실행: $fullCommand" -ForegroundColor Cyan
    
    # PowerShell에서 직접 실행
    & claude $Command @Args
    
} catch {
    Write-Host "❌ Claude CLI 실행 오류: $_" -ForegroundColor Red
    
    # 대안: ccusage 사용 권장
    Write-Host "`n💡 대안: ccusage 사용을 권장합니다" -ForegroundColor Yellow
    Write-Host "   ccusage blocks" -ForegroundColor White
    Write-Host "   ccusage statusline" -ForegroundColor White
    Write-Host "   ccusage daily" -ForegroundColor White
}