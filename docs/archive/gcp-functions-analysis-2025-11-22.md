# GCP Functions 사용 현황 분석 및 정리 방안

**분석 일시**: 2025-11-22
**목적**: Google AI API 직접 호출 전환에 따른 GCP Functions 필요성 재검토

---

## 📊 현재 배포된 GCP Functions (asia-northeast3-openmanager-free-tier)

| Function 이름            | 역할                                 | 현재 사용 여부   | 판단            |
| ------------------------ | ------------------------------------ | ---------------- | --------------- |
| **enhanced-korean-nlp**  | 한국어 NLP 분석 (6-Phase 파이프라인) | ✅ **사용 중**   | **유지**        |
| **ml-analytics-engine**  | ML 기반 메트릭 분석 (scikit-learn)   | ✅ **사용 중**   | **유지**        |
| **unified-ai-processor** | 통합 AI 처리 (레거시)                | ❌ 미사용        | **제거 권장**   |
| **ai-gateway**           | GCP Functions 라우팅 게이트웨이      | ❌ 미사용        | **제거 권장**   |
| **rule-engine**          | 규칙 기반 엔진                       | ❌ 미사용        | **제거 권장**   |
| **health-check**         | 헬스 체크                            | ℹ️ 모니터링 전용 | **선택적 유지** |

---

## ✅ 유지할 Functions (2개)

### 1. **enhanced-korean-nlp** ✅ 필수

**사용처**:

- `src/lib/ai/providers/korean-nlp-provider.ts` (line 110)

**역할**:

```typescript
// 6-Phase Korean NLP Pipeline
- Phase 1: Security Validation (악성 입력 차단)
- Phase 2: Tokenization (형태소 분석)
- Phase 3: Normalization (표준화)
- Phase 4: Entity Extraction (개체명 인식)
- Phase 5: Intent Classification (의도 분류)
- Phase 6: Domain Enhancement (도메인 어휘 매핑)
```

**유지 이유**:

- KoreanNLPProvider가 실제로 호출하여 사용 중
- Google AI SDK로는 대체 불가능한 한국어 전문 처리 기능
- 서버 모니터링 도메인 특화 기능 포함

**비용**: 무료 티어 범위 내 (10분 TTL 캐싱)

---

### 2. **ml-analytics-engine** ✅ 필수

**사용처**:

- `src/lib/ai/providers/ml-provider.ts` (line 103)

**역할**:

```python
# scikit-learn 기반 ML 분석
- Anomaly Detection: 3-sigma 통계 방법
- Trend Analysis: 선형 회귀
- Pattern Recognition: Peak hour, Weekly cycle
```

**유지 이유**:

- MLProvider가 실제로 호출하여 사용 중
- Google AI SDK로는 대체 불가능한 수치 분석 기능
- 성능 모니터링에 필수적인 이상 탐지 기능

**비용**: 무료 티어 범위 내 (5분 TTL 캐싱)

---

## ❌ 제거 권장 Functions (3개)

### 1. **unified-ai-processor** ❌ 더 이상 불필요

**현재 상태**:

- ❌ 코드에서 호출되지 않음
- 정의만 존재: `src/lib/gcp/resilient-ai-client.ts:371` (`processUnifiedAIResilient`)

**대체 시스템**:

- ✅ `GoogleAiUnifiedEngine` (src/lib/ai/engines/GoogleAiUnifiedEngine.ts)
  - Google AI SDK 직접 호출 (`@google/generative-ai`)
  - 7가지 시나리오 지원 (failure-analysis, performance-report 등)
  - Gemini 2.0 Flash Lite 모델 사용

**제거 이유**:

- Google AI API 직접 호출로 완전히 대체됨
- 레거시 코드로 더 이상 사용되지 않음
- 무료 티어 할당량 낭비 중

**제거 영향**:

- ✅ 영향 없음 (코드에서 호출되지 않음)
- resilient-ai-client.ts의 `processUnifiedAIResilient()` 함수 제거 필요

---

### 2. **ai-gateway** ❌ 더 이상 불필요

**현재 상태**:

- ❌ 코드에서 호출되지 않음
- 정의만 존재: `gcp-functions/ai-gateway/index.js`
- 헬스 체크 스크립트에만 참조됨

**역할**:

```javascript
// 라우팅 게이트웨이 (4개 엔진 지원)
-enhanced -
  korean -
  nlp -
  rule -
  engine -
  ml -
  analytics -
  engine -
  unified -
  ai -
  processor;
```

**대체 시스템**:

- ✅ Vercel API Routes (`/api/ai/query/route.ts`)
  - SimplifiedQueryEngine을 통한 직접 라우팅
  - Provider 패턴으로 모듈화 (RAG, KoreanNLP, ML, Rule)

**제거 이유**:

- Vercel API Routes가 게이트웨이 역할 수행
- 중간 라우팅 레이어 불필요 (Vercel → GCP 직접 호출)
- 추가 네트워크 홉 제거로 지연 시간 감소

**제거 영향**:

- ✅ 영향 없음 (코드에서 호출되지 않음)
- 헬스 체크 스크립트 업데이트 필요

---

### 3. **rule-engine** ❌ 더 이상 불필요

**현재 상태**:

- ❌ 코드에서 호출되지 않음 (src/ 디렉토리 전체 검색 결과)
- 정의만 존재: `gcp-functions/ai-gateway/index.js` 참조

**대체 시스템**:

