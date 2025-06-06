#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import fs from 'fs';
import path from 'path';

class OpenManagerMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'openmanager-mcp-server',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'read_project_file',
            description: 'Read a file from the project directory',
            inputSchema: {
              type: 'object',
              properties: {
                path: {
                  type: 'string',
                  description: 'Path to the file relative to project root',
                },
              },
              required: ['path'],
            },
          },
          {
            name: 'list_project_directory',
            description: 'List contents of a project directory',
            inputSchema: {
              type: 'object',
              properties: {
                path: {
                  type: 'string',
                  description: 'Path to the directory relative to project root',
                },
              },
              required: ['path'],
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async request => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'read_project_file':
            return await this.readProjectFile(args.path);
          case 'list_project_directory':
            return await this.listProjectDirectory(args.path);
          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }
      } catch (error) {
        throw new McpError(
          ErrorCode.InternalError,
          `Error executing tool ${name}: ${error.message}`
        );
      }
    });
  }

  async readProjectFile(relativePath) {
    const projectRoot =
      process.env.PROJECT_ROOT || path.join(process.cwd(), '..');
    const fullPath = path.resolve(projectRoot, relativePath);

    // Security check to ensure path is within project
    if (!fullPath.startsWith(path.resolve(projectRoot))) {
      throw new Error('Access denied: Path outside project directory');
    }

    try {
      const content = fs.readFileSync(fullPath, 'utf-8');
      return {
        content: [
          {
            type: 'text',
            text: content,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to read file: ${error.message}`);
    }
  }

  async listProjectDirectory(relativePath) {
    const projectRoot =
      process.env.PROJECT_ROOT || path.join(process.cwd(), '..');
    const fullPath = path.resolve(projectRoot, relativePath);

    // Security check
    if (!fullPath.startsWith(path.resolve(projectRoot))) {
      throw new Error('Access denied: Path outside project directory');
    }

    try {
      const items = fs.readdirSync(fullPath, { withFileTypes: true });
      const listing = items.map(item => ({
        name: item.name,
        type: item.isDirectory() ? 'directory' : 'file',
      }));

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(listing, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to list directory: ${error.message}`);
    }
  }

  setupErrorHandling() {
    this.server.onerror = error => {
      console.error('[MCP Server Error]', error);
    };

    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('OpenManager MCP Server running on stdio');
  }
}

const server = new OpenManagerMCPServer();
server.run().catch(console.error);
