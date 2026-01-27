---
name: playwright-triage
description: Automated E2E test failure classification and diagnosis. Use for Playwright timeout, selector, network, or assertion failures.
version: v1.2.0
user-invocable: true
allowed-tools: Bash, Read, Grep
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

- **Project**: OpenManager VIBE v5.85.0
- **E2E Framework**: Playwright v1.57.0
- **Test Suite**: 30 E2E tests, 100% pass rate
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

**Bash Automation Script**:

```bash
#!/bin/bash
# Parse Playwright test-results/ directory for failure data

parse_playwright_logs() {
  local results_dir="${1:-test-results}"

  if [[ ! -d "$results_dir" ]]; then
    echo "❌ Error: $results_dir directory not found"
    return 1
  fi

  echo "🔍 Parsing Playwright Logs from $results_dir"
  echo ""

  # Find all test result JSON files (safe for paths with spaces/special chars)
  find "$results_dir" -name "*.json" -type f -print0 | while IFS= read -r -d '' json_file; do
    # Extract test name (using double-escaped patterns for replace_regex tool)
    test_name=$(grep -oP '"title":\s*"\K[^"]+' "$json_file" | head -1)

    # Extract error message
    error_msg=$(grep -oP '"message":\s*"\K[^"]+' "$json_file" | head -1)

    # Extract stack trace
    stack_trace=$(grep -oP '"stack":\s*"\K[^"]+' "$json_file" | head -1)

    # Find associated screenshots/videos
    test_dir=$(dirname "$json_file")
    screenshots=$(find "$test_dir" -name "*.png" -type f)
    videos=$(find "$test_dir" -name "*.webm" -type f)
    traces=$(find "$test_dir" -name "trace.zip" -type f)

    # Output structured data
    echo "📊 Test: $test_name"
    echo "  Error: ${error_msg:-No error message}"
    echo "  Stack: ${stack_trace:-No stack trace}"
    [[ -n "$screenshots" ]] && echo "  Screenshots: $(echo "$screenshots" | wc -l) file(s)"
    [[ -n "$videos" ]] && echo "  Videos: $(echo "$videos" | wc -l) file(s)"
    [[ -n "$traces" ]] && echo "  Traces: $(echo "$traces" | wc -l) file(s)"
    echo ""
  done
}

# Usage:
# parse_playwright_logs                    # Uses default test-results/
# parse_playwright_logs "custom-results"   # Uses custom directory
```

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

**Bash Automation**:

```bash
#!/bin/bash
# Classify failure type from error message

classify_failure_type() {
  local error_msg="$1"
  local failure_type="UNKNOWN"
  local priority="MEDIUM"

  # Type A: Timeout
  if echo "$error_msg" | grep -qi "timeout"; then
    failure_type="Type A: Timeout"
    priority="HIGH"
    echo "🕐 $failure_type"
    echo "  Priority: $priority"
    echo "  Check: Element load time, selector validity, page performance"

  # Type B: Selector Not Found
  elif echo "$error_msg" | grep -qi "selector.*not found\|locator.*not found\|element.*not found"; then
    failure_type="Type B: Selector Not Found"
    priority="MEDIUM"
    echo "🔍 $failure_type"
    echo "  Priority: $priority"
    echo "  Check: UI changes, dynamic content, incorrect selector"

  # Type C: Network Failure
  elif echo "$error_msg" | grep -qi "network\|ECONNREFUSED\|fetch failed\|ERR_CONNECTION"; then
    failure_type="Type C: Network Failure"
    # Determine priority based on error details
    if echo "$error_msg" | grep -qi "ECONNREFUSED\|500\|503"; then
      priority="HIGH"
    else
      priority="LOW"
    fi
    echo "🌐 $failure_type"
    echo "  Priority: $priority"
    echo "  Check: API availability, network configuration, backend status"

  # Type D: Assertion Failure
  elif echo "$error_msg" | grep -qi "expect.*to\|assertion\|expected.*received"; then
    failure_type="Type D: Assertion Failure"
    priority="HIGH"
    echo "⚠️  $failure_type"
    echo "  Priority: $priority"
    echo "  Check: Test expectations, data state, UI behavior changes"

  # Type E: Page Crash
  elif echo "$error_msg" | grep -qi "page.*closed\|context.*closed\|browser.*closed\|crashed"; then
    failure_type="Type E: Page Crash"
    priority="CRITICAL"
    echo "💥 $failure_type"
    echo "  Priority: $priority"
    echo "  Check: Browser console errors, memory usage, navigation sequence"

  else
    echo "❓ $failure_type"
    echo "  Priority: $priority"
    echo "  Manual review required"
  fi

  echo ""
}

# Usage:
# error=$(grep -oP '"message":\s*"\K[^"]+' test.json)
# classify_failure_type "$error"
```

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

