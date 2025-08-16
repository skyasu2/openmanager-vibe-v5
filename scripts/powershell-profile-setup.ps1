# PowerShell 프로필 설정 스크립트
# Kiro IDE 터미널 워크스페이스 경로 초기화

# 프로필 파일 경로 확인
$profilePath = $PROFILE
$profileDir = Split-Path $profilePath -Parent

# 프로필 디렉토리가 없으면 생성
if (!(Test-Path $profileDir)) {
    New-Item -ItemType Directory -Path $profileDir -Force
    Write-Host "프로필 디렉토리 생성: $profileDir" -ForegroundColor Green
}

# 프로필 내용 정의
$profileContent = @"
# Kiro IDE / VSCode 터미널 워크스페이스 자동 이동 설정
# 생성일: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')

# VSCode/Kiro에서 실행될 때 워크스페이스로 자동 이동
if (`$env:VSCODE_PID -or `$env:TERM_PROGRAM -eq "vscode" -or `$env:KIRO_PID) {
    if (`$env:VSCODE_CWD) {
        Set-Location `$env:VSCODE_CWD
        Write-Host "워크스페이스로 이동: `$env:VSCODE_CWD" -ForegroundColor Cyan
    } elseif (`$PWD.Path -eq `$env:USERPROFILE -and (Test-Path "D:\cursor\openmanager-vibe-v5")) {
        Set-Location "D:\cursor\openmanager-vibe-v5"
        Write-Host "프로젝트 루트로 이동: D:\cursor\openmanager-vibe-v5" -ForegroundColor Cyan
    }
}

# 프롬프트 커스터마이징 (선택사항)
function prompt {
    `$currentPath = `$PWD.Path
    `$projectRoot = "D:\cursor\openmanager-vibe-v5"
    
    if (`$currentPath.StartsWith(`$projectRoot)) {
        `$relativePath = `$currentPath.Substring(`$projectRoot.Length)
        if (`$relativePath -eq "") { `$relativePath = "\" }
        Write-Host "openmanager" -NoNewline -ForegroundColor Yellow
        Write-Host `$relativePath -NoNewline -ForegroundColor White
    } else {
        Write-Host `$currentPath -NoNewline -ForegroundColor White
    }
    
    return "> "
}

# 유용한 별칭 추가
Set-Alias -Name ll -Value Get-ChildItem
Set-Alias -Name la -Value Get-ChildItem

# 프로젝트 관련 함수
function Go-Project { Set-Location "D:\cursor\openmanager-vibe-v5" }
Set-Alias -Name proj -Value Go-Project

function Go-Src { Set-Location "D:\cursor\openmanager-vibe-v5\src" }
Set-Alias -Name src -Value Go-Src

Write-Host "Kiro IDE PowerShell 프로필 로드 완료!" -ForegroundColor Green
"@

# 기존 프로필이 있으면 백업
if (Test-Path $profilePath) {
    $backupPath = "$profilePath.backup.$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    Copy-Item $profilePath $backupPath
    Write-Host "기존 프로필 백업: $backupPath" -ForegroundColor Yellow
}

# 새 프로필 생성
$profileContent | Out-File -FilePath $profilePath -Encoding UTF8 -Force
Write-Host "PowerShell 프로필 생성 완료: $profilePath" -ForegroundColor Green

Write-Host "`n설정 완료! 새 터미널을 열면 자동으로 워크스페이스 폴더로 이동합니다." -ForegroundColor Cyan
Write-Host "프로필 적용을 위해 PowerShell을 다시 시작하거나 다음 명령을 실행하세요:" -ForegroundColor White
Write-Host ". `$PROFILE" -ForegroundColor Yellow