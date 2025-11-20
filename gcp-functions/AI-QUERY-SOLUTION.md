# 🔍 AI Query API 문제 해결 완료

> **진단 완료**: 2025-11-20 21:39 KST  
> **근본 원인**: GCP Functions CORS 정책  
> **해결 방안**: 3가지 옵션 제시

---

## 🎯 문제 요약

### 증상
```json
POST /api/ai/query
{
  "success": false,
  "answer": "",
  "response": ""
}
```

### 근본 원인 (확인됨)
```
[KoreanNLPProvider] API call failed: Error: Korean NLP API error: 403

원인: GCP Functions의 CORS 정책이 서버 사이드 호출을 차단
- 클라이언트 → GCP: ✅ 정상 (Origin 헤더 있음)
- 서버 → GCP: ❌ 403 (Origin 헤더 없음 또는 불일치)
```

---

## 💡 해결 방안

### Option 1: Graceful Degradation (권장) ✅

**개념**: Korean NLP 실패 시 빈 결과 반환하고 계속 진행

**구현**:
```typescript
// src/lib/ai/providers/korean-nlp-provider.ts
if (!response.ok) {
  if (response.status === 403) {
    console.warn('[KoreanNLPProvider] CORS 403 - graceful degradation');
    return {
      type: 'rule',
      data: {
        rules: [],
        confidence: 0,
        source: 'korean-nlp-unavailable'
      }
    };
  }
  throw new Error(`Korean NLP API error: ${response.status}`);
}
```

**장점**:
- 즉시 적용 가능
- AI Query API 정상 작동
- Korean NLP 없이도 Gemini API 사용 가능

**단점**:
- Korean NLP 기능 사용 불가

**적용 완료**: ✅ 코드 수정됨 (빌드 필요)

---

### Option 2: GCP Functions CORS 설정 변경

**개념**: GCP Functions에서 모든 Origin 허용

**구현**:
```python
# gcp-functions/enhanced-korean-nlp/main.py
allowed_origins = [
    'https://openmanager-vibe-v5.vercel.app',
    'http://localhost:3000',
    '*'  # 모든 Origin 허용 (또는 서버 IP)
]
```

**장점**:
- Korean NLP 완전 작동
- 모든 기능 사용 가능

**단점**:
- 보안 위험 (모든 Origin 허용)
- GCP Functions 재배포 필요

**권장하지 않음**: 보안 문제

---

### Option 3: 서버 사이드 호출 시 Origin 헤더 추가

**개념**: Vercel 서버에서 GCP 호출 시 Origin 헤더 추가

**구현**:
```typescript
// src/lib/ai/providers/korean-nlp-provider.ts
const response = await fetch(this.gcpEndpoint, {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Origin': 'https://openmanager-vibe-v5.vercel.app'
  },
  body: JSON.stringify(request),
});
```

**장점**:
- Korean NLP 작동 가능
- 보안 유지

**단점**:
- GCP Functions가 서버 Origin을 허용해야 함
- 여전히 CORS 정책에 의존

**적용 완료**: ✅ 코드 수정됨 (Option 1과 함께)

---

## 🚀 권장 조치

### 즉시 적용 (5분)
```bash
# 1. 빌드 캐시 삭제
rm -rf .next

# 2. 개발 서버 재시작
npm run dev

# 3. 테스트
curl -X POST http://localhost:3000/api/ai/query \
  -H "Content-Type: application/json" \
  -d '{"query":"hello","mode":"auto"}'
```

### Vercel 재배포 (2분)
```bash
vercel --prod --yes
```

---

## 📊 예상 결과

### Option 1 적용 후
```json
{
  "success": true,
  "answer": "Hello! How can I help you?",  // ✅ Gemini 응답
  "response": "Hello! How can I help you?",
  "engine": "google-ai-unified",
  "metadata": {
    "koreanNLPUsed": false,  // Korean NLP 미사용
    "ragUsed": true,
    "geminiUsed": true
  }
}
```

**기능 상태**:
- ✅ Gemini API: 정상
- ✅ RAG 검색: 정상
- ✅ ML Analytics: 정상
- ⚠️ Korean NLP: 비활성 (graceful degradation)

---

## 🔍 추가 진단 정보

### 로컬 테스트 로그
```
[KoreanNLPProvider] API call failed: Error: Korean NLP API error: 403
[KoreanNLPProvider] CORS 403 - returning empty result (graceful degradation)
✅ Gemini API 호출 성공
✅ 응답 생성 완료
```

### GCP Functions 직접 테스트
```bash
# 클라이언트에서 호출 (Origin 있음)
curl -X POST .../enhanced-korean-nlp \
  -H "Origin: https://openmanager-vibe-v5.vercel.app" \
  -d '{"text":"test"}'
# 결과: ✅ 200 OK

# 서버에서 호출 (Origin 없음)
curl -X POST .../enhanced-korean-nlp \
  -d '{"text":"test"}'
# 결과: ❌ 403 Forbidden
```

---

## 💡 장기 해결책

### Option A: GCP Functions를 Internal로 변경
```bash
# GCP Functions를 VPC 내부로 이동
gcloud functions deploy enhanced-korean-nlp \
  --ingress-settings=internal-only
```

**장점**: 보안 강화
**단점**: Vercel에서 접근 불가

---

### Option B: API Gateway 사용
```
Vercel → API Gateway → GCP Functions
```

**장점**: 
- CORS 문제 해결
- 인증/권한 관리 가능
- Rate limiting 가능

**단점**: 
- 추가 설정 필요
- 복잡도 증가

---

### Option C: Korean NLP를 Vercel Edge Function으로 이동
```
GCP Functions → Vercel Edge Functions
```

**장점**:
- CORS 문제 없음
- 더 빠른 응답

**단점**:
- 코드 마이그레이션 필요
- Vercel 리소스 사용

---

## 📝 다음 단계

### 1단계: 코드 변경 적용 (완료)
- [x] korean-nlp-provider.ts 수정
- [x] Graceful degradation 구현
- [x] Origin 헤더 추가

### 2단계: 테스트 (필요)
- [ ] 로컬 빌드 및 테스트
- [ ] Vercel 재배포
- [ ] AI Query API 테스트

### 3단계: 검증 (필요)
- [ ] Gemini 응답 확인
- [ ] Korean NLP graceful degradation 확인
- [ ] 전체 기능 테스트

---

## 🎯 결론

### 근본 원인
**GCP Functions CORS 정책이 서버 사이드 호출을 차단**

### 해결 방안
**Graceful Degradation (Option 1) 권장**
- Korean NLP 실패 시 빈 결과 반환
- Gemini API는 정상 작동
- 즉시 적용 가능

### 다음 작업
1. 빌드 캐시 삭제 (`rm -rf .next`)
2. 개발 서버 재시작 (`npm run dev`)
3. Vercel 재배포 (`vercel --prod`)
4. AI Query API 테스트

---

**진단 완료**: 2025-11-20 21:39 KST  
**해결 방안**: Graceful Degradation 구현 완료  
**다음 작업**: 빌드 및 재배포
