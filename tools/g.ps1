# 🚀 g.ps1 - Gemini 개발 도구 PowerShell 래퍼
# 
# 사용법:
#   .\tools\g.ps1 "질문내용"                    # 빠른 채팅
#   .\tools\g.ps1 file src\app\page.tsx         # 파일 분석
#   .\tools\g.ps1 diff                          # Git diff 리뷰
#   .\tools\g.ps1 stats                         # 사용량 확인

param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$Arguments
)

# 인자가 없으면 도움말 출력
if ($Arguments.Count -eq 0) {
    Write-Host "🚀 g - Gemini 개발 도구 빠른 실행기" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "사용법:" -ForegroundColor Yellow
    Write-Host "  .\tools\g.ps1 `"질문내용`"              빠른 채팅" -ForegroundColor Green
    Write-Host "  .\tools\g.ps1 file 파일경로           파일 분석" -ForegroundColor Green
    Write-Host "  .\tools\g.ps1 diff                    Git diff 리뷰" -ForegroundColor Green
    Write-Host "  .\tools\g.ps1 stats                   사용량 확인" -ForegroundColor Green
    Write-Host "  .\tools\g.ps1 health                  헬스체크" -ForegroundColor Green
    Write-Host "  .\tools\g.ps1 clear                   컨텍스트 초기화" -ForegroundColor Green
    Write-Host "  .\tools\g.ps1 memory [cmd]            메모리 관리" -ForegroundColor Green
    Write-Host ""
    Write-Host "예시:" -ForegroundColor Yellow
    Write-Host "  .\tools\g.ps1 `"TypeScript 에러 해결법`"" -ForegroundColor Magenta
    Write-Host "  .\tools\g.ps1 file src\app\page.tsx" -ForegroundColor Magenta
    Write-Host "  .\tools\g.ps1 diff `"SOLID 원칙 관점에서`"" -ForegroundColor Magenta
    exit 0
}

# Node.js 스크립트 실행
try {
    $nodeArgs = @("tools/gemini-dev-tools.js") + $Arguments
    & node $nodeArgs
} catch {
    Write-Host "❌ 실행 중 오류 발생: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}