# 린트 개선 가이드

## 진행 상황
- **시작**: 491개 경고
- **현재**: 462개 경고
- **개선**: 29개 (5.9%)

## 완료된 작업

### 1순위: Promise 처리 (19개 수정)
- ✅ useEffect 내 Promise 호출에 `void` 추가
- ✅ 이벤트 핸들러 내 Promise 호출에 `void` 추가
- ✅ 주요 컴포넌트 및 hooks 수정 완료

### 2순위: 미사용 변수 (10개 수정)
- ✅ 미사용 import 제거
- ✅ 미사용 파라미터에 `_` prefix 추가
- ✅ React Hook 의존성 배열 수정

## 남은 작업 (462개)

### 우선순위별 분류

#### 🔴 높음 (약 150개) - Promise 처리
```bash
# 패턴: @typescript-eslint/no-floating-promises
# 해결: void 연산자 또는 await 추가

# 주요 파일:
- src/hooks/*.ts (약 50개)
- src/services/**/*.ts (약 60개)
- src/lib/**/*.ts (약 40개)
```

#### 🟡 중간 (약 200개) - 미사용 변수
```bash
# 패턴: @typescript-eslint/no-unused-vars
# 해결: 
#   1. 사용하지 않는 변수 제거
#   2. 파라미터 앞에 _ 추가
#   3. import 정리

# 주요 파일:
- src/components/**/*.tsx (약 80개)
- src/hooks/*.ts (약 60개)
- src/services/**/*.ts (약 40개)
- src/lib/**/*.ts (약 20개)
```

#### 🟢 낮음 (약 112개) - React Hook 의존성
```bash
# 패턴: react-hooks/exhaustive-deps
# 해결:
#   1. 누락된 의존성 추가
#   2. 불필요한 의존성 제거
#   3. useCallback/useMemo로 감싸기

# 주요 파일:
- src/hooks/*.ts (약 60개)
- src/components/**/*.tsx (약 52개)
```

## 자동화 스크립트

### Promise 처리 자동 수정
```bash
# useEffect 내부 Promise 호출 찾기
grep -r "useEffect.*{" src/ | grep -v "void " | grep -v "await "

# 일괄 수정 (신중하게)
find src/ -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/useEffect(() => {$/useEffect(() => {/g'
```

### 미사용 변수 찾기
```bash
# index 파라미터 찾기
grep -rn "\.map(.*index.*=>" src/ | grep -v "_index"

# 미사용 import 찾기
npm run lint | grep "is defined but never used"
```

## 수동 검토 필요

### any 타입 (약 20개)
- `src/polyfills.ts` - 브라우저 polyfill (유지 필요)
- `src/lib/ai/providers/*.ts` - AI 응답 타입 (개선 가능)
- `src/hooks/useUserPermissions.ts` - 권한 체크 (개선 필요)

### switch case 선언 (약 10개)
- `src/lib/mock-scenarios/*.ts` - 블록 스코프 추가 필요

### Next.js Image (1개)
- `src/components/profile/components/ProfileAvatar.tsx` - Image 컴포넌트로 교체

## 다음 단계

1. **Promise 처리 완료** (150개)
   - hooks 디렉토리 집중 공략
   - services 디렉토리 일괄 처리

2. **미사용 변수 정리** (200개)
   - 자동화 스크립트 활용
   - UI 컴포넌트 import 정리

3. **React Hook 의존성** (112개)
   - ESLint 제안 따르기
   - 성능 영향 검토

## 예상 소요 시간
- Promise 처리: 30분
- 미사용 변수: 45분
- Hook 의존성: 30분
- **총 예상**: 1시간 45분
