---
name: next-router-bottleneck
description: Next.js Router performance analysis. Use for identifying FCP/LCP/CLS bottlenecks and Server Actions blocking.
version: v1.1.0
user-invocable: true
allowed-tools: Bash, Read, Grep
---

# Next.js Router Performance Diagnosis

**Target Token Efficiency**: 75% (400 tokens → 100 tokens)

## Purpose

Automated Next.js routing performance analysis and bottleneck identification without manual investigation.

## Trigger Keywords

- "performance issues"
- "slow routing"
- "next router bottleneck"
- "페이지 느림"
- "라우팅 성능"
- "performance check"
- "bottleneck analysis"
- "성능 분석"
- "web vitals"
- "optimize routing"
- "페이지 최적화"
- "느린 로딩"
- "performance diagnosis"

## Context

- **Framework**: Next.js 16 (App Router)
- **Target FCP**: < 1.8s (Google 권장)
- **Current FCP**: 608ms (우수)
- **Target Response**: < 1s
- **Current Response**: 532ms (우수)

## Workflow

### 1. Check Current Metrics

**Automated Metrics Collection**:

```bash
# Run performance test
npm run dev:stable &
DEV_PID=$!
sleep 30  # Wait for startup

# Collect metrics (if available)
curl -s http://localhost:3000 -w "
Response Time: %{time_total}s
"

# Kill dev server
kill $DEV_PID
```

**Performance Indicators**:

```typescript
// Parse from logs/performance/ or real-time collection
- FCP (First Contentful Paint): 608ms ✅
- LCP (Largest Contentful Paint): [to be measured]
- TTFB (Time to First Byte): [to be measured]
- Response Time: 532ms ✅
- Bundle Size: 최적화 완료 (87MB 절약)
```

**Metrics Parsing Logic**:

```bash
# Check if performance logs exist
if [ -f "logs/performance/latest.log" ]; then
  grep -E "(FCP|LCP|TTFB)" logs/performance/latest.log
else
  echo "⚠️  No performance logs found. Metrics will be estimated."
fi
```

### 2. Identify Common Bottlenecks

**Checklist**:

- [ ] Dynamic imports 미사용 (컴포넌트 지연 로드)
- [ ] Server Actions blocking (await 체인)
- [ ] Middleware overhead (auth 체크)
- [ ] Large bundle size (vendor chunks)
- [ ] Unnecessary re-renders (useEffect 의존성)

### 3. Run Diagnostic Commands

**Automated Bundle Analysis**:

```bash
# Run production build and capture output
BUILD_OUTPUT=$(npm run build 2>&1)

# Parse bundle sizes from build output
echo "$BUILD_OUTPUT" | grep -E "(Route|First Load JS)" | tee logs/performance/bundle-analysis.log

# Extract key metrics
MAIN_BUNDLE=$(echo "$BUILD_OUTPUT" | grep -E "/_app" | awk '{print $4}')
TOTAL_SIZE=$(echo "$BUILD_OUTPUT" | grep -E "First Load JS shared by all" | awk '{print $6}')

# Threshold checks
echo "📦 Bundle Analysis:"
echo "  Main Bundle: $MAIN_BUNDLE"
echo "  Total First Load: $TOTAL_SIZE"

# Warning thresholds
if [[ $(echo "$MAIN_BUNDLE" | sed 's/kB//') > 500 ]]; then
  echo "⚠️  WARNING: Main bundle exceeds 500KB threshold"
fi
```

**Bundle Size Targets**:

```typescript
// Production build targets
- Main Bundle: < 500KB ✅
- First Load JS: < 200KB ✅
- Route Chunks: < 100KB each
- Total Bundle: ~87MB saved (dev/prod 분리 완료)
```

**Runtime Analysis**:

