# Framework Upgrade Checklist - 2025 Stack

**검토 일자**: 2025-12-19
**프로젝트 버전**: v5.83.1

---

## 1. 패키지 버전 현황

| 프레임워크 | 버전 | 상태 |
|-----------|------|------|
| Next.js | ^16.0.7 | ✅ 최신 |
| React | ^19.2.1 | ✅ 최신 |
| React DOM | ^19.2.1 | ✅ 최신 |
| TypeScript | ^5.9.3 | ✅ 최신 |
| Tailwind CSS | ^4.1.17 | ✅ 최신 |
| Node.js | v22.21.1 | ✅ LTS |

---

## 2. Next.js 16 Breaking Changes 체크리스트

### ✅ 완료 항목

| 항목 | 상태 | 비고 |
|------|------|------|
| Turbopack 기본 번들러 | ✅ | `next.config.mjs`에 turbopack 블록 설정 |
| `images.domains` deprecated | ✅ | `remotePatterns` 사용 중 |
| `serverExternalPackages` | ✅ | 번들 최적화 설정됨 |
| `devIndicators` 설정 | ✅ | E2E 테스트 환경 분기 처리 |
| Node.js 20.9+ 요구 | ✅ | v22.21.1 사용 중 |
| TypeScript 5.1+ 요구 | ✅ | v5.9.3 사용 중 |

### ✅ Async Request APIs (Next.js 16 핵심 변경)

> **참고**: Next.js 16에서 `params`, `searchParams`, `cookies()`, `headers()`, `draftMode()`는 **반드시 비동기**로 접근해야 함

| API | 현재 상태 | 위치 |
|-----|----------|------|
| `cookies()` | ✅ `await` 사용 | `src/lib/supabase/server.ts:13` |
| `searchParams` | ✅ URL 객체에서 추출 | API routes에서 `new URL(request.url).searchParams` 패턴 사용 |
| `headers()` | N/A | 직접 사용 없음 |

### ✅ Middleware → Proxy 변경 (해당없음)

- **현재 상태**: 루트 레벨 `middleware.ts` 없음
- **기존 파일**: Supabase 유틸리티 (`src/lib/supabase/middleware.ts`, `src/utils/supabase/middleware.ts`)
- **결론**: App Router 사용 중이며, Next.js 라우터 미들웨어 미사용

---

## 3. React 19 Breaking Changes 체크리스트

### ✅ 완료 항목

| 항목 | 상태 | 비고 |
|------|------|------|
| JSX Transform | ✅ | `jsx: "react-jsx"`, `jsxImportSource: "react"` |
| `@types/react` | ✅ | ^19.2.7 |
| `@types/react-dom` | ✅ | 최신 버전 |

### ⚠️ 주의 항목

| 항목 | 상태 | 비고 |
|------|------|------|
| `forwardRef` 사용 | ⚠️ 76개 | React 19에서 deprecated 예정, 현재는 호환됨 |

> **참고**: `forwardRef`는 React 19에서 여전히 작동하지만, 향후 버전에서 제거될 예정
> - 점진적 마이그레이션 권장
> - `ref`를 직접 prop으로 전달하는 방식으로 변경 가능

---

## 4. TypeScript 5.9 Strict Mode 체크리스트

### ✅ tsconfig.json 설정 확인

| 옵션 | 상태 |
|------|------|
| `strict` | ✅ true |
| `noImplicitAny` | ✅ true |
| `strictNullChecks` | ✅ true |
| `strictFunctionTypes` | ✅ true |
| `strictBindCallApply` | ✅ true |
| `strictPropertyInitialization` | ✅ true |
| `noUncheckedIndexedAccess` | ✅ true |
| `noImplicitReturns` | ✅ true |
| `noFallthroughCasesInSwitch` | ✅ true |

---

## 5. Tailwind CSS v4 체크리스트

### ✅ 완료 항목

| 항목 | 상태 | 비고 |
|------|------|------|
| `@import 'tailwindcss'` | ✅ | v4 새 문법 사용 |
| `@tailwindcss/postcss` | ✅ | PostCSS 플러그인 설정 |
| `@theme {}` 블록 | ✅ | 커스텀 테마 변수 정의 |
| `@custom-variant dark` | ✅ | 다크모드 설정 |
| deprecated opacity 클래스 | ✅ | 8개 → v4 문법으로 변환 완료 |

### ✅ 수정된 파일 (deprecated → v4 문법)

| 파일 | 변경 내용 |
|------|----------|
| `DashboardClient.tsx` | `bg-black bg-opacity-50` → `bg-black/50` |
| `Modal.tsx` | `bg-black bg-opacity-75` → `bg-black/75` |
| `IntelligentMonitoringModal.tsx` | `bg-black bg-opacity-50` → `bg-black/50` |
| `ServerDetailOverview.tsx` | `bg-white bg-opacity-20` → `bg-white/20`, `text-white text-opacity-90` → `text-white/90` |
| `ServerDashboardTabs.tsx` | `hover:bg-opacity-50` → `hover:bg-white/50` |
| `PerformanceMonitor.tsx` | `bg-opacity-50 hover:bg-opacity-75` → `bg-white/50 hover:bg-white/75` |

---

## 6. UI 라이브러리 호환성 체크리스트

### ✅ 완료 항목

| 라이브러리 | 버전 | React 19 호환 |
|-----------|------|--------------|
| Radix UI (accordion) | ^1.2.11 | ✅ |
| Radix UI (dialog) | ^1.1.4 | ✅ |
| Radix UI (select) | ^2.1.4 | ✅ |
| Radix UI (toast) | ^1.2.14 | ✅ |
| Lucide React | ^0.556.0 | ✅ |
| tailwindcss-animate | ^1.0.7 | ✅ |

---

## 7. 빌드 및 검증 결과

### ✅ 검증 완료

| 항목 | 결과 |
|------|------|
| `npm run build` | ✅ 성공 (exit code 0) |
| `npm run type-check` | ✅ 성공 |
| `npm run lint` | ✅ 106 warnings (0 errors) |
| 폰트 렌더링 | ✅ Inter + Noto Sans KR 적용 확인 |

---

## 8. 향후 마이그레이션 권장 사항

### 단기 (선택적)

1. **forwardRef → ref prop 마이그레이션**
   - React 향후 버전에서 deprecated 예정
   - [codemod 사용 가능](https://app.codemod.com/registry/react/19/remove-forward-ref)

2. **Cache Components 도입 검토**
   - Next.js 16의 새로운 캐싱 모델
   - `"use cache"` 디렉티브 활용

### 장기 (모니터링)

1. **proxy.ts 전환 검토**
   - 현재는 미들웨어 미사용으로 해당 없음
   - 향후 네트워크 경계 제어 필요 시 검토

---

## 참고 자료

- [Next.js 16 공식 블로그](https://nextjs.org/blog/next-16)
- [Next.js 16 업그레이드 가이드](https://nextjs.org/docs/app/guides/upgrading/version-16)
- [React 19 공식 릴리스](https://react.dev/blog/2024/12/05/react-19)
- [React 19 forwardRef 마이그레이션 가이드](https://plainenglish.io/blog/react-19-deprecates-forwardref-a-guide-to-passing-ref-as-a-standard-prop)
- [shadcn/ui React 19 forwardRef 이슈](https://github.com/shadcn-ui/ui/issues/3898)
- [MUI X React 19 마이그레이션](https://mui.com/blog/react-19-update/)
