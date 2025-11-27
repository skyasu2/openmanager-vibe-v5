# 빌드 및 테스트 전략 최적화 가이드

**WSL + Claude Code 환경에서 TypeScript strict 프로젝트의 실무 빌드/테스트 전략**

## 🎯 핵심 전략

### 1. TypeScript Strict 모드 빌드 최적화

```bash
# WSL 네이티브 방식 (cross-env 불필요)
npm run wsl:build  # 프로덕션 빌드 (2GB 메모리)

# 기존 방식 (호환성 유지)
npm run build      # cross-env 사용 (문제 발생 시)
npm run build:prod # DevTools 비활성화 빌드
```

### 2. 단계별 검증 체계

| 단계           | 명령어                    | 소요시간 | 목적                      |
| -------------- | ------------------------- | -------- | ------------------------- |
| **Pre-build**  | `npm run type-check`      | 15초     | TypeScript 에러 사전 차단 |
| **Build**      | `npm run wsl:build`       | 45초     | 실제 빌드 검증            |
| **Post-build** | `npm run test:vercel:e2e` | 8분      | 실제 환경 E2E 테스트      |

## 🏗️ 빌드 최적화

### TypeScript Strict 모드 대응

```bash
# 1단계: 타입 체크 (빌드 전 필수)
npm run type-check  # TSC wrapper 사용

# 2단계: 점진적 빌드
npm run wsl:build   # 최적화된 WSL 네이티브 빌드

# 3단계: 검증
npm run validate:quick  # 빌드 결과 검증
```

### 메모리 최적화 빌드 설정

```javascript
// 빌드 시 메모리 설정 (scripts/wsl-native-dev.sh에서 자동 적용)
export NODE_OPTIONS="--max-old-space-size=2048"  // 빌드용 (보수적)
export NODE_OPTIONS="--max-old-space-size=4096"  // 개발용 (여유있게)
```

### Vercel 배포 최적화

```bash
# Vercel 배포 전 체크
npm run build:vercel  # .vercel-deploy-check.sh 포함

# 수동 배포 검증
npm run deploy:safe   # 안전 배포 (사전 검증 포함)
```

## 🧪 테스트 전략 최적화

### Vercel 중심 E2E 테스트 (최우선)

```bash
# 실제 Vercel 환경에서 E2E 테스트 (권장)
npm run test:vercel:e2e  # 18개 Playwright 테스트, 98.2% 통과율

# 로컬 환경에서 빠른 E2E (개발용)
npm run test:e2e  # WSL GUI 환경에서 실행
```

### 1인 AI 개발 최적화 테스트

```bash
# AI 개발 기본 워크플로우
npm run test:ai           # Vercel 실제 환경 (최고 가치)
npm run test:super-fast   # 11초 빠른 검증
npm run test:fast         # 21초 멀티스레드 (44% 성능 향상)

# 병렬 개발 테스트
npm run test:dev          # quick + vercel 병렬 실행
```

### 성능 최적화된 유닛 테스트

```bash
# 멀티스레드 활성화 (44% 성능 향상)
npm run test:fast         # 37.95초 → 21.08초

# 최소한의 테스트 (개발 중)
npm run test:quick        # 가장 빠른 검증

# 커버리지 포함 (필요시)
npm run test:coverage     # 상세 분석용
```

## 🎭 Playwright E2E 테스트 최적화

### WSL 환경에서 Playwright 실행

```bash
# GUI 모드 (WSL X11 포워딩)
export DISPLAY=:0
npx playwright test --headed

# Headless 모드 (CI/CD)
npx playwright test

# Vercel 환경 전용 테스트
npm run test:vercel:e2e
```

### Playwright MCP 서버 통합

```bash
# Playwright MCP 서버 상태 확인
claude mcp list | grep playwright

# Playwright 전용 개발 서버
npm run wsl:playwright  # Playwright 최적화 설정
```

### 실제 환경 테스트 전략

```bash
# Phase 1: 로컬 빠른 검증
npm run test:super-fast   # 11초

# Phase 2: 실제 환경 검증 (최종)
npm run test:vercel:e2e   # 8분, 98.2% 통과율

# Phase 3: 성능 테스트
npm run lighthouse:local  # Core Web Vitals
```

## 📊 성능 벤치마크

### 현재 최적화 성과 (2025-09-25)

| 항목                  | 기존    | 최적화  | 개선률        |
| --------------------- | ------- | ------- | ------------- |
| **유닛 테스트**       | 37.95초 | 21.08초 | **44% 단축**  |
| **TypeScript 컴파일** | 25초    | 15초    | **40% 단축**  |
| **빌드 시간**         | 60초    | 45초    | **25% 단축**  |
| **E2E 테스트 성공률** | 95%     | 98.2%   | **3.2% 향상** |

