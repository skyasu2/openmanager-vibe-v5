# 📈 OpenManager VIBE v5 단계별 개선 계획

> **작성일**: 2025-11-20  
> **현재 버전**: v5.80.0  
> **목표**: 점진적이고 안정적인 개선

---

## 🎯 Phase 1: 코드 품질 개선 (1-2주)

### 1.1 ESLint 경고 정리 (우선순위: 높음)
**현재 상태**: 251개 경고
- no-unused-vars: 250개
- no-explicit-any: 1개

**목표**: 100개 이하로 감소

**작업 계획**:
```bash
# Step 1: 자동 수정 가능한 항목 (예상 50개)
npm run lint -- --fix

# Step 2: 미사용 import 제거 (예상 100개)
- 스크립트 실행: scripts/maintenance/fix-unused-imports.sh
- 수동 검토 후 커밋

# Step 3: 미사용 변수 정리 (예상 100개)
- 실제 사용하지 않는 변수 제거
- 향후 사용 예정이면 주석 추가
```

**예상 시간**: 3-4시간  
**위험도**: 낮음 (타입 체크로 검증)

---

### 1.2 TypeScript strict 모드 유지
**현재 상태**: 0 에러 ✅

**작업 계획**:
- 새로운 코드 작성 시 strict 모드 준수
- any 타입 사용 최소화
- 타입 가드 적극 활용

**예상 시간**: 지속적  
**위험도**: 없음

---

## 🎨 Phase 2: UI/UX 개선 (2-3주)

### 2.1 게스트 모드 UI 개선
**현재 상태**: alert() 팝업

**목표**: 모달 컴포넌트로 교체

**작업 계획**:
```typescript
// 1. 모달 컴포넌트 생성
src/components/ui/GuestRestrictionModal.tsx

// 2. 메인 페이지에 적용
src/app/main/page.tsx
- alert() 제거
- 모달 상태 관리
- GitHub 로그인 버튼 추가
```

**예상 시간**: 2-3시간  
**위험도**: 낮음

---

### 2.2 AI 사이드바 스트리밍 응답
**현재 상태**: 일반 응답 (500-1000ms)

**목표**: 실시간 스트리밍 응답

**작업 계획**:
```typescript
// 1. SSE 엔드포인트 추가
src/app/api/ai/query/stream/route.ts

// 2. 프론트엔드 스트리밍 처리
src/components/dashboard/AISidebarContent.tsx
- EventSource 사용
- 청크 단위 렌더링
```

**예상 시간**: 4-5시간  
**위험도**: 중간

---

### 2.3 대시보드 성능 최적화
**현재 상태**: 10개 서버 렌더링

**목표**: 가상화 스크롤 적용

**작업 계획**:
```typescript
// react-window 또는 react-virtualized 사용
src/components/dashboard/VirtualizedServerList.tsx
- 이미 구현됨, 활성화 필요
```

**예상 시간**: 1-2시간  
**위험도**: 낮음

---

## 🧪 Phase 3: 테스트 강화 (3-4주)

### 3.1 E2E 테스트 확장
**현재 상태**: 98.2% 통과율

**목표**: 주요 플로우 100% 커버

**작업 계획**:
```typescript
// 1. 게스트 로그인 플로우
tests/e2e/guest-login.spec.ts

// 2. AI 사이드바 플로우
tests/e2e/ai-sidebar.spec.ts

// 3. 시스템 시작 플로우
tests/e2e/system-start.spec.ts
```

**예상 시간**: 6-8시간  
**위험도**: 낮음

---

### 3.2 통합 테스트 추가
**현재 상태**: Unit 테스트 중심

**목표**: API 통합 테스트 추가

**작업 계획**:
```typescript
// API 엔드포인트 테스트
tests/integration/api/
- ai-query.test.ts
- servers.test.ts
- auth.test.ts
```

**예상 시간**: 4-5시간  
**위험도**: 낮음

---

## ⚡ Phase 4: 성능 최적화 (4-5주)

### 4.1 번들 크기 최적화
**현재 상태**: 미측정

**목표**: 초기 로드 < 500KB

**작업 계획**:
```bash
# 1. 번들 분석
npm run build
npx @next/bundle-analyzer

# 2. 동적 import 적용
- 큰 라이브러리 lazy load
- 라우트별 코드 스플리팅

# 3. 트리 쉐이킹 최적화
- 사용하지 않는 코드 제거
```

**예상 시간**: 3-4시간  
**위험도**: 중간

---

### 4.2 이미지 최적화
**현재 상태**: 최적화 안됨

**목표**: WebP 변환, lazy loading

**작업 계획**:
```typescript
// Next.js Image 컴포넌트 활용
import Image from 'next/image'

// 모든 이미지 교체
- priority 속성 설정
- placeholder 추가
```

**예상 시간**: 2-3시간  
**위험도**: 낮음

---

### 4.3 캐싱 전략 개선
**현재 상태**: 5분 TTL

