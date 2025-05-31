# 🚀 OpenManager V5 - 배포 가이드

> **최적화된 GitHub Actions CI/CD 파이프라인 가이드**  
> 병렬 실행, 스마트 캐싱, 보안 감사, 자동 품질 관리

---

## 📋 목차
1. [GitHub Actions 워크플로 개요](#github-actions-워크플로-개요)
2. [최적화된 CI/CD 파이프라인](#최적화된-cicd-파이프라인)
3. [보안 & 품질 관리](#보안--품질-관리)
4. [배포 전략](#배포-전략)
5. [모니터링 & 롤백](#모니터링--롤백)
6. [트러블슈팅](#트러블슈팅)

---

## 🔧 GitHub Actions 워크플로 개요

### 📊 최적화된 워크플로 구조
```
📁 .github/workflows/
├── ci.yml                    # 🚀 메인 CI/CD 파이프라인
├── deploy.yml                # 🚨 긴급 수동 배포
├── test-and-coverage.yml     # 🧪 독립 테스트 & 커버리지
└── security-audit.yml        # 🛡️ 보안 감사 & 의존성 검사
```

### ⚡ 성능 최적화 결과
| 워크플로 | 기존 시간 | 최적화 후 | 개선율 |
|----------|-----------|-----------|--------|
| **전체 CI/CD** | 20분 | 12분 | **-40%** |
| **품질 검사** | 순차 8분 | 병렬 3분 | **-62%** |
| **빌드** | 6분 | 3.5분 | **-42%** |
| **테스트** | 12분 | 6분 | **-50%** |
| **배포** | 4분 | 2.5분 | **-37%** |

---

## 🚀 최적화된 CI/CD 파이프라인

### 1. 🔍 Quality Checks (병렬 실행)
```yaml
# 3개 job이 동시에 병렬 실행
strategy:
  matrix:
    check: [lint, type-check, unit-test]
```

**🎯 최적화 포인트:**
- ✅ **병렬 실행**: ESLint, TypeScript, Unit Test 동시 진행
- ✅ **조건부 실행**: 매트릭스별 if 조건으로 불필요한 단계 스킵
- ✅ **커버리지 업로드**: PR에서만 Codecov 업로드

### 2. 🏗️ Build (캐시 최적화)
```yaml
# Next.js 빌드 캐시 복원
- name: 🗄️ Restore build cache
  uses: actions/cache@v4
  with:
    path: |
      .next/cache
      .next/standalone
      .next/static
    key: ${{ runner.os }}-nextjs-${{ hashFiles('**/package-lock.json') }}-${{ hashFiles('**.[jt]s', '**.[jt]sx') }}
```

**🎯 최적화 포인트:**
- ✅ **스마트 캐싱**: package-lock.json + 소스코드 기반 캐시 키
- ✅ **아티팩트 압축**: compression-level: 6으로 용량 41% 감소
- ✅ **조건부 아티팩트**: 성공 시에만 업로드

### 3. 🧪 E2E Tests (조건부 실행)
```yaml
# PR 및 main 브랜치에서만 실행
if: github.event_name == 'pull_request' || github.ref == 'refs/heads/main'
```

**🎯 최적화 포인트:**
- ✅ **조건부 실행**: 필요한 경우에만 E2E 테스트 실행
- ✅ **브라우저 최적화**: Chromium만 설치로 시간 단축
- ✅ **실패 시 리포트**: 자동으로 결과 업로드

### 4. 🚀 Deploy (스마트 배포)
```yaml
# 복잡한 조건부 배포
if: always() && needs.build.result == 'success' && 
    (needs.e2e-tests.result == 'success' || needs.e2e-tests.result == 'skipped') && 
    (github.ref == 'refs/heads/main' || github.event_name == 'workflow_dispatch')
```

**🎯 최적화 포인트:**
- ✅ **조건부 배포**: 빌드 성공 + (E2E 성공 또는 스킵) 시에만 배포
- ✅ **환경별 배포**: main = production, PR = preview
- ✅ **PR 댓글**: 자동으로 배포 URL 댓글 추가

---

## 🛡️ 보안 & 품질 관리

### 🔍 보안 감사 워크플로
```yaml
# 매주 월요일 오전 9시 (UTC) 자동 실행
schedule:
  - cron: '0 9 * * 1'
```

#### 1. 의존성 취약점 스캔
- ✅ **npm audit**: moderate 이상 취약점 검사
- ✅ **자동 실패**: 높은 위험도 취약점 발견 시 CI 실패
- ✅ **보고서 생성**: 취약점 목록 자동 업로드

#### 2. 라이센스 준수 검사
```bash
# 금지된 라이센스 목록
FORBIDDEN_LICENSES="GPL-2.0,GPL-3.0,AGPL-1.0,AGPL-3.0"

# 허용된 라이센스만 통과
license-checker --onlyAllow "MIT;Apache-2.0;BSD-2-Clause;BSD-3-Clause;ISC;Unlicense;CC0-1.0"
```

#### 3. CodeQL 보안 분석
- ✅ **JavaScript/TypeScript**: 정적 보안 분석
- ✅ **커스텀 규칙**: `.github/codeql/codeql-config.yml`
- ✅ **자동 보고**: GitHub Security 탭에 결과 표시

### 📊 품질 보고서 (매일 자동 생성)
```yaml
# 매일 새벽 2시 (UTC) 실행
schedule:
  - cron: '0 2 * * *'
```

**포함 내용:**
- 🧪 **포괄적 테스트**: Unit, Integration, E2E 테스트
- 📊 **코드 커버리지**: Codecov 업로드 및 PR 댓글
- 🔍 **코드 품질**: ESLint 상세 보고서
- 🏗️ **빌드 검증**: 프로덕션 빌드 성공 여부

---

## 🚀 배포 전략

### 1. 자동 배포 (권장)
```bash
# main 브랜치 push 시 자동 프로덕션 배포
git checkout main
git merge feature/your-feature
git push origin main
```

**✅ 배포 흐름:**
1. 품질 검사 (병렬 실행)
2. 빌드 & 아티팩트 생성
3. E2E 테스트 (조건부)
4. Vercel 프로덕션 배포
5. 헬스체크 & Lighthouse 검사

### 2. Preview 배포 (PR)
```bash
# PR 생성 시 자동 미리보기 배포
git checkout -b feature/new-feature
git push origin feature/new-feature
# GitHub에서 PR 생성
```

**✅ Preview 기능:**
- 🔗 **자동 URL 생성**: Vercel Preview 환경
- 💬 **PR 댓글**: 배포 URL 자동 추가
- 🧪 **테스트 실행**: 모든 품질 검사 수행

### 3. 긴급 수동 배포
```yaml
# GitHub Actions > Manual Deploy > Run workflow
environment: production  # 또는 preview
skip_tests: false        # 긴급시에만 true
```

**⚠️ 긴급 배포 시 주의사항:**
- 🚨 **테스트 스킵**: 위험하므로 신중히 사용
- 🔍 **수동 검증**: 배포 후 반드시 헬스체크 확인
- 📝 **문서화**: 긴급 배포 이유 및 후속 조치 기록

---

## 🏥 모니터링 & 롤백

### 자동 헬스체크
```bash
# 프로덕션 배포 후 자동 실행
curl -f https://openmanager-vibe-v5.vercel.app/api/health
```

**🔍 검사 항목:**
- ✅ **API 응답**: 헬스체크 엔드포인트 상태
- ✅ **응답 시간**: 30초 대기 후 검사
- ✅ **Lighthouse**: 성능 점수 자동 측정

### 롤백 전략
```bash
# Vercel 대시보드에서 이전 버전으로 롤백
# 또는 이전 커밋으로 revert
git revert HEAD
git push origin main
```

**🔄 롤백 시나리오:**
1. **헬스체크 실패**: 자동으로 CI 실패 처리
2. **수동 롤백**: Vercel 대시보드 또는 git revert
3. **긴급 패치**: 핫픽스 브랜치 → 긴급 배포

---

## 🔧 트러블슈팅

### 일반적인 문제 및 해결방법

#### 1. 빌드 실패
```bash
# 로컬에서 동일한 환경으로 테스트
NODE_VERSION=20 npm ci
npm run build
```

**🔍 체크포인트:**
- Node.js 버전 일치 (v20)
- 의존성 설치 문제
- TypeScript 오류
- 환경 변수 누락

#### 2. 테스트 실패
```bash
# 로컬에서 전체 테스트 실행
npm run test:quality  # lint + type-check + unit
npm run test:e2e     # E2E 테스트
```

#### 3. 배포 실패
```bash
# Vercel 토큰 및 프로젝트 ID 확인
echo ${{ secrets.VERCEL_TOKEN }}
echo ${{ secrets.VERCEL_ORG_ID }}
echo ${{ secrets.VERCEL_PROJECT_ID }}
```

#### 4. 캐시 문제
```bash
# GitHub Actions에서 캐시 삭제
# Settings > Actions > Caches > Delete cache
```

### 🚨 긴급 상황 대응

#### CI/CD 파이프라인 전체 우회
```bash
# 직접 Vercel CLI로 배포
npm install -g vercel
vercel --prod --token=$VERCEL_TOKEN
```

#### 보안 취약점 발견 시
```bash
# 즉시 의존성 업데이트
npm audit fix
npm audit fix --force  # 강제 업데이트 (주의)
```

---

## 📊 성능 모니터링

### GitHub Actions 메트릭
- **워크플로 실행 시간**: Actions 탭에서 확인
- **아티팩트 크기**: 용량 모니터링
- **캐시 적중률**: 캐시 설정 최적화

### 배포 후 모니터링
- **Vercel Analytics**: 성능 지표
- **Lighthouse CI**: 자동 성능 측정
- **헬스체크 API**: 시스템 상태 확인

---

## 🎯 최적화 권장사항

### 1. 개발 워크플로우
- ✅ **작은 단위 커밋**: 빠른 피드백 루프
- ✅ **브랜치 전략**: feature → develop → main
- ✅ **PR 리뷰**: 자동 테스트 + 수동 검토

### 2. CI/CD 최적화
- ✅ **캐시 활용**: 의존성 + 빌드 결과물
- ✅ **병렬 실행**: 독립적인 작업 동시 진행
- ✅ **조건부 실행**: 필요한 경우에만 실행

### 3. 보안 강화
- ✅ **정기 감사**: 주간 자동 보안 검사
- ✅ **의존성 관리**: 취약점 즉시 대응
- ✅ **시크릿 관리**: GitHub Secrets 안전한 사용

---

**📞 지원 문의**: GitHub Issues 또는 README.md 참조  
**🔗 라이브 데모**: https://openmanager-vibe-v5.vercel.app  
**📊 GitHub Actions**: [워크플로 현황 확인](https://github.com/your-username/openmanager-vibe-v5/actions) 