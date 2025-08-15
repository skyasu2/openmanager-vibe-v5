# ========================================
# Windows PowerShell 환경 최적화 스크립트
# ========================================
# 목적: Windows PowerShell 환경의 성능 및 안정성 개선
# 사용법: PowerShell에서 관리자 권한으로 실행
# ========================================

param(
    [switch]$CleanPath,
    [switch]$FixNpm,
    [switch]$OptimizeGit,
    [switch]$All
)

Write-Host "🔧 Windows PowerShell 환경 최적화를 시작합니다..." -ForegroundColor Blue
Write-Host ""

# 관리자 권한 확인
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Warning "이 스크립트는 관리자 권한이 필요합니다."
    Write-Host "PowerShell을 관리자 권한으로 다시 실행해주세요."
    exit 1
}

# 함수: PATH 환경변수 정리
function Optimize-PathVariable {
    Write-Host "📂 PATH 환경변수 정리 중..." -ForegroundColor Yellow
    
    $currentPath = [Environment]::GetEnvironmentVariable("PATH", "Machine")
    $pathEntries = $currentPath -split ';' | Where-Object { $_ -ne '' }
    
    # 중복 제거
    $uniquePaths = $pathEntries | Sort-Object -Unique
    
    # 존재하지 않는 경로 제거
    $validPaths = $uniquePaths | Where-Object { Test-Path $_ }
    
    # 우선순위 정렬 (중요한 도구들을 앞으로)
    $priorityPaths = @()
    $otherPaths = @()
    
    foreach ($path in $validPaths) {
        if ($path -like "*Git*" -or $path -like "*nodejs*" -or $path -like "*Python*") {
            $priorityPaths += $path
        } else {
            $otherPaths += $path
        }
    }
    
    $optimizedPath = ($priorityPaths + $otherPaths) -join ';'
    
    Write-Host "  - 기존 PATH 항목: $($pathEntries.Count)개"
    Write-Host "  - 중복 제거 후: $($uniquePaths.Count)개"
    Write-Host "  - 유효한 경로: $($validPaths.Count)개"
    
    # PATH 업데이트 (백업 생성)
    $backupPath = "$env:TEMP\path_backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').txt"
    $currentPath | Out-File -FilePath $backupPath -Encoding UTF8
    Write-Host "  - PATH 백업: $backupPath"
    
    [Environment]::SetEnvironmentVariable("PATH", $optimizedPath, "Machine")
    Write-Host "  ✅ PATH 환경변수 최적화 완료" -ForegroundColor Green
    Write-Host ""
}

# 함수: npm 설정 최적화
function Optimize-NpmConfig {
    Write-Host "📦 npm 설정 최적화 중..." -ForegroundColor Yellow
    
    # .npmrc 파일 확인 및 수정
    $npmrcPath = Join-Path $PWD ".npmrc"
    
    if (Test-Path $npmrcPath) {
        $npmrcContent = Get-Content $npmrcPath
        
        # auto-install-peers 경고 해결
        if ($npmrcContent -contains "auto-install-peers = true") {
            Write-Host "  - auto-install-peers 설정 제거 중..."
            $npmrcContent = $npmrcContent | Where-Object { $_ -notlike "*auto-install-peers*" }
            $npmrcContent | Out-File -FilePath $npmrcPath -Encoding UTF8
            Write-Host "  ✅ auto-install-peers 설정 제거됨"
        }
        
        # 성능 최적화 설정 추가
        $optimizations = @(
            "fetch-retries=3",
            "fetch-retry-maxtimeout=60000",
            "fetch-retry-mintimeout=10000",
            "prefer-offline=true",
            "progress=false",
            "audit-level=moderate"
        )
        
        foreach ($opt in $optimizations) {
            $key = $opt.Split('=')[0]
            if (-not ($npmrcContent | Where-Object { $_ -like "*$key*" })) {
                $npmrcContent += $opt
            }
        }
        
        $npmrcContent | Out-File -FilePath $npmrcPath -Encoding UTF8
        Write-Host "  ✅ npm 설정 최적화 완료"
    } else {
        Write-Host "  ⚠️  .npmrc 파일이 없습니다."
    }
    
    # npm 캐시 정리
    Write-Host "  - npm 캐시 정리 중..."
    npm cache clean --force 2>$null
    Write-Host "  ✅ npm 캐시 정리 완료"
    Write-Host ""
}

# 함수: Git 설정 최적화
function Optimize-GitConfig {
    Write-Host "🔧 Git 설정 최적화 중..." -ForegroundColor Yellow
    
    # Windows에서 권장되는 Git 설정들
    $gitConfigs = @{
        "core.autocrlf" = "true"
        "core.filemode" = "false"
        "core.longpaths" = "true"
        "credential.helper" = "manager-core"
        "pull.rebase" = "false"
        "init.defaultBranch" = "main"
        "fetch.prune" = "true"
        "rebase.autoStash" = "true"
    }
    
    foreach ($config in $gitConfigs.GetEnumerator()) {
        try {
            git config --global $config.Key $config.Value
            Write-Host "  ✅ $($config.Key) = $($config.Value)"
        } catch {
            Write-Host "  ⚠️  $($config.Key) 설정 실패: $($_.Exception.Message)"
        }
    }
    
    Write-Host "  ✅ Git 설정 최적화 완료"
    Write-Host ""
}

