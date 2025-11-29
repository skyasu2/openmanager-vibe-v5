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

## 🧪 레거시 Mock 시스템 (테스트/데모 전용)

이 디렉토리의 파일들은 **레거시 Mock 시스템**으로, **테스트 및 데모 목적으로만 사용**됩니다:

- `fixedHourlyData.ts` - 구 시간별 데이터 시스템
- `index.ts` - 레거시 Mock 시스템 진입점 (`getMockSystem()`)
- `mockDataGenerator.ts` - 구 데이터 생성기
- `mockDataRotator.ts` - 구 데이터 회전기 (30초 autoRotate)
- `mockScenarios.ts` - 구 시나리오 시스템
- `mockServerConfig.ts` - 구 서버 설정 (8개 서버)
- `mockServerConfigExpanded.ts` - 구 확장 서버 설정 (15개 서버)

### 현재 사용 위치

레거시 Mock 시스템은 다음 API에서만 사용됩니다 (테스트/데모 전용):

1. **`/api/servers/mock/route.ts`** - Mock 시스템 전용 API (테스트용)
2. **`/api/servers/realtime/route.ts`** - 실시간 데이터 API (30초 autoRotate)
3. **`/api/servers/next/route.ts`** - 서버 페이지네이션 API
4. **`/api/servers/[id]/route.ts`** - 개별 서버 조회 API
5. **`/api/metrics/route.ts`** - Prometheus 메트릭 API
6. **`/api/cache/optimize/route.ts`** - 캐시 최적화 API
7. **`src/context/basic-context-manager.ts`** - AI 컨텍스트 관리
8. **`/api/test/timezone/route.ts`** - 테스트 전용

### 프로덕션 데이터 소스

**프로덕션 환경에서는 scenario-loader (24시간 고정 데이터)를 사용**:

- `/api/servers` - UnifiedServerDataSource → scenario-loader
- `/api/servers/all` - UnifiedServerDataSource → scenario-loader
- 클라이언트 Hook (`useFixed24hMetrics`) - 직접 scenario-loader 호출

### 왜 유지하나요?

1. **테스트/데모 목적**: 일부 API는 실시간 로테이션 기능 필요
2. **TypeScript 호환성**: import 오류 방지
3. **하위 호환성**: 기존 API 동작 유지

### 제거 계획 없음

레거시 Mock 시스템은 **영구 유지** 예정입니다:

- 테스트 및 데모 목적으로 계속 사용
- 24시간 고정 데이터와 병행 운영
- 실제 서버 연결 계획 없음

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

### 레거시 Mock 시스템 (테스트/데모용)

```
🧪 src/mock/index.ts (getMockSystem)
  ↓
🧪 src/mock/mockDataGenerator.ts
🧪 src/mock/mockDataRotator.ts (autoRotate 기능)
  ↓
🧪 /api/servers/mock, /api/servers/realtime (테스트/데모 전용)
```

**용도**: 테스트, 데모, 실시간 로테이션 시뮬레이션

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

### Q: 레거시 Mock 시스템과 scenario-loader의 차이는?

A:

- **scenario-loader** (프로덕션): 24시간 고정 데이터, 5분 단위 회전, Gemini 구현 (5/5 품질)
- **레거시 Mock**: 실시간 로테이션 (30초), 테스트/데모 전용, 단순 패턴

### Q: 어느 시스템을 사용해야 하나요?

A:

- **프로덕션 대시보드**: scenario-loader (UnifiedServerDataSource)
- **테스트/데모**: 레거시 Mock (getMockSystem)
- **실시간 시뮬레이션**: 레거시 Mock (/api/servers/realtime)

### Q: 레거시 Mock 시스템을 제거할 계획인가요?

A: **없습니다**. 테스트 및 데모 목적으로 영구 유지됩니다. 실제 서버 연결 계획도 없습니다.

### Q: 새로운 프로덕션 데이터를 추가하려면?

A: `scripts/generate-static-metrics.ts` 스크립트를 실행하여 24시간 JSON 파일을 재생성하세요. scenario-loader가 자동으로 로드합니다.

### Q: 실시간 데이터 회전은 어떻게 작동하나요?

A:

- **scenario-loader**: KST 기준 현재 시간(0-23시) 자동 회전, 5분 단위
- **레거시 Mock**: autoRotate 기능, 30초 간격, 수동 시간 점프 가능

---

**참고**: 이 문서는 현재 시스템 상태를 반영합니다. 시스템 변경 시 이 문서도 함께 업데이트해주세요.
