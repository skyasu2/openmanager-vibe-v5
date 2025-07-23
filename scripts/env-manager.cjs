#!/usr/bin/env node

/**
 * 🔐 OpenManager VIBE v5 - 통합 환경변수 관리 도구
 * 
 * 환경변수 백업, 복원, 암호화를 위한 통합 개발 도구
 * 기존 분산된 기능들을 하나로 통합하고 중복을 제거
 * 
 * 사용법:
 * npm run env:manage -- <command> [options]
 * node scripts/env-manager.cjs <command> [options]
 */

const CryptoJS = require('crypto-js');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { execSync } = require('child_process');

// 환경변수 로드
const dotenv = require('dotenv');
const envPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

// 색상 코드
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// 로깅 헬퍼
const log = {
  title: (msg) => console.log(`\n${colors.bright}${colors.blue}🔐 ${msg}${colors.reset}\n`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warn: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.cyan}ℹ️  ${msg}${colors.reset}`),
  item: (key, value, encrypted = false) => {
    const icon = encrypted ? '🔒' : '📝';
    console.log(`  ${icon} ${colors.bright}${key}${colors.reset}: ${value}`);
  },
};

// 민감한 환경변수 목록
const SENSITIVE_VARS = [
  'GITHUB_TOKEN',
  'GITHUB_CLIENT_SECRET',
  'GITHUB_CLIENT_ID',
  'NEXTAUTH_SECRET',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_JWT_SECRET',
  'SUPABASE_DB_PASSWORD',
  'GOOGLE_AI_API_KEY',
  'UPSTASH_REDIS_REST_TOKEN',
  'KV_REST_API_TOKEN',
  'KV_REST_API_READ_ONLY_TOKEN',
  'REDIS_TOKEN',
  'ENCRYPTION_KEY',
  'SUPABASE_ACCESS_TOKEN',
];

// 시스템 환경변수 (백업에서 제외)
const SYSTEM_VARS = [
  /^npm_/,
  /^NODE_/,
  /PATH$/,
  /^TEMP/,
  /^TMP/,
  /^HOME$/,
  /^USER$/,
  /^SHELL$/,
  /^TERM/,
  /^LANG$/,
  /^LC_/,
  /^PWD$/,
  /^OLDPWD$/,
  /^_$/,
];

class EnvManager {
  constructor() {
    this.encryptionKey = this.getEncryptionKey();
    this.rl = null;
  }

  /**
   * 암호화 키 가져오기
   */
  getEncryptionKey() {
    return process.env.ENCRYPTION_KEY || 'openmanager-vibe-v5-2025-production-key';
  }

  /**
   * 암호화
   */
  encrypt(text) {
    try {
      return CryptoJS.AES.encrypt(text, this.encryptionKey).toString();
    } catch (error) {
      throw new Error(`암호화 실패: ${error.message}`);
    }
  }

  /**
   * 복호화
   */
  decrypt(encryptedText) {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedText, this.encryptionKey);
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);
      if (!decrypted) {
        throw new Error('복호화 결과가 비어있음');
      }
      return decrypted;
    } catch (error) {
      throw new Error(`복호화 실패: ${error.message}`);
    }
  }

  /**
   * 시스템 변수인지 확인
   */
  isSystemVar(key) {
    return SYSTEM_VARS.some(pattern => {
      if (pattern instanceof RegExp) {
        return pattern.test(key);
      }
      return key === pattern;
    });
  }

  /**
   * 민감한 변수인지 확인
   */
  isSensitiveVar(key) {
    return SENSITIVE_VARS.includes(key);
  }

  /**
   * 사용자 입력 받기
   */
  async question(prompt) {
    if (!this.rl) {
      this.rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });
    }

    return new Promise((resolve) => {
      this.rl.question(`${colors.yellow}${prompt}${colors.reset} `, resolve);
    });
  }

  /**
   * 환경변수 백업
   */
  async backup(options = {}) {
    log.title('환경변수 백업');

    const backup = {
      version: '2.0',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      description: options.description || 'OpenManager VIBE v5 환경변수 백업',
      encryptionMethod: 'AES',
      variables: {},
    };

    let totalVars = 0;
    let encryptedVars = 0;
    let skippedVars = 0;

    // .env.local 파일 읽기
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envVars = {};

    // 환경변수 파싱
    envContent.split('\n').forEach(line => {
      line = line.trim();
      if (!line || line.startsWith('#')) return;
      
      const index = line.indexOf('=');
      if (index === -1) return;
      
      const key = line.substring(0, index).trim();
      const value = line.substring(index + 1).trim();
      
      // 따옴표 제거
      const cleanValue = value.replace(/^["']|["']$/g, '');
      envVars[key] = cleanValue;
    });

    // 환경변수 처리
    for (const [key, value] of Object.entries(envVars)) {
      if (this.isSystemVar(key)) {
        skippedVars++;
        continue;
      }

      totalVars++;
      
      if (this.isSensitiveVar(key)) {
        // 민감한 변수는 암호화
        backup.variables[key] = {
          value: this.encrypt(value),
          encrypted: true,
          sensitive: true,
          timestamp: new Date().toISOString(),
        };
        encryptedVars++;
        log.item(key, '암호화됨', true);
      } else {
        // 일반 변수는 평문
        backup.variables[key] = {
          value: value,
          encrypted: false,
          sensitive: false,
          timestamp: new Date().toISOString(),
        };
        log.item(key, '평문 저장');
      }
    }

    // 백업 디렉토리 생성
    const backupDir = path.join(__dirname, '../config/env-backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // 백업 파일 저장
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `env-backup-${timestamp}.json`;
    const backupPath = path.join(backupDir, backupFileName);
    
    fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2));

    // 최신 백업 링크 생성
    const latestPath = path.join(__dirname, '../config/env-backup-latest.json');
    fs.writeFileSync(latestPath, JSON.stringify(backup, null, 2));

    console.log('\n📊 백업 통계:');
    console.log(`   총 변수: ${totalVars}개`);
    console.log(`   암호화: ${encryptedVars}개`);
    console.log(`   평문: ${totalVars - encryptedVars}개`);
    console.log(`   제외: ${skippedVars}개`);
    console.log(`\n📁 백업 파일:`);
    console.log(`   메인: ${backupPath}`);
    console.log(`   링크: ${latestPath}`);
    
    log.success('백업이 완료되었습니다! (GitHub에 안전하게 커밋 가능)');
  }

  /**
   * 환경변수 복원
   */
  async restore(options = {}) {
    log.title('환경변수 복원');

    // 백업 파일 찾기
    let backupPath = options.file;
    if (!backupPath) {
      // 기본 경로 확인
      const latestPath = path.join(__dirname, '../config/env-backup-latest.json');
      const defaultPath = path.join(__dirname, '../config/env-backup.json');
      
      if (fs.existsSync(latestPath)) {
        backupPath = latestPath;
      } else if (fs.existsSync(defaultPath)) {
        backupPath = defaultPath;
      } else {
        log.error('백업 파일을 찾을 수 없습니다');
        return;
      }
    }

    if (!fs.existsSync(backupPath)) {
      log.error(`백업 파일을 찾을 수 없습니다: ${backupPath}`);
      return;
    }

    const backup = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
    
    console.log(`📅 백업 날짜: ${backup.timestamp}`);
    console.log(`📝 설명: ${backup.description}`);
    console.log(`🌍 환경: ${backup.environment}\n`);

    let envContent = `# 🔐 OpenManager VIBE v5 - 환경변수\n`;
    envContent += `# 복원 날짜: ${new Date().toISOString()}\n`;
    envContent += `# 백업 날짜: ${backup.timestamp}\n`;
    envContent += `# ========================================\n\n`;

    let restoredVars = 0;
    let decryptedVars = 0;
    let failedVars = 0;

    // 카테고리별로 그룹화
    const categories = {
      app: [],
      supabase: [],
      redis: [],
      google: [],
      github: [],
      encryption: [],
      dev: [],
      other: [],
    };

    // 환경변수 분류
    for (const [key, data] of Object.entries(backup.variables)) {
      let category = 'other';
      
      if (key.includes('SUPABASE')) category = 'supabase';
      else if (key.includes('REDIS') || key.includes('KV_') || key.includes('UPSTASH')) category = 'redis';
      else if (key.includes('GOOGLE')) category = 'google';
      else if (key.includes('GITHUB') || key.includes('NEXTAUTH')) category = 'github';
      else if (key.includes('ENCRYPTION') || key.includes('ENCRYPTED')) category = 'encryption';
      else if (key.includes('NODE_ENV') || key.includes('DEVELOPMENT') || key.includes('TEST')) category = 'dev';
      else if (key.includes('NEXT_PUBLIC') || key.includes('APP_URL')) category = 'app';
      
      categories[category].push({ key, data });
    }

    // 카테고리별로 환경변수 추가
    const categoryTitles = {
      app: '📱 애플리케이션 URL 설정',
      supabase: '🗄️ Supabase 데이터베이스 설정',
      redis: '💾 Upstash Redis 설정',
      google: '🤖 Google AI 설정',
      github: '🔐 GitHub OAuth 설정 (NextAuth)',
      encryption: '🔒 암호화 설정',
      dev: '🛠️ 개발 환경 설정',
      other: '📦 기타 설정',
    };

    for (const [category, vars] of Object.entries(categories)) {
      if (vars.length === 0) continue;
      
      envContent += `# ========================================\n`;
      envContent += `# ${categoryTitles[category]}\n`;
      envContent += `# ========================================\n`;

      for (const { key, data } of vars) {
        try {
          let value = data.value;
          
          if (data.encrypted) {
            value = this.decrypt(value);
            decryptedVars++;
            log.item(key, '복호화됨', true);
          } else {
            log.item(key, '평문 복원');
          }

          // 값에 따옴표가 필요한지 확인
          if (value.includes(' ') || value.includes('#')) {
            envContent += `${key}="${value}"\n`;
          } else {
            envContent += `${key}=${value}\n`;
          }
          
          restoredVars++;
        } catch (error) {
          log.error(`${key}: 복원 실패 - ${error.message}`);
          failedVars++;
        }
      }
      
      envContent += '\n';
    }

    // .env.local 파일 생성
    if (options.dryRun) {
      console.log('\n📄 생성될 환경변수 파일 (dry-run):');
      console.log('----------------------------------------');
      console.log(envContent);
      console.log('----------------------------------------');
    } else {
      // 기존 파일 백업
      if (fs.existsSync(envPath)) {
        const backupName = `.env.local.backup.${Date.now()}`;
        fs.copyFileSync(envPath, path.join(__dirname, '..', backupName));
        log.info(`기존 파일 백업: ${backupName}`);
      }

      fs.writeFileSync(envPath, envContent);
      log.info(`파일 생성: ${envPath}`);
    }

    console.log('\n📊 복원 통계:');
    console.log(`   복원: ${restoredVars}개`);
    console.log(`   복호화: ${decryptedVars}개`);
    console.log(`   실패: ${failedVars}개`);
    
    if (!options.dryRun) {
      log.success('환경변수가 성공적으로 복원되었습니다!');
    }
  }

  /**
   * 특정 환경변수 암호화
   */
  async encryptVar(key, value) {
    log.title(`환경변수 암호화: ${key}`);

    if (!value) {
      value = await this.question(`${key}의 값을 입력하세요:`);
    }

    try {
      const encrypted = this.encrypt(value);
      
      console.log('\n📋 결과:');
      console.log(`원본: ${value.substring(0, 10)}...`);
      console.log(`암호화: ${encrypted}`);
      
      // 복호화 테스트
      const decrypted = this.decrypt(encrypted);
      if (decrypted === value) {
        log.success('암호화 및 복호화 테스트 성공!');
      } else {
        log.error('복호화 테스트 실패!');
      }

      // 환경변수 업데이트 제안
      console.log('\n💡 환경변수 업데이트:');
      console.log(`${key}_ENCRYPTED=${encrypted}`);
      
    } catch (error) {
      log.error(`암호화 실패: ${error.message}`);
    }
  }

  /**
   * 환경변수 상태 확인
   */
  async status() {
    log.title('환경변수 상태 확인');

    if (!fs.existsSync(envPath)) {
      log.error('.env.local 파일을 찾을 수 없습니다');
      return;
    }

    const envContent = fs.readFileSync(envPath, 'utf8');
    const envVars = {};
    let totalVars = 0;
    let sensitiveVars = 0;
    let missingVars = [];

    // 환경변수 파싱
    envContent.split('\n').forEach(line => {
      line = line.trim();
      if (!line || line.startsWith('#')) return;
      
      const index = line.indexOf('=');
      if (index === -1) return;
      
      const key = line.substring(0, index).trim();
      const value = line.substring(index + 1).trim();
      
      envVars[key] = value.replace(/^["']|["']$/g, '');
      totalVars++;
      
      if (this.isSensitiveVar(key)) {
        sensitiveVars++;
      }
    });

    // 필수 환경변수 확인
    const requiredVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
      'GITHUB_CLIENT_ID',
      'GITHUB_CLIENT_SECRET',
      'NEXTAUTH_SECRET',
    ];

    requiredVars.forEach(key => {
      if (!envVars[key] || envVars[key] === 'your_value_here') {
        missingVars.push(key);
      }
    });

    console.log('📊 환경변수 통계:');
    console.log(`   총 변수: ${totalVars}개`);
    console.log(`   민감한 변수: ${sensitiveVars}개`);
    console.log(`   누락된 필수 변수: ${missingVars.length}개`);

    if (missingVars.length > 0) {
      console.log('\n⚠️  누락된 필수 환경변수:');
      missingVars.forEach(key => {
        console.log(`   - ${key}`);
      });
    }

    // 백업 상태 확인
    console.log('\n💾 백업 상태:');
    const backupDir = path.join(__dirname, '../config/env-backups');
    if (fs.existsSync(backupDir)) {
      const backups = fs.readdirSync(backupDir)
        .filter(f => f.startsWith('env-backup-'))
        .sort()
        .reverse();
      
      console.log(`   백업 파일: ${backups.length}개`);
      if (backups.length > 0) {
        console.log(`   최신 백업: ${backups[0]}`);
      }
    }

    const latestPath = path.join(__dirname, '../config/env-backup-latest.json');
    if (fs.existsSync(latestPath)) {
      const latest = JSON.parse(fs.readFileSync(latestPath, 'utf8'));
      console.log(`   최신 백업 날짜: ${latest.timestamp}`);
    }

    if (missingVars.length === 0) {
      log.success('모든 필수 환경변수가 설정되어 있습니다!');
    } else {
      log.warn('일부 필수 환경변수가 누락되었습니다.');
    }
  }

  /**
   * 도움말 표시
   */
  showHelp() {
    console.log(`
${colors.bright}${colors.blue}🔐 OpenManager VIBE v5 - 통합 환경변수 관리 도구${colors.reset}

${colors.cyan}사용법:${colors.reset}
  node scripts/env-manager.cjs <command> [options]
  npm run env:manage -- <command> [options]

${colors.cyan}명령어:${colors.reset}
  backup              현재 환경변수를 백업 (암호화 포함)
  restore             백업에서 환경변수 복원
  encrypt <key>       특정 환경변수 암호화
  status              환경변수 상태 확인
  help                이 도움말 표시

${colors.cyan}옵션:${colors.reset}
  --file <path>       백업 파일 경로 지정 (restore)
  --dry-run           실제 파일 생성하지 않고 미리보기 (restore)
  --description       백업 설명 추가 (backup)

${colors.cyan}예시:${colors.reset}
  npm run env:manage -- backup
  npm run env:manage -- restore
  npm run env:manage -- restore --dry-run
  npm run env:manage -- encrypt GOOGLE_AI_API_KEY
  npm run env:manage -- status

${colors.yellow}특징:${colors.reset}
  • 민감한 환경변수 자동 암호화
  • GitHub에 안전하게 커밋 가능한 백업
  • 카테고리별 정리된 복원
  • 필수 환경변수 누락 체크
  • 기존 파일 자동 백업
`);
  }

  /**
   * 리소스 정리
   */
  cleanup() {
    if (this.rl) {
      this.rl.close();
    }
  }
}

// CLI 실행
async function main() {
  const manager = new EnvManager();
  const args = process.argv.slice(2);
  const command = args[0];
  const options = {};

  // 옵션 파싱
  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--file' && args[i + 1]) {
      options.file = args[i + 1];
      i++;
    } else if (args[i] === '--dry-run') {
      options.dryRun = true;
    } else if (args[i] === '--description' && args[i + 1]) {
      options.description = args[i + 1];
      i++;
    }
  }

  try {
    switch (command) {
      case 'backup':
        await manager.backup(options);
        break;
      
      case 'restore':
        await manager.restore(options);
        break;
      
      case 'encrypt':
        const key = args[1];
        const value = args[2];
        if (!key) {
          log.error('환경변수 키를 지정해주세요');
          manager.showHelp();
        } else {
          await manager.encryptVar(key, value);
        }
        break;
      
      case 'status':
        await manager.status();
        break;
      
      case 'help':
      default:
        manager.showHelp();
        break;
    }
  } catch (error) {
    log.error(`오류 발생: ${error.message}`);
    process.exit(1);
  } finally {
    manager.cleanup();
  }
}

// 모듈로 내보내기
module.exports = EnvManager;

// CLI로 실행된 경우
if (require.main === module) {
  main();
}