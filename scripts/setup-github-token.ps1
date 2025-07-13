# PowerShell script for setting up GitHub token
# This script securely configures GitHub token for Claude Code

Write-Host "🔧 GitHub 토큰 설정을 시작합니다..." -ForegroundColor Cyan

# GitHub 토큰 입력 (화면에 표시되지 않음)
Write-Host "GitHub Personal Access Token을 입력하세요 (화면에 표시되지 않습니다):" -ForegroundColor Yellow
$SecureToken = Read-Host -AsSecureString

# 토큰을 일반 문자열로 변환
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecureToken)
$GitHubToken = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

# 토큰 유효성 검증
Write-Host "GitHub API로 토큰 유효성을 확인하는 중..." -ForegroundColor Yellow
try {
    $Headers = @{
        'Authorization' = "token $GitHubToken"
        'Accept' = 'application/vnd.github.v3+json'
    }
    
    $Response = Invoke-RestMethod -Uri "https://api.github.com/user" -Headers $Headers -Method Get
    Write-Host "✅ GitHub 토큰이 유효합니다. 사용자: $($Response.login)" -ForegroundColor Green
} catch {
    Write-Host "❌ GitHub 토큰이 유효하지 않습니다. 다시 시도해주세요." -ForegroundColor Red
    exit 1
}

# 저장 방법 선택
Write-Host ""
Write-Host "토큰 저장 방법을 선택하세요:" -ForegroundColor Cyan
Write-Host "1. 환경 변수로 설정 (권장)" -ForegroundColor White
Write-Host "2. 파일에 저장" -ForegroundColor White
Write-Host "3. 두 가지 모두" -ForegroundColor White
Write-Host ""

$Choice = Read-Host "선택 (1-3)"

switch ($Choice) {
    "1" {
        # 환경 변수로 설정
        [Environment]::SetEnvironmentVariable("GITHUB_TOKEN", $GitHubToken, "User")
        Write-Host "✅ 환경 변수에 저장되었습니다." -ForegroundColor Green
    }
    "2" {
        # 파일에 저장
        $TokenFile = Join-Path $env:USERPROFILE ".github_token"
        $GitHubToken | Out-File -FilePath $TokenFile -Encoding UTF8 -Force
        
        # 파일 권한 설정 (Windows에서는 제한적)
        Write-Host "✅ 파일에 저장되었습니다: $TokenFile" -ForegroundColor Green
    }
    "3" {
        # 두 가지 모두
        [Environment]::SetEnvironmentVariable("GITHUB_TOKEN", $GitHubToken, "User")
        $TokenFile = Join-Path $env:USERPROFILE ".github_token"
        $GitHubToken | Out-File -FilePath $TokenFile -Encoding UTF8 -Force
        Write-Host "✅ 두 가지 방식 모두 설정되었습니다." -ForegroundColor Green
    }
    default {
        Write-Host "❌ 잘못된 선택입니다." -ForegroundColor Red
        exit 1
    }
}

# Claude settings.json 업데이트 확인
Write-Host ""
Write-Host "🔧 Claude MCP 설정 업데이트..." -ForegroundColor Yellow
$ClaudeSettingsPath = Join-Path $env:USERPROFILE ".claude\settings.json"

if (Test-Path $ClaudeSettingsPath) {
    $Settings = Get-Content $ClaudeSettingsPath | ConvertFrom-Json
    
    # 환경 변수 참조 확인
    if ($Settings.mcpServers.github.env.GITHUB_PERSONAL_ACCESS_TOKEN -eq "`${GITHUB_TOKEN}") {
        Write-Host "✅ Claude 설정이 이미 환경 변수를 참조하고 있습니다." -ForegroundColor Green
    } else {
        Write-Host "⚠️  Claude 설정에서 직접 토큰을 사용하고 있습니다." -ForegroundColor Yellow
        Write-Host "   환경 변수 참조로 변경하는 것을 권장합니다." -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️  Claude 설정 파일을 찾을 수 없습니다." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 설정 완료!" -ForegroundColor Green
Write-Host ""
Write-Host "다음 명령으로 설정을 적용하세요:" -ForegroundColor Cyan
Write-Host "  refreshenv" -ForegroundColor Gray
Write-Host ""
Write-Host "또는 새 터미널을 열어주세요." -ForegroundColor Gray 