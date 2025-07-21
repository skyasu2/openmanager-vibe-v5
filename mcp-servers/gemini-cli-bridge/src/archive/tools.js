import { z } from 'zod';
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';

export function setupTools(server, geminiBridge) {
  // 도구 목록 등록
  server.setRequestHandler(
    z.object({
      method: z.literal('tools/list'),
    }),
    async () => {
      return {
        tools: [
          {
            name: 'gemini_chat',
            description: 'Gemini CLI와 대화하기 (PowerShell 최적화)',
            inputSchema: {
              type: 'object',
              properties: {
                prompt: {
                  type: 'string',
                  description: 'Gemini에게 전송할 프롬프트',
                },
              },
              required: ['prompt'],
            },
          },
          {
            name: 'gemini_chat_flash',
            description: 'Gemini 2.5 Flash 모델로 대화하기 (빠르고 효율적)',
            inputSchema: {
              type: 'object',
              properties: {
                prompt: {
                  type: 'string',
                  description: 'Gemini에게 전송할 프롬프트',
                },
              },
              required: ['prompt'],
            },
          },
          {
            name: 'gemini_chat_pro',
            description:
              'Gemini 2.5 Pro 모델로 대화하기 (더 강력한 추론, 무료 한도 있음)',
            inputSchema: {
              type: 'object',
              properties: {
                prompt: {
                  type: 'string',
                  description: 'Gemini에게 전송할 프롬프트',
                },
              },
              required: ['prompt'],
            },
          },
          {
            name: 'gemini_stats',
            description: 'Gemini CLI 사용량 통계 확인',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'gemini_clear',
            description: 'Gemini 컨텍스트 초기화',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'gemini_context_info',
            description: '현재 PowerShell 호출 컨텍스트 정보 확인 (디버깅용)',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'gemini_usage_dashboard',
            description: 'Gemini CLI 사용량 대시보드 확인',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
        ],
      };
    }
  );

  // 도구 호출 처리
  server.setRequestHandler(
    z.object({
      method: z.literal('tools/call'),
      params: z.object({
        name: z.string(),
        arguments: z.record(z.any()).optional(),
      }),
    }),
    async request => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'gemini_chat':
            return await handleChat(geminiBridge, args);

          case 'gemini_chat_flash':
            return await handleChatFlash(geminiBridge, args);

          case 'gemini_chat_pro':
            return await handleChatPro(geminiBridge, args);

          case 'gemini_stats':
            return await handleStats(geminiBridge);

          case 'gemini_clear':
            return await handleClear(geminiBridge);

          case 'gemini_context_info':
            return await handleContextInfo(geminiBridge);

          case 'gemini_usage_dashboard':
            return await handleUsageDashboard(geminiBridge);

          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `알 수 없는 도구: ${name}`
            );
        }
      } catch (error) {
        console.error(`[PowerShell 도구 오류] ${name}:`, error);
        throw new McpError(
          ErrorCode.InternalError,
          `오류 발생: ${error.message}`
        );
      }
    }
  );
}

// 도구 핸들러 함수들
async function handleChat(geminiBridge, args) {
  const result = await geminiBridge.chat(args.prompt);
  return {
    content: [
      {
        type: 'text',
        text: typeof result === 'string' ? result : JSON.stringify(result),
      },
    ],
  };
}

async function handleStats(geminiBridge) {
  const stats = await geminiBridge.getStats();

  // v2에서는 getStats()가 객체를 반환하므로 처리
  const result =
    typeof stats === 'string' ? stats : JSON.stringify(stats, null, 2);

  return {
    content: [
      {
        type: 'text',
        text: result,
      },
    ],
  };
}

async function handleClear(geminiBridge) {
  const result = await geminiBridge.clearContext();
  return {
    content: [
      {
        type: 'text',
        text: result || 'PowerShell 컨텍스트가 초기화되었습니다.',
      },
    ],
  };
}

async function handleChatFlash(geminiBridge, args) {
  const result = await geminiBridge.chat(args.prompt, {
    model: 'gemini-2.5-flash',
  });
  return {
    content: [
      {
        type: 'text',
        text: typeof result === 'string' ? result : JSON.stringify(result),
      },
    ],
  };
}

async function handleChatPro(geminiBridge, args) {
  const result = await geminiBridge.chat(args.prompt, {
    model: 'gemini-2.5-pro',
  });
  return {
    content: [
      {
        type: 'text',
        text: typeof result === 'string' ? result : JSON.stringify(result),
      },
    ],
  };
}

async function handleContextInfo(geminiBridge) {
  try {
    // AdaptiveGeminiBridge에서 컨텍스트 정보 가져오기
    const context = await geminiBridge.initialize();

    const contextInfo = `
=== PowerShell Gemini CLI Bridge 컨텍스트 정보 ===

🔍 호출 컨텍스트:
  - 호출자: ${context.caller}
  - 대상: ${context.target}  
  - 확신도: ${context.confidence}
  - PowerShell 환경: ${context.isPowerShell ? '예' : '아니오'}

⚡ 실행 전략:
  - 전략: ${context.executionStrategy}
  - 권장사항: ${context.recommendations.join(', ')}

🐛 디버그 점수:
  - 환경 점수: ${context.debug?.envScore || 'N/A'}
  - 파일시스템 점수: ${context.debug?.fsScore || 'N/A'}  
  - 프로세스 점수: ${context.debug?.processScore || 'N/A'}
  - 런타임 점수: ${context.debug?.runtimeScore || 'N/A'}

💡 이 정보는 Claude ↔ Gemini PowerShell 양방향 호출 최적화에 사용됩니다.
`;

    return {
      content: [
        {
          type: 'text',
          text: contextInfo.trim(),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `PowerShell 컨텍스트 정보를 가져올 수 없습니다: ${error.message}`,
        },
      ],
    };
  }
}

async function handleUsageDashboard(geminiBridge) {
  try {
    const dashboard = geminiBridge.getUsageDashboard();

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(dashboard, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `PowerShell 사용량 대시보드를 가져올 수 없습니다: ${error.message}`,
        },
      ],
    };
  }
}
