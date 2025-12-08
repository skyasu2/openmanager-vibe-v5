# Package Cleanup Report

## 🚨 Redundant Libraries (High Priority)

These libraries duplicate functionality provided by other, more widely used libraries in your project. Removing them will reduce bundle size and maintain consistency.

### 1. Charting: `chart.js` & `react-chartjs-2`

- **Status**: Used in **only 1 file** (`src/modules/performance-monitor/components/PerformanceMonitor.tsx`).
- **Alternative**: `recharts` is used in 4 other components (`PerformanceChart`, `TrendsChart`, etc.).
- **Recommendation**: Refactor `PerformanceMonitor.tsx` to use `recharts` and remove `chart.js` + `react-chartjs-2`.

### 2. Data Fetching: `swr`

- **Status**: Used in **only 1 file** (`src/components/shared/AnomalyFeed.tsx`).
- **Alternative**: `@tanstack/react-query` is the primary data fetching library used throughout the app.
- **Recommendation**: Refactor `AnomalyFeed.tsx` to use `useQuery` and remove `swr`.

## 🗑️ Unused Dev Dependencies

These packages appear to be unused in both `src/` and `scripts/`.

- **`pidtree`**: No usage found.
- **`ts-morph`**: No usage found.
- **`@types/socket.io`**: Likely redundant. `socket.io-client` includes its own types. Unless you have server-side socket code in this repo (which seems to be a Next.js app), this is unnecessary.

## 📉 Potential Savings

Removing these packages will:

- Reduce `node_modules` size.
- Reduce client bundle size (especially `chart.js`).
- Simplify maintenance (one way to do charts, one way to fetch data).
