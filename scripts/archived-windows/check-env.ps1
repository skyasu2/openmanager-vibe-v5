# PowerShell script to check environment variables

Write-Host "🔍 환경 변수 확인 중..." -ForegroundColor Cyan
Write-Host ""

# 확인할 환경 변수 목록
$envVars = @(
    "GITHUB_TOKEN",
    "BRAVE_API_KEY", 
    "SUPABASE_KEY",
    "GOOGLE_AI_API_KEY"
)

$foundCount = 0

foreach ($varName in $envVars) {
    $value = [Environment]::GetEnvironmentVariable($varName, [EnvironmentVariableTarget]::User)
    if (!$value) {
        $value = [Environment]::GetEnvironmentVariable($varName, [EnvironmentVariableTarget]::Process)
    }
    
    if ($value) {
        $displayValue = $value.Substring(0, [Math]::Min(10, $value.Length)) + "..."
        Write-Host "✅ $varName : $displayValue" -ForegroundColor Green
        $foundCount++
    } else {
        Write-Host "❌ $varName : 설정되지 않음" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "📊 요약: $foundCount / $($envVars.Count) 환경 변수가 설정됨" -ForegroundColor Yellow

if ($foundCount -lt $envVars.Count) {
    Write-Host ""
    Write-Host "💡 환경 변수 설정 방법 (PowerShell):" -ForegroundColor Cyan
    Write-Host '   setx VARIABLE_NAME "your-value-here"' -ForegroundColor Gray
    Write-Host ""
    Write-Host "   예시:" -ForegroundColor DarkGray
    Write-Host '   setx GITHUB_TOKEN "[YOUR_GITHUB_TOKEN_HERE]"' -ForegroundColor DarkGray
}