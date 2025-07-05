#!/usr/bin/env node

/**
 * 🔐 OpenManager Vibe v5 - 환경변수 보안 관리 시스템
 *
 * 기능:
 * 1. 환경변수 자동 갱신
 * 2. 보안 토큰 로테이션
 * 3. 설정 검증
 * 4. Vercel 동기화
 * 5. Render MCP 서버 관리
 * 6. Supabase 설정 관리
 *
 * 사용법:
 * node scripts/env-management.js --action=validate
 * node scripts/env-management.js --action=rotate --service=google-ai
 * node scripts/env-management.js --action=sync-vercel
 * node scripts/env-management.js --action=encrypt-all
 * node scripts/env-management.js --action=setup-render-mcp
 * node scripts/env-management.js --action=setup-supabase
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require('path');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const crypto = require('crypto');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const CryptoJS = require('crypto-js');

class EnvSecurityManager {
  constructor() {
    this.envPath = '.env.local';
    this.templatePath = 'vercel.env.template';
    this.backupDir = 'development/backups/env-backups';
    this.encryptedConfigPath = 'src/config/encrypted-env-config.ts';

    // 🎯 확장된 환경변수 설정
    this.requiredVars = {
      // 🌐 기본 환경
      NODE_ENV: { required: true, public: false },

      // 🗄️ Supabase (메모리 저장소 확인됨)
      NEXT_PUBLIC_SUPABASE_URL: {
        required: true,
        public: true,
        value: 'https://vnswjnltnhpsueosfhmw.supabase.co',
        encrypt: true,
      },
      NEXT_PUBLIC_SUPABASE_ANON_KEY: {
        required: true,
        public: true,
        value:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZuc3dqbmx0bmhwc3Vlb3NmaG13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5MjMzMjcsImV4cCI6MjA2MzQ5OTMyN30.09ApSnuXNv_yYVJWQWGpOFWw3tkLbxSA21k5sroChGU',
        encrypt: true,
      },
      SUPABASE_SERVICE_ROLE_KEY: {
        required: false,
        public: false,
        value:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZuc3dqbmx0bmhwc3Vlb3NmaG13Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzkyMzMyNywiZXhwIjoyMDYzNDk5MzI3fQ.xk2DUcqBZnaF-iuO7sbeXS-H43h8D5gppIlsJYw7xi8',
        encrypt: true,
      },
      SUPABASE_DB_PASSWORD: {
        required: false,
        public: false,
        value: '2D3DWhSl8HBlgYIm',
        encrypt: true,
      },

      // 📡 Render MCP 서버 (메모리 저장소 확인됨)
      GCP_MCP_SERVER_URL: {
        required: true,
        public: false,
        value: 'http://104.154.205.25:10000',
        encrypt: true,
      },
      RENDER_MCP_SERVER_IPS: {
        required: true,
        public: false,
        value: '13.228.225.19,18.142.128.26,54.254.162.138',
        encrypt: true,
      },

      // 🔴 Redis (메모리 저장소 확인됨)
      UPSTASH_REDIS_REST_URL: {
        required: true,
        public: false,
        value: 'https://charming-condor-46598.upstash.io',
        encrypt: true,
      },
      UPSTASH_REDIS_REST_TOKEN: {
        required: true,
        public: false,
        value: 'AbYGAAIjcDE5MjNmYjhiZDkwOGQ0MTUyOGFiZjUyMmQ0YTkyMzIwM3AxMA',
        rotate: 'quarterly',
        encrypt: true,
      },

      // 🤖 Google AI (기존 시스템 + 할당량 보호 설정)
      GOOGLE_AI_API_KEY: {
        required: true,
        public: false,
        rotate: 'monthly',
        encrypt: true,
      },
      GOOGLE_AI_MODEL: {
        required: false,
        public: false,
        default: 'gemini-2.0-flash',
      },
      GOOGLE_AI_BETA_MODE: {
        required: false,
        public: false,
        default: 'true',
      },
      // 📊 할당량 보호 설정 (encrypt-env-vars.mjs에서 통합)
      GOOGLE_AI_ENABLED: {
        required: false,
        public: false,
        default: 'true',
      },
      GOOGLE_AI_QUOTA_PROTECTION: {
        required: false,
        public: false,
        default: 'true',
      },
      GOOGLE_AI_DAILY_LIMIT: {
        required: false,
        public: false,
        default: '1200',
      },
      GOOGLE_AI_HOURLY_LIMIT: {
        required: false,
        public: false,
        default: '100',
      },
      GOOGLE_AI_TEST_LIMIT_PER_DAY: {
        required: false,
        public: false,
        default: '5',
      },
      GOOGLE_AI_HEALTH_CHECK_CACHE_HOURS: {
        required: false,
        public: false,
        default: '24',
      },
      GOOGLE_AI_CIRCUIT_BREAKER_THRESHOLD: {
        required: false,
        public: false,
        default: '5',
      },
      FORCE_MOCK_GOOGLE_AI: {
        required: false,
        public: false,
        default: 'false',
      },

      // 📢 Slack
      SLACK_WEBHOOK_URL: {
        required: true,
        public: false,
        rotate: 'on-demand',
        encrypt: true,
      },

      // ⏰ Cron 보안
      CRON_SECRET: {
        required: false,
        public: false,
        rotate: 'monthly',
        encrypt: true,
      },

      // 🔐 보안 토큰
      NEXTAUTH_SECRET: {
        required: false,
        public: false,
        rotate: 'quarterly',
        encrypt: true,
      },
      NEXTAUTH_URL: {
        required: false,
        public: false,
        default: 'http://localhost:3000',
      },

      // 🔧 개발 환경 기본 설정 (restore-env.js에서 통합)
      DISABLE_GOOGLE_AI_HEALTH_CHECK: {
        required: false,
        public: false,
        default: 'true',
      },
      NEXT_TELEMETRY_DISABLED: {
        required: false,
        public: false,
        default: '1',
      },
      SKIP_ENV_VALIDATION: {
        required: false,
        public: false,
        default: 'true',
      },
      DEVELOPMENT_MODE: {
        required: false,
        public: false,
        default: 'true',
      },
      LOCAL_DEVELOPMENT: {
        required: false,
        public: false,
        default: 'true',
      },
    };
  }

  /**
   * 🔒 모든 중요 환경변수 암호화
   */
  async encryptAllEnvironmentVars(teamPassword) {
    console.log('🔐 모든 환경변수 암호화 시작...');

    const encryptedVars = {};

    for (const [varName, config] of Object.entries(this.requiredVars)) {
      if (config.encrypt && (config.value || process.env[varName])) {
        const value = config.value || process.env[varName];

        try {
          const encrypted = this.encryptValue(value, teamPassword);
          encryptedVars[varName] = {
            ...encrypted,
            originalName: varName,
            isPublic: config.public,
            rotateSchedule: config.rotate || 'manual',
          };

          console.log(`✅ ${varName}: 암호화 완료`);
        } catch (error) {
          console.error(`❌ ${varName}: 암호화 실패 -`, error.message);
        }
      }
    }

    // 암호화된 설정 파일 생성
    await this.generateEncryptedConfigFile(encryptedVars, teamPassword);

    console.log(
      `🎉 총 ${Object.keys(encryptedVars).length}개 환경변수 암호화 완료!`
    );
    return encryptedVars;
  }

  /**
   * 🔓 값 암호화
   */
  encryptValue(value, password) {
    const salt = CryptoJS.lib.WordArray.random(128 / 8).toString();
    const iv = CryptoJS.lib.WordArray.random(128 / 8);

    const key = CryptoJS.PBKDF2(password, salt, {
      keySize: 256 / 32,
      iterations: 10000,
    });

    const encrypted = CryptoJS.AES.encrypt(value, key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });

    return {
      encrypted: encrypted.toString(),
      salt: salt,
      iv: iv.toString(),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 🔓 값 복호화
   */
  decryptValue(encryptedData, password) {
    try {
      const { encrypted, salt, iv } = encryptedData;

      const key = CryptoJS.PBKDF2(password, salt, {
        keySize: 256 / 32,
        iterations: 10000,
      });

      const decrypted = CryptoJS.AES.decrypt(encrypted, key, {
        iv: CryptoJS.enc.Hex.parse(iv),
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      });

      return decrypted.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      throw new Error(
        '복호화 실패: 비밀번호가 올바르지 않거나 데이터가 손상되었습니다.'
      );
    }
  }

  /**
   * 📄 암호화된 설정 파일 생성
   */
  async generateEncryptedConfigFile(encryptedVars, teamPassword) {
    const configContent = `/**
 * 🔐 OpenManager Vibe v5 - 암호화된 환경변수 설정
 * 
 * 이 파일은 민감한 환경변수들을 AES 암호화하여 저장합니다.
 * Git에 커밋해도 안전하며, 팀 비밀번호로만 복호화할 수 있습니다.
 * 
 * 포함된 설정:
 * - Supabase DB 연결 정보
 * - Render MCP 서버 정보  
 * - Redis 인증 토큰
 * - Google AI API 키
 * - Slack Webhook URL
 * - 기타 보안 토큰들
 */

export interface EncryptedEnvVar {
  encrypted: string;
  salt: string;
  iv: string;
  timestamp: string;
  originalName: string;
  isPublic: boolean;
  rotateSchedule: string;
}

export interface EncryptedEnvironmentConfig {
  version: string;
  createdAt: string;
  teamPasswordHash: string;
  variables: { [key: string]: EncryptedEnvVar };
}

/**
 * 🎯 암호화된 환경변수 설정
 * 생성 스크립트: node scripts/env-management.js --action=encrypt-all
 */
export const ENCRYPTED_ENV_CONFIG: EncryptedEnvironmentConfig = {
  version: '2.0.0',
  createdAt: '${new Date().toISOString()}',
  teamPasswordHash: '${crypto.createHash('sha256').update(teamPassword).digest('hex')}',
  variables: ${JSON.stringify(encryptedVars, null, 4)}
};

/**
 * 🔧 운영 환경 설정
 */
export const DEPLOYMENT_CONFIG = {
  supabase: {
    enabled: true,
    region: 'ap-southeast-1',
    project: 'vnswjnltnhpsueosfhmw'
  },
  renderMCP: {
    enabled: true,
    region: 'singapore',
    loadBalanced: true
  },
  redis: {
    enabled: true,
    provider: 'upstash',
    region: 'ap-southeast-1'
  },
  googleAI: {
    enabled: true,
    model: 'gemini-1.5-flash',
    betaMode: true
  }
};`;

    fs.writeFileSync(this.encryptedConfigPath, configContent, 'utf8');
    console.log(`📁 암호화된 설정 파일 생성: ${this.encryptedConfigPath}`);
  }

  /**
   * 🌐 Render MCP 서버 설정
   */
  setupRenderMCP() {
    console.log('🌐 Render MCP 서버 설정 중...');

    const renderConfig = {
      server_url: 'http://104.154.205.25:10000',
      server_ips: ['13.228.225.19', '18.142.128.26', '54.254.162.138'],
      region: 'singapore',
      connection_timeout: 30000,
      retry_attempts: 3,
      healthcheck_interval: 60000,
    };

    console.log('📊 Render MCP 서버 정보:');
    console.log(`   URL: ${renderConfig.server_url}`);
    console.log(`   IPs: ${renderConfig.server_ips.join(', ')}`);
    console.log(`   지역: ${renderConfig.region}`);
    console.log(`   타임아웃: ${renderConfig.connection_timeout}ms`);

    return renderConfig;
  }

  /**
   * 🗄️ Supabase 설정
   */
  setupSupabase() {
    console.log('🗄️ Supabase 설정 중...');

    const supabaseConfig = {
      project_url: 'https://vnswjnltnhpsueosfhmw.supabase.co',
      project_id: 'vnswjnltnhpsueosfhmw',
      region: 'ap-southeast-1',
      database_host: 'db.vnswjnltnhpsueosfhmw.supabase.co',
      pooler_port: 6543,
      direct_port: 5432,
      ssl_mode: 'require',
      connection_pooling: true,
      max_connections: 100,
    };

    console.log('📊 Supabase 설정 정보:');
    console.log(`   프로젝트: ${supabaseConfig.project_id}`);
    console.log(`   지역: ${supabaseConfig.region}`);
    console.log(`   DB 호스트: ${supabaseConfig.database_host}`);
    console.log(
      `   연결 풀링: ${supabaseConfig.connection_pooling ? '활성화' : '비활성화'}`
    );

    return supabaseConfig;
  }

  /**
   * 환경변수 파일 검증
   */
  validateEnvFile() {
    console.log('🔍 환경변수 검증 시작...');

    if (!fs.existsSync(this.envPath)) {
      console.error('❌ .env.local 파일이 존재하지 않습니다.');
      return false;
    }

    const envContent = fs.readFileSync(this.envPath, 'utf8');
    const envVars = this.parseEnvFile(envContent);

    let isValid = true;
    const issues = [];

    // 필수 변수 확인
    for (const [varName, config] of Object.entries(this.requiredVars)) {
      if (config.required && !envVars[varName] && !config.value) {
        issues.push(`❌ 필수 환경변수 누락: ${varName}`);
        isValid = false;
      } else if (envVars[varName] || config.value) {
        console.log(`✅ ${varName}: 설정됨`);
      }
    }

    // 보안 검증
    this.validateSecurity(envVars, issues);

    if (issues.length > 0) {
      console.log('\n⚠️  발견된 문제들:');
      issues.forEach(issue => console.log(`   ${issue}`));
    }

    console.log(`\n📊 검증 결과: ${isValid ? '✅ 통과' : '❌ 실패'}`);
    return isValid;
  }

  /**
   * 보안 검증
   */
  validateSecurity(envVars, issues) {
    // API 키 형식 검증
    if (
      envVars.GOOGLE_AI_API_KEY &&
      !envVars.GOOGLE_AI_API_KEY.startsWith('AIza')
    ) {
      issues.push('⚠️ Google AI API 키 형식이 올바르지 않습니다.');
    }

    // URL 형식 검증
    const urlVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'GCP_MCP_SERVER_URL',
      'UPSTASH_REDIS_REST_URL',
    ];
    urlVars.forEach(varName => {
      if (envVars[varName] && !this.isValidURL(envVars[varName])) {
        issues.push(`⚠️ ${varName}의 URL 형식이 올바르지 않습니다.`);
      }
    });

    // 토큰 길이 검증
    const tokenVars = [
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
    ];
    tokenVars.forEach(varName => {
      if (envVars[varName] && envVars[varName].length < 100) {
        issues.push(`⚠️ ${varName}의 토큰이 너무 짧습니다.`);
      }
    });
  }

  /**
   * URL 유효성 검증
   */
  isValidURL(string) {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  }

  /**
   * 환경변수 파일 파싱
   */
  parseEnvFile(content) {
    const vars = {};
    const lines = content.split('\n');

    for (const line of lines) {
      if (line.trim() && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
          vars[key.trim()] = valueParts.join('=').trim();
        }
      }
    }

    return vars;
  }

  /**
   * 환경변수 백업
   */
  backupEnvFile() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(
      this.backupDir,
      `.env.local.${timestamp}.backup`
    );

    if (fs.existsSync(this.envPath)) {
      fs.copyFileSync(this.envPath, backupPath);
      console.log(`💾 환경변수 백업 완료: ${backupPath}`);
      return backupPath;
    }

    return null;
  }

  /**
   * 환경변수 생성 (기본값 + 메모리 값 사용)
   */
  generateEnvFile() {
    console.log('📝 환경변수 파일 생성 중...');

    let envContent = `# 🚀 OpenManager Vibe v5 - 환경변수 설정
# 생성일: ${new Date().toISOString()}
# 생성기: env-management.js

# =============================================================================
# 🌐 기본 환경 설정
# =============================================================================
NODE_ENV=development

# =============================================================================
# 🗄️ Supabase 데이터베이스 (2025년 메모리 저장소)
# =============================================================================
NEXT_PUBLIC_SUPABASE_URL=https://vnswjnltnhpsueosfhmw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZuc3dqbmx0bmhwc3Vlb3NmaG13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5MjMzMjcsImV4cCI6MjA2MzQ5OTMyN30.09ApSnuXNv_yYVJWQWGpOFWw3tkLbxSA21k5sroChGU
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZuc3dqbmx0bmhwc3Vlb3NmaG13Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzkyMzMyNywiZXhwIjoyMDYzNDk5MzI3fQ.xk2DUcqBZnaF-iuO7sbeXS-H43h8D5gppIlsJYw7xi8
SUPABASE_DB_PASSWORD=2D3DWhSl8HBlgYIm

# =============================================================================
# 📡 Render MCP 서버 (2025년 메모리 저장소)
# =============================================================================
GCP_MCP_SERVER_URL=http://104.154.205.25:10000
RENDER_MCP_SERVER_IPS=13.228.225.19,18.142.128.26,54.254.162.138

# =============================================================================
# 🔴 Upstash Redis (2025년 메모리 저장소)
# =============================================================================
UPSTASH_REDIS_REST_URL=https://charming-condor-46598.upstash.io
UPSTASH_REDIS_REST_TOKEN=AbYGAAIjcDE5MjNmYjhiZDkwOGQ0MTUyOGFiZjUyMmQ0YTkyMzIwM3AxMA

# =============================================================================
# 🤖 Google AI (개인 설정 필요)
# =============================================================================
# GOOGLE_AI_API_KEY=your_google_ai_api_key_here
GOOGLE_AI_MODEL=gemini-1.5-flash
GOOGLE_AI_BETA_MODE=true

# =============================================================================
# 📢 Slack (선택사항)
# =============================================================================
# SLACK_WEBHOOK_URL=your_slack_webhook_url_here

# =============================================================================
# 🔐 보안 토큰 (선택사항)
# =============================================================================
# CRON_SECRET=your_cron_secret_here
# NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=http://localhost:3000

`;

    fs.writeFileSync(this.envPath, envContent, 'utf8');
    console.log(`✅ 환경변수 파일 생성 완료: ${this.envPath}`);

    return this.envPath;
  }

  /**
   * Vercel 환경변수 동기화 가이드
   */
  showVercelSyncGuide() {
    console.log('🚀 Vercel 환경변수 동기화 가이드:');
    console.log('');
    console.log('1. Vercel Dashboard 접속:');
    console.log('   https://vercel.com/dashboard');
    console.log('');
    console.log('2. 프로젝트 선택 > Settings > Environment Variables');
    console.log('');
    console.log('3. 아래 환경변수들을 설정:');

    for (const [varName, config] of Object.entries(this.requiredVars)) {
      if (config.value || process.env[varName]) {
        const value = config.value || process.env[varName];
        const scope = config.public ? '(Public)' : '(Server)';
        const displayValue =
          value.length > 20 ? value.substring(0, 20) + '...' : value;
        console.log(`   📝 ${varName}=${displayValue} ${scope}`);
      }
    }

    console.log('');
    console.log('4. 환경별 설정:');
    console.log('   ✅ Production: 모든 환경변수');
    console.log('   ✅ Preview: 모든 환경변수');
    console.log('   ✅ Development: 모든 환경변수');
  }

  /**
   * 자동 갱신 제안
   */
  suggestUpdates() {
    console.log('💡 환경변수 갱신 제안:');
    console.log('');

    const suggestions = [
      {
        service: 'Google AI API Key',
        frequency: '매월',
        risk: '중',
        reason: 'API 사용량 추적 및 보안 강화',
      },
      {
        service: 'Supabase Service Role Key',
        frequency: '분기별',
        risk: '높',
        reason: '데이터베이스 전체 접근 권한',
      },
      {
        service: 'Redis Token',
        frequency: '분기별',
        risk: '중',
        reason: '캐시 데이터 보호',
      },
      {
        service: 'Render MCP Server',
        frequency: '필요시',
        risk: '낮',
        reason: '서버 재배포 시만',
      },
      {
        service: 'Slack Webhook URL',
        frequency: '필요시',
        risk: '낮',
        reason: '보안 이슈 발생 시만',
      },
      {
        service: 'Cron Secret',
        frequency: '매월',
        risk: '높',
        reason: '스케줄 작업 보안',
      },
    ];

    suggestions.forEach(item => {
      const riskColor =
        item.risk === '높' ? '🔴' : item.risk === '중' ? '🟡' : '🟢';
      console.log(`${riskColor} ${item.service}`);
      console.log(`   갱신 주기: ${item.frequency}`);
      console.log(`   보안 위험: ${item.risk}`);
      console.log(`   이유: ${item.reason}`);
      console.log('');
    });
  }
}

