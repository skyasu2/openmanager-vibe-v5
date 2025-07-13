# Gemini CLI Bridge v3.0 마이그레이션 스크립트
# PowerShell 전용

Write-Host "🚀 Gemini CLI Bridge v3.0 마이그레이션 시작..." -ForegroundColor Cyan

$bridgePath = "mcp-servers/gemini-cli-bridge/src"

# 1. 기존 파일 백업
Write-Host "`n📦 기존 파일 백업 중..." -ForegroundColor Yellow

$backupFiles = @(
    "$bridgePath/adaptive-gemini-bridge.js",
    "$bridgePath/adaptive-gemini-bridge-v2.js",
    "$bridgePath/tools.js",
    "$bridgePath/index.js"
)

foreach ($file in $backupFiles) {
    if (Test-Path $file) {
        $backupName = "$file.v2.backup"
        Copy-Item $file $backupName -Force
        Write-Host "  ✅ 백업: $file → $backupName" -ForegroundColor Green
    }
}

# 2. v3 적용 여부 확인
Write-Host "`n🔍 v3 파일 확인 중..." -ForegroundColor Yellow

$v3Files = @{
    "model-strategies.js" = Test-Path "$bridgePath/model-strategies.js"
    "adaptive-gemini-bridge-v3.js" = Test-Path "$bridgePath/adaptive-gemini-bridge-v3.js"
    "tools-v3.js" = Test-Path "$bridgePath/tools-v3.js"
}

$allV3FilesExist = $true
foreach ($file in $v3Files.GetEnumerator()) {
    if ($file.Value) {
        Write-Host "  ✅ $($file.Key) 존재" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $($file.Key) 없음" -ForegroundColor Red
        $allV3FilesExist = $false
    }
}

if (-not $allV3FilesExist) {
    Write-Host "`n⚠️  v3 파일이 모두 생성되지 않았습니다." -ForegroundColor Red
    Write-Host "먼저 v3 파일들을 생성해주세요." -ForegroundColor Red
    exit 1
}

# 3. index.js 업데이트 준비
Write-Host "`n📝 index.js 업데이트 준비..." -ForegroundColor Yellow

$indexUpdateScript = @'
// index.js를 v3로 업데이트하는 코드

// 기존 import 변경
// FROM: import { AdaptiveGeminiBridge } from './adaptive-gemini-bridge-v2.js';
// TO:   import { AdaptiveGeminiBridge } from './adaptive-gemini-bridge-v3.js';

// 기존 setupTools import 변경  
// FROM: import { setupTools } from './tools.js';
// TO:   import { setupTools } from './tools-v3.js';

// 버전 업데이트
// FROM: version: '2.1.0'
// TO:   version: '3.0.0'
'@

Write-Host $indexUpdateScript -ForegroundColor DarkGray

# 4. 사용자 확인
Write-Host "`n⚠️  주의: 이 작업은 MCP 서버를 v3로 업그레이드합니다." -ForegroundColor Yellow
Write-Host "Claude Code를 재시작해야 적용됩니다." -ForegroundColor Yellow

$confirm = Read-Host "`n계속하시겠습니까? (Y/N)"
if ($confirm -ne 'Y' -and $confirm -ne 'y') {
    Write-Host "❌ 마이그레이션 취소됨" -ForegroundColor Red
    exit 0
}

# 5. index.js 실제 업데이트
Write-Host "`n🔧 index.js 업데이트 중..." -ForegroundColor Yellow

$indexPath = "$bridgePath/index.js"
$indexContent = Get-Content $indexPath -Raw

# v2 → v3 import 변경
$indexContent = $indexContent -replace "adaptive-gemini-bridge-v2\.js", "adaptive-gemini-bridge-v3.js"
$indexContent = $indexContent -replace "from './tools\.js'", "from './tools-v3.js'"
$indexContent = $indexContent -replace 'version: ''2\.1\.0''', 'version: ''3.0.0'''

Set-Content $indexPath $indexContent -NoNewline
Write-Host "  ✅ index.js 업데이트 완료" -ForegroundColor Green

# 6. package.json 버전 업데이트
Write-Host "`n📦 package.json 버전 업데이트..." -ForegroundColor Yellow

$packagePath = "mcp-servers/gemini-cli-bridge/package.json"
$packageContent = Get-Content $packagePath -Raw
$packageContent = $packageContent -replace '"version": "2\.1\.0"', '"version": "3.0.0"'
Set-Content $packagePath $packageContent -NoNewline
Write-Host "  ✅ package.json 업데이트 완료" -ForegroundColor Green

# 7. 테스트 스크립트 생성
Write-Host "`n📝 v3 테스트 스크립트 생성..." -ForegroundColor Yellow

$testScript = @'
#!/usr/bin/env node
/**
 * Gemini CLI Bridge v3.0 테스트 스크립트
 */

console.log('🧪 Gemini CLI Bridge v3.0 테스트\n');

console.log('새로운 도구들:');
console.log('- gemini_quick_answer: 빠른 답변 (Flash + 헤드리스)');
console.log('- gemini_code_review: 코드 리뷰 (Pro 모델)');
console.log('- gemini_analyze: 복잡한 분석 (깊이 선택)');
console.log('- gemini_batch: 배치 처리');

console.log('\n테스트 명령:');
console.log('1. mcp_gemini_cli_bridge_gemini_quick_answer({ question: "Python 정렬 방법?" })');
console.log('2. mcp_gemini_cli_bridge_gemini_code_review({ code: "def add(a,b): return a+b", focus: "performance" })');
console.log('3. mcp_gemini_cli_bridge_gemini_analyze({ content: "복잡한 문제", depth: "deep" })');
console.log('4. mcp_gemini_cli_bridge_gemini_usage_dashboard()');

console.log('\n💡 Claude Code 재시작 후 위 명령들을 테스트하세요!');
'@

Set-Content "scripts/test-gemini-v3.js" $testScript
Write-Host "  ✅ test-gemini-v3.js 생성 완료" -ForegroundColor Green

# 8. 완료 메시지
Write-Host "`n✨ Gemini CLI Bridge v3.0 마이그레이션 완료!" -ForegroundColor Green
Write-Host "`n다음 단계:" -ForegroundColor Cyan
Write-Host "1. Claude Code 재시작 (MCP 서버 리로드)" -ForegroundColor White
Write-Host "2. node scripts/test-gemini-v3.js 실행하여 테스트 명령 확인" -ForegroundColor White
Write-Host "3. 새로운 도구들 사용해보기" -ForegroundColor White

Write-Host "`n📚 상세 문서: docs/gemini-cli-bridge-v3-improvements.md" -ForegroundColor Blue
Write-Host "`n🎯 주요 개선사항:" -ForegroundColor Yellow
Write-Host "- 34% 성능 향상 (--prompt 플래그)" -ForegroundColor White
Write-Host "- 자동 모델 선택 (프롬프트 분석)" -ForegroundColor White
Write-Host "- Pro → Flash 자동 폴백" -ForegroundColor White
Write-Host "- 작업별 최적화 도구" -ForegroundColor White