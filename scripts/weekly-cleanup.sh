#!/bin/bash
# 🧹 OpenManager Vibe v5 주간 정리 스크립트
# 생성일: 2025-07-02
# 버전: v1.0

echo "🧹 OpenManager Vibe v5 주간 정리 시작..."

# 1. 오래된 환경변수 백업 정리 (최신 3개만 유지)
echo "📁 환경변수 백업 정리 중..."
if [ -d "config/env-backups" ]; then
    cd config/env-backups
    file_count=$(ls -1 | wc -l)
    if [ "$file_count" -gt 3 ]; then
        ls -t | tail -n +4 | xargs rm -f
        echo "   ✅ $(($file_count - 3))개 파일 정리 완료"
    else
        echo "   ℹ️ 정리할 파일 없음 ($file_count개 파일)"
    fi
    cd ../..
fi

# 2. 30일 이상 된 로그 삭제
echo "📋 오래된 로그 정리 중..."
deleted_logs=$(find development/logs -name "*.json" -mtime +30 2>/dev/null | wc -l)
if [ "$deleted_logs" -gt 0 ]; then
    find development/logs -name "*.json" -mtime +30 -delete 2>/dev/null
    echo "   ✅ ${deleted_logs}개 로그 파일 삭제 완료"
else
    echo "   ℹ️ 정리할 로그 없음"
fi

# 3. 임시 파일 정리
echo "🗑️ 임시 파일 정리 중..."
temp_files=$(find . -name "*temp*" -o -name "*tmp*" | grep -v node_modules | grep -v .git | wc -l)
if [ "$temp_files" -gt 0 ]; then
    find . -name "*temp*" -o -name "*tmp*" | grep -v node_modules | grep -v .git | xargs rm -f 2>/dev/null
    echo "   ✅ ${temp_files}개 임시 파일 삭제 완료"
else
    echo "   ℹ️ 정리할 임시 파일 없음"
fi

# 4. Next.js 캐시 정리 (.next/cache에서 오래된 파일들)
echo "⚡ Next.js 캐시 정리 중..."
if [ -d ".next/cache" ]; then
    cache_size_before=$(du -sh .next/cache 2>/dev/null | cut -f1)
    find .next/cache -name "*.old" -delete 2>/dev/null
    find .next/cache -name "*.gz.old" -delete 2>/dev/null
    cache_size_after=$(du -sh .next/cache 2>/dev/null | cut -f1)
    echo "   ✅ Next.js 캐시 정리 완료 ($cache_size_before → $cache_size_after)"
fi

# 5. 아카이브 폴더 상태 확인
echo "📦 아카이브 상태 확인..."
if [ -d "archive" ]; then
    html_count=$(find archive/test-html-files -name "*.html" 2>/dev/null | wc -l)
    script_count=$(find archive/legacy-scripts -name "*.js" 2>/dev/null | wc -l)
    log_count=$(find archive/old-logs -name "*.json" 2>/dev/null | wc -l)
    archive_size=$(du -sh archive 2>/dev/null | cut -f1)
    
    echo "   📊 아카이브 현황:"
    echo "   - HTML 파일: ${html_count}개"
    echo "   - 스크립트: ${script_count}개"  
    echo "   - 로그 파일: ${log_count}개"
    echo "   - 총 용량: ${archive_size}"
fi

# 6. 정리 결과 요약
echo ""
echo "📈 정리 결과 요약:"
echo "   🎯 환경변수 백업: 최신 3개만 유지"
echo "   🎯 테스트 HTML: 핵심 3개만 유지"
echo "   🎯 개발 로그: 30일 이내만 유지"
echo "   🎯 임시 파일: 모두 정리"

echo ""
echo "✅ 주간 정리 완료! $(date)"
echo "💡 다음 정리 권장일: $(date -d '+7 days' '+%Y-%m-%d')" 