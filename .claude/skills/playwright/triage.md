---
name: triaging-playwright-failures
description: Automated E2E test failure classification and diagnosis workflow for Playwright tests. Triggers when user reports Playwright failures, E2E test errors, or requests test triage. Use for timeout, selector, network, assertion, or page crash analysis.
---

# Playwright E2E Failure Triage

**Target Token Efficiency**: 77% (350 tokens → 80 tokens)

## Purpose

Automated E2E test failure classification and diagnosis without manual log reading or debugging iteration.

## Trigger Keywords

- "playwright failed"
- "triage E2E"
- "E2E test error"
- "E2E 실패"
- "playwright 오류"

## Context

- **Project**: OpenManager VIBE v5.80.0
- **E2E Framework**: Playwright
- **Test Suite**: 29 E2E tests, 99% pass rate
- **Common Failures**: Timeout, selector not found, network issues
- **Config**: tests/e2e/playwright.config.ts

## Workflow

### 1. Parse Playwright Log

**Log Location**:

```
test-results/
playwright-report/
stdout/stderr from test run
```

**Extract Key Data**:

- Failed test name
- Error type (timeout, selector, network, assertion)
- Stack trace location
- Screenshot/video references
- Retry count

### 2. Classify Failure Type

**Type A: Timeout (most common)**

```
Error Pattern: "TimeoutError: page.waitForSelector: Timeout 30000ms exceeded"
Root Cause: Element slow to load OR selector incorrect
Fix Priority: HIGH
```

**Classification Logic**:

- If timeout + selector in error → Check selector validity first
- If timeout + no selector → Check page load performance
- If timeout + API call → Check network/backend response

**Type B: Selector Not Found**

```
Error Pattern: "Error: No element found for selector: .submit-button"
Root Cause: DOM change OR incorrect selector
Fix Priority: MEDIUM
```

**Classification Logic**:

- Compare selector with current DOM structure
- Check for dynamic content loading
- Verify element exists in screenshots

**Type C: Network Failure**

```
Error Pattern: "net::ERR_CONNECTION_REFUSED" OR "500 Internal Server Error"
Root Cause: Backend issue OR test environment
Fix Priority: LOW (if backend issue) / HIGH (if test config)
```

**Classification Logic**:

- Check backend health endpoint
- Verify test environment configuration
- Check API mock setup

**Type D: Assertion Failure**

```
Error Pattern: "expect(received).toBe(expected)"
Root Cause: Logic error OR data inconsistency
Fix Priority: HIGH
```

**Classification Logic**:

- Check expected vs actual values
- Verify test data setup
- Check for race conditions

**Type E: Page Crash**

```
Error Pattern: "Target page, context or browser has been closed"
Root Cause: Browser crash OR navigation issue
Fix Priority: CRITICAL
```

**Classification Logic**:

- Check browser console errors
- Verify navigation sequence
- Check for memory leaks

### 3. Generate Diagnosis Report

**Report Format**:

```
🔍 Playwright Failure Triage

📊 Test: [test name]
├─ Failure Type: [Type A-E]
├─ Error Pattern: [error message]
├─ Root Cause: [diagnosis]
└─ Fix Priority: [CRITICAL/HIGH/MEDIUM/LOW]

🎯 Recommended Fix:
1. [Specific action step 1]
2. [Specific action step 2]
3. [Specific action step 3]

📸 Evidence:
├─ Screenshot: test-results/.../screenshot.png
├─ Video: test-results/.../video.webm
└─ Trace: test-results/.../trace.zip

💡 Quick Fix (if available):
[Code snippet or command to fix]
```

### 4. Provide Quick Fix (when applicable)

**Timeout Fix Example**:

```typescript
// playwright.config.ts
timeout: 30000 → 60000  // Increase timeout

// OR in test
await page.waitForSelector('.element', { timeout: 60000 });
```

**Selector Fix Example**:

```typescript
// Before (broken)
await page.click('.submit-button');

// After (fixed)
await page.click('[data-testid="submit-button"]'); // More stable
```

**Network Fix Example**:

