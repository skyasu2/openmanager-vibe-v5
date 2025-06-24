#!/usr/bin/env node

/**
 * 🎯 Cursor IDE에 Fetch MCP Server 등록 설정
 *
 * Cursor IDE에서 공식 Fetch MCP Server를 사용할 수 있도록 설정합니다.
 *
 * 사용법:
 *   node scripts/setup-cursor-mcp.js
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require('path');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const os = require('os');

class CursorMCPSetup {
  constructor() {
    this.homeDir = os.homedir();
    this.cursorConfigDir = this.getCursorConfigDir();
    this.projectRoot = process.cwd();
  }

  getCursorConfigDir() {
    const platform = os.platform();

    switch (platform) {
      case 'win32':
        return path.join(this.homeDir, 'AppData', 'Roaming', 'Cursor', 'User');
      case 'darwin': // macOS
        return path.join(
          this.homeDir,
          'Library',
          'Application Support',
          'Cursor',
          'User'
        );
      case 'linux':
        return path.join(this.homeDir, '.config', 'Cursor', 'User');
      default:
        return path.join(this.homeDir, '.cursor');
    }
  }

  async main() {
    console.log('🎯 Cursor IDE에 Fetch MCP Server 등록 중...\n');

    try {
      // 1. Fetch MCP Server 설치 확인
      await this.checkFetchMCPServer();

      // 2. Cursor 설정 디렉토리 확인
      await this.ensureCursorConfigDir();

      // 3. MCP 설정 파일 생성/업데이트
      await this.updateCursorMCPSettings();

      // 4. 프로젝트별 설정 파일 생성
      await this.createProjectMCPConfig();

      // 5. 실행 스크립트 생성
      await this.createLaunchScripts();

      console.log('\n✅ Cursor IDE MCP 설정이 완료되었습니다!');
      console.log('\n📖 다음 단계:');
      console.log('1. Cursor IDE를 재시작하세요');
      console.log(
        '2. 명령 팔레트 (Ctrl+Shift+P)에서 "MCP: Connect"를 검색하세요'
      );
      console.log('3. "fetch-mcp-server"를 선택하여 연결하세요');
      console.log(
        '4. Chat에서 @fetch-mcp-server를 사용하여 웹 콘텐츠를 가져올 수 있습니다'
      );
    } catch (error) {
      console.error('❌ 설정 실패:', error.message);
      process.exit(1);
    }
  }

  async checkFetchMCPServer() {
    console.log('🔍 Fetch MCP Server 설치 확인 중...');

    const serverPath = path.join(this.projectRoot, 'fetch-mcp-server');
    const packageJsonPath = path.join(serverPath, 'package.json');
    const distPath = path.join(serverPath, 'dist');

    if (!fs.existsSync(serverPath)) {
      console.log('❌ Fetch MCP Server가 설치되지 않았습니다.');
      console.log(
        '먼저 설치를 진행하세요: bash scripts/setup-fetch-mcp-server.sh'
      );
      throw new Error('Fetch MCP Server not found');
    }

    if (!fs.existsSync(packageJsonPath)) {
      console.log('❌ Fetch MCP Server package.json이 없습니다.');
      throw new Error('Invalid Fetch MCP Server installation');
    }

    if (!fs.existsSync(distPath)) {
      console.log('❌ Fetch MCP Server가 빌드되지 않았습니다.');
      console.log('빌드를 진행하세요: cd fetch-mcp-server && npm run build');
      throw new Error('Fetch MCP Server not built');
    }

    console.log('✅ Fetch MCP Server 설치 확인됨');
  }

  async ensureCursorConfigDir() {
    console.log('📁 Cursor 설정 디렉토리 확인 중...');

    if (!fs.existsSync(this.cursorConfigDir)) {
      console.log(`📁 Cursor 설정 디렉토리 생성: ${this.cursorConfigDir}`);
      fs.mkdirSync(this.cursorConfigDir, { recursive: true });
    }

    console.log(`✅ Cursor 설정 디렉토리: ${this.cursorConfigDir}`);
  }

  async updateCursorMCPSettings() {
    console.log('⚙️ Cursor MCP 설정 업데이트 중...');

    const settingsPath = path.join(this.cursorConfigDir, 'settings.json');
    let settings = {};

    // 기존 설정 읽기
    if (fs.existsSync(settingsPath)) {
      try {
        const settingsContent = fs.readFileSync(settingsPath, 'utf8');
        settings = JSON.parse(settingsContent);
      } catch {
        console.log('⚠️ 기존 settings.json 파싱 실패, 새로 생성합니다.');
        settings = {};
      }
    }

    // MCP 설정 추가/업데이트
    if (!settings['mcp.servers']) {
      settings['mcp.servers'] = {};
    }

    const fetchMcpServerPath = path.join(this.projectRoot, 'fetch-mcp-server');
    const nodePath = process.execPath;

    settings['mcp.servers']['fetch-mcp-server'] = {
      name: 'Fetch MCP Server',
      description: '공식 Fetch MCP Server - 웹 콘텐츠 가져오기',
      command: nodePath,
      args: [path.join(fetchMcpServerPath, 'dist', 'index.js'), '--stdio'],
      cwd: fetchMcpServerPath,
      env: {
        NODE_ENV: 'development',
      },
      tools: ['fetch_html', 'fetch_json', 'fetch_txt', 'fetch_markdown'],
    };

    // HTTP 모드 서버도 추가
    settings['mcp.servers']['fetch-mcp-server-http'] = {
      name: 'Fetch MCP Server (HTTP)',
      description: '공식 Fetch MCP Server - HTTP 모드',
      transport: 'http',
      url: 'http://localhost:3001',
      tools: ['fetch_html', 'fetch_json', 'fetch_txt', 'fetch_markdown'],
    };

    // 설정 파일 저장
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
    console.log(`✅ Cursor 설정 업데이트됨: ${settingsPath}`);
  }

  async createProjectMCPConfig() {
    console.log('📝 프로젝트 MCP 설정 파일 생성 중...');

    const configPath = path.join(this.projectRoot, '.cursor-mcp.json');

    const config = {
      version: '1.0.0',
      name: 'OpenManager Vibe v5 - Fetch MCP',
      description:
        'OpenManager Vibe v5 프로젝트에서 Fetch MCP Server 사용 설정',
      servers: {
        'fetch-mcp-server': {
          enabled: true,
          autoStart: false,
          stdio: {
            command: process.execPath,
            args: ['./fetch-mcp-server/dist/index.js', '--stdio'],
            cwd: './fetch-mcp-server',
          },
          http: {
            url: 'http://localhost:3001',
            autoConnect: false,
          },
        },
      },
      tools: {
        fetch_html: {
          description: 'HTML 페이지 가져오기',
          example: '@fetch-mcp-server fetch_html https://example.com',
        },
        fetch_json: {
          description: 'JSON 데이터 가져오기',
          example:
            '@fetch-mcp-server fetch_json https://api.github.com/repos/microsoft/vscode',
        },
        fetch_txt: {
          description: '텍스트 파일 가져오기',
          example: '@fetch-mcp-server fetch_txt https://httpbin.org/robots.txt',
        },
        fetch_markdown: {
          description: 'Markdown 파일 가져오기',
          example:
            '@fetch-mcp-server fetch_markdown https://raw.githubusercontent.com/microsoft/vscode/main/README.md',
        },
      },
      examples: [
        {
          name: 'GitHub API 데이터 가져오기',
          command:
            '@fetch-mcp-server fetch_json https://api.github.com/repos/microsoft/vscode',
        },
        {
          name: '웹페이지 HTML 분석',
          command: '@fetch-mcp-server fetch_html https://news.ycombinator.com',
        },
        {
          name: 'README 파일 가져오기',
          command:
            '@fetch-mcp-server fetch_markdown https://raw.githubusercontent.com/microsoft/vscode/main/README.md',
        },
      ],
    };

    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log(`✅ 프로젝트 MCP 설정 생성됨: ${configPath}`);
  }

  async createLaunchScripts() {
    console.log('🚀 실행 스크립트 생성 중...');

    // Windows용 스크립트
    const windowsScript = `@echo off
echo 🌐 Fetch MCP Server for Cursor IDE 시작 중...
cd /d "${path.join(this.projectRoot, 'fetch-mcp-server')}"
node dist/index.js --stdio
`;

    fs.writeFileSync(
      path.join(this.projectRoot, 'start-fetch-mcp-cursor.bat'),
      windowsScript
    );

    // Unix용 스크립트
    const unixScript = `#!/bin/bash
echo "🌐 Fetch MCP Server for Cursor IDE 시작 중..."
cd "${path.join(this.projectRoot, 'fetch-mcp-server')}"
node dist/index.js --stdio
`;

    const unixScriptPath = path.join(
      this.projectRoot,
      'start-fetch-mcp-cursor.sh'
    );
    fs.writeFileSync(unixScriptPath, unixScript);
    fs.chmodSync(unixScriptPath, '755');

    // HTTP 모드 스크립트
    const httpScript = `#!/bin/bash
echo "🌐 Fetch MCP Server HTTP 모드 시작 중..."
echo "포트: 3001"
echo "Cursor에서 HTTP 연결 사용 가능"
echo ""
cd "${path.join(this.projectRoot, 'fetch-mcp-server')}"
node dist/index.js --http --port 3001
`;

    const httpScriptPath = path.join(
      this.projectRoot,
      'start-fetch-mcp-http.sh'
    );
    fs.writeFileSync(httpScriptPath, httpScript);
    fs.chmodSync(httpScriptPath, '755');

    console.log('✅ 실행 스크립트 생성 완료:');
    console.log('   - start-fetch-mcp-cursor.bat (Windows)');
    console.log('   - start-fetch-mcp-cursor.sh (Unix/Linux/macOS)');
    console.log('   - start-fetch-mcp-http.sh (HTTP 모드)');
  }
}

// 🚀 스크립트 실행
if (require.main === module) {
  const setup = new CursorMCPSetup();
  setup.main().catch(console.error);
}

module.exports = CursorMCPSetup;
