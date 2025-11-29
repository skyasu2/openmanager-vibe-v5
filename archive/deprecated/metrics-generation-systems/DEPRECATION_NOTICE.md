# Metrics Generation Systems - Deprecation Notice

**Date**: 2025-11-29
**Deprecated by**: Claude Code (code cleanup initiative)
**Reason**: Replaced by superior Gemini implementation with scenario-based metrics

---

## Summary

This directory contains **3 deprecated metrics generation scripts** that have been replaced by a single, more sophisticated system.

### Deprecated Scripts

1. **`legacy-simple-cycle/generate-static-metrics.js`** (CommonJS)
2. **`legacy-simple-cycle/generate-static-metrics-standalone.ts`** (ESM)
3. **`legacy-hourly-system/generate-hourly-metrics.js`** (Hourly system)

### Current Active Script

**`scripts/generate-static-metrics.ts`** (Gemini implementation)
- Location: `/scripts/generate-static-metrics.ts`
- Generated output: `/public/data/server-metrics-24h.json`
- Data source: `/src/mock/data/` (scenarios + utils)

---

## Why Deprecated?

### 1. Legacy Simple Cycle System (`.js` + `-standalone.ts`)

**Limitations**:
- **Basic sine wave pattern** - No realistic server behavior
- **Only peak hour detection** (9AM-6PM vs off-peak)
- **No failure scenarios** - Can't simulate real incidents
- **Duplicate code** - `.js` and `-standalone.ts` are nearly identical

**Example of old logic**:
```javascript
// ❌ Old: Simple sine wave
const isPeakHour = hour >= 9 && hour <= 18;
const loadFactor = isPeakHour ? 1.5 : 0.8;
const timeFactor = Math.sin(((hour + min / 60) / 24) * Math.PI * 2 - Math.PI / 2) * 0.2 + 1;
```

**vs New logic**:
```typescript
// ✅ New: Scenario-based curves
const scenario = SCENARIO_TIMELINES.find(s => hour >= s.timeRange[0] && hour < s.timeRange[1]);
const curve = generateCurve(startValue, endValue, points, 'exponential'); // or 'linear', 'spike'
```

### 2. Legacy Hourly System (`generate-hourly-metrics.js`)

**Limitations**:
- **Incompatible folder structure** - Uses `public/server-scenarios/hourly-metrics/`
- **24 separate JSON files** (00.json ~ 23.json) - Inefficient loading
- **Only 8 servers** - Current system supports 15 servers
- **Separate metadata file** - Requires `servers-metadata.json`
- **Not integrated with client hooks** - Can't use `useFixed24hMetrics`

**Folder structure**:
```
❌ Old: public/server-scenarios/
    ├── servers-metadata.json
    └── hourly-metrics/
        ├── 00.json
        ├── 01.json
        ...
        └── 23.json
```

**vs New structure**:
```
✅ New: public/data/
    └── server-metrics-24h.json (single file, 15 servers × 288 points)
```

---

## Current System Advantages (Gemini Implementation)

### 1. Scenario-Based Metrics

**4 Complex Scenarios**:
1. **DB Overload** (0-6시): Database cascade failure
2. **Storage Full** (6-12시): Disk space issues
3. **Cache Failure** (12-18시): Cache server failure
4. **Network Bottleneck** (18-24시): Network congestion

### 2. Realistic Curve Generation

**3 Curve Types**:
- **Linear**: Gradual changes
- **Exponential**: Slow start, rapid escalation
- **Spike**: Sudden jumps, sustained high load

### 3. AI Analysis Integrity

**Data Isolation**:
- Scenario information **completely removed** from AI-visible data
- AI analyzes pure metrics (CPU, Memory, Disk, Network)
- Simulates real-world monitoring without prior knowledge

### 4. Client Integration

**Seamless Hook Integration**:
```typescript
// ✅ Current system works perfectly with useFixed24hMetrics
const { currentMetrics, historyData } = useFixed24hMetrics(serverId);
```

---

## Migration Path

**No migration needed** - The legacy systems were never used in production.

**If you need to reference old code**:
- Check `legacy-simple-cycle/` for simple sine wave patterns
- Check `legacy-hourly-system/` for 24-file hourly structure

---

## File Comparison

| Aspect | Legacy (`.js` / `-standalone.ts`) | Legacy (Hourly System) | **Current (Gemini)** |
|--------|----------------------------------|------------------------|---------------------|
| **Scenarios** | ❌ None (simple cycle) | ✅ 24-hour storytelling | ✅ 4 complex scenarios |
| **Curve Types** | ❌ Sine wave only | ❌ Hard-coded patterns | ✅ 3 types (linear/exponential/spike) |
| **Server Count** | 15 servers | 8 servers | **15 servers** |
| **Output** | Single JSON | 24 JSON files | **Single JSON (808KB)** |
| **File Size** | ~500KB | ~800KB (total) | **808KB** |
| **Data Points** | 288 × 15 = 4,320 | 288 × 8 = 2,304 | **288 × 15 = 4,320** |
| **Integration** | ❌ No client hooks | ❌ No client hooks | **✅ useFixed24hMetrics** |
| **AI Analysis** | ❌ N/A | ❌ N/A | **✅ Scenario isolation** |
| **Module Type** | CommonJS / ESM | CommonJS | **ESM (TypeScript)** |
| **Maintenance** | ❌ Deprecated | ❌ Deprecated | **✅ Active** |

---

## Code Quality Assessment

### Legacy Simple Cycle System

**Rating**: ⭐⭐ (2/5)
- ✅ Basic functionality works
- ❌ Too simplistic for realistic monitoring
- ❌ Duplicate code (`.js` vs `-standalone.ts`)
- ❌ No scenario support

### Legacy Hourly System

**Rating**: ⭐⭐⭐ (3/5)
- ✅ Detailed 24-hour storytelling
- ✅ Rich scenario descriptions
- ❌ Incompatible folder structure
- ❌ Only 8 servers supported
- ❌ 24 separate files (inefficient)

### Current System (Gemini)

**Rating**: ⭐⭐⭐⭐⭐ (5/5)
- ✅ Scenario-based realistic metrics
- ✅ 3 curve types for flexibility
- ✅ AI analysis integrity (scenario isolation)
- ✅ Seamless client integration
- ✅ Single-file efficiency (808KB)
- ✅ TypeScript + ESM modern stack

---

## Restoration Instructions

**If you need to restore legacy systems** (not recommended):

### 1. Legacy Simple Cycle System

```bash
# Restore CommonJS version
cp archive/deprecated/metrics-generation-systems/legacy-simple-cycle/generate-static-metrics.js scripts/

# Run
node scripts/generate-static-metrics.js
```

### 2. Legacy Hourly System

```bash
# Restore hourly system
cp archive/deprecated/metrics-generation-systems/legacy-hourly-system/generate-hourly-metrics.js scripts/

# Requires servers-metadata.json (not archived)
# Run
node scripts/generate-hourly-metrics.js
```

**Warning**: These systems are not compatible with the current client hooks and will require significant refactoring.

---

## Contact

For questions about this deprecation:
- Check current implementation: `scripts/generate-static-metrics.ts`
- Check data structure: `src/mock/data/`
- Check client integration: `src/hooks/useFixed24hMetrics.ts`

**Recommended action**: Do not restore. Use current Gemini implementation.