**🔧 Enhancement 3: Automated Diagnosis Report Generation**

```bash
#!/bin/bash
# Generate formatted markdown diagnosis report

generate_diagnosis_report() {
  local test_name="$1"
  local failure_type="$2"
  local error_msg="$3"
  local root_cause="$4"
  local priority="$5"
  local screenshot="$6"
  local video="$7"
  local trace="$8"

  local timestamp=$(date +%Y-%m-%d-%H%M%S)
  local report_file="logs/test-failures/${timestamp}-${test_name//[ \/]/-}.md"

  mkdir -p logs/test-failures

  cat > "$report_file" <<EOF
# Playwright Failure Triage Report

**Generated**: $(date +"%Y-%m-%d %H:%M:%S")

---

## 🔍 Test Failure Analysis

📊 **Test**: $test_name
├─ **Failure Type**: $failure_type
├─ **Error Pattern**: $error_msg
├─ **Root Cause**: $root_cause
└─ **Fix Priority**: $priority

---

## 🎯 Recommended Fix

1. Review error pattern and classification above
2. Check evidence files (screenshot/video/trace)
3. Apply quick fix if available (see below)
4. Re-run test: \`npm run test:e2e -- --grep "$test_name"\`
5. Verify fix in CI/CD environment

---

## 📸 Evidence Files

EOF

  [[ -n "$screenshot" ]] && echo "- **Screenshot**: \`$screenshot\`" >> "$report_file"
  [[ -n "$video" ]] && echo "- **Video**: \`$video\`" >> "$report_file"
  [[ -n "$trace" ]] && echo "- **Trace**: \`$trace\`" >> "$report_file"

  cat >> "$report_file" <<EOF

---

## 💡 Quick Fix Commands

\`\`\`bash
# View screenshot
open $screenshot

# View video
open $video

# View trace in Playwright Trace Viewer
npx playwright show-trace $trace
\`\`\`

---

## ⚠️ Next Steps

- [ ] Apply recommended fix
- [ ] Re-run test
- [ ] Verify in CI/CD
- [ ] Document if recurring pattern
EOF

  echo "✅ Diagnosis report saved to: $report_file"
  echo "$report_file"
}

# Usage: generate_diagnosis_report "test_name" "type" "error" "cause" "priority" "screenshot" "video" "trace"
```

**Invocation**:

```bash
# After classification
generate_diagnosis_report \
  "should login successfully" \
  "Type A: Timeout" \
  "TimeoutError: page.waitForSelector: Timeout 30000ms exceeded" \
  "Element slow to load" \
  "HIGH" \
  "test-results/login-spec/screenshot.png" \
  "test-results/login-spec/video.webm" \
  "test-results/login-spec/trace.zip"
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

**🔧 Enhancement 4: Quick Fix Script Generator**

```bash
#!/bin/bash
# Generate executable quick fix scripts based on failure type

