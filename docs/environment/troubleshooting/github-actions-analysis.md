# 🔍 GitHub Actions 실패 분석

## 현재 상태

### CI 워크플로우

- **파일**: `.github/workflows/ci-optimized.yml`
- **전략**: Non-blocking CI/CD (2025 Standard)
- **특징**: `continue-on-error: true` 사용

### 로컬 테스트 결과 ✅

```bash
npm run test:ci:fast
# 결과: 125 tests passed (5 files)
# 시간: 2.62s
```

## 🎯 일반적인 실패 원인

### 1. 환경 변수 누락

**증상**: API 호출 실패, 빌드 에러

**CI 설정 확인**:

```yaml
env:
  NEXT_PUBLIC_SUPABASE_URL: https://test.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY: test-anon-key
  NODE_ENV: test
  SKIP_ENV_VALIDATION: true
```

**해결책**:

- GitHub Secrets에 실제 키 추가
- 또는 Mock 값으로 테스트 통과

### 2. Node.js 버전 불일치

**CI 설정**: Node.js 22.18.0
**로컬**: Node.js 22.15.1 (.nvmrc)

**해결책**:

```yaml
# .github/workflows/ci-optimized.yml
env:
  NODE_VERSION: '22.15.1' # .nvmrc와 일치
```

### 3. NPM 의존성 설치 실패

**증상**: 429 Too Many Requests

**현재 대응**:

- 3회 재시도
- 15초 대기 후 재시도
- npm 캐시 정리

**추가 해결책**:

```yaml
- name: Cache node_modules
  uses: actions/cache@v3
  with:
    path: node_modules
    key: ${{ runner.os }}-node-${{ hashFiles('package-lock.json') }}
```

### 4. TypeScript 에러

**현재 설정**: `continue-on-error: true`

**실제 에러 확인**:

```bash
# 로컬에서 확인
npx tsc --noEmit
```

**현재 상태**:

- 타입 에러: 0개 ✅
- 로컬 빌드: 성공 ✅

### 5. 테스트 타임아웃

**현재 설정**: 3분 타임아웃

**개선 방법**:

```yaml
- name: Fast CI Tests
  timeout-minutes: 5 # 3분 → 5분
```

## 🔧 권장 수정 사항

### 1. Node.js 버전 통일

```yaml
# .github/workflows/ci-optimized.yml
env:
  NODE_VERSION: '22.15.1' # 변경
```

### 2. 캐싱 추가

```yaml
- name: Cache Dependencies
  uses: actions/cache@v3
  with:
    path: |
      ~/.npm
      node_modules
      .next/cache
    key: ${{ runner.os }}-${{ hashFiles('package-lock.json') }}
```

### 3. 환경 변수 검증

```yaml
- name: Verify Environment
  run: |
    echo "Node version: $(node --version)"
    echo "NPM version: $(npm --version)"
    echo "Environment: $NODE_ENV"
```

### 4. 실패 시 로그 출력

```yaml
- name: Upload Test Results
  if: failure()
  uses: actions/upload-artifact@v3
  with:
    name: test-results
    path: |
      test-results/
      playwright-report/
```

## 📊 실패 패턴 분석

### 패턴 1: 간헐적 실패

**원인**: NPM 레지스트리 429 에러
**해결**: 재시도 로직 (이미 구현됨 ✅)

### 패턴 2: 특정 브랜치만 실패

**원인**: main 브랜치는 엄격한 검증

```yaml
if [[ "${{ github.ref }}" == "refs/heads/main" ]]; then
  exit 1  # main은 실패 시 중단
fi
```

### 패턴 3: 빌드는 성공, 테스트 실패

**원인**: 환경 차이
**해결**: 환경 변수 통일

## 🚀 즉시 적용 가능한 수정

### 수정 1: Node.js 버전

```bash
# .github/workflows/ci-optimized.yml 수정
sed -i "s/NODE_VERSION: '22.18.0'/NODE_VERSION: '22.15.1'/" .github/workflows/ci-optimized.yml
```

### 수정 2: 타임아웃 증가

```yaml
- name: Fast CI Tests
  timeout-minutes: 5 # 3 → 5
```

### 수정 3: 상세 로그

```yaml
- name: Debug Info
  if: failure()
  run: |
    echo "=== Node Info ==="
    node --version
    npm --version
    echo "=== Environment ==="
    env | grep -E "(NODE|NPM|NEXT)" | sort
    echo "=== Package Info ==="
    npm list --depth=0
```

## 📝 체크리스트

실패 시 확인 사항:

- [ ] Node.js 버전 일치 (22.15.1)
- [ ] 환경 변수 설정 확인
- [ ] package-lock.json 최신 상태
- [ ] 로컬 테스트 통과 (`npm run test:ci:fast`)
- [ ] 로컬 빌드 성공 (`npm run build`)
- [ ] 타입 체크 통과 (`npx tsc --noEmit`)

## 🔗 관련 문서

- **CI 워크플로우**: `.github/workflows/ci-optimized.yml`
- **테스트 설정**: `config/testing/vitest.config.minimal.ts`
- **환경 변수**: `.env.example`

## 💡 다음 단계

1. **GitHub Actions 로그 확인**
   - Repository → Actions 탭
   - 실패한 워크플로우 클릭
   - 각 단계별 로그 확인

2. **로컬 재현**

   ```bash
   # CI 환경 시뮬레이션
   NODE_ENV=test npm run test:ci:fast
   ```

3. **수정 후 테스트**
   ```bash
   git add .github/workflows/ci-optimized.yml
   git commit -m "fix: CI 워크플로우 개선"
   git push
   ```

---

**작성일**: 2025-11-20  
**상태**: 로컬 테스트 통과 ✅  
**다음 확인**: GitHub Actions 로그