```typescript
// playwright.config.ts
use: {
  baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',
  // Add retry for network failures
  retries: 2,
}
```

### 5. Summary and Next Steps

**Format**:

```
✅ Triage Complete

📋 Summary:
├─ Failure Type: [Type]
├─ Root Cause: [Cause]
├─ Fix Priority: [Priority]
└─ Estimated Fix Time: [X min]

🔧 Next Steps:
1. Apply quick fix (if available)
2. Re-run test: npm run test:e2e
3. Verify fix in CI/CD
4. Document in changelog (if pattern)

⚠️ Pattern Detection:
[If this failure type seen before, note frequency]
```

## Token Optimization Strategy

**Before (Manual)**:

```
User: "Playwright 테스트 실패했는데 원인 찾아줘"
Assistant: [reads test-results/, analyzes logs, explains error types, suggests debugging steps]
Tokens: ~350
```

**After (Skill)**:

```
User: "triage E2E"
Skill: [parses logs, classifies failure, provides fix]
Tokens: ~80 (77% reduction)
```

**Efficiency Gains**:

- ❌ No need to explain Playwright error types
- ❌ No need to manually read test-results/
- ✅ Auto-classify failure type
- ✅ Direct fix recommendations
- ✅ Evidence links included

## Common Failure Patterns

### Pattern 1: Login Flow Timeout

```
Test: "should login successfully"
Error: TimeoutError on .dashboard-header
Root Cause: Auth redirect delay
Fix: Increase timeout OR wait for network idle
```

### Pattern 2: Dynamic Content Selector

```
Test: "should display server list"
Error: Selector .server-card not found
Root Cause: Data loading delay
Fix: waitForSelector with state: 'attached'
```

### Pattern 3: API Mock Missing

```
Test: "should fetch metrics"
Error: 500 Internal Server Error
Root Cause: Mock handler not configured
Fix: Add MSW handler for /api/metrics
```

### Pattern 4: Race Condition

```
Test: "should update status"
Error: expect("pending").toBe("completed")
Root Cause: Async state update not awaited
Fix: Add waitForFunction for state change
```

## Edge Cases

**Case 1: Flaky Test**

- Symptom: Passes sometimes, fails randomly
- Diagnosis: Race condition OR network timing
- Action: Add explicit waits, increase timeout, check for animations
- Flag: Mark as "flaky" for investigation

**Case 2: Multiple Failures**

- Symptom: Same test fails with different errors
- Diagnosis: Cascading failures OR unstable test
- Action: Isolate root cause (first failure), fix sequentially
- Flag: Check test dependencies

**Case 3: CI-Only Failure**

- Symptom: Passes locally, fails in CI
- Diagnosis: Environment difference OR headless issue
- Action: Check CI environment variables, run headless locally
- Flag: Document CI-specific config

**Case 4: New Test Failure**

- Symptom: Test worked yesterday, fails today
- Diagnosis: Code change broke test OR flaky revealed
- Action: Check recent commits, compare DOM structure
- Flag: Regression test needed

## Success Criteria

- Failure classified: < 1 min
- Root cause identified: 90%+
- Quick fix provided: 70%+
- No manual log reading required

## Related Skills

- `tests/lint-smoke.md` - For unit test failures
- `performance/next-router-bottleneck.md` - If timeout related to performance

## Integration with Test Suite

**Auto-Triage After Test Run**:

```bash
# After npm run test:e2e fails
1. Skill parses test-results/
2. Generates triage report
3. Exports to logs/test-failures/
4. Suggests next action
```

**Expected Output**:

```
🔍 Auto-Triage Results

📊 Failed Tests: 2/29
├─ login.spec.ts: Timeout (HIGH priority)
└─ dashboard.spec.ts: Selector (MEDIUM priority)

🎯 Recommended Actions:
1. Fix login timeout: Increase wait time (2 min)
2. Fix dashboard selector: Update to data-testid (5 min)

📁 Reports:
├─ logs/test-failures/2025-11-04-login-timeout.md
└─ logs/test-failures/2025-11-04-dashboard-selector.md
```

## Changelog

- 2025-11-04: Initial implementation (Phase 1)
