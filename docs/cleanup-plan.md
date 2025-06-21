# 🧹 대시보드 컴포넌트 정리 계획

## 📊 현재 상황 분석

### ✅ 실제 사용 중인 컴포넌트

```
src/components/dashboard/
├── ServerDashboard.tsx (메인 대시보드)
│   └── EnhancedServerCard.tsx (실제 사용)
├── server-dashboard/ServerDashboardServers.tsx (서브 대시보드)
│   └── ServerCard/ServerCard.tsx (실제 사용)
└── EnhancedServerModal.tsx (모달)
```

### ❌ 중복/미사용 컴포넌트들

**1. 서버 카드 중복:**

- `AnimatedServerCard.tsx` (431줄) - 애니메이션 카드, 미사용
- `ServerCard/MetricsDisplay.tsx` (251줄) - 2x2 그리드 구현했지만 미사용
- `ServerCard/ActionButtons.tsx` - 미사용
- `ServerCard/ServerIcon.tsx` - 미사용
- `ServerCard/StatusBadge.tsx` - 미사용

**2. 모달 중복:**

- `ServerDetailModal.tsx` (179줄) - 구버전
- `ServerDetailModalNew.tsx` (219줄) - 신버전?
- `TempEnhancedServerModal.tsx~` (0줄) - 임시파일

**3. 기타 미사용:**

- `GoogleAIStatusCard.tsx` (4줄) - 거의 빈 파일
- `AnomalyFeed.tsx` (22줄) - 미완성 컴포넌트

## 🎯 정리 계획

### Phase 1: 안전한 백업

1. 현재 사용 중인 컴포넌트 확인
2. 의존성 분석 (grep으로 import 검색)
3. 사용되지 않는 컴포넌트 목록 최종 확정

### Phase 2: 점진적 제거

1. **완전 미사용 컴포넌트 제거:**

   - `TempEnhancedServerModal.tsx~`
   - `GoogleAIStatusCard.tsx` (내용 없음)
   - `AnomalyFeed.tsx` (미완성)

2. **ServerCard 폴더 정리:**

   - `MetricsDisplay.tsx` → `EnhancedServerCard.tsx`로 통합
   - `ActionButtons.tsx`, `ServerIcon.tsx`, `StatusBadge.tsx` 제거
   - `ServerCard.tsx`는 ServerDashboardServers에서 사용 중이므로 유지

3. **모달 정리:**
   - `ServerDetailModal.tsx`, `ServerDetailModalNew.tsx` 제거
   - `EnhancedServerModal.tsx`만 유지

### Phase 3: 기능 통합

1. **EnhancedServerCard 개선:**

   - MetricsDisplay의 2x2 그리드 로직 완전 통합
   - 중복 코드 제거

2. **ServerCard 단순화:**
   - ServerDashboardServers 전용으로 최적화
   - 불필요한 기능 제거

## 🚀 예상 효과

- **파일 수 감소**: 25개 → 15개 (40% 감소)
- **코드 라인 감소**: ~3,000줄 감소 예상
- **유지보수성 향상**: 중복 제거로 일관성 확보
- **빌드 시간 단축**: 불필요한 컴포넌트 제거

## ⚠️ 주의사항

- 스토리북 파일들도 함께 정리 필요
- 테스트 파일 업데이트 필요
- import 경로 일괄 수정 필요
