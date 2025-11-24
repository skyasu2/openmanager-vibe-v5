---
name: checking-code-quality
version: v1.0.0
description: Automated lint and test smoke check workflow for code quality verification. Triggers when user requests code quality checks, lint execution, test validation, or smoke testing. Use for pre-commit checks or quality gates.
---

# Lint & Test Smoke Check

**Target Token Efficiency**: 62% (300 tokens → 114 tokens)

## Purpose

Automated lint + test workflow for quick code quality verification without manual commands.

## Trigger Keywords

- "check code quality"
- "run lint and tests"
- "smoke check"
- "verify code"
- "validate code"
- "pre-commit check"
- "quality gate"
- "코드 검증"
- "test파일 실행"
- "품질 체크"

## Context

- **Project**: OpenManager VIBE v5.80.0
- **Test Framework**: Vitest v3.2.4
- **Linter**: ESLint + TypeScript strict mode
- **Current Pass Rate**: 88.9% (639/719 tests)
- **Fast Test Target**: < 25초

## Workflow

### 0. Pre-Check: ESLint Configuration

**Verify strict mode settings**:

```bash
# Check for TypeScript strict rules
grep -E "(no-explicit-any|strict)" .eslintrc.json
```

**Expected Rules**:

- ✅ `@typescript-eslint/no-explicit-any`: `"error"` (any 타입 금지)
- ✅ `@typescript-eslint/strict-boolean-expressions`: enabled
- ✅ `@typescript-eslint/no-unsafe-assignment`: enabled

**If Missing**:

```
⚠️ Warning: TypeScript strict 규칙 누락 감지
권장: .eslintrc.json에 다음 규칙 추가 필요
  - @typescript-eslint/no-explicit-any: "error"
  - @typescript-eslint/strict-boolean-expressions: "error"
```

### 1. Run Lint Check

```bash
npm run lint
```

**Expected Output**:

- ✅ No ESLint errors
- ⚠️ Warnings acceptable if < 5개
- ❌ Errors require immediate fix

**Auto-Fix Detection**:

If errors are detected, check for auto-fixable issues:

```bash
# Attempt auto-fix for common issues
npm run lint:fix

# Re-verify after auto-fix
npm run lint
```

**Common Auto-Fixable Issues**:

- Missing semicolons
- Trailing whitespace
- Import order violations
- Spacing inconsistencies

**Manual Fix Required**:

- TypeScript type errors
- Unused variables (`any` type violations)
- Logic errors in code flow

### 2. Run Fast Tests

```bash
npm run test:quick
```

**Expected Metrics**:

- Duration: < 25초 (target: 21초)
- Pass Rate: ≥ 88.9% (639/719)
- Failed Tests: < 80개

### 3. Analyze Results

**If All Pass**:

- ✅ Code quality verified
- ✅ Ready for commit
- Action: Proceed with git commit

**If Lint Fails**:

- ❌ Fix ESLint errors first
- Run: `npm run lint:fix` (if auto-fixable)
- Re-run lint check

**If Tests Fail**:

- 📊 Check failure count vs baseline (80 failed)
- ⚠️ New failures: Investigate immediately
- ✅ Same failures: Known issues, can proceed

### 4. Report Summary

**Format**:

```
🧪 Smoke Check Results
├─ Lint: ✅ Pass / ❌ Fail (N errors)
├─ Tests: ✅ 639/719 (88.9%) / ⚠️ X/719 (Y%)
├─ Duration: Xs (target: <25s)
└─ Status: ✅ Ready / ⚠️ Review / ❌ Fix Required
```

## Token Optimization Strategy

**Before (Manual)**:

```
User: "코드 품질 체크해줘"
Assistant: [reads package.json, explains lint, explains test, runs commands, parses output, formats report]
Tokens: ~300
```

**After (Skill)**:

```
User: "check code quality"
Skill: [executes workflow, reports summary]
Tokens: ~114 (62% reduction)
```

**Efficiency Gains**:

- ❌ No need to explain npm scripts
- ❌ No need to read test config
- ✅ Direct command execution
- ✅ Structured output format

## Edge Cases

**Case 1: Timeout**

- If test > 30초: Stop and report timeout
- Likely cause: Environment issue
- Action: Check WSL resources, restart dev server

**Case 2: Zero Tests Run**

- Possible config issue
- Check: `config/testing/vitest.config.main.ts`
- Verify: `setupFiles` path correct

**Case 3: All Tests Fail**

- Critical environment issue
- Check: Node.js version (v22.21.1)
- Check: Dependencies installed (`npm ci`)

## Success Criteria

- Lint: 0 errors
- Tests: Pass rate ≥ 88.9%
- Duration: < 25초
- No manual intervention required

## Related Skills

- `performance/next-router-bottleneck.md` - If performance issues detected
- `playwright/triage.md` - If E2E tests need debugging

## Changelog

- 2025-11-08: Enhanced with auto-fix detection and ESLint config verification (Phase 1 Optimization)
  - Added 5 new trigger keywords (10 total)
  - Added auto-fix suggestion logic for common issues
  - Added ESLint strict mode configuration verification
- 2025-11-04: Initial implementation (Phase 1)
