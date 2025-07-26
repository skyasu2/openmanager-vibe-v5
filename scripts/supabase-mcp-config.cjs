#!/usr/bin/env node

/**
 * 🔧 Supabase MCP 설정 개선
 * 공개 환경변수를 활용한 MCP 연결 설정
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Supabase MCP 설정 개선 중...\n');

// 환경변수에서 가져오기 (없으면 플레이스홀더 사용)
const publicEnvVars = {
  SUPABASE_URL: process.env.SUPABASE_URL || 'https://your_project_id.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY:
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY_PLACEHOLDER',
};

// Claude 설정 파일에서 Supabase MCP 환경변수 설정
function updateClaudeSettings() {
  const settingsPath = path.join(
    __dirname,
    '..',
    '.claude',
    'settings.local.json'
  );

  if (!fs.existsSync(settingsPath)) {
    console.error('❌ Claude 설정 파일을 찾을 수 없습니다');
    return false;
  }

  try {
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));

    // Supabase MCP에 환경변수 추가 권한 부여
    const supabasePermissions = [
      'mcp__supabase__list_projects',
      'mcp__supabase__execute_sql',
      'mcp__supabase__search_docs',
      'mcp__supabase__get_project',
      'mcp__supabase__list_tables',
    ];

    // 권한이 없으면 추가
    supabasePermissions.forEach(permission => {
      if (!settings.permissions.allow.includes(permission)) {
        settings.permissions.allow.push(permission);
      }
    });

    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
    console.log('✅ Claude 설정이 업데이트되었습니다');
    return true;
  } catch (error) {
    console.error('❌ Claude 설정 업데이트 실패:', error.message);
    return false;
  }
}

// 환경변수 파일 생성 (MCP 전용)
function createMcpEnvFile() {
  const mcpEnvContent = `# 🔧 Supabase MCP 전용 환경변수
# 공개 안전한 변수들만 사용

SUPABASE_URL="${publicEnvVars.SUPABASE_URL}"
SUPABASE_ANON_KEY="${publicEnvVars.NEXT_PUBLIC_SUPABASE_ANON_KEY}"

# 📝 참고: 전체 기능을 위해서는 service_role 키가 필요합니다
# SUPABASE_ACCESS_TOKEN="your_service_role_key_here"
`;

  const mcpEnvPath = path.join(__dirname, '..', '.env.mcp');
  fs.writeFileSync(mcpEnvPath, mcpEnvContent);
  console.log('✅ MCP 전용 환경변수 파일이 생성되었습니다: .env.mcp');
}

// 사용법 안내 출력
function printUsageGuide() {
  console.log(`
📋 Supabase MCP 설정 완료 상태:

✅ 현재 사용 가능:
- 공개 읽기 전용 기능
- 문서 검색 (search_docs)
- 기본 프로젝트 정보

⚠️ 제한된 기능:
- 테이블 데이터 조회
- SQL 실행
- 프로젝트 관리

🔧 전체 기능 활성화 방법:

1. **서비스 역할 키 사용**:
   export SUPABASE_ACCESS_TOKEN="sbp_your_service_role_key_here"

2. **또는 스크립트 실행**:
   node scripts/supabase-token-setup.cjs "your_token"

💡 현재 설정으로 시도 가능한 MCP 명령어:
- mcp__supabase__search_docs
- mcp__supabase__get_project (제한적)

🔍 테스트 명령어:
Claude Code에서 "Supabase 문서에서 Row Level Security 검색해줘" 시도
`);
}

// 실행
console.log('🚀 Supabase MCP 설정 개선 시작...\n');

if (updateClaudeSettings()) {
  createMcpEnvFile();
  printUsageGuide();
  console.log('\n✨ Supabase MCP 설정 개선이 완료되었습니다!');
} else {
  console.log('\n❌ 설정 개선에 실패했습니다.');
}
