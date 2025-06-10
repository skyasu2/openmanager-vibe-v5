#!/usr/bin/env node

/**
 * 🎯 MCP 통합 관리 시스템
 * 
 * 이 스크립트는 프로젝트 AI 엔진용 MCP와 Cursor 개발용 MCP를
 * 통일된 방식으로 관리할 수 있도록 지원합니다.
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');

const execAsync = util.promisify(exec);

// 설정 경로들
const CONFIG_PATHS = {
  mcpConfig: path.join(process.cwd(), 'mcp-config'),
  cursorDev: path.join(process.cwd(), 'mcp-config/cursor-dev'),
  aiEngine: path.join(process.cwd(), 'mcp-config/ai-engine'),
  shared: path.join(process.cwd(), 'mcp-config/shared'),
  cursorMcp: path.join(process.cwd(), 'cursor.mcp.json')
};

// 사용 가능한 프로필 (Cursor 개발용만)
const PROFILES = {
  cursor: {
    'working-basic': 'mcp-config/cursor-dev/working-basic.json',
    'working-filesystem': 'mcp-config/cursor-dev/working-with-filesystem.json',
    basic: 'mcp-config/cursor-dev/basic.json',
    typescript: 'mcp-config/cursor-dev/typescript.json',
    full: 'mcp-config/cursor-dev/full.json'
  }
  // AI 엔진용 MCP는 기존 파일들(mcp.json, mcp.dev.json 등) 그대로 사용
};

class MCPManager {
  constructor() {
    this.currentProfile = this.detectCurrentProfile();
  }

  /**
   * 현재 활성 프로필 감지
   */
  detectCurrentProfile() {
    try {
      if (fs.existsSync(CONFIG_PATHS.cursorMcp)) {
        const config = JSON.parse(fs.readFileSync(CONFIG_PATHS.cursorMcp, 'utf8'));
        return config.settings?.profile || 'unknown';
      }
    } catch (error) {
      return 'none';
    }
    return 'none';
  }

  /**
   * Cursor 개발용 MCP 프로필 전환
   */
  async switchCursorProfile(profile) {
    const profilePath = PROFILES.cursor[profile];
    if (!profilePath) {
      throw new Error(`지원하지 않는 Cursor 프로필: ${profile}`);
    }

    const sourcePath = path.join(process.cwd(), profilePath);
    if (!fs.existsSync(sourcePath)) {
      throw new Error(`프로필 파일을 찾을 수 없습니다: ${sourcePath}`);
    }

    // 기존 설정 백업
    await this.backupCurrentConfig();

    // 새 프로필 적용
    fs.copyFileSync(sourcePath, CONFIG_PATHS.cursorMcp);

    console.log(`✅ Cursor MCP 프로필이 '${profile}'로 전환되었습니다.`);
    console.log(`📁 설정 파일: ${profilePath}`);
    console.log(`🔄 Cursor를 재시작하여 변경사항을 적용하세요.`);

    return true;
  }

  /**
   * 현재 설정 백업
   */
  async backupCurrentConfig() {
    if (fs.existsSync(CONFIG_PATHS.cursorMcp)) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = `${CONFIG_PATHS.cursorMcp}.backup.${timestamp}`;
      fs.copyFileSync(CONFIG_PATHS.cursorMcp, backupPath);
      console.log(`💾 기존 설정 백업: ${backupPath}`);
    }
  }

  /**
   * MCP 서버 상태 확인
   */
  async checkStatus() {
    console.log('🔍 MCP 설정 상태 확인\n');

    // 현재 프로필 정보
    console.log(`📋 현재 활성 프로필: ${this.currentProfile}`);

    // 설정 파일 존재 확인
    const configExists = fs.existsSync(CONFIG_PATHS.cursorMcp);
    console.log(`📁 cursor.mcp.json: ${configExists ? '✅ 존재' : '❌ 없음'}`);

    if (configExists) {
      try {
        const config = JSON.parse(fs.readFileSync(CONFIG_PATHS.cursorMcp, 'utf8'));
        const serverCount = Object.keys(config.mcpServers || {}).length;
        console.log(`🔧 설정된 MCP 서버 수: ${serverCount}개`);

        // 서버 목록 출력
        if (config.mcpServers) {
          console.log('\n📊 활성 MCP 서버 목록:');
          Object.entries(config.mcpServers).forEach(([name, server]) => {
            const status = server.enabled !== false ? '✅' : '❌';
            console.log(`  ${status} ${name}: ${server.description || '설명 없음'}`);
          });
        }
      } catch (error) {
        console.log(`❌ 설정 파일 파싱 오류: ${error.message}`);
      }
    }

    // Cursor 개발용 프로필 파일들 확인
    console.log('\n📁 사용 가능한 Cursor 개발용 프로필:');
    Object.entries(PROFILES.cursor).forEach(([name, filePath]) => {
      const fullPath = path.join(process.cwd(), filePath);
      const exists = fs.existsSync(fullPath);
      console.log(`  ${exists ? '✅' : '❌'} cursor:${name} (${filePath})`);
    });

    // AI 엔진용 MCP 파일들 상태 (참고용, 수정하지 않음)
    console.log('\n🤖 AI 엔진용 MCP 파일들 (기존 유지):');
    const aiFiles = ['mcp.json', 'mcp.dev.json', 'mcp-render.json', 'mcp-render-ai.json'];
    aiFiles.forEach(fileName => {
      const exists = fs.existsSync(path.join(process.cwd(), fileName));
      console.log(`  ${exists ? '✅' : '❌'} ${fileName} (건드리지 않음)`);
    });
  }

  /**
   * MCP 서버 연결 테스트
   */
  async testConnections() {
    console.log('🧪 MCP 서버 연결 테스트 시작\n');

    if (!fs.existsSync(CONFIG_PATHS.cursorMcp)) {
      console.log('❌ cursor.mcp.json 파일이 없습니다.');
      return false;
    }

    try {
      const config = JSON.parse(fs.readFileSync(CONFIG_PATHS.cursorMcp, 'utf8'));
      const servers = config.mcpServers || {};

      for (const [name, server] of Object.entries(servers)) {
        if (server.enabled === false) {
          console.log(`⏭️  ${name}: 비활성화됨`);
          continue;
        }

        console.log(`🔄 ${name} 테스트 중...`);

        try {
          // npx 서버들 테스트
          if (server.command === 'npx') {
            const packageName = server.args[server.args.indexOf('-y') + 1];
            await execAsync(`npx ${packageName} --help`, { timeout: 10000 });
            console.log(`  ✅ ${name}: 패키지 사용 가능`);
          }
          // node 서버들 테스트
          else if (server.command === 'node') {
            const scriptPath = server.args[0];
            if (fs.existsSync(scriptPath)) {
              console.log(`  ✅ ${name}: 스크립트 파일 존재`);
            } else {
              console.log(`  ❌ ${name}: 스크립트 파일 없음 (${scriptPath})`);
            }
          }
        } catch (error) {
          console.log(`  ❌ ${name}: 테스트 실패 - ${error.message}`);
        }
      }
    } catch (error) {
      console.log(`❌ 설정 파일 오류: ${error.message}`);
      return false;
    }

    console.log('\n🎉 MCP 서버 연결 테스트 완료');
    return true;
  }

  /**
   * 설정 유효성 검사
   */
  async validateConfig() {
    console.log('🔍 MCP 설정 유효성 검사\n');

    const issues = [];

    // cursor.mcp.json 검사
    if (!fs.existsSync(CONFIG_PATHS.cursorMcp)) {
      issues.push('❌ cursor.mcp.json 파일이 없습니다.');
    } else {
      try {
        const config = JSON.parse(fs.readFileSync(CONFIG_PATHS.cursorMcp, 'utf8'));

        if (!config.mcpServers) {
          issues.push('❌ mcpServers 섹션이 없습니다.');
        } else if (typeof config.mcpServers !== 'object') {
          issues.push('❌ mcpServers는 객체여야 합니다.');
        }

        // 필수 환경변수 검사
        Object.entries(config.mcpServers || {}).forEach(([name, server]) => {
          if (server.env) {
            Object.entries(server.env).forEach(([key, value]) => {
              if (typeof value === 'string' && value.startsWith('${') && value.endsWith('}')) {
                const envVar = value.slice(2, -1);
                if (!process.env[envVar]) {
                  issues.push(`⚠️  ${name}: 환경변수 ${envVar}가 설정되지 않음`);
                }
              }
            });
          }
        });

      } catch (error) {
        issues.push(`❌ JSON 파싱 오류: ${error.message}`);
      }
    }

    // 글로벌 MCP 설정 검사
    const globalMcpPath = path.join(require('os').homedir(), '.cursor', 'mcp.json');
    if (fs.existsSync(globalMcpPath)) {
      try {
        const globalConfig = JSON.parse(fs.readFileSync(globalMcpPath, 'utf8'));
        if (!globalConfig.mcpServers || typeof globalConfig.mcpServers !== 'object') {
          issues.push('❌ 글로벌 MCP 설정 형식 오류');
        }
      } catch (error) {
        issues.push(`❌ 글로벌 MCP 설정 파싱 오류: ${error.message}`);
      }
    }

    // 결과 출력
    if (issues.length === 0) {
      console.log('✅ 모든 설정이 유효합니다!');
      return true;
    } else {
      console.log('❌ 발견된 문제점들:');
      issues.forEach(issue => console.log(`  ${issue}`));
      return false;
    }
  }

  /**
   * 도움말 출력
   */
  showHelp() {
    console.log(`
🎯 MCP 통합 관리 시스템

📋 사용법:
  node development/scripts/mcp-manager.js <명령어> [옵션]

 🔧 Cursor 개발용 명령어:
   cursor:basic      - 기본 개발 도구 프로필로 전환 (5개 서버)
   cursor:typescript - TypeScript 특화 프로필로 전환 (7개 서버)
   cursor:full       - 모든 도구 포함 프로필로 전환 (10개+ 서버)

 🤖 AI 엔진 관련:
   AI 엔진 MCP는 기존 파일들(mcp.json, mcp.dev.json 등)을 그대로 사용
   이 스크립트로는 AI 엔진 설정을 건드리지 않음

📊 관리 명령어:
  status            - 현재 MCP 설정 상태 확인
  validate          - 설정 유효성 검사
  test              - MCP 서버 연결 테스트
  backup            - 현재 설정 백업
  help              - 이 도움말 출력

💡 예시:
  npm run mcp:cursor:typescript
  npm run mcp:status
  npm run mcp:validate
    `);
  }
}

// 메인 실행부
async function main() {
  const manager = new MCPManager();
  const command = process.argv[2];

  try {
    switch (command) {
      case 'cursor:basic':
        await manager.switchCursorProfile('basic');
        break;
      case 'cursor:typescript':
        await manager.switchCursorProfile('typescript');
        break;
      case 'cursor:full':
        await manager.switchCursorProfile('full');
        break;
      case 'status':
        await manager.checkStatus();
        break;
      case 'validate':
        await manager.validateConfig();
        break;
      case 'test':
        await manager.testConnections();
        break;
      case 'backup':
        await manager.backupCurrentConfig();
        break;
      case 'help':
      default:
        manager.showHelp();
        break;
    }
  } catch (error) {
    console.error(`❌ 오류 발생: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = MCPManager; 