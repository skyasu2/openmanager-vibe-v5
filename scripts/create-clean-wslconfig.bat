@echo off
REM 완전히 깨끗한 .wslconfig 파일 생성
echo 🔧 .wslconfig 파일 완전 재생성 중...

REM 기존 파일 삭제 (문제가 있는 파일 제거)
if exist "%USERPROFILE%\.wslconfig" (
    echo 📁 기존 문제 파일 삭제 중...
    del "%USERPROFILE%\.wslconfig"
)

REM 완전히 새로운 파일 생성 (UTF-8 BOM 없이)
echo [wsl2]> "%USERPROFILE%\.wslconfig"
echo networkingMode=mirrored>> "%USERPROFILE%\.wslconfig"
echo dnsTunneling=true>> "%USERPROFILE%\.wslconfig"
echo autoProxy=true>> "%USERPROFILE%\.wslconfig"
echo firewall=true>> "%USERPROFILE%\.wslconfig"
echo memory=12GB>> "%USERPROFILE%\.wslconfig"
echo processors=6>> "%USERPROFILE%\.wslconfig"
echo swap=2GB>> "%USERPROFILE%\.wslconfig"
echo autoMemoryReclaim=gradual>> "%USERPROFILE%\.wslconfig"
echo guiApplications=true>> "%USERPROFILE%\.wslconfig"
echo debugConsole=false>> "%USERPROFILE%\.wslconfig"
echo.>> "%USERPROFILE%\.wslconfig"
echo [experimental]>> "%USERPROFILE%\.wslconfig"
echo sparseVhd=true>> "%USERPROFILE%\.wslconfig"
echo useWindowsDriver=true>> "%USERPROFILE%\.wslconfig"
echo hostAddressLoopback=true>> "%USERPROFILE%\.wslconfig"
echo.>> "%USERPROFILE%\.wslconfig"
echo [user]>> "%USERPROFILE%\.wslconfig"
echo default=skyasu>> "%USERPROFILE%\.wslconfig"

echo ✅ 새로운 .wslconfig 파일 생성 완료!
echo 📄 파일 위치: %USERPROFILE%\.wslconfig
echo.
echo 🔄 다음 단계:
echo 1. wsl --shutdown
echo 2. 10초 대기
echo 3. WSL 재시작
echo.

REM 파일 내용 확인
echo 📋 생성된 파일 내용:
type "%USERPROFILE%\.wslconfig"

pause