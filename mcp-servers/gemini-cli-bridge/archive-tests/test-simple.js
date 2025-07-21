import { SimplePowerShellBridge } from './src/simple-powershell-bridge.js';

console.log('=== PowerShell Gemini Bridge 테스트 ===\n');

const bridge = new SimplePowerShellBridge({
  timeout: 30000,
  debug: true,
});

async function runTests() {
  console.log('1. 초기화 테스트...');
  try {
    const initResult = await bridge.initialize();
    console.log('✅ 초기화 성공:', initResult);
  } catch (error) {
    console.error('❌ 초기화 실패:', error.message);
    return;
  }

  console.log('\n2. 간단한 질문 테스트...');
  try {
    const response = await bridge.chat('2+2는 얼마야? 한 줄로 답해줘');
    console.log('✅ 응답:', response);
  } catch (error) {
    console.error('❌ 채팅 실패:', error.message);
  }

  console.log('\n3. 사용량 확인 테스트...');
  try {
    const stats = await bridge.getStats();
    console.log('✅ 사용량:', JSON.stringify(stats, null, 2));
  } catch (error) {
    console.error('❌ 사용량 확인 실패:', error.message);
  }

  console.log('\n테스트 완료!');
}

runTests().catch(console.error);