```bash
# Check dev server performance
time npm run dev:stable &
DEV_PID=$!
sleep 5

# Measure startup time
STARTUP_TIME=$(ps -p $DEV_PID -o etime= | tr -d ' ')
echo "⏱️  Dev Server Startup: $STARTUP_TIME"

# Expected: < 22초 (current: 22초, 35% improved)
kill $DEV_PID
```

### 4. Analyze Web Vitals

**Check Core Web Vitals**:

- **FCP**: < 1.8s (현재 608ms ✅)
- **LCP**: < 2.5s (target)
- **CLS**: < 0.1 (layout shift)
- **INP**: < 200ms (interaction)

### 5. Bottleneck Classification

**Automated Performance Regression Detection**:

```bash
# Load baseline metrics (from docs/status.md)
BASELINE_FCP=608
BASELINE_RESPONSE=532
BASELINE_STARTUP=22

# Parse current metrics from latest performance log
CURRENT_FCP=$(awk '/FCP:/ {gsub(/ms/, "", $2); print $2}' logs/performance/latest.log 2>/dev/null || echo "0")
CURRENT_RESPONSE=$(awk '/Response:/ {gsub(/ms/, "", $2); print $2}' logs/performance/latest.log 2>/dev/null || echo "0")
CURRENT_STARTUP=$(awk '/Startup:/ {gsub(/s/, "", $2); print $2}' logs/performance/latest.log 2>/dev/null || echo "0")

# Calculate percentage differences
FCP_DIFF=$(echo "scale=1; ($CURRENT_FCP - $BASELINE_FCP) / $BASELINE_FCP * 100" | bc 2>/dev/null || echo "0")
RESPONSE_DIFF=$(echo "scale=1; ($CURRENT_RESPONSE - $BASELINE_RESPONSE) / $BASELINE_RESPONSE * 100" | bc 2>/dev/null || echo "0")
STARTUP_DIFF=$(echo "scale=1; ($CURRENT_STARTUP - $BASELINE_STARTUP) / $BASELINE_STARTUP * 100" | bc 2>/dev/null || echo "0")

# Trigger warnings for >10% regression
echo "📊 Performance Regression Check:"
if (( $(echo "$FCP_DIFF > 10" | bc -l 2>/dev/null || echo 0) )); then
  echo "⚠️  WARNING: FCP regression ${FCP_DIFF}% (${BASELINE_FCP}ms → ${CURRENT_FCP}ms)"
fi
if (( $(echo "$RESPONSE_DIFF > 10" | bc -l 2>/dev/null || echo 0) )); then
  echo "⚠️  WARNING: Response time regression ${RESPONSE_DIFF}% (${BASELINE_RESPONSE}ms → ${CURRENT_RESPONSE}ms)"
fi
if (( $(echo "$STARTUP_DIFF > 10" | bc -l 2>/dev/null || echo 0) )); then
  echo "⚠️  WARNING: Startup time regression ${STARTUP_DIFF}% (${BASELINE_STARTUP}s → ${CURRENT_STARTUP}s)"
fi
```

**Bundle Size Thresholds**:

```typescript
// Check against production targets
const THRESHOLDS = {
  mainBundle: 500, // KB - trigger investigation if exceeded
  firstLoad: 200, // KB - Next.js recommendation
  routeChunk: 100, // KB - per route target
};

// Current status (docs/status.md)
// Main Bundle: ✅ < 500KB
// First Load: ✅ < 200KB
// Total saved: 87MB (dev/prod split)
```

**Categories**:

**Category A: Bundle Bloat** (⚠️ Threshold: Main bundle > 500KB)

- Symptoms: Large bundle size, slow initial load, high First Load JS
- Common causes:
  - Unnecessary dependencies in production
  - Missing tree-shaking
  - Large libraries not code-split
  - Inline data/assets
- Quick fix: Check `npm run build` output for large chunks
- Impact: FCP +30-50%, Initial load +2-5s

**Category B: Server Component Issues** (⚠️ Threshold: Response time > 532ms baseline)