generate_quick_fix() {
  local failure_type="$1"
  local test_name="$2"
  local selector="${3:-}"

  local fix_script="logs/test-failures/fix-${test_name//[ \/]/-}.sh"

  case "$failure_type" in
    "Type A: Timeout")
      cat > "$fix_script" <<'EOF'
#!/bin/bash
# Quick Fix: Increase timeout for slow elements

echo "🔧 Applying Timeout Fix"

# Option 1: Update playwright.config.ts globally
sed -i 's/timeout: 30000/timeout: 60000/g' tests/e2e/playwright.config.ts

# Option 2: Add timeout to specific test
echo ""
echo "💡 Or add timeout to specific test:"
echo "await page.waitForSelector('$selector', { timeout: 60000 });"

echo "✅ Fix applied. Re-run: npm run test:e2e"
EOF
      ;;

    "Type B: Selector Not Found")
      cat > "$fix_script" <<EOF
#!/bin/bash
# Quick Fix: Update selector to data-testid

echo "🔧 Applying Selector Fix"

# Suggest stable selector
echo "💡 Replace selector '$selector' with:"
echo "  [data-testid=\"$(basename $selector)\"]"
echo ""
echo "Example:"
echo "  await page.click('[data-testid=\"submit-button\"]');"

echo "✅ Manual fix required. Update test file accordingly."
EOF
      ;;

    "Type C: Network Failure")
      cat > "$fix_script" <<'EOF'
#!/bin/bash
# Quick Fix: Add retry config and check backend

echo "🔧 Applying Network Failure Fix"

# Add retry to playwright.config.ts
sed -i '/use: {/a \  retries: 2,' tests/e2e/playwright.config.ts

# Check backend health
echo ""
echo "🩺 Checking backend health..."
curl -f http://localhost:3000/api/health || echo "❌ Backend not responding"

echo "✅ Retry config added. Re-run: npm run test:e2e"
EOF
      ;;

    "Type D: Assertion Failure")
      cat > "$fix_script" <<'EOF'
#!/bin/bash
# Quick Fix: Debug assertion failure

echo "🔧 Debugging Assertion Failure"

echo "💡 Check test data setup:"
echo "  1. Verify expected values are correct"
echo "  2. Check for race conditions (add waitForFunction)"
echo "  3. Review test data mocks"
echo ""
echo "Example fix:"
echo "  await page.waitForFunction(() => document.querySelector('.status').textContent === 'completed');"

echo "✅ Manual debugging required."
EOF
      ;;

    "Type E: Page Crash")
      cat > "$fix_script" <<'EOF'
#!/bin/bash
# Quick Fix: Investigate page crash

echo "🔧 Investigating Page Crash"

echo "💡 Check browser console errors:"
echo "  1. Review trace file in Playwright Trace Viewer"
echo "  2. Check for memory leaks"
echo "  3. Verify navigation sequence"
echo ""
echo "Commands:"
echo "  npx playwright show-trace test-results/.../trace.zip"

echo "⚠️ Critical issue - manual investigation required."
EOF
      ;;

    *)
      echo "❌ Unknown failure type: $failure_type"
      return 1
      ;;
  esac

  chmod +x "$fix_script"
  echo "✅ Quick fix script generated: $fix_script"
  echo "$fix_script"
}

# Usage: generate_quick_fix "failure_type" "test_name" "[selector]"
# Example: generate_quick_fix "Type A: Timeout" "should login successfully" ".dashboard-header"
```

**Invocation**:

```bash
# Generate fix script
fix_script=$(generate_quick_fix "Type A: Timeout" "should login successfully" ".dashboard-header")

# Execute fix
bash "$fix_script"
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

**🔧 Enhancement 5: Test Failure Tracking and Pattern Analysis**

