---
name: refactor
description: 코드 리팩토링 자동화 - 중복 제거, 구조 개선, 성능 최적화
---

선택된 코드나 파일을 분석하여 자동으로 리팩토링을 수행해주세요.

## 리팩토링 체크리스트

1. **중복 코드 제거**
   - 반복되는 패턴을 함수/클래스로 추출
   - 유사한 로직 통합
   - DRY 원칙 적용

2. **타입 안전성 강화**
   - any 타입 제거
   - 명시적 타입 정의 추가
   - 타입 가드 함수 구현

3. **코드 구조 개선**
   - 단일 책임 원칙 적용
   - 복잡한 함수 분리 (10줄 이내)
   - 깊은 중첩 제거 (최대 3단계)

4. **성능 최적화**
   - 불필요한 렌더링 방지 (React.memo, useMemo)
   - 비용이 큰 연산 캐싱
   - 번들 크기 최적화

5. **가독성 향상**
   - 명확한 변수명 사용
   - 주석 대신 자체 문서화 코드
   - 복잡한 조건문 단순화

## 실행 과정

1. 코드 분석 및 문제점 식별
2. 개선 방안 제시
3. 테스트 작성 (TDD)
4. 리팩토링 실행
5. 테스트 통과 확인

## 예시

```typescript
// Before
function calc(a, b, c) {
  if (c === 'add') {
    return a + b;
  } else if (c === 'sub') {
    return a - b;
  } else if (c === 'mul') {
    return a * b;
  } else if (c === 'div') {
    return a / b;
  }
}

// After
type Operation = 'add' | 'sub' | 'mul' | 'div';

const operations: Record<Operation, (a: number, b: number) => number> = {
  add: (a, b) => a + b,
  sub: (a, b) => a - b,
  mul: (a, b) => a * b,
  div: (a, b) => {
    if (b === 0) throw new Error('Division by zero');
    return a / b;
  }
};

function calculate(a: number, b: number, operation: Operation): number {
  return operations[operation](a, b);
}
```