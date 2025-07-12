import { z } from 'zod';
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';

export function setupTools(server, geminiBridge) {
  // 도구 목록 등록
  server.setRequestHandler(
    z.object({
      method: z.literal('tools/list')
    }),
    async () => {
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
                }
              },
              required: ['prompt']
            }
          },
          {
            name: 'gemini_stats',
            description: 'Gemini CLI 사용량 통계 확인',
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
          }
        ]
      };
    }
  );

  // 도구 호출 처리
  server.setRequestHandler(
    z.object({
      method: z.literal('tools/call'),
      params: z.object({
        name: z.string(),
        arguments: z.record(z.any()).optional()
      })
    }),
    async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'gemini_chat':
            return await handleChat(geminiBridge, args);
          
          case 'gemini_stats':
            return await handleStats(geminiBridge);
          
          case 'gemini_clear':
            return await handleClear(geminiBridge);
          
          default:
            throw new McpError(ErrorCode.MethodNotFound, `알 수 없는 도구: ${name}`);
        }
      } catch (error) {
        console.error(`[도구 오류] ${name}:`, error);
        throw new McpError(ErrorCode.InternalError, `오류 발생: ${error.message}`);
      }
    }
  );
}

// 도구 핸들러 함수들
async function handleChat(geminiBridge, args) {
  const result = await geminiBridge.chat(args.prompt);
  return {
    content: [{
      type: 'text',
      text: result
    }]
  };
}

async function handleStats(geminiBridge) {
  const result = await geminiBridge.getStats();
  return {
    content: [{
      type: 'text',
      text: result
    }]
  };
}

async function handleClear(geminiBridge) {
  const result = await geminiBridge.clearContext();
  return {
    content: [{
      type: 'text',
      text: result || '컨텍스트가 초기화되었습니다.'
    }]
  };
}