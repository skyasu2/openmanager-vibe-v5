---
name: exporting-ai-reports
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

### 4. Export to Repository

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
