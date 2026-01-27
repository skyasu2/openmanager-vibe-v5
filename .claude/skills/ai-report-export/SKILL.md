---
name: ai-report-export
description: Automated 2-AI verification result documentation and export workflow. Triggers when user requests AI verification report export, documentation of findings, or saving cross-validation results. Use after completing Codex/Gemini analysis.
version: v2.0.0
user-invocable: true
allowed-tools: Bash, Read, Write
---

# AI Verification Report Export

**Target Token Efficiency**: 78% (450 tokens → 99 tokens)

## Purpose

Automated 2-AI verification result documentation without manual formatting or file organization.

## Trigger Keywords

- "export AI report"
- "document findings"
- "save verification results"
- "AI 검증 결과"
- "2-AI 결과"

## Context

- **Project**: OpenManager VIBE v5.85.0
- **AI Tools**: Codex, Gemini (2-AI cross-verification)
- **Output Location**: logs/ai-decisions/
- **Note**: Qwen 제거됨 (2026-01-07) - 평균 201초, 실패율 13.3%

## Workflow

### 1. Identify AI Outputs

**Required Information**:

- Codex analysis (실무 검증)
- Gemini review (아키텍처 검증)
- Task/feature being verified
- Verification timestamp

**Sources**:

```
/tmp/codex.txt (from codex-wrapper.sh)
/tmp/gemini.txt (from gemini-wrapper.sh)
```

### 2. Parse AI Responses

**Extract Key Data**:

- Each AI's score (x/10)
- Key findings (3-5 points each)
- Consensus points (agreements)
- Divergent points (disagreements)
- Recommended actions

**Automated Parsing**:

```bash
# Parse scores from AI outputs
CODEX_SCORE=$(awk '/score:|점수:/ {print $NF}' /tmp/codex.txt 2>/dev/null | grep -oE '[0-9]+\.[0-9]+|[0-9]+' | head -1)
GEMINI_SCORE=$(awk '/score:|점수:/ {print $NF}' /tmp/gemini.txt 2>/dev/null | grep -oE '[0-9]+\.[0-9]+|[0-9]+' | head -1)

# Calculate average score (2-AI)
if [ -n "$CODEX_SCORE" ] && [ -n "$GEMINI_SCORE" ]; then
  AVERAGE_SCORE=$(echo "scale=1; ($CODEX_SCORE + $GEMINI_SCORE) / 2" | bc 2>/dev/null || echo "0")
else
  AVERAGE_SCORE="N/A"
  echo "⚠️  WARNING: Unable to parse all AI scores"
fi
```

**Status Determination**:

```bash
# Threshold-based approval logic
if [ "$AVERAGE_SCORE" != "N/A" ]; then
  if (( $(echo "$AVERAGE_SCORE >= 9.0" | bc -l) )); then
    STATUS="✅ APPROVED"
  elif (( $(echo "$AVERAGE_SCORE >= 8.0" | bc -l) )); then
    STATUS="⚠️  CONDITIONALLY APPROVED"
  elif (( $(echo "$AVERAGE_SCORE >= 7.0" | bc -l) )); then
    STATUS="🔄 NEEDS REVISION"
  else
    STATUS="❌ REJECTED"
  fi
else
  STATUS="⚠️  INCOMPLETE"
fi
```

**Template Structure**:

```markdown
# [Task Name] - 2-AI Verification

**Date**: YYYY-MM-DD HH:mm KST
**Status**: [APPROVED / CONDITIONALLY APPROVED / REJECTED]

## Scores

- Codex (실무): X.X/10
- Gemini (아키텍처): X.X/10
- **Average**: X.X/10

## Key Findings

### Codex (실무 검증)

- Finding 1
- Finding 2
- Finding 3

### Gemini (아키텍처 검증)

- Finding 1
- Finding 2
- Finding 3

## Recommended Actions

1. Priority 1: [Action]
2. Priority 2: [Action]
```

### 3. Generate Report File

**Filename Convention**:

```
logs/ai-decisions/YYYY-MM-DD-{task-slug}.md
```

### 4. Validation

```bash
# Check file existence before parsing
MISSING=""
[ ! -f /tmp/codex.txt ] && MISSING="${MISSING}codex "
[ ! -f /tmp/gemini.txt ] && MISSING="${MISSING}gemini "

if [ -n "$MISSING" ]; then
  echo "⚠️  WARNING: Missing AI outputs: $MISSING"
  exit 1
fi
```

### 5. Report Summary

```
📝 AI Verification Report Exported

📊 Summary:
├─ Task: [Task Name]
├─ Average Score: X.X/10
├─ Status: [APPROVED / CONDITIONAL / REJECTED]
└─ File: logs/ai-decisions/YYYY-MM-DD-{task-slug}.md

✅ Next Steps:
- Review consensus points
- Implement recommended actions
```

## Success Criteria

- Report generated: < 2 min
- Both AI outputs included: 100%
- Markdown formatting valid: ✅
- Filename convention followed: ✅

## Changelog

- 2026-01-10: v2.0.0 - 2-AI 시스템으로 전환 (Qwen 제거)
- 2025-11-04: v1.1.0 - Initial implementation
