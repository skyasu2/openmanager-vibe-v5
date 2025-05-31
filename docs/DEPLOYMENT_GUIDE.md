# 🚀 OpenManager v5 스마트 배포 가이드

> **GitHub Actions 비용 70% 절감 + 더 빠른 배포**

## 💡 배포 전략 개요

OpenManager v5는 **하이브리드 배포 시스템**을 사용하여 비용을 최적화하고 배포 속도를 향상시킵니다:

- 🟢 **Vercel 직접 배포**: UI, 스타일, 문서 변경 (70% 케이스)
- 🔴 **GitHub Actions**: API, 핵심 로직 변경 (30% 케이스)

## ⚡ 빠른 시작

### 1. Vercel CLI 설정
```bash
# Vercel CLI 설치
npm install -g vercel

# 프로젝트 연결
vercel login
vercel link
```

### 2. 자동화 스크립트 사용
```bash
# 🟢 직접 배포 (UI/스타일 변경)
./scripts/deploy.sh "UI 개선" direct

# 🔴 CI 배포 (API/로직 변경)
./scripts/deploy.sh "API 엔드포인트 추가" ci
```

## 📋 배포 유형별 가이드

### 🟢 직접 배포 케이스 (GitHub Actions 스킵)

**적합한 변경사항:**
- ✅ UI 컴포넌트 수정
- ✅ CSS/스타일 변경
- ✅ 텍스트/문서 업데이트
- ✅ 이미지/아이콘 교체
- ✅ 작은 버그 픽스
- ✅ 환경변수 설정

**명령어 예시:**
```bash
# 방법 1: 자동화 스크립트
./scripts/deploy.sh "버튼 스타일 개선" direct

# 방법 2: 수동 명령어
git add .
git commit -m "style: 헤더 디자인 개선 [direct]"
npm run deploy
git push
```

### 🔴 GitHub Actions 사용 케이스

**적합한 변경사항:**
- ❗ API 엔드포인트 변경
- ❗ 데이터베이스 스키마 수정
- ❗ 핵심 비즈니스 로직 변경
- ❗ 의존성 업데이트
- ❗ 보안 관련 수정
- ❗ 대규모 리팩토링

**명령어 예시:**
```bash
# 방법 1: 자동화 스크립트
./scripts/deploy.sh "새 API 엔드포인트 추가" ci

# 방법 2: 일반 Git 워크플로우
git add .
git commit -m "feat: 새로운 메트릭 API 추가"
git push  # GitHub Actions 자동 실행
```

## 🎯 사용 가능한 명령어

### NPM 스크립트
```bash
# Vercel 직접 배포
npm run deploy              # 프로덕션 배포
npm run deploy:dev          # 개발/프리뷰 배포
npm run deploy:skip-ci      # 빌드 스킵하고 배포
npm run deploy:local        # 로컬 빌드 후 배포

# GitHub Actions 트리거
npm run ci:trigger          # 빈 커밋으로 CI 재트리거
npm run ci:recovery         # CI 복구 스크립트
npm run deploy:safe         # 검증 후 안전 배포
```

### 배포 스크립트
```bash
# 기본 사용법
./scripts/deploy.sh "커밋 메시지" [direct|ci]

# 직접 배포 예시
./scripts/deploy.sh "UI 색상 변경" direct
./scripts/deploy.sh "문서 업데이트" direct
./scripts/deploy.sh "아이콘 교체" direct

# CI 배포 예시
./scripts/deploy.sh "API 로직 개선" ci
./scripts/deploy.sh "의존성 업데이트" ci
```

## 💰 비용 절약 효과

| 구분 | 기존 방식 | 스마트 방식 | 절약 효과 |
|------|-----------|-------------|-----------|
| **월 커밋** | 100회 | 100회 | - |
| **GitHub Actions** | 100회 실행 | 30회 실행 | **-70%** |
| **Vercel 직접 배포** | 0회 | 70회 | **무료** |
| **월 예상 비용** | $10-15 | $3-5 | **70% 절감** |
| **배포 속도** | 5-8분 | 2-3분 | **50% 향상** |

## 🔧 고급 설정

### GitHub Actions 조건부 실행
현재 설정된 조건:
- **실행됨**: `src/app/**`, `src/modules/**`, `package.json` 변경
- **스킵됨**: `src/components/ui/**`, `docs/**`, `README.md` 변경
- **[direct] 태그**: 커밋 메시지에 포함 시 무조건 스킵

### Vercel 최적화 설정
```json
{
  "installCommand": "npm ci --prefer-offline --no-audit --no-fund",
  "build": {
    "env": {
      "NODE_OPTIONS": "--max-old-space-size=4096"
    }
  },
  "functions": {
    "maxDuration": 60,
    "memory": 1024
  }
}
```

## 🚨 주의사항

### 직접 배포 시 주의점
1. **빌드 테스트**: 항상 `npm run build`로 로컬 테스트
2. **타입 체크**: 중요 변경 시 `npm run type-check` 실행
3. **테스트 실행**: `npm run test` 통과 확인

### 권장 워크플로우
1. **변경사항 분류**: UI/스타일 vs API/로직
2. **로컬 테스트**: 빌드 및 테스트 통과 확인
3. **적절한 배포 선택**: direct vs ci
4. **배포 후 확인**: 프로덕션 동작 검증

## 📊 모니터링

### 배포 상태 확인
```bash
# Vercel 배포 로그
vercel logs

# GitHub Actions 상태
npm run ci:status

# 프로덕션 헬스체크
npm run verify:production
```

### 성능 메트릭
- **직접 배포**: 평균 2-3분
- **CI 배포**: 평균 5-8분
- **성공률**: 95%+ (안정성 검증 후)

---

🎯 **목표**: 개발 생산성 향상 + 운영 비용 최적화 + 배포 안정성 보장 