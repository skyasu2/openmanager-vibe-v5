# Mock 데이터 시스템 현황

**마지막 업데이트**: 2025-11-29

---

## 🎯 현재 활성 시스템

**Scenario-based Metrics System** (`src/services/scenario/scenario-loader.ts`)

- **위치**: `src/services/scenario/scenario-loader.ts`
- **데이터 소스**: `public/data/hourly-metrics/*.json` (24시간 × 15개 서버)
- **생성 스크립트**: `scripts/generate-static-metrics.ts`
- **클라이언트 Hook**: `src/hooks/useFixed24hMetrics.ts`
- **품질**: ⭐⭐⭐⭐⭐ (5/5)

### 특징

- 4가지 복잡한 시나리오 (DB 과부하, 스토리지 가득, 캐시 실패, 네트워크 병목)
- 3가지 곡선 유형 (linear/exponential/spike)
- AI 분석 무결성 (시나리오 정보 격리)
- KST(한국 시간) 기반 회전
- 5분 단위 고정 타임스탬프
- 결정론적 변동성

### 설정

**SystemConfiguration.ts**:

```typescript
mockSystem: {
  dataSource: 'custom', // scenario-loader 사용
}
```

**UnifiedServerDataSource.ts**:

```typescript
private async loadFromCustomSource(): Promise<Server[]> {
  // scenario-loader에서 장애 시나리오 데이터 로드
  const scenarioMetrics = await loadHourlyScenarioData();
  // ...
}
```

---

## ⚠️ 레거시 파일 (Deprecated)

이 디렉토리의 다른 파일들은 **레거시**이며, **런타임에서 사용되지 않습니다**:

- `fixedHourlyData.ts` - 구 시간별 데이터 시스템
- `index.ts` - 레거시 Mock 시스템 진입점
- `mockDataGenerator.ts` - 구 데이터 생성기
- `mockDataRotator.ts` - 구 데이터 회전기
- `mockScenarios.ts` - 구 시나리오 시스템
- `mockServerConfig.ts` - 구 서버 설정 (8개 서버)
- `mockServerConfigExpanded.ts` - 구 확장 서버 설정 (15개 서버)

### 왜 아직 존재하나요?

1. **TypeScript import 호환성**: 일부 파일에서 import하지만 실제로 호출 안 됨
2. **폴백 안전성**: 혹시 모를 오류 발생 시 폴백 로직 보존
3. **점진적 제거**: 안전성 검증 후 향후 제거 예정

### 제거 계획

- **Phase 1** ✅: Scenario-loader 시스템 안정성 검증 완료 (2025-11-29)
- **Phase 2** ⏳: 프로덕션 환경 3개월 운영 검증 (2025-12 ~ 2026-02)
- **Phase 3** 📅: 레거시 파일 완전 제거 (2026-03)

---

## 📊 데이터 흐름

### 현재 시스템 (Active)

```
scripts/generate-static-metrics.ts (Gemini 구현)
  ↓
public/data/hourly-metrics/*.json (24시간 × 15개 서버, 192KB)
  ↓
src/services/scenario/scenario-loader.ts (KST 회전)
  ↓
UnifiedServerDataSource.ts (loadFromCustomSource)
  ↓
/api/servers/* (API Routes)
  ↓
UI Components (ImprovedServerCard, DashboardContent)
```

### 레거시 시스템 (Deprecated)

```
❌ src/mock/mockDataGenerator.ts
❌ src/mock/mockDataRotator.ts
❌ src/mock/index.ts
  → 런타임에서 호출되지 않음
```

---

## 🧪 검증 방법

### 1. TypeScript 컴파일

```bash
npm run type-check
```

**예상 결과**: ✅ TypeScript 컴파일 성공

### 2. 런타임 데이터 소스 확인

```typescript
// src/config/SystemConfiguration.ts 확인
mockSystem: {
  dataSource: 'custom', // ← 'custom'이면 scenario-loader 사용
}
```

### 3. 실제 데이터 확인

```bash
curl http://localhost:3000/api/servers
```

**예상 응답**: scenario-loader에서 생성된 15개 서버 데이터

---

## 📚 상세 문서

- **Gemini 구현 분석**: `archive/deprecated/metrics-generation-systems/DEPRECATION_NOTICE.md`
- **시나리오 로더**: `src/services/scenario/scenario-loader.ts`
- **생성 스크립트**: `scripts/generate-static-metrics.ts`
- **클라이언트 Hook**: `src/hooks/useFixed24hMetrics.ts`

---

## 💡 FAQ

### Q: 왜 레거시 파일을 바로 삭제하지 않나요?

A: TypeScript import 오류를 피하고, 폴백 안전성을 보장하기 위함입니다. 프로덕션 환경에서 3개월 이상 안정적으로 운영된 후 제거할 예정입니다.

### Q: 새로운 Mock 데이터를 추가하려면?

A: `src/services/scenario/scenario-loader.ts`의 `loadHourlyScenarioData()` 함수를 수정하거나, `scripts/generate-static-metrics.ts` 스크립트를 수정하여 JSON 파일을 재생성하세요.

### Q: 실시간 데이터 회전은 어떻게 작동하나요?

A: `scenario-loader.ts`가 KST(한국 시간) 기준으로 현재 시간(0-23시)을 계산하고, 해당 시간대의 JSON 파일을 로드합니다. 5분마다 자동으로 회전됩니다.

---

**참고**: 이 문서는 현재 시스템 상태를 반영합니다. 시스템 변경 시 이 문서도 함께 업데이트해주세요.
