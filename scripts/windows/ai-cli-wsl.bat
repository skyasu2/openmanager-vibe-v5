@echo off
title WSL AI CLI Tools - %1

if "%1"=="" (
    echo.
    echo ?? WSL AI CLI ???
    echo ==================
    echo.
    echo ???: %0 [???] [???]
    echo.
    echo ?? ??? ???:
    echo   claude    - Claude Code
    echo   gemini    - Google Gemini CLI
    echo   openai    - OpenAI CLI
    echo   qwen      - Qwen CLI
    echo.
    echo ??:
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

REM Windows ??? WSL ??? ??
set "CURRENT_DIR=%CD%"
set "WSL_PATH=%CURRENT_DIR:D:\=/mnt/d/%"
set "WSL_PATH=%WSL_PATH:\=/%"

echo ?? WSL?? %TOOL% ?? ?...
echo ?? ????: %WSL_PATH%

REM WSL?? ?? ?? ??
wsl -e bash -c "cd '%WSL_PATH%' && %TOOL% %*"
