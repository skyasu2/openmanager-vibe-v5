#!/bin/bash

# Claude Code 서브 에이전트 상세 정보 수집 스크립트

OUTPUT_FILE="reports/subagents-details.txt"

echo "# Claude Code 서브 에이전트 상세 정보" > "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"
echo "생성일: $(date)" >> "$OUTPUT_FILE"
echo "총 서브 에이전트 수: $(ls .claude/agents/*.md 2>/dev/null | wc -l)" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# 각 서브 에이전트 정보 수집
for agent_file in .claude/agents/*.md; do
    if [[ -f "$agent_file" ]]; then
        basename=$(basename "$agent_file" .md)
        echo "==============================" >> "$OUTPUT_FILE"
        echo "=== $basename ===" >> "$OUTPUT_FILE"
        echo "==============================" >> "$OUTPUT_FILE"
        
        # 메타데이터 추출
        echo "" >> "$OUTPUT_FILE"
        echo "[메타데이터]" >> "$OUTPUT_FILE"
        grep -E "^(name:|description:|tools:)" "$agent_file" >> "$OUTPUT_FILE" 2>/dev/null || echo "메타데이터 없음" >> "$OUTPUT_FILE"
        
        # 주요 역할 추출
        echo "" >> "$OUTPUT_FILE"
        echo "[주요 역할 및 책임]" >> "$OUTPUT_FILE"
        grep -A 5 -E "(핵심 책임|주요 책임|전담 역할|Core Responsibilities)" "$agent_file" | head -20 >> "$OUTPUT_FILE" 2>/dev/null || echo "역할 정보 없음" >> "$OUTPUT_FILE"
        
        # MCP 사용 정보
        echo "" >> "$OUTPUT_FILE"
        echo "[MCP 활용]" >> "$OUTPUT_FILE"
        grep -A 5 -E "(MCP Tools|mcp__|Available MCP)" "$agent_file" | head -15 >> "$OUTPUT_FILE" 2>/dev/null || echo "MCP 정보 없음" >> "$OUTPUT_FILE"
        
        echo "" >> "$OUTPUT_FILE"
        echo "" >> "$OUTPUT_FILE"
    fi
done

echo "서브 에이전트 상세 정보 수집 완료: $OUTPUT_FILE"