- ✅ `RuleProvider` (src/lib/ai/providers/rule-provider.ts)
  - 간단한 규칙 기반 매칭 (in-memory)
  - GCP Function 호출 없이 즉시 처리

**제거 이유**:

- RuleProvider가 in-memory로 처리하여 더 빠름
- GCP Function 호출 오버헤드 불필요
- 규칙이 복잡하지 않아 로컬 처리로 충분

**제거 영향**:

- ✅ 영향 없음 (코드에서 호출되지 않음)

---

## ℹ️ 선택적 유지 Functions (1개)

### **health-check** ℹ️ 모니터링 전용

**현재 상태**:

- 헬스 체크 스크립트에서 참조됨
- GCP Functions 전체 상태 모니터링

**판단**:

- **옵션 A**: 유지 (모니터링 목적)
  - 다른 Functions 헬스 체크 용도
  - 무료 티어 영향 최소

- **옵션 B**: 제거
  - Vercel에서 직접 헬스 체크 가능
  - 간단한 HTTP GET 요청으로 대체 가능

**권장**: **옵션 A (유지)** - 모니터링 유지보수 편의성

---

## 📝 정리 작업 로드맵

### Phase 1: 코드 정리 (즉시 실행 가능)

1. **resilient-ai-client.ts 정리**

   ```typescript
   // 제거할 함수들:
   - processUnifiedAIResilient (line 371-381)
   - analyzeKoreanNLPResilient (line 341-351) - 미사용
   - analyzeMLMetricsResilient (line 356-366) - 미사용
   ```

   - 영향: 없음 (코드에서 호출되지 않음)
   - 코드 라인 감소: ~40줄

2. **환경 변수 정리**

   ```bash
   # .env.local / scripts/env/validate-env.ts
   # 제거 대상:
   - NEXT_PUBLIC_GCP_UNIFIED_AI_ENDPOINT (미사용)
   ```

3. **헬스 체크 스크립트 업데이트**

   ```javascript
   // scripts/deploy/gcp-functions-health-check.js
   // gcp-functions/health/index.js

   // 제거:
   - ai-gateway 체크
   - rule-engine 체크
   - unified-ai-processor 체크
   ```

### Phase 2: GCP Functions 제거 (신중하게 진행)

**⚠️ 주의**: 실제 GCP Console에서 Function 삭제 전 확인 필요

1. **백업 생성**
   - 현재 Function 코드 아카이브 저장
   - 배포 설정 백업

2. **제거 순서**

   ```bash
   # 1단계: unified-ai-processor 제거
   gcloud functions delete unified-ai-processor --region=asia-northeast3

   # 2단계: ai-gateway 제거
   gcloud functions delete ai-gateway --region=asia-northeast3

   # 3단계: rule-engine 제거
   gcloud functions delete rule-engine --region=asia-northeast3
   ```

3. **제거 후 검증**
   - Vercel 배포 테스트
   - E2E 테스트 실행
   - 프로덕션 모니터링 (24시간)

### Phase 3: 문서 업데이트

1. **아키텍처 문서**
   - docs/architecture/ai-engine.md 업데이트
   - 현재 상태 반영

2. **README 업데이트**
   - GCP Functions 목록 최신화
   - 환경 변수 가이드 수정

---

## 💰 비용 영향 분석

### 현재 (6개 Functions)

- enhanced-korean-nlp: 무료 티어
- ml-analytics-engine: 무료 티어
- unified-ai-processor: 무료 티어 (미사용)
- ai-gateway: 무료 티어 (미사용)
- rule-engine: 무료 티어 (미사용)
- health-check: 무료 티어

### 제거 후 (2-3개 Functions)

- enhanced-korean-nlp: 무료 티어
- ml-analytics-engine: 무료 티어
- health-check: 무료 티어 (선택)

**예상 효과**:

- ✅ 무료 티어 할당량 50% 절약
- ✅ Cold start 발생 감소 (미사용 Functions 제거)
- ✅ 관리 복잡도 감소

---

## 🎯 권장 사항

### 즉시 실행 (Phase 1)

1. ✅ resilient-ai-client.ts의 미사용 함수 3개 제거
2. ✅ 환경 변수 정리
3. ✅ 헬스 체크 스크립트 업데이트

### 신중하게 진행 (Phase 2)

1. ⚠️ 1주일 후 GCP Functions 실제 제거 (백업 후)
   - unified-ai-processor
   - ai-gateway
   - rule-engine
2. ✅ 제거 후 24시간 모니터링

### 유지 (필수)

1. ✅ enhanced-korean-nlp (한국어 NLP)
2. ✅ ml-analytics-engine (ML 분석)
3. ℹ️ health-check (모니터링, 선택적)

---

## 📌 결론

**핵심 요약**:

- **유지**: 2개 (korean-nlp, ml-analytics) - Google AI로 대체 불가
- **제거**: 3개 (unified-ai, gateway, rule) - 레거시, 미사용
- **선택**: 1개 (health-check) - 모니터링 목적

**Google AI API 전환 효과**:

- ✅ unified-ai-processor 완전히 대체됨
- ✅ 라우팅 단순화 (ai-gateway 불필요)
- ✅ 무료 티어 효율성 50% 증가
- ✅ 지연 시간 감소 (중간 홉 제거)

**다음 액션**:

1. 코드 정리 (Phase 1) 즉시 실행
2. 1주일 모니터링 후 GCP Functions 제거 (Phase 2)
3. 문서 업데이트 (Phase 3)
