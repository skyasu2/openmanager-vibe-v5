/**
 * 서브 에이전트 실행을 위한 환경변수 검증 스크립트
 * MCP 서버별 필수 환경변수를 확인하고 누락된 항목을 보고합니다.
 */

import * as fs from 'fs';
import * as path from 'path';
import { config } from 'dotenv';

// .env.local 파일 로드
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  config({ path: envPath });
} else {
  console.error(
    '❌ .env.local 파일이 없습니다. .env.example을 복사하여 생성해주세요.'
  );
  process.exit(1);
}

// MCP 서버별 필수 환경변수 정의
const mcpRequirements: Record<string, string[]> = {
  github: ['GITHUB_TOKEN'],
  supabase: ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'],
  'tavily-mcp': ['TAVILY_API_KEY'],
};

// 서브 에이전트별 필수 MCP 매핑
const agentMcpMapping: Record<string, string[]> = {
  'ai-systems-engineer': [
    'supabase',
    'memory',
    'sequential-thinking',
    'filesystem',
  ],
  'mcp-server-admin': ['filesystem', 'tavily-mcp', 'github'],
  'issue-summary': ['supabase', 'filesystem', 'tavily-mcp'],
  'database-administrator': ['supabase', 'filesystem', 'memory'],
  'code-review-specialist': ['filesystem', 'github', 'serena'],
  'doc-structure-guardian': ['filesystem', 'github', 'memory'],
  'ux-performance-optimizer': ['filesystem', 'playwright', 'tavily-mcp'],
  'gemini-cli-collaborator': ['filesystem', 'github', 'sequential-thinking'],
  'test-automation-specialist': ['filesystem', 'playwright', 'github'],
  'central-supervisor': ['filesystem', 'memory', 'sequential-thinking'],
};

// 환경변수 검증 함수
function verifyEnvironment(): {
  valid: boolean;
  missing: string[];
  warnings: string[];
  summary: Record<string, any>;
} {
  const missing: string[] = [];
  const warnings: string[] = [];
  const summary: Record<string, any> = {};

  console.log('🔍 서브 에이전트 환경변수 검증 시작...\n');

  // 1. 기본 환경변수 확인
  console.log('📋 기본 환경변수 확인:');
  const basicEnvVars = [
    'GOOGLE_AI_API_KEY',
    'SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ];

  basicEnvVars.forEach(envVar => {
    if (process.env[envVar]) {
      console.log(`  ✅ ${envVar}: 설정됨`);
    } else {
      console.log(`  ❌ ${envVar}: 누락됨`);
      missing.push(envVar);
    }
  });

  // 2. MCP 서버별 환경변수 확인
  console.log('\n📋 MCP 서버별 환경변수 확인:');
  Object.entries(mcpRequirements).forEach(([mcp, requiredVars]) => {
    console.log(`\n  [${mcp}]`);
    const mcpStatus: Record<string, boolean> = {};

    requiredVars.forEach(envVar => {
      const isSet = !!process.env[envVar];
      mcpStatus[envVar] = isSet;

      if (isSet) {
        console.log(`    ✅ ${envVar}: 설정됨`);
      } else {
        console.log(`    ❌ ${envVar}: 누락됨`);
        missing.push(`${mcp}:${envVar}`);
      }
    });

    summary[mcp] = mcpStatus;
  });

  // 3. 에이전트별 MCP 준비 상태 확인
  console.log('\n📋 서브 에이전트별 MCP 준비 상태:');
  Object.entries(agentMcpMapping).forEach(([agent, mcps]) => {
    console.log(`\n  [${agent}]`);
    let allReady = true;

    mcps.forEach(mcp => {
      const requiredVars = mcpRequirements[mcp] || [];
      const isReady = requiredVars.every(envVar => !!process.env[envVar]);

      if (isReady || requiredVars.length === 0) {
        console.log(`    ✅ ${mcp}: 준비됨`);
      } else {
        console.log(`    ❌ ${mcp}: 환경변수 누락`);
        allReady = false;
      }
    });

    if (!allReady) {
      warnings.push(`${agent} 에이전트가 일부 MCP를 사용할 수 없습니다.`);
    }
  });

  // 4. 선택적 환경변수 확인
  console.log('\n📋 선택적 환경변수 확인:');
  const optionalEnvVars = [
    'SUPABASE_PROJECT_REF',
    'SUPABASE_ACCESS_TOKEN',
    'UPSTASH_REDIS_REST_URL',
    'UPSTASH_REDIS_REST_TOKEN',
  ];

  optionalEnvVars.forEach(envVar => {
    if (process.env[envVar]) {
      console.log(`  ✅ ${envVar}: 설정됨`);
    } else {
      console.log(`  ⚠️ ${envVar}: 설정 안 됨 (선택사항)`);
      warnings.push(
        `${envVar}가 설정되지 않았습니다. 일부 기능이 제한될 수 있습니다.`
      );
    }
  });

  // 5. 결과 요약
  const valid = missing.length === 0;

  console.log('\n📊 검증 결과 요약:');
  console.log(`  - 전체 상태: ${valid ? '✅ 정상' : '❌ 환경변수 누락'}`);
  console.log(`  - 누락된 필수 환경변수: ${missing.length}개`);
  console.log(`  - 경고사항: ${warnings.length}개`);

  return { valid, missing, warnings, summary };
}

// 환경변수 설정 가이드 출력
function printSetupGuide(missing: string[]): void {
  if (missing.length === 0) return;

  console.log('\n💡 환경변수 설정 가이드:');
  console.log('다음 환경변수들을 .env.local 파일에 추가해주세요:\n');

  const uniqueVars = new Set<string>();
  missing.forEach(item => {
    const [_mcp, envVar] = item.includes(':') ? item.split(':') : ['', item];
    if (envVar) uniqueVars.add(envVar);
  });

  uniqueVars.forEach(envVar => {
    switch (envVar) {
      case 'GITHUB_TOKEN':
        console.log(`${envVar}=ghp_your_personal_access_token`);
        console.log(
          '  → GitHub Settings > Developer settings > Personal access tokens에서 생성'
        );
        break;
      case 'SUPABASE_PROJECT_REF':
        console.log(`${envVar}=your-project-ref`);
        console.log('  → Supabase 대시보드 > Settings > General에서 확인');
        break;
      case 'SUPABASE_ACCESS_TOKEN':
        console.log(`${envVar}=sbp_your_access_token`);
        console.log('  → Supabase 대시보드 > Account > Access Tokens에서 생성');
        break;
      case 'TAVILY_API_KEY':
        console.log(`${envVar}=tvly-your_api_key`);
        console.log('  → https://tavily.com 에서 회원가입 후 API Key 발급');
        break;
      default:
        console.log(`${envVar}=your_value_here`);
    }
    console.log('');
  });
}

// 메인 실행
async function main() {
  console.log('🚀 OpenManager Vibe v5 - 서브 에이전트 환경변수 검증\n');

  const result = verifyEnvironment();

  if (!result.valid) {
    printSetupGuide(result.missing);
  }

  // 결과 파일 저장
  const reportPath = path.join(process.cwd(), 'env-verification-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(result, null, 2));
  console.log(`\n📄 검증 보고서가 ${reportPath}에 저장되었습니다.`);

  // 종료 코드 설정
  process.exit(result.valid ? 0 : 1);
}

// 실행
main().catch(console.error);
