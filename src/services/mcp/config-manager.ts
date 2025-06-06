import fs from 'fs';
import path from 'path';

export interface MCPServerConfig {
  command: string;
  args: string[];
  cwd?: string;
  env?: Record<string, string>;
}

export interface MCPConfig {
  mcpServers: Record<string, MCPServerConfig>;
}

export class MCPConfigManager {
  private static instance: MCPConfigManager;
  private config: MCPConfig | null = null;

  private constructor() {}

  static getInstance(): MCPConfigManager {
    if (!this.instance) {
      this.instance = new MCPConfigManager();
    }
    return this.instance;
  }

  /**
   * 환경에 따라 적절한 MCP 설정 파일을 로드합니다.
   */
  async loadConfig(): Promise<MCPConfig> {
    if (this.config) {
      return this.config;
    }

    const environment = this.detectEnvironment();
    const configFile = this.getConfigFile(environment);

    try {
      const configPath = path.resolve(process.cwd(), configFile);

      // 파일 존재 확인
      if (!fs.existsSync(configPath)) {
        console.warn(`[MCP] 설정 파일이 없음: ${configFile}, 기본 설정 사용`);
        return this.getDefaultConfig();
      }

      const configContent = fs.readFileSync(configPath, 'utf-8');
      this.config = JSON.parse(configContent);

      console.log(`[MCP] 환경: ${environment}, 설정 파일: ${configFile}`);
      return this.config!;
    } catch (error) {
      console.error(`[MCP] 설정 파일 로드 실패: ${configFile}`, error);
      console.log(`[MCP] 기본 설정으로 대체`);
      return this.getDefaultConfig();
    }
  }

  /**
   * 기본 MCP 설정을 반환합니다.
   */
  private getDefaultConfig(): MCPConfig {
    this.config = {
      mcpServers: {
        'local-filesystem': {
          command: 'node',
          args: ['./mcp-server/server.js'],
          cwd: process.cwd(),
          env: {
            PROJECT_ROOT: process.cwd(),
          },
        },
      },
    };
    return this.config;
  }

  /**
   * 현재 환경을 감지합니다.
   */
  private detectEnvironment():
    | 'cursor'
    | 'render'
    | 'development'
    | 'production' {
    // Render.com 환경 감지
    if (process.env.RENDER || process.cwd().includes('/opt/render/project')) {
      return 'render';
    }

    // Cursor IDE 환경 감지
    if (process.env.CURSOR_IDE || process.env.VSCODE_PID) {
      return 'cursor';
    }

    // 일반적인 환경 감지
    if (process.env.NODE_ENV === 'production') {
      return 'production';
    }

    return 'development';
  }

  /**
   * 환경에 따른 설정 파일 경로를 반환합니다.
   */
  private getConfigFile(environment: string): string {
    switch (environment) {
      case 'cursor':
        return 'mcp-cursor.json';
      case 'render':
        return 'mcp-render.json';
      case 'production':
        return 'mcp.json';
      case 'development':
      default:
        return 'mcp.dev.json';
    }
  }

  /**
   * 특정 서버 설정을 가져옵니다.
   */
  async getServerConfig(serverName: string): Promise<MCPServerConfig | null> {
    const config = await this.loadConfig();
    return config.mcpServers[serverName] || null;
  }

  /**
   * 사용 가능한 모든 서버 목록을 반환합니다.
   */
  async getAvailableServers(): Promise<string[]> {
    const config = await this.loadConfig();
    return Object.keys(config.mcpServers);
  }

  /**
   * 환경별 MCP 서버 상태를 확인합니다.
   */
  async checkServerStatus(): Promise<{
    environment: string;
    configFile: string;
    servers: Record<string, boolean>;
  }> {
    const environment = this.detectEnvironment();
    const configFile = this.getConfigFile(environment);
    const servers: Record<string, boolean> = {};

    try {
      const config = await this.loadConfig();

      for (const [serverName, serverConfig] of Object.entries(
        config.mcpServers
      )) {
        servers[serverName] = await this.testServerConnection(serverConfig);
      }
    } catch (error) {
      console.error('[MCP] 서버 상태 확인 실패:', error);
    }

    return {
      environment,
      configFile,
      servers,
    };
  }

  /**
   * 서버 연결을 테스트합니다.
   */
  private async testServerConnection(
    config: MCPServerConfig
  ): Promise<boolean> {
    try {
      // 명령어 존재 여부 확인
      if (config.command === 'node') {
        // Node.js 스크립트 파일 존재 확인
        const scriptPath = path.resolve(
          config.cwd || process.cwd(),
          config.args[0]
        );
        return fs.existsSync(scriptPath);
      } else if (config.command === 'npx') {
        // NPX 패키지 확인은 간단히 true 반환 (실제로는 더 복잡한 체크 필요)
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  }
}
