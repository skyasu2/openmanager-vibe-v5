# 프로젝트 구조 재구성 스크립트
# Windows → WSL 환경 전환에 따른 파일 정리

Write-Host "🔄 프로젝트 구조 재구성 (Windows → WSL 전환)..." -ForegroundColor Green

# 1. Windows 레거시 폴더 생성
Write-Host "`n📁 Windows 레거시 폴더 생성..." -ForegroundColor Yellow

$windowsLegacyDir = "scripts/windows-legacy"
if (!(Test-Path $windowsLegacyDir)) {
    New-Item -ItemType Directory -Path $windowsLegacyDir -Force | Out-Null
    Write-Host "✅ 생성됨: $windowsLegacyDir" -ForegroundColor Green
}

# 2. Windows 전용 스크립트 식별 및 이동
Write-Host "`n🔄 Windows 전용 스크립트 이동..." -ForegroundColor Yellow

$windowsScripts = @(
    "fix-claude-path-error.ps1",
    "fix-claude-cli-permanently.ps1", 
    "claude-ultimate-solution.ps1",
    "claude-trust-complete-fix.ps1",
    "fix-alias-final.ps1",
    "fix-powershell-alias-conflict.ps1",
    "claude-raw-mode-fix.ps1",
    "claude-trust-and-status.ps1",
    "claude-code-project-fix.ps1",
    "claude-final-fix.ps1",
    "claude-reinstall-fix.ps1",
    "fix-claude-config-complete.ps1",
    "fix-claude-config-mismatch.ps1",
    "cleanup-windows-cli-tools.ps1",
    "windows-cleanup-verification.ps1",
    "final-cleanup.ps1",
    "final-status-report.ps1",
    "fix-wsl-config-warnings.ps1"
)

$movedCount = 0
foreach ($script in $windowsScripts) {
    $sourcePath = "scripts/$script"
    $destPath = "$windowsLegacyDir/$script"
    
    if (Test-Path $sourcePath) {
        Move-Item $sourcePath $destPath -Force
        Write-Host "✅ 이동됨: $script" -ForegroundColor Green
        $movedCount++
    }
}

Write-Host "📊 총 $movedCount개 Windows 스크립트 이동 완료" -ForegroundColor Cyan

# 3. WSL 관련 스크립트 유지 및 정리
Write-Host "`n🐧 WSL 관련 스크립트 정리..." -ForegroundColor Yellow

$wslScripts = @(
    "setup-wsl-sudo-nopasswd.ps1",
    "optimize-wsl-config.ps1", 
    "install-ai-cli-tools-wsl.ps1",
    "setup-claude-wsl.ps1",
    "ai-cli-status-summary.ps1"
)

Write-Host "✅ 유지되는 WSL 스크립트들:" -ForegroundColor Green
foreach ($script in $wslScripts) {
    if (Test-Path "scripts/$script") {
        Write-Host "  - $script" -ForegroundColor Cyan
    }
}

# 4. 불필요한 파일 삭제
Write-Host "`n🗑️ 불필요한 파일 삭제..." -ForegroundColor Yellow

$filesToDelete = @(
    "setup-sudo-direct.sh",
    "wsl-convenience-setup.sh",
    "auto-sudo-setup.sh",
    "additional-wsl-setup.sh",
    "upgrade-node-wsl.sh",
    "install-claude-wsl.sh",
    "install-gemini-wsl.sh", 
    "install-codex-wsl.sh",
    "install-qwen-wsl.sh",
    "check-ai-tools-wsl.sh",
    "optimize-wsl-distro.sh",
    "restart-wsl-test.bat"
)

$deletedCount = 0
foreach ($file in $filesToDelete) {
    if (Test-Path $file) {
        Remove-Item $file -Force
        Write-Host "✅ 삭제됨: $file" -ForegroundColor Green
        $deletedCount++
    }
}

Write-Host "📊 총 $deletedCount개 불필요한 파일 삭제 완료" -ForegroundColor Cyan

# 5. WSL 실행 래퍼들 정리
Write-Host "`n🚀 WSL 실행 래퍼 정리..." -ForegroundColor Yellow

$wslWrappers = @(
    "claude-wsl-optimized.bat",
    "claude-wsl.bat", 
    "gemini-wsl.bat",
    "openai-wsl.bat",
    "qwen-wsl.bat",
    "ai-cli-wsl.bat"
)

