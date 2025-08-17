# Windows에서 WSL 스크립트를 실행하기 위한 래퍼
# 사용법: .\run-wsl-script.ps1 <script_path> [args...]
#
# 예시:
# .\run-wsl-script.ps1 ../wsl/setup-dev.sh
# .\run-wsl-script.ps1 ../wsl/install-deps.sh --dev

param(
    [Parameter(Mandatory=$true)]
    [string]$ScriptPath,
    
    [Parameter(ValueFromRemainingArguments=$true)]
    $Arguments
)

# WSL 경로로 변환 및 실행
$WslPath = $ScriptPath.Replace("\", "/")
$WslArgs = $Arguments -join " "

# WSL에서 스크립트 실행
wsl bash -lc "bash $WslPath $WslArgs"
