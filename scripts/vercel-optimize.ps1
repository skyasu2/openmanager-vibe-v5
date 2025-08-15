# Vercel Platform 최적화 스크립트
# Windows PowerShell 환경 최적화

param(
    [string]$Mode = "full",  # full, quick, analyze
    [switch]$DryRun = $false,
    [switch]$Backup = $true
)

Write-Host "🚀 Vercel Platform 최적화 시작" -ForegroundColor Green
Write-Host "모드: $Mode" -ForegroundColor Yellow

$ProjectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $ProjectRoot

# 백업 생성
if ($Backup -and -not $DryRun) {
    $BackupDir = "backups/vercel-$(Get-Date -Format 'yyyyMMdd-HHmm')"
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
    
    Write-Host "📦 백업 생성: $BackupDir" -ForegroundColor Blue
    Copy-Item "vercel.json" "$BackupDir/vercel.json.backup" -ErrorAction SilentlyContinue
    Copy-Item "next.config.mjs" "$BackupDir/next.config.mjs.backup" -ErrorAction SilentlyContinue
}

switch ($Mode) {
    "quick" {
        Write-Host "⚡ 빠른 최적화 적용 중..." -ForegroundColor Yellow
        
        # 1. vercel.json 무료 티어 최적화
        if (-not $DryRun) {
            $vercelOptimized = Get-Content "vercel-optimization-plan.json" | ConvertFrom-Json
            $vercelOptimized | ConvertTo-Json -Depth 10 | Set-Content "vercel.json"
            Write-Host "✅ vercel.json 최적화 완료" -ForegroundColor Green
        }
        
        # 2. 환경변수 최적화
        Write-Host "🔧 환경변수 최적화 확인 중..." -ForegroundColor Blue
        
        # 필수 환경변수 체크
        $envVars = @(
            "VERCEL_HOBBY_PLAN",
            "SERVERLESS_FUNCTION_TIMEOUT", 
            "MEMORY_LIMIT_MB",
            "CDN_CACHE_HIT_RATE_TARGET"
        )
        
        foreach ($var in $envVars) {
            if (-not (Get-Content ".env.local" -ErrorAction SilentlyContinue | Select-String $var)) {
                Write-Host "⚠️ 환경변수 누락: $var" -ForegroundColor Yellow
            }
        }
        
        Write-Host "⚡ 빠른 최적화 완료!" -ForegroundColor Green
    }
    
    "analyze" {
        Write-Host "📊 번들 분석 실행 중..." -ForegroundColor Yellow
        
        # Bundle Analyzer 실행
        $env:ANALYZE = "true"
        npm run build:analyze
        
        # 결과 분석
        if (Test-Path ".next/analyze") {
            Write-Host "📈 번들 분석 결과:" -ForegroundColor Green
            Get-ChildItem ".next/analyze" | ForEach-Object {
                Write-Host "  - $($_.Name)" -ForegroundColor Cyan
            }
            
            # 번들 크기 분석
            $chunks = Get-ChildItem ".next/static/chunks/*.js" | Sort-Object Length -Descending | Select-Object -First 10
            Write-Host "`n🎯 상위 10개 번들 파일:" -ForegroundColor Blue
            
            foreach ($chunk in $chunks) {
                $sizeMB = [math]::Round($chunk.Length / 1MB, 2)
                $sizeKB = [math]::Round($chunk.Length / 1KB, 0)
                
                if ($sizeMB -gt 0.1) {
                    Write-Host "  📦 $($chunk.Name): ${sizeMB}MB" -ForegroundColor Red
                } else {
                    Write-Host "  📦 $($chunk.Name): ${sizeKB}KB" -ForegroundColor Yellow
                }
            }
        }
    }
    
    "full" {
        Write-Host "🏆 전체 최적화 실행 중..." -ForegroundColor Yellow
        
        # 1. Next.js 설정 최적화
        if (-not $DryRun) {
            Copy-Item "next.config.ultra-optimized.mjs" "next.config.mjs" -Force
            Write-Host "✅ next.config.mjs → 초고성능 버전 적용" -ForegroundColor Green
        }
        
        # 2. Vercel 설정 최적화  
        if (-not $DryRun) {
            Copy-Item "vercel-optimization-plan.json" "vercel.json" -Force
            Write-Host "✅ vercel.json → 무료 티어 최적화 완료" -ForegroundColor Green
        }
        
        # 3. 의존성 최적화
        Write-Host "📦 의존성 최적화 중..." -ForegroundColor Blue
        npm audit --fix
        
        # 4. 빌드 테스트
        Write-Host "🔨 최적화된 설정으로 빌드 테스트..." -ForegroundColor Blue
        $env:ANALYZE = "true"
        $buildResult = npm run build:analyze 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ 빌드 성공!" -ForegroundColor Green
            
            # 성능 메트릭 수집
            if (Test-Path ".next/build-manifest.json") {
                $manifest = Get-Content ".next/build-manifest.json" | ConvertFrom-Json
                $totalFiles = $manifest.pages.values | Measure-Object | Select-Object -ExpandProperty Count
                Write-Host "📊 총 번들 파일 수: $totalFiles" -ForegroundColor Cyan
            }
            
        } else {
            Write-Host "❌ 빌드 실패 - 설정을 롤백합니다" -ForegroundColor Red
            
            if ($Backup) {
                $latestBackup = Get-ChildItem "backups" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
                if ($latestBackup) {
                    Copy-Item "$($latestBackup.FullName)/*.backup" "." -Force
                    Write-Host "🔄 설정 롤백 완료" -ForegroundColor Yellow
                }
            }
        }
        
        Write-Host "🏆 전체 최적화 완료!" -ForegroundColor Green
    }
}

# 최적화 결과 요약
Write-Host "`n📋 최적화 결과 요약:" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

# 파일 크기 체크
if (Test-Path "vercel.json") {
    $vercelSize = (Get-Item "vercel.json").Length
    Write-Host "📄 vercel.json: $vercelSize bytes" -ForegroundColor Cyan
}

if (Test-Path "next.config.mjs") {
    $nextConfigSize = (Get-Item "next.config.mjs").Length  
    Write-Host "📄 next.config.mjs: $nextConfigSize bytes" -ForegroundColor Cyan
}

# .next 폴더 크기
if (Test-Path ".next") {
    $nextSize = (Get-ChildItem ".next" -Recurse | Measure-Object -Property Length -Sum).Sum
    $nextSizeMB = [math]::Round($nextSize / 1MB, 2)
    Write-Host "📁 .next 폴더: ${nextSizeMB}MB" -ForegroundColor Cyan
}

Write-Host "`n🎯 권장 다음 단계:" -ForegroundColor Yellow
Write-Host "1. vercel --prod 배포 테스트" -ForegroundColor White
Write-Host "2. Lighthouse 성능 테스트 실행" -ForegroundColor White  
Write-Host "3. Core Web Vitals 지표 확인" -ForegroundColor White
Write-Host "4. 사용량 모니터링 설정" -ForegroundColor White

Write-Host "`n✨ Vercel Platform 최적화 완료!" -ForegroundColor Green