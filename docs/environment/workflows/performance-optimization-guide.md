# 성능 최적화 및 문제 해결 가이드

**WSL + Claude Code 환경에서 Next.js 프로젝트 성능 최적화 실무 가이드**

## 🎯 핵심 성능 최적화 전략

### 1. WSL I/O 성능 최적화

#### 파일 시스템 최적화

```bash
# WSL 2 네이티브 파일 시스템 사용 (권장)
프로젝트 위치: /mnt/d/cursor/openmanager-vibe-v5  # Windows 마운트
최적화 위치: ~/projects/openmanager-vibe-v5       # WSL 네이티브 (고려사항)

# I/O 성능 측정
time npm run build  # 빌드 시간 측정
```

#### WSL 설정 최적화 (.wslconfig)

```ini
[wsl2]
# 현재 최적화된 설정 (변경 금지)
memory=19GB              # 최적화 완료
processors=8             # CPU 코어 최대 활용
swap=10GB               # 스왑 메모리 충분
dnsTunneling=true       # MCP 서버 호환성 필수
autoProxy=true          # MCP 프록시 연결 필수
networkingMode=mirrored # 미러 모드 필수

# 성능 최적화 설정 (변경 가능)
autoMemoryReclaim=gradual  # 점진적 메모리 회수
sparseVhd=true            # VHD 압축 활성화
```

### 2. Node.js/npm 버전 관리 최적화

#### 현재 최적화된 버전

```bash
# 현재 프로덕션 버전 (검증 완료)
Node.js: v22.19.0 LTS  # Vercel 배포 호환성 100%
npm: v11.6.0           # 최신 성능 최적화
TypeScript: v5.7.2     # Strict 모드 완전 지원
```

#### 버전 업그레이드 시 체크리스트

```bash
# 1단계: 호환성 검증
npm run type-check  # TypeScript 호환성
npm run test:fast   # 기존 테스트 통과 확인

# 2단계: 성능 측정
npm run perf:quick  # 성능 벤치마크

# 3단계: Vercel 배포 검증
npm run build:vercel  # Vercel 환경 빌드 테스트
```

### 3. 메모리 누수 방지 및 최적화

#### 메모리 모니터링 도구

```bash
# WSL 메모리 상태 모니터링
./scripts/wsl-monitor/wsl-monitor.sh --once

# Node.js 프로세스 메모리 추적
top -p $(pgrep node)

# 개발 서버 메모리 사용량
ps aux | grep next-server | grep -v grep
```

#### 메모리 최적화 설정

```javascript
// 환경별 메모리 할당 전략
const memoryOptimization = {
  development: '--max-old-space-size=4096', // 개발: 4GB (여유)
  build: '--max-old-space-size=2048', // 빌드: 2GB (보수적)
  test: '--max-old-space-size=1024', // 테스트: 1GB (최소)
};

// GC 최적화
const gcOptimization = '--gc-interval=100 --optimize-for-size';
```

#### 메모리 누수 감지 및 해결

```bash
# 메모리 누수 감지
npm run perf:analyze  # 메모리 프로파일링

# React 성능 분석
npm run perf:react-analyze  # React 컴포넌트 메모리 사용량

# 자동 최적화 적용
npm run perf:react-optimize  # React 메모리 최적화
```

## 🔧 문제 해결 체계

### 1. 일반적인 문제 진단 절차

#### Step 1: 환경 상태 체크

```bash
# WSL 환경 종합 진단
./scripts/wsl-monitor/wsl-monitor.sh --once

# Claude Code MCP 서버 상태
claude mcp list

# 개발 서버 상태
npm run wsl:status
```

#### Step 2: 로그 분석

```bash
# 개발 서버 로그
tail -f dev-server.log

# Next.js 빌드 로그
npm run build 2>&1 | tee build.log

# TypeScript 컴파일 로그
npm run type-check 2>&1 | tee typecheck.log
```

#### Step 3: 성능 프로파일링

```bash
# 성능 병목점 분석
npm run perf:quick

# 상세 성능 분석
npm run perf:all-benchmarks
```

### 2. 주요 문제별 해결 방법

#### cross-env 오류 해결

```bash
# 문제: cross-env 실행 불가
# 해결: WSL 네이티브 스크립트 사용
npm run wsl:stable  # cross-env 불필요한 네이티브 방식

# 기존 스크립트 호환성 유지
npm run dev:stable  # 여전히 작동 (fallback)
```

#### 포트 충돌 해결

```bash
# 자동 해결
npm run wsl:stop && npm run wsl:claude

# 수동 해결
./scripts/dev-safe.sh  # AI 교차검증 기반 포트 정리
```

#### TypeScript 컴파일 에러

```bash
# 정확한 에러 위치 파악
npm run type-check  # TSC wrapper 사용

# AI 진단 활용
codex exec "TypeScript strict 모드 에러 해결: [에러 메시지]"
```

#### 메모리 부족 문제

