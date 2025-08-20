#!/bin/bash

# 최소화된 에이전트 완료 추적 훅
# 간단한 로그만 남기고 복잡한 처리 제거

AGENT_NAME="${1:-unknown}"
STATUS="${2:-unknown}"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# 간단한 로그만 남기기
echo "[$TIMESTAMP] $AGENT_NAME: $STATUS" >> .claude/audit/agent-log.txt

# 실패한 경우만 간단히 알림
if [ "$STATUS" = "failed" ]; then
    echo "⚠️ $AGENT_NAME 실행 실패"
fi

# 항상 성공
exit 0