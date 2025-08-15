# PowerShell 별칭 충돌 문제 해결 스크립트
# 문제: 'cp' 별칭이 AllScope로 설정되어 덮어쓸 수 없음

Write-Host "🔧 PowerShell 별칭 충돌 문제 해결..." -ForegroundColor Green

# 1. 문제 분석
Write-Host "`n📊 문제 분석:" -ForegroundColor Yellow
Write-Host "❌ 'cp' 별칭이 Copy-Item의 AllScope 별칭으로 이미 설정됨" -ForegroundColor Red
Write-Host "❌ AllScope 옵션은 제거할 수 없음" -ForegroundColor Red
Write-Host "❌ PowerShell 프로필 로딩 시 오류 발생" -ForegroundColor Red

# 2. 현재 프로필 파일 확인
$profilePath = $PROFILE
Write-Host "`n📁 프로필 파일 위치: $profilePath" -ForegroundColor Cyan

if (Test-Path $profilePath) {
    Write-Host "✅ 프로필 파일 존재함" -ForegroundColor Green
    
    # 문제가 되는 라인 찾기
    $profileContent = Get-Content $profilePath -Raw
    if ($profileContent -like "*Set-Alias -Name cp*") {
        Write-Host "❌ 문제가 되는 'cp' 별칭 설정 발견됨" -ForegroundColor Red
    }
} else {
    Write-Host "❌ 프로필 파일이 존재하지 않음" -ForegroundColor Red
}

# 3. 프로필 백업
Write-Host "`n💾 프로필 백업..." -ForegroundColor Yellow
$backupPath = "$profilePath.backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
if (Test-Path $profilePath) {
    Copy-Item $profilePath $backupPath -Force
    Write-Host "✅ 프로필 백업 완료: $backupPath" -ForegroundColor Green
}

# 4. 문제가 되는 별칭 제거 및 대체
Write-Host "`n🔧 별칭 충돌 해결..." -ForegroundColor Yellow

if (Test-Path $profilePath) {
    $lines = Get-Content $profilePath
    $fixedLines = @()
    $foundProblem = $false
    
    foreach ($line in $lines) {
        if ($line -like "*Set-Alias -Name cp -Value Start-ClaudeProject*") {
            # 문제가 되는 라인을 대체 별칭으로 변경
            $fixedLines += "# Set-Alias -Name cp -Value Start-ClaudeProject -Force  # 충돌로 인해 주석 처리"
            $fixedLines += "Set-Alias -Name claude-p -Value Start-ClaudeProject -Force  # cp 대신 claude-p 사용"
            $fixedLines += "Set-Alias -Name cproj -Value Start-ClaudeProject -Force     # cp 대신 cproj 사용"
            $foundProblem = $true
            Write-Host "✅ 문제 라인 수정됨: cp → claude-p, cproj" -ForegroundColor Green
        } else {
            $fixedLines += $line
        }
    }
    
    if ($foundProblem) {
        # 수정된 내용을 파일에 저장
        $fixedLines | Out-File -FilePath $profilePath -Encoding UTF8 -Force
        Write-Host "✅ 프로필 파일 수정 완료" -ForegroundColor Green
    } else {
        Write-Host "ℹ️ 문제가 되는 라인을 찾지 못했습니다" -ForegroundColor Yellow
    }
}

# 5. 새로운 별칭 추가 (충돌 없는 이름들)
Write-Host "`n➕ 새로운 별칭 추가..." -ForegroundColor Yellow

$newAliases = @"

# Claude 프로젝트 실행 별칭들 (충돌 방지)
Set-Alias -Name claude-p -Value Start-ClaudeProject -Force    # claude-project
Set-Alias -Name cproj -Value Start-ClaudeProject -Force       # claude project
Set-Alias -Name clp -Value Start-ClaudeProject -Force         # claude project (짧은 버전)

"@

# 프로필에 새 별칭이 없다면 추가
$currentProfile = Get-Content $profilePath -Raw -ErrorAction SilentlyContinue
if ($currentProfile -notlike "*claude-p*") {
    Add-Content -Path $profilePath -Value $newAliases
    Write-Host "✅ 새로운 별칭들 추가됨" -ForegroundColor Green
} else {
    Write-Host "✅ 새로운 별칭들 이미 존재함" -ForegroundColor Green
}

# 6. 현재 세션에서 별칭 설정
Write-Host "`n⚡ 현재 세션에 별칭 적용..." -ForegroundColor Yellow

try {
    # 현재 세션에서 함수가 정의되어 있는지 확인
    if (Get-Command Start-ClaudeProject -ErrorAction SilentlyContinue) {
        Set-Alias -Name claude-p -Value Start-ClaudeProject -Force -Scope Global
        Set-Alias -Name cproj -Value Start-ClaudeProject -Force -Scope Global  
        Set-Alias -Name clp -Value Start-ClaudeProject -Force -Scope Global
        Write-Host "✅ 현재 세션에 별칭 적용됨" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Start-ClaudeProject 함수가 현재 세션에 없습니다" -ForegroundColor Yellow
        Write-Host "   새 PowerShell 세션에서 사용 가능합니다" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️ 현재 세션 별칭 설정 실패: $_" -ForegroundColor Yellow
}

# 7. 프로필 테스트
Write-Host "`n🧪 프로필 구문 테스트..." -ForegroundColor Yellow

try {
    # 프로필 파일의 구문 검사
    $null = [System.Management.Automation.PSParser]::Tokenize((Get-Content $profilePath -Raw), [ref]$null)
    Write-Host "✅ 프로필 구문 검사 통과" -ForegroundColor Green
} catch {
    Write-Host "❌ 프로필 구문 오류: $_" -ForegroundColor Red
    Write-Host "💡 백업에서 복원: Copy-Item '$backupPath' '$profilePath' -Force" -ForegroundColor Yellow
}

# 8. 사용법 안내
Write-Host "`n💡 새로운 사용법:" -ForegroundColor Cyan
Write-Host "기존: cp /status" -ForegroundColor Red
Write-Host "새로운 방법들:" -ForegroundColor Green
Write-Host "  claude-p /status    # claude-project의 줄임말" -ForegroundColor White
Write-Host "  cproj /status       # claude project" -ForegroundColor White  
Write-Host "  clp /status         # 가장 짧은 버전" -ForegroundColor White

Write-Host "`n📋 해결된 문제점들:" -ForegroundColor Green
Write-Host "✅ PowerShell 별칭 충돌 해결됨" -ForegroundColor White
Write-Host "✅ 프로필 로딩 오류 수정됨" -ForegroundColor White
Write-Host "✅ 대체 별칭들 제공됨" -ForegroundColor White
Write-Host "✅ 기존 기능 유지됨" -ForegroundColor White

Write-Host "`n🔄 변경사항 적용을 위해 새 PowerShell 세션을 시작하세요" -ForegroundColor Yellow
Write-Host "✅ PowerShell 별칭 충돌 문제 해결 완료!" -ForegroundColor Green