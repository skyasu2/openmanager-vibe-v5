// 통합 테스트용 파일
// 의도적인 문제 포함

export function testFunction(data: any) {  // any 타입 사용
  const apiKey = "sk_live_test123";  // 하드코딩된 API 키
  
  // eval 사용 (보안 위험)
  const result = eval(data.expression);
  
  // 비효율적인 알고리즘
  for (let i = 0; i < data.length; i++) {
    for (let j = 0; j < data.length; j++) {
      for (let k = 0; k < data.length; k++) {
        // O(n^3) 복잡도
      }
    }
  }
  
  return result;
}
