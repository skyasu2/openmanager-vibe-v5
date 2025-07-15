# fix-global-mcp.ps1
# Claude Code 글로벌 MCP 설정 정리 스크립트

Write-Host "🔧 Claude Code 글로벌 MCP 설정 정리 시작..." -ForegroundColor Green

# 사용자 홈 디렉토리 찾기
$userHome = [Environment]::GetFolderPath("UserProfile")
$claudeGlobalConfig = Join-Path $userHome ".claude\settings.json"
$claudeLocalConfig = Join-Path $userHome "AppData\Local\Claude\settings.json"
$claudeRoamingConfig = Join-Path $userHome "AppData\Roaming\Claude\settings.json"

# 가능한 설정 파일 위치들
$configPaths = @(
    $claudeGlobalConfig,
    $claudeLocalConfig,
    $claudeRoamingConfig,
    "$userHome\.claude\mcp.json",
    "$userHome\AppData\Local\Claude\mcp.json",
    "$userHome\AppData\Roaming\Claude\mcp.json"
)

Write-Host "`n📁 설정 파일 확인 중..." -ForegroundColor Yellow

foreach ($path in $configPaths) {
    if (Test-Path $path) {
        Write-Host "✅ 발견: $path" -ForegroundColor Green
        
        # 파일 내용 읽기
        $content = Get-Content $path -Raw
        
        # brave-search 관련 내용이 있는지 확인
        if ($content -match "brave-search") {
            Write-Host "  ⚠️  brave-search 발견! 제거 중..." -ForegroundColor Yellow
            
            # 백업 생성
            $backupPath = "$path.backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
            Copy-Item $path $backupPath
            Write-Host "  📄 백업 생성: $backupPath" -ForegroundColor Cyan
            
            # brave-search 제거
            $jsonObj = $content | ConvertFrom-Json
            
            # mcpServers에서 brave-search 제거
            if ($jsonObj.mcpServers -and $jsonObj.mcpServers."brave-search") {
                $jsonObj.mcpServers.PSObject.Properties.Remove("brave-search")
                Write-Host "  ✅ mcpServers에서 brave-search 제거됨" -ForegroundColor Green
            }
            
            # enabledMcpjsonServers에서 brave-search 제거
            if ($jsonObj.enabledMcpjsonServers) {
                $jsonObj.enabledMcpjsonServers = @($jsonObj.enabledMcpjsonServers | Where-Object { $_ -ne "brave-search" })
                Write-Host "  ✅ enabledMcpjsonServers에서 brave-search 제거됨" -ForegroundColor Green
            }
            
            # 수정된 내용 저장
            $jsonObj | ConvertTo-Json -Depth 10 | Set-Content $path
            Write-Host "  💾 파일 저장 완료" -ForegroundColor Green
        }
    }
}

# Claude Code 프로세스 확인
Write-Host "`n🔍 Claude Code 프로세스 확인..." -ForegroundColor Yellow
$claudeProcesses = Get-Process | Where-Object { $_.ProcessName -like "*claude*" }

if ($claudeProcesses) {
    Write-Host "⚠️  Claude Code가 실행 중입니다." -ForegroundColor Yellow
    Write-Host "다음 단계를 수행하세요:" -ForegroundColor Cyan
    Write-Host "1. Claude Code를 완전히 종료 (시스템 트레이 확인)" -ForegroundColor White
    Write-Host "2. 다시 시작" -ForegroundColor White
    Write-Host "3. 프로젝트 열기" -ForegroundColor White
    Write-Host "4. /mcp 명령으로 상태 확인" -ForegroundColor White
} else {
    Write-Host "✅ Claude Code가 실행 중이지 않습니다." -ForegroundColor Green
}

# 캐시 정리 제안
Write-Host "`n💡 추가 권장사항:" -ForegroundColor Cyan
Write-Host "- Windows 임시 파일 정리: Win+R → %temp% → 모두 삭제" -ForegroundColor White
Write-Host "- Claude Code 캐시 정리: %LOCALAPPDATA%\Claude\Cache 폴더 삭제" -ForegroundColor White

Write-Host "`n✅ 스크립트 완료!" -ForegroundColor Green