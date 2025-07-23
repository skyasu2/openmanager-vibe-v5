# GitHub OAuth 무한 리다이렉트 문제 해결 요약

## 🎯 근본 원인

Gemini CLI와 분석한 결과, **`supabase-ssr.ts`의 쿠키 처리 방식**이 문제였습니다:

- `request.cookies.set()`을 호출했지만, Next.js의 `NextRequest` 쿠키는 **읽기 전용**
- 결과적으로 Supabase 세션 쿠키가 브라우저에 전달되지 않음
- 미들웨어에서 항상 세션이 없다고 판단하여 무한 리다이렉트 발생

## 🔧 해결 방법

### 1. `supabase-ssr.ts` 수정

```typescript
// ❌ 잘못된 방법
request.cookies.set({ name, value, ...options }); // 읽기 전용이라 무시됨
response.cookies.set({ name, value, ...options });

// ✅ 올바른 방법
response.cookies.set({ name, value, ...options }); // response에만 설정
```

### 2. 미들웨어 단순화

- 불필요한 OAuth 콜백 체크 로직 제거
- `config.matcher`로 제외 경로를 명확히 지정
- 복잡한 referer 체크 제거

## 📊 변경사항

1. **`src/lib/supabase-ssr.ts`**
   - `set()` 함수: `request.cookies.set()` 제거
   - `remove()` 함수: `request.cookies.set()` 제거

2. **`src/middleware.ts`**
   - OAuth 콜백 대기 로직 제거
   - referer 체크 로직 제거
   - matcher에 제외 경로 추가

## ✅ 기대 효과

- OAuth 인증 후 세션 쿠키가 정상적으로 브라우저에 저장됨
- 다음 요청 시 미들웨어가 세션을 올바르게 인식
- 무한 리다이렉트 문제 해결
