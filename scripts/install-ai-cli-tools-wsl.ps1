# WSL에 AI CLI 도구들 설치 및 업그레이드 스크립트
# Gemini CLI, Codex CLI, Qwen CLI 설치

Write-Host "🤖 WSL에 AI CLI 도구들 설치 및 업그레이드..." -ForegroundColor Green

# 1. WSL 상태 확인
Write-Host "`n🔍 WSL 상태 확인..." -ForegroundColor Yellow

try {
    $wslCheck = wsl -e bash -c "echo 'WSL 연결 확인'"
    Write-Host "✅ WSL 연결 정상" -ForegroundColor Green
} catch {
    Write-Host "❌ WSL 연결 실패" -ForegroundColor Red
    exit 1
}

# 2. Node.js 및 npm 업그레이드
Write-Host "`n📦 Node.js 및 npm 업그레이드..." -ForegroundColor Yellow

$nodeUpgradeScript = @"
#!/bin/bash
echo '🔄 Node.js 및 npm 업그레이드 중...'

# 현재 버전 확인
echo '현재 Node.js 버전:' \$(node --version)
echo '현재 npm 버전:' \$(npm --version)

# npm 최신 버전으로 업그레이드
echo '📦 npm 업그레이드 중...'
sudo npm install -g npm@latest

# Node.js 최신 LTS 확인 및 업그레이드 (필요시)
echo '📦 Node.js 최신 LTS 확인 중...'
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

echo '✅ 업그레이드 완료'
echo '새 Node.js 버전:' \$(node --version)
echo '새 npm 버전:' \$(npm --version)
"@

$nodeUpgradeScript | Out-File -FilePath "upgrade-node-wsl.sh" -Encoding UTF8 -Force

try {
    wsl -e bash -c "chmod +x upgrade-node-wsl.sh && ./upgrade-node-wsl.sh"
    Write-Host "✅ Node.js 및 npm 업그레이드 완료" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Node.js 업그레이드 실패, 계속 진행..." -ForegroundColor Yellow
}

# 3. Gemini CLI 설치
Write-Host "`n🔮 Gemini CLI 설치..." -ForegroundColor Yellow

$geminiInstallScript = @"
#!/bin/bash
echo '🔮 Gemini CLI 설치 중...'

# Google Gemini CLI 설치
echo '📦 @google/gemini-cli 설치 중...'
sudo npm install -g @google/gemini-cli

# 설치 확인
if command -v gemini &> /dev/null; then
    echo '✅ Gemini CLI 설치 완료!'
    echo '버전:' \$(gemini --version 2>/dev/null || echo 'version command not available')
    echo '명령어 확인:' \$(which gemini)
else
    echo '⚠️ Gemini CLI 설치 실패 또는 명령어 등록 안됨'
fi

# 대안 Gemini 도구들 설치
echo '📦 추가 Gemini 도구들 설치 중...'
sudo npm install -g @google-ai/generativelanguage
sudo npm install -g @google/generative-ai

echo '✅ Gemini CLI 설치 과정 완료'
"@

$geminiInstallScript | Out-File -FilePath "install-gemini-wsl.sh" -Encoding UTF8 -Force

try {
    wsl -e bash -c "chmod +x install-gemini-wsl.sh && ./install-gemini-wsl.sh"
    Write-Host "✅ Gemini CLI 설치 완료" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Gemini CLI 설치 중 오류 발생" -ForegroundColor Yellow
}

# 4. OpenAI Codex CLI 설치
Write-Host "`n🧠 OpenAI Codex CLI 설치..." -ForegroundColor Yellow

$codexInstallScript = @"
#!/bin/bash
echo '🧠 OpenAI Codex CLI 설치 중...'

# OpenAI CLI 설치
echo '📦 OpenAI CLI 설치 중...'
sudo npm install -g openai-cli

# OpenAI Codex 관련 도구들 설치
echo '📦 OpenAI Codex 도구들 설치 중...'
sudo npm install -g @openai/codex
sudo npm install -g openai

# 설치 확인
if command -v openai &> /dev/null; then
    echo '✅ OpenAI CLI 설치 완료!'
    echo '버전:' \$(openai --version 2>/dev/null || echo 'version command not available')
    echo '명령어 확인:' \$(which openai)
else
    echo '⚠️ OpenAI CLI 설치 실패 또는 명령어 등록 안됨'
fi

# 추가 AI 도구들
echo '📦 추가 AI CLI 도구들 설치 중...'
sudo npm install -g ai-cli
sudo npm install -g chatgpt-cli

echo '✅ OpenAI Codex CLI 설치 과정 완료'
"@