```bash
# 긴급 메모리 회수
./scripts/maintenance/emergency-recovery.sh

# 점진적 메모리 최적화
export NODE_OPTIONS="--max-old-space-size=2048 --gc-interval=50"
```

### 3. 성능 저하 문제 해결

#### 빌드 성능 최적화

```bash
# 병렬 빌드 활성화
export UV_THREADPOOL_SIZE=8  # 스레드풀 크기 증가

# TypeScript 증분 컴파일
npm run type-check  # 캐시 활용

# 의존성 캐시 최적화
npm ci  # package-lock.json 기반 최적화 설치
```

#### 테스트 성능 최적화

```bash
# 멀티스레드 테스트 (44% 성능 향상)
npm run test:fast  # singleThread: false 설정

# 선택적 테스트 실행
npm run test:quick  # 최소한의 핵심 테스트
```

#### 개발 서버 성능 최적화

```bash
# Hot Reload 최적화
npm run wsl:stable  # 최적화된 환경변수 설정

# 메모리 사용량 최적화
npm run wsl:clean   # 텔레메트리 및 DevTools 비활성화
```

## 📊 성능 벤치마크 및 목표

### 현재 성능 지표 (2025-09-25)

| 항목                  | 현재 성능 | 목표     | 상태         |
| --------------------- | --------- | -------- | ------------ |
| **빌드 시간**         | 45초      | 40초     | 🟡 개선 중   |
| **테스트 시간**       | 21초      | 20초     | 🟢 목표 근접 |
| **개발 서버 시작**    | 22초      | 20초     | 🟡 개선 중   |
| **Hot Reload**        | 3-5초     | 2-3초    | 🟢 목표 달성 |
| **E2E 테스트 성공률** | 98.2%     | 99%      | 🟢 목표 근접 |
| **메모리 효율성**     | 84% 여유  | 80% 여유 | 🟢 목표 초과 |

### 성능 목표 달성 전략

#### 단기 목표 (1주)

```bash
# 빌드 시간 5초 단축
npm run bundle:analyze  # 번들 크기 분석
npm run perf:lint-benchmark  # 린트 성능 최적화

# 테스트 시간 1초 단축
npm run subagent:test:fast  # 서브에이전트 테스트 최적화
```

#### 중기 목표 (1개월)

```bash
# WSL I/O 성능 최적화
# - WSL 네이티브 파일 시스템 이전 검토
# - SSD 캐시 최적화 설정

# React 성능 최적화
npm run perf:react-optimize  # 자동 최적화 적용
```

## 🚨 응급 상황 대응

### 1. 개발 서버 크래시

```bash
# 즉시 복구
npm run wsl:stop
npm run clean
npm run wsl:stable

# 백업 복구
./scripts/maintenance/emergency-recovery.sh
```

### 2. 메모리 부족 크래시

```bash
# WSL 메모리 회수
echo 3 | sudo tee /proc/sys/vm/drop_caches

# Node.js 메모리 한도 임시 증가
export NODE_OPTIONS="--max-old-space-size=6144"
npm run wsl:build
```

### 3. MCP 서버 연결 실패

```bash
# MCP 서버 재연결
source ./scripts/setup-mcp-env.sh
claude mcp list

# Serena 프로젝트 재활성화
mcp__serena__activate_project
```

### 4. TypeScript 컴파일 실패

```bash
# 타입 캐시 정리
rm -rf .next/types
npm run type-check

# 점진적 타입 검사
npx tsc --incremental --noEmit
```

## 📈 지속적 성능 개선

### 성능 모니터링 자동화

```bash
# 일일 성능 체크
npm run perf:quick  # 매일 아침 실행

# 주간 종합 분석
npm run perf:all-benchmarks  # 매주 성능 트렌드 분석

# 월간 최적화 검토
npm run perf:react-analyze  # React 성능 종합 분석
```

### 성능 개선 우선순위

1. **High Priority**: E2E 테스트 성공률 99% 달성
2. **Medium Priority**: 빌드 시간 40초 단축
3. **Low Priority**: Hot Reload 속도 개선

### AI 교차검증 활용 성능 개선

```bash
# 성능 분석에 AI 활용
qwen -p "이 성능 병목점을 분석해줘: [벤치마크 결과]"
gemini "시스템 아키텍처 관점에서 성능 개선점은?"
codex exec "실무 관점에서 즉시 적용 가능한 성능 개선안은?"
```

## 🛡️ 안정성 보장

### 백업 및 복구 전략

```bash
# 정기 백업
git stash push -m "작업 중단 백업"
git commit -am "WIP: 진행 중 작업 백업"

# 안전한 실험
git checkout -b feature/performance-experiment
npm run wsl:build  # 실험적 변경 테스트
```

### 환경 일관성 보장

```bash
# 환경 변수 검증
npm run validate:env

# 의존성 일관성 검증
npm audit --audit-level=moderate

# 전체 환경 검증
npm run validate:all  # 타입 + 린트 + 테스트
```

## 💡 실무 팁

### 1. Claude Code와 개발 서버 병행 사용

