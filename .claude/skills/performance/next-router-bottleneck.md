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

## Context

- **Framework**: Next.js 15 (App Router)
- **Target FCP**: < 1.8s (Google 권장)
- **Current FCP**: 608ms (우수)
- **Target Response**: < 1s
- **Current Response**: 532ms (우수)

## Workflow

### 1. Check Current Metrics

**Performance Indicators**:

```typescript
// Expected from logs/performance/
- FCP (First Contentful Paint): 608ms ✅
- Response Time: 532ms ✅
- Bundle Size: 최적화 완료 (87MB 절약)
```

### 2. Identify Common Bottlenecks

**Checklist**:

- [ ] Dynamic imports 미사용 (컴포넌트 지연 로드)
- [ ] Server Actions blocking (await 체인)
- [ ] Middleware overhead (auth 체크)
- [ ] Large bundle size (vendor chunks)
- [ ] Unnecessary re-renders (useEffect 의존성)

### 3. Run Diagnostic Commands

**Bundle Analysis**:

```bash
# Check bundle size
npm run build
# Expected: < 500KB for main bundle
```

**Runtime Analysis**:

```bash
# Check dev server performance
npm run dev:stable
# Expected: < 22초 startup
```

### 4. Analyze Web Vitals

**Check Core Web Vitals**:

- **FCP**: < 1.8s (현재 608ms ✅)
- **LCP**: < 2.5s (target)
- **CLS**: < 0.1 (layout shift)
- **INP**: < 200ms (interaction)

### 5. Bottleneck Classification

**Category A: Bundle Size Issues** (87% resolved)

```
Problem: Large vendor chunks
Solution: ✅ Already optimized (dev/prod 분리)
Status: No action needed
```

**Category B: Server Actions Blocking**

```
Problem: Sequential await chains
Solution: Parallel Promise.all()
Example: src/app/api/dashboard/route.ts
```

**Category C: Unnecessary Re-renders**

```
Problem: Missing React.memo or useMemo
Solution: Memoize expensive components
Target: src/components/dashboard/
```

**Category D: Middleware Overhead**

```
Problem: Auth check on every request
Solution: Edge middleware optimization
File: middleware.ts
```

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

- 2025-11-04: Initial implementation (Phase 1)
