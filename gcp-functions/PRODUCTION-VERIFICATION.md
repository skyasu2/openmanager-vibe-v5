# ✅ 프로덕션 환경 검증 가이드

> **작성**: 2025-11-20 22:12 KST  
> **환경**: Vercel + Supabase + GCP + Google AI API  
> **목적**: 클라우드 환경에서 실제 동작 확인

---

## 🎯 검증 필요성

### WSL 로컬 환경의 한계
```
❌ Vercel 서버리스 환경과 다름
❌ Supabase 클라우드 연결 제한
❌ GCP Functions 네트워크 환경 차이
❌ Google AI API 할당량 별도

✅ 실제 동작은 프로덕션에서만 확인 가능
```

---

## 🔍 프로덕션 검증 방법

### 1. 브라우저에서 직접 테스트 (권장)

#### Step 1: 프로덕션 접속
```
https://openmanager-vibe-v5.vercel.app/main
```

#### Step 2: 개발자 도구 열기
- Chrome: `F12` 또는 `Ctrl+Shift+I`
- Console 탭 선택

#### Step 3: AI 쿼리 테스트
1. 입력창에 "hello" 입력
2. 전송 버튼 클릭
3. Console 로그 확인

#### Step 4: 확인할 로그
```javascript
// 성공 케이스
✅ [Google AI] 요청 시작
✅ [Google AI] 응답 상태: { success: true }
✅ DirectGoogleAIService: 성공

// 실패 케이스
❌ [Google AI] 상세 에러
❌ Korean NLP API error: 403
```

---

### 2. Vercel 로그 확인

#### 실시간 로그 보기
```bash
vercel logs https://openmanager-vibe-v5.vercel.app --follow
```

#### 특정 시간대 로그
```bash
vercel logs --since 10m | grep -i "error\|gemini\|ai"
```

#### 확인할 내용
- Gemini API 호출 성공/실패
- Korean NLP CORS 경고 (정상)
- 에러 메시지
- 응답 시간

---

### 3. GCP Functions 로그 확인

```bash
# Korean NLP 로그
gcloud functions logs read enhanced-korean-nlp \
  --project=openmanager-free-tier \
  --limit=50

# ML Analytics 로그
gcloud functions logs read ml-analytics-engine \
  --project=openmanager-free-tier \
  --limit=50
```

---

## 📊 현재 상태 (2025-11-20 22:12)

### GCP Functions
```
✅ 6/6 ACTIVE
✅ 모든 엔드포인트 응답
✅ 직접 테스트 통과
```

### Vercel 배포
```
✅ 프로덕션 배포 완료
✅ TypeScript 오류 0개
✅ 빌드 성공
```

### AI Query API
```
⚠️ 빈 응답 반환
⏳ 프로덕션 환경에서 검증 필요
```

---

## 🧪 프로덕션 테스트 체크리스트

### 기본 기능
- [ ] 대시보드 로딩 확인
- [ ] 서버 목록 표시 확인
- [ ] 메트릭 차트 표시 확인

### AI 기능
- [ ] AI 쿼리 입력창 표시
- [ ] 쿼리 전송 가능
- [ ] 응답 표시 (빈 응답이라도 UI 정상)
- [ ] 에러 메시지 표시 (있다면)

### 브라우저 콘솔
- [ ] Gemini API 호출 로그 확인
- [ ] Korean NLP 경고 확인 (정상)
- [ ] 에러 메시지 확인
- [ ] 네트워크 탭에서 API 응답 확인

---

## 💡 예상 시나리오

### Scenario 1: Gemini API 정상 작동
```javascript
// Console 로그
✅ [Google AI] 요청 시작
✅ [Google AI] 응답 상태: { success: true, contentLength: 567 }

// API 응답
{
  "success": true,
  "answer": "Hello! How can I help you?",
  "engine": "google-ai-unified"
}
```

**결과**: ✅ 모든 기능 정상

---

