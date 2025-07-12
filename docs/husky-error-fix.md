# Husky Hook 에러 해결 가이드

## 발견된 문제점

### 1. Husky Deprecated 경고
```bash
husky - DEPRECATED
Please remove the following two lines from .husky/pre-commit:
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"
```

**원인**: Husky v10에서 deprecated될 예정인 구문 사용

**해결방법**: 
- `.husky/pre-commit`와 `.husky/pre-push`에서 두 번째 줄 제거
- `#!/usr/bin/env sh` 다음의 `. "$(dirname -- "$0")/_/husky.sh"` 삭제

### 2. TypeScript 타입 에러
프로젝트에 다수의 TypeScript 타입 에러 존재:
- `GCPServerMetrics`와 `ServerInstance` 타입 불일치
- `RealServerDataGeneratorType` 타입 미정의
- 암시적 `any` 타입 사용
- 존재하지 않는 속성 참조

**임시 해결방법**:
- `git commit --no-verify` 사용
- 또는 pre-commit hook에서 type-check 임시 비활성화

## 적용된 수정사항

### 1. Pre-push Hook 수정
```bash
# 수정 전
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# 수정 후
#!/usr/bin/env sh
```

### 2. Pre-commit Hook 수정
```bash
# 수정 전
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# 수정 후
#!/usr/bin/env sh
```

## 권장사항

### 단기 해결책
1. 긴급한 커밋/푸시 시 `--no-verify` 옵션 사용
2. TypeScript 설정에서 일시적으로 strict 모드 완화

### 장기 해결책
1. TypeScript 타입 에러 전체 수정
2. Husky를 최신 버전으로 업그레이드
3. Git hooks를 선택적으로 실행하도록 구성

## 추가 개선사항

### Pre-commit Hook 최적화
```bash
# TypeScript 체크를 선택적으로 실행
if [ "$SKIP_TYPE_CHECK" != "true" ]; then
  npm run type-check
fi
```

### 환경변수 활용
```bash
# 개발 중 임시로 타입 체크 스킵
export SKIP_TYPE_CHECK=true
git commit -m "message"
```

이렇게 하면 개발 생산성을 유지하면서도 필요할 때 전체 검증을 수행할 수 있습니다.