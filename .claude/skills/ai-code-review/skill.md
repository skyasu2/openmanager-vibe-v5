---
name: multi-ai-code-review
version: v1.2.0
description: Multi-AI code review orchestration using Codex, Gemini, Claude with automatic fallback. Triggers when user requests AI code review, cross-validation, or multi-AI analysis. Integrates with existing auto-ai-review.sh workflow.
---

# Multi-AI Code Review Skill

**Target Token Efficiency**: 70% (400 tokens → 120 tokens)

## Purpose

Orchestrate external AI tools (Codex, Gemini, Claude) for code review with automatic fallback chain, without requiring manual script execution or detailed setup explanation.

## Trigger Keywords

- "ai code review"
- "codex review"
- "gemini review"
- "claude review"
- "qwen review"
- "multi-ai review"
- "cross-ai validation"
- "AI 코드 리뷰"
- "코드 리뷰 실행"
- "외부 AI 리뷰"
- "자동 코드 리뷰"
- "리뷰 결과 분석"
- "AI 검증"
- "이슈 트래커"
- "크리티컬 이슈"

## Context

- **Project**: OpenManager VIBE v5.85.0
- **Script Version**: auto-ai-review.sh v6.13.0
- **Primary AI Rotation**: Codex → Gemini → Qwen (3-AI 1:1:1 순환)
- **Fallback Chain**: Primary → Qwen → Claude
- **Average Response**: ~10초
- **Availability**: 99.99%
- **Issue Tracker**: `scripts/code-review/review-issue-tracker.sh`

## Workflow

### 1. Check Review Status

```bash
# Check if review already exists for latest commit
ls -la reports/ai-review/review-*-$(date +%Y-%m-%d)*.md 2>/dev/null | tail -5
```

**Expected Output**:
- Files exist: Review already completed
- No files: Ready for new review

### 2. Check AI Usage State

```bash
# View current AI rotation state
cat reports/ai-review/.ai-usage-state 2>/dev/null || echo "No state file"
```

**Expected State**:
```
codex_count=422
gemini_count=334
qwen_count=296
claude_count=0
last_ai=qwen
```

### 3. Execute Auto Review (Manual Trigger)

```bash
# Run the auto review script
bash scripts/code-review/auto-ai-review.sh
```

**Expected Outcomes**:
- ✅ Success: Review file created in `reports/ai-review/`
- ⏭️ Skip: Commit already reviewed (duplicate prevention)
- ⚠️ Fallback: Primary AI failed, using fallback
- ❌ Fail: All AIs failed (very rare)

### 4. Analyze Review Results

```bash
# Read latest review
LATEST_REVIEW=$(ls -t reports/ai-review/review-*.md 2>/dev/null | head -1)
if [ -f "$LATEST_REVIEW" ]; then
    head -50 "$LATEST_REVIEW"
fi
```

### 5. Direct AI Queries (Optional)

**Codex Direct**:
```bash
bash scripts/ai-wrappers/codex-wrapper.sh "리뷰 요청: [내용]"
```

**Gemini Direct**:
```bash
bash scripts/ai-wrappers/gemini-wrapper.sh "리뷰 요청: [내용]"
```

**Qwen Direct**:
```bash
bash scripts/ai-wrappers/qwen-wrapper.sh "리뷰 요청: [내용]"
```

## Report Summary Format

```
🤖 AI Code Review Results
├─ AI Used: [CODEX|GEMINI|QWEN|CLAUDE]
├─ Response Time: Xs
├─ Commit: abc1234
├─ Status: ✅ Success / ⚠️ Fallback / ❌ Failed
└─ Review File: reports/ai-review/review-{AI}-{DATE}.md

📋 Key Findings:
1. [Finding 1]
2. [Finding 2]
3. [Finding 3]
```

## Token Optimization Strategy

**Before (Manual)**:
```
User: "코드 리뷰해줘"
Assistant: [explains AI system, reads scripts, checks state, runs commands, parses output]
Tokens: ~400
```

**After (Skill)**:
```
User: "ai code review"
Skill: [executes workflow, reports summary]
Tokens: ~120 (70% reduction)
```

## Fallback Chain Logic

```
Primary Selection (3-AI 1:1:1 rotation):
├─ last_ai=codex  → Next: gemini
├─ last_ai=gemini → Next: claude
└─ last_ai=claude → Next: codex

Fallback Order (v6.7.0):
1. Primary AI (selected from rotation)
2. Qwen (immediate fallback)
3. Claude (final fallback, if Primary wasn't Claude)

Note: Claude CLI usage fixed (2025-12-07)
- Wrong: `echo "$query" | claude -p "Code Reviewer"`
- Correct: `claude -p "$query"`
```

## Edge Cases

**Case 1: Rate Limit**
- Automatic detection via exit code
- Immediate fallback to next AI
- Logged in review file

**Case 2: Timeout (600s)**
- Script auto-terminates
- Falls back to next AI
- User notified

**Case 3: Duplicate Review**
- Detected via `.reviewed-commits` file
- Skipped automatically (v6.5.0)
- No redundant API calls

**Case 4: Lock File Exists**
- Another review in progress
- Script exits gracefully
- Retry after 5 minutes (auto-timeout)

## Troubleshooting

**AI CLI Not Found**:
```bash
# Check installations
which codex gemini qwen claude
```

**Wrapper/CLI Errors**:
```bash
# Test each wrapper
bash scripts/ai-wrappers/codex-wrapper.sh "test"
bash scripts/ai-wrappers/gemini-wrapper.sh "test"
bash scripts/ai-wrappers/qwen-wrapper.sh "test"
# Test Claude CLI directly (no wrapper needed)
claude -p "Say hello"
```

**Clear Stuck Lock**:
```bash
rm -f reports/ai-review/.review-lock
```

## Success Criteria

- AI Response: Within 600초 timeout
- Review File: Created successfully
- Format: Valid markdown
- No manual intervention required

## Related Skills

- `lint-smoke` - Pre-review code quality check
- `validation-analysis` - Post-commit validation
- `ai-report-export` - Export review results

## Issue Tracking

### Scan Critical Issues

```bash
bash scripts/code-review/review-issue-tracker.sh scan
```

### Generate Report

```bash
bash scripts/code-review/review-issue-tracker.sh report
```

### Mark Human Reviewed

```bash
bash scripts/code-review/review-issue-tracker.sh human <commit_hash> "description"
```

### Tracking Files

- `.reviewed-commits` - AI reviewed commit hashes
- `.reviewed-by-human` - Human verified commits
- `.issue-tracking.json` - Resolved issues JSON

## Changelog

- 2025-12-29: v1.2.0 - 이슈 트래커 통합
  - review-issue-tracker.sh 추가
  - .issue-tracking.json 이슈 추적 JSON
  - AI 리뷰 섹션만 스캔 (오탐 필터링)
  - 15 trigger keywords 추가 ("이슈 트래커", "크리티컬 이슈")
- 2025-12-07: v1.1.0 - Claude CLI 수정 및 3-AI 순환 복원
  - auto-ai-review.sh v6.7.0 연동
  - 3-AI 1:1:1 rotation (Codex → Gemini → Qwen)
  - 폴백 체인: Primary → Qwen → Claude (복원)
  - Claude CLI 수정: `claude -p "$query"` (올바른 사용법)
  - 13 trigger keywords (Korean/English) + "claude review" 추가
- 2025-12-07: v1.0.0 - Initial implementation
  - Integrated with auto-ai-review.sh v6.5.0
  - Support for 1:1:1 primary rotation
  - 12 trigger keywords (Korean/English)
  - Direct wrapper access for manual queries
