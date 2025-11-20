# 🔍 AI Query API 로컬 디버깅 가이드

> **작성일**: 2025-11-20 21:26 KST  
> **목적**: AI Query API 빈 응답 문제 로컬 디버깅  
> **예상 소요 시간**: 10분

---

## 🎯 목표

AI Query API가 빈 응답을 반환하는 문제의 정확한 원인을 파악합니다.

### 현재 상태
```json
POST /api/ai/query
{
  "success": false,
  "answer": "",  // ❌ 비어있음
  "response": "",
  "engine": "google-ai-unified"
}
```

### 확인된 사실
- ✅ Gemini API 정상 작동 (gemini-2.5-flash-lite)
- ✅ GCP Functions 정상 (5/5 ACTIVE)
- ✅ 코드 로직 정상
- ❌ 실제 응답이 비어있음

---

## 🚀 디버깅 단계

### 1단계: 로컬 개발 서버 시작 (1분)

```bash
cd /mnt/d/cursor/openmanager-vibe-v5
npm run dev
```

**예상 출력**:
```
✓ Ready in 3.2s
○ Local: http://localhost:3000
```

---

### 2단계: 브라우저에서 테스트 (2분)

1. **브라우저 열기**
   ```
   http://localhost:3000/main
   ```

2. **개발자 도구 열기**
   - Chrome: `F12` 또는 `Ctrl+Shift+I`
   - Console 탭 선택

3. **AI 쿼리 입력**
   - 입력창에 "hello" 입력
   - 전송 버튼 클릭

---

### 3단계: 콘솔 로그 확인 (5분)

#### 확인할 로그들

##### A. Gemini API 호출 전
```javascript
🚀 [Google AI] 요청 시작: {
  model: 'gemini-2.5-flash-lite',
  query: 'hello',
  temperature: 0.7,
  maxTokens: 1000,
  timeout: 8000,
  promptLength: ???  // ⚠️ 이 값 확인!
}
```

**체크포인트**:
- [ ] `promptLength`가 0이 아닌가?
- [ ] `model`이 'gemini-2.5-flash-lite'인가?

##### B. Gemini API 응답
```javascript
📊 [Google AI] 응답 상태: {
  success: true/false,  // ⚠️ 이 값 확인!
  error: null/string,   // ⚠️ 에러 메시지 확인!
  responseTime: ???,
  contentLength: ???    // ⚠️ 이 값 확인!
}
```

**체크포인트**:
- [ ] `success`가 true인가?
- [ ] `error`가 null인가?
- [ ] `contentLength`가 0보다 큰가?

##### C. 에러 로그
```javascript
❌ [Google AI] 상세 에러: {
  error: '???',  // ⚠️ 에러 메시지 확인!
  model: 'gemini-2.5-flash-lite',
  query: 'hello',
  promptLength: ???
}
```

---

### 4단계: 터미널 로그 확인 (2분)

개발 서버를 실행한 터미널에서 다음 로그를 찾습니다:

```bash
# 성공 케이스
✅ DirectGoogleAIService: 성공 {
  responseTime: 1234,
  contentLength: 567,
  model: 'gemini-2.5-flash-lite'
}

# 실패 케이스
❌ DirectGoogleAIService: 실패 {
  error: '???',  // ⚠️ 이 메시지 확인!
  responseTime: 1234,
  model: 'gemini-2.5-flash-lite'
}
```

---

## 🔍 예상 원인별 진단

### Case 1: promptLength가 0
**증상**: 프롬프트가 비어있음

**원인**:
- Context collection 실패
- Prompt generation 로직 오류

**해결**:
```typescript
// src/services/ai/SimplifiedQueryEngine.processors.googleai.ts
// Line ~250 근처에 로그 추가
console.log('🔍 [DEBUG] Prompt 생성:', {
  promptLength: prompt.length,
  promptPreview: prompt.substring(0, 200)
});
```

---

### Case 2: Gemini API success: false
**증상**: API 호출은 되지만 실패

**원인**:
- Rate limit 초과
- API 키 문제
- 모델 이름 오류

**해결**:
1. Rate limit 확인: https://ai.dev/usage?tab=rate-limit
2. API 키 확인: `.env.local`의 `GEMINI_API_KEY_PRIMARY`
3. 모델 이름 확인: `gemini-2.5-flash-lite`

---

### Case 3: contentLength가 0
**증상**: API는 성공하지만 응답이 비어있음

**원인**:
- Gemini가 빈 응답 반환
- 응답 파싱 실패