### 지속적 성능 모니터링

```bash
# 성능 벤치마크 실행
npm run perf:quick              # 빠른 성능 측정
npm run perf:all-benchmarks     # 종합 벤치마크

# 개발 효율성 측정
npm run verify:fast             # AI CLI 검증 (96.4% 성능 향상)
npm run perf:precommit-benchmark # 사전 커밋 성능 측정
```

## 🔄 CI/CD 최적화

### Git 훅 최적화

```bash
# Pre-commit 최적화 (lint-staged)
git add .
git commit -m "feat: 새 기능 추가"  # 자동으로 최적화된 lint 실행

# Pre-push 검증
git push  # 자동으로 validate 실행
```

### Vercel 배포 최적화

```bash
# 배포 전 검증 체크리스트
npm run deploy:check  # env + type-check + test:quick

# 안전한 배포
npm run deploy:safe   # 사전 검증 + Vercel 배포
```

## 🛡️ 에러 처리 및 회복

### TypeScript Strict 모드 에러 해결

```bash
# 1단계: 타입 에러 상세 분석
npm run type-check  # TSC wrapper로 정확한 에러 위치 파악

# 2단계: Claude Code AI 진단
claude "이 TypeScript 에러를 분석해줘: [에러 메시지]"

# 3단계: 점진적 수정 및 검증
npm run type-check  # 수정 후 재검증
```

### 빌드 실패 복구

```bash
# 긴급 복구 절차
npm run clean        # 캐시 정리
npm run clean:all    # 완전 정리 (node_modules 포함)

# 단계적 복구
npm install          # 의존성 재설치
npm run type-check   # 타입 체크
npm run wsl:build    # 빌드 재시도
```

### 테스트 실패 디버깅

```bash
# E2E 테스트 실패 시
npm run test:e2e --debug  # 디버그 모드
npx playwright test --ui   # UI 모드 디버깅

# 유닛 테스트 실패 시
npm run test:watch  # 와치 모드로 실시간 디버깅
npm run test -- --reporter=verbose  # 상세 리포트
```

## 🔧 개발 환경별 최적화

### WSL 환경 최적화

```bash
# WSL 메모리 모니터링
./scripts/wsl-monitor/wsl-monitor.sh --once

# WSL 성능 최적화
export NODE_OPTIONS="--max-old-space-size=4096 --gc-interval=100"
```

### Vercel 환경 최적화

```bash
# Vercel Edge Functions 최적화
npm run test:api  # API Routes 성능 테스트

# Vercel 실제 환경 테스트
npm run test:vercel  # 실제 배포 환경에서 검증
```

## 📈 성능 측정 및 개선

### Core Web Vitals 모니터링

```bash
# 로컬 Lighthouse 측정
npm run lighthouse:local

# 실제 환경 성능 측정
npm run perf:analyze  # Core Web Vitals 분석
npm run vitals:all    # 종합 성능 측정
```

### React 성능 최적화

```bash
# React 성능 분석
npm run perf:react-analyze

# 자동 최적화 적용
npm run perf:react-optimize

# 드라이런 (안전 확인)
npm run perf:react-optimize:dry
```

## 💡 베스트 프랙티스

### 1. 개발 워크플로우

```bash
# 매일 아침 개발 시작
npm run wsl:claude      # Claude와 병행 개발 모드
npm run test:super-fast # 11초 빠른 검증

# 기능 완성 후
npm run type-check      # TypeScript 검증
npm run test:fast       # 21초 멀티스레드 테스트
npm run wsl:build       # 빌드 검증

# 배포 전 최종 검증
npm run test:vercel:e2e # 실제 환경 E2E 테스트
npm run deploy:safe     # 안전 배포
```

### 2. AI 교차검증 활용

```bash
# 복잡한 빌드 에러 발생 시
codex exec "이 빌드 에러를 분석해줘: [에러 로그]"
gemini "시스템 아키텍처 관점에서 빌드 최적화 방안 제시"
qwen -p "빌드 성능을 더 최적화할 방법은?"
```

### 3. 메모리 관리

```bash
# 메모리 사용량 모니터링
free -h  # WSL 메모리 상태
top -p $(pgrep next-server)  # Next.js 프로세스 모니터링

# 메모리 최적화
npm run clean  # 정기적 캐시 정리
```

---

💡 **핵심 원칙**: 빠른 피드백 루프를 통한 점진적 검증과 Vercel 실제 환경에서의 최종 검증을 통해 높은 품질과 성능을 보장합니다.
