#!/bin/bash

# 초최소화 데이터베이스 보호 훅
# 오직 파괴적 작업만 차단

QUERY="${2:-}"

# 데이터베이스/테이블 완전 삭제만 차단
if [[ "$QUERY" =~ (DROP DATABASE|DROP TABLE|TRUNCATE) ]]; then
    echo "🚨 파괴적 DB 작업 차단됨"
    exit 1
fi

# 나머지는 모두 Claude Code의 자율 판단에 위임
exit 0