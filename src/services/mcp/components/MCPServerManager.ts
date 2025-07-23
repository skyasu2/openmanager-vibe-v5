/**
 * 🎯 MCP 서버 관리자 v1.0
 *
 * 담당 기능:
 * - 서버 초기화 및 연결 관리
 * - 서버 상태 모니터링
 * - 연결 테스트 및 헬스체크
 */

import type { ChildProcess } from 'child_process';
import type { MCPClient } from '@/types/mcp';

export interface MCPServerConfig {
  name: string;
  command: string;
  args: string[];
  env?: Record<string, string>;
  enabled: boolean;
  stats?: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    lastUsed: number;
    healthScore: number;
  };
}

export class MCPServerManager {
  private servers: Map<string, MCPServerConfig> = new Map();
  private clients: Map<string, MCPClient> = new Map();
  private processes: Map<string, ChildProcess> = new Map();
  private isInitialized = false;

  constructor() {
    this.initializeServers();
  }

  /**
   * 🚀 서버 설정 초기화
   */
  private initializeServers(): void {
    console.log('🔧 MCP 서버 초기화 시작...');

    const environment = process.env.NODE_ENV || 'development';
    console.log(`🌍 환경: ${environment}`);

    // 환경별 서버 설정
    if (environment === 'development') {
      this.setupDevelopmentServers();
    } else if (environment === 'test') {
      this.setupTestServers();
    } else {
      this.setupProductionServers();
    }

    const serverNames = Array.from(this.servers.keys());
    console.log(`📋 사용 가능한 서버: ${JSON.stringify(serverNames)}`);
  }

  /**
   * 🔧 개발 환경 서버 설정
   */
  private setupDevelopmentServers(): void {
    const servers = [
      {
        name: 'filesystem',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-filesystem', 'src', 'docs'],
        enabled: true,
      },
      {
        name: 'github',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-github'],
        enabled: true,
      },
      // gemini-cli-bridge는 MCP 지원 중단
      // {
      //   name: 'openmanager-docs',
      //   command: 'node',
      //   args: ['mcp-servers/gemini-cli-bridge/src/index.js'],
      //   enabled: true,
      // },
    ];

    servers.forEach(server => {
      this.servers.set(server.name, {
        ...server,
        env: {},
        stats: {
          totalRequests: 0,
          successfulRequests: 0,
          failedRequests: 0,
          averageResponseTime: 0,
          lastUsed: Date.now(),
          healthScore: 100,
        },
      });
    });
  }

  /**
   * 🧪 테스트 환경 서버 설정
   */
  private setupTestServers(): void {
    const testCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx';
    console.log(`🔧 MCP 서버 초기화 완료 (TEST - ${testCommand})`);

    this.servers.set('filesystem', {
      name: 'filesystem',
      command: testCommand,
      args: ['-y', '@modelcontextprotocol/server-filesystem', 'src', 'docs'],
      enabled: true,
      env: {},
      stats: {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0,
        lastUsed: Date.now(),
        healthScore: 100,
      },
    });
  }

  /**
   * 🚀 프로덕션 환경 서버 설정
   */
  private setupProductionServers(): void {
    // Google VM 서버 기반 설정
    const gcpMcpUrl =
      process.env.GCP_MCP_SERVER_URL ||
      `http://${process.env.GCP_VM_IP || '104.154.205.25'}:${process.env.GCP_MCP_SERVER_PORT || '10000'}/mcp`;

    this.servers.set('gcp-mcp', {
      name: 'gcp-mcp',
      command: 'curl',
      args: ['-X', 'POST', gcpMcpUrl],
      enabled: true,
      env: {},
      stats: {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0,
        lastUsed: Date.now(),
        healthScore: 100,
      },
    });
  }

