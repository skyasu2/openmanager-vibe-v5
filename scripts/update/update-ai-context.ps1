# PowerShell용 AI 컨텍스트 업데이트 스크립트
Write-Host "🤖 AI 컨텍스트 업데이트 시작..." -ForegroundColor Green
Write-Host "🏗️ 환경: WSL Claude Code (메인) + VS Code Copilot (보조)" -ForegroundColor Cyan

# 프로젝트 구조 생성 (Windows tree 명령어 사용)
Write-Host "📁 프로젝트 구조 생성 중..." -ForegroundColor Yellow
try {
    tree /F /A | Out-File -FilePath "project-structure.txt" -Encoding UTF8
}
catch {
    Write-Host "⚠️ tree 명령어 실패, PowerShell로 구조 생성..." -ForegroundColor Yellow
    Get-ChildItem -Recurse -Directory | Where-Object { $_.Name -notmatch "node_modules|\.next|dist|logs|reports" } | 
    Select-Object FullName | Out-File -FilePath "project-structure.txt" -Encoding UTF8
}

# TypeScript 파일 통계
Write-Host "📊 TypeScript 파일 통계 생성 중..." -ForegroundColor Yellow
$tsFiles = Get-ChildItem -Recurse -Include "*.ts", "*.tsx" -Path "src\"
$totalFiles = $tsFiles.Count
$totalLines = ($tsFiles | Get-Content | Measure-Object -Line).Lines

# 큰 파일들 찾기
Write-Host "📏 큰 파일들 체크 중..." -ForegroundColor Yellow
$largeFiles = $tsFiles | ForEach-Object {
    $lineCount = (Get-Content $_.FullName | Measure-Object -Line).Lines
    [PSCustomObject]@{
        File  = $_.Name
        Path  = $_.FullName
        Lines = $lineCount
    }
} | Sort-Object Lines -Descending | Select-Object -First 20

# AI 메타데이터 생성
Write-Host "📋 메타데이터 업데이트 중..." -ForegroundColor Yellow
$packageJson = Get-Content "package.json" | ConvertFrom-Json
$metadata = @{
    lastUpdated            = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss")
    version                = $packageJson.version
    totalFiles             = $totalFiles
    totalLines             = $totalLines
    architecturePattern    = "modular-8-component"
    developmentEnvironment = @{
        primary        = "WSL + Claude Code"
        subAgents      = @("gemini-cli", "codex-cli", "qwen-cli")
        auxiliary      = "VS Code + GitHub Copilot"
        specialization = "이미지 처리, 캡쳐 작업"
    }
    aiEngines              = @("claude-code", "gemini-cli", "codex-cli", "qwen-cli", "github-copilot")
    status                 = "production-ready"
    largeFiles             = $largeFiles | Select-Object -First 5
}

# .vscode 디렉토리가 없으면 생성
if (-not (Test-Path ".vscode")) {
    New-Item -ItemType Directory -Path ".vscode" -Force
}

$metadata | ConvertTo-Json -Depth 3 | Out-File -FilePath ".vscode\ai-metadata.json" -Encoding UTF8

Write-Host "✅ AI 컨텍스트 업데이트 완료!" -ForegroundColor Green
Write-Host "📍 주요 파일들:" -ForegroundColor Cyan
Write-Host "   - AI-CONTEXT.md (메인 컨텍스트)" -ForegroundColor White
Write-Host "   - .vscode\ai-context.json (구조화된 설정)" -ForegroundColor White
Write-Host "   - docs\development\ai-workflow-guide.md (워크플로우)" -ForegroundColor White
Write-Host "   - .vscode\ai-metadata.json (메타데이터)" -ForegroundColor White
Write-Host ""
Write-Host "🎯 개발 환경:" -ForegroundColor Yellow
Write-Host "   메인: WSL + Claude Code (서브: gemini-cli, codex-cli, qwen-cli)" -ForegroundColor White
Write-Host "   보조: VS Code + GitHub Copilot (이미지 처리 전용)" -ForegroundColor White
