# 🔧 OpenManager Vibe v5 리팩토링 가이드

## 🚨 중복 개발 문제 및 해결 방안

### 📊 현재 상황 분석

- **603개 파일**, **200,081줄 코드**
- **5개 중복 컴포넌트 제거 완료** ✅
- **158개 npm 스크립트** (정리 예정)

---

## ✅ **완료된 중복 제거 작업**

### 🎯 **사용 현황 기반 신중한 제거 (완료)**

#### ✅ AI 사이드바 중복 제거 완료

```
❌ 제거 완료:
- src/modules/ai-sidebar/components/NewAISidebar.tsx ✅
- src/modules/ai-sidebar/components/NewAISidebarSimple.tsx ✅
- src/components/ai/EnhancedAISidebar.tsx ✅

✅ 유지 (현재 사용 중):
- src/modules/ai-sidebar/components/VercelOptimizedAISidebar.tsx
  └── 사용 위치: DashboardHeader.tsx
```

#### ✅ 프로필 컴포넌트 중복 제거 완료

```
❌ 제거 완료:
- src/components/unified-profile/UnifiedProfileComponent.tsx ✅
- src/components/unified-profile/UnifiedProfileRefactored.tsx ✅

✅ 유지 (현재 사용 중):
- src/components/UnifiedProfileComponent.tsx (루트)
  └── 사용 위치: DashboardHeader.tsx, app/page.tsx
```

#### ✅ 서버 카드 현황 (검토 완료)

```
✅ 유지 (현재 사용 중):
- src/components/dashboard/EnhancedServerCard.tsx
  └── 사용 위치: ServerDashboard.tsx
```

---

## 🎯 **다음 단계 우선순위**

### 🟡 **커스텀 훅 적용 (Medium)**

#### useState 패턴 통합

```tsx
// Before (20+ 곳에서 반복)
const [isLoading, setIsLoading] = useState(false);
const [isOpen, setIsOpen] = useState(false);
const [currentIndex, setCurrentIndex] = useState(0);

// After (커스텀 훅 사용) ✅ 구현 완료
import { useLoading, useToggle, useIndex } from '@/hooks/useCommonStates';

const { isLoading, startLoading, stopLoading } = useLoading();
const { value: isOpen, toggle, setTrue, setFalse } = useToggle();
const { currentIndex, next, prev, goTo } = useIndex(maxItems);
```

### 🟢 **npm 스크립트 정리 (Low)**

#### 158개 → 30개 핵심 스크립트만 유지

```json
{
  "scripts": {
    // 🔥 핵심 개발
    "dev": "next dev",
    "build": "next build",
    "start": "next start",

    // 🧪 테스트
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",

    // ⚡ 품질 검사
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "validate": "npm run type-check && npm run lint && npm run test",

    // 🚀 배포
    "deploy": "git push origin main",

    // 🔧 MCP (필수만)
    "mcp:setup": "node scripts/mcp-setup.js",
    "mcp:status": "node scripts/mcp-status.js"

    // ❌ 나머지 128개 제거 예정
  }
}
```

---

## 📋 리팩토링 실행 체크리스트

### Phase 1: 중복 제거 ✅ **완료**

- [x] AI 사이드바 3개 컴포넌트 삭제 ✅
- [x] 프로필 컴포넌트 2개 삭제 ✅
- [x] 사용 현황 기반 신중한 분석 ✅
- [x] 빌드 및 테스트 검증 ✅

### Phase 2: 훅 통합 (진행 중)

- [x] useCommonStates.ts 구현 ✅
- [ ] 20+ 컴포넌트에 useLoading 적용
- [ ] 15+ 컴포넌트에 useToggle 적용
- [ ] 10+ 컴포넌트에 useIndex 적용

### Phase 3: 스크립트 정리 (대기 중)

- [ ] package.json 백업
- [ ] 128개 스크립트 제거
- [ ] 30개 핵심 스크립트만 유지
- [ ] README 업데이트

---

## 🎯 **완료된 개선 효과**

### 📉 실제 코드 감소

- **컴포넌트**: 5개 제거 완료 → 유지보수성 ↑
- **중복 코드**: 약 1,500줄 감소
- **빌드 시간**: 약간 개선

### 📈 품질 향상 (완료)

- **일관성**: 사용 중인 컴포넌트만 유지
- **명확성**: import 경로 단순화
- **안정성**: 모든 테스트 통과 ✅

---

## 🚀 **검증 결과**

### ✅ **중복 제거 후 검증 완료**

```bash
✅ 타입 체크: 통과
✅ ESLint: 경고/에러 없음
✅ 단위 테스트: 11/11 통과 (100%)
✅ 기능 정상 동작 확인
```

### 📊 **개선된 프로젝트 상태**

| 이전                | 이후                | 개선도   |
| ------------------- | ------------------- | -------- |
| 4개 AI 사이드바     | 1개 AI 사이드바     | 75% 감소 |
| 3개 프로필 컴포넌트 | 1개 프로필 컴포넌트 | 67% 감소 |
| 중복 import 복잡도  | 단순화된 import     | 명확성 ↑ |

---

## 🔧 **배포 에러 해결 완료**

### ✅ **Vercel 설정 수정**

```json
// Before (에러 발생)
"runtime": "fluid"  // ❌ 버전 미명시

// After (수정 완료)
"runtime": "nodejs20.x"  // ✅ 명시적 버전
```

---

## 📞 **다음 단계 가이드**

### 즉시 진행 가능한 작업

1. **커스텀 훅 적용**: `useCommonStates.ts` 활용
2. **npm 스크립트 정리**: 128개 제거
3. **접근성 개선**: aria-label 추가

### 장기 개선 계획

1. **성능 최적화**: 번들 분석
2. **테스트 확대**: UI 컴포넌트 테스트
3. **문서화**: Storybook 확대