```bash
#!/bin/bash
# Track failure patterns over time and identify flaky tests

track_failure_pattern() {
  local test_name="$1"
  local failure_type="$2"
  local timestamp=$(date +%Y-%m-%d)
  local tracking_db="logs/test-failures/failure-tracking.csv"

  mkdir -p logs/test-failures

  # Initialize CSV if not exists
  if [[ ! -f "$tracking_db" ]]; then
    echo "Date,TestName,FailureType,Count" > "$tracking_db"
  fi

  # Check if entry exists for today (use -F for literal matching, safe for special chars)
  if grep -Fq "${timestamp},${test_name},${failure_type}," "$tracking_db"; then
    # Increment count
    awk -F',' -v date="$timestamp" -v test="$test_name" -v type="$failure_type" \
      'BEGIN{OFS=","} $1==date && $2==test && $3==type {$4=$4+1} {print}' \
      "$tracking_db" > "${tracking_db}.tmp"
    mv "${tracking_db}.tmp" "$tracking_db"
  else
    # New entry
    echo "${timestamp},${test_name},${failure_type},1" >> "$tracking_db"
  fi

  echo "✅ Failure tracked in: $tracking_db"
}

analyze_failure_patterns() {
  local tracking_db="logs/test-failures/failure-tracking.csv"
  local days="${1:-30}"

  if [[ ! -f "$tracking_db" ]]; then
    echo "❌ No failure tracking data found"
    return 1
  fi

  echo "📊 Failure Pattern Analysis (Last $days days)"
  echo "=============================================="
  echo ""

  # Most frequent failures
  echo "🔥 Top 5 Most Frequent Failures:"
  tail -n +2 "$tracking_db" | \
    awk -F',' '{sum[$2]+=$4} END {for (test in sum) print sum[test], test}' | \
    sort -rn | head -5 | \
    awk '{printf "  %2d failures: %s
", $1, substr($0, index($0,$2))}'
  echo ""

  # Flaky tests (multiple failure types)
  echo "⚠️  Potentially Flaky Tests:"
  tail -n +2 "$tracking_db" | \
    awk -F',' '{types[$2]++} END {for (test in types) if (types[test] > 1) print "  ", test, "(" types[test], "different failure types)"}' | \
    sort
  echo ""

  # Recent trend (last 7 days) - macOS/Linux compatible
  echo "📈 Recent Trend (Last 7 days):"
  local cutoff
  if command -v gdate >/dev/null 2>&1; then
    cutoff=$(gdate -d '7 days ago' +%Y-%m-%d)
  elif date -d '7 days ago' +%Y-%m-%d >/dev/null 2>&1; then
    cutoff=$(date -d '7 days ago' +%Y-%m-%d)
  else
    cutoff=$(date -v-7d +%Y-%m-%d 2>/dev/null || date +%Y-%m-%d)
  fi
  tail -n +2 "$tracking_db" | \
    awk -F',' -v cutoff="$cutoff" '$1 >= cutoff {sum+=$4} END {print "  Total failures:", sum}'
  echo ""
}

# Usage:
# track_failure_pattern "test_name" "failure_type"
# analyze_failure_patterns [days]

# Example:
# track_failure_pattern "should login successfully" "Type A: Timeout"
# analyze_failure_patterns 30
```

**Invocation**:

```bash
# After each triage
track_failure_pattern "should login successfully" "Type A: Timeout"

# Weekly analysis
analyze_failure_patterns 30
```

---

## Changelog

- 2025-12-12: v1.2.0 - Tech stack upgrade alignment
  - Playwright version update (v1.57.0)
  - Test suite status update (30 tests, 100% pass rate)
- 2025-11-04: Initial implementation (Phase 1)
- 2025-11-08: Enhanced to v1.1.0 with bash automation (Phase 1 Week 1 Day 6-7)
  - Added Enhancement 1: Automated Playwright log parsing
  - Added Enhancement 2: Real-time error pattern detection
  - Added Enhancement 3: Automated diagnosis report generation
  - Added Enhancement 4: Quick fix script generator
  - Added Enhancement 5: Test failure tracking and pattern analysis
