@echo off
chcp 65001 > nul
cls

echo.
echo ====================================
echo GCP VM Quick Access Tool
echo ====================================
echo.

echo [Step 1] Browser Authentication
echo.
echo Opening browser for Google authentication...
echo.

REM Open authentication URL
start https://accounts.google.com/o/oauth2/auth?client_id=32555940559.apps.googleusercontent.com^&redirect_uri=https://sdk.cloud.google.com/authcode.html^&response_type=code^&scope=https://www.googleapis.com/auth/cloud-platform

echo Browser opened. Please:
echo 1. Login with Google account
echo 2. Click Allow
echo 3. Complete authentication
echo.
echo Press any key after authentication...
pause > nul

echo.
echo [Step 2] Running gcloud auth
echo.

REM Try to authenticate
google-cloud-sdk\bin\gcloud auth login

echo.
echo [Step 3] Setting project
google-cloud-sdk\bin\gcloud config set project openmanager-free-tier
google-cloud-sdk\bin\gcloud config set compute/zone us-central1-a

echo.
echo [Step 4] Checking VM status
echo.
curl -s http://104.154.205.25:10000/health
echo.
echo.

echo ====================================
echo Setup Complete!
echo ====================================
echo.
echo SSH command:
echo google-cloud-sdk\bin\gcloud compute ssh mcp-server --zone=us-central1-a
echo.

pause