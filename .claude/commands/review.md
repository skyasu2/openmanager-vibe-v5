---
description: Check latest AI code review results and show summary
---

Read `logs/validation/validation-complete-latest.md` and analyze the validation results.

## Analysis Steps

1. **Check file existence** - If not found, say "No validation results yet"

2. **Extract key info**:
   - Commit hash
   - Timestamp
   - ESLint result (errors/warnings count)
   - TypeScript result (pass/fail)
   - AI review file path

3. **Read AI review file** and extract:
   - Score (X/10)
   - Approval status (승인/거부/조건부)
   - Critical issues (if any)

4. **Generate summary table**:

```
| Component   | Status | Details |
|-------------|--------|---------|
| ESLint      | ?      | X errors, Y warnings |
| TypeScript  | ?      | pass/fail |
| AI Review   | ?      | X/10, [AI Engine] |
```

5. **If score < 7 or rejected**:
   - List critical issues
   - Suggest: "bash scripts/code-review/review-issue-tracker.sh scan"

6. **If all pass**:
   - Say "All validations passed. Safe to push."

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
