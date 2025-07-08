#!/usr/bin/env node

/**
 * 🎯 표준 MCP 서버 설정 스크립트 (v2.0)
 * 
 * OpenManager Vibe v5에서 표준 MCP 파일시스템 서버만 설정
 * - fetch-mcp-server 완전 제거
 * - 표준 MCP 도구만 제공 (read_file, list_directory, get_file_info, search_files)
 * - 보안 강화된 파일 접근 제어
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

class MCPSetup {
  constructor() {
    this.projectRoot = process.cwd();
    this.mcpServerPath = path.join(this.projectRoot, 'mcp-server');
  }

  // 표준 MCP 파일시스템 서버 설정
  setupStandardMCP() {
    console.log('🎯 표준 MCP 파일시스템 서버 설정 중...');

    // Cursor 설정 디렉토리 확인
    const cursorConfigPath = this.getCursorConfigPath();
    if (!cursorConfigPath) {
      console.error('❌ Cursor 설정 디렉토리를 찾을 수 없습니다.');
      return;
    }

    // settings.json 업데이트
    this.updateCursorSettings(cursorConfigPath);

    // MCP 서버 시작 스크립트 생성
    this.createStartScripts();

    console.log('✅ 표준 MCP 파일시스템 서버 설정 완료!');
    console.log('');
    console.log('📖 사용법:');
    console.log('   1. Cursor를 재시작하세요');
    console.log('   2. "mcp-filesystem"을 선택하여 연결하세요');
    console.log('   3. Chat에서 @mcp-filesystem을 사용하여 파일 작업을 수행할 수 있습니다');
    console.log('');
    console.log('🔧 사용 가능한 도구:');
    console.log('   - read_file: 파일 내용 읽기');
    console.log('   - list_directory: 디렉토리 목록 보기');
    console.log('   - get_file_info: 파일 정보 조회');
    console.log('   - search_files: 파일 검색');
  }

  getCursorConfigPath() {
    const platform = os.platform();
    let configPath;

    if (platform === 'win32') {
      configPath = path.join(os.homedir(), 'AppData', 'Roaming', 'Cursor', 'User');
    } else if (platform === 'darwin') {
      configPath = path.join(os.homedir(), 'Library', 'Application Support', 'Cursor', 'User');
    } else {
      configPath = path.join(os.homedir(), '.config', 'Cursor', 'User');
    }

    return fs.existsSync(configPath) ? configPath : null;
  }

  updateCursorSettings(configPath) {
    const settingsPath = path.join(configPath, 'settings.json');
    let settings = {};

    if (fs.existsSync(settingsPath)) {
      const content = fs.readFileSync(settingsPath, 'utf8');
      try {
        settings = JSON.parse(content);
      } catch (error) {
        console.warn('⚠️ 기존 settings.json 파싱 실패, 새로 생성합니다.');
      }
    }

    // MCP 서버 설정 초기화
    if (!settings['mcp.servers']) {
      settings['mcp.servers'] = {};
    }

    // 표준 MCP 파일시스템 서버 설정
    settings['mcp.servers']['mcp-filesystem'] = {
      command: 'node',
      args: ['./mcp-server/server.js'],
      cwd: this.projectRoot,
      env: {
        NODE_ENV: 'development',
        ALLOWED_DIRECTORIES: 'src,docs,config,mcp-server'
      }
    };

    // 설정 파일 저장
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
    console.log('✅ Cursor settings.json 업데이트 완료');
  }

  createStartScripts() {
    // Windows 시작 스크립트
    const windowsScript = `@echo off
echo 🎯 표준 MCP 파일시스템 서버 시작 중...
cd "${this.mcpServerPath}"
node server.js
pause`;

    fs.writeFileSync(
      path.join(this.projectRoot, 'start-mcp-filesystem.bat'),
      windowsScript
    );

    // Unix/Linux 시작 스크립트
    const unixScript = `#!/bin/bash
echo "🎯 표준 MCP 파일시스템 서버 시작 중..."
cd "${this.mcpServerPath}"
node server.js`;

    fs.writeFileSync(
      path.join(this.projectRoot, 'start-mcp-filesystem.sh'),
      unixScript
    );

    // 실행 권한 설정 (Unix/Linux)
    if (os.platform() !== 'win32') {
      const { execSync } = require('child_process');
      try {
        execSync(`chmod +x "${path.join(this.projectRoot, 'start-mcp-filesystem.sh')}"`);
      } catch (error) {
        console.warn('⚠️ 실행 권한 설정 실패:', error.message);
      }
    }

    console.log('✅ 시작 스크립트 생성 완료');
    console.log('   - start-mcp-filesystem.bat (Windows)');
    console.log('   - start-mcp-filesystem.sh (Unix/Linux/macOS)');
  }

  // 헬프 메시지
  showHelp() {
    console.log(`
🎯 표준 MCP 설정 도구 v2.0

사용법:
  node setup-cursor-mcp.js setup    # 표준 MCP 서버 설정
  node setup-cursor-mcp.js help     # 도움말 표시

예시:
  node setup-cursor-mcp.js setup

기능:
  - 표준 MCP 파일시스템 서버 설정
  - Cursor IDE와 자동 연동
  - 보안 강화된 파일 접근 제어
  - 4가지 표준 도구 제공 (read_file, list_directory, get_file_info, search_files)
`);
  }
}

// 메인 실행
const setup = new MCPSetup();
const command = process.argv[2];

switch (command) {
  case 'setup':
    setup.setupStandardMCP();
    break;
  case 'help':
  default:
    setup.showHelp();
    break;
}
