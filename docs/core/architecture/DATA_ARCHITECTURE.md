# 서버 데이터 아키텍처 가이드

**최종 업데이트**: 2025-11-29
**작성자**: Claude Code + AI Review
**목적**: 난개발 방지를 위한 데이터 아키텍처 명확화

---

## 🎯 핵심 원칙: Single Source of Truth

**절대 규칙**: 모든 서버 데이터는 `scenario-loader`를 통해서만 접근합니다.

### ❌ 금지 사항

```typescript
// ❌ 절대 금지: JSON 파일 직접 읽기
import serversData from '/public/fallback/servers.json';

// ❌ 절대 금지: 새로운 Mock 시스템 생성
class MyCustomMockSystem { ... }

// ❌ 절대 금지: 중복 데이터 소스 생성
const loadServersFromSomewhere = async () => { ... }
```

### ✅ 올바른 방법

```typescript
// ✅ 올바른 방법: scenario-loader 사용
import { loadHourlyScenarioData } from '@/services/scenario/scenario-loader';

const servers = await loadHourlyScenarioData();
```

---

## 📁 데이터 파일 구조

### ✅ Active Files (절대 삭제 금지)

| 파일 경로                                              | 용도                            | 수정 가능 여부       |
| ------------------------------------------------------ | ------------------------------- | -------------------- |
| `public/server-scenarios/hourly-metrics/*.json` (24개) | 프로덕션 서버 데이터 (24시간)   | ✅ 스크립트로만 수정 |
| `public/server-scenarios/servers-metadata.json`        | 서버 메타데이터 (스크립트 전용) | ✅ 수동 수정 가능    |
| `scripts/generate-hourly-metrics.js`                   | 24시간 데이터 생성 스크립트     | ✅ 수동 수정 가능    |

### 🔒 데이터 생성 규칙

**24시간 데이터 재생성 방법**:

```bash
# 1. 서버 메타데이터 수정 (필요 시)
vim public/server-scenarios/servers-metadata.json

# 2. 24시간 데이터 재생성
node scripts/generate-hourly-metrics.js

# 3. Git 커밋
git add public/server-scenarios/hourly-metrics/*.json
git commit -m "data: Update 24-hour server metrics"
```

**⚠️ 주의사항**:

- `hourly-metrics/*.json` 파일을 직접 수정하지 마세요 (스크립트로만 생성)
- `servers-metadata.json` 변경 후 반드시 스크립트 재실행
- JSON 파일 직접 commit 전 반드시 검증

---

## 🏗️ 서비스 아키텍처

### 데이터 흐름 (Read-Only)

```
📊 JSON 데이터 소스
  ↓
  public/server-scenarios/hourly-metrics/*.json (24개 파일)
  ↓
  ↓ [readCachedHourlyFile() - 파일 읽기 + 캐싱]
  ↓
🔄 scenario-loader.ts
  ├─ loadHourlyScenarioData() ← 메인 함수 (10개 서버 보장)
  ├─ KST 시간 기반 회전 (0-23시)
  ├─ 5분 단위 고정 타임스탬프
  └─ 자동 서버 생성 (8개 JSON + 2개 자동 = 10개)
  ↓
  ↓ [EnhancedServerMetrics[] 반환]
  ↓
📦 UnifiedServerDataSource.ts
  ├─ loadFromCustomSource() ← scenario-loader 호출
  ├─ EnhancedServerMetrics[] → Server[] 변환
  └─ 캐싱 (5분 TTL)
  ↓
  ↓ [Server[] 반환]
  ↓
🌐 API Routes
  ├─ /api/servers ← 프로덕션 대시보드
  ├─ /api/servers/all ← 전체 서버 목록
  └─ /api/ai/unified-stream ← AI Assistant
  ↓
  ↓ [HTTP 응답]
  ↓
🖥️ UI Components
  ├─ ImprovedServerCard.tsx
  ├─ DashboardContent.tsx
  └─ AISidebar (AI Assistant)
```

### 핵심 컴포넌트 설명

#### 1. `scenario-loader.ts` (Single Source of Truth)

**역할**: 모든 서버 데이터의 유일한 진입점

**핵심 기능**:

- KST 시간 기반 자동 회전 (0-23시)
- 5분 단위 고정 타임스탬프
- 10개 서버 보장 (8개 JSON + 2개 자동 생성)
- 결정론적 변동성 (동일 시간대 = 동일 값)

**메인 함수**:

```typescript
/**
 * 🔄 24시간 시나리오 데이터 로드 (KST 기반 회전)
 *
 * @returns {Promise<EnhancedServerMetrics[]>} 10개 서버 메트릭스
 *
 * @example
 * // AI Assistant에서 사용
 * const servers = await loadHourlyScenarioData();
 *
 * @example
 * // UnifiedServerDataSource에서 사용
 * const scenarioMetrics = await loadHourlyScenarioData();
 * const servers = scenarioMetrics.map(m => convertToServer(m));
 */
export async function loadHourlyScenarioData(): Promise<
  EnhancedServerMetrics[]
>;
```

#### 2. `UnifiedServerDataSource.ts` (Unified Data Access Layer)

**역할**: 서버 데이터 접근 통합 관리

**싱글톤 패턴**:

```typescript
// ✅ 올바른 사용
const dataSource = UnifiedServerDataSource.getInstance();
const servers = await dataSource.getServers();

// ✅ 편의 함수
import { getServersFromUnifiedSource } from '@/services/data/UnifiedServerDataSource';
const servers = await getServersFromUnifiedSource();
```

**캐싱 전략**:

