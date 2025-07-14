#!/usr/bin/env node

/**
 * 🔐 통합 환경변수 암호화/복호화 스크립트
 * 
 * 사용법:
 * - 암호화: node scripts/unified-env-crypto.mjs encrypt --password=your-password
 * - 복호화: node scripts/unified-env-crypto.mjs decrypt --password=your-password
 * - 확인: node scripts/unified-env-crypto.mjs verify --password=your-password
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { EnhancedEnvCryptoManager } = require('../src/lib/crypto/EnhancedEnvCryptoManager.ts');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

// 색상 코드
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// 로그 헬퍼
const log = {
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  header: (msg) => console.log(`\n${colors.magenta}${'='.repeat(50)}\n${msg}\n${'='.repeat(50)}${colors.reset}\n`)
};

// 커맨드라인 인자 파싱
function parseArgs() {
  const args = process.argv.slice(2);
  const command = args[0];
  const options = {};
  
  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const [key, value] = arg.slice(2).split('=');
      options[key] = value || true;
    }
  }
  
  return { command, options };
}

// 비밀번호 가져오기
async function getPassword(options) {
  // 1. 커맨드라인 인자
  if (options.password) {
    return options.password;
  }
  
  // 2. 파일에서 읽기
  if (options['password-file']) {
    const passwordPath = path.resolve(PROJECT_ROOT, options['password-file']);
    try {
      const password = await fs.readFile(passwordPath, 'utf-8');
      return password.trim();
    } catch (error) {
      throw new Error(`비밀번호 파일을 읽을 수 없습니다: ${passwordPath}`);
    }
  }
  
  // 3. 환경변수
  if (process.env.ENV_MASTER_PASSWORD) {
    return process.env.ENV_MASTER_PASSWORD;
  }
  
  throw new Error('비밀번호가 필요합니다. --password, --password-file 또는 ENV_MASTER_PASSWORD 환경변수를 사용하세요.');
}

// .env 파일 로드
async function loadEnvFile(envPath) {
  try {
    const envContent = await fs.readFile(envPath, 'utf-8');
    const env = dotenv.parse(envContent);
    
    // 민감한 변수만 필터링
    const sensitiveKeys = [
      'GOOGLE_AI_API_KEY',
      'NEXTAUTH_SECRET',
      'GITHUB_CLIENT_ID',
      'GITHUB_CLIENT_SECRET',
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
      'UPSTASH_REDIS_REST_URL',
      'UPSTASH_REDIS_REST_TOKEN',
      'GOOGLE_OAUTH_ID',
      'GOOGLE_OAUTH_SECRET',
      'SENTRY_DSN',
      'ANALYTICS_ID'
    ];
    
    const filteredEnv = {};
    for (const key of sensitiveKeys) {
      if (env[key]) {
        filteredEnv[key] = env[key];
      }
    }
    
    return filteredEnv;
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`환경변수 파일을 찾을 수 없습니다: ${envPath}`);
    }
    throw error;
  }
}

// 암호화된 설정 저장
async function saveEncryptedConfig(config) {
  const configPath = path.join(PROJECT_ROOT, 'config', 'encrypted-env.json');
  const configDir = path.dirname(configPath);
  
  // 디렉토리 생성
  await fs.mkdir(configDir, { recursive: true });
  
  // JSON으로 저장
  await fs.writeFile(
    configPath,
    JSON.stringify(config, null, 2),
    'utf-8'
  );
  
  // TypeScript 파일로도 저장 (타입 안정성을 위해)
  const tsContent = `/**
 * 🔐 암호화된 환경변수 설정
 * 
 * 이 파일은 자동 생성됩니다. 직접 수정하지 마세요.
 * 생성 시간: ${new Date().toISOString()}
 */

import type { EncryptedEnvConfig } from '@/lib/crypto/EnhancedEnvCryptoManager';

