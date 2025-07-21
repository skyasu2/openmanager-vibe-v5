/**
 * 🎯 MCP 도구 처리기 v1.0
 *
 * 담당 기능:
 * - MCP 도구 호출 및 관리
 * - 파일 시스템 작업 (읽기, 쓰기, 검색)
 * - 웹 검색 및 문서 검색
 * - 도구 목록 관리
 */

import * as fs from 'fs';
import * as path from 'path';
import type { MCPClient, MCPToolResult } from '@/types/mcp';

interface MCPSearchResult {
  success: boolean;
  results: any[];
  source: string;
  tools_used: string[];
  responseTime?: number;
  serverUsed?: string;
}

export class MCPToolHandler {
  private tools: Map<string, any> = new Map();

  constructor() {
    this.initializeTools();
  }

  /**
   * 🔧 도구 초기화
   */
  private initializeTools(): void {
    const defaultTools = [
      {
        name: 'read_file',
        description: '파일 내용을 읽습니다',
        schema: {
          type: 'object',
          properties: {
            path: { type: 'string', description: '읽을 파일의 경로' },
          },
          required: ['path'],
        },
      },
      {
        name: 'list_directory',
        description: '디렉토리 내용을 나열합니다',
        schema: {
          type: 'object',
          properties: {
            path: { type: 'string', description: '나열할 디렉토리 경로' },
          },
          required: ['path'],
        },
      },
      {
        name: 'search_files',
        description: '파일을 검색합니다',
        schema: {
          type: 'object',
          properties: {
            pattern: { type: 'string', description: '검색할 패턴' },
            content: { type: 'string', description: '검색할 내용' },
          },
        },
      },
    ];

    defaultTools.forEach(tool => {
      this.tools.set(tool.name, tool);
    });

    console.log(`🔧 ${this.tools.size}개 도구 초기화 완료`);
  }

  /**
   * 📋 사용 가능한 도구 목록 조회
   */
  async getAvailableTools(): Promise<{ tools: any[] }> {
    const toolsList = Array.from(this.tools.values());

    console.log(
      `📋 사용 가능한 도구 ${toolsList.length}개:`,
      toolsList.map(t => t.name).join(', ')
    );

    return {
      tools: toolsList,
    };
  }

  /**
   * 🔧 도구 호출 처리
   */
  private async handleToolCall(params: any): Promise<any> {
    const { name, arguments: args } = params;

    console.log(`🔧 도구 호출: ${name}`, args);

    switch (name) {
      case 'search_files':
        return await this.realSearchFiles(args);
      case 'read_file':
        return await this.realReadFile(args.path);
      case 'list_directory':
        return await this.realListDirectory(args.path);
      default:
        throw new Error(`알 수 없는 도구: ${name}`);
    }
  }

  /**
   * 🔍 실제 파일 검색
   */
  private async realSearchFiles(args: {
    pattern?: string;
    content?: string;
  }): Promise<any> {
    const { pattern, content } = args;
    const startTime = Date.now();

    try {
      const results: any[] = [];
      const searchDirs = ['src', 'docs'];

      for (const dir of searchDirs) {
        if (fs.existsSync(dir)) {
          await this.searchInDirectory(dir, pattern, content, results);
        }
      }

      const responseTime = Date.now() - startTime;

      console.log(
        `🔍 파일 검색 완료: ${results.length}개 결과 (${responseTime}ms)`
      );

      return {
        success: true,
        results: results.slice(0, 50), // 최대 50개 결과
        total: results.length,
        searchTime: responseTime,
        query: { pattern, content },
      };
    } catch (error) {
      console.error('❌ 파일 검색 실패:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '검색 실패',
        results: [],
      };
    }
  }

