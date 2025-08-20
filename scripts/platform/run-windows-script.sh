#!/usr/bin/env bash
# WSL에서 Windows 스크립트를 실행하기 위한 래퍼
# 사용법: ./run-windows-script.sh <script_path> [args...]
#
# 예시:
# ./run-windows-script.sh ../windows/gcp-auth.bat
# ./run-windows-script.sh ../windows/port-forward.ps1 --port 8080

SCRIPT_PATH="$1"
shift # Remove script path from arguments

if [[ "${SCRIPT_PATH}" == *.ps1 ]]; then
    # PowerShell 스크립트 실행
    powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$(wslpath -w "${SCRIPT_PATH}")" "$@"
elif [[ "${SCRIPT_PATH}" == *.bat ]]; then
    # Batch 파일 실행
    cmd.exe /c "$(wslpath -w "${SCRIPT_PATH}")" "$@"
else
    echo "Error: Unsupported script type. Only .ps1 and .bat files are supported."
    exit 1
fi
