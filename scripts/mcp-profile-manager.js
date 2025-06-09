#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const PROFILES_DIR = path.join(__dirname, '..', 'mcp-config', 'profiles');
const CURSOR_MCP_PATH = path.join(__dirname, '..', 'cursor.mcp.json');

const profiles = {
  'basic': 'cursor-dev/basic.json',
  'full-dev': 'profiles/full-developer.json',
  'ai-focused': 'profiles/ai-focused.json',
  'ai-production': '../mcp-render-ai.json',
  'rapid': 'profiles/rapid-prototype.json'
};

function showHelp() {
  console.log(`
🔧 OpenManager MCP 프로필 관리자

사용법:
  node scripts/mcp-profile-manager.js [명령] [프로필]

📋 사용 가능한 프로필:
  basic         - 기본 개발 환경 (파일시스템 + 사고)
  full-dev      - 완전한 개발 환경 (Git, TypeScript, 디버깅 등)
  ai-focused    - AI 중심 개발 (벡터DB, ML, 고급 추론)
  ai-production - AI 프로덕션 (렌더 최적화)
  rapid         - 빠른 프로토타이핑 (ShadCN UI, 캐싱)

🚀 명령어:
  list          - 사용 가능한 프로필 목록
  switch <프로필> - 프로필 전환
  current       - 현재 활성 프로필 확인
  status        - 모든 프로필 상태 확인

예시:
  npm run mcp:profile switch full-dev
  npm run mcp:profile switch ai-focused
  npm run mcp:profile list
`);
}

function listProfiles() {
  console.log('\n📋 사용 가능한 MCP 프로필:\n');
  
  Object.entries(profiles).forEach(([name, configPath]) => {
    const fullPath = path.resolve(path.join(__dirname, '..', 'mcp-config', configPath));
    const exists = fs.existsSync(fullPath);
    const status = exists ? '✅' : '❌';
    
    console.log(`  ${status} ${name.padEnd(12)} - ${configPath}`);
    
    if (exists) {
      try {
        const config = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
        const serverCount = Object.keys(config.mcpServers || {}).length;
        console.log(`     └─ ${serverCount}개 서버, 환경: ${config.environment || 'unknown'}`);
      } catch (e) {
        console.log(`     └─ ⚠️ 설정 파일 읽기 오류`);
      }
    }
  });
  
  console.log('\n💡 사용법: npm run mcp:profile switch <프로필명>\n');
}

function switchProfile(profileName) {
  if (!profiles[profileName]) {
    console.error(`❌ 알 수 없는 프로필: ${profileName}`);
    console.log('사용 가능한 프로필:', Object.keys(profiles).join(', '));
    return false;
  }
  
  const configPath = profiles[profileName];
  const fullPath = path.resolve(path.join(__dirname, '..', 'mcp-config', configPath));
  
  if (!fs.existsSync(fullPath)) {
    console.error(`❌ 프로필 설정 파일을 찾을 수 없습니다: ${fullPath}`);
    return false;
  }
  
  try {
    // 설정 파일 복사
    const configContent = fs.readFileSync(fullPath, 'utf8');
    const config = JSON.parse(configContent);
    
    // cursor.mcp.json에 적용
    fs.writeFileSync(CURSOR_MCP_PATH, JSON.stringify(config, null, 2));
    
    console.log(`✅ MCP 프로필이 '${profileName}'로 전환되었습니다!`);
    console.log(`📍 환경: ${config.environment || 'unknown'}`);
    console.log(`🔧 서버 수: ${Object.keys(config.mcpServers || {}).length}개`);
    console.log(`\n🔄 변경사항을 적용하려면 Cursor를 재시작하세요.\n`);
    
    return true;
  } catch (error) {
    console.error(`❌ 프로필 전환 중 오류:`, error.message);
    return false;
  }
}

function getCurrentProfile() {
  if (!fs.existsSync(CURSOR_MCP_PATH)) {
    console.log('❌ 현재 활성화된 MCP 설정이 없습니다.');
    return;
  }
  
  try {
    const config = JSON.parse(fs.readFileSync(CURSOR_MCP_PATH, 'utf8'));
    console.log(`\n📍 현재 활성 프로필: ${config.environment || 'unknown'}`);
    console.log(`🔧 서버 수: ${Object.keys(config.mcpServers || {}).length}개`);
    
    if (config.mcpServers) {
      console.log('\n🗄️ 활성화된 서버들:');
      Object.entries(config.mcpServers).forEach(([name, server]) => {
        const status = server.enabled !== false ? '✅' : '⏸️';
        console.log(`  ${status} ${name} - ${server.description || 'No description'}`);
      });
    }
    console.log();
  } catch (error) {
    console.error('❌ 현재 설정 읽기 오류:', error.message);
  }
}

function showStatus() {
  console.log('\n📊 MCP 프로필 전체 상태:\n');
  
  getCurrentProfile();
  
  console.log('─'.repeat(50));
  listProfiles();
}

// 메인 실행
const [,, command, profileName] = process.argv;

switch (command) {
  case 'list':
    listProfiles();
    break;
  case 'switch':
    if (!profileName) {
      console.error('❌ 프로필 이름을 지정해주세요.');
      showHelp();
    } else {
      switchProfile(profileName);
    }
    break;
  case 'current':
    getCurrentProfile();
    break;
  case 'status':
    showStatus();
    break;
  case 'help':
  case '--help':
  case '-h':
    showHelp();
    break;
  default:
    if (!command) {
      showStatus();
    } else {
      console.error(`❌ 알 수 없는 명령: ${command}`);
      showHelp();
    }
}