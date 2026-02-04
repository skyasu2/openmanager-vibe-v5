---
description: Run real-time code quality checks and show AI review summary
---

Perform real-time validation and show current code quality status.

## Workflow

### Step 1: Run Real-Time Checks (Parallel)

Execute both checks in parallel using Bash:

```bash
npm run lint 2>&1 | tail -5
```

```bash
npm run type-check 2>&1 | tail -5
```

### Step 2: Check Review Gap

```bash
# Last reviewed commit
if [ -f "reports/ai-review/.last-reviewed-commit" ]; then
  LAST=$(cat reports/ai-review/.last-reviewed-commit)
  CURRENT=$(git rev-parse --short HEAD)
  GAP=$(git rev-list --count ${LAST}..HEAD 2>/dev/null || echo "?")
  echo "Last reviewed: ${LAST} | Current: ${CURRENT} | Gap: ${GAP} commits"
else
  echo "No review history found"
fi
```

### Step 3: Check Pending AI Reviews

```bash
ls reports/ai-review/pending/*.md 2>/dev/null | head -5 || echo "No pending reviews"
```

### Step 4: Recent Review History

```bash
tail -5 reports/ai-review/.evaluation-log 2>/dev/null || echo "No evaluation history"
```

### Step 5: Generate Summary

Present results as a table:

```
| Check       | Status | Details              |
|-------------|--------|----------------------|
| Biome Lint  | ?      | errors/warnings      |
| TypeScript  | ?      | pass/fail            |
| AI Review   | ?      | pending count, score |
| Review Gap  | ?      | N commits behind     |
```

### Step 6: Recommended Actions

**If lint or type-check fails**:
- List the errors concisely
- Suggest: `npm run lint:fix` for auto-fixable issues

**If pending AI reviews exist**:
- Suggest: `/ai-code-review` to analyze and act on them

**If review gap > 5 commits**:
- Suggest: `bash scripts/code-review/auto-ai-review.sh` to generate new review

**If all pass and no pending reviews**:
- Say "All checks pass. Safe to push."

## Issue Tracking

For detailed issue management:
```bash
# Scan for critical issues
bash scripts/code-review/review-issue-tracker.sh scan

# View issue summary report
bash scripts/code-review/review-issue-tracker.sh report

# Mark as human reviewed
bash scripts/code-review/review-issue-tracker.sh human <commit_hash> "description"
```