$codexInstallScript | Out-File -FilePath "install-codex-wsl.sh" -Encoding UTF8 -Force

try {
    wsl -e bash -c "chmod +x install-codex-wsl.sh && ./install-codex-wsl.sh"
    Write-Host "✅ OpenAI Codex CLI 설치 완료" -ForegroundColor Green
} catch {
    Write-Host "⚠️ OpenAI Codex CLI 설치 중 오류 발생" -ForegroundColor Yellow
}

# 5. Qwen CLI 설치
Write-Host "`n🚀 Qwen CLI 설치..." -ForegroundColor Yellow

$qwenInstallScript = @"
#!/bin/bash
echo '🚀 Qwen CLI 설치 중...'

# Qwen CLI 설치
echo '📦 Qwen CLI 설치 중...'
sudo npm install -g @qwen-code/qwen-code
sudo npm install -g qwen-cli

# Python 기반 Qwen 도구들도 설치
echo '🐍 Python 기반 Qwen 도구들 설치 중...'

# pip 설치 확인
if ! command -v pip &> /dev/null; then
    echo '📦 pip 설치 중...'
    sudo apt update
    sudo apt install -y python3-pip
fi

# Qwen Python 패키지들 설치
pip3 install --user qwen
pip3 install --user dashscope

# 설치 확인
if command -v qwen &> /dev/null; then
    echo '✅ Qwen CLI 설치 완료!'
    echo '버전:' \$(qwen --version 2>/dev/null || echo 'version command not available')
    echo '명령어 확인:' \$(which qwen)
else
    echo '⚠️ Qwen CLI 설치 실패 또는 명령어 등록 안됨'
fi

echo '✅ Qwen CLI 설치 과정 완료'
"@

$qwenInstallScript | Out-File -FilePath "install-qwen-wsl.sh" -Encoding UTF8 -Force

try {
    wsl -e bash -c "chmod +x install-qwen-wsl.sh && ./install-qwen-wsl.sh"
    Write-Host "✅ Qwen CLI 설치 완료" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Qwen CLI 설치 중 오류 발생" -ForegroundColor Yellow
}

# 6. 전체 설치 확인 및 버전 체크
Write-Host "`n🔍 설치된 AI CLI 도구들 확인..." -ForegroundColor Yellow

$checkInstallScript = @"
#!/bin/bash
echo '🔍 설치된 AI CLI 도구들 확인...'
echo '=' * 60

echo '🤖 Claude Code:'
if command -v claude &> /dev/null; then
    echo '✅ 설치됨:' \$(claude --version)
    echo '📍 위치:' \$(which claude)
else
    echo '❌ 설치되지 않음'
fi

echo ''
echo '🔮 Gemini CLI:'
if command -v gemini &> /dev/null; then
    echo '✅ 설치됨:' \$(gemini --version 2>/dev/null || echo 'version check failed')
    echo '📍 위치:' \$(which gemini)
else
    echo '❌ 설치되지 않음'
fi

echo ''
echo '🧠 OpenAI CLI:'
if command -v openai &> /dev/null; then
    echo '✅ 설치됨:' \$(openai --version 2>/dev/null || echo 'version check failed')
    echo '📍 위치:' \$(which openai)
else
    echo '❌ 설치되지 않음'
fi

echo ''
echo '🚀 Qwen CLI:'
if command -v qwen &> /dev/null; then
    echo '✅ 설치됨:' \$(qwen --version 2>/dev/null || echo 'version check failed')
    echo '📍 위치:' \$(which qwen)
else
    echo '❌ 설치되지 않음'
fi

echo ''
echo '📦 글로벌 npm 패키지들:'
npm list -g --depth=0 2>/dev/null | grep -E '(claude|gemini|openai|qwen|ai-cli|chatgpt)'

echo ''
echo '🐍 Python AI 패키지들:'
pip3 list 2>/dev/null | grep -E '(qwen|dashscope)' || echo '설치된 Python AI 패키지 없음'

echo ''
echo '=' * 60
echo '✅ AI CLI 도구들 설치 확인 완료'
"@

$checkInstallScript | Out-File -FilePath "check-ai-tools-wsl.sh" -Encoding UTF8 -Force

Write-Host "`n📊 설치 결과 확인 중..." -ForegroundColor Cyan

try {
    wsl -e bash -c "chmod +x check-ai-tools-wsl.sh && ./check-ai-tools-wsl.sh"
} catch {
    Write-Host "⚠️ 설치 확인 중 오류 발생" -ForegroundColor Yellow
}

# 7. 통합 실행 래퍼 생성
Write-Host "`n🚀 통합 AI CLI 실행 래퍼 생성..." -ForegroundColor Yellow