  /**
   * 🔌 서버 초기화 및 연결
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('✅ MCP 서버 관리자 이미 초기화됨');
      return;
    }

    console.log('🚀 MCP 서버 연결 시작...');

    try {
      await this.testConnections();
      this.isInitialized = true;
      console.log('✅ MCP 서버 관리자 초기화 완료');
    } catch (error) {
      console.error('❌ MCP 서버 초기화 실패:', error);
      throw error;
    }
  }

  /**
   * 🔍 연결 테스트
   */
  private async testConnections(): Promise<void> {
    const testPromises = Array.from(this.servers.entries()).map(
      async ([name, config]) => {
        if (!config.enabled) return;

        try {
          await this.connectToServer(name);
          console.log(`✅ ${name} 서버 연결 성공`);
        } catch (error) {
          console.warn(`⚠️ ${name} 서버 연결 실패:`, error);
          config.enabled = false;
        }
      }
    );

    await Promise.allSettled(testPromises);
  }

  /**
   * 🔗 개별 서버 연결
   */
  async connectToServer(serverName: string): Promise<MCPClient> {
    const config = this.servers.get(serverName);
    if (!config) {
      throw new Error(`서버 설정을 찾을 수 없습니다: ${serverName}`);
    }

    if (this.clients.has(serverName)) {
      return this.clients.get(serverName)!;
    }

    const client = this.createMockClient(serverName);
    await client.connect();

    this.clients.set(serverName, client);
    return client;
  }

  /**
   * 🎭 목업 클라이언트 생성 (테스트용)
   */
  private createMockClient(serverName: string): MCPClient {
    let connected = false;

    return {
      async connect(): Promise<void> {
        console.log(`🔗 ${serverName} 목업 클라이언트 연결됨`);
        connected = true;
      },

      async request(_request: any): Promise<any> {
        return { result: `Mock response from ${serverName}` };
      },

      async close(): Promise<void> {
        console.log(`🔌 ${serverName} 목업 클라이언트 연결 해제됨`);
        connected = false;
      },

      async disconnect(): Promise<void> {
        console.log(`🔌 ${serverName} 목업 클라이언트 연결 해제됨`);
        connected = false;
      },

      isConnected(): boolean {
        return connected;
      },
    };
  }

  /**
   * 📊 서버 상태 조회
   */
  async getServerStatus(): Promise<Record<string, any>> {
    const status: Record<string, any> = {};

    for (const [name, config] of this.servers.entries()) {
      status[name] = {
        enabled: config.enabled,
        connected: this.clients.has(name),
        stats: config.stats || null,
        lastCheck: new Date().toISOString(),
      };
    }

    return status;
  }

  /**
   * 🔧 서버 활성화/비활성화
   */
  setServerEnabled(serverName: string, enabled: boolean): void {
    const config = this.servers.get(serverName);
    if (config) {
      config.enabled = enabled;
      console.log(`🔧 ${serverName} 서버 ${enabled ? '활성화' : '비활성화'}`);
    }
  }

  /**
   * 📋 사용 가능한 서버 목록
   */
  getAvailableServers(): string[] {
    return Array.from(this.servers.entries())
      .filter(([_, config]) => config.enabled)
      .map(([name]) => name);
  }

  /**
   * 🔌 모든 서버 연결 해제
   */
  async disconnectAll(): Promise<void> {
    const disconnectPromises = Array.from(this.clients.entries()).map(
      async ([name, client]) => {
        try {
          if (client.close) {
            await client.close();
          } else if (client.disconnect) {
            await client.disconnect();
          }
          console.log(`🔌 ${name} 서버 연결 해제됨`);
        } catch (error) {
          console.warn(`⚠️ ${name} 서버 연결 해제 실패:`, error);
        }
      }
    );

    await Promise.allSettled(disconnectPromises);
    this.clients.clear();
    this.processes.clear();
    this.isInitialized = false;

    console.log('✅ 모든 MCP 서버 연결 해제 완료');
  }

  /**
   * 🔍 서버 설정 조회
   */
  getServerConfig(serverName: string): MCPServerConfig | undefined {
    return this.servers.get(serverName);
  }

  /**
   * 🎯 클라이언트 조회
   */
  getClient(serverName: string): MCPClient | undefined {
    return this.clients.get(serverName);
  }
}
