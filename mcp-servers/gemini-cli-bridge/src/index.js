#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { AdaptiveGeminiBridge } from './adaptive-gemini-bridge-v2.js';
import { setupTools } from './tools.js';

// 서버 인스턴스 생성
const server = new Server(
  {
    name: 'gemini-cli-bridge-powershell',
    version: '2.1.0'  // PowerShell 전용 버전
  },
  {
    capabilities: {
      tools: {}
    }
  }
);

// PowerShell 전용 Gemini Bridge 초기화 (v2)
const geminiBridge = new AdaptiveGeminiBridge({
  timeout: parseInt(process.env.GEMINI_TIMEOUT || '30000'),
  maxRetries: parseInt(process.env.GEMINI_MAX_RETRIES || '3')
});

// 도구들 설정
setupTools(server, geminiBridge);

// 에러 핸들러
server.onerror = (error) => {
  console.error('[PowerShell Gemini CLI Bridge] 서버 에러:', error);
};

// 서버 시작
async function main() {
  console.error('[PowerShell Gemini CLI Bridge] PowerShell 전용 서버 시작 중...');
  
  try {
    // 컨텍스트 감지 및 초기화
    const context = await geminiBridge.initialize();
    console.error(`[PowerShell Gemini CLI Bridge] 호출 컨텍스트: ${context.caller} → ${context.target}`);
    console.error(`[PowerShell Gemini CLI Bridge] 실행 전략: ${context.executionStrategy}`);
    
    // Gemini CLI 연결 테스트
    const version = await geminiBridge.getVersion();
    console.error(`[PowerShell Gemini CLI Bridge] Gemini CLI 버전: ${version}`);
    
    console.error('[PowerShell Gemini CLI Bridge] ✅ 초기화 완료 - PowerShell 최적화 모드 활성화');
  } catch (error) {
    console.error('[PowerShell Gemini CLI Bridge] ⚠️ 초기화 경고:', error.message);
    console.error('[PowerShell Gemini CLI Bridge] 계속 진행하지만 일부 기능이 제한될 수 있습니다.');
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  console.error('[PowerShell Gemini CLI Bridge] MCP 서버가 stdio 모드로 실행 중입니다.');
  console.error('[PowerShell Gemini CLI Bridge] Claude ↔ Gemini PowerShell 양방향 호출 지원');
}

// 프로세스 종료 처리
process.on('SIGINT', async () => {
  console.error('[PowerShell Gemini CLI Bridge] 서버 종료 중...');
  await server.close();
  process.exit(0);
});

// 서버 실행
main().catch((error) => {
  console.error('[PowerShell Gemini CLI Bridge] 치명적 오류:', error);
  process.exit(1);
});