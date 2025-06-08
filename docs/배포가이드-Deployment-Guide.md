# 🚀 배포가이드 - Deployment Guide

> **OpenManager Vibe v5 안전하고 신뢰할 수 있는 배포 프로세스**  
> Vercel + GitHub Actions를 통한 완전 자동화된 배포 시스템

## 📋 배포 전 필수 체크리스트 - Pre-Deployment Checklist

### ✅ 1. 자동 검증 시스템 - Automated Validation

```bash
# 빠른 검증 (2분)
npm run validate:quick

# 전체 검증 (5분) - 권장
npm run validate:all

# 안전한 배포 (검증 후 자동 배포)
npm run deploy:safe
```

**필수 검증 항목**:
- [ ] **TypeScript 타입 체크**: `npm run type-check`
- [ ] **ESLint 검사**: `npm run lint`
- [ ] **단위 테스트**: `npm run test:unit`
- [ ] **빌드 성공**: `npm run build`
- [ ] **E2E 테스트**: `npm run test:e2e` (선택사항)

### ✅ 2. Vercel 연결 상태 확인 - Vercel Connection Status

```bash
# Vercel 프로젝트 연결 확인
vercel env ls

# 연결 끊어진 경우 재연결
vercel link --yes
# 프로젝트 선택: skyasus-projects/openmanager-vibe-v5
```

**확인 사항**:
- [ ] **Vercel 프로젝트 연결**: 로컬과 Vercel 프로젝트 링크 활성
- [ ] **환경변수 설정**: 모든 필수 환경변수 존재 확인
- [ ] **vercel.json 유효성**: JSON 문법 오류 없음
- [ ] **빌드 설정**: Next.js 빌드 명령어 올바름

### ✅ 3. GitHub Actions 워크플로우 - CI/CD Pipeline

```bash
# 활성 워크플로우 확인
ls -la .github/workflows/

# 권장: simple-deploy.yml만 활성화
# 기타 워크플로우는 disabled/ 폴더로 이동
```

**확인 사항**:
- [ ] **워크플로우 충돌 없음**: 1개 워크플로우만 활성화
- [ ] **GitHub Secrets**: 필요시 VERCEL_TOKEN 등 설정
- [ ] **브랜치 전략**: main 브랜치 자동 배포 활성화
- [ ] **빌드 캐시**: 의존성 캐싱 최적화

### ✅ 4. 환경변수 검증 - Environment Variables

```bash
# 로컬 환경변수 확인
cat .env.local

# Vercel 환경변수 확인
vercel env ls

# 환경변수 추가 (필요시)
vercel env add VARIABLE_NAME
```

**필수 환경변수**:
- [ ] **NEXT_PUBLIC_SUPABASE_URL**: Supabase 프로젝트 URL
- [ ] **NEXT_PUBLIC_SUPABASE_ANON_KEY**: Supabase 익명 키
- [ ] **SUPABASE_SERVICE_ROLE_KEY**: Supabase 서비스 키
- [ ] **KV_REST_API_URL**: Upstash Redis URL
- [ ] **KV_REST_API_TOKEN**: Upstash Redis 토큰

---

## 🔄 배포 프로세스 - Deployment Process

### 🚀 자동 배포 (권장) - Automated Deployment

```bash
# 1. 개발 브랜치에서 작업
git checkout develop
git add .
git commit -m "feat: 새로운 기능 추가"

# 2. main 브랜치로 병합
git checkout main
git merge develop

# 3. 배포 (GitHub Actions 자동 트리거)
git push origin main
```

**자동 배포 흐름**:
1. **GitHub Actions 트리거**: main 브랜치 push
2. **빌드 및 테스트**: Node.js 20, 의존성 설치, 테스트 실행
3. **Vercel 배포**: 빌드 완료 후 자동 배포
4. **배포 완료 알림**: GitHub 커밋에 배포 상태 표시

### 🎯 수동 배포 (긴급시) - Manual Deployment

```bash
# Vercel CLI를 통한 즉시 배포
vercel --prod

# 특정 브랜치 배포
vercel --prod --branch feature-branch

# 환경변수 포함 배포
vercel --prod --env NODE_ENV=production
```

### 📊 배포 상태 모니터링 - Deployment Monitoring

```bash
# 실시간 배포 로그 확인
vercel logs --follow

# 특정 배포 로그 확인
vercel logs [deployment-url]

# 프로젝트 전체 로그
vercel logs --all
```

---

## 🔧 MCP 서버 배포 - MCP Server Deployment

### 🌐 Render 배포 (MCP 서버)

```bash
# mcp-server 디렉토리로 이동
cd mcp-server

# 의존성 설치 및 빌드
npm install
npm run build

# Render에서 자동 감지 및 배포
# 파일: render.yaml 기반 자동 설정
```