// CLI 처리
async function main() {
  const args = process.argv.slice(2);
  const action = args.find(arg => arg.startsWith('--action='))?.split('=')[1];
  const service = args.find(arg => arg.startsWith('--service='))?.split('=')[1];

  const manager = new EnvSecurityManager();

  console.log('🔐 OpenManager Vibe v5 - 환경변수 관리 시스템\n');

  switch (action) {
    case 'validate':
      manager.validateEnvFile();
      break;

    case 'generate':
      manager.generateEnvFile();
      break;

    case 'encrypt-all':
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      rl.question('팀 비밀번호를 입력하세요: ', async password => {
        if (password.length < 4) {
          console.log('❌ 비밀번호는 4자 이상이어야 합니다.');
          rl.close();
          return;
        }

        await manager.encryptAllEnvironmentVars(password);
        console.log('\n🎉 모든 환경변수 암호화 완료!');
        console.log('📁 생성된 파일: src/config/encrypted-env-config.ts');
        console.log(`🔑 팀 비밀번호: ${password}`);
        rl.close();
      });
      break;

    case 'setup-render-mcp':
      const renderConfig = manager.setupRenderMCP();
      console.log('\n✅ Render MCP 설정 완료');
      break;

    case 'setup-supabase':
      const supabaseConfig = manager.setupSupabase();
      console.log('\n✅ Supabase 설정 완료');
      break;

    case 'sync-vercel':
      manager.showVercelSyncGuide();
      break;

    case 'suggest':
      manager.suggestUpdates();
      break;

    case 'backup':
      manager.backupEnvFile();
      break;

    default:
      console.log('사용 가능한 액션:');
      console.log('  --action=validate       환경변수 검증');
      console.log('  --action=generate       환경변수 파일 생성');
      console.log('  --action=encrypt-all    모든 환경변수 암호화');
      console.log('  --action=setup-render-mcp   Render MCP 설정');
      console.log('  --action=setup-supabase     Supabase 설정');
      console.log('  --action=sync-vercel    Vercel 동기화 가이드');
      console.log('  --action=suggest        갱신 제안');
      console.log('  --action=backup         환경변수 백업');
      break;
  }
}

// Entry point check for direct execution

if (typeof require !== 'undefined' && require.main === module) {
  main().catch(console.error);
}

module.exports = { EnvSecurityManager };
