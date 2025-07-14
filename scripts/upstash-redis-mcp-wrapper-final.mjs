#!/usr/bin/env node

/**
 * Upstash Redis MCP Wrapper
 * 
 * @gongrzhe/server-redis-mcp의 SDK v0.4.0을 사용하여
 * Upstash Redis REST API를 지원하도록 수정한 래퍼
 */

import { Server } from "../node_modules/@modelcontextprotocol/sdk/dist/server/index.js";
import { StdioServerTransport } from "../node_modules/@modelcontextprotocol/sdk/dist/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "../node_modules/@modelcontextprotocol/sdk/dist/types.js";
import { z } from "zod";
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// 환경 변수 로드
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env.local') });

const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

if (!UPSTASH_REDIS_REST_URL || !UPSTASH_REDIS_REST_TOKEN) {
  console.error('Error: UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set');
  process.exit(1);
}

// Upstash Redis REST API 호출 헬퍼
async function callUpstashRedis(command, ...args) {
  const commandArgs = args.filter(arg => arg !== undefined);
  const url = commandArgs.length > 0
    ? `${UPSTASH_REDIS_REST_URL}/${command}/${commandArgs.map(encodeURIComponent).join('/')}`
    : `${UPSTASH_REDIS_REST_URL}/${command}`;

  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${UPSTASH_REDIS_REST_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Upstash Redis API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    return result.result !== undefined ? result.result : result;
  } catch (error) {
    console.error('Upstash Redis API call failed:', error);
    throw error;
  }
}

// Zod schemas for validation
const SetArgumentsSchema = z.object({
  key: z.string(),
  value: z.string(),
  expireSeconds: z.number().optional(),
});

const GetArgumentsSchema = z.object({
  key: z.string(),
});

const DeleteArgumentsSchema = z.object({
  key: z.string().or(z.array(z.string())),
});

const ListArgumentsSchema = z.object({
  pattern: z.string().default("*"),
});

// MCP 서버 생성 (SDK v0.4.0 방식)
const server = new Server(
  {
    name: "upstash-redis",
    version: "1.0.0"
  },
  {
    capabilities: {
      tools: {}
    }
  }
);

// 도구 목록 제공
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "set",
        description: "Set a Redis key-value pair with optional expiration",
        inputSchema: {
          type: "object",
          properties: {
            key: {
              type: "string",
              description: "Redis key",
            },
            value: {
              type: "string",
              description: "Value to store",
            },
            expireSeconds: {
              type: "number",
              description: "Optional expiration time in seconds",
            },
          },
          required: ["key", "value"],
        },
      },
      {
        name: "get",
        description: "Get value by key from Redis",
        inputSchema: {
          type: "object",
          properties: {
            key: {
              type: "string",
              description: "Redis key to retrieve",
            },
          },
          required: ["key"],
        },
      },
      {
        name: "delete",
        description: "Delete one or more keys from Redis",
        inputSchema: {
          type: "object",
          properties: {
            key: {
              oneOf: [
                { type: "string" },
                { type: "array", items: { type: "string" } }
              ],
              description: "Key or array of keys to delete",
            },
          },
          required: ["key"],
        },
      },
      {
        name: "list",
        description: "List Redis keys matching a pattern",
        inputSchema: {
          type: "object",
          properties: {
            pattern: {
              type: "string",
              description: "Pattern to match keys (default: *)",
            },
          },
        },
      },
    ],
  };
});

// 도구 호출 처리
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === "set") {
      const parsed = SetArgumentsSchema.parse(args);
      
      // EX 옵션으로 TTL 설정
      if (parsed.expireSeconds) {
        await callUpstashRedis('set', parsed.key, parsed.value, 'EX', parsed.expireSeconds.toString());
      } else {
        await callUpstashRedis('set', parsed.key, parsed.value);
      }
      
      return {
        content: [
          {
            type: "text",
            text: `✅ Key '${parsed.key}' set successfully${parsed.expireSeconds ? ` with TTL ${parsed.expireSeconds}s` : ''}`
          }
        ]
      };
    }

    if (name === "get") {
      const parsed = GetArgumentsSchema.parse(args);
      const value = await callUpstashRedis('get', parsed.key);
      
      if (value === null) {
        return {
          content: [
            {
              type: "text",
              text: `Key '${parsed.key}' not found`
            }
          ]
        };
      }
      
      return {
        content: [
          {
            type: "text",
            text: `${value}`
          }
        ]
      };
    }

    if (name === "delete") {
      const parsed = DeleteArgumentsSchema.parse(args);
      const keysToDelete = Array.isArray(parsed.key) ? parsed.key : [parsed.key];
      const result = await callUpstashRedis('del', ...keysToDelete);
      
      return {
        content: [
          {
            type: "text",
            text: `✅ Deleted ${result} key(s)`
          }
        ]
      };
    }

    if (name === "list") {
      const parsed = ListArgumentsSchema.parse(args);
      const keys = await callUpstashRedis('keys', parsed.pattern);
      
      if (!keys || keys.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: `No keys found matching pattern '${parsed.pattern}'`
            }
          ]
        };
      }
      
      return {
        content: [
          {
            type: "text",
            text: `Found ${keys.length} key(s):\n${keys.join('\n')}`
          }
        ]
      };
    }

    throw new Error(`Unknown tool: ${name}`);
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `❌ Error: ${error.message}`
        }
      ],
      isError: true
    };
  }
});

// 서버 시작
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Upstash Redis MCP server running...');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});