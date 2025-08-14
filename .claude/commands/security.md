---
name: security
description: 보안 취약점 자동 검사 및 수정
---

프로젝트의 보안 취약점을 자동으로 검사하고 수정 방안을 제시해주세요.

## 검사 항목

### 1. 하드코딩된 시크릿
```bash
# 검사 패턴
- API 키: /api_key\s*[:=]\s*["'][\w\-]{20,}/
- 토큰: /token\s*[:=]\s*["'][\w\-]{20,}/
- 비밀번호: /password\s*[:=]\s*["']\w+/
```

### 2. 의존성 취약점
```bash
npm audit
npm audit fix
```

### 3. 코드 보안 패턴
- SQL Injection 방지
- XSS 방지
- CSRF 방지
- 안전하지 않은 직렬화
- 경로 순회 공격

### 4. 환경변수 검증
- .env.local 파일 확인
- 필수 환경변수 체크
- 프로덕션 키 노출 방지

### 5. Supabase RLS 정책
- 모든 테이블에 RLS 활성화
- 적절한 정책 설정
- 공개/비공개 데이터 분리

## 자동 수정

### 하드코딩된 값 → 환경변수
```typescript
// Before
const apiKey = "sk-1234567890";

// After
const apiKey = process.env.API_KEY;
```

### SQL Injection 방지
```typescript
// Before
db.query(`SELECT * FROM users WHERE id = ${userId}`);

// After
db.query('SELECT * FROM users WHERE id = $1', [userId]);
```

### XSS 방지
```typescript
// Before
<div dangerouslySetInnerHTML={{__html: userInput}} />

// After
import DOMPurify from 'isomorphic-dompurify';
<div dangerouslySetInnerHTML={{__html: DOMPurify.sanitize(userInput)}} />
```

## 보안 체크리스트

- [ ] 하드코딩된 시크릿 제거
- [ ] 의존성 취약점 수정
- [ ] SQL Injection 방지
- [ ] XSS 방지
- [ ] CSRF 토큰 구현
- [ ] RLS 정책 적용
- [ ] HTTPS 강제
- [ ] 민감 정보 로깅 방지
- [ ] 에러 메시지 최소화
- [ ] 인증/인가 검증

## 실행 예시
```bash
/security

# 출력
🔒 보안 검사 시작...

⚠️ 발견된 문제:
1. src/api/payment.ts:15 - 하드코딩된 API 키
2. package.json - 3개 취약한 의존성
3. src/db/queries.ts:42 - SQL Injection 위험

✅ 자동 수정 완료:
- 3개 시크릿을 환경변수로 이동
- npm audit fix 실행
- Prepared statements 적용

📋 수동 확인 필요:
- Supabase RLS 정책 검토
- CORS 설정 확인
```