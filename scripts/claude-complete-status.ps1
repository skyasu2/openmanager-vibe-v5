# Claude Code 프로젝트 완전 상태 분석

Write-Host "=" * 80 -ForegroundColor Cyan
Write-Host "🎯 Claude Code 프로젝트 완전 상태 분석" -ForegroundColor Green
Write-Host "=" * 80 -ForegroundColor Cyan

# 기본 정보
Write-Host "
🏠 프로젝트 기본 정보:" -ForegroundColor Yellow
Write-Host "프로젝트 경로: $(Get-Location)" -ForegroundColor White
Write-Host "프로젝트 이름: $(Split-Path (Get-Location) -Leaf)" -ForegroundColor White
Write-Host "실행 시간: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor White

# 환경변수 정보
Write-Host "
⚙️ 환경변수 정보:" -ForegroundColor Yellow
Write-Host "HOME: $env:HOME" -ForegroundColor White
Write-Host "USERPROFILE: $env:USERPROFILE" -ForegroundColor White
Write-Host "CLAUDE_CONFIG_DIR: $env:CLAUDE_CONFIG_DIR" -ForegroundColor White

# Claude CLI 정보
Write-Host "
🔧 Claude CLI 정보:" -ForegroundColor Yellow
try {
    $version = claude --version 2>$null
    if ($version) {
        Write-Host "✅ Claude CLI 버전: $version" -ForegroundColor Green
        
        # Config 정보
        try {
            $configList = claude config list 2>$null | ConvertFrom-Json
            Write-Host "✅ 설정 로드 성공" -ForegroundColor Green
            Write-Host "허용된 도구: $($configList.allowedTools.Count)개" -ForegroundColor Cyan
            Write-Host "신뢰 대화상자 승인: $($configList.hasTrustDialogAccepted)" -ForegroundColor Cyan
        } catch {
            Write-Host "⚠️ 설정 정보 읽기 실패" -ForegroundColor Yellow
        }
        
        # Doctor 정보 (간단히)
        try {
            $doctorOutput = claude doctor 2>&1 | Out-String
            if ($doctorOutput -like "*npm-global*") {
                Write-Host "✅ 설치 방법: npm-global" -ForegroundColor Green
            }
            if ($doctorOutput -like "*Auto-updates enabled: true*") {
                Write-Host "✅ 자동 업데이트: 활성화됨" -ForegroundColor Green
            }
        } catch {
            Write-Host "⚠️ Doctor 정보 읽기 실패" -ForegroundColor Yellow
        }
    } else {
        Write-Host "❌ Claude CLI 실행 실패" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Claude CLI 오류: $_" -ForegroundColor Red
}

# 파일 시스템 정보
Write-Host "
📁 프로젝트 파일 정보:" -ForegroundColor Yellow

$importantFiles = @(
    "CLAUDE.md",
    ".claude-project.json",
    "package.json",
    "README.md"
)

foreach ($file in $importantFiles) {
    if (Test-Path $file) {
        $size = (Get-Item $file).Length
        Write-Host "✅ $file ($size bytes)" -ForegroundColor Green
    } else {
        Write-Host "❌ $file (없음)" -ForegroundColor Red
    }
}

# 스크립트 파일 정보
Write-Host "
📜 스크립트 파일 정보:" -ForegroundColor Yellow
$scriptFiles = Get-ChildItem "scripts\*.ps1" -ErrorAction SilentlyContinue
if ($scriptFiles) {
    Write-Host "✅ PowerShell 스크립트: $($scriptFiles.Count)개" -ForegroundColor Green
    $recentScripts = $scriptFiles | Sort-Object LastWriteTime -Descending | Select-Object -First 5
    Write-Host "최근 수정된 스크립트:" -ForegroundColor Cyan
    $recentScripts | ForEach-Object { 
        Write-Host "  - $($_.Name) ($($_.LastWriteTime.ToString('MM-dd HH:mm')))" -ForegroundColor White 
    }
}

$batchFiles = Get-ChildItem "*.bat" -ErrorAction SilentlyContinue
if ($batchFiles) {
    Write-Host "✅ 배치 파일: $($batchFiles.Count)개" -ForegroundColor Green
    $batchFiles | ForEach-Object { 
        Write-Host "  - $($_.Name)" -ForegroundColor Cyan 
    }
}

# Claude 설정 파일 정보
Write-Host "
⚙️ Claude 설정 파일 정보:" -ForegroundColor Yellow
$claudeConfigDir = "$env:USERPROFILE\.claude"

if (Test-Path $claudeConfigDir) {
    Write-Host "✅ Claude 설정 디렉토리 존재" -ForegroundColor Green
    
    $settingsFile = "$claudeConfigDir\settings.json"
    if (Test-Path $settingsFile) {
        $size = (Get-Item $settingsFile).Length
        Write-Host "✅ settings.json ($size bytes)" -ForegroundColor Green
    }
    
    $trustFile = "$claudeConfigDir\trusted-workspaces.json"
    if (Test-Path $trustFile) {
        $size = (Get-Item $trustFile).Length
        Write-Host "✅ trusted-workspaces.json ($size bytes)" -ForegroundColor Green
        
        try {
            $trustConfig = Get-Content $trustFile -Raw | ConvertFrom-Json
            Write-Host "신뢰된 워크스페이스: $($trustConfig.trustedWorkspaces.Count)개" -ForegroundColor Cyan
        } catch {
            Write-Host "⚠️ 신뢰 설정 읽기 실패" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "❌ Claude 설정 디렉토리 없음" -ForegroundColor Red
}

# 권장사항
Write-Host "
" + "=" * 80 -ForegroundColor Cyan
Write-Host "💡 Claude Code 사용 권장사항:" -ForegroundColor Green
Write-Host "=" * 80 -ForegroundColor Cyan

Write-Host "
🚀 실행 방법 (우선순위 순):" -ForegroundColor Yellow
Write-Host "1. .\start-claude.bat                    # Windows Terminal에서 새 창 실행 (권장)" -ForegroundColor Green
Write-Host "2. .\claude-safe.bat /status             # 비대화형 모드 (상태 확인용)" -ForegroundColor White
Write-Host "3. cproj --version                       # PowerShell 함수 (버전 확인용)" -ForegroundColor White
Write-Host "4. .\scripts\claude-status.ps1           # 이 상태 분석 스크립트" -ForegroundColor Cyan

Write-Host "
🔧 문제 해결:" -ForegroundColor Yellow
Write-Host "- Raw mode 오류 시: Windows Terminal 사용 (.\start-claude.bat)" -ForegroundColor White
Write-Host "- 신뢰 대화상자 시: 새 창에서 수동으로 '1' 입력" -ForegroundColor White
Write-Host "- 설정 문제 시: .\scripts\claude-trust-complete-fix.ps1 재실행" -ForegroundColor White

Write-Host "
✅ 프로젝트 상태 분석 완료!" -ForegroundColor Green
Write-Host "=" * 80 -ForegroundColor Cyan