- Symptoms: Slow SSR, high TTFB, delayed hydration
- Common causes:
  - Server Components fetching in waterfall
  - Missing Suspense boundaries
  - Blocking database queries
  - No streaming/partial prerendering
- Quick fix: Add `loading.tsx` and Suspense
- Impact: TTFB +50-100%, Response +200-500ms

**Category C: Client State Overhead** (⚠️ Threshold: Startup time > 22s baseline)

- Symptoms: Slow client-side navigation, high hydration time
- Common causes:
  - Too many Client Components (`"use client"`)
  - Large client-side state
  - Unnecessary re-renders
  - Missing React.memo/useMemo
- Quick fix: Convert to Server Components where possible
- Impact: Hydration +20-40%, Dev server +35% slower

**Category D: Data Fetching** (⚠️ Threshold: FCP > 608ms baseline)

- Symptoms: Slow route transitions, loading spinners
- Common causes:
  - Waterfall requests
  - No request deduplication
  - Missing caching headers
  - No prefetching
- Quick fix: Use Next.js `fetch()` with cache
- Impact: Route transitions +100-300ms

### 6. Report Format

```
🚀 Next.js Performance Analysis

📊 Current Metrics:
├─ FCP: 608ms (✅ < 1.8s)
├─ Response: 532ms (✅ < 1s)
├─ Bundle: Optimized (87MB saved)
└─ Dev Startup: 22s (✅ target)

🔍 Bottlenecks Detected:
1. [Category] - Description
   └─ Location: src/path/to/file.ts:line
   └─ Impact: High/Medium/Low
   └─ Fix: Specific action

🎯 Recommendations:
├─ Priority 1: [Fix description]
├─ Priority 2: [Fix description]
└─ Priority 3: [Fix description]

✅ Already Optimized:
├─ Bundle size (dev/prod 분리)
├─ FCP (608ms)
└─ Response time (532ms)
```

## Token Optimization Strategy

**Before (Manual)**:

```
User: "Next.js 라우팅이 느려요"
Assistant: [reads performance logs, checks bundle, analyzes code, explains metrics, suggests fixes]
Tokens: ~400
```

**After (Skill)**:

```
User: "slow routing"
Skill: [runs diagnostics, reports bottlenecks, provides fixes]
Tokens: ~100 (75% reduction)
```

**Efficiency Gains**:

- ❌ No need to explain Web Vitals
- ❌ No need to read performance docs
- ✅ Direct metric collection
- ✅ Categorized bottleneck analysis

## Common Fixes

### Fix 1: Dynamic Import

```typescript
// Before
import HeavyComponent from './HeavyComponent';

// After
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Spinner />,
});
```

### Fix 2: Parallel Server Actions

```typescript
// Before
const data1 = await fetchData1();
const data2 = await fetchData2();

// After
const [data1, data2] = await Promise.all([fetchData1(), fetchData2()]);
```

### Fix 3: Memoize Components

```typescript
// Before
export default function Dashboard() { ... }

// After
export default React.memo(Dashboard);
```

## Success Criteria

- FCP: < 1.8s maintained
- Response: < 1s maintained
- Bottlenecks identified: < 3분
- Specific fixes provided
- No manual code reading required

## Related Skills

- `tests/lint-smoke.md` - If performance tests fail
- `documentation/ai-report-export.md` - To document findings

## Edge Cases

**Case 1: No Bottlenecks Detected**

- Report: "All metrics within target"
- Action: No performance issues

**Case 2: Build Fails**

- Check: TypeScript errors
- Fallback: Use dev server metrics

**Case 3: Metrics Unavailable**

- Run: `npm run dev` to collect data
- Wait: 30s for initial load

## Changelog

- 2025-12-12: v1.1.0 - Tech stack upgrade alignment
  - Next.js 15 → 16 framework version update
- 2025-11-04: v1.0.0 - Initial implementation (Phase 1)
