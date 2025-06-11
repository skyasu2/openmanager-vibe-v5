#!/usr/bin/env node

/**
 * 🚀 MCP 로컬 서버 관리 스크립트
 * 프로젝트 전용 MCP 서버를 관리합니다.
 */

const { exec, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const MCP_CONFIG_PATH = './cursor.mcp.json';
const MCP_SERVER_PATH = './mcp-server/server.js';
const MCP_PORT = 3100;

class MCPLocalManager {
  constructor() {
    this.configPath = MCP_CONFIG_PATH;
    this.serverPath = MCP_SERVER_PATH;
    this.port = MCP_PORT;
  }

  /**
   * MCP 설정 파일 유효성 검사
   */
  validateConfig() {
    try {
      if (!fs.existsSync(this.configPath)) {
        console.log('❌ cursor.mcp.json 파일이 없습니다.');
        return false;
      }

      const config = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
      if (!config.mcpServers) {
        console.log('❌ 유효하지 않은 MCP 설정입니다.');
        return false;
      }

      console.log('✅ cursor.mcp.json 설정이 유효합니다.');
      console.log(`📦 등록된 MCP 서버: ${Object.keys(config.mcpServers).length}개`);
      return true;
    } catch (error) {
      console.log('❌ MCP 설정 파일 검증 실패:', error.message);
      return false;
    }
  }

  /**
   * 로컬 MCP 서버 상태 확인
   */
  async checkStatus() {
    return new Promise((resolve) => {
      exec(`curl -f http://localhost:${this.port}/health`, (error, stdout) => {
        if (error) {
          console.log('❌ 로컬 MCP 서버가 실행되지 않고 있습니다.');
          resolve(false);
        } else {
          try {
            const status = JSON.parse(stdout);
            console.log('✅ 로컬 MCP 서버가 정상 작동 중입니다.');
            console.log(`📊 포트: ${status.port || this.port}`);
            console.log(`⏱️  업타임: ${Math.floor(status.uptime || 0)}초`);
            resolve(true);
          } catch {
            console.log('⚠️  MCP 서버 응답을 파싱할 수 없습니다.');
            resolve(false);
          }
        }
      });
    });
  }

  /**
   * 로컬 MCP 서버 시작
   */
  startServer() {
    if (!fs.existsSync(this.serverPath)) {
      console.log('❌ MCP 서버 파일을 찾을 수 없습니다:', this.serverPath);
      return;
    }

    console.log('🚀 로컬 MCP 서버를 시작합니다...');

    const server = spawn('node', [this.serverPath], {
      detached: true,
      stdio: 'inherit',
      env: {
        ...process.env,
        PORT: this.port,
        NODE_ENV: 'development',
        MCP_ENV: 'cursor-local'
      }
    });

    server.unref();
    console.log(`✅ MCP 서버가 백그라운드에서 시작되었습니다 (포트: ${this.port})`);
    console.log(`🔗 헬스체크: http://localhost:${this.port}/health`);
  }

  /**
   * 설정된 MCP 서버 목록 출력
   */
  listMCPServers() {
    try {
      const config = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
      console.log('\n📦 설정된 MCP 서버 목록:');
      console.log('=====================================');

      Object.entries(config.mcpServers).forEach(([id, server]) => {
        console.log(`${server.description || id}`);
        console.log(`   ID: ${id}`);
        console.log(`   명령어: ${server.command} ${(server.args || []).join(' ')}`);
        console.log('');
      });

      if (config.settings?.typescript) {
        console.log('🚀 TypeScript 개발 환경:');
        console.log(`   프레임워크: ${config.settings.typescript.framework}`);
        console.log(`   UI 라이브러리: ${config.settings.typescript.uiLibrary}`);
        console.log(`   스타일링: ${config.settings.typescript.styling}`);
      }
    } catch (error) {
      console.log('❌ MCP 설정을 읽을 수 없습니다:', error.message);
    }
  }

  /**
   * Cursor 설정 가이드 출력
   */
  showCursorGuide() {
    console.log('\n🔧 Cursor에서 프로젝트 전용 MCP 설정 사용 방법:');
    console.log('1. cursor.mcp.json 파일이 프로젝트 루트에 생성되었습니다');
    console.log('2. Cursor를 완전히 종료하고 재시작하세요');
    console.log('3. Cursor가 cursor.mcp.json을 자동으로 인식합니다');
    console.log('4. 글로벌 MCP 설정과 격리되어 실행됩니다');
    console.log('\n📝 참고: .cursor/mcp.json (글로벌)과 cursor.mcp.json (로컬)은 별개입니다');

    console.log('\n✨ TypeScript 개발 특화 MCP 서버들:');
    console.log('• Magic MCP: `/ui 모던한 버튼 만들어줘` - AI 기반 UI 생성');
    console.log('• Shadcn UI: 컴포넌트 문서 및 예제 제공');
    console.log('• MCP Installer: 추가 MCP 서버 자동 설치');
    console.log('• Sequential Thinking: 복잡한 로직 단계별 분석');
  }

  /**
   * Magic MCP API 키 설정 가이드
   */
  showMagicMCPSetup() {
    console.log('\n✨ Magic MCP 설정 방법:');
    console.log('1. https://21st.dev/magic 에서 API 키 생성');
    console.log('2. 환경변수 설정:');
    console.log('   export API_KEY="your-api-key-here"');
    console.log('3. 또는 .env 파일에 추가:');
    console.log('   API_KEY=your-api-key-here');
    console.log('4. Cursor 재시작');
    console.log('\n사용법: Cursor에서 `/ui 버튼 만들어줘` 같은 명령어 사용');
  }

  /**
   * 도움말 출력
   */
  showHelp() {
    console.log('\n📖 MCP 로컬 관리 명령어:');
    console.log('npm run mcp:dev              - MCP 서버 개발 모드 실행');
    console.log('npm run mcp:local:status     - 로컬 MCP 서버 상태 확인');
    console.log('npm run mcp:local:start      - 로컬 MCP 서버 백그라운드 시작');
    console.log('npm run mcp:cursor:validate  - cursor.mcp.json 유효성 검사');
    console.log('npm run cursor:mcp           - Cursor MCP 설정 검증 및 가이드');
    console.log('npm run mcp:help             - 도움말');
    console.log('\n🚀 TypeScript 개발 전용 명령어:');
    console.log('node development/scripts/mcp-local-manager.js list      - MCP 서버 목록');
    console.log('node development/scripts/mcp-local-manager.js magic     - Magic MCP 설정 가이드');
  }
}

// CLI 실행
async function main() {
  const manager = new MCPLocalManager();
  const command = process.argv[2];

  switch (command) {
    case 'validate':
      manager.validateConfig();
      break;

    case 'status':
      await manager.checkStatus();
      break;

    case 'start':
      manager.startServer();
      break;

    case 'guide':
      manager.showCursorGuide();
      break;

    case 'list':
      manager.listMCPServers();
      break;

    case 'magic':
      manager.showMagicMCPSetup();
      break;

    case 'help':
    default:
      manager.showHelp();
      break;
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = MCPLocalManager; 