# 함수: PowerShell 프로필 최적화
function Optimize-PowerShellProfile {
    Write-Host "⚡ PowerShell 프로필 최적화 중..." -ForegroundColor Yellow
    
    $profilePath = $PROFILE.CurrentUserAllHosts
    $profileDir = Split-Path $profilePath -Parent
    
    if (-not (Test-Path $profileDir)) {
        New-Item -ItemType Directory -Path $profileDir -Force | Out-Null
    }
    
    $profileContent = @"
# OpenManager Vibe v5 - PowerShell 최적화 프로필
# 생성일: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')

# 성능 최적화
`$MaximumHistoryCount = 1000
`$PSDefaultParameterValues['Out-File:Encoding'] = 'utf8'

# 개발 도구 별칭
Set-Alias -Name ll -Value Get-ChildItem
Set-Alias -Name grep -Value Select-String
Set-Alias -Name which -Value Get-Command

# 프로젝트 관련 함수
function dev { npm run dev }
function build { npm run build }
function test { npm run test }
function lint { npm run lint }
function type-check { npm run type-check }

# WSL 관련 함수
function wsl-check { node scripts/wsl-compatibility-check.js }
function wsl-fix { wsl bash scripts/wsl-auto-fix.sh }
function wsl-setup { wsl bash scripts/wsl-environment-setup.sh }

# Git 단축 명령어
function gs { git status }
function ga { git add . }
function gc { param([string]`$message) git commit -m `$message }
function gp { git push }
function gl { git log --oneline -10 }

# 시스템 정보 표시
function Show-SystemInfo {
    Write-Host "🖥️  시스템 정보:" -ForegroundColor Cyan
    Write-Host "  - OS: `$(Get-CimInstance Win32_OperatingSystem | Select-Object -ExpandProperty Caption)"
    Write-Host "  - PowerShell: `$(`$PSVersionTable.PSVersion)"
    Write-Host "  - Node.js: `$(node --version 2>$null)"
    Write-Host "  - npm: `$(npm --version 2>$null)"
    Write-Host "  - Git: `$(git --version 2>$null)"
    Write-Host ""
}

# 시작 시 정보 표시
if (`$Host.Name -eq 'ConsoleHost') {
    Write-Host "🚀 OpenManager Vibe v5 개발 환경" -ForegroundColor Green
    Write-Host "   PowerShell 프로필 로드됨" -ForegroundColor Gray
    Write-Host ""
}
"@
    
    $profileContent | Out-File -FilePath $profilePath -Encoding UTF8
    Write-Host "  ✅ PowerShell 프로필 생성: $profilePath"
    Write-Host ""
}

# 함수: 개발 환경 상태 체크
function Test-DevelopmentEnvironment {
    Write-Host "🔍 개발 환경 상태 체크..." -ForegroundColor Yellow
    
    $checks = @()
    
    # Node.js 체크
    try {
        $nodeVersion = node --version 2>$null
        $checks += @{ Name = "Node.js"; Status = "✅"; Version = $nodeVersion }
    } catch {
        $checks += @{ Name = "Node.js"; Status = "❌"; Version = "Not found" }
    }
    
    # npm 체크
    try {
        $npmVersion = npm --version 2>$null
        $checks += @{ Name = "npm"; Status = "✅"; Version = $npmVersion }
    } catch {
        $checks += @{ Name = "npm"; Status = "❌"; Version = "Not found" }
    }
    
    # Git 체크
    try {
        $gitVersion = git --version 2>$null
        $checks += @{ Name = "Git"; Status = "✅"; Version = $gitVersion }
    } catch {
        $checks += @{ Name = "Git"; Status = "❌"; Version = "Not found" }
    }
    
    # WSL 체크
    try {
        $wslVersion = wsl --version 2>$null
        if ($wslVersion) {
            $checks += @{ Name = "WSL"; Status = "✅"; Version = "Available" }
        } else {
            $checks += @{ Name = "WSL"; Status = "⚠️"; Version = "Not available" }
        }
    } catch {
        $checks += @{ Name = "WSL"; Status = "❌"; Version = "Not found" }
    }
    
    # 결과 출력
    Write-Host "  개발 도구 상태:" -ForegroundColor Cyan
    foreach ($check in $checks) {
        Write-Host "    $($check.Status) $($check.Name): $($check.Version)"
    }
    Write-Host ""
}

# 메인 실행 로직
if ($All -or $CleanPath) {
    Optimize-PathVariable
}

if ($All -or $FixNpm) {
    Optimize-NpmConfig
}

if ($All -or $OptimizeGit) {
    Optimize-GitConfig
}

if ($All) {
    Optimize-PowerShellProfile
}

# 항상 실행
Test-DevelopmentEnvironment

Write-Host "🎉 Windows PowerShell 환경 최적화가 완료되었습니다!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 다음 단계:"
Write-Host "  1. PowerShell을 재시작하여 변경사항을 적용하세요"
Write-Host "  2. 'npm run type-check'로 TypeScript 오류를 확인하세요"
Write-Host "  3. 'node scripts/wsl-compatibility-check.js'로 WSL 호환성을 확인하세요"
Write-Host ""
Write-Host "🔧 사용 가능한 매개변수:"
Write-Host "  -CleanPath     : PATH 환경변수 정리"
Write-Host "  -FixNpm        : npm 설정 최적화"
Write-Host "  -OptimizeGit   : Git 설정 최적화"
Write-Host "  -All           : 모든 최적화 실행"
Write-Host ""