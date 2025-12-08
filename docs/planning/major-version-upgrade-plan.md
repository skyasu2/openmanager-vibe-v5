# 🚀 Major Version Upgrade Plan (Next.js 16, React 19)

> **Updated**: 2025-12-08
> **Target Version**: v6.0.0
> **Status**: In Progress

---

## 📅 Overview

This document outlines the roadmap for upgrading the core stack to the latest major versions available in the market. The goal is to leverage performance improvements (Tailwind v4 engine, Next.js 16) and ensure long-term maintainability.

---

## 📊 Status Matrix

| Dependency | Current | Target | Risk | Status | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Tailwind CSS** | v4.1.17 | v4.1.17 | 🟢 Low | ✅ **Done** | CSS-first config 마이그레이션 완료 (v5.80.0) |
| **@ai-sdk/react** | v2.0.109 | v2.0.109 | 🟢 Low | ✅ **Done** | v2.x API 마이그레이션 완료 (v5.80.0) |
| **Vitest** | v4.0.15 | v4.0.15 | 🟢 Low | ✅ **Done** | coverage.all 옵션 제거 (v5.80.0) |
| **@supabase/ssr** | v0.8.0 | v0.8.0 | 🟢 Low | ✅ **Done** | Phase 1 완료 (v5.80.0) |
| **Zod** | v4.1.13 | v4.1.13 | 🟢 Low | ✅ **Done** | Migration completed in Phase 3. |
| **Zustand** | v5.0.9 | v5.0.9 | 🟢 Low | ✅ **Done** | Migration completed in Phase 4. |
| **TypeScript** | v5.7.2 | v5.9.3 | 🟢 Low | ⏳ **Planned** | Align with Next.js 16 upgrade. |
| **React** | v18.3.1 | v19.2.1 | 🔴 High | ⏳ **Planned** | Requires extensive compatibility testing (Compiler). |
| **Next.js** | v15.5.7 | v16.0.7 | 🔴 High | ⏳ **Planned** | Dependent on React 19 stability. |

---

## 🛠️ Execution Plan

### 1. Tailwind CSS v4 Upgrade ✅ COMPLETED (v5.80.0)
**Goal:** Switch to the new Rust-based engine for 10x faster builds.
- [x] Install `tailwindcss@4.1.17`
- [x] Migrate `tailwind.config.ts` to CSS-first config (`globals.css`)
- [x] Add `@tailwindcss/postcss` plugin
- [x] Remove `autoprefixer` (Tailwind v4 내장)
- [x] Verify styling consistency (134/134 tests passed)

### 1.5 Additional Package Upgrades ✅ COMPLETED (v5.80.0)
**Included in Phase 1-4 batch upgrade:**
- [x] `@supabase/ssr`: 0.5.2 → 0.8.0 (Low Risk)
- [x] `jsdom`: 26.0.0 → 27.2.0 (Low Risk)
- [x] `vaul`: 0.9.1 → 1.1.2 (Medium Risk)
- [x] `cross-env`: 7.0.3 → 10.1.0 (Medium Risk)
- [x] `@ai-sdk/react`: 1.0.18 → 2.0.109 (High Risk - API 변경 대응 완료)
- [x] `vitest`: 3.2.4 → 4.0.15 (High Risk - coverage.all 옵션 제거)

### 2. React 19 Compatibility Check (Experimental Branch)
**Goal:** Identify breaking changes before main branch merge.
- [ ] Create `chore/react-19-experiment` branch
- [ ] Upgrade React / ReactDOM
- [ ] Run `npm run test:e2e`
- [ ] Check `shadcn/ui` components compatibility

### 3. Next.js 16 Upgrade (Follow-up)
**Goal:** Adopt latest Next.js features.
- [ ] Update `next`, `eslint-config-next`
- [ ] Review `next.config.ts` deprecations
- [ ] Test Vercel Edge Function limits (Next 16 might change runtime behavior)

---

## 📝 Archive Policy (Standardization)

Completed work plans must be moved to the archive to keep `docs/planning/` clean.

**Rule:**
1.  **Active Plans**: Keep in `docs/planning/`.
2.  **Completed Plans**: Move to `docs/archive/completed/`.
3.  **Naming Convention**: `[year]-[topic]-completed.md`.

**Action Item:**
- [ ] Create `docs/archive/completed/` directory if missing.
- [ ] Move any stale completed plans from `planning/` to `archive/`.
