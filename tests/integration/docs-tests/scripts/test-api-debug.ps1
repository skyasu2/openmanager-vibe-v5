# OpenManager Vibe v5 API 디버깅 스크립트
# 배포된 Vercel 환경에서 발생하는 404, 405, 500 오류 분석

$baseUrl = "https://openmanager-vibe-v5.vercel.app"

Write-Host "🔍 OpenManager Vibe v5 API 오류 디버깅 시작" -ForegroundColor Green
Write-Host "=" * 60

# 1. 기본 헬스체크
Write-Host "`n1️⃣ 기본 헬스체크" -ForegroundColor Yellow
try {
    $healthResponse = Invoke-WebRequest -Uri "$baseUrl/api/health" -Method GET
    Write-Host "✅ 헬스체크 성공: $($healthResponse.StatusCode)" -ForegroundColor Green
}
catch {
    Write-Host "❌ 헬스체크 실패: $($_.Exception.Message)" -ForegroundColor Red
}

# 2. Smart Fallback GET 테스트 (상태 조회)
Write-Host "`n2️⃣ Smart Fallback GET 테스트" -ForegroundColor Yellow
try {
    $fallbackGetResponse = Invoke-WebRequest -Uri "$baseUrl/api/ai/smart-fallback" -Method GET
    Write-Host "✅ Smart Fallback GET 성공: $($fallbackGetResponse.StatusCode)" -ForegroundColor Green
    $getContent = $fallbackGetResponse.Content | ConvertFrom-Json
    Write-Host "📊 상태: $($getContent.status)" -ForegroundColor Cyan
}
catch {
    Write-Host "❌ Smart Fallback GET 실패: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   상태 코드: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
}

# 3. Smart Fallback POST 테스트 (실제 쿼리)
Write-Host "`n3️⃣ Smart Fallback POST 테스트" -ForegroundColor Yellow
$testQuery = @{
    query   = "현재 시스템 상태는 어떤가요?"
    context = @{
        sessionId = "debug_test_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
        language  = "ko"
        urgency   = "medium"
    }
    options = @{
        enableThinking      = $false
        maxResponseTime     = 15000
        confidenceThreshold = 0.7
        useMCP              = $true
        useRAG              = $true
        useGoogleAI         = $true
    }
} | ConvertTo-Json -Depth 3

try {
    $fallbackPostResponse = Invoke-WebRequest -Uri "$baseUrl/api/ai/smart-fallback" -Method POST -Headers @{"Content-Type" = "application/json" } -Body $testQuery
    Write-Host "✅ Smart Fallback POST 성공: $($fallbackPostResponse.StatusCode)" -ForegroundColor Green
    $postContent = $fallbackPostResponse.Content | ConvertFrom-Json
    Write-Host "📝 응답: $($postContent.response.Substring(0, [Math]::Min(100, $postContent.response.Length)))..." -ForegroundColor Cyan
    Write-Host "🎯 엔진: $($postContent.engine)" -ForegroundColor Cyan
    Write-Host "📊 신뢰도: $($postContent.confidence)" -ForegroundColor Cyan
}
catch {
    Write-Host "❌ Smart Fallback POST 실패: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   상태 코드: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    if ($_.Exception.Response) {
        try {
            $errorStream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($errorStream)
            $errorContent = $reader.ReadToEnd()
            Write-Host "   오류 내용: $errorContent" -ForegroundColor Red
        }
        catch {
            Write-Host "   오류 내용을 읽을 수 없음" -ForegroundColor Red
        }
    }
}

# 4. AI 로깅 스트림 테스트
Write-Host "`n4️⃣ AI 로깅 스트림 테스트" -ForegroundColor Yellow
try {
    $streamResponse = Invoke-WebRequest -Uri "$baseUrl/api/ai/logging/stream?mode=sidebar" -Method GET -TimeoutSec 5
    Write-Host "✅ AI 로깅 스트림 성공: $($streamResponse.StatusCode)" -ForegroundColor Green
}
catch {
    Write-Host "❌ AI 로깅 스트림 실패: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   상태 코드: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
}

# 5. 다른 AI API들 테스트
Write-Host "`n5️⃣ 기타 AI API 테스트" -ForegroundColor Yellow

$apiEndpoints = @(
    "/api/ai/unified/status",
    "/api/ai/mcp/query",
    "/api/ai/google-ai/status"
)

foreach ($endpoint in $apiEndpoints) {
    try {
        if ($endpoint -eq "/api/ai/mcp/query") {
            $mcpQuery = @{
                question = "테스트 질문입니다"
                priority = "medium"
                category = "system"
            } | ConvertTo-Json
            
            $response = Invoke-WebRequest -Uri "$baseUrl$endpoint" -Method POST -Headers @{"Content-Type" = "application/json" } -Body $mcpQuery
        }
        else {
            $response = Invoke-WebRequest -Uri "$baseUrl$endpoint" -Method GET
        }
        Write-Host "✅ $endpoint : $($response.StatusCode)" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ $endpoint : $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    }
}

Write-Host "`n🔍 디버깅 완료" -ForegroundColor Green
Write-Host "=" * 60 