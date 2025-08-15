@echo off
title WSL Google Gemini CLI - %~n0

echo ?? WSL?? Google Gemini CLI ?? ?...
echo ?? ????: %CD%

REM Windows ??? WSL ??? ??
set "CURRENT_DIR=%CD%"
set "WSL_PATH=%CURRENT_DIR:D:\=/mnt/d/%"
set "WSL_PATH=%WSL_PATH:\=/%"

echo ?? WSL ??: %WSL_PATH%

REM WSL?? gemini ??
wsl -e bash -c "cd '%WSL_PATH%' && gemini %*"
