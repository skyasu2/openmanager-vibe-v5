---
name: exporting-ai-reports
version: v1.1.0
description: Automated 3-AI verification result documentation and export workflow. Triggers when user requests AI verification report export, documentation of findings, or saving cross-validation results. Use after completing Codex/Gemini/Qwen analysis.
---

# AI Verification Report Export

**Target Token Efficiency**: 78% (450 tokens → 99 tokens)

## Purpose

Automated 3-AI verification result documentation without manual formatting or file organization.

## Trigger Keywords

- "export AI report"
- "document findings"
- "save verification results"
- "AI 검증 결과"
- "3-AI 결과"

## Context

- **Project**: OpenManager VIBE v5.80.0
- **AI Tools**: Codex, Gemini, Qwen (3-AI cross-verification)
- **Output Location**: logs/ai-decisions/
- **Average Decision Quality**: 9.2/10 (based on validation history)

## Workflow

### 1. Identify AI Outputs

**Required Information**:

- Codex analysis (실무 검증)
- Gemini review (아키텍처 검증)
- Qwen assessment (성능 검증)
- Task/feature being verified
- Verification timestamp

**Sources**:

```
/tmp/codex.txt (from codex-wrapper.sh)
/tmp/gemini.txt (from gemini-wrapper.sh)
/tmp/qwen.txt (from qwen-wrapper.sh)
```

### 2. Parse AI Responses

**Extract Key Data**:

- Each AI's score (x/10)
- Key findings (3-5 points each)
- Consensus points (agreements)
- Divergent points (disagreements)
- Recommended actions

**Automated Parsing** (Enhancement 1):

```bash
# Parse scores from AI outputs
CODEX_SCORE=$(awk '/score:|점수:/ {print $NF}' /tmp/codex.txt 2>/dev/null | grep -oE '[0-9]+\.[0-9]+|[0-9]+' | head -1)
GEMINI_SCORE=$(awk '/score:|점수:/ {print $NF}' /tmp/gemini.txt 2>/dev/null | grep -oE '[0-9]+\.[0-9]+|[0-9]+' | head -1)
QWEN_SCORE=$(awk '/score:|점수:/ {print $NF}' /tmp/qwen.txt 2>/dev/null | grep -oE '[0-9]+\.[0-9]+|[0-9]+' | head -1)

# Calculate average score
if [ -n "$CODEX_SCORE" ] && [ -n "$GEMINI_SCORE" ] && [ -n "$QWEN_SCORE" ]; then
  AVERAGE_SCORE=$(echo "scale=1; ($CODEX_SCORE + $GEMINI_SCORE + $QWEN_SCORE) / 3" | bc 2>/dev/null || echo "0")
else
  AVERAGE_SCORE="N/A"
  echo "⚠️  WARNING: Unable to parse all AI scores"
fi

# Extract key findings (first 5 bullet points from each AI)
CODEX_FINDINGS=$(grep -E "^- |^\* " /tmp/codex.txt 2>/dev/null | head -5)
GEMINI_FINDINGS=$(grep -E "^- |^\* " /tmp/gemini.txt 2>/dev/null | head -5)
QWEN_FINDINGS=$(grep -E "^- |^\* " /tmp/qwen.txt 2>/dev/null | head -5)
```

**Consensus Detection** (Enhancement 2):

```bash
# Extract common keywords across all 3 AI outputs
# Simple approach: Find keywords appearing in at least 2 outputs
CODEX_KEYWORDS=$(tr '[:upper:]' '[:lower:]' < /tmp/codex.txt | grep -oE '[a-z]{4,}' | sort | uniq)
GEMINI_KEYWORDS=$(tr '[:upper:]' '[:lower:]' < /tmp/gemini.txt | grep -oE '[a-z]{4,}' | sort | uniq)
QWEN_KEYWORDS=$(tr '[:upper:]' '[:lower:]' < /tmp/qwen.txt | grep -oE '[a-z]{4,}' | sort | uniq)

# Find intersection (keywords in at least 2 AIs)
CONSENSUS_KEYWORDS=$(echo "$CODEX_KEYWORDS $GEMINI_KEYWORDS $QWEN_KEYWORDS" | tr ' ' '
' | sort | uniq -c | awk '$1 >= 2 {print $2}')

# Generate consensus summary
CONSENSUS_SUMMARY="Common themes: $(echo $CONSENSUS_KEYWORDS | head -10 | tr '
' ', ' | sed 's/, $//')"
```

