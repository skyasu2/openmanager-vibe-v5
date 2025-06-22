# 🔧 한글 인코딩 문제 재발 방지 가이드

## 📋 문제 요약

### 발견된 문제들

1. **Windows Git Bash에서 UTF-8 처리 문제**

   - 터미널 출력에서 한글 깨짐 (`CPU 뷮` 등)
   - 환경변수 LANG, LC_ALL 미설정

2. **Next.js API에서 한글 쿼리 파라미터 인코딩 이슈**

   - ArrayBuffer → UTF-8 변환 과정에서 깨짐
   - JSON 파싱 전 인코딩 처리 누락

3. **API 키 암호화/복호화 시스템 검증 필요**
   - 기존 시스템 정상 작동 확인
   - 복구 스크립트 올바른 알고리즘 적용

## 🛠️ 구현된 해결책

### 1. 한글 인코딩 유틸리티 (`src/utils/encoding-fix.ts`)

```typescript
// 핵심 기능들
- safeDecodeKorean(): 안전한 한글 디코딩
- safeProcessQuery(): 쿼리 파라미터 안전 처리
- safeKoreanLog(): 안전한 한글 로그 출력
- safeProcessRequestBody(): API 요청 본문 안전 처리
- detectAndFixTerminalEncoding(): 터미널 인코딩 자동 수정
```

### 2. 시스템 차원 적용

**OptimizedUnifiedAIEngine.ts**

```typescript
import { safeProcessQuery, safeKoreanLog } from '@/utils/encoding-fix';

// 쿼리 처리 시 안전한 한글 처리
const safeQuery = safeProcessQuery(request.query);
safeKoreanLog(`🔍 쿼리 처리 시작: "${query}"`);
```

**API 엔드포인트들**

```typescript
// 모든 API에서 안전한 요청 본문 처리
const body = await safeProcessRequestBody(request);
```

**루트 레이아웃 (layout.tsx)**

```typescript
// 시스템 시작 시 자동 인코딩 설정
if (typeof window === 'undefined') {
  detectAndFixTerminalEncoding();
}
```

### 3. 테스트 시스템

**테스트 API**: `/api/test-korean-encoding`

- GET: 기본 인코딩 상태 확인
- POST: 한글 쿼리 처리 테스트

**테스트 페이지**: `/test-korean-encoding.html`

- 종합적인 한글 인코딩 테스트 UI
- 실시간 진단 및 권장사항 제공

## 🔄 재발 방지 프로세스

### 1. 개발 시 체크리스트

- [ ] 새로운 API 엔드포인트 생성 시 `safeProcessRequestBody()` 사용
- [ ] 한글 로그 출력 시 `safeKoreanLog()` 사용
- [ ] 쿼리 처리 시 `safeProcessQuery()` 적용
- [ ] 터미널 환경변수 확인 (LANG, LC_ALL)

### 2. 테스트 절차

```bash
# 1. 한글 인코딩 기본 테스트
curl -s "http://localhost:3004/api/test-korean-encoding"

# 2. 한글 POST 요청 테스트
curl -X POST "http://localhost:3004/api/test-korean-encoding" \
  -H "Content-Type: application/json; charset=utf-8" \
  -d '{"testQuery":"메모리 사용량 분석"}'

# 3. AI 엔진 한글 처리 테스트
curl -X POST "http://localhost:3004/api/test-optimized-ai" \
  -H "Content-Type: application/json; charset=utf-8" \
  -d '{"query":"CPU 사용량","mode":"AUTO"}'
```

### 3. 환경 설정

**Windows Git Bash**

```bash
# .bashrc 또는 .bash_profile에 추가
export LANG=ko_KR.UTF-8
export LC_ALL=ko_KR.UTF-8
```

**VSCode/Cursor 터미널**

```json
// settings.json
{
  "terminal.integrated.env.windows": {
    "LANG": "ko_KR.UTF-8",
    "LC_ALL": "ko_KR.UTF-8"
  }
}
```

## 🚨 문제 발생 시 대응 방안

### 1. 즉시 진단

```bash
# 한글 인코딩 테스트 페이지 접속
http://localhost:3004/test-korean-encoding.html

# 또는 API 직접 테스트
curl -s "http://localhost:3004/api/test-korean-encoding"
```

### 2. 일반적인 문제와 해결책

**문제**: 터미널에서 한글 깨짐

```bash
# 해결책
export LANG=ko_KR.UTF-8
export LC_ALL=ko_KR.UTF-8
```

**문제**: API 응답에서 한글 깨짐

```typescript
// 해결책: safeProcessRequestBody 사용
const body = await safeProcessRequestBody(request);
```

**문제**: 로그에서 한글 깨짐

```typescript
// 해결책: safeKoreanLog 사용
safeKoreanLog(`처리 중: "${query}"`);
```

### 3. 긴급 복구

**API 키 문제 발생 시**

```bash
# 환경변수 자동 복구
node scripts/restore-env.js

# 서버 재시작
npm run dev
```

**시스템 전체 재설정**

```bash
# 1. 환경변수 복구
node scripts/restore-env.js

# 2. 터미널 인코딩 설정
export LANG=ko_KR.UTF-8
export LC_ALL=ko_KR.UTF-8

# 3. 서버 재시작
npm run dev

# 4. 테스트 실행
curl -s "http://localhost:3004/api/test-korean-encoding"
```

## 📊 모니터링 지표

### 성공 기준

- [ ] 기본 인코딩 테스트: 100% 성공
- [ ] 한글 쿼리 처리: 깨진 문자 0개
- [ ] AI 엔진 응답: 한글 정상 출력
- [ ] 터미널 로그: 한글 정상 표시

### 정기 점검

- **일일**: 개발 서버 시작 시 한글 테스트
- **주간**: 전체 시스템 한글 인코딩 검증
- **배포 전**: 프로덕션 환경 한글 처리 확인

## 🔗 관련 파일

### 핵심 파일

- `src/utils/encoding-fix.ts` - 한글 인코딩 유틸리티
- `src/app/api/test-korean-encoding/route.ts` - 테스트 API
- `public/test-korean-encoding.html` - 테스트 UI
- `scripts/restore-env.js` - 환경변수 복구

### 적용된 파일들

- `src/core/ai/OptimizedUnifiedAIEngine.ts`
- `src/app/api/test-optimized-ai/route.ts`
- `src/app/layout.tsx`

## 📚 추가 참고자료

### UTF-8 인코딩 원리

- [MDN - Character encodings](https://developer.mozilla.org/en-US/docs/Web/API/TextDecoder)
- [Node.js Buffer 문서](https://nodejs.org/api/buffer.html)

### Next.js 한글 처리

- [Next.js Internationalization](https://nextjs.org/docs/advanced-features/i18n)
- [API Routes 최적화](https://nextjs.org/docs/api-routes/introduction)

---

**작성일**: 2025-06-22  
**버전**: v1.0.0  
**상태**: ✅ 완료 및 검증됨
