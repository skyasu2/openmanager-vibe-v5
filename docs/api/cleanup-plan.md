# API Cleanup Plan (Phase 21)

**Date**: 2025-11-29  
**Objective**: 사용되지 않는 API 라우트 정리 및 최적화

---

## 🎯 정리 대상 API (10개)

### 1. Deprecated AI APIs (4개) - 제거 권장

- ✅ **`/api/ai/korean-nlp`** - 이미 410 Gone 처리됨
- ✅ **`/api/ai/ml-analytics`** - 이미 410 Gone 처리됨
- ❌ **`/api/ai/thinking/stream-v2`** - 파일 존재, 사용되지 않음
- ❌ **`/api/ai-unified/*`** (4개) - Legacy Unified AI, `unified-stream`으로 대체됨
  - `/api/ai-unified/core`
  - `/api/ai-unified/ml`
  - `/api/ai-unified/monitoring`
  - `/api/ai-unified/streaming`

### 2. Development/Testing APIs - 조건부 유지

- `/api/test/timezone` - 개발 환경에서 유용
- `/api/test/vercel-test-auth` - Vercel 배포 테스트용
- `/api/debug/env` - 환경 변수 디버깅용
- `/api/agents/health` - MCP 에이전트 모니터링
- `/api/simulate/data` - 데모 데이터 생성

**Action**: 개발 환경에서만 활성화 (프로덕션에서 404 반환)

### 3. Unused Monitoring APIs (2개) - 검토 필요

- `/api/ai-analysis` - 사용 여부 불명확
- `/api/ai-metrics` - 사용 여부 불명확

---

## 🔄 Migration Plan

### Step 1: Legacy AI APIs 제거 (우선순위: High)

```bash
# 1. ai-unified 디렉토리 삭제
rm -rf src/app/api/ai-unified

# 2. thinking/stream-v2 삭제
rm -rf src/app/api/ai/thinking
```

**Impact Analysis**:

- `ai-unified/*` → `unified-stream`으로 이미 마이그레이션 완료
- `thinking/stream-v2` → `unified-stream`의 toolInvocations로 대체됨

### Step 2: Development APIs 보호 (우선순위: Medium)

**Before**:

```typescript
// src/app/api/test/timezone/route.ts
export async function GET(request: NextRequest) {
  // ...
}
```

**After**:

```typescript
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Not available in production' },
      { status: 404 }
    );
  }
  // ...
}
```

**Target Files**:

- `/api/test/timezone`
- `/api/test/vercel-test-auth`
- `/api/debug/env`
- `/api/simulate/data`
- `/api/data-generator/*`

### Step 3: Unused APIs 검증 및 제거 (우선순위: Low)

**Analysis Method**:

```bash
# 1. API 호출 검색
grep -r "api/ai-analysis" src --include="*.ts" --include="*.tsx"
grep -r "api/ai-metrics" src --include="*.ts" --include="*.tsx"

# 2. fetch/axios 호출 검색
grep -r "'/api/ai-analysis'" src
grep -r "'/api/ai-metrics'" src
```

**Action**:

- 호출 없음 → 파일 삭제
- 호출 있음 → 사용 목적 문서화

---

## 📋 Implementation Checklist

### Phase 21.1: Legacy AI APIs 제거 ✅

- [x] `/api/ai/korean-nlp` - 410 Gone 처리 완료
- [x] `/api/ai/ml-analytics` - 410 Gone 처리 완료
- [ ] `/api/ai/thinking/stream-v2` 삭제
- [ ] `/api/ai-unified/core` 삭제
- [ ] `/api/ai-unified/ml` 삭제
- [ ] `/api/ai-unified/monitoring` 삭제
- [ ] `/api/ai-unified/streaming` 삭제

### Phase 21.2: Development APIs 보호

- [ ] `/api/test/timezone` - 프로덕션 차단
- [ ] `/api/test/vercel-test-auth` - 프로덕션 차단
- [ ] `/api/debug/env` - 프로덕션 차단
- [ ] `/api/simulate/data` - 프로덕션 차단
- [ ] `/api/data-generator/start` - 프로덕션 차단
- [ ] `/api/data-generator/status` - 프로덕션 차단

### Phase 21.3: Unused APIs 검증 ✅

- [x] `/api/ai-analysis` 사용 여부 확인 → **삭제 완료**
- [x] `/api/ai-metrics` 사용 여부 확인 → **삭제 완료**
- [x] `/api/ai/edge-v2` 사용 여부 확인 → **삭제 완료**
- [x] `/api/data-generator` 사용 여부 확인 → **삭제 완료**

### Phase 21.4: Documentation

- [x] `docs/api/endpoints.md` 작성
- [ ] `docs/api/endpoints.md` 최신화 (삭제된 API 반영)
- [ ] CHANGELOG 업데이트 (Breaking Changes)
- [ ] Migration Guide 작성

---

## 🎯 Expected Impact

### Bundle Size

- **Before**: 78 API routes
- **After**: ~65 API routes (-13개, -17%)

### Security

- Development APIs 프로덕션 차단으로 보안 강화

### Maintenance

- Legacy 코드 제거로 유지보수성 향상
- API 문서 명확화

---

## 🚨 Breaking Changes

### Removed APIs

**1. Unified AI (Legacy)**

- `/api/ai-unified/core` → Use `/api/ai/unified-stream`
- `/api/ai-unified/ml` → Use `/api/ai/unified-stream`
- `/api/ai-unified/monitoring` → Use `/api/ai/unified-stream`
- `/api/ai-unified/streaming` → Use `/api/ai/unified-stream`

**2. Thinking Stream (Legacy)**

- `/api/ai/thinking/stream-v2` → Use `/api/ai/unified-stream`

**3. Production-Only Development APIs**

- `/api/test/*` → Available in development only
- `/api/debug/*` → Available in development only
- `/api/simulate/*` → Available in development only

---

## 📅 Timeline

- **Day 1**: Legacy AI APIs 제거 (Phase 21.1)
- **Day 2**: Development APIs 보호 (Phase 21.2)
- **Day 3**: Unused APIs 검증 및 제거 (Phase 21.3)
- **Day 4**: 문서화 및 테스트 (Phase 21.4)

---

**Status**: In Progress  
**Started**: 2025-11-29  
**Target Completion**: 2025-12-02
