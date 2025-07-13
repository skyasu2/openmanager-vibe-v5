// MCP 응답 형식 수정 헬퍼
export function createMCPResponse(result) {
  // 안전한 문자열 변환
  let textContent = '';
  
  if (typeof result === 'string') {
    textContent = result;
  } else if (result === null || result === undefined) {
    textContent = '';
  } else if (typeof result === 'object') {
    try {
      textContent = JSON.stringify(result, null, 2);
    } catch (e) {
      textContent = String(result);
    }
  } else {
    textContent = String(result);
  }
  
  return {
    content: [{
      type: 'text',
      text: textContent
    }]
  };
}

// 사용 예시:
// return createMCPResponse(await geminiBridge.chat(args.prompt));