**Render 배포 설정**:
- **빌드 명령어**: `npm install && npm run build`
- **시작 명령어**: `npm start`
- **Node.js 버전**: 20.x
- **환경변수**: MCP 전용 환경변수 설정

### 🔗 하이브리드 아키텍처 - Hybrid Architecture

```yaml
Frontend + API:
  플랫폼: Vercel (서버리스)
  장점: 빠른 CDN, 자동 스케일링
  
MCP Server:
  플랫폼: Render (컨테이너)
  장점: 지속적 연결, WebSocket 지원
```

---

## 🚨 배포 실패 대응 - Troubleshooting

### 🎯 가장 흔한 문제들

#### **1. Vercel 프로젝트 연결 끊어짐**

**증상**:
```
Error: Your codebase isn't linked to a project on Vercel
```

**해결법**:
```bash
vercel link --yes
# 프로젝트 선택: skyasus-projects/openmanager-vibe-v5

# 재연결 확인
vercel env ls
```

#### **2. 환경변수 누락**

**증상**:
```
Error: supabaseUrl is required
```

**해결법**:
```bash
# 환경변수 추가
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production

# 재배포
vercel --prod
```

#### **3. 빌드 오류**

**TypeScript 에러**:
```bash
npm run type-check
# 타입 오류 수정 후 재배포
```

**ESLint 에러**:
```bash
npm run lint:fix
# 자동 수정 불가능한 경우 수동 수정
```

**의존성 오류**:
```bash
# package-lock.json 재생성
rm package-lock.json node_modules -rf
npm install
```

#### **4. GitHub Actions 실패**

**워크플로우 권한 문제**:
```yaml
# .github/workflows/simple-deploy.yml
permissions:
  contents: read
  deployments: write
```

**Secret 설정 누락**:
- GitHub 저장소 → Settings → Secrets → Actions
- VERCEL_TOKEN 추가 (필요시)

### 🔄 배포 후 검증 - Post-Deployment Verification

#### ✅ 즉시 확인 (5분 이내)

```bash
# 프로덕션 사이트 접근 테스트
curl -I https://openmanager-vibe-v5.vercel.app

# API 상태 확인
curl https://openmanager-vibe-v5.vercel.app/api/health

# Keep-Alive 시스템 확인
curl https://openmanager-vibe-v5.vercel.app/api/cron/keep-alive
```

**확인 항목**:
- [ ] **사이트 로딩**: 메인 페이지 정상 접근
- [ ] **API 응답**: 주요 엔드포인트 200 응답
- [ ] **데이터베이스**: Supabase 연결 상태
- [ ] **캐시**: Redis 연결 상태
- [ ] **콘솔 에러**: 브라우저 에러 없음

#### ✅ 상세 확인 (30분 이내)

```bash
# 성능 메트릭 확인
lighthouse https://openmanager-vibe-v5.vercel.app

# 보안 헤더 확인
curl -I https://openmanager-vibe-v5.vercel.app | grep -i security
```

**확인 항목**:
- [ ] **성능 점수**: Lighthouse 90+ 점수
- [ ] **접근성**: WCAG 가이드라인 준수
- [ ] **SEO**: 메타 태그 및 구조화 데이터
- [ ] **보안**: HTTPS, CSP 헤더 설정

---

## 🛠️ 긴급 롤백 절차 - Emergency Rollback

### 🚨 즉시 롤백 - Immediate Rollback

