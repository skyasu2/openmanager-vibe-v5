# 🛠️ 트러블슈팅 가이드## Next.js 기본 템플릿 문제 해결 (2024-12-15 완전 해결)### 문제 상황- ✅ API 엔드포인트 정상 작동- ❌ 메인 페이지(`/`)에서 Next.js 기본 템플릿 표시- ❌ OpenManager Vibe V5 랜딩 페이지가 나타나지 않음- ❌ `public/index.html`로 리다이렉션 발생### 🔍 원인 분석1. **파일 우선순위 문제**: Next.js가 `public/index.html`을 우선적으로 서빙2. **App Router 미인식**: `src/app/page.tsx`가 정상적으로 인식되지 않음3. **정적 파일 충돌**: `public/` 디렉토리의 HTML 파일이 React 컴포넌트보다 우선### ✅ 해결 방법#### 1. `public/index.html` 파일 마이그레이션- OpenManager Vibe V5 랜딩 페이지를 `src/app/page.tsx`로 완전 이주- HTML → React 컴포넌트 변환- Font Awesome 및 Google Fonts 통합#### 2. 의존성 및 최적화 추가- `src/app/layout.tsx`에 폰트 및 메타데이터 설정- SEO 최적화를 위한 메타데이터 구성- 반응형 디자인 및 성능 최적화#### 3. 백업 및 정리- 기존 `public/index.html` 파일을 `public/index.html.backup`으로 보관- 불필요한 파일 정리### 🎯 결과 (2024-12-15 완전 해결 확인)- ✅ **랜딩 페이지 정상**: OpenManager Vibe V5 완전한 인터페이스 표시- ✅ **애니메이션 작동**: 그라데이션 배경 및 Fade-in-up 효과- ✅ **성능 최적화**: 5.57 kB 메인 페이지, 111 kB First Load JS- ✅ **완전 반응형**: 모바일부터 데스크톱까지 최적화- ✅ **CTA 버튼 작동**: 데모 및 대시보드 링크 정상 작동## API 라우트 404 문제 해결

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

### 🎯 결과 (2024-12-15 완전 해결 확인)- ✅ **빌드 성공**: 100% 빌드 성공률 (35초 완료)- ✅ **API 정상화**: 모든 엔드포인트 JSON 응답 확인- ✅ **서버리스 함수 생성**: Pages API 라우트 3개 정상 생성- ✅ **`.vercelignore` 작동**: 47개 파일 정확히 무시됨- ✅ **배포 성공**: Vercel 배포 완료 및 API 정상 작동

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