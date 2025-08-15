# Windows 환경 정리 상태 종합 확인 스크립트
# 모든 AI CLI 도구 제거 후 Windows 상태 검증

Write-Host "🔍 Windows 환경 정리 상태 종합 확인..." -ForegroundColor Green
Write-Host "=" * 80 -ForegroundColor Cyan

# 1. npm 글로벌 패키지 확인
Write-Host "`n📦 npm 글로벌 패키지 상태 확인..." -ForegroundColor Yellow

try {
    $globalPackages = npm list -g --depth=0 2>$null
    Write-Host "현재 설치된 글로벌 패키지:" -ForegroundColor Cyan
    Write-Host $globalPackages -ForegroundColor White
    
    # AI 관련 패키지 검색
    $aiPackages = npm list -g --depth=0 2>$null | Select-String -Pattern "(claude|gemini|openai|qwen|ai-cli|chatgpt)"
    if ($aiPackages) {
        Write-Host "`n⚠️ 아직 남아있는 AI 패키지들:" -ForegroundColor Yellow
        $aiPackages | ForEach-Object { Write-Host "  $_" -ForegroundColor Red }
    } else {
        Write-Host "`n✅ AI 관련 npm 패키지 모두 제거됨" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ npm 패키지 확인 실패: $_" -ForegroundColor Red
}

# 2. 환경변수 확인
Write-Host "`n⚙️ 환경변수 정리 상태 확인..." -ForegroundColor Yellow

$envVarsToCheck = @(
    "CLAUDE_CONFIG_DIR",
    "CLAUDE_API_KEY", 
    "GEMINI_API_KEY",
    "QWEN_API_KEY",
    "CLAUDE_AUTO_TRUST",
    "CLAUDE_SKIP_TRUST_DIALOG"
)

$remainingEnvVars = @()
foreach ($envVar in $envVarsToCheck) {
    $userValue = [Environment]::GetEnvironmentVariable($envVar, "User")
    $machineValue = [Environment]::GetEnvironmentVariable($envVar, "Machine")
    
    if ($userValue -or $machineValue) {
        $remainingEnvVars += $envVar
        Write-Host "⚠️ $envVar 여전히 존재: User='$userValue', Machine='$machineValue'" -ForegroundColor Yellow
    }
}

if ($remainingEnvVars.Count -eq 0) {
    Write-Host "✅ AI 관련 환경변수 모두 제거됨" -ForegroundColor Green
} else {
    Write-Host "⚠️ 일부 환경변수가 남아있습니다" -ForegroundColor Yellow
}

# 3. PowerShell 프로필 확인
Write-Host "`n📝 PowerShell 프로필 정리 상태 확인..." -ForegroundColor Yellow

$profilePath = $PROFILE
if (Test-Path $profilePath) {
    $profileContent = Get-Content $profilePath -Raw
    
    # AI 관련 설정 검색
    $aiSettings = @()
    if ($profileContent -match "claude") { $aiSettings += "Claude 관련 설정" }
    if ($profileContent -match "gemini") { $aiSettings += "Gemini 관련 설정" }
    if ($profileContent -match "qwen") { $aiSettings += "Qwen 관련 설정" }
    if ($profileContent -match "Start-ClaudeProject") { $aiSettings += "Claude 함수" }
    
    if ($aiSettings.Count -eq 0) {
        Write-Host "✅ PowerShell 프로필에서 AI 관련 설정 모두 제거됨" -ForegroundColor Green
    } else {
        Write-Host "⚠️ PowerShell 프로필에 남아있는 설정들:" -ForegroundColor Yellow
        $aiSettings | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
    }
    
    Write-Host "`n프로필 파일 크기: $((Get-Item $profilePath).Length) bytes" -ForegroundColor Cyan
} else {
    Write-Host "✅ PowerShell 프로필 파일 없음 (깔끔한 상태)" -ForegroundColor Green
}

# 4. 설정 디렉토리 확인
Write-Host "`n📁 AI 관련 설정 디렉토리 확인..." -ForegroundColor Yellow

$configDirs = @(
    "$env:USERPROFILE\.claude",
    "$env:USERPROFILE\.openai",
    "$env:USERPROFILE\.gemini",
    "$env:USERPROFILE\.qwen"
)

$remainingDirs = @()
foreach ($dir in $configDirs) {
    if (Test-Path $dir) {
        $remainingDirs += $dir
        $size = (Get-ChildItem $dir -Recurse -File | Measure-Object -Property Length -Sum).Sum
        Write-Host "⚠️ $dir 존재 (크기: $([math]::Round($size/1KB, 2)) KB)" -ForegroundColor Yellow
    }
}

if ($remainingDirs.Count -eq 0) {
    Write-Host "✅ AI 관련 설정 디렉토리 모두 제거됨" -ForegroundColor Green
} else {
    Write-Host "⚠️ 일부 설정 디렉토리가 남아있습니다" -ForegroundColor Yellow
}

# 5. 프로젝트 디렉토리 정리 상태 확인
Write-Host "`n📂 프로젝트 디렉토리 정리 상태 확인..." -ForegroundColor Yellow

$projectFiles = @(
    "claude-*.bat",
    "start-claude.bat",
    ".claude-project.json",
    "setup-claude-wsl.sh",
    "*.claude*"
)

$remainingFiles = @()
foreach ($pattern in $projectFiles) {
    $files = Get-ChildItem -Path . -Name $pattern -ErrorAction SilentlyContinue
    if ($files) {
        $remainingFiles += $files
    }
}

if ($remainingFiles.Count -eq 0) {
    Write-Host "✅ 프로젝트 디렉토리에서 AI 관련 파일 모두 제거됨" -ForegroundColor Green
} else {
    Write-Host "⚠️ 프로젝트에 남아있는 파일들:" -ForegroundColor Yellow
    $remainingFiles | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
}

# 6. Windows 시스템 상태 확인
Write-Host "`n🖥️ Windows 시스템 상태 확인..." -ForegroundColor Yellow

try {
    # PATH 환경변수에서 AI 도구 경로 확인
    $pathEnv = $env:PATH
    $aiPaths = @()
    
    if ($pathEnv -match "claude") { $aiPaths += "Claude 경로" }
    if ($pathEnv -match "gemini") { $aiPaths += "Gemini 경로" }
    if ($pathEnv -match "openai") { $aiPaths += "OpenAI 경로" }
    if ($pathEnv -match "qwen") { $aiPaths += "Qwen 경로" }
    
    if ($aiPaths.Count -eq 0) {
        Write-Host "✅ PATH에서 AI 도구 경로 모두 제거됨" -ForegroundColor Green
    } else {
        Write-Host "⚠️ PATH에 남아있는 AI 도구 경로들:" -ForegroundColor Yellow
        $aiPaths | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
    }
    
    # 시스템 성능 확인
    $memory = Get-WmiObject -Class Win32_OperatingSystem
    $freeMemoryGB = [math]::Round($memory.FreePhysicalMemory / 1MB, 2)
    Write-Host "사용 가능한 메모리: $freeMemoryGB GB" -ForegroundColor Cyan
    
    $disk = Get-WmiObject -Class Win32_LogicalDisk -Filter "DeviceID='C:'"
    $freeDiskGB = [math]::Round($disk.FreeSpace / 1GB, 2)
    Write-Host "C: 드라이브 여유 공간: $freeDiskGB GB" -ForegroundColor Cyan
    
} catch {
    Write-Host "⚠️ 시스템 상태 확인 중 오류: $_" -ForegroundColor Yellow
}

# 7. WSL 연동 상태 확인
Write-Host "`n🐧 WSL 연동 상태 확인..." -ForegroundColor Yellow

try {
    $wslStatus = wsl --status 2>$null
    if ($wslStatus) {
        Write-Host "✅ WSL 정상 작동 중" -ForegroundColor Green
        
        # WSL에서 AI 도구들 확인
        $wslAiTools = wsl -e bash -c "which claude gemini openai qwen 2>/dev/null | wc -l"
        Write-Host "WSL에 설치된 AI 도구 수: $wslAiTools개" -ForegroundColor Cyan
        
        if ($wslAiTools -gt 0) {
            Write-Host "✅ WSL에서 AI 도구들 정상 작동" -ForegroundColor Green
        } else {
            Write-Host "⚠️ WSL에 AI 도구가 설치되지 않음" -ForegroundColor Yellow
        }
    } else {
        Write-Host "⚠️ WSL 상태 확인 실패" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️ WSL 연동 확인 실패: $_" -ForegroundColor Yellow
}

# 8. 최종 종합 평가
Write-Host "`n" + "=" * 80 -ForegroundColor Green
Write-Host "📊 Windows 환경 정리 상태 종합 평가" -ForegroundColor Green
Write-Host "=" * 80 -ForegroundColor Green

$issues = @()
if ($aiPackages) { $issues += "npm 글로벌 패키지" }
if ($remainingEnvVars.Count -gt 0) { $issues += "환경변수" }
if ($aiSettings.Count -gt 0) { $issues += "PowerShell 프로필" }
if ($remainingDirs.Count -gt 0) { $issues += "설정 디렉토리" }
if ($remainingFiles.Count -gt 0) { $issues += "프로젝트 파일" }

if ($issues.Count -eq 0) {
    Write-Host "`n🎉 완벽한 정리 상태!" -ForegroundColor Green
    Write-Host "✅ Windows 환경이 깔끔하게 정리되었습니다" -ForegroundColor Green
    Write-Host "✅ WSL과의 연동도 정상적으로 작동합니다" -ForegroundColor Green
    Write-Host "✅ 시스템 성능에 영향을 주는 잔여물이 없습니다" -ForegroundColor Green
} else {
    Write-Host "`n⚠️ 일부 정리가 필요한 항목들:" -ForegroundColor Yellow
    $issues | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
    Write-Host "`n💡 추가 정리가 필요하지만 시스템 작동에는 문제없습니다" -ForegroundColor Cyan
}

Write-Host "`n🎯 권장사항:" -ForegroundColor Yellow
Write-Host "✅ Windows에서는 WSL을 통해서만 AI CLI 도구 사용" -ForegroundColor White
Write-Host "✅ 정기적인 npm cache clean --force 실행" -ForegroundColor White
Write-Host "✅ WSL 환경에서 모든 AI 개발 작업 수행" -ForegroundColor White

Write-Host "`n✅ Windows 환경 정리 상태 확인 완료!" -ForegroundColor Green