**Status Determination** (Enhancement 3):

```bash
# Threshold-based approval logic
if [ "$AVERAGE_SCORE" != "N/A" ]; then
  if (( $(echo "$AVERAGE_SCORE >= 9.0" | bc -l) )); then
    STATUS="✅ APPROVED"
    STATUS_REASON="High consensus (≥9.0), implementation recommended"
  elif (( $(echo "$AVERAGE_SCORE >= 8.0" | bc -l) )); then
    STATUS="⚠️  CONDITIONALLY APPROVED"
    STATUS_REASON="Good score (≥8.0), minor improvements suggested"
  elif (( $(echo "$AVERAGE_SCORE >= 7.0" | bc -l) )); then
    STATUS="🔄 NEEDS REVISION"
    STATUS_REASON="Moderate score (≥7.0), significant improvements required"
  else
    STATUS="❌ REJECTED"
    STATUS_REASON="Low score (<7.0), major redesign recommended"
  fi
else
  STATUS="⚠️  INCOMPLETE"
  STATUS_REASON="Unable to calculate average score (missing AI outputs)"
fi
```

**Template Structure**:

```markdown
# [Task Name] - 3-AI Verification

**Date**: YYYY-MM-DD HH:mm KST
**Status**: [APPROVED / CONDITIONALLY APPROVED / REJECTED]

## Scores

- Codex (실무): X.X/10
- Gemini (아키텍처): X.X/10
- Qwen (성능): X.X/10
- **Average**: X.X/10

## Consensus

[Agreed points across all 3 AIs]

## Key Findings

### Codex (실무 검증)

- Finding 1
- Finding 2
- Finding 3

### Gemini (아키텍처 검증)

- Finding 1
- Finding 2
- Finding 3

### Qwen (성능 검증)

- Finding 1
- Finding 2
- Finding 3

## Divergent Views

[Points where AIs disagree, if any]

## Recommended Actions

1. Priority 1: [Action]
2. Priority 2: [Action]
3. Priority 3: [Action]

## Decision Rationale

[Claude's final decision based on 3-AI input]
```

### 3. Generate Report File

**Filename Convention**:

```
logs/ai-decisions/YYYY-MM-DD-{task-slug}.md
```

**Example**:

```
logs/ai-decisions/2025-11-04-skills-implementation-verification.md
```

**✅ Enhancement 5: Filename Generation**

```bash
# Auto-generate filename slug from task name
# Input: TASK_NAME="Skills Implementation Verification"
# Output: skills-implementation-verification
TASK_SLUG=$(echo "$TASK_NAME" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g' | sed 's/^-//' | sed 's/-$//')

# Generate full filename with timestamp
FILENAME="logs/ai-decisions/$(date +%Y-%m-%d)-${TASK_SLUG}.md"

echo "📝 Report filename: $FILENAME"
```

**Slug Generation Logic**:

- Convert to lowercase: `tr '[:upper:]' '[:lower:]'`
- Replace non-alphanumeric with hyphens: `sed 's/[^a-z0-9]/-/g'`
- Collapse multiple hyphens: `sed 's/--*/-/g'`
- Trim leading hyphen: `sed 's/^-//'`
- Trim trailing hyphen: `sed 's/-$//'`

### 4. Export to Repository

**✅ Enhancement 4: Validation Workflow**

