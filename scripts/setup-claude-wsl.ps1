# Claude Code WSL 설정 스크립트
# Windows의 Raw mode 문제를 WSL로 해결

Write-Host "🐧 Claude Code WSL 설정..." -ForegroundColor Green

Write-Host "`n📊 Windows vs WSL 비교:" -ForegroundColor Yellow
Write-Host "Windows 문제점:" -ForegroundColor Red
Write-Host "  ❌ Raw mode stdin 문제" -ForegroundColor White
Write-Host "  ❌ 신뢰 대화상자 처리 어려움" -ForegroundColor White
Write-Host "  ❌ 배치 파일 파이프 문제" -ForegroundColor White

Write-Host "`nWSL 장점:" -ForegroundColor Green
Write-Host "  ✅ 완전한 Linux 환경" -ForegroundColor White
Write-Host "  ✅ Raw mode 문제 없음" -ForegroundColor White
Write-Host "  ✅ 대화형 모드 완벽 지원" -ForegroundColor White
Write-Host "  ✅ 신뢰 대화상자 정상 처리" -ForegroundColor White

# 1. WSL 상태 확인
Write-Host "`n🔍 WSL 상태 확인..." -ForegroundColor Yellow

try {
    $wslStatus = wsl --status 2>$null
    if ($wslStatus) {
        Write-Host "✅ WSL이 설치되어 있습니다" -ForegroundColor Green
        
        # 설치된 배포판 확인
        $distributions = wsl --list --verbose 2>$null
        if ($distributions) {
            Write-Host "설치된 WSL 배포판:" -ForegroundColor Cyan
            $distributions | ForEach-Object { Write-Host "  $_" -ForegroundColor White }
        }
    } else {
        Write-Host "❌ WSL이 설치되지 않았습니다" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ WSL 상태 확인 실패: $_" -ForegroundColor Red
    Write-Host "💡 WSL 설치가 필요할 수 있습니다" -ForegroundColor Yellow
}

# 2. WSL에서 Claude Code 설치 스크립트 생성
Write-Host "`n📝 WSL Claude Code 설치 스크립트 생성..." -ForegroundColor Yellow

$wslInstallScript = @"
#!/bin/bash
# WSL에서 Claude Code 설치 및 설정 스크립트

echo "🐧 WSL에서 Claude Code 설치 시작..."

# Node.js 설치 확인
if ! command -v node &> /dev/null; then
    echo "📦 Node.js 설치 중..."
    curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    echo "✅ Node.js 이미 설치됨: `$(node --version)"
fi

# npm 업데이트
echo "📦 npm 업데이트 중..."
sudo npm install -g npm@latest

# Claude Code 설치
echo "🚀 Claude Code 설치 중..."
sudo npm install -g @anthropic-ai/claude-code

# 설치 확인
if command -v claude &> /dev/null; then
    echo "✅ Claude Code 설치 완료!"
    echo "버전: `$(claude --version)"
else
    echo "❌ Claude Code 설치 실패"
    exit 1
fi

# 환경변수 설정
echo "⚙️ 환경변수 설정..."
echo 'export HOME=`$HOME' >> ~/.bashrc
echo 'export CLAUDE_CONFIG_DIR="`$HOME/.claude"' >> ~/.bashrc

# 설정 디렉토리 생성
mkdir -p ~/.claude

echo "✅ WSL Claude Code 설정 완료!"
echo ""
echo "💡 사용법:"
echo "  claude --version    # 버전 확인"
echo "  claude doctor       # 진단"
echo "  claude /status      # 상태 확인"
echo ""
echo "🎯 프로젝트에서 사용하려면:"
echo "  cd /mnt/d/cursor/openmanager-vibe-v5"
echo "  claude"
"@

$wslScriptPath = "setup-claude-wsl.sh"
$wslInstallScript | Out-File -FilePath $wslScriptPath -Encoding UTF8 -Force
Write-Host "✅ WSL 설치 스크립트 생성: $wslScriptPath" -ForegroundColor Green

# 3. WSL 실행 래퍼 생성
Write-Host "`n🚀 WSL Claude Code 실행 래퍼 생성..." -ForegroundColor Yellow

$wslWrapper = @"
@echo off
REM WSL에서 Claude Code 실행 래퍼

echo 🐧 WSL에서 Claude Code를 실행합니다...
echo 📁 프로젝트: %CD%

REM Windows 경로를 WSL 경로로 변환
set "CURRENT_DIR=%CD%"
set "WSL_PATH=%CURRENT_DIR:D:\=/mnt/d/%"
set "WSL_PATH=%WSL_PATH:\=/%"

echo 🔄 WSL 경로: %WSL_PATH%

REM WSL에서 Claude Code 실행
wsl -e bash -c "cd '%WSL_PATH%' && claude %*"
"@

$wslWrapperPath = "claude-wsl.bat"
$wslWrapper | Out-File -FilePath $wslWrapperPath -Encoding ASCII -Force
Write-Host "✅ WSL 실행 래퍼 생성: $wslWrapperPath" -ForegroundColor Green

# 4. WSL 대화형 실행 래퍼
Write-Host "`n💬 WSL 대화형 실행 래퍼 생성..." -ForegroundColor Yellow

$wslInteractiveWrapper = @"
@echo off
REM WSL에서 Claude Code 대화형 실행

echo 🐧 WSL에서 Claude Code 대화형 모드를 실행합니다...
echo 📁 현재 디렉토리: %CD%

REM Windows 경로를 WSL 경로로 변환
set "CURRENT_DIR=%CD%"
set "WSL_PATH=%CURRENT_DIR:D:\=/mnt/d/%"
set "WSL_PATH=%WSL_PATH:\=/%"

echo 🔄 WSL 경로: %WSL_PATH%
echo ✅ 대화형 모드에서 모든 Claude Code 기능을 사용할 수 있습니다
echo.

REM WSL 터미널에서 대화형 실행
wsl -e bash -c "cd '%WSL_PATH%' && echo '🚀 Claude Code WSL 모드' && echo '📁 위치: %WSL_PATH%' && claude"
"@

$wslInteractivePath = "claude-wsl-interactive.bat"
$wslInteractiveWrapper | Out-File -FilePath $wslInteractivePath -Encoding ASCII -Force
Write-Host "✅ WSL 대화형 래퍼 생성: $wslInteractivePath" -ForegroundColor Green

# 5. 설치 및 사용 가이드
Write-Host "`n📖 WSL Claude Code 설치 및 사용 가이드:" -ForegroundColor Cyan

Write-Host "`n🔧 설치 단계:" -ForegroundColor Yellow
Write-Host "1. WSL 설치 (필요시):" -ForegroundColor White
Write-Host "   wsl --install" -ForegroundColor Cyan
Write-Host "   (재부팅 후 Ubuntu 설정 완료)" -ForegroundColor Gray

Write-Host "`n2. WSL에서 Claude Code 설치:" -ForegroundColor White
Write-Host "   wsl" -ForegroundColor Cyan
Write-Host "   chmod +x setup-claude-wsl.sh" -ForegroundColor Cyan
Write-Host "   ./setup-claude-wsl.sh" -ForegroundColor Cyan

Write-Host "`n🚀 사용 방법:" -ForegroundColor Yellow
Write-Host "1. 간단한 명령어:" -ForegroundColor White
Write-Host "   .\claude-wsl.bat --version" -ForegroundColor Cyan
Write-Host "   .\claude-wsl.bat doctor" -ForegroundColor Cyan

Write-Host "`n2. 대화형 모드 (권장):" -ForegroundColor White
Write-Host "   .\claude-wsl-interactive.bat" -ForegroundColor Cyan

Write-Host "`n3. 직접 WSL에서:" -ForegroundColor White
Write-Host "   wsl" -ForegroundColor Cyan
Write-Host "   cd /mnt/d/cursor/openmanager-vibe-v5" -ForegroundColor Cyan
Write-Host "   claude" -ForegroundColor Cyan

Write-Host "`n💡 WSL 장점:" -ForegroundColor Green
Write-Host "✅ Raw mode 문제 완전 해결" -ForegroundColor White
Write-Host "✅ 신뢰 대화상자 정상 처리" -ForegroundColor White
Write-Host "✅ 모든 대화형 기능 사용 가능" -ForegroundColor White
Write-Host "✅ Linux 환경의 안정성" -ForegroundColor White

Write-Host "`n🎯 다음 단계:" -ForegroundColor Yellow
Write-Host "1. WSL이 설치되어 있다면: .\claude-wsl-interactive.bat 실행" -ForegroundColor White
Write-Host "2. WSL이 없다면: wsl --install 후 재부팅" -ForegroundColor White
Write-Host "3. Claude Code 설치: WSL에서 ./setup-claude-wsl.sh 실행" -ForegroundColor White

Write-Host "`n✅ WSL Claude Code 설정 완료!" -ForegroundColor Green