**목표**: 계층적 캐싱

**작업 계획**:
```typescript
// 1. Redis 캐시 추가 (선택)
// 2. SWR 전략 적용
// 3. 캐시 무효화 로직
```

**예상 시간**: 5-6시간  
**위험도**: 중간

---

## 🚀 Phase 5: 기능 확장 (5-6주)

### 5.1 대화 컨텍스트 유지
**현재 상태**: 단일 질의응답

**목표**: 대화 히스토리 기반 응답

**작업 계획**:
```typescript
// 1. 세션 스토리지에 대화 저장
// 2. API에 컨텍스트 전달
// 3. AI 응답에 컨텍스트 반영
```

**예상 시간**: 4-5시간  
**위험도**: 중간

---

### 5.2 멀티모달 지원
**현재 상태**: 텍스트만

**목표**: 이미지 업로드 지원

**작업 계획**:
```typescript
// 1. 파일 업로드 UI
// 2. 이미지 전처리
// 3. Gemini Vision API 연동
```

**예상 시간**: 6-8시간  
**위험도**: 높음

---

### 5.3 알림 시스템
**현재 상태**: 없음

**목표**: 실시간 알림

**작업 계획**:
```typescript
// 1. Supabase Realtime 활용
// 2. 브라우저 알림 권한
// 3. 알림 센터 UI
```

**예상 시간**: 5-6시간  
**위험도**: 중간

---

## 📊 우선순위 매트릭스

| Phase | 작업 | 중요도 | 긴급도 | 난이도 | 예상시간 |
|---|---|---|---|---|---|
| 1.1 | ESLint 경고 정리 | ⭐⭐⭐ | ⭐⭐⭐ | 낮음 | 3-4h |
| 2.1 | 게스트 모드 UI | ⭐⭐⭐ | ⭐⭐ | 낮음 | 2-3h |
| 2.2 | AI 스트리밍 | ⭐⭐ | ⭐⭐ | 중간 | 4-5h |
| 2.3 | 대시보드 최적화 | ⭐⭐ | ⭐ | 낮음 | 1-2h |
| 3.1 | E2E 테스트 | ⭐⭐⭐ | ⭐ | 낮음 | 6-8h |
| 3.2 | 통합 테스트 | ⭐⭐ | ⭐ | 낮음 | 4-5h |
| 4.1 | 번들 최적화 | ⭐⭐ | ⭐ | 중간 | 3-4h |
| 4.2 | 이미지 최적화 | ⭐ | ⭐ | 낮음 | 2-3h |
| 4.3 | 캐싱 개선 | ⭐⭐ | ⭐ | 중간 | 5-6h |
| 5.1 | 대화 컨텍스트 | ⭐⭐ | ⭐ | 중간 | 4-5h |
| 5.2 | 멀티모달 | ⭐ | ⭐ | 높음 | 6-8h |
| 5.3 | 알림 시스템 | ⭐ | ⭐ | 중간 | 5-6h |

---

## 🎯 즉시 시작 가능한 작업 (Quick Wins)

### 1. ESLint 경고 자동 수정 (10분)
```bash
npm run lint -- --fix
git add -A
git commit -m "chore: ESLint 자동 수정 적용"
```

### 2. 미사용 import 제거 (30분)
```bash
./scripts/maintenance/fix-unused-imports.sh
# 수동 검토 후 커밋
```

### 3. 대시보드 가상화 활성화 (1시간)
```typescript
// src/components/dashboard/ServerDashboard.tsx
// VirtualizedServerList 활성화
```

---

## 📝 다음 단계

### 이번 주 (Week 1)
- [x] 게스트 모드 로그인 플로우 개선
- [x] 사이드 이펙트 분석 문서
- [ ] ESLint 경고 50개 정리
- [ ] 게스트 모드 UI 개선

### 다음 주 (Week 2)
- [ ] ESLint 경고 100개 정리
- [ ] AI 스트리밍 응답 구현
- [ ] E2E 테스트 추가

### 3주차 (Week 3)
- [ ] 번들 크기 최적화
- [ ] 이미지 최적화
- [ ] 통합 테스트 추가

---

## 🔄 진행 상황 추적

### 완료된 작업 ✅
- [x] 게스트 모드 제한 로직 추가
- [x] AI 사이드바 분석 문서
- [x] 사이드 이펙트 분석 문서

### 진행 중 🔄
- [ ] ESLint 경고 정리

### 대기 중 ⏳
- [ ] 게스트 모드 UI 개선
- [ ] AI 스트리밍 응답

---

## 📌 참고 문서
- [AI 사이드바 분석](./analysis/ai-sidebar-analysis.md)
- [사이드 이펙트 분석](./analysis/side-effects-guest-mode.md)
- [경고 개선 계획](./temp/lint-warning-improvement-plan.md)

---

**작성자**: Kiro AI  
**최종 업데이트**: 2025-11-20