- TTL: 5분
- 캐시 무효화: `dataSource.invalidateCache()`

#### 3. API Routes (HTTP 인터페이스)

**프로덕션 엔드포인트**:

- `GET /api/servers` - 서버 목록 (인증 필요)
- `GET /api/servers/all` - 전체 서버 (인증 필요)
- `POST /api/ai/unified-stream` - AI Assistant (인증 필요)

**데이터 접근 예시**:

```typescript
// /api/servers/route.ts
import { getServersFromUnifiedSource } from '@/services/data/UnifiedServerDataSource';

export async function GET() {
  const servers = await getServersFromUnifiedSource();
  return NextResponse.json({ servers });
}
```

---

## 🚫 난개발 방지 규칙

### 규칙 1: 새로운 데이터 소스 금지

**❌ 절대 금지**:

```typescript
// public/my-custom-data.json 생성
// src/services/my-custom-loader.ts 생성
```

**✅ 올바른 방법**:

- 기존 `servers-metadata.json` 수정
- `generate-hourly-metrics.js` 스크립트 수정
- `scenario-loader.ts` 로직 개선

### 규칙 2: JSON 파일 직접 import 금지

**❌ 절대 금지**:

```typescript
import data from '/public/server-scenarios/hourly-metrics/00.json';
import fallback from '/public/fallback/servers.json';
```

**✅ 올바른 방법**:

```typescript
import { loadHourlyScenarioData } from '@/services/scenario/scenario-loader';
const data = await loadHourlyScenarioData();
```

### 규칙 3: Mock 시스템 추가 금지

**❌ 절대 금지**:

```typescript
class CustomMockSystem { ... }
const mockData = new CustomMockSystem().getServers();
```

**✅ 올바른 방법**:

- `scenario-loader.ts` 수정
- `UnifiedServerDataSource.ts` 수정

### 규칙 4: 데이터 변환 중복 금지

**❌ 절대 금지**:

```typescript
// 각 API마다 다른 변환 로직
const servers = rawData.map((d) => ({
  id: d.id,
  name: d.name,
  // ... 중복 변환
}));
```

**✅ 올바른 방법**:

- `UnifiedServerDataSource.loadFromCustomSource()` 사용
- 이미 표준화된 변환 로직 존재

---

## 📝 새로운 기능 추가 시 체크리스트

### 서버 데이터 관련 기능 추가 시

- [ ] **1단계**: `scenario-loader.ts`에서 데이터 접근 가능한지 확인
- [ ] **2단계**: `UnifiedServerDataSource`의 캐싱 활용 검토
- [ ] **3단계**: 기존 API Routes 재사용 가능 여부 확인
- [ ] **4단계**: 새로운 JSON 파일 생성 대신 기존 파일 활용
- [ ] **5단계**: JSDoc 주석 작성 (단일 진실 소스 명시)

### 예시: 새로운 서버 메트릭 추가

```typescript
// ✅ 올바른 방법
// 1. servers-metadata.json에 새 필드 추가
{
  "id": "web-server-1",
  "customMetric": 42  // ← 신규 필드
}

// 2. EnhancedServerMetrics 타입 확장 (scenario-loader.ts)
export interface EnhancedServerMetrics {
  // ... 기존 필드
  customMetric?: number;  // ← 타입 추가
}

// 3. generate-hourly-metrics.js 스크립트 수정
const server = {
  ...metadata,
  customMetric: metadata.customMetric || 0,  // ← 로직 추가
};

// 4. 24시간 데이터 재생성
node scripts/generate-hourly-metrics.js
```

---

## 🛡️ 코드 리뷰 체크리스트

PR 리뷰 시 다음 항목을 확인하세요:

### 서버 데이터 관련 변경 시

- [ ] `scenario-loader.ts`를 통해 데이터 접근하는가?
- [ ] JSON 파일 직접 import 없는가?
- [ ] 새로운 Mock 시스템 생성 없는가?
- [ ] 중복 데이터 변환 로직 없는가?
- [ ] JSDoc 주석이 명확한가?
- [ ] TypeScript 타입 안전성 유지되는가?
- [ ] 캐싱 전략이 일관성 있는가?

### 금지 패턴 감지

```bash
# JSON 직접 import 검색
grep -r "import.*from.*\.json" src/

# Mock 시스템 생성 검색
grep -r "class.*Mock.*System" src/

# 직접 fetch 검색
grep -r "fetch('/public/" src/
```

---

## 📖 참고 문서

- **Mock 시스템 현황**: `src/mock/README.md`
- **시나리오 로더**: `src/services/scenario/scenario-loader.ts`
- **통합 데이터 소스**: `src/services/data/UnifiedServerDataSource.ts`
- **생성 스크립트**: `scripts/generate-hourly-metrics.js`

---

## 🔄 데이터 업데이트 절차

### 서버 목록 변경

1. `public/server-scenarios/servers-metadata.json` 수정
2. `node scripts/generate-hourly-metrics.js` 실행
3. Git commit: `git add public/server-scenarios/ && git commit -m "data: Update server metadata"`

### 시나리오 로직 변경

1. `scripts/generate-hourly-metrics.js` 수정
2. `node scripts/generate-hourly-metrics.js` 실행
3. TypeScript 컴파일 검증: `npm run type-check`
4. Git commit

### 데이터 변환 로직 변경

1. `src/services/scenario/scenario-loader.ts` 또는 `UnifiedServerDataSource.ts` 수정
2. TypeScript 컴파일 검증
3. 테스트 실행 (필요 시)
4. Git commit

---

**중요**: 이 문서를 위반하는 코드는 PR 리뷰에서 반려됩니다.