  /**
   * 📁 디렉토리 내 검색
   */
  private async searchInDirectory(
    dirPath: string,
    pattern?: string,
    content?: string,
    results: any[] = []
  ): Promise<void> {
    try {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);

        if (entry.isDirectory()) {
          // 재귀적으로 하위 디렉토리 검색
          if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
            await this.searchInDirectory(fullPath, pattern, content, results);
          }
        } else if (entry.isFile()) {
          // 파일명 패턴 매칭
          if (pattern && entry.name.includes(pattern)) {
            results.push({
              type: 'file',
              path: fullPath,
              name: entry.name,
              matchType: 'filename',
            });
          }

          // 파일 내용 검색
          if (content && this.isTextFile(entry.name)) {
            try {
              const fileContent = fs.readFileSync(fullPath, 'utf-8');
              if (fileContent.includes(content)) {
                results.push({
                  type: 'file',
                  path: fullPath,
                  name: entry.name,
                  matchType: 'content',
                  preview: this.getContentPreview(fileContent, content),
                });
              }
            } catch {
              // 파일 읽기 실패 시 무시
            }
          }
        }
      }
    } catch (error) {
      console.warn(`⚠️ 디렉토리 검색 실패: ${dirPath}`, error);
    }
  }

  /**
   * 📄 텍스트 파일 여부 확인
   */
  private isTextFile(filename: string): boolean {
    const textExtensions = [
      '.ts',
      '.tsx',
      '.js',
      '.jsx',
      '.md',
      '.txt',
      '.json',
      '.css',
      '.html',
    ];
    return textExtensions.some(ext => filename.endsWith(ext));
  }

  /**
   * 👀 내용 미리보기 생성
   */
  private getContentPreview(content: string, searchTerm: string): string {
    const lines = content.split('\n');
    const matchingLines = lines
      .map((line, index) => ({ line, index }))
      .filter(({ line }) => line.includes(searchTerm))
      .slice(0, 3)
      .map(({ line, index }) => `${index + 1}: ${line.trim()}`)
      .join('\n');

    return matchingLines;
  }

  /**
   * 📖 실제 파일 읽기
   */
  private async realReadFile(filePath: string): Promise<any> {
    const startTime = Date.now();

    try {
      if (!fs.existsSync(filePath)) {
        throw new Error(`파일을 찾을 수 없습니다: ${filePath}`);
      }

      const content = fs.readFileSync(filePath, 'utf-8');
      const responseTime = Date.now() - startTime;

      console.log(`📖 파일 읽기 완료: ${filePath} (${responseTime}ms)`);

      return {
        success: true,
        content,
        path: filePath,
        size: content.length,
        readTime: responseTime,
      };
    } catch (error) {
      console.error(`❌ 파일 읽기 실패: ${filePath}`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '파일 읽기 실패',
        path: filePath,
      };
    }
  }

  /**
   * 📁 실제 디렉토리 나열
   */
  private async realListDirectory(dirPath: string): Promise<any> {
    const startTime = Date.now();

    try {
      if (!fs.existsSync(dirPath)) {
        throw new Error(`디렉토리를 찾을 수 없습니다: ${dirPath}`);
      }

      const entries = fs.readdirSync(dirPath, { withFileTypes: true });
      const items = entries.map(entry => ({
        name: entry.name,
        type: entry.isDirectory() ? 'directory' : 'file',
        path: path.join(dirPath, entry.name),
      }));

      const responseTime = Date.now() - startTime;

      console.log(
        `📁 디렉토리 나열 완료: ${dirPath} (${items.length}개 항목, ${responseTime}ms)`
      );

      return {
        success: true,
        items,
        path: dirPath,
        count: items.length,
        listTime: responseTime,
      };
    } catch (error) {
      console.error(`❌ 디렉토리 나열 실패: ${dirPath}`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '디렉토리 나열 실패',
        path: dirPath,
      };
    }
  }

  /**
   * 🔧 서버별 도구 목록 조회
   */
  async listTools(
    serverName: string,
    clients: Map<string, MCPClient>
  ): Promise<any[]> {
    try {
      const client = clients.get(serverName);
      if (!client) {
        console.warn(`⚠️ 서버 클라이언트를 찾을 수 없습니다: ${serverName}`);
        return Array.from(this.tools.values());
      }

      // 실제 서버에서 도구 목록 조회 시도
      try {
        const response = await client.request({
          method: 'tools/list',
          params: {},
        });

        console.log(
          `📋 ${serverName} 서버 도구 목록:`,
          response.result?.tools?.length || 0
        );
        return response.result?.tools || [];
      } catch {
        console.warn(
          `⚠️ ${serverName} 서버 도구 목록 조회 실패, 기본 도구 반환`
        );
        return Array.from(this.tools.values());
      }
    } catch (error) {
      console.error(`❌ 도구 목록 조회 실패: ${serverName}`, error);
      return [];
    }
  }

  /**
   * 🔧 도구 호출 실행
   */
  async callTool(
    serverName: string,
    toolName: string,
    args: Record<string, unknown>,
    clients: Map<string, MCPClient>
  ): Promise<MCPToolResult> {
    const startTime = Date.now();

    try {
      console.log(`🔧 도구 호출 시작: ${serverName}.${toolName}`);

      const client = clients.get(serverName);
      if (!client) {
        // 클라이언트가 없으면 로컬 처리
        return await this.handleToolCall({ name: toolName, arguments: args });
      }

      try {
        const response = await client.request({
          method: 'tools/call',
          params: {
            name: toolName,
            arguments: args,
          },
        });

        const responseTime = Date.now() - startTime;
        console.log(`✅ 도구 호출 완료: ${toolName} (${responseTime}ms)`);

        return {
          success: response.success,
          content: response.result?.content,
          error: response.error?.message,
          metadata: {
            ...response.result?.data,
            serverUsed: serverName,
            responseTime,
          },
        };
      } catch {
        console.warn(`⚠️ 서버 도구 호출 실패, 로컬 처리: ${toolName}`);
        return await this.handleToolCall({ name: toolName, arguments: args });
      }
    } catch (error) {
      console.error(`❌ 도구 호출 실패: ${toolName}`, error);
      throw error;
    }
  }

  /**
   * 🔍 문서 검색
   */
  async searchDocuments(query: string): Promise<MCPSearchResult> {
    const startTime = Date.now();

    try {
      console.log(`🔍 문서 검색 시작: "${query}"`);

      const searchResult = await this.realSearchFiles({
        pattern: query,
        content: query,
      });

      const responseTime = Date.now() - startTime;

      return {
        success: searchResult.success,
        results: searchResult.results || [],
        source: 'local_filesystem',
        tools_used: ['search_files'],
        responseTime,
      };
    } catch (error) {
      console.error('❌ 문서 검색 실패:', error);
      return {
        success: false,
        results: [],
        source: 'local_filesystem',
        tools_used: ['search_files'],
        responseTime: Date.now() - startTime,
      };
    }
  }

  /**
   * 🌐 웹 검색 (목업)
   */
  async searchWeb(query: string): Promise<MCPSearchResult> {
    const startTime = Date.now();

    try {
      console.log(`🌐 웹 검색 시작: "${query}"`);

      // 목업 웹 검색 결과
      const mockResults = [
        {
          title: `${query} 관련 문서`,
          url: `https://example.com/search?q=${encodeURIComponent(query)}`,
          snippet: `${query}에 대한 상세한 정보를 제공합니다.`,
          source: 'web',
        },
        {
          title: `${query} 가이드`,
          url: `https://docs.example.com/${query.toLowerCase()}`,
          snippet: `${query} 사용법과 예제를 포함한 완전한 가이드입니다.`,
          source: 'web',
        },
      ];

      const responseTime = Date.now() - startTime;

      console.log(
        `✅ 웹 검색 완료: ${mockResults.length}개 결과 (${responseTime}ms)`
      );

      return {
        success: true,
        results: mockResults,
        source: 'web_search',
        tools_used: ['web_search'],
        responseTime,
      };
    } catch (error) {
      console.error('❌ 웹 검색 실패:', error);
      return {
        success: false,
        results: [],
        source: 'web_search',
        tools_used: ['web_search'],
        responseTime: Date.now() - startTime,
      };
    }
  }

  /**
   * 🔧 도구 추가
   */
  addTool(name: string, tool: any): void {
    this.tools.set(name, { name, ...tool });
    console.log(`🔧 도구 추가됨: ${name}`);
  }

  /**
   * 🗑️ 도구 제거
   */
  removeTool(name: string): boolean {
    const removed = this.tools.delete(name);
    if (removed) {
      console.log(`🗑️ 도구 제거됨: ${name}`);
    }
    return removed;
  }

  /**
   * 📊 도구 사용 통계
   */
  getToolStats(): any {
    return {
      totalTools: this.tools.size,
      availableTools: Array.from(this.tools.keys()),
      lastUpdate: new Date().toISOString(),
    };
  }
}
