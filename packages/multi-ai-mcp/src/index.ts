/**
 * Multi-AI MCP Server v3.6.0
 *
 * Pure infrastructure layer for AI communication
 * Integrates Codex, Gemini, and Qwen CLI tools for Claude Code
 * Uses Stdio transport for WSL environment compatibility
 *
 * v3.4.0: Unified 300s timeout for all AIs (communication failure detection)
 * v3.5.0: Added stderr passthrough for AI CLI warnings and error details
 * v3.6.0: Enhanced timeout safety margins (Codex 240s, Gemini/Qwen 420s)
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
import type { ProgressCallback } from './types.js';
import { recordBasicHistory, getRecentBasicHistory } from './history/basic.js';

/**
 * Progress callback factory for AI operations
 * Sends MCP progress notifications to prevent client timeout
 *
 * @param progressToken - Optional token from request._meta.progressToken
 * @returns ProgressCallback function
 */
const createProgressCallback = (progressToken?: string): ProgressCallback => {
  return (provider, status, elapsed) => {
    const elapsedSeconds = Math.floor(elapsed / 1000);

    // Log to stderr (does not interfere with stdout MCP protocol)
    console.error(`[${provider.toUpperCase()}] ${status} (${elapsedSeconds}초)`);

    // Send MCP progress notification to prevent client timeout
    if (progressToken) {
      try {
        server.notification({
          method: 'notifications/progress',
          params: {
            progressToken,
            progress: elapsedSeconds,
            total: 120, // Estimated max seconds
          },
        });
      } catch (error) {
        // Progress notification is best-effort, don't fail on error
        console.error(`[Progress] Failed to send notification:`, error);
      }
    }
  };
};

// MCP Server instance
const server = new Server(
  {
    name: 'multi-ai',
    version: '3.5.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Tool definitions
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'queryCodex',
        description: 'Query Codex AI (실무 전문: 버그 수정, 프로토타입, 실용적 해결책)',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'The query to send to Codex',
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'queryGemini',
        description: 'Query Gemini AI (아키텍처 전문: SOLID 원칙, 시스템 설계, 리팩토링)',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'The query to send to Gemini',
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'queryQwen',
        description: 'Query Qwen AI (성능 전문: 최적화, 병목점 분석, 확장성)',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'The query to send to Qwen',
            },
            planMode: {
              type: 'boolean',
              description: 'Enable Plan Mode for safer, slower processing (recommended for complex queries)',
              default: true,
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'getBasicHistory',
        description: 'Get recent AI query history (basic metadata only)',
        inputSchema: {
          type: 'object',
          properties: {
            limit: {
              type: 'number',
              description: 'Number of recent records to retrieve (default: 10)',
              default: 10,
            },
          },
        },
      },
    ],
  };
});

// Tool handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  // Extract progressToken from request metadata
  const progressToken = (request.params as any)._meta?.progressToken as string | undefined;
  const onProgress = createProgressCallback(progressToken);

  try {
    switch (name) {
      case 'queryCodex': {
        const { query } = args as { query: string };

        const startTime = Date.now();
        const result = await queryCodex(query, onProgress);

        // Record history
        await recordBasicHistory(
          'codex',
          query,
          result.success,
          result.responseTime,
          result.error
        );

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'queryGemini': {
        const { query } = args as { query: string };

        const startTime = Date.now();
        const result = await queryGemini(query, onProgress);

        // Record history
        await recordBasicHistory(
          'gemini',
          query,
          result.success,
          result.responseTime,
          result.error
        );

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'queryQwen': {
        const { query, planMode = true } = args as { query: string; planMode?: boolean };

        const startTime = Date.now();
        const result = await queryQwen(query, planMode, onProgress);

        // Record history
        await recordBasicHistory(
          'qwen',
          query,
          result.success,
          result.responseTime,
          result.error
        );

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'getBasicHistory': {
        const { limit = 10 } = args as { limit?: number };
        const history = await getRecentBasicHistory(limit);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(history, null, 2),
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
  console.error('Multi-AI MCP Server v3.6.0 running on stdio');
  console.error('Available tools: queryCodex, queryGemini, queryQwen, getBasicHistory');
  console.error('v3.6.0: Enhanced timeout safety margins (Codex 240s, Gemini/Qwen 420s)');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
