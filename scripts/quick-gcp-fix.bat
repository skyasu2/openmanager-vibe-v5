@echo off
REM GCP 빠른 인증 및 VM 접속
REM 작성일: 2025-08-14

echo.
echo ====================================
echo GCP VM 빠른 접속 도구
echo ====================================
echo.

REM 1. 브라우저로 인증 URL 열기
echo [1단계] 브라우저에서 인증하기
echo.
echo 아래 URL을 Ctrl+클릭하여 브라우저에서 열기:
echo.
echo https://accounts.google.com/o/oauth2/auth?client_id=32555940559.apps.googleusercontent.com^&redirect_uri=https://sdk.cloud.google.com/authcode.html^&response_type=code^&scope=https://www.googleapis.com/auth/cloud-platform
echo.
echo 브라우저에서:
echo 1. Google 계정 로그인
echo 2. 권한 승인
echo 3. 표시된 인증 코드 복사
echo.
pause

REM 2. gcloud 인증 실행
echo.
echo [2단계] gcloud 인증 실행
echo.
echo 새 CMD 창이 열립니다. 거기서:
echo 1. gcloud auth login 실행
echo 2. 브라우저 자동 열림
echo 3. 인증 완료 대기
echo.
start cmd /k "cd /d D:\cursor\openmanager-vibe-v5 && google-cloud-sdk\bin\gcloud.cmd auth login"

echo.
echo 인증이 완료되면 Enter를 누르세요...
pause > nul

REM 3. 프로젝트 설정
echo.
echo [3단계] 프로젝트 설정
google-cloud-sdk\bin\gcloud.cmd config set project openmanager-free-tier
google-cloud-sdk\bin\gcloud.cmd config set compute/zone us-central1-a

REM 4. VM 상태 확인
echo.
echo [4단계] VM 상태 확인
echo.
curl -s http://104.154.205.25:10000/health
echo.
echo.

REM 5. SSH 접속 준비
echo ====================================
echo 준비 완료!
echo ====================================
echo.
echo VM SSH 접속 명령어:
echo google-cloud-sdk\bin\gcloud.cmd compute ssh mcp-server --zone=us-central1-a
echo.
echo 또는 새 CMD 창에서:
echo.
start cmd /k "cd /d D:\cursor\openmanager-vibe-v5 && echo SSH 접속: google-cloud-sdk\bin\gcloud.cmd compute ssh mcp-server --zone=us-central1-a && echo."

pause