**해결**:
```typescript
// src/services/ai/DirectGoogleAIService.ts
// Line ~220 근처에 로그 추가
console.log('🔍 [DEBUG] Gemini 원본 응답:', {
  hasResponse: !!result.response,
  text: result.response.text(),
  textLength: result.response.text().length
});
```

---

### Case 4: 에러가 catch되지 않음
**증상**: 에러 로그가 없음

**원인**:
- Promise rejection
- Undefined 접근
- Silent failure

**해결**:
```typescript
// 모든 async 함수에 try-catch 추가
try {
  const result = await someAsyncFunction();
  console.log('✅ Success:', result);
} catch (error) {
  console.error('❌ Error:', error);
  throw error;
}
```

---

## 📝 디버깅 체크리스트

### 브라우저 콘솔
- [ ] "🚀 [Google AI] 요청 시작" 로그 확인
- [ ] `promptLength` 값 확인 (0이 아니어야 함)
- [ ] "📊 [Google AI] 응답 상태" 로그 확인
- [ ] `success` 값 확인 (true여야 함)
- [ ] `contentLength` 값 확인 (0보다 커야 함)
- [ ] 에러 메시지 확인 (있다면 복사)

### 터미널
- [ ] "✅ DirectGoogleAIService: 성공" 로그 확인
- [ ] 또는 "❌ DirectGoogleAIService: 실패" 로그 확인
- [ ] 에러 메시지 확인 (있다면 복사)

### 네트워크 탭
- [ ] `/api/ai/query` 요청 확인
- [ ] 응답 상태 코드 확인 (200이어야 함)
- [ ] 응답 본문 확인

---

## 🚨 발견한 문제 보고 방법

### 1. 로그 복사
브라우저 콘솔과 터미널의 모든 관련 로그를 복사합니다.

### 2. 스크린샷
- 브라우저 콘솔 전체
- 터미널 로그
- 네트워크 탭 (필요 시)

### 3. 정보 정리
```markdown
## 발견한 문제

### 증상
- [ ] promptLength가 0
- [ ] Gemini API success: false
- [ ] contentLength가 0
- [ ] 에러 메시지: "???"

### 로그
```
(여기에 로그 붙여넣기)
```

### 환경
- OS: Windows 11 + WSL2
- Node: 22.21.1
- Browser: Chrome/Edge
```

---

## 🔧 추가 디버깅 도구

### 1. Gemini API 직접 테스트
```bash
node test-gemini-lite.js
```

**예상 출력**:
```
🧪 Testing gemini-2.5-flash-lite...
✅ Response: Hello there! How can I help you today?
```

### 2. GCP Functions 직접 테스트
```bash
curl -X POST https://asia-northeast3-openmanager-free-tier.cloudfunctions.net/ml-analytics-engine \
  -H "Content-Type: application/json" \
  -d '{"metrics":[{"cpu":80}]}'
```

### 3. Vercel 로그 확인
```bash
vercel logs https://openmanager-vibe-v5.vercel.app --follow
```

---

## 💡 빠른 해결 팁

### 문제: "Rate limit exceeded"
**해결**: 53초 대기 후 재시도

### 문제: "API key not found"
**해결**: `.env.local` 파일 확인

### 문제: "Model not found"
**해결**: 모델 이름 확인 (`gemini-2.5-flash-lite`)

### 문제: "Timeout"
**해결**: 타임아웃 설정 확인 (8초)

---

## 📊 성공 기준

### 정상 작동 시 로그
```javascript
// 브라우저 콘솔
🚀 [Google AI] 요청 시작: { promptLength: 1234 }
📊 [Google AI] 응답 상태: { success: true, contentLength: 567 }

// 터미널
✅ DirectGoogleAIService: 성공 { contentLength: 567 }

// API 응답
{
  "success": true,
  "answer": "Hello! How can I help you?",
  "response": "Hello! How can I help you?",
  "engine": "google-ai-unified"
}
```

---

## 🎯 다음 단계

### 문제 발견 시
1. 로그 및 스크린샷 수집
2. 원인 분석
3. 코드 수정
4. 재테스트
5. Vercel 재배포

### 문제 미발견 시
1. 추가 로깅 구현
2. 단계별 디버깅
3. Vercel 환경 변수 확인

---

**작성자**: Kiro AI  
**업데이트**: 2025-11-20 21:26 KST  
**예상 소요 시간**: 10분  
**난이도**: 중급