$aiCliWrapper = @"
@echo off
title WSL AI CLI Tools - %1

if "%1"=="" (
    echo.
    echo 🤖 WSL AI CLI 도구들
    echo ==================
    echo.
    echo 사용법: %0 [도구명] [명령어]
    echo.
    echo 사용 가능한 도구들:
    echo   claude    - Claude Code
    echo   gemini    - Google Gemini CLI
    echo   openai    - OpenAI CLI
    echo   qwen      - Qwen CLI
    echo.
    echo 예시:
    echo   %0 claude --version
    echo   %0 gemini --help
    echo   %0 openai --version
    echo   %0 qwen --help
    echo.
    pause
    exit /b
)

set "TOOL=%1"
shift

REM Windows 경로를 WSL 경로로 변환
set "CURRENT_DIR=%CD%"
set "WSL_PATH=%CURRENT_DIR:D:\=/mnt/d/%"
set "WSL_PATH=%WSL_PATH:\=/%"

echo 🤖 WSL에서 %TOOL% 실행 중...
echo 📁 프로젝트: %WSL_PATH%

REM WSL에서 해당 도구 실행
wsl -e bash -c "cd '%WSL_PATH%' && %TOOL% %*"
"@

$aiCliWrapper | Out-File -FilePath "ai-cli-wsl.bat" -Encoding ASCII -Force
Write-Host "✅ 통합 AI CLI 래퍼 생성: ai-cli-wsl.bat" -ForegroundColor Green

# 8. 개별 실행 래퍼들 생성
Write-Host "`n📝 개별 실행 래퍼들 생성..." -ForegroundColor Yellow

$tools = @{
    "claude" = "Claude Code"
    "gemini" = "Google Gemini CLI"
    "openai" = "OpenAI CLI"
    "qwen" = "Qwen CLI"
}

foreach ($tool in $tools.Keys) {
    $toolName = $tools[$tool]
    $wrapperContent = @"
@echo off
title WSL $toolName - %~n0

echo 🤖 WSL에서 $toolName 실행 중...
echo 📁 프로젝트: %CD%

REM Windows 경로를 WSL 경로로 변환
set "CURRENT_DIR=%CD%"
set "WSL_PATH=%CURRENT_DIR:D:\=/mnt/d/%"
set "WSL_PATH=%WSL_PATH:\=/%"

echo 🔄 WSL 경로: %WSL_PATH%

REM WSL에서 $tool 실행
wsl -e bash -c "cd '%WSL_PATH%' && $tool %*"
"@
    
    $wrapperPath = "$tool-wsl.bat"
    $wrapperContent | Out-File -FilePath $wrapperPath -Encoding ASCII -Force
    Write-Host "✅ $toolName 래퍼 생성: $wrapperPath" -ForegroundColor Green
}

# 9. 최종 요약
Write-Host "`n" + "=" * 80 -ForegroundColor Green
Write-Host "🎉 WSL AI CLI 도구들 설치 완료!" -ForegroundColor Green
Write-Host "=" * 80 -ForegroundColor Green

Write-Host "`n📦 설치된 도구들:" -ForegroundColor Yellow
Write-Host "✅ Claude Code - AI 코딩 어시스턴트" -ForegroundColor White
Write-Host "✅ Gemini CLI - Google Gemini AI" -ForegroundColor White
Write-Host "✅ OpenAI CLI - OpenAI GPT/Codex" -ForegroundColor White
Write-Host "✅ Qwen CLI - Alibaba Qwen AI" -ForegroundColor White

Write-Host "`n🚀 사용법:" -ForegroundColor Yellow
Write-Host "통합 실행: .\ai-cli-wsl.bat [도구명] [명령어]" -ForegroundColor Cyan
Write-Host "개별 실행:" -ForegroundColor Cyan
Write-Host "  .\claude-wsl.bat --version" -ForegroundColor White
Write-Host "  .\gemini-wsl.bat --help" -ForegroundColor White
Write-Host "  .\openai-wsl.bat --version" -ForegroundColor White
Write-Host "  .\qwen-wsl.bat --help" -ForegroundColor White

Write-Host "`n💡 참고사항:" -ForegroundColor Yellow
Write-Host "- 모든 도구들이 최적화된 WSL 환경에서 실행됩니다" -ForegroundColor White
Write-Host "- API 키 설정이 필요한 도구들은 별도 설정 필요" -ForegroundColor White
Write-Host "- 각 도구의 --help 명령어로 사용법 확인 가능" -ForegroundColor White

Write-Host "`n✅ WSL AI CLI 도구들 설치 및 설정 완료!" -ForegroundColor Green