### Scenario 2: Gemini API Rate Limit
```javascript
// Console 로그
❌ [Google AI] 상세 에러: { error: "429 Too Many Requests" }

// API 응답
{
  "success": false,
  "answer": "",
  "error": "Rate limit exceeded"
}
```

**해결**: 53초 대기 후 재시도

---

### Scenario 3: Korean NLP CORS (정상)
```javascript
// Console 로그
⚠️ [KoreanNLPProvider] CORS 403 - graceful degradation
✅ [Google AI] 요청 시작 (Korean NLP 없이 진행)
```

**결과**: ✅ Graceful degradation 정상 작동

---

### Scenario 4: 프롬프트 생성 실패
```javascript
// Console 로그
❌ Prompt generation failed
❌ Empty prompt

// API 응답
{
  "success": false,
  "answer": "",
  "error": "Empty prompt"
}
```

**해결**: 코드 수정 필요

---

## 🔧 문제 발견 시 조치

### 1. Gemini API 오류
```bash
# API 키 확인
vercel env ls | grep GEMINI

# 할당량 확인
https://ai.dev/usage?tab=rate-limit
```

### 2. 네트워크 오류
```bash
# GCP Functions 상태 확인
gcloud functions list --project=openmanager-free-tier

# 엔드포인트 테스트
curl https://asia-northeast3-openmanager-free-tier.cloudfunctions.net/health-check
```

### 3. 환경 변수 누락
```bash
# Vercel 환경 변수 확인
vercel env ls

# 필요한 변수
- GEMINI_API_KEY_PRIMARY
- GEMINI_API_KEY_SECONDARY
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
```

---

## 📈 성공 기준

### 최소 요구사항 (현재 달성)
- ✅ GCP Functions 100% 가용성
- ✅ 대시보드 기본 기능 작동
- ✅ 에러 없이 페이지 로딩

### 이상적 목표 (검증 필요)
- ⏳ AI Query 정상 응답
- ⏳ Gemini API 성공
- ⏳ 모든 기능 완전 작동

---

## 🎯 검증 결과 기록

### 테스트 일시
```
날짜: 2025-11-20
시간: 22:12 KST
환경: Vercel Production
```

### 테스트 항목
```
[ ] 대시보드 로딩
[ ] AI 쿼리 입력
[ ] 브라우저 콘솔 로그
[ ] Vercel 로그
[ ] GCP Functions 로그
```

### 발견된 문제
```
(프로덕션 테스트 후 기록)
```

### 해결 방안
```
(문제 발견 시 기록)
```

---

## 💡 권장 사항

### 즉시 실행
1. **브라우저에서 프로덕션 테스트**
   - https://openmanager-vibe-v5.vercel.app/main
   - 개발자 도구 Console 확인
   - AI 쿼리 입력 및 응답 확인

2. **Vercel 로그 확인**
   ```bash
   vercel logs --follow
   ```

### 문제 발견 시
1. 브라우저 콘솔 로그 복사
2. Vercel 로그 복사
3. 에러 메시지 분석
4. 필요 시 코드 수정

### 정상 작동 시
1. 테스트 결과 문서화
2. 사용자 가이드 작성
3. 프로젝트 완료 선언

---

## 📝 결론

### WSL 로컬 환경
```
❌ 클라우드 서비스 완전 재현 불가
❌ 네트워크 환경 차이
❌ 인증/권한 차이

✅ 코드 작성 및 타입 체크만 가능
```

### Vercel 프로덕션 환경
```
✅ 실제 Supabase 연결
✅ 실제 GCP Functions 호출
✅ 실제 Gemini API 사용
✅ 실제 네트워크 환경

✅ 유일한 완전 검증 방법
```

### 다음 단계
**프로덕션 환경에서 직접 테스트 필수**
- 브라우저 개발자 도구 사용
- Vercel 로그 확인
- 실제 동작 검증

---

**작성**: 2025-11-20 22:12 KST  
**환경**: Vercel Production  
**상태**: 검증 대기 중  
**방법**: 브라우저 직접 테스트 권장
