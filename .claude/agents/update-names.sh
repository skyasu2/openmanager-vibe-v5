#!/bin/bash
# 서브에이전트 name 필드 일괄 업데이트 스크립트

# 파일과 새 이름 매핑
declare -A name_map=(
    ["dev-debug-agent.md"]="dev-debug-agent"
    ["dev-ai-systems-agent.md"]="dev-ai-systems-agent"
    ["test-automation-agent.md"]="test-automation-agent"
    ["test-quality-agent.md"]="test-quality-agent"
    ["infra-database-agent.md"]="infra-database-agent"
    ["infra-gcp-agent.md"]="infra-gcp-agent"
    ["infra-vercel-agent.md"]="infra-vercel-agent"
    ["infra-mcp-agent.md"]="infra-mcp-agent"
    ["infra-environment-agent.md"]="infra-environment-agent"
    ["ops-cicd-agent.md"]="ops-cicd-agent"
    ["ops-docs-agent.md"]="ops-docs-agent"
    ["ops-security-agent.md"]="ops-security-agent"
    ["ops-coordinator-agent.md"]="ops-coordinator-agent"
    ["ui-performance-agent.md"]="ui-performance-agent"
    ["tool-gemini-agent.md"]="tool-gemini-agent"
    ["tool-qwen-agent.md"]="tool-qwen-agent"
)

# 각 파일의 name 필드 업데이트
for file in "${!name_map[@]}"; do
    new_name="${name_map[$file]}"
    if [ -f "$file" ]; then
        # name: 라인만 변경
        sed -i "s/^name: .*/name: $new_name/" "$file"
        echo "✅ Updated $file -> name: $new_name"
    fi
done

echo "완료!"