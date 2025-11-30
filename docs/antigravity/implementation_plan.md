# Package Cleanup & Refactoring Plan

## Goal Description

Remove redundant libraries (`chart.js`, `swr`) by refactoring the few components using them to use the project's primary libraries (`recharts`, `@tanstack/react-query`). Additionally, remove unused dev dependencies and migrate legacy ESLint usage to Biome to allow for ESLint removal.

## User Review Required

> [!WARNING] > **ESLint Removal**: This plan involves removing ESLint entirely. `scripts/incremental-check.js` will be updated to use `biome lint`. Any custom ESLint rules not covered by Biome will be lost, but Biome is already the primary linter in `package.json`.

## Proposed Changes

### 1. Component Refactoring

#### [MODIFY] [PerformanceMonitor.tsx](file:///d:/cursor/openmanager-vibe-v5/src/modules/performance-monitor/components/PerformanceMonitor.tsx)

- Replace `react-chartjs-2` with `recharts`.
- Adapt the chart data structure to match Recharts API.

#### [MODIFY] [AnomalyFeed.tsx](file:///d:/cursor/openmanager-vibe-v5/src/components/shared/AnomalyFeed.tsx)

- Replace `swr` with `@tanstack/react-query` (`useQuery`).

### 2. Script Migration

#### [MODIFY] [incremental-check.js](file:///d:/cursor/openmanager-vibe-v5/scripts/incremental-check.js)

- Replace `npx eslint` command with `npx biome lint`.

### 3. Package Removal

#### [MODIFY] [package.json](file:///d:/cursor/openmanager-vibe-v5/package.json)

- Remove dependencies:
  - `chart.js`
  - `react-chartjs-2`
  - `swr`
- Remove devDependencies:
  - `pidtree`
  - `ts-morph`
  - `@types/socket.io`
  - `eslint` and all `eslint-plugin-*`
  - `@next/eslint-plugin-next`
  - `typescript-eslint`
  - `globals`

#### [DELETE] [eslint.config.mjs](file:///d:/cursor/openmanager-vibe-v5/eslint.config.mjs)

#### [DELETE] [.eslintignore](file:///d:/cursor/openmanager-vibe-v5/.eslintignore)

#### [DELETE] [tsconfig.eslint.json](file:///d:/cursor/openmanager-vibe-v5/tsconfig.eslint.json)

## Verification Plan

### Automated Tests

- Run `npm run build` to ensure no build errors after refactoring.
- Run `npm run lint` (Biome) to ensure linting passes.
- Run `npm run check:incremental` to verify the updated script works.
