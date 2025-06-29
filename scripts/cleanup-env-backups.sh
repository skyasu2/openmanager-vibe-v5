#!/bin/bash

# 🧹 환경변수 백업 파일 정리 스크립트
# 320개 백업 파일 → 최근 10개만 보존

echo "🧹 환경변수 백업 파일 정리 시작..."
echo "현재 시간: $(date)"

BACKUP_DIR="config/env-backups"
KEEP_COUNT=10

# 백업 디렉토리 존재 확인
if [ ! -d "$BACKUP_DIR" ]; then
    echo "❌ 백업 디렉토리가 존재하지 않습니다: $BACKUP_DIR"
    exit 1
fi

# 현재 파일 개수 확인
CURRENT_COUNT=$(find "$BACKUP_DIR" -name "*.json" | wc -l)
echo "📊 현재 백업 파일 개수: $CURRENT_COUNT"

if [ "$CURRENT_COUNT" -le "$KEEP_COUNT" ]; then
    echo "✅ 정리할 필요 없음 (파일 개수: $CURRENT_COUNT ≤ $KEEP_COUNT)"
    exit 0
fi

# 삭제할 파일 개수 계산
DELETE_COUNT=$((CURRENT_COUNT - KEEP_COUNT))
echo "🗑️ 삭제할 파일 개수: $DELETE_COUNT"

# 백업 생성 (안전장치)
SAFETY_BACKUP="config/env-backups-safety-$(date +%Y%m%d-%H%M%S).tar.gz"
echo "💾 안전 백업 생성: $SAFETY_BACKUP"
tar -czf "$SAFETY_BACKUP" "$BACKUP_DIR" 2>/dev/null

# 최근 파일 목록 생성 (수정 시간 기준)
echo "📋 최근 $KEEP_COUNT개 파일 보존 목록:"
find "$BACKUP_DIR" -name "*.json" -printf "%T@ %p\n" | sort -nr | head -$KEEP_COUNT | cut -d' ' -f2- > /tmp/keep_files.txt

# 보존할 파일 출력
while read -r file; do
    echo "  ✅ $(basename "$file")"
done < /tmp/keep_files.txt

# 삭제할 파일 처리
echo ""
echo "🗑️ 삭제할 파일 목록:"
DELETED_COUNT=0

find "$BACKUP_DIR" -name "*.json" -printf "%T@ %p\n" | sort -nr | tail -n +$((KEEP_COUNT + 1)) | cut -d' ' -f2- | while read -r file; do
    if [ -f "$file" ]; then
        echo "  ❌ $(basename "$file")"
        rm "$file"
        DELETED_COUNT=$((DELETED_COUNT + 1))
    fi
done

# 최종 결과 확인
FINAL_COUNT=$(find "$BACKUP_DIR" -name "*.json" | wc -l)
echo ""
echo "✅ 정리 완료!"
echo "📊 최종 파일 개수: $FINAL_COUNT"
echo "🗑️ 삭제된 파일: $((CURRENT_COUNT - FINAL_COUNT))개"
echo "💾 안전 백업: $SAFETY_BACKUP"

# 임시 파일 정리
rm -f /tmp/keep_files.txt

echo "🎉 환경변수 백업 파일 정리 완료! ($(date))" 