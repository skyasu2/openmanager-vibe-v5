#!/usr/bin/env node

/**
 * 🛠️ OpenManager Vibe v5 - 서비스 상태 확인 스크립트
 * 
 * 사용법:
 *   node scripts/check-services.js
 *   npm run check-services
 * 
 * 기능:
 *   - 모든 외부 서비스 상태 확인
 *   - 터미널에서 컬러풀한 출력
 *   - 개발 중 빠른 상태 확인
 */

const https = require('https');
const http = require('http');

// 컬러 출력을 위한 ANSI 코드
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m'
};

// 아이콘 정의
const icons = {
  success: '✅',
  error: '❌',
  warning: '⚠️',
  info: 'ℹ️',
  loading: '🔄',
  database: '🗄️',
  cache: '⚡',
  ai: '🧠',
  server: '🖥️',
  cloud: '☁️'
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

function printHeader() {
  console.log('\n' + '='.repeat(60));
  console.log(colorize('🛠️  OpenManager Vibe v5 - 서비스 상태 확인', 'cyan'));
  console.log('='.repeat(60));
  console.log(colorize(`📅 실행 시간: ${new Date().toLocaleString('ko-KR')}`, 'blue'));
  console.log('='.repeat(60) + '\n');
}

function printServiceStatus(service) {
  const statusIcon = service.status === 'connected' ? icons.success : icons.error;
  const statusColor = service.status === 'connected' ? 'green' : 'red';
  const statusText = service.status === 'connected' ? '연결됨' : '오류';

  // 서비스별 아이콘
  let serviceIcon = icons.server;
  if (service.name.includes('Supabase')) serviceIcon = icons.database;
  else if (service.name.includes('Redis')) serviceIcon = icons.cache;
  else if (service.name.includes('Google AI')) serviceIcon = icons.ai;
  else if (service.name.includes('Render')) serviceIcon = icons.server;
  else if (service.name.includes('Vercel')) serviceIcon = icons.cloud;

  console.log(`${serviceIcon} ${colorize(service.name, 'bright')}`);
  console.log(`   상태: ${statusIcon} ${colorize(statusText, statusColor)}`);
  console.log(`   응답시간: ${colorize(formatResponseTime(service.responseTime), 'yellow')}`);

  if (service.error) {
    console.log(`   ${icons.error} ${colorize('오류:', 'red')} ${service.error}`);
  }

  if (service.details && service.status === 'connected') {
    if (service.details.url) {
      console.log(`   ${icons.info} URL: ${colorize(service.details.url, 'blue')}`);
    }
    if (service.details.region) {
      console.log(`   ${icons.info} 리전: ${colorize(service.details.region, 'blue')}`);
    }
    if (service.details.model) {
      console.log(`   ${icons.info} 모델: ${colorize(service.details.model, 'blue')}`);
    }
  }

  console.log('');
}

function printSummary(summary) {
  console.log('='.repeat(60));
  console.log(colorize('📊 요약', 'cyan'));
  console.log('='.repeat(60));

  const successRate = Math.round((summary.connected / summary.total) * 100);
  const successColor = successRate >= 80 ? 'green' : successRate >= 60 ? 'yellow' : 'red';

  console.log(`${icons.info} 총 서비스: ${colorize(summary.total, 'bright')}`);
  console.log(`${icons.success} 연결됨: ${colorize(summary.connected, 'green')}`);
  console.log(`${icons.error} 오류: ${colorize(summary.errors, 'red')}`);
  console.log(`${icons.loading} 평균 응답시간: ${colorize(formatResponseTime(summary.averageResponseTime), 'yellow')}`);
  console.log(`📈 성공률: ${colorize(`${successRate}%`, successColor)}`);

  console.log('\n' + '='.repeat(60));

  if (summary.errors === 0) {
    console.log(colorize(`${icons.success} 모든 서비스가 정상 작동 중입니다!`, 'green'));
  } else {
    console.log(colorize(`${icons.warning} ${summary.errors}개 서비스에 문제가 있습니다.`, 'yellow'));
  }

  console.log('='.repeat(60) + '\n');
}

function formatResponseTime(ms) {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

async function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https:') ? https : http;

    const req = protocol.get(url, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve(jsonData);
        } catch (error) {
          reject(new Error(`JSON 파싱 오류: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('요청 시간 초과 (10초)'));
    });
  });
}

async function checkServices() {
  try {
    printHeader();

    console.log(colorize(`${icons.loading} 서비스 상태 확인 중...`, 'yellow'));
    console.log('');

    // 로컬 개발 서버 또는 배포된 서버에서 상태 확인
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';

    const apiUrl = `${baseUrl}/api/services/status`;

    console.log(colorize(`📡 API 호출: ${apiUrl}`, 'blue'));
    console.log('');

    const data = await makeRequest(apiUrl);

    // 각 서비스 상태 출력
    data.services.forEach(service => {
      printServiceStatus(service);
    });

    // 요약 출력
    printSummary(data.summary);

    // 개발 팁
    console.log(colorize('💡 개발 팁:', 'cyan'));
    console.log(`   • 실시간 모니터링: ${colorize(`${baseUrl}/dev-tools`, 'blue')}`);
    console.log(`   • 환경변수 확인: ${colorize('.env.local 파일 생성', 'yellow')}`);
    console.log(`   • 자동 실행: ${colorize('npm run check-services', 'green')}`);
    console.log('');

  } catch (error) {
    console.log('');
    console.log(colorize(`${icons.error} 서비스 상태 확인 실패:`, 'red'));
    console.log(colorize(`   ${error.message}`, 'red'));
    console.log('');
    console.log(colorize('💡 해결 방법:', 'yellow'));
    console.log('   1. 개발 서버가 실행 중인지 확인: npm run dev');
    console.log('   2. .env.local 파일이 설정되어 있는지 확인');
    console.log('   3. 네트워크 연결 상태 확인');
    console.log('');
    process.exit(1);
  }
}

// 스크립트 실행
if (require.main === module) {
  checkServices();
}

module.exports = { checkServices };