export const encryptedEnvConfig: EncryptedEnvConfig = ${JSON.stringify(config, null, 2)};
`;
  
  await fs.writeFile(
    path.join(PROJECT_ROOT, 'config', 'encrypted-env-config.ts'),
    tsContent,
    'utf-8'
  );
}

// 암호화 명령
async function encryptCommand(options) {
  log.header('🔐 환경변수 암호화');
  
  try {
    // 비밀번호 가져오기
    const password = await getPassword(options);
    log.info('마스터 비밀번호 확인됨');
    
    // .env 파일 경로
    const envPath = path.join(PROJECT_ROOT, options.env || '.env.local');
    log.info(`환경변수 파일 로드: ${envPath}`);
    
    // 환경변수 로드
    const env = await loadEnvFile(envPath);
    log.success(`${Object.keys(env).length}개 민감한 환경변수 발견`);
    
    // 암호화 매니저 초기화
    const cryptoManager = new EnhancedEnvCryptoManager();
    cryptoManager.initializeMasterKey(password);
    
    // 환경변수 암호화
    log.info('환경변수 암호화 중...');
    const encryptedConfig = cryptoManager.encryptEnvironment(env);
    
    // 저장
    await saveEncryptedConfig(encryptedConfig);
    log.success('암호화된 설정 저장 완료');
    
    // 요약
    log.header('📊 암호화 완료');
    log.info(`총 ${Object.keys(env).length}개 환경변수 암호화됨`);
    log.info(`저장 위치: config/encrypted-env-config.ts`);
    log.warning('Git에 커밋하기 전에 .env 파일은 반드시 .gitignore에 추가하세요!');
    
  } catch (error) {
    log.error(`암호화 실패: ${error.message}`);
    process.exit(1);
  }
}

// 복호화 명령
async function decryptCommand(options) {
  log.header('🔓 환경변수 복호화');
  
  try {
    // 비밀번호 가져오기
    const password = await getPassword(options);
    log.info('마스터 비밀번호 확인됨');
    
    // 암호화된 설정 로드
    const configPath = path.join(PROJECT_ROOT, 'config', 'encrypted-env-config.ts');
    const configModule = await import(configPath);
    const encryptedConfig = configModule.encryptedEnvConfig;
    log.success('암호화된 설정 로드됨');
    
    // 암호화 매니저 초기화
    const cryptoManager = new EnhancedEnvCryptoManager();
    cryptoManager.initializeMasterKey(password);
    
    // 복호화
    log.info('환경변수 복호화 중...');
    const decryptedEnv = cryptoManager.decryptEnvironment(encryptedConfig);
    
    // 출력 옵션에 따라 처리
    if (options.output === 'env') {
      // .env 형식으로 출력
      for (const [key, value] of Object.entries(decryptedEnv)) {
        console.log(`${key}=${value}`);
      }
    } else if (options.output === 'json') {
      // JSON 형식으로 출력
      console.log(JSON.stringify(decryptedEnv, null, 2));
    } else {
      // 기본: 키만 표시
      log.header('📊 복호화 완료');
      log.success(`${Object.keys(decryptedEnv).length}개 환경변수 복호화됨:`);
      for (const key of Object.keys(decryptedEnv)) {
        log.info(`  - ${key}`);
      }
    }
    
  } catch (error) {
    log.error(`복호화 실패: ${error.message}`);
    process.exit(1);
  }
}

// 검증 명령
async function verifyCommand(options) {
  log.header('🔍 환경변수 암호화 검증');
  
  try {
    // 비밀번호 가져오기
    const password = await getPassword(options);
    log.info('마스터 비밀번호 확인됨');
    
    // 암호화된 설정 로드
    const configPath = path.join(PROJECT_ROOT, 'config', 'encrypted-env-config.ts');
    const configModule = await import(configPath);
    const encryptedConfig = configModule.encryptedEnvConfig;
    log.success('암호화된 설정 로드됨');
    
    // 암호화 매니저 초기화
    const cryptoManager = new EnhancedEnvCryptoManager();
    cryptoManager.initializeMasterKey(password);
    
    // 복호화 시도
    log.info('무결성 검증 중...');
    const decryptedEnv = cryptoManager.decryptEnvironment(encryptedConfig);
    
    // 검증 결과
    log.header('✅ 검증 성공');
    log.success(`체크섬 검증: 통과`);
    log.success(`복호화 가능: ${Object.keys(decryptedEnv).length}개 변수`);
    log.info(`버전: ${encryptedConfig.version}`);
    log.info(`환경: ${encryptedConfig.environment}`);
    log.info(`생성 시간: ${new Date(encryptedConfig.variables[Object.keys(encryptedConfig.variables)[0]]?.timestamp).toLocaleString()}`);
    
  } catch (error) {
    log.error(`검증 실패: ${error.message}`);
    process.exit(1);
  }
}

// 도움말
function showHelp() {
  console.log(`
${colors.cyan}🔐 통합 환경변수 암호화 도구${colors.reset}

사용법:
  node scripts/unified-env-crypto.mjs <command> [options]

명령어:
  encrypt   환경변수를 암호화합니다
  decrypt   암호화된 환경변수를 복호화합니다
  verify    암호화된 설정의 무결성을 검증합니다
  help      이 도움말을 표시합니다

옵션:
  --password=<password>      마스터 비밀번호 직접 지정
  --password-file=<path>     파일에서 마스터 비밀번호 읽기
  --env=<path>              환경변수 파일 경로 (기본: .env.local)
  --output=<format>         복호화 출력 형식 (env, json, keys)

예제:
  # 암호화
  node scripts/unified-env-crypto.mjs encrypt --password="my-secret-password"
  
  # 파일에서 비밀번호 읽어서 암호화
  echo "my-secret-password" > .env.key
  node scripts/unified-env-crypto.mjs encrypt --password-file=.env.key
  
  # 복호화해서 환경변수 형식으로 출력
  node scripts/unified-env-crypto.mjs decrypt --password-file=.env.key --output=env > .env.decrypted
  
  # 무결성 검증
  node scripts/unified-env-crypto.mjs verify --password-file=.env.key

환경변수:
  ENV_MASTER_PASSWORD    마스터 비밀번호 (옵션보다 우선순위 낮음)
`);
}

// 메인 함수
async function main() {
  const { command, options } = parseArgs();
  
  switch (command) {
    case 'encrypt':
      await encryptCommand(options);
      break;
    case 'decrypt':
      await decryptCommand(options);
      break;
    case 'verify':
      await verifyCommand(options);
      break;
    case 'help':
    case undefined:
      showHelp();
      break;
    default:
      log.error(`알 수 없는 명령어: ${command}`);
      showHelp();
      process.exit(1);
  }
}

// 실행
main().catch(error => {
  log.error(`치명적 오류: ${error.message}`);
  process.exit(1);
});