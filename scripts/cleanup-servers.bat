@echo off
echo 🧹 중복 서버 정리 스크립트 (Windows)
echo.

echo 🔍 포트 3001, 3002, 3003에서 실행중인 프로세스 확인 중...
echo.

REM 포트 3001 정리
echo [포트 3001 확인]
for /f "tokens=5" %%i in ('netstat -ano ^| findstr :3001 ^| findstr LISTENING') do (
    echo 🎯 PID %%i 발견 - 종료 중...
    taskkill /PID %%i /F >nul 2>&1
    if !errorlevel! equ 0 (
        echo ✅ PID %%i 종료 완료
    ) else (
        echo ⚠️ PID %%i 종료 실패
    )
)

REM 포트 3002 정리
echo.
echo [포트 3002 확인]
for /f "tokens=5" %%i in ('netstat -ano ^| findstr :3002 ^| findstr LISTENING') do (
    echo 🎯 PID %%i 발견 - 종료 중...
    taskkill /PID %%i /F >nul 2>&1
    if !errorlevel! equ 0 (
        echo ✅ PID %%i 종료 완료
    ) else (
        echo ⚠️ PID %%i 종료 실패
    )
)

REM 포트 3003 정리
echo.
echo [포트 3003 확인]
for /f "tokens=5" %%i in ('netstat -ano ^| findstr :3003 ^| findstr LISTENING') do (
    echo 🎯 PID %%i 발견 - 종료 중...
    taskkill /PID %%i /F >nul 2>&1
    if !errorlevel! equ 0 (
        echo ✅ PID %%i 종료 완료
    ) else (
        echo ⚠️ PID %%i 종료 실패
    )
)

echo.
echo 🎉 중복 서버 정리 완료!
echo.
echo ⏳ 3초 후 새로운 서버를 시작할 수 있습니다...
timeout /t 3 /nobreak >nul

echo.
echo 💡 이제 'npm run dev' 명령어를 실행하세요!
echo.
pause 