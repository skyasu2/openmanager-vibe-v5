#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { GeminiBridge } from './gemini-bridge.js';
import { setupTools } from './tools.js';

// 서버 인스턴스 생성
const server = new Server(
  {
    name: 'gemini-cli-bridge',
    version: '1.0.0'
  },
  {
    capabilities: {
      tools: {}
    }
  }
);

// Gemini Bridge 초기화
const geminiBridge = new GeminiBridge({
  timeout: parseInt(process.env.GEMINI_TIMEOUT || '30000'),
  maxRetries: parseInt(process.env.GEMINI_MAX_RETRIES || '3')
});

// 도구들 설정
setupTools(server, geminiBridge);

// 에러 핸들러
server.onerror = (error) => {
  console.error('[Gemini CLI Bridge] 서버 에러:', error);
};

// 서버 시작
async function main() {
  console.error('[Gemini CLI Bridge] 서버 시작 중...');
  
  try {
    // Gemini CLI 연결 테스트
    const version = await geminiBridge.getVersion();
    console.error(`[Gemini CLI Bridge] Gemini CLI 버전: ${version}`);
  } catch (error) {
    console.error('[Gemini CLI Bridge] Gemini CLI 연결 실패:', error.message);
    console.error('[Gemini CLI Bridge] 계속 진행하지만 일부 기능이 작동하지 않을 수 있습니다.');
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  console.error('[Gemini CLI Bridge] MCP 서버가 stdio 모드로 실행 중입니다.');
}

// 프로세스 종료 처리
process.on('SIGINT', async () => {
  console.error('[Gemini CLI Bridge] 서버 종료 중...');
  await server.close();
  process.exit(0);
});

// 서버 실행
main().catch((error) => {
  console.error('[Gemini CLI Bridge] 치명적 오류:', error);
  process.exit(1);
});