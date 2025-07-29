/**
 * MCP Handler - Model Context Protocol Handler for Next.js API Routes
 *
 * This is a simple implementation for handling MCP-style tool calls
 * in Next.js API routes.
 */

export interface MCPTool {
  name: string;
  description: string;
  parameters: any;
  handler: (args: any, extra: any) => Promise<any>;
}

export interface MCPServer {
  tools: Map<string, MCPTool>;

  tool(
    name: string,
    description: string,
    parameters: any,
    handler: (args: any, extra: any) => Promise<any>
  ): void;
}

export function createMcpHandler(setupFn: (server: MCPServer) => void) {
  const server: MCPServer = {
    tools: new Map(),

    tool(name, description, parameters, handler) {
      this.tools.set(name, {
        name,
        description,
        parameters,
        handler,
      });
    },
  };

  // Initialize tools
  setupFn(server);

  // Return Next.js API handler
  return {
    async POST(request: Request) {
      try {
        const body = await request.json();
        const { tool, args = {} } = body;

        if (!tool) {
          return new Response(
            JSON.stringify({ error: 'Tool name is required' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }

        const mcpTool = server.tools.get(tool);
        if (!mcpTool) {
          return new Response(
            JSON.stringify({ error: `Unknown tool: ${tool}` }),
            { status: 404, headers: { 'Content-Type': 'application/json' } }
          );
        }

        // Execute tool
        const result = await mcpTool.handler(args, {});

        return new Response(JSON.stringify({ success: true, result }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (error) {
        console.error('MCP handler error:', error);
        return new Response(
          JSON.stringify({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : String(error),
          }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
    },

    async GET() {
      // List available tools
      const tools = Array.from(server.tools.values()).map(tool => ({
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
      }));

      return new Response(JSON.stringify({ tools }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    },
  };
}

export default createMcpHandler;
