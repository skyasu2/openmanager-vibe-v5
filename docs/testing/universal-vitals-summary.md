# Universal Vitals 설정 가이드 - 요약

**원본**: universal-vitals-setup-guide.md (619줄)
**작성일**: 2025-11-27
**목적**: Vercel Universal Vitals 핵심 설정 요약

---

## 📊 핵심 요약

**Universal Vitals란?**:

- Vercel의 실시간 성능 모니터링 도구
- FCP, LCP, CLS, INP 등 Core Web Vitals 측정
- 프로덕션 환경 실제 사용자 데이터 수집

**설정 방법**:

```typescript
// next.config.mjs
export default {
  experimental: {
    webVitalsAttribution: ['CLS', 'LCP', 'FCP', 'INP'],
  },
};
```

**주요 지표**:

- **FCP** (First Contentful Paint): 608ms
- **LCP** (Largest Contentful Paint): <2.5초
- **CLS** (Cumulative Layout Shift): <0.1
- **INP** (Interaction to Next Paint): <200ms

**무료 티어**: 무제한 사용 가능

**모니터링 위치**: Vercel Dashboard → Analytics → Speed

---

**상세 내용**: @docs/testing/universal-vitals-setup-guide.md (619줄)
