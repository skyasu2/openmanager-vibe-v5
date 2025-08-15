@echo off
title WSL Claude Code - %~n0

echo ?? WSL?? Claude Code ?? ?...
echo ?? ????: %CD%

REM Windows ??? WSL ??? ??
set "CURRENT_DIR=%CD%"
set "WSL_PATH=%CURRENT_DIR:D:\=/mnt/d/%"
set "WSL_PATH=%WSL_PATH:\=/%"

echo ?? WSL ??: %WSL_PATH%

REM WSL?? claude ??
wsl -e bash -c "cd '%WSL_PATH%' && claude %*"
