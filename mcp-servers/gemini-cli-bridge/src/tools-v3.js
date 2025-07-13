import { z } from 'zod';
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';

/**
 * 🚀 MCP 도구 설정 v3.0
 * 
 * 새로운 기능:
 * - 자동 모델 선택
 * - 고급 채팅 옵션
 * - 작업별 최적화 도구
 */
export function setupTools(server, geminiBridge) {
  // 도구 목록 등록
  server.setRequestHandler(
    z.object({
      method: z.literal('tools/list')
    }),
    async () => {
      return {
        tools: [
          // 기본 도구들
          {
            name: 'gemini_chat',
            description: 'Gemini와 대화 (자동 모델 선택)',
            inputSchema: {
              type: 'object',
              properties: {
                prompt: {
                  type: 'string',
                  description: 'Gemini에게 전송할 프롬프트'
                },
                model: {
                  type: 'string',
                  description: '모델 지정 (선택사항): gemini-2.5-pro, gemini-2.0-flash, auto',
                  enum: ['gemini-2.5-pro', 'gemini-2.0-flash', 'auto']
                }
              },
              required: ['prompt']
            }
          },
          
          // 작업별 최적화 도구들
          {
            name: 'gemini_quick_answer',
            description: '빠른 답변 (Flash 모델, 헤드리스 모드)',
            inputSchema: {
              type: 'object',
              properties: {
                question: {
                  type: 'string',
                  description: '간단한 질문'
                }
              },
              required: ['question']
            }
          },
          
          {
            name: 'gemini_code_review',
            description: '코드 리뷰 (Pro 모델, 심층 분석)',
            inputSchema: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  description: '리뷰할 코드'
                },
                focus: {
                  type: 'string',
                  description: '리뷰 포커스 (선택사항)',
                  enum: ['security', 'performance', 'readability', 'all']
                }
              },
              required: ['code']
            }
          },
          
          {
            name: 'gemini_analyze',
            description: '복잡한 분석 (Pro 모델, 폴백 지원)',
            inputSchema: {
              type: 'object',
              properties: {
                content: {
                  type: 'string',
                  description: '분석할 내용'
                },
                depth: {
                  type: 'string',
                  description: '분석 깊이',
                  enum: ['quick', 'standard', 'deep'],
                  default: 'standard'
                }
              },
              required: ['content']
            }
          },
          
          // 기존 도구들 유지
          {
            name: 'gemini_chat_flash',
            description: 'Gemini 2.0 Flash 모델 강제 사용',
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
            name: 'gemini_chat_pro',
            description: 'Gemini 2.5 Pro 모델 강제 사용',
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
            description: 'Gemini 사용량 통계 (개선된 형식)',
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
            name: 'gemini_context_info',
            description: '호출 컨텍스트 정보',
            inputSchema: {
              type: 'object',
              properties: {}
            }
          },
          
          {
            name: 'gemini_usage_dashboard',
            description: '사용량 대시보드 (모델 추천 포함)',
            inputSchema: {
              type: 'object',
              properties: {}
            }
          },
          
          // 새로운 고급 도구
          {
            name: 'gemini_batch',
            description: '배치 처리 (여러 프롬프트 순차 실행)',
            inputSchema: {
              type: 'object',
              properties: {
                prompts: {
                  type: 'array',
                  items: { type: 'string' },
                  description: '순차적으로 실행할 프롬프트 목록'
                },
                model: {
                  type: 'string',
                  description: '사용할 모델',
                  enum: ['gemini-2.5-pro', 'gemini-2.0-flash', 'auto']
                }
              },
              required: ['prompts']
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
          // 기본 도구들
          case 'gemini_chat':
            return await handleChat(geminiBridge, args);
          
          case 'gemini_chat_flash':
            return await handleChatFlash(geminiBridge, args);
          
          case 'gemini_chat_pro':
            return await handleChatPro(geminiBridge, args);
          
          // 작업별 최적화 도구들
          case 'gemini_quick_answer':
            return await handleQuickAnswer(geminiBridge, args);
          
          case 'gemini_code_review':
            return await handleCodeReview(geminiBridge, args);
          
          case 'gemini_analyze':
            return await handleAnalyze(geminiBridge, args);
          
          // 유틸리티 도구들
          case 'gemini_stats':
            return await handleStats(geminiBridge);
          
          case 'gemini_clear':
            return await handleClear(geminiBridge);
          
          case 'gemini_context_info':
            return await handleContextInfo(geminiBridge);
          
          case 'gemini_usage_dashboard':
            return await handleUsageDashboard(geminiBridge);
          
          // 고급 도구
          case 'gemini_batch':
            return await handleBatch(geminiBridge, args);
          
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

// 핸들러 함수들

async function handleChat(geminiBridge, args) {
  const options = args.model ? { model: args.model } : { model: 'auto' };
  const result = await geminiBridge.chatAdvanced(args.prompt, options);
  
  return {
    content: [{
      type: 'text',
      text: typeof result === 'string' ? result : JSON.stringify(result)
    }]
  };
}

async function handleQuickAnswer(geminiBridge, args) {
  // Flash 모델 + 헤드리스 모드로 빠른 응답
  const result = await geminiBridge.chat(args.question, {
    model: 'gemini-2.0-flash',
    headless: true,
    timeout: 10000
  });
  
  return {
    content: [{
      type: 'text',
      text: result
    }]
  };
}

async function handleCodeReview(geminiBridge, args) {
  // 코드 리뷰용 프롬프트 구성
  const focusMap = {
    security: '보안 취약점',
    performance: '성능 이슈',
    readability: '가독성 및 유지보수성',
    all: '전반적인 품질'
  };
  
  const focus = focusMap[args.focus] || focusMap.all;
  const prompt = `다음 코드를 ${focus} 관점에서 리뷰해주세요:\n\n\`\`\`\n${args.code}\n\`\`\``;
  
  // Pro 모델로 심층 분석
  const result = await geminiBridge.chat(prompt, {
    model: 'gemini-2.5-pro',
    timeout: 45000
  });
  
  return {
    content: [{
      type: 'text',
      text: result
    }]
  };
}

async function handleAnalyze(geminiBridge, args) {
  // 분석 깊이에 따른 설정
  const depthSettings = {
    quick: { model: 'gemini-2.0-flash', timeout: 15000 },
    standard: { model: 'auto', timeout: 30000 },
    deep: { model: 'gemini-2.5-pro', timeout: 60000 }
  };
  
  const settings = depthSettings[args.depth || 'standard'];
  const result = await geminiBridge.chat(args.content, settings);
  
  return {
    content: [{
      type: 'text',
      text: result
    }]
  };
}

async function handleBatch(geminiBridge, args) {
  const results = [];
  const model = args.model || 'auto';
  
  for (const [index, prompt] of args.prompts.entries()) {
    try {
      console.error(`[배치 처리] ${index + 1}/${args.prompts.length}: ${prompt.substring(0, 50)}...`);
      
      const result = await geminiBridge.chatAdvanced(prompt, { model });
      results.push({
        index,
        prompt: prompt.substring(0, 100) + (prompt.length > 100 ? '...' : ''),
        success: true,
        response: result
      });
      
      // 요청 간 짧은 대기
      if (index < args.prompts.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      results.push({
        index,
        prompt: prompt.substring(0, 100) + (prompt.length > 100 ? '...' : ''),
        success: false,
        error: error.message
      });
    }
  }
  
  return {
    content: [{
      type: 'text',
      text: JSON.stringify(results, null, 2)
    }]
  };
}

async function handleStats(geminiBridge) {
  const stats = await geminiBridge.getStats();
  
  // 포맷팅된 통계 출력
  const formatted = formatStats(stats);
  
  return {
    content: [{
      type: 'text',
      text: formatted
    }]
  };
}

function formatStats(stats) {
  if (stats.error) {
    return `통계 조회 실패: ${stats.error}\n\n폴백 데이터:\n${JSON.stringify(stats.fallback, null, 2)}`;
  }
  
  const gemini = stats.geminiCLI || {};
  const mcp = stats.mcp || {};
  
  return `
=== Gemini CLI 통계 ===
사용량: ${gemini.used || 'N/A'} / ${gemini.limit || 'N/A'}
남은 횟수: ${gemini.remaining || 'N/A'}

=== MCP 브릿지 통계 ===
오늘 사용: ${mcp.usage?.current || 0} / ${mcp.usage?.limit || 1000}
사용률: ${mcp.usage?.percent || 0}%
평균 응답시간: ${mcp.performance?.averageResponseTime || 0}ms
성공률: ${mcp.performance?.successRate || 0}%

=== 모델 추천 ===
권장 모델: ${mcp.models?.recommendations?.primary || 'auto'}
이유: ${mcp.models?.recommendations?.reason || 'N/A'}

=== 캐시 성능 ===
적중률: ${mcp.cache?.hitRate || 'N/A'}
캐시 크기: ${mcp.cache?.size || 0}

업타임: ${Math.floor((mcp.uptime || 0) / 60)}분
`.trim();
}

async function handleClear(geminiBridge) {
  const result = await geminiBridge.clearContext();
  return {
    content: [{
      type: 'text',
      text: result
    }]
  };
}

async function handleContextInfo(geminiBridge) {
  try {
    const context = await geminiBridge.initialize();
    
    const contextInfo = `
=== Gemini CLI Bridge v3.0 컨텍스트 정보 ===

🔍 호출 환경:
  - 호출자: ${context.caller}
  - 대상: ${context.target}  
  - 확신도: ${context.confidence}
  - PowerShell: ${context.isPowerShell ? '✅' : '❌'}

⚡ 실행 전략:
  - 현재: ${context.executionStrategy}
  - 권장: ${context.recommendations?.join(', ') || 'N/A'}

🚀 v3.0 새 기능:
  - --prompt 플래그 사용 (성능 향상)
  - 자동 모델 선택 (프롬프트 분석)
  - Pro → Flash 자동 폴백
  - 작업별 최적화 도구

💡 사용 팁:
  - 간단한 질문: gemini_quick_answer
  - 코드 리뷰: gemini_code_review
  - 복잡한 분석: gemini_analyze
`.trim();

    return {
      content: [{
        type: 'text',
        text: contextInfo
      }]
    };
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `컨텍스트 정보 조회 실패: ${error.message}`
      }]
    };
  }
}

async function handleUsageDashboard(geminiBridge) {
  try {
    const dashboard = geminiBridge.getUsageDashboard();
    
    const formatted = `
=== Gemini CLI 사용량 대시보드 ===

📊 사용량:
  - 오늘: ${dashboard.usage.current} / ${dashboard.usage.limit}
  - 남은 횟수: ${dashboard.usage.remaining}
  - 사용률: ${dashboard.usage.percent}%

⚡ 성능:
  - 평균 응답: ${dashboard.performance.averageResponseTime}ms
  - 성공률: ${dashboard.performance.successRate}%

🎯 모델 추천:
  - 권장: ${dashboard.modelRecommendation.primary}
  - 이유: ${dashboard.modelRecommendation.reason}

💾 캐시:
  - 적중률: ${dashboard.cache.hitRate || 'N/A'}
  - 크기: ${dashboard.cache.size}

⏰ 다음 리셋: ${dashboard.nextReset}
`.trim();
    
    return {
      content: [{
        type: 'text',
        text: formatted
      }]
    };
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `대시보드 조회 실패: ${error.message}`
      }]
    };
  }
}

// 기존 핸들러들도 유지
async function handleChatFlash(geminiBridge, args) {
  const result = await geminiBridge.chat(args.prompt, { 
    model: 'gemini-2.0-flash',
    headless: true 
  });
  
  return {
    content: [{
      type: 'text',
      text: typeof result === 'string' ? result : JSON.stringify(result)
    }]
  };
}

async function handleChatPro(geminiBridge, args) {
  const result = await geminiBridge.chat(args.prompt, { 
    model: 'gemini-2.5-pro' 
  });
  
  return {
    content: [{
      type: 'text',
      text: typeof result === 'string' ? result : JSON.stringify(result)
    }]
  };
}