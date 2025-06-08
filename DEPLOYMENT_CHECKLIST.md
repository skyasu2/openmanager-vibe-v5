# 🚀 배포 체크리스트

**최종 업데이트**: 2024-12-15  
**목적**: 안전하고 신뢰할 수 있는 배포 프로세스 보장

---

## 📋 배포 전 필수 체크리스트

### ✅ 1. 자동 검증 시스템

```bash
# 빠른 검증
npm run validate:quick

# 전체 검증 (권장)
npm run validate:all

# 안전한 배포
npm run deploy:safe
```

- [ ] **TypeScript 타입 체크**: `npm run type-check`
- [ ] **ESLint 검사**: `npm run lint`
- [ ] **테스트 실행**: `npm test`
- [ ] **빌드 성공**: `npm run build`
- [ ] **Pre-commit hooks 작동**: Git commit 시 자동 실행
- [ ] **Pre-push hooks 작동**: Git push 시 자동 실행

### ✅ 2. Vercel 연결 상태 확인 ⭐ 가장 중요

```bash
# Vercel 프로젝트 연결 확인
npx vercel env ls

# 연결 끊어진 경우 재연결
npx vercel link --yes
```

- [ ] **Vercel 프로젝트 연결**: 로컬과 Vercel 프로젝트 링크 확인
- [ ] **환경변수 존재**: 모든 필수 환경변수 설정 확인
- [ ] **vercel.json 구문**: JSON 문법 오류 없음

### ✅ 3. GitHub Actions 워크플로우

```bash
# 활성 워크플로우 확인
ls -la .github/workflows/

# 단일 워크플로우만 활성화되어야 함
# simple-deploy.yml만 존재해야 함
```

- [ ] **워크플로우 충돌 없음**: 1개 워크플로우만 활성화
- [ ] **불필요한 워크플로우**: `disabled/` 폴더로 이동
- [ ] **GitHub Secrets 설정**: 필요시 Vercel 토큰 등 설정

### ✅ 4. 기능 테스트

- [ ] **로컬 개발 서버**: `npm run dev` 정상 실행
- [ ] **주요 페이지 로딩**: 대시보드, 서버 목록 등
- [ ] **API 엔드포인트**: 주요 API 응답 확인
- [ ] **Keep-Alive 시스템**: Supabase/Redis 연결 상태

### ✅ 5. 보안 검토

- [ ] **환경변수 노출**: .env 파일 Git 추적 제외
- [ ] **API 키 보안**: 민감한 정보 환경변수 처리
- [ ] **CORS 설정**: API 접근 권한 적절히 설정
- [ ] **보안 헤더**: vercel.json 보안 헤더 설정

### ✅ 6. 성능 검토

- [ ] **번들 크기**: 큰 의존성 추가 여부 확인
- [ ] **이미지 최적화**: Next.js Image 컴포넌트 사용
- [ ] **코드 분할**: 동적 import 적절히 활용
- [ ] **캐싱 전략**: Redis 캐싱 효과적 활용

---

## 🚨 배포 실패 대응 매뉴얼

### 🎯 가장 흔한 배포 실패 원인과 해결법

#### **1. Vercel 프로젝트 연결 끊어짐** ⭐ 가장 흔한 원인

**증상**:

```
Error: Your codebase isn't linked to a project on Vercel
```

**해결법**:

```bash
npx vercel link --yes
# 프로젝트 선택: skyasus-projects/openmanager-vibe-v5
```

#### **2. GitHub Actions 워크플로우 충돌**

**증상**: 여러 워크플로우가 동시 실행되며 충돌

**해결법**:

```bash
# 불필요한 워크플로우 비활성화
mkdir -p .github/workflows/disabled
mv .github/workflows/복잡한파일.yml .github/workflows/disabled/

# simple-deploy.yml만 남기기
```

#### **3. vercel.json 구문 오류**

**증상**:

```
Error: Environment Variable "CRON_SECRET" references Secret "cron-secret"
```

**해결법**:

- CRON 관련 설정 제거
- JSON 구문 검증: [jsonlint.com](https://jsonlint.com)

#### **4. 일반적인 빌드 오류**

**타입 에러**:

```bash
npm run type-check
# 에러 수정 후 재시도
```

**ESLint 에러**:

```bash
npm run lint -- --fix
# 자동 수정 불가능한 경우 수동 수정
```

**테스트 실패**:

```bash
npm test
# 실패한 테스트 케이스 확인 및 수정
```

**빌드 에러**:

```bash
npm run build
# 에러 메시지 확인 후 관련 파일 수정
```

---

## 🔄 배포 후 검증 절차

### ✅ 1. 즉시 확인 (배포 후 5분 이내)

- [ ] **사이트 접근**: 프로덕션 URL 정상 로딩
- [ ] **기본 기능**: 메인 페이지, 네비게이션 동작
- [ ] **API 상태**: 주요 API 엔드포인트 응답 확인
- [ ] **콘솔 에러**: 브라우저 개발자 도구 에러 없음

### ✅ 2. 상세 확인 (배포 후 30분 이내)

- [ ] **Keep-Alive 시스템**: `/api/health` 엔드포인트 확인
- [ ] **데이터베이스 연결**: Supabase 연결 상태
- [ ] **캐시 시스템**: Redis 연결 상태
- [ ] **모니터링**: 에러 로그 없음

### ✅ 3. 장기 모니터링 (배포 후 24시간)

- [ ] **성능 지표**: 응답 시간, 메모리 사용량
- [ ] **에러율**: 4xx/5xx 에러 발생률
- [ ] **사용자 피드백**: 실제 사용자 문제 보고 없음

---

## 🛠️ 긴급 롤백 절차

### 🚨 긴급 상황 대응

1. **즉시 롤백**:

   ```bash
   # Vercel 대시보드에서 이전 배포로 롤백
   # 또는 Git에서 이전 커밋으로 되돌리기
   git revert HEAD
   git push
   ```

2. **문제 분석**:

   - Vercel 배포 로그 확인
   - GitHub Actions 로그 확인
   - 브라우저 네트워크 탭 확인

3. **수정 및 재배포**:
   - 문제 원인 수정
   - 로컬에서 검증
   - 체크리스트 재확인 후 배포

---

## 📊 배포 성공 지표

### ✅ 성공 기준

- **빌드 시간**: 5분 이내
- **배포 완료**: 10분 이내
- **사이트 응답**: 2초 이내 첫 페이지 로딩
- **에러율**: 1% 미만
- **가용성**: 99.9% 이상

### 📈 모니터링 도구

- **Vercel Analytics**: 성능 및 사용량 모니터링
- **Browser DevTools**: 클라이언트 사이드 성능
- **GitHub Actions**: CI/CD 파이프라인 상태
- **Supabase Dashboard**: 데이터베이스 상태

---

## 📞 문제 발생 시 연락처

### 🆘 에스컬레이션 프로세스

1. **Level 1**: 개발팀 내 자체 해결 시도
2. **Level 2**: 시니어 개발자 또는 DevOps 엔지니어
3. **Level 3**: 외부 전문가 또는 벤더 지원

### 📋 보고 템플릿

```
배포 실패 보고

- 발생 시간:
- 브랜치:
- 커밋 SHA:
- 에러 메시지:
- 재현 단계:
- 영향 범위:
- 시도한 해결 방법:
```

---

**💡 팁**: 배포 전 반드시 `npx vercel link --yes`로 연결 상태를 확인하세요!
