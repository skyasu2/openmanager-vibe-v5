#!/bin/bash

# 서브 에이전트 목록 및 설명 추출
AGENT_DIR="/mnt/d/cursor/openmanager-vibe-v5/.claude/agents"

echo "=== 서브 에이전트 목록 및 테스트 결과 ==="
echo ""

agents=(
  "ai-systems-engineer"
  "central-supervisor"
  "code-review-specialist"
  "database-administrator"
  "debugger-specialist"
  "dev-environment-manager"
  "documentation-manager"
  "gcp-vm-specialist"
  "gemini-cli-collaborator"
  "git-cicd-specialist"
  "mcp-server-admin"
  "quality-control-checker"
  "security-auditor"
  "structure-refactor-agent"
  "test-automation-specialist"
  "ux-performance-optimizer"
  "vercel-platform-specialist"
)

for agent in "${agents[@]}"; do
  echo "[$agent]"
  if [ -f "$AGENT_DIR/$agent.md" ]; then
    # description 추출 (3번째 줄)
    desc=$(sed -n '3p' "$AGENT_DIR/$agent.md" | sed 's/^description: //')
    echo "설명: ${desc:0:100}..."
    
    # tools 추출 (4번째 줄)
    tools=$(sed -n '4p' "$AGENT_DIR/$agent.md" | sed 's/^tools: //')
    echo "도구: $tools"
  else
    echo "❌ 파일 없음"
  fi
  echo ""
done

echo "=== 문제점 분석 ==="
echo ""


# 중복 역할 확인
echo "2. 역할 중복 체크:"
echo "- 코드 품질 그룹: code-review-specialist, quality-control-checker, structure-refactor-agent"
echo "- 개발 환경 그룹: dev-environment-manager, gcp-vm-specialist"
echo "- AI 개발 그룹: ai-systems-engineer, gemini-cli-collaborator"