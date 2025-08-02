#!/usr/bin/env node

/**
 * 🎭 Mock 시스템 상태 확인 스크립트
 * 
 * 현재 Mock 설정과 실행 상태를 확인
 */

const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

// 환경 변수 확인
const mockMode = process.env.MOCK_MODE || 'dev';
const mockConfig = {
  mode: mockMode,
  isActive: mockMode !== 'off',
  
  // 모드별 상태
  states: {
    force: mockMode === 'force',
    dev: mockMode === 'dev',
    test: mockMode === 'test',
    off: mockMode === 'off',
  },
  
  // Mock 옵션
  options: {
    responseDelay: parseInt(process.env.MOCK_RESPONSE_DELAY || '0'),
    enablePersistence: process.env.MOCK_ENABLE_PERSISTENCE !== 'false',
    enableLogging: process.env.MOCK_ENABLE_LOGGING === 'true',
    statsEnabled: process.env.MOCK_STATS_ENABLED !== 'false',
  },
};

// Mock 파일 존재 여부 확인
const mockFiles = {
  googleAI: 'src/lib/mock/providers/GoogleAIMock.ts',
  supabase: 'src/lib/mock/providers/SupabaseMock.ts',
  redis: 'src/lib/mock/providers/RedisMock.ts',
  gcpFunctions: 'src/lib/mock/providers/GCPMock.ts',
};

// Mock 데이터 디렉토리
const mockDataDirs = [
  '.redis-mock-data',
  '.supabase-mock-data',
  '.mock-stats-google-ai.json',
  '.mock-stats-supabase.json',
  '.mock-stats-gcp-functions.json',
];

function checkMockStatus() {
  console.log(chalk.blue.bold('🎭 Mock 시스템 상태 확인\n'));

  // 1. 현재 모드 표시
  console.log(chalk.yellow('📋 현재 설정:\n'));
  
  switch (mockConfig.mode) {
    case 'force':
      console.log(chalk.red.bold('   🔴 모든 서비스 Mock 강제 사용 중 (MOCK_MODE=force)'));
      break;
    case 'off':
      console.log(chalk.green.bold('   🟢 실제 서비스만 사용 중 (MOCK_MODE=off)'));
      break;
    case 'test':
      console.log(chalk.yellow.bold('   🧪 테스트 모드 - Mock 사용 (MOCK_MODE=test)'));
      break;
    case 'dev':
    default:
      console.log(chalk.cyan.bold('   🔵 개발 모드 - 자동 선택 (MOCK_MODE=dev)'));
  }
  console.log();

  // 2. 개별 서비스 상태
  console.log(chalk.yellow('🔧 서비스별 Mock 상태:\n'));
  
  const services = ['googleAI', 'supabase', 'redis', 'gcpFunctions'];
  services.forEach(service => {
    const icon = mockConfig.isActive ? '🎭' : '🌐';
    const status = mockConfig.isActive 
      ? (mockConfig.mode === 'force' ? chalk.red('Mock 강제') : chalk.cyan('자동 선택'))
      : chalk.green('실제 서비스');
    const mockFile = mockFiles[service];
    const exists = mockFile ? fs.existsSync(path.join(process.cwd(), mockFile)) : false;
    const fileStatus = exists ? chalk.green('✓') : chalk.red('✗');
    
    console.log(`   ${icon} ${chalk.bold(service.padEnd(12))} ${status.padEnd(20)} 파일: ${fileStatus}`);
  });
  console.log();

  // 3. Mock 옵션 상태
  console.log(chalk.yellow('⚙️  Mock 옵션:\n'));
  console.log(`   응답 지연: ${mockConfig.options.responseDelay}ms`);
  console.log(`   데이터 영속성: ${mockConfig.options.enablePersistence ? chalk.green('활성화') : chalk.gray('비활성화')}`);
  console.log(`   로깅: ${mockConfig.options.enableLogging ? chalk.green('활성화') : chalk.gray('비활성화')}`);
  console.log(`   통계 수집: ${mockConfig.options.statsEnabled ? chalk.green('활성화') : chalk.gray('비활성화')}`);
  console.log();

  // 4. Mock 데이터 상태
  console.log(chalk.yellow('💾 Mock 데이터 파일:\n'));
  
  mockDataDirs.forEach(item => {
    const fullPath = path.join(process.cwd(), item);
    const exists = fs.existsSync(fullPath);
    
    if (exists) {
      try {
        const stats = fs.statSync(fullPath);
        if (stats.isFile()) {
          const sizeKB = (stats.size / 1024).toFixed(1);
          console.log(`   ${chalk.green('✓')} ${item.padEnd(35)} ${sizeKB} KB`);
        } else if (stats.isDirectory()) {
          const files = fs.readdirSync(fullPath).length;
          console.log(`   ${chalk.green('✓')} ${item.padEnd(35)} ${files}개 파일`);
        }
      } catch (error) {
        console.log(`   ${chalk.red('✗')} ${item.padEnd(35)} 접근 불가`);
      }
    } else {
      console.log(`   ${chalk.gray('○')} ${item.padEnd(35)} 없음`);
    }
  });
  console.log();

  // 5. 실행 권장사항
  console.log(chalk.blue.bold('💡 실행 권장사항:\n'));
  
  if (mockConfig.forceAll) {
    console.log(chalk.gray('   현재 모든 Mock이 강제 사용 중입니다.'));
    console.log(chalk.cyan('   실제 서비스를 사용하려면: npm run dev:real'));
  } else if (mockConfig.useReal) {
    console.log(chalk.gray('   현재 실제 서비스가 강제 사용 중입니다.'));
    console.log(chalk.cyan('   Mock을 사용하려면: npm run dev:mock'));
  } else {
    console.log(chalk.cyan('   하이브리드 모드가 활성화되어 있습니다.'));
    console.log(chalk.gray('   상황에 따라 Mock과 실제 서비스가 자동 선택됩니다.'));
  }
  console.log();

  // 6. 환경 변수 설정 방법
  console.log(chalk.yellow('🔧 환경 변수 설정 방법:\n'));
  console.log(chalk.gray('   # .env.local 파일에서 설정'));
  console.log(chalk.gray('   FORCE_MOCK_ALL=true         # 모든 Mock 강제'));
  console.log(chalk.gray('   USE_REAL_SERVICES=true      # 실제 서비스 강제'));
  console.log(chalk.gray('   MOCK_MODE=hybrid            # 하이브리드 모드'));
  console.log();

  // 7. 유용한 명령어
  console.log(chalk.yellow('🚀 유용한 명령어:\n'));
  console.log(chalk.cyan('   npm run mock:stats     ') + chalk.gray('# Mock 사용 통계 확인'));
  console.log(chalk.cyan('   npm run check:usage    ') + chalk.gray('# 무료 티어 사용량 확인'));
  console.log(chalk.cyan('   npm run dev:mock       ') + chalk.gray('# Mock 모드로 개발'));
  console.log(chalk.cyan('   npm run dev:real       ') + chalk.gray('# 실제 서비스로 개발'));
  console.log(chalk.cyan('   npm run dev:hybrid     ') + chalk.gray('# 하이브리드 모드로 개발'));
}

