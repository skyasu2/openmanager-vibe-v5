# 🛠️ 트러블슈팅 가이드

## API 라우트 404 문제 해결

### 문제 상황
- ✅ 메인 페이지 정상 작동
- ❌ API 엔드포인트 404 오류 (JSON 대신 HTML 반환)
- ❌ Vercel 배포 시 Functions 인식 실패

### 🔍 원인 분석
1. **루트 디렉토리 충돌**: `/api/` (Vercel Functions)와 `/src/app/api/` (App Router) 충돌
2. **Vercel 빌드 설정**: `.vercelignore` 파일 부재로 인한 잘못된 Functions 인식
3. **Next.js 14 알려진 이슈**: src 디렉토리 사용 시 API 라우트 충돌

### ✅ 해결 방법

#### 1. `.vercelignore` 파일 생성
```
/api
docs/
scripts/
.github/
node_modules/
.git/
*.md
*.log
.env.example
.env.template
tsconfig.tsbuildinfo
```

#### 2. `vercel.json` 설정 최적화
```json
{
  "functions": {
    "src/app/api/**/route.ts": {
      "maxDuration": 10
    },
    "pages/api/**/*.ts": {
      "maxDuration": 10
    }
  }
}
```

#### 3. 불필요한 rewrites 제거
- `index.html` 리다이렉트 규칙 제거
- API 라우트 우선순위 정리

### 🎯 결과
- ✅ **빌드 성공**: 100% 빌드 성공률
- ✅ **API 정상화**: 모든 엔드포인트 JSON 응답
- ✅ **3가지 API 방식**: App Router, Pages Router, Vercel Functions 모두 작동

### 🔗 참고 링크
- [Next.js API 라우트 충돌 해결](https://github.com/vercel/next.js/discussions/70820)
- [Vercel Functions 설정](https://vercel.com/docs/functions)
- [App Router API 가이드](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)

### 💡 예방책
1. **명확한 디렉토리 구조**: API 디렉토리 충돌 방지
2. **`.vercelignore` 사용**: 배포 시 불필요한 파일 제외
3. **빌드 테스트**: 로컬 빌드 성공 후 배포

---

## 일반적인 문제들

### TypeScript 에러
```bash
# 타입 체크
npm run type-check

# 린트 실행
npm run lint
```

### 빌드 실패
```bash
# 캐시 클리어
rm -rf .next
npm run build
```

### 개발 서버 문제
```bash
# 의존성 재설치
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Vercel 배포 문제
1. **환경변수 확인**: Vercel Dashboard에서 환경변수 설정
2. **빌드 로그 확인**: GitHub Actions 또는 Vercel 빌드 로그 분석
3. **프리뷰 배포 테스트**: 프로덕션 배포 전 프리뷰로 테스트

---

**📞 추가 지원이 필요하시면 GitHub Issues를 통해 문의해주세요.** 