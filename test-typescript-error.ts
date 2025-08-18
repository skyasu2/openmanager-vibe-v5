// 테스트용 TypeScript 파일 - 의도적 오류 포함

export function testFunction(param1, param2) {
  // 오류 1: 매개변수에 타입이 없음 (implicit any)
  const result = param1 + param2;
  
  // 오류 2: 사용하지 않는 변수
  const unusedVariable = "this will not be used";
  
  // 오류 3: 누락된 반환 타입
  return result;
}

// 오류 4: 누락된 import (React를 사용하지만 import하지 않음)
export const TestComponent = () => {
  return React.createElement('div', null, 'Test');
};

// 오류 5: null 체크 없이 접근
export function accessProperty(obj) {
  return obj.property.value; // obj가 null일 수 있음
}