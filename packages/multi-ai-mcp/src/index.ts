/**
 * Multi-AI MCP Server
 *
 * Integrates Codex, Gemini, and Qwen CLI tools for Claude Code
 * Uses Stdio transport for WSL environment compatibility
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError
} from '@modelcontextprotocol/sdk/types.js';

import { queryCodex } from './ai-clients/codex.js';
import { queryGemini } from './ai-clients/gemini.js';
import { queryQwen } from './ai-clients/qwen.js';
import { synthesizeResults } from './synthesizer.js';
import type { AIQueryRequest, AIResponse } from './types.js';

// MCP Server instance
const server = new Server(
  {
    name: 'multi-ai',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Tool 1: Query all AIs in parallel
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'queryAllAIs',
        description: 'Query Codex, Gemini, and Qwen in parallel and synthesize results',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'The query to send to all AI assistants',
            },
            qwenPlanMode: {
              type: 'boolean',
              description: 'Enable Qwen Plan Mode (safer, 60s timeout)',
              default: true,
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'queryWithPriority',
        description: 'Query specific AI(s) based on priority',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'The query to send',
            },
            includeCodex: {
              type: 'boolean',
              description: 'Include Codex (실무 전문)',
              default: true,
            },
            includeGemini: {
              type: 'boolean',
              description: 'Include Gemini (아키텍처 전문)',
              default: true,
            },
            includeQwen: {
              type: 'boolean',
              description: 'Include Qwen (성능 전문)',
              default: true,
            },
            qwenPlanMode: {
              type: 'boolean',
              description: 'Qwen Plan Mode',
              default: true,
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'getPerformanceStats',
        description: 'Get performance statistics from last query',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ],
  };
});

// Performance tracking
let lastQueryStats: {
  totalTime: number;
  successRate: number;
  breakdown: Record<string, number>;
} | null = null;

// Tool handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'queryAllAIs': {
        const { query, qwenPlanMode = true } = args as unknown as AIQueryRequest;

        // Execute all AIs in parallel
        const startTime = Date.now();
        const [codexResult, geminiResult, qwenResult] = await Promise.allSettled([
          queryCodex(query),
          queryGemini(query),
          queryQwen(query, qwenPlanMode),
        ]);

        // Extract results
        const codex = codexResult.status === 'fulfilled' ? codexResult.value : undefined;
        const gemini = geminiResult.status === 'fulfilled' ? geminiResult.value : undefined;
        const qwen = qwenResult.status === 'fulfilled' ? qwenResult.value : undefined;

        // Synthesize results
        const synthesis = synthesizeResults(query, codex, gemini, qwen);

        // Update performance stats
        lastQueryStats = {
          totalTime: synthesis.performance.totalTime,
          successRate: synthesis.performance.successRate,
          breakdown: {
            codex: codex?.responseTime || 0,
            gemini: gemini?.responseTime || 0,
            qwen: qwen?.responseTime || 0,
          },
        };

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(synthesis, null, 2),
            },
          ],
        };
      }

      case 'queryWithPriority': {
        const {
          query,
          includeCodex = true,
          includeGemini = true,
          includeQwen = true,
          qwenPlanMode = true,
        } = args as unknown as AIQueryRequest;

        // Execute selected AIs in parallel
        const promises: Promise<AIResponse>[] = [];
        if (includeCodex) promises.push(queryCodex(query));
        if (includeGemini) promises.push(queryGemini(query));
        if (includeQwen) promises.push(queryQwen(query, qwenPlanMode));

        const results = await Promise.allSettled(promises);

        // Extract successful results
        const responses = results
          .filter((r): r is PromiseFulfilledResult<AIResponse> => r.status === 'fulfilled')
          .map((r) => r.value);

        // Identify which AIs were used
        const codex = responses.find((r) => r.provider === 'codex');
        const gemini = responses.find((r) => r.provider === 'gemini');
        const qwen = responses.find((r) => r.provider === 'qwen');

        // Synthesize results
        const synthesis = synthesizeResults(query, codex, gemini, qwen);

        // Update performance stats
        lastQueryStats = {
          totalTime: synthesis.performance.totalTime,
          successRate: synthesis.performance.successRate,
          breakdown: {
            ...(codex && { codex: codex.responseTime }),
            ...(gemini && { gemini: gemini.responseTime }),
            ...(qwen && { qwen: qwen.responseTime }),
          },
        };

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(synthesis, null, 2),
            },
          ],
        };
      }

      case 'getPerformanceStats': {
        if (!lastQueryStats) {
          return {
            content: [
              {
                type: 'text',
                text: 'No query has been executed yet.',
              },
            ],
          };
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(lastQueryStats, null, 2),
            },
          ],
        };
      }

      default:
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Unknown tool: ${name}`
        );
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new McpError(
      ErrorCode.InternalError,
      `Tool execution failed: ${errorMessage}`
    );
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Log server start (to stderr, not stdout)
  console.error('Multi-AI MCP Server running on stdio');
  console.error('Available tools: queryAllAIs, queryWithPriority, getPerformanceStats');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
