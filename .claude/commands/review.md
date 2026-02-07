---
description: Run real-time code quality checks
---

Perform real-time validation and show current code quality status.

## Workflow

### Step 1: Run Checks (Parallel)

Execute both checks in parallel using Bash:

```bash
npm run lint 2>&1 | tail -5
```

```bash
npm run type-check 2>&1 | tail -5
```

### Step 2: Recent Commits

```bash
git log --oneline -5
```

### Step 3: Generate Summary

Present results as a table:

```
| Check       | Status | Details         |
|-------------|--------|-----------------|
| Biome Lint  | ?      | errors/warnings |
| TypeScript  | ?      | pass/fail       |
```

**If lint or type-check fails**:
- List the errors concisely
- Suggest: `npm run lint:fix` for auto-fixable issues

**If all pass**:
- Say "All checks pass. Safe to push."
