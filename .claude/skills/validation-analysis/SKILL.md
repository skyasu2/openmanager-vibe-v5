---
name: validation-analysis
version: v1.1.0
description: Automated validation results analysis for post-commit workflow. Triggers when user requests validation analysis, code review summary, or checking background validation results. Analyzes Biome, TypeScript, and AI review reports.
---

# Post-Commit Validation Analysis

**Target Token Efficiency**: 75% (400 tokens → 100 tokens)

## Purpose

Automated analysis of background validation results (Biome + TypeScript + AI Review) generated after commit.

## Trigger Keywords

- "검증 결과"
- "검증 결과 분석"
- "validation results"
- "analyze validation"
- "check validation"
- "review results"
- "post-commit results"
- "background validation"
- "코드 검증 확인"
- "리뷰 결과"

## Context

- **Project**: OpenManager VIBE v5.80.0
- **Validation Workflow**: post-commit hook (background, 5min timeout)
- **Output Location**: `/tmp/validation-complete-latest.md`
- **Components**:
  - Biome: Full codebase lint + format check → `logs/lint-reports/`
  - TypeScript: Type check → `logs/typecheck-reports/`
  - AI Review: Codex → Gemini → Qwen rotation → `logs/code-reviews/`

## Workflow

### 1. Check Summary File Existence

```bash
if [ -f "/tmp/validation-complete-latest.md" ]; then
  echo "✅ Validation summary found"
else
  echo "⚠️ No validation summary yet. Run 'git commit' first."
  exit 0
fi
```

### 2. Read and Parse Summary

Read `/tmp/validation-complete-latest.md` and extract:
- Commit hash
- Timestamp
- Report file paths
- Preview results

### 3. Analyze Each Component

#### A. Biome Results

**Check for**:
- ✅ Pass: No errors
- ⚠️ Warnings: < 5 acceptable
- ❌ Errors: Immediate action required

**Common Issues**:
- Type errors (strict mode violations)
- Unused variables
- Import organization issues

#### B. TypeScript Results

**Check for**:
- ✅ Pass: No type errors
- ❌ Fail: Type errors found

**Common Issues**:
- Missing type annotations
- Type mismatches
- `any` type usage

#### C. AI Review Results

**Role Separation**:
- 🤖 **Codex/Gemini**: Auto-review changed files (external AI, post-commit)
- 🧠 **Claude Code**: Analyze results and apply fixes to code (this Skill)

**Check for**:
- Review score (1-10)
- Critical findings from Codex/Gemini
- Improvement suggestions

**Extract**:
- 🔴 Critical issues (security, performance) → Apply fixes
- 🟡 Warnings (code quality) → Review and improve
- 🔵 Suggestions (best practices) → Consider for next commit

**Claude Code Action**:
1. Read Codex/Gemini review results
2. Analyze findings
3. **Apply improvements to actual code**
4. Re-run validation to verify fixes

### 4. Generate Priority Action List

**Format**:

```
📊 Validation Analysis Summary

Commit: [hash]
Date: [timestamp]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔍 Biome: [✅ Pass / ⚠️ Warnings / ❌ Errors]
📝 TypeScript: [✅ Pass / ❌ Fail]
🤖 AI Review: [Score]/10

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 Priority Actions:

1. [CRITICAL] Fix TypeScript errors in X files
   → See: logs/typecheck-reports/typecheck-YYYYMMDD-HHMMSS.md

2. [HIGH] Address AI review security concerns
   → See: logs/code-reviews/review-AI-YYYYMMDD-HHMMSS.md

3. [MEDIUM] Resolve Biome warnings
   → Run: npm run lint:fix

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📁 Full Reports:
- ESLint: [path]
- TypeScript: [path]
- AI Review: [path]

💡 Next Steps:
- Fix critical issues first
- Re-run validation after fixes
- Commit improvements with --no-verify if needed
```

### 5. Smart Recommendations

**If All Pass**:
```
✅ All validations passed!
🚀 Code quality is excellent.
💡 No action required. Safe to push.
```

**If Only Warnings**:
```
⚠️ Minor issues detected.
✅ Safe to push if urgent.
💡 Recommended: Fix warnings in next commit.
```

**If Errors Exist**:
```
❌ Critical issues found!
🛑 DO NOT push to production.
💡 Required: Fix errors before deployment.
```

## Token Optimization Strategy

**Before (Manual)**:

```
User: "검증 결과 분석해줘"
Assistant: [reads summary file, reads each report, parses results, explains findings, formats output]
Tokens: ~400
```

**After (Skill)**:

```
User: "검증 결과"
Skill: [executes workflow, generates priority list]
Tokens: ~100 (75% reduction)
```

**Efficiency Gains**:

- ❌ No need to explain validation workflow
- ❌ No need to read multiple report files
- ✅ Direct summary parsing
- ✅ Structured action list
- ✅ Smart priority sorting

## Edge Cases

**Case 1: Summary File Not Found**

- Message: "No validation results yet. Did you commit recently?"
- Action: Wait 5 minutes after commit (background tasks running)

**Case 2: Empty or Corrupted Summary**

- Check: File size > 0 bytes
- Fallback: Read individual report files directly

**Case 3: Reports Still Generating**

- Symptom: Summary exists but report paths missing
- Message: "Validation in progress. Check again in 2-3 minutes."

**Case 4: All Reports Missing**

- Check: Background tasks may have timed out
- Action: Manually run validation scripts:
  ```bash
  bash scripts/lint/run-lint-check.sh
  bash scripts/typecheck/run-typecheck.sh
  bash scripts/code-review/auto-ai-review.sh
  ```

## Success Criteria

- Summary file parsed successfully
- All 3 components analyzed
- Priority action list generated
- Clear next steps provided
- No manual file reading required

## Integration with Other Skills

**Trigger Sequence**:
1. User commits code
2. post-commit hook runs (background)
3. After 5+ minutes, user asks: "검증 결과"
4. This Skill activates
5. If issues found, suggest:
   - `lint-smoke` - For quick re-validation
   - `security-audit-workflow` - If security issues detected

## Related Skills

- `lint-smoke` - Quick re-validation after fixes
- `security-audit-workflow` - Deep security analysis
- `playwright-triage` - E2E test failure analysis
- `ai-report-export` - Export AI review results

## Workflow Integration

**Post-Commit Flow**:
```
git commit
  ↓
.husky/post-commit (background)
  ↓
ESLint + TypeScript + AI Review (parallel, 5min timeout)
  ↓
create-summary.sh (aggregates results)
  ↓
/tmp/validation-complete-latest.md
  ↓
[User requests] "검증 결과"
  ↓
This Skill analyzes and reports
```

## Changelog

- 2025-12-12: v1.1.0 - Tech stack upgrade alignment
  - ESLint → Biome migration (v2.3.8)
  - AI Review rotation: Codex → Gemini → Qwen
- 2025-11-27: v1.0.0 - Initial implementation
  - Automated validation results parsing
  - Priority action list generation
  - Smart recommendations based on severity
  - 75% token efficiency improvement
