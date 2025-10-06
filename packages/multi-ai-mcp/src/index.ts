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
import type { AIQueryRequest, AIResponse, ProgressCallback } from './types.js';
import { recordVerification, getRecentHistory, searchHistory, getHistoryStats } from './history/manager.js';
import { analyzeQuery, getAnalysisSummary, shouldUseQwenPlanMode } from './utils/query-analyzer.js';
import { autoSplit, getSplitSummary } from './utils/query-splitter.js';

/**
 * Progress callback for AI operations
 * Logs progress updates to stderr (does not interfere with stdout MCP protocol)
 */
const onProgress: ProgressCallback = (provider, status, elapsed) => {
  console.error(`[${provider.toUpperCase()}] ${status} (${Math.floor(elapsed / 1000)}초)`);
};

// MCP Server instance
const server = new Server(
  {
    name: 'multi-ai',
    version: '1.6.0',
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
      {
        name: 'getHistory',
        description: 'Get recent AI cross-verification history',
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
      {
        name: 'searchHistory',
        description: 'Search AI cross-verification history by query pattern',
        inputSchema: {
          type: 'object',
          properties: {
            pattern: {
              type: 'string',
              description: 'Search pattern to match against queries',
            },
          },
          required: ['pattern'],
        },
      },
      {
        name: 'getHistoryStats',
        description: 'Get AI cross-verification statistics',
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
        const { query: originalQuery, qwenPlanMode = true } = args as unknown as AIQueryRequest;

        // 🔍 STEP 1: Analyze query complexity
        const analysis = analyzeQuery(originalQuery);
        console.error('📊 Query Analysis:', getAnalysisSummary(analysis));

        // 📝 STEP 2: Auto-split if needed (preserves information)
        const { subQueries, wasSplit, strategy } = autoSplit(originalQuery, analysis);
        if (wasSplit) {
          console.error(`✂️ Query Auto-Split: ${subQueries.length} sub-queries (${strategy})`);
        }

        // Use first sub-query (or original if not split)
        const processedQuery = subQueries[0];

        // 🤖 STEP 3: Auto-select Qwen mode based on complexity
        const autoQwenPlanMode = qwenPlanMode ?? shouldUseQwenPlanMode(analysis);
        if (autoQwenPlanMode !== qwenPlanMode) {
          console.error(`🔧 Qwen mode auto-adjusted: ${qwenPlanMode} → ${autoQwenPlanMode}`);
        }

        // Execute all AIs in parallel with progress notifications
        const startTime = Date.now();
        const [codexResult, geminiResult, qwenResult] = await Promise.allSettled([
          queryCodex(processedQuery, onProgress),
          queryGemini(processedQuery, onProgress),
          queryQwen(processedQuery, autoQwenPlanMode, onProgress),
        ]);

        // Extract results
        const codex = codexResult.status === 'fulfilled' ? codexResult.value : undefined;
        const gemini = geminiResult.status === 'fulfilled' ? geminiResult.value : undefined;
        const qwen = qwenResult.status === 'fulfilled' ? qwenResult.value : undefined;

        // Synthesize results
        const synthesis = synthesizeResults(processedQuery, codex, gemini, qwen);

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

        // Record verification history
        await recordVerification(
          { query: originalQuery, qwenPlanMode: autoQwenPlanMode, includeCodex: true, includeGemini: true, includeQwen: true },
          codex,
          gemini,
          qwen,
          {
            consensus: synthesis.synthesis.consensus,
            conflicts: synthesis.synthesis.conflicts,
            totalTime: synthesis.performance.totalTime,
            successRate: synthesis.performance.successRate,
          }
        );

        // 📊 STEP 4: Add query analysis metadata to response
        const responseWithMetadata = {
          ...synthesis,
          queryMetadata: {
            original: originalQuery,
            processed: processedQuery,
            wasSplit,
            splitStrategy: strategy,
            subQueriesCount: subQueries.length,
            analysis: {
              complexity: analysis.complexity,
              length: analysis.length,
              estimatedTokens: analysis.estimatedTokens,
              suggestedTimeouts: analysis.suggestedTimeouts,
            },
          },
        };

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(responseWithMetadata, null, 2),
            },
          ],
        };
      }

      case 'queryWithPriority': {
        const {
          query: originalQuery,
          includeCodex = true,
          includeGemini = true,
          includeQwen = true,
          qwenPlanMode = true,
        } = args as unknown as AIQueryRequest;

        // 🔍 STEP 1: Analyze query complexity
        const analysis = analyzeQuery(originalQuery);
        console.error('📊 Query Analysis:', getAnalysisSummary(analysis));

        // 📝 STEP 2: Auto-split if needed (preserves information)
        const { subQueries, wasSplit, strategy } = autoSplit(originalQuery, analysis);
        if (wasSplit) {
          console.error(`✂️ Query Auto-Split: ${subQueries.length} sub-queries (${strategy})`);
        }

        // Use first sub-query (or original if not split)
        const processedQuery = subQueries[0];

        // 🤖 STEP 3: Auto-select Qwen mode based on complexity
        const autoQwenPlanMode = qwenPlanMode ?? shouldUseQwenPlanMode(analysis);
        if (autoQwenPlanMode !== qwenPlanMode) {
          console.error(`🔧 Qwen mode auto-adjusted: ${qwenPlanMode} → ${autoQwenPlanMode}`);
        }

        // Execute selected AIs in parallel with progress notifications
        const promises: Promise<AIResponse>[] = [];
        if (includeCodex) promises.push(queryCodex(processedQuery, onProgress));
        if (includeGemini) promises.push(queryGemini(processedQuery, onProgress));
        if (includeQwen) promises.push(queryQwen(processedQuery, autoQwenPlanMode, onProgress));

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
        const synthesis = synthesizeResults(processedQuery, codex, gemini, qwen);

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

        // Record verification history
        await recordVerification(
          { query: originalQuery, qwenPlanMode, includeCodex, includeGemini, includeQwen },
          codex,
          gemini,
          qwen,
          {
            consensus: synthesis.synthesis.consensus,
            conflicts: synthesis.synthesis.conflicts,
            totalTime: synthesis.performance.totalTime,
            successRate: synthesis.performance.successRate,
          }
        );

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

      case 'getHistory': {
        const { limit = 10 } = args as { limit?: number };
        const history = await getRecentHistory(limit);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(history, null, 2),
            },
          ],
        };
      }

      case 'searchHistory': {
        const { pattern } = args as { pattern: string };
        const results = await searchHistory(pattern);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(results, null, 2),
            },
          ],
        };
      }

      case 'getHistoryStats': {
        const stats = await getHistoryStats();

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(stats, null, 2),
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
