#!/bin/bash

# 최소화된 데이터베이스 보호 훅
# 정말 위험한 작업만 차단, 나머지는 경고만

OPERATION="${1:-}"
QUERY="${2:-}"

# 치명적 작업만 차단 (데이터베이스/테이블 삭제)
if [[ "$QUERY" =~ (DROP DATABASE|DROP TABLE|TRUNCATE) ]]; then
    echo "🚨 위험한 DB 작업이 차단되었습니다."
    echo ""
    echo "대안:"
    echo "1. database-administrator 에이전트 사용"
    echo "2. 백업 후 수동 실행"
    exit 1
fi

# DELETE/UPDATE는 경고만 (차단하지 않음)
if [[ "$QUERY" =~ (DELETE FROM|UPDATE.*SET) ]]; then
    echo "⚠️  주의: 데이터 변경 작업입니다."
    echo "💡 팁: WHERE 절을 다시 확인하세요."
fi

# 정상 진행
exit 0