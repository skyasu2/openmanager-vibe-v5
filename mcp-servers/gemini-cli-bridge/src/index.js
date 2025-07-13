#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { SimplePowerShellBridge } from './simple-powershell-bridge.js';

// 서버 인스턴스 생성
const server = new Server(
  {
    name: 'gemini-cli-bridge-powershell-simple',
    version: '4.0.0'  // 단순화된 버전
  },
  {
    capabilities: {
      tools: {}
    }
  }
);

// PowerShell 전용 Gemini Bridge 초기화
const geminiBridge = new SimplePowerShellBridge({
  timeout: parseInt(process.env.GEMINI_TIMEOUT || '30000'),
  debug: process.env.GEMINI_DEBUG === 'true'
});

// 도구들 설정
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'gemini_chat',
        description: 'Gemini CLI와 대화하기',
        inputSchema: {
          type: 'object',
          properties: {
            prompt: {
              type: 'string',
              description: 'Gemini에게 전송할 프롬프트'
            },
            model: {
              type: 'string',
              description: '사용할 모델 (선택사항)',
              enum: ['gemini-2.5-pro', 'gemini-2.0-flash']
            },
            headless: {
              type: 'boolean',
              description: '헤드리스 모드 사용 여부'
            }
          },
          required: ['prompt']
        }
      },
      {
        name: 'gemini_stats',
        description: 'Gemini CLI 사용량 확인',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      },
      {
        name: 'gemini_clear',
        description: 'Gemini 컨텍스트 초기화',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      },
      {
        name: 'gemini_compress',
        description: 'Gemini 대화 압축',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      },
      {
        name: 'gemini_context_info',
        description: '현재 실행 환경 정보 확인',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      }
    ]
  };
});

// 도구 실행 핸들러
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'gemini_chat':
        const result = await geminiBridge.chat(args.prompt, {
          model: args.model,
          headless: args.headless
        });
        return {
          content: [{ type: 'text', text: result }]
        };

      case 'gemini_stats':
        const stats = await geminiBridge.getStats();
        return {
          content: [{ type: 'text', text: JSON.stringify(stats, null, 2) }]
        };

      case 'gemini_clear':
        await geminiBridge.clearContext();
        return {
          content: [{ type: 'text', text: '✅ 컨텍스트가 초기화되었습니다.' }]
        };

      case 'gemini_compress':
        const compressResult = await geminiBridge.compressContext();
        return {
          content: [{ type: 'text', text: compressResult.message || '✅ 대화가 압축되었습니다.' }]
        };

      case 'gemini_context_info':
        return {
          content: [{
            type: 'text',
            text: `=== PowerShell Gemini CLI Bridge 정보 ===

🔍 실행 환경:
  - 플랫폼: Windows PowerShell
  - 버전: 4.0.0 (단순화 버전)
  - 디버그 모드: ${process.env.GEMINI_DEBUG || 'false'}

⚡ 특징:
  - PowerShell 네이티브 실행
  - --prompt 플래그 최적화
  - 최소한의 오버헤드

💡 이 버전은 PowerShell 환경에 최적화되어 있습니다.`
          }]
        };

      default:
        throw new Error(`알 수 없는 도구: ${name}`);
    }
  } catch (error) {
    console.error(`[도구 실행 오류] ${name}:`, error);
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ error: error.message }, null, 2)
      }]
    };
  }
});

// 에러 핸들러
server.onerror = (error) => {
  console.error('[SimplePowerShellBridge] 서버 에러:', error);
};

// 서버 시작
async function main() {
  console.error('[SimplePowerShellBridge] 서버 시작 중...');
  
  try {
    // 초기화 테스트
    const initResult = await geminiBridge.initialize();
    if (initResult.success) {
      console.error('[SimplePowerShellBridge] ✅ 초기화 성공');
    } else {
      console.error('[SimplePowerShellBridge] ⚠️ 초기화 실패:', initResult.error);
    }
  } catch (error) {
    console.error('[SimplePowerShellBridge] ⚠️ 초기화 중 오류:', error.message);
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  console.error('[SimplePowerShellBridge] MCP 서버가 실행 중입니다.');
}

// 프로세스 종료 처리
process.on('SIGINT', async () => {
  console.error('[SimplePowerShellBridge] 서버 종료 중...');
  await server.close();
  process.exit(0);
});

// 서버 실행
main().catch((error) => {
  console.error('[SimplePowerShellBridge] 치명적 오류:', error);
  process.exit(1);
});