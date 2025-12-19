---
description: Check latest AI code review results and show summary
---

Read `/tmp/validation-complete-latest.md` and analyze the validation results.

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
   - Ask: "이슈 수정할까요? 또는 오탐이면 '/fp' 명령어로 기록하세요"

6. **If all pass**:
   - Say "All validations passed. Safe to push."
