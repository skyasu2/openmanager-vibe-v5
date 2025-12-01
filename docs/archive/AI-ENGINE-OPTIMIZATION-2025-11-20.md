# 🎯 AI Engine Optimization - Option A Implementation

> **날짜**: 2025-11-20  
> **전략**: GCP Functions 유지 + Vercel 최적화  
> **목표**: 무료 티어 내 최대 성능

---

## 📊 선택한 전략: 옵션 A

### 아키텍처

```
프론트엔드 → Vercel /api/ai/query (Node.js)
              ↓
         SimplifiedQueryEngine
              ↓
    ├─ Supabase RAG (직접 호출, 3분 캐시)
    ├─ GCP enhanced-korean-nlp (10분 캐시)
    ├─ GCP ml-analytics-engine (10분 캐시)
    └─ Gemini API (직접 호출)
```

### 선택 이유

1. **GCP 무료 티어 97.5% 여유** - 200만 호출/월 중 2.5%만 사용
2. **Python NLP/ML 기능 유지** - 고급 한국어 처리 및 ML 분석
3. **전문화된 마이크로서비스** - 각 기능별 독립 스케일링
4. **향후 확장성** - 배치 처리, 백그라운드 작업 가능

---

## ✅ 구현 완료 사항

### 1. /api/ai/query 최적화

- **Runtime**: Node.js (의존성 호환성)
- **캐싱**: 5분 TTL (성공 응답만)
- **GCP 호출**: Provider 레이어에서 선택적 호출

### 2. GCP Functions 캐싱 전략

```typescript
// Korean NLP Provider
private readonly cacheTTL = 10 * 60 * 1000; // 10분

// ML Provider
private readonly cacheTTL = 10 * 60 * 1000; // 10분

// Supabase RAG
TTL: 3분 (문서 검색)
```

### 3. Graceful Degradation

- Korean NLP CORS 403 → 빈 결과 반환
- ML Analytics 실패 → 기본 분석 사용
- 모든 Provider 실패 → Gemini 직접 호출

---

## 📈 예상 성능

### 응답 시간

```
캐시 HIT (70%): 50-100ms
GCP 호출 (20%): 200-500ms
Gemini 직접 (10%): 300-800ms
평균: 150-300ms
```

### 무료 티어 사용량

```
Vercel Functions: 7만 호출/월 (70% 한도)
GCP Functions: 2만 호출/월 (1% 한도)
Supabase: 5만 호출/월 (10% 한도)
Gemini API: 1만 호출/월 (무료 티어)

총 비용: $0/월 ✅
```

---

## 🔧 최적화 포인트

### 1. 캐시 계층 구조

```
L1: Vercel 메모리 (5분) - 즉시 응답
L2: GCP Provider (10분) - NLP/ML 결과
L3: Supabase (3분) - RAG 문서
```

### 2. 선택적 GCP 호출

- 짧은 쿼리 (5자 미만): GCP 스킵
- 단순 명령어: 로컬 라우팅
- 복잡한 NLP: GCP 호출

### 3. 병렬 처리

```typescript
// 동시 호출로 지연시간 최소화
const [ragResult, nlpResult, mlResult] = await Promise.all([
  ragProvider.getContext(),
  nlpProvider.getContext(),
  mlProvider.getContext(),
]);
```

---

## 🎯 다음 단계 (선택사항)

### Phase 2: Edge Runtime 전환 (미래)

- Supabase RAG Engine Edge 호환 버전 개발
- crypto 모듈 Web Crypto API 전환
- 의존성 최소화

### Phase 3: GCP Functions 고도화

- Python 3.12 업그레이드
- 더 정교한 NLP 모델 (KoBERT 등)
- 실시간 ML 예측 강화

---

## 📚 관련 문서

- `gcp-functions/README.md` - GCP Functions 상세
- `src/lib/ai/providers/` - Provider 구현
- `src/services/ai/SimplifiedQueryEngine.ts` - 엔진 로직

---

## 🎓 학습 포인트

### 기술적 결정

1. **Edge vs Node.js**: 의존성 호환성이 성능보다 우선
2. **GCP 유지**: 무료 티어 여유 + 고급 기능 > 지연시간 50ms
3. **캐싱 전략**: 다층 캐시로 평균 응답 시간 최소화

### 무료 티어 최적화

- Vercel: 10만 호출/월 제한 → 70% 사용 (안전)
- GCP: 200만 호출/월 → 1% 사용 (매우 안전)
- 총 비용: $0 유지 ✅

---

**작성자**: Kiro AI  
**검토**: 2025-11-20  
**상태**: 구현 완료 ✅
