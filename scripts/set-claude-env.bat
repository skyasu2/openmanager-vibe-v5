@echo off
REM Claude Code 환경변수 설정 스크립트

REM Claude 설정 디렉토리 설정
setx CLAUDE_CONFIG_DIR "%USERPROFILE%\.claude" 2>nul
if %errorlevel% equ 0 (
    echo ✅ CLAUDE_CONFIG_DIR 환경변수 설정 완료: %USERPROFILE%\.claude
) else (
    echo ⚠️  CLAUDE_CONFIG_DIR 환경변수 설정 실패
)

REM ccusage 캐시 디렉토리 설정 (선택사항)
setx CCUSAGE_CACHE_DIR "%USERPROFILE%\.ccusage\cache" 2>nul
if %errorlevel% equ 0 (
    echo ✅ CCUSAGE_CACHE_DIR 환경변수 설정 완료: %USERPROFILE%\.ccusage\cache
) else (
    echo ⚠️  CCUSAGE_CACHE_DIR 환경변수 설정 실패
)

REM 현재 세션에도 적용
set CLAUDE_CONFIG_DIR=%USERPROFILE%\.claude
set CCUSAGE_CACHE_DIR=%USERPROFILE%\.ccusage\cache

echo.
echo 📌 환경변수 설정 완료!
echo    새 터미널을 열어야 환경변수가 적용됩니다.
echo.
echo 현재 설정된 값:
echo CLAUDE_CONFIG_DIR = %CLAUDE_CONFIG_DIR%
echo CCUSAGE_CACHE_DIR = %CCUSAGE_CACHE_DIR%

pause