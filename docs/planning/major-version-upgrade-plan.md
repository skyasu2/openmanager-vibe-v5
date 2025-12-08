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
| **Zod** | v4.1.13 | v4.1.13 | 🟢 Low | ✅ **Done** | Migration completed in Phase 3. |
| **Zustand** | v5.0.9 | v5.0.9 | 🟢 Low | ✅ **Done** | Migration completed in Phase 4. |
| **Tailwind CSS** | v3.4.17 | v4.1.17 | 🟠 Medium | 🏗️ **In Progress** | `@config` directive added. Engine upgrade pending. |
| **TypeScript** | v5.7.2 | v5.9.3 | 🟢 Low | ⏳ **Planned** | Align with Next.js 16 upgrade. |
| **React** | v18.3.1 | v19.2.1 | 🔴 High | ⏳ **Planned** | Requires extensive compatibility testing (Compiler). |
| **Next.js** | v15.5.7 | v16.0.7 | 🔴 High | ⏳ **Planned** | Dependent on React 19 stability. |

---

## 🛠️ Execution Plan

### 1. Tailwind CSS v4 Upgrade (Immediate)
**Goal:** Switch to the new Rust-based engine for 10x faster builds.
- [x] Add `@config` support (Partial)
- [ ] Install `tailwindcss@next` (or v4 stable)
- [ ] Migrate `tailwind.config.ts` to CSS variables if needed
- [ ] Verify styling consistency

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
