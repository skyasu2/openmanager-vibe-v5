@echo off
setlocal enabledelayedexpansion

:: 환경 변수 파일 암호화/복호화 배치 스크립트
:: 사용법:
::   암호화: secure_env.bat encrypt [비밀번호] [소스_파일] [암호화_파일]
::   복호화: secure_env.bat decrypt [비밀번호] [암호화_파일] [출력_파일]

if "%~4"=="" (
  echo 사용법: %0 [encrypt^|decrypt] [비밀번호] [입력_파일] [출력_파일]
  exit /b 1
)

set MODE=%~1
set PASSWORD=%~2
set INPUT_FILE=%~3
set OUTPUT_FILE=%~4

if "%MODE%"=="encrypt" (
  :: 파일 암호화 (AES-256-CBC 사용)
  openssl enc -aes-256-cbc -salt -in "%INPUT_FILE%" -out "%OUTPUT_FILE%" -pass pass:"%PASSWORD%"
  if !ERRORLEVEL! EQU 0 (
    echo ✅ %INPUT_FILE% 이(가) 암호화되어 %OUTPUT_FILE% 로 저장되었습니다.
  ) else (
    echo ❌ 암호화 실패: 오류가 발생했습니다.
    exit /b 1
  )
) else if "%MODE%"=="decrypt" (
  :: 파일 복호화
  if exist "%INPUT_FILE%" (
    openssl enc -d -aes-256-cbc -in "%INPUT_FILE%" -out "%OUTPUT_FILE%" -pass pass:"%PASSWORD%" 2>nul
    if !ERRORLEVEL! EQU 0 (
      echo ✅ %INPUT_FILE% 이(가) 복호화되어 %OUTPUT_FILE% 로 저장되었습니다.
    ) else (
      echo ❌ 복호화 실패: 잘못된 비밀번호이거나 파일이 손상되었습니다.
      if exist "%OUTPUT_FILE%" del "%OUTPUT_FILE%"
      exit /b 1
    )
  ) else (
    echo ❌ 오류: %INPUT_FILE% 을(를) 찾을 수 없습니다.
    exit /b 1
  )
) else (
  echo ❌ 잘못된 모드입니다. 'encrypt' 또는 'decrypt'를 지정해주세요.
  exit /b 1
)
