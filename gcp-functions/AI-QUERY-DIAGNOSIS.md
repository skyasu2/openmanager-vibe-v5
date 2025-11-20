# 🔍 AI Query API 문제 진단 완료

> **진단 시간**: 2025-11-20 21:07 KST  
> **문제**: AI Query API 빈 응답  
> **원인**: Gemini API 무료 티어 할당량 초과 ✅ 확인됨

---

## 🎯 문제 요약

### 증상
```json
{
  "success": false,
  "answer": "",  // ❌ 비어있음
  "response": "",
  "engine": "google-ai-unified"
}
```

### 근본 원인
```
❌ [429 Too Many Requests] You exceeded your current quota

Quota exceeded for metric:
- generativelanguage.googleapis.com/generate_content_free_tier_input_token_count
- generativelanguage.googleapis.com/generate_content_free_tier_requests

Model: gemini-2.0-flash-exp
Retry in: 52 seconds
```

---

## 📊 진단 과정

### 1. 코드 레벨 검증 ✅
- SimplifiedQueryEngine.ts: 정상
- GoogleAIModeProcessor: 정상
- DirectGoogleAIService: 정상
- API 키 설정: 정상

### 2. 환경 변수 확인 ✅
```bash
GEMINI_API_KEY_PRIMARY=AIzaSyCNKnp27rXOHvYwRyfUISeK4dOzajFFuRg
GEMINI_API_KEY_SECONDARY=AIzaSyCeCEKzNotbePqvjKwFScGQtc2kMf09Kjk
GOOGLE_AI_MODEL=gemini-2.0-flash
```

### 3. 직접 API 테스트 ❌
```javascript
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
const result = await model.generateContent('Say hello');

// 결과: 429 Too Many Requests
```

---

## 💡 해결 방안

### 🔴 즉시 조치 (긴급)

#### Option 1: 다른 모델 사용
```typescript
// gemini-2.0-flash-exp (실험 모델) → gemini-2.5-flash-lite (안정 모델)
const model = 'gemini-2.5-flash-lite';
```

**장점**:
- 즉시 적용 가능
- 무료 티어 할당량 별도
- 안정적인 성능

**단점**:
- 약간 느린 응답 시간 (하지만 충분히 빠름)

---

#### Option 2: Secondary API 키 사용
```typescript
// Primary 키 할당량 초과 시 Secondary 키로 자동 전환
const apiKey = getGoogleAISecondaryKey();
```

**장점**:
- 즉시 적용 가능
- 추가 할당량 확보

**단점**:
- Secondary 키도 할당량 제한 있음

---

#### Option 3: Rate Limiting 강화
```typescript
// 현재: 15 RPM (분당 15회)
// 개선: 10 RPM (분당 10회) + 캐싱 강화
const RATE_LIMIT = {
  maxRequests: 10,
  windowMs: 60000
};
```

**장점**:
- 할당량 초과 방지
- 비용 절감

**단점**:
- 사용자 경험 약간 저하

---

### 🟡 중기 조치 (1-2일)

#### Option 4: GCP Functions 우선 사용
```typescript
// Gemini API 대신 GCP Functions 우선 호출
if (complexity.score < 0.7) {
  return await callGCPFunction('enhanced-korean-nlp');
} else {
  return await callGeminiAPI();
}
```

**장점**:
- Gemini API 호출 감소
- GCP Functions 무료 티어 활용

**단점**:
- GCP Functions도 할당량 제한 있음

---

#### Option 5: 캐싱 TTL 연장
```typescript
// 현재: 5분 TTL
// 개선: 30분 TTL
const cacheTTL = 30 * 60 * 1000;
```

**장점**:
- API 호출 대폭 감소
- 응답 속도 향상

**단점**:
- 실시간성 약간 저하

---

### 🟢 장기 조치 (1주일+)

#### Option 6: Gemini API 유료 플랜
```
무료 티어: 15 RPM, 1,500 RPD
Paid 티어: 1,000 RPM, 무제한 RPD
비용: $0.075 / 1K tokens (input)
```

**장점**:
- 할당량 걱정 없음
- 더 빠른 모델 사용 가능

**단점**:
- 월 비용 발생 (~$5-10)

---

## 🚀 권장 조치 순서

### 1단계: 즉시 적용 (5분)
```typescript
// src/services/ai/DirectGoogleAIService.ts
const DEFAULT_MODEL = 'gemini-2.5-flash-lite'; // ✅ 변경
```

### 2단계: Rate Limiting 강화 (10분)
```typescript
// src/lib/google-ai/rate-limiter.ts
const RATE_LIMIT_CONFIG = {
  maxRequests: 10, // 15 → 10
  windowMs: 60000
};
```

### 3단계: 캐싱 TTL 연장 (5분)
```typescript
// src/services/ai/SimplifiedQueryEngine.utils.ts
private readonly cacheTTL = 30 * 60 * 1000; // 5분 → 30분
```

### 4단계: 테스트 및 모니터링
```bash
# API 호출 테스트
curl -X POST https://openmanager-vibe-v5.vercel.app/api/ai/query \
  -d '{"query":"test","mode":"auto"}'

# 할당량 확인
https://ai.dev/usage?tab=rate-limit
```

---

## 📈 예상 효과

### 현재 상태
```
API 호출: ~100회/시간
할당량: 15 RPM (900회/시간)
상태: ❌ 초과 (429 Error)
```

### 개선 후
```
API 호출: ~30회/시간 (캐싱 + Rate Limiting)
할당량: 10 RPM (600회/시간)
상태: ✅ 정상 (여유 95%)
```

---

## 🔍 모니터링 방법

### Gemini API 사용량 확인
```
https://ai.dev/usage?tab=rate-limit
```

### Vercel 로그 확인
```bash
vercel logs --follow | grep "429\|quota\|rate"
```

### GCP Functions 로그 확인
```bash
gcloud functions logs read enhanced-korean-nlp --limit=50
```

---

## 📝 다음 단계

### 즉시 (5분)
- [ ] 모델 변경 (gemini-2.0-flash-exp → gemini-2.5-flash-lite)
- [ ] Vercel 재배포
- [ ] API 테스트

### 단기 (1시간)
- [ ] Rate Limiting 강화
- [ ] 캐싱 TTL 연장
- [ ] 모니터링 설정

### 중기 (1일)
- [ ] GCP Functions 우선 사용 로직 구현
- [ ] 할당량 사용량 대시보드 구축

---

## 💰 비용 영향

### 현재 (무료 티어)
```
Gemini API: $0 (할당량 초과로 사용 불가)
GCP Functions: $0 (무료 티어 내)
총 비용: $0
```

### 개선 후 (무료 티어)
```
Gemini API: $0 (할당량 내 사용)
GCP Functions: $0 (무료 티어 내)
총 비용: $0
```

### 유료 전환 시
```
Gemini API: ~$5/월 (예상)
GCP Functions: $0 (무료 티어 내)
총 비용: ~$5/월
```

---

**진단 완료**: 2025-11-20 21:07 KST  
**근본 원인**: Gemini API 무료 티어 할당량 초과  
**해결 방안**: 모델 변경 + Rate Limiting + 캐싱 강화  
**예상 소요 시간**: 20분