#### **Vercel 대시보드에서 롤백**:
1. [Vercel 대시보드](https://vercel.com/dashboard) 접속
2. 프로젝트 선택: `openmanager-vibe-v5`
3. 이전 성공한 배포 선택
4. "Promote to Production" 클릭

#### **Git을 통한 롤백**:
```bash
# 이전 커밋으로 되돌리기
git log --oneline -5  # 최근 5개 커밋 확인
git revert HEAD       # 최신 커밋 되돌리기
git push origin main  # 자동 재배포 트리거

# 특정 커밋으로 롤백
git reset --hard <commit-hash>
git push origin main --force
```

### 📊 문제 분석 - Issue Analysis

```bash
# Vercel 배포 로그 확인
vercel logs --all

# GitHub Actions 로그 확인
# GitHub → Actions 탭에서 실패한 워크플로우 확인

# 로컬 재현
npm run build  # 동일한 오류 재현 시도
```

**분석 항목**:
- [ ] **빌드 로그**: 컴파일 오류 확인
- [ ] **런타임 로그**: 실행 중 오류 확인
- [ ] **네트워크 로그**: API 호출 실패 확인
- [ ] **데이터베이스 로그**: 연결 문제 확인

---

## 📈 배포 최적화 - Deployment Optimization

### 🚀 성능 최적화

```bash
# 번들 크기 분석
npm run build:analyze

# 이미지 최적화
npm install sharp  # Vercel에서 자동으로 이미지 최적화

# 의존성 최적화
npm audit fix  # 보안 취약점 수정
npm dedupe     # 중복 의존성 제거
```

### 📊 모니터링 설정

```javascript
// vercel.json - 성능 모니터링
{
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "s-maxage=60, stale-while-revalidate"
        }
      ]
    }
  ]
}
```

### 🔄 자동화 개선

```yaml
# .github/workflows/simple-deploy.yml 최적화
name: Deploy to Vercel
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run validate:all
      - run: npm run build
```

---

## 🚀 **실제 달성된 성능 최적화 결과**

> **README_ORIGINAL.md에서 추출한 실제 운영 데이터**

### 📈 **시스템 성능 개선 메트릭**

| 메트릭 | 최적화 전 | 최적화 후 | 개선율 |
|--------|-----------|-----------|--------|
| **메모리 사용량** | 180MB | 50MB | **-72%** |
| **CPU 사용률** | 85% | 12% | **-86%** |
| **타이머 개수** | 23개 | 4개 | **-82%** |
| **데이터 압축률** | 0% | 65% | **+65%** |
| **캐시 적중률** | 60% | 85% | **+42%** |
| **API 응답시간** | 800ms | 150ms | **-81%** |

### 🛠️ **CI/CD 파이프라인 최적화 결과**

| 메트릭 | 최적화 전 | 최적화 후 | 개선율 |
|--------|-----------|-----------|--------|
| **전체 CI/CD** | 20분 | 12분 | **-40%** |
| **품질 검사** | 순차 8분 | 병렬 3분 | **-62%** |
| **빌드 시간** | 6분 | 3.5분 | **-42%** |
| **테스트 실행** | 12분 | 6분 | **-50%** |
| **아티팩트 크기** | 150MB | 89MB | **-41%** |
| **캐시 적중률** | 30% | 85% | **+183%** |

### 🔄 **최적화 메커니즘**

#### **1. 베이스라인 + 델타 압축**
```typescript
// 혁신적인 데이터 압축 방식
베이스라인(24시간) + 실시간 델타(5%) = 최종 메트릭
└── 95% 캐시된 패턴 + 5% 실시간 계산 = 65% 압축률
```

#### **2. 스마트 캐싱 시스템**
- **LRU 기반 85% 적중률** 달성
- **메모리 관리**: 100회마다 자동 압축 및 정리
- **타이머 통합**: 23개→4개로 82% 통합

#### **3. CI/CD 병렬화**
```yaml
최적화 전 (순차 실행):
  품질검사 → 빌드 → 테스트 → 배포 = 20분

최적화 후 (병렬 실행):
  품질검사 ┐
  빌드     ├→ 통합 → 배포 = 12분
  테스트   ┘
```

### 📊 **실시간 모니터링 메트릭**

```yaml
응답 시간:
  - API 평균 응답: < 200ms
  - 페이지 로드: < 1.5초
  - 실시간 업데이트: 5초 간격

시스템 안정성:
  - 에러율: < 0.1%
  - 가용성: 99.9%+
  - 성능 점수: Lighthouse 95+

데이터 처리:
  - 압축률: 65%
  - 캐시 적중률: 85%
  - 메모리 효율: 72% 개선
```

---

## 📚 참고 자료 - References

### 🔗 배포 플랫폼
- [Vercel Documentation](https://vercel.com/docs)
- [Render Documentation](https://render.com/docs)
- [GitHub Actions](https://docs.github.com/en/actions)

### 🛠️ 도구
- [Vercel CLI](https://vercel.com/docs/cli)
- [GitHub CLI](https://cli.github.com/)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)

### 📖 모니터링
- [Vercel Analytics](https://vercel.com/analytics)
- [Vercel Speed Insights](https://vercel.com/docs/speed-insights)

---

## ✅ 배포 완료 체크리스트 - Deployment Success Checklist

### 🎯 배포 직후 (5분)
- [ ] 프로덕션 사이트 정상 접근
- [ ] 메인 페이지 로딩 확인
- [ ] API 헬스체크 통과
- [ ] 콘솔 에러 없음

### 📊 배포 후 모니터링 (30분)
- [ ] 성능 메트릭 정상 범위
- [ ] 데이터베이스 연결 안정
- [ ] 캐시 시스템 동작
- [ ] 사용자 피드백 없음

### 🚀 장기 모니터링 (24시간)
- [ ] 에러율 1% 미만 유지
- [ ] 응답 시간 500ms 이하
- [ ] 메모리 사용량 안정
- [ ] 자동 스케일링 정상

---

**🎯 Safe and Reliable Deployment Process Complete!**