```bash
# Check file existence before parsing
MISSING=""
[ ! -f /tmp/codex.txt ] && MISSING="${MISSING}codex "
[ ! -f /tmp/gemini.txt ] && MISSING="${MISSING}gemini "
[ ! -f /tmp/qwen.txt ] && MISSING="${MISSING}qwen "

if [ -n "$MISSING" ]; then
  echo "⚠️  WARNING: Missing AI outputs: $MISSING"
  echo "   Report will be incomplete. Run wrapper scripts first:"
  echo "   ./scripts/ai-subagents/codex-wrapper.sh \"[query]\""
  echo "   ./scripts/ai-subagents/gemini-wrapper.sh \"[query]\""
  echo "   ./scripts/ai-subagents/qwen-wrapper.sh \"[query]\""
  exit 1
fi

# Validate AI output format (non-empty files)
for ai_file in /tmp/codex.txt /tmp/gemini.txt /tmp/qwen.txt; do
  if [ ! -s "$ai_file" ]; then
    echo "❌ ERROR: Empty AI output file: $ai_file"
    exit 1
  fi
done

echo "✅ Validation passed: All AI outputs present and non-empty"
```

**File Location**:

- Primary: `logs/ai-decisions/`
- Backup: `/tmp/ai-verification-backup/`

**Verify Export**:

- ✅ File created in correct directory
- ✅ Markdown formatting valid
- ✅ All 3 AI outputs included
- ✅ Timestamp accurate
- ✅ Filename follows convention

### 5. Report Summary

**Format**:

```
📝 AI Verification Report Exported

📊 Summary:
├─ Task: [Task Name]
├─ Average Score: X.X/10
├─ Status: [APPROVED / CONDITIONAL / REJECTED]
├─ File: logs/ai-decisions/YYYY-MM-DD-{task-slug}.md
└─ Duration: Xs

✅ Next Steps:
- Review consensus points
- Implement recommended actions
- Update task status
```

## Token Optimization Strategy

**Before (Manual)**:

```
User: "3-AI 검증 결과를 정리해줘"
Assistant: [reads /tmp/*.txt, formats markdown, asks for filename, creates file, explains structure]
Tokens: ~450
```

**After (Skill)**:

```
User: "export AI report"
Skill: [parses outputs, auto-generates filename, creates file, reports summary]
Tokens: ~99 (78% reduction)
```

**Efficiency Gains**:

- ❌ No need to explain report structure
- ❌ No need to manually format markdown
- ✅ Auto-parse AI outputs
- ✅ Auto-generate filename
- ✅ Structured export process

## Common Report Types

### Type 1: Implementation Verification

```markdown
Task: Feature X Implementation
Status: APPROVED (9.2/10)
Consensus: Architecture SOLID-compliant, performance acceptable
Actions: Minor refactoring suggestions
```

### Type 2: Bug Analysis

```markdown
Task: Bug Y Root Cause Analysis
Status: CONDITIONALLY APPROVED (8.5/10)
Consensus: Root cause identified, fix proposed
Divergence: Qwen suggests additional optimization
Actions: Implement fix + consider optimization
```

### Type 3: Architecture Review

```markdown
Task: System Z Design Review
Status: REJECTED (6.8/10)
Consensus: Major SOLID violations detected
Critical Issues: 5 violations, 3 security risks
Actions: Redesign required
```

## Edge Cases

**Case 1: Missing AI Output**

- Check: Verify all 3 files exist (`/tmp/codex.txt`, `/tmp/gemini.txt`, `/tmp/qwen.txt`)
- Action: Report which AI outputs are missing
- Fallback: Export available outputs only, note incomplete verification

**Case 2: Parsing Errors**

- Check: Validate AI output format (score patterns, structured responses)
- Action: Report parsing issues, extract raw outputs
- Fallback: Manual review required flag in report

**Case 3: Duplicate Reports**

- Check: Verify filename doesn't already exist
- Action: Append timestamp suffix (`-v2`, `-v3`)
- Prevention: Unique task slugs

**Case 4: Large Outputs**

- Check: AI output file sizes > 50KB
- Action: Truncate to key findings only
- Include: Full output reference path

## Success Criteria

- Report generated: < 2 min
- All 3 AI outputs included: 100%
- Markdown formatting valid: ✅
- Filename convention followed: ✅
- No manual intervention required

## Related Skills

- `tests/lint-smoke.md` - If testing verification results
- `performance/next-router-bottleneck.md` - If performance analysis verification

## Changelog

- 2025-11-04: Initial implementation (Phase 1)
