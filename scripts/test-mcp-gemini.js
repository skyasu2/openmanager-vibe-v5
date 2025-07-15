#!/usr/bin/env node
/**
 * ⚠️ 이 테스트는 더 이상 유효하지 않습니다.
 * Gemini CLI Bridge MCP가 지원 중단되었습니다.
 * 
 * 대신 다음을 사용하세요:
 * - 개발 도구: ./tools/g "질문"
 * - npm 스크립트: npm run gemini:chat "질문"
 * 
 * [아카이브 - 참고용으로만 유지]
 * MCP Gemini 통합 테스트 스크립트
 * Claude Code 재시작 후 실행하세요
 */

console.log('🧪 MCP Gemini 통합 테스트 시작...\n');

// 테스트 시나리오
const testScenarios = [
  {
    name: '기본 채팅 테스트',
    prompt: 'mcp_gemini_cli_bridge_gemini_chat("안녕하세요, MCP 테스트입니다")'
  },
  {
    name: '코드 리뷰 테스트',
    prompt: 'mcp_gemini_cli_bridge_gemini_chat("function add(a, b) { return a + b } 이 코드의 개선점은?")'
  },
  {
    name: 'Flash 모델 테스트',
    prompt: 'mcp_gemini_cli_bridge_gemini_chat_flash("빠른 응답 테스트")'
  },
  {
    name: '사용량 확인',
    prompt: 'mcp_gemini_cli_bridge_gemini_stats()'
  },
  {
    name: '컨텍스트 정보',
    prompt: 'mcp_gemini_cli_bridge_gemini_context_info()'
  }
];

console.log('📋 테스트할 시나리오:');
testScenarios.forEach((scenario, index) => {
  console.log(`${index + 1}. ${scenario.name}`);
  console.log(`   명령: ${scenario.prompt}`);
  console.log('');
});

console.log('---');
console.log('💡 사용법:');
console.log('1. Claude Code를 재시작하세요 (MCP 서버 리로드)');
console.log('2. 위 명령들을 Claude에게 실행해달라고 요청하세요');
console.log('3. 정상 작동하면 자동 교차 검증이 가능합니다!');
console.log('');
console.log('예시: "첫 번째 테스트 명령 실행해줘"');
console.log('');

// 직접 실행 대안
console.log('🔧 MCP가 작동하지 않으면 직접 실행:');
console.log('```bash');
console.log('gemini -p "안녕하세요"');
console.log('gemini /stats');
console.log('```');

// 협업 예시
console.log('\n🤝 협업 요청 예시:');
console.log('- "이 함수 Gemini랑 성능 최적화 검토해줘"');
console.log('- "이 에러 Gemini랑 같이 분석해줘"');
console.log('- "이 설계 Gemini랑 브레인스토밍해줘"');
console.log('');

process.exit(0);