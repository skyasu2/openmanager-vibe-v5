#!/bin/bash

# 간단한 훅 테스트
set -euo pipefail

echo "=== 훅 기능 간단 테스트 ==="
echo ""

# 1. post-edit-hook.sh 테스트
echo "1. post-edit-hook.sh 테스트"
TEST_FILE="test-auth-file.ts"
echo "// auth service test" > "$TEST_FILE"
OUTPUT=$(./hooks/post-edit-hook.sh "$TEST_FILE" 2>&1 | head -20)
echo "$OUTPUT" | grep -q "보안 중요 파일" && echo "✅ 보안 파일 감지 성공" || echo "❌ 보안 파일 감지 실패"
rm -f "$TEST_FILE"

echo ""

# 2. pre-database-hook.sh 테스트
echo "2. pre-database-hook.sh 테스트"
OUTPUT=$(./hooks/pre-database-hook.sh "delete" "DROP TABLE users" 2>&1)
EXIT_CODE=$?
echo "$OUTPUT" | grep -q "차단" && echo "✅ 위험한 DB 작업 차단 성공" || echo "❌ 위험한 DB 작업 차단 실패"

echo ""

# 3. agent-completion-hook.sh 테스트
echo "3. agent-completion-hook.sh 테스트"
./hooks/agent-completion-hook.sh "test-agent" "completed" "테스트 완료" >/dev/null 2>&1
[ -f ".claude/issues/agent-completion-test-agent-"* ] && echo "✅ 에이전트 완료 이슈 생성 성공" || echo "❌ 에이전트 완료 이슈 생성 실패"

echo ""

# 4. 훅 설정 파일 확인
echo "4. 훅 설정 파일 확인"
[ -f ".claude/settings.local.json" ] && echo "✅ 설정 파일 존재" || echo "❌ 설정 파일 없음"

echo ""

# 5. MCP 설정 확인
echo "5. MCP 설정 확인"
[ -f ".claude/mcp.json" ] && echo "✅ MCP 설정 파일 존재" || echo "❌ MCP 설정 파일 없음"

echo ""
echo "=== 테스트 완료 ==="