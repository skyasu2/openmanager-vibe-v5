# AGENTS.md - OpenManager VIBE v5

<!-- Version: 3.0.0 | For: AI Coding Agents -->
**Language: Korean (기술 용어 영어 병기)**

## Project Overview

**OpenManager VIBE** - AI-Native Server Monitoring PoC
- **Stack**: Next.js 16.1.1, React 19, TypeScript 5.9 (Strict), Supabase, Vercel AI SDK
- **Architecture**: Vercel (Frontend) + Google Cloud Run (AI Engine)
- **Node**: >=22.0.0 <23.0.0

---

## Build / Lint / Test Commands

### Development
```bash
npm run dev:network     # Dev server (0.0.0.0:3000)
npm run dev             # Dev server (localhost:3000)
npm run build           # Production build
```

### Validation (REQUIRED before commits)
```bash
npm run validate:all    # Full: type-check + lint + test
npm run validate:quick  # Fast: type-check + lint only
npm run type-check      # TypeScript only
npm run lint            # Biome lint only
npm run lint:fix        # Auto-fix lint issues
```

### Testing
```bash
# Unit Tests (Vitest)
npm run test                  # Full test suite
npm run test:quick            # Minimal/fast tests
npm run test:watch            # Watch mode
npm run test:coverage         # With coverage report

# Run single test file
npx vitest run src/hooks/useAuth.test.ts
npx vitest run --config config/testing/vitest.config.main.ts path/to/test.ts

# E2E Tests (Playwright - Chromium only)
npm run test:e2e              # All E2E tests
npm run test:e2e:critical     # Smoke + guest + a11y only
npm run test:e2e:no-ai        # Skip AI tests (@ai-test tag)

# Run single E2E test
npx playwright test tests/e2e/smoke.spec.ts
```

---

## Code Style Guidelines

### TypeScript Rules (STRICT)
- **Strict mode enabled** - all strict flags ON in tsconfig.json
- **NO `any`** - `noExplicitAny: error` in Biome (src/**), use `unknown` + type guards
- **NO `as any`**, **NO `@ts-ignore`**, **NO `@ts-expect-error`**
- **Null safety** - `strictNullChecks`, `noUncheckedIndexedAccess` enabled
- Use type guards for runtime validation (see `src/types/server.ts` for examples)

```typescript
// ❌ BAD
const data = response as any;
// @ts-ignore
someFunction(untypedValue);

// ✅ GOOD
function isServer(obj: unknown): obj is Server {
  return typeof obj === 'object' && obj !== null && 'id' in obj;
}
if (isServer(data)) { /* safely use data */ }
```

### Formatting (Biome)
- **Indent**: 2 spaces
- **Line width**: 80 chars
- **Quotes**: Single quotes for JS/TS, double for JSX attributes
- **Semicolons**: Always
- **Trailing commas**: ES5 style
- **Line endings**: LF (Unix)

### Imports
- Use path aliases: `@/*` → `./src/*`
- Common aliases: `@/components`, `@/lib`, `@/types`, `@/hooks`, `@/services`
- Prefer `import type { X }` for type-only imports (Biome enforces this)
- Order: React → External libs → Internal (@/) → Relative (./)

```typescript
import { useState, useCallback } from 'react';
import type { FC } from 'react';

import { useQuery } from '@tanstack/react-query';

import type { Server, ServerStatus } from '@/types/server';
import { cn } from '@/lib/utils';

import { LocalComponent } from './LocalComponent';
```

### Naming Conventions
| Type | Convention | Example |
|------|------------|---------|
| Files (components) | PascalCase | `ServerCard.tsx` |
| Files (hooks) | camelCase with use- | `useAuth.ts` |
| Files (utils) | kebab-case | `utils-functions.ts` |
| Components | PascalCase | `ServerDashboard` |
| Hooks | camelCase with use- | `useServerQuery` |
| Types/Interfaces | PascalCase | `ServerInstance`, `UseAuthResult` |
| Constants | UPPER_SNAKE_CASE | `SERVER_TYPE_DEFINITIONS` |
| Functions | camelCase | `formatRelativeTime` |

### Error Handling
- Always handle errors explicitly - no empty catch blocks
- Use `console.warn` for recoverable issues, `console.error` for failures
- Wrap external calls (API, localStorage) in try-catch with fallbacks

```typescript
// ✅ GOOD
function safeGetItem(key: string): string | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem(key);
    }
  } catch {
    console.warn(`localStorage.getItem('${key}') failed`);
  }
  return null;
}
```

### React Patterns
- Functional components only (no class components)
- Use `useCallback` for event handlers passed to children
- Use `useMemo` for expensive computations
- Prefer controlled components over uncontrolled

---

## Project Structure

```
src/
├── app/            # Next.js App Router (pages, layouts, API routes)
├── components/     # Reusable UI components
├── domains/        # Feature-specific modules
├── hooks/          # Custom React hooks
├── lib/            # Core utilities (auth, supabase client)
├── services/       # Business logic & API services
├── types/          # TypeScript type definitions
├── schemas/        # Zod validation schemas
├── config/         # App configuration
└── stores/         # Zustand state stores

tests/
├── e2e/           # Playwright E2E tests
├── unit/          # Vitest unit tests
└── integration/   # Integration tests
```

---

## AI Agent Roles

| Agent | Role | Responsibility |
|-------|------|----------------|
| **Claude Code** | Main Developer | 90% of development & design |
| **Codex** | Implementation Reviewer | Code verification |
| **Gemini** | Cross-Check Reviewer | Cross-validation |
| **Qwen** | Optimization Reviewer | Performance suggestions |
| **Kiro** | Emergency Backup | Fallback when Claude quota exhausted |

---

## Key Configuration Files

| File | Purpose |
|------|---------|
| `tsconfig.json` | TypeScript config (strict mode) |
| `biome.json` | Linting & formatting |
| `config/testing/vitest.config.main.ts` | Main test config |
| `playwright.config.ts` | E2E test config |
| `CLAUDE.md` | Claude-specific rules |

---

## Quick Reference

### Before Every Commit
```bash
npm run validate:quick  # Fast validation
# OR
npm run validate:all    # Full validation with tests
```

### Run Specific Test
```bash
# Vitest (unit)
npx vitest run path/to/file.test.ts

# Playwright (E2E)
npx playwright test path/to/file.spec.ts
```

### Fix Lint Issues
```bash
npm run lint:fix
npm run format
```

---

_Last Updated: 2026-01-05 | Version 5.83.14_