```bash
# 최적 패턴: 터미널 3개 활용
Terminal 1: Claude Code 실행
Terminal 2: npm run wsl:claude (백그라운드 개발 서버)
Terminal 3: tail -f dev-server.log (로그 모니터링)

# 효율적 작업 순서
1. Claude Code로 코드 수정
2. Hot Reload 자동 적용 (3-5초)
3. 브라우저에서 변경사항 확인
4. 문제 발생 시 dev-server.log 체크
```

### 2. AI CLI 도구와의 성능 분산

```bash
# CPU 집약적 작업 분산
Claude Code: 코드 분석, 파일 수정 (메인 작업)
Codex CLI: 복잡한 알고리즘 분석 (27초 응답)
Gemini CLI: 아키텍처 검토 (즉시 응답)
Qwen CLI: 성능 최적화 분석 (60초 타임아웃)
```

### 3. 메모리 효율적 개발 패턴

```bash
# 메모리 사용량 단계별 관리
개발 시작: 4GB (NODE_OPTIONS 4096)
빌드 시: 2GB (메모리 보수적 할당)
테스트 시: 1GB (최소 메모리)
AI 작업 시: 시스템 자동 관리 (Claude)
```

## 🔍 성능 측정 및 분석

### 실시간 성능 모니터링

```bash
# 종합 성능 대시보드
./scripts/wsl-monitor/wsl-monitor.sh --daemon  # 백그라운드 모니터링

# 특정 영역 집중 분석
./scripts/wsl-monitor/wsl-monitor.sh --check-mcp      # MCP 서버 전용
./scripts/wsl-monitor/wsl-monitor.sh --check-processes # 프로세스 집중 분석
```

### Core Web Vitals 최적화

```bash
# 실제 환경 성능 측정
npm run lighthouse:local  # 로컬 Lighthouse

# 통합 성능 측정
npm run vitals:all  # integration + e2e + mock

# API 성능 측정
npm run vitals:api-test  # API 응답 시간 체크
```

### React 성능 최적화

```bash
# React 성능 분석
npm run perf:react-analyze  # 컴포넌트별 성능 분석

# 자동 최적화 적용
npm run perf:react-optimize:dry  # 드라이런으로 안전 확인
npm run perf:react-optimize      # 실제 최적화 적용
```

## 🚀 고급 최적화 기법

### 1. 병렬 처리 최적화

```javascript
// 멀티스레드 테스트 설정 (44% 성능 향상)
// config/testing/vitest.config.main.ts
export default defineConfig({
  test: {
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false, // 멀티스레드 활성화
        isolate: false, // 격리 비활성화 (성능 우선)
      },
    },
  },
});
```

### 2. 캐시 최적화

```bash
# ESLint 캐시 최적화
npm run lint:fast  # 캐시 활용 고속 린트

# TypeScript 증분 컴파일
npx tsc --incremental --noEmit

# npm 캐시 최적화
npm ci  # package-lock.json 기반 최적화 설치
```

### 3. 네트워크 최적화

```bash
# MCP 서버 연결 최적화
source ./scripts/setup-mcp-env.sh  # 환경변수 최적화

# Vercel 배포 최적화
npm run build:vercel  # 압축 및 최적화 적용
```

## 📊 성능 개선 추적

### 성능 개선 히스토리

| 날짜       | 개선 항목         | 기존    | 최적화     | 개선률         |
| ---------- | ----------------- | ------- | ---------- | -------------- |
| 2025-09-25 | 멀티스레드 테스트 | 37.95초 | 21.08초    | **44% 단축**   |
| 2025-09-24 | 개발 서버 시작    | 32초    | 22초       | **35% 단축**   |
| 2025-09-21 | MCP 서버 연결     | 불안정  | 99.9% 성공 | **완전 해결**  |
| 2025-09-16 | AI CLI 검증       | 11초    | 0.4초      | **96.4% 단축** |

### 다음 최적화 목표

1. **빌드 시간**: 45초 → 40초 (5초 단축 목표)
2. **E2E 성공률**: 98.2% → 99% (0.8% 향상 목표)
3. **메모리 효율성**: 현재 84% 여유 → 80% 목표 (더 많은 기능 추가 여유)

## 🔗 관련 도구 및 스크립트

### 성능 최적화 도구

- `/scripts/wsl-native-dev.sh` - WSL 네이티브 개발 환경
- `/scripts/wsl-monitor/` - WSL 성능 모니터링 도구
- `/scripts/maintenance/emergency-recovery.sh` - 응급 복구 도구
- `/scripts/dev-safe.sh` - AI 교차검증 기반 포트 관리

### 성능 측정 스크립트

- `npm run perf:*` - 성능 벤치마크 도구들
- `npm run vitals:*` - Core Web Vitals 측정
- `npm run test:*` - 최적화된 테스트 명령어들

---

💡 **핵심 원칙**: WSL 네이티브 환경의 장점을 최대한 활용하여 Claude Code와의 병행 개발에서 최고의 성능과 안정성을 달성합니다.
