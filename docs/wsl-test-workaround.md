# WSL 환경에서 테스트 실행 문제 해결 가이드

## 문제 상황

WSL 환경에서 `/mnt/d/` (Windows 파일 시스템) 경로에서 vitest 실행 시 타임아웃 발생

## 원인

1. WSL과 Windows 파일 시스템 간의 I/O 성능 문제
2. vitest가 많은 파일을 읽는 과정에서 타임아웃 발생
3. 파일 시스템 권한 및 속도 차이

## 해결 방법

### 방법 1: tsx를 활용한 직접 실행

```bash
# tsx 설치 (이미 완료됨)
npm install --save-dev tsx

# 단일 테스트 파일 실행
npm run test:tsx

# 또는 직접 실행
npx tsx scripts/test-safeformat.ts
```

### 방법 2: WSL 네이티브 파일 시스템으로 이동

```bash
# WSL 내부로 프로젝트 복사
cp -r /mnt/d/cursor/openmanager-vibe-v5 ~/openmanager-vibe-v5
cd ~/openmanager-vibe-v5
npm install
npm test
```

### 방법 3: Windows에서 직접 실행

PowerShell 또는 Command Prompt에서:

```powershell
cd D:\cursor\openmanager-vibe-v5
npm test
```

### 방법 4: 간단한 테스트 작성

`scripts/test-*.ts` 형태로 간단한 테스트 파일 작성:

```typescript
import { someFunction } from '../src/utils/someModule';

// 간단한 assert 함수
function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`❌ ${message}`);
  }
  console.log(`✅ ${message}`);
}

// 테스트 실행
console.log('🧪 Testing someFunction...');
assert(someFunction(1) === 2, 'Test case 1');
assert(someFunction(2) === 4, 'Test case 2');
console.log('✅ All tests passed!');
```

## 임시 해결책 적용 내역

1. **환경변수 설정 분리**
   - `src/test/env.test.ts` → `src/test/env.config.ts`로 분리
   - 순환 참조 문제 해결

2. **타이머 Mock 비활성화**
   - `vi.useFakeTimers()` 주석 처리
   - 타임아웃 문제 완화

3. **새로운 테스트 스크립트 추가**
   - `npm run test:tsx` - tsx를 활용한 간단한 테스트
   - `npm run test:simple` - 커스텀 테스트 러너

## TypeScript 개선 사항

현재 주석 처리된 strict 옵션들:
- `noUnusedLocals`
- `noUnusedParameters`
- `exactOptionalPropertyTypes`

많은 수정이 필요하므로 점진적으로 개선 예정

## 권장사항

1. **개발 환경**: WSL 네이티브 파일 시스템 사용
2. **CI/CD**: GitHub Actions 등에서는 정상 작동
3. **로컬 테스트**: tsx를 활용한 간단한 테스트 우선 실행