#!/usr/bin/env node

/**
 * 🔐 OpenManager Vibe v5 - 환경변수 보안 관리 시스템
 *
 * 기능:
 * 1. 환경변수 자동 갱신
 * 2. 보안 토큰 로테이션
 * 3. 설정 검증
 * 4. Vercel 동기화
 *
 * 사용법:
 * node scripts/env-management.js --action=validate
 * node scripts/env-management.js --action=rotate --service=google-ai
 * node scripts/env-management.js --action=sync-vercel
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require('path');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const crypto = require('crypto');

class EnvSecurityManager {
  constructor() {
    this.envPath = '.env.local';
    this.templatePath = 'vercel.env.template';
    this.backupDir = 'development/backups/env-backups';

    this.requiredVars = {
      // 필수 환경변수
      NODE_ENV: { required: true, public: false },
      NEXT_PUBLIC_SUPABASE_URL: { required: true, public: true },
      NEXT_PUBLIC_SUPABASE_ANON_KEY: { required: true, public: true },
      UPSTASH_REDIS_REST_URL: { required: true, public: false },
      UPSTASH_REDIS_REST_TOKEN: {
        required: true,
        public: false,
        rotate: 'quarterly',
      },
      GOOGLE_AI_API_KEY: { required: true, public: false, rotate: 'monthly' },
      SLACK_WEBHOOK_URL: { required: true, public: false, rotate: 'on-demand' },

      // 선택적 환경변수
      GOOGLE_AI_MODEL: {
        required: false,
        public: false,
        default: 'gemini-1.5-flash',
      },
      GOOGLE_AI_BETA_MODE: { required: false, public: false, default: 'true' },
      CRON_SECRET: { required: false, public: false, rotate: 'monthly' },
    };
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
      if (config.required && !envVars[varName]) {
        issues.push(`❌ 필수 환경변수 누락: ${varName}`);
        isValid = false;
      } else if (envVars[varName]) {
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
   * 환경변수 보안 검증
   */
  validateSecurity(envVars, issues) {
    // Slack Webhook URL 검증
    const slackUrl = envVars.SLACK_WEBHOOK_URL;
    if (slackUrl && !slackUrl.startsWith('https://hooks.slack.com/services/')) {
      issues.push('🔒 Slack Webhook URL 형식이 올바르지 않습니다');
    }

    // Google AI API Key 검증
    const googleKey = envVars.GOOGLE_AI_API_KEY;
    if (googleKey && !googleKey.startsWith('AIza')) {
      issues.push('🔒 Google AI API Key 형식이 올바르지 않습니다');
    }

    // Supabase URL 검증
    const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
    if (supabaseUrl && !supabaseUrl.includes('.supabase.co')) {
      issues.push('🔒 Supabase URL 형식이 올바르지 않습니다');
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
   * 토큰 로테이션 (시뮬레이션)
   */
  rotateToken(service) {
    console.log(`🔄 ${service} 토큰 로테이션 시뮬레이션...`);

    const rotationStrategies = {
      'google-ai': () => {
        console.log('📝 Google AI API Key 로테이션 단계:');
        console.log('   1. Google Cloud Console 접속');
        console.log('   2. API 키 새로 생성');
        console.log('   3. 기존 키 비활성화 (24시간 후)');
        console.log('   4. .env.local 업데이트');
        console.log('   5. Vercel 환경변수 업데이트');
      },
      slack: () => {
        console.log('📝 Slack Webhook URL 로테이션 단계:');
        console.log('   1. Slack 워크스페이스 관리자 페이지 접속');
        console.log('   2. 새 Webhook URL 생성');
        console.log('   3. 기존 URL 비활성화');
        console.log('   4. .env.local 업데이트');
        console.log('   5. 테스트 메시지 전송 확인');
      },
      redis: () => {
        console.log('📝 Redis Token 로테이션 단계:');
        console.log('   1. Upstash Console 접속');
        console.log('   2. 새 REST Token 생성');
        console.log('   3. 기존 토큰 비활성화');
        console.log('   4. .env.local 업데이트');
        console.log('   5. Redis 연결 테스트');
      },
    };

    const strategy = rotationStrategies[service];
    if (strategy) {
      strategy();
    } else {
      console.log('❌ 지원하지 않는 서비스입니다.');
    }
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

    const currentVars = this.parseEnvFile(
      fs.readFileSync(this.envPath, 'utf8')
    );

    for (const [varName, value] of Object.entries(currentVars)) {
      if (varName && value) {
        const config = this.requiredVars[varName];
        const scope = config?.public ? '(Public)' : '(Server)';
        console.log(`   📝 ${varName}=${value.substring(0, 20)}... ${scope}`);
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
        service: 'Slack Webhook URL',
        frequency: '필요시',
        risk: '낮',
        reason: '보안 이슈 발생 시만',
      },
      {
        service: 'Redis Token',
        frequency: '분기별',
        risk: '중',
        reason: '캐시 데이터 보호',
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

// CLI 실행
function main() {
  const args = process.argv.slice(2);
  const action =
    args.find(arg => arg.startsWith('--action='))?.split('=')[1] || 'validate';
  const service = args.find(arg => arg.startsWith('--service='))?.split('=')[1];

  const manager = new EnvSecurityManager();

  console.log('🔐 OpenManager Vibe v5 - 환경변수 보안 관리 시스템');
  console.log('='.repeat(60));
  console.log('');

  switch (action) {
    case 'validate':
      manager.validateEnvFile();
      break;
    case 'backup':
      manager.backupEnvFile();
      break;
    case 'rotate':
      if (service) {
        manager.rotateToken(service);
      } else {
        console.log('❌ --service 파라미터가 필요합니다.');
        console.log('사용 가능한 서비스: google-ai, slack, redis');
      }
      break;
    case 'sync-vercel':
      manager.showVercelSyncGuide();
      break;
    case 'suggest':
      manager.suggestUpdates();
      break;
    default:
      console.log('❌ 지원하지 않는 액션입니다.');
      console.log(
        '사용 가능한 액션: validate, backup, rotate, sync-vercel, suggest'
      );
  }

  console.log('');
  console.log('🎯 다음 단계 제안:');
  console.log('   1. npm run env:validate  # 환경변수 검증');
  console.log('   2. npm run env:backup    # 환경변수 백업');
  console.log('   3. npm run env:suggest   # 갱신 제안 확인');
}

if (require.main === module) {
  main();
}

module.exports = EnvSecurityManager;