Write-Host "✅ 유지되는 WSL 실행 래퍼들:" -ForegroundColor Green
foreach ($wrapper in $wslWrappers) {
    if (Test-Path $wrapper) {
        Write-Host "  - $wrapper" -ForegroundColor Cyan
    }
}

# 6. README 생성 (Windows 레거시 폴더용)
Write-Host "`n📝 Windows 레거시 README 생성..." -ForegroundColor Yellow

$legacyReadme = @"
# Windows 레거시 스크립트

이 폴더에는 Windows 환경에서 Claude Code를 실행하기 위해 작성된 레거시 스크립트들이 보관되어 있습니다.

## 배경

2025년 8월 15일, 개발 환경을 Windows PowerShell에서 WSL 2로 전환하면서 다음과 같은 문제들이 해결되었습니다:

### Windows 환경 문제점
- Raw mode stdin 문제로 Claude Code 대화형 모드 실행 불가
- 환경변수 해석 오류 (`:USERPROFILE` 문제)
- PowerShell 별칭 충돌 (`cp` 명령어)
- 신뢰 대화상자 자동 처리 어려움

### WSL 환경 장점
- 완전한 Linux 환경에서 모든 AI CLI 도구 정상 작동
- Raw mode 문제 완전 해결
- sudo 비밀번호 없이 사용 가능
- 10GB 메모리, 8GB 스왑으로 최적화

## 레거시 스크립트 목록

### Claude Code 문제 해결
- `fix-claude-path-error.ps1` - 경로 오류 수정
- `fix-claude-cli-permanently.ps1` - 영구 수정
- `claude-ultimate-solution.ps1` - 종합 해결책
- `claude-trust-complete-fix.ps1` - 신뢰 설정 수정

### PowerShell 환경 수정
- `fix-powershell-alias-conflict.ps1` - 별칭 충돌 해결
- `fix-alias-final.ps1` - 최종 별칭 수정

### Windows CLI 도구 정리
- `cleanup-windows-cli-tools.ps1` - Windows CLI 도구 제거
- `windows-cleanup-verification.ps1` - 정리 상태 확인
- `final-cleanup.ps1` - 최종 정리
- `final-status-report.ps1` - 최종 상태 보고

## 현재 상태

**✅ 해결 완료**: 모든 AI CLI 도구가 WSL에서 완벽하게 작동
**🗂️ 보관**: 이 스크립트들은 참고용으로 보관됨
**🚀 현재 사용**: WSL 실행 래퍼들 (`claude-wsl-optimized.bat` 등)

## 사용법 (참고용)

이 스크립트들은 더 이상 사용되지 않지만, Windows 환경에서 Claude Code 문제 해결이 필요한 경우 참고할 수 있습니다.

```powershell
# 예시 (사용하지 마세요)
.\fix-claude-cli-permanently.ps1
.\cleanup-windows-cli-tools.ps1
```

**권장**: WSL 환경 사용
```bash
# 현재 권장 방법
.\claude-wsl-optimized.bat
```

---
생성일: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
"@

$legacyReadme | Out-File -FilePath "$windowsLegacyDir/README.md" -Encoding UTF8 -Force
Write-Host "✅ Windows 레거시 README 생성 완료" -ForegroundColor Green

# 7. 최종 요약
Write-Host "`n" + "=" * 80 -ForegroundColor Green
Write-Host "🎉 프로젝트 구조 재구성 완료!" -ForegroundColor Green
Write-Host "=" * 80 -ForegroundColor Green

Write-Host "`n📊 작업 요약:" -ForegroundColor Yellow
Write-Host "✅ Windows 레거시 스크립트: $movedCount개 이동" -ForegroundColor White
Write-Host "✅ 불필요한 파일: $deletedCount개 삭제" -ForegroundColor White
Write-Host "✅ WSL 실행 래퍼: 6개 유지" -ForegroundColor White
Write-Host "✅ WSL 관리 스크립트: 5개 유지" -ForegroundColor White

Write-Host "`n🎯 현재 구조:" -ForegroundColor Yellow
Write-Host "📁 scripts/windows-legacy/ - Windows 레거시 스크립트 보관" -ForegroundColor Cyan
Write-Host "📁 scripts/ - WSL 관련 스크립트만 유지" -ForegroundColor Cyan
Write-Host "📄 *.bat - WSL 실행 래퍼들 (프로젝트 루트)" -ForegroundColor Cyan

Write-Host "`n✅ 프로젝트가 WSL 환경에 최적화되었습니다!" -ForegroundColor Green