// 현재 프로세스의 Mock 사용 여부 감지
function detectCurrentMockUsage() {
  console.log('\n' + chalk.yellow.bold('🔍 현재 프로세스 Mock 사용 감지:\n'));

  // Mock 관련 환경 변수들
  const mockEnvVars = [
    'FORCE_MOCK_ALL',
    'USE_REAL_SERVICES',
    'MOCK_MODE',
    'FORCE_MOCK_SUPABASE',
    'FORCE_MOCK_REDIS',
    'FORCE_MOCK_GCP_FUNCTIONS',
    'FORCE_MOCK_GOOGLE_AI',
  ];

  const activeVars = mockEnvVars.filter(varName => process.env[varName]);

  if (activeVars.length > 0) {
    console.log(chalk.green('   활성화된 Mock 환경 변수:'));
    activeVars.forEach(varName => {
      console.log(`   • ${varName}=${process.env[varName]}`);
    });
  } else {
    console.log(chalk.gray('   Mock 관련 환경 변수가 설정되지 않았습니다.'));
  }
  
  // NODE_ENV 확인
  const env = process.env.NODE_ENV || 'development';
  console.log(`\n   NODE_ENV: ${chalk.cyan(env)}`);
  
  const isDevelopment = env === 'development';
  const isTest = env === 'test';
  
  if (isDevelopment || isTest) {
    console.log(chalk.green(`   → ${env} 환경에서는 기본적으로 Mock 사용`));
  } else {
    console.log(chalk.yellow(`   → ${env} 환경에서는 실제 서비스 사용`));
  }
  console.log();
}

// 메인 실행
function main() {
  checkMockStatus();
  detectCurrentMockUsage();
  console.log(chalk.green('✨ Mock 상태 확인 완료!\n'));
}

main();