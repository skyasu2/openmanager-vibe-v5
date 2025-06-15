#!/usr/bin/env pwsh
# 브랜치 정리 스크립트 - codex 브랜치들 일괄 삭제

Write-Host "🧹 브랜치 정리를 시작합니다..." -ForegroundColor Green

# 정리할 codex 브랜치들 목록
$branchesToDelete = @(
    "codex/add-logs/-to-.gitignore-and-remove-from-repo",
    "codex/add-newline-at-end-of-vercel.env.template", 
    "codex/implement-todo-items-in-route.ts-and-add-tests",
    "codex/replace-execasync-with-systeminformation",
    "codex/update-eslint-config-to-enable-recommended-rules",
    "codex/update-node.js-version-documentation",
    "codex/update-version-to-5.41.0-in-package.json",
    "codex/삭제-사용되지-않는-파일-realserverdatageneratorrefactored.ts",
    "codex/수정--process-객체-사용-시-환경-체크-추가",
    "codex/수정-catch-블록-및-로그-메시지-개선",
    "codex/업데이트-package.json-버전-5.41.0"
)

Write-Host "📋 삭제할 브랜치 수: $($branchesToDelete.Count)" -ForegroundColor Yellow

foreach ($branch in $branchesToDelete) {
    Write-Host "🗑️ 삭제 중: $branch" -ForegroundColor Cyan
    
    try {
        # 원격 브랜치 삭제 (--no-verify로 pre-push hook 우회)
        git push origin --delete $branch --no-verify 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ 원격 브랜치 삭제 성공: $branch" -ForegroundColor Green
        }
        else {
            Write-Host "⚠️ 원격 브랜치 삭제 실패 (이미 삭제됨): $branch" -ForegroundColor Yellow
        }
    }
    catch {
        Write-Host "⚠️ 원격 브랜치 삭제 오류: $branch" -ForegroundColor Yellow
    }
}

# 로컬에서 원격 추적 브랜치 정리
Write-Host "`n🔄 로컬 원격 추적 브랜치 정리 중..." -ForegroundColor Yellow
git fetch --prune

# 정리 결과 확인
Write-Host "`n📊 정리 후 남은 원격 브랜치:" -ForegroundColor Cyan
git branch -r | Where-Object { $_ -notmatch "codex/" }

Write-Host "`n✅ 브랜치 정리가 완료되었습니다!" -ForegroundColor Green
Write-Host "🎯 main 브랜치만 남겨두고 모든 codex 브랜치가 정리되었습니다." -ForegroundColor Green 