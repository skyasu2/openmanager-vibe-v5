#!/usr/bin/env node

/**
 * 🛠️ DevKeyManager CLI - 개발용 키 관리 터미널 도구
 *
 * 사용법:
 *   node scripts/dev-key-manager.js [action]
 *   npm run dev:keys [action]
 *
 * 액션:
 *   status      - 키 상태 확인
 *   report      - 상세 리포트
 *   setup       - 빠른 설정
 *   generate    - .env.local 생성
 */

const https = require('https');
const http = require('http');

// 컬러 출력
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

const icons = {
  success: '✅',
  error: '❌',
  warning: '⚠️',
  info: 'ℹ️',
  key: '🔑',
  setup: '🚀',
  report: '📊',
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

function printHeader(title) {
  console.log('\n' + '='.repeat(60));
  console.log(colorize(`🛠️ DevKeyManager - ${title}`, 'cyan'));
  console.log('='.repeat(60));
  console.log(
    colorize(`📅 실행 시간: ${new Date().toLocaleString('ko-KR')}`, 'blue')
  );
  console.log('='.repeat(60) + '\n');
}

async function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https:') ? https : http;

    const req = protocol.get(url, res => {
      let data = '';

      res.on('data', chunk => {
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

    req.on('error', error => {
      reject(error);
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('요청 시간 초과 (10초)'));
    });
  });
}

async function showKeyStatus() {
  try {
    printHeader('키 상태 확인');

    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';

    const apiUrl = `${baseUrl}/api/config/keys?action=status`;
    console.log(colorize(`📡 API 호출: ${apiUrl}`, 'blue'));
    console.log('');

    const data = await makeRequest(apiUrl);

    // 요약 정보
    console.log(colorize('📊 요약 정보', 'cyan'));
    console.log(
      `${icons.info} 총 서비스: ${colorize(data.summary.total, 'bright')}`
    );
    console.log(
      `${icons.success} 활성화: ${colorize(data.summary.valid, 'green')}`
    );
    console.log(
      `${icons.warning} 비활성화: ${colorize(data.summary.missing, 'yellow')}`
    );
    console.log(
      `${icons.error} 오류: ${colorize(data.summary.invalid, 'red')}`
    );
    console.log(
      `📈 성공률: ${colorize(`${data.summary.successRate}%`, data.summary.successRate >= 80 ? 'green' : 'yellow')}`
    );
    console.log('');

    // 서비스별 상태
    console.log(colorize('🔑 서비스별 상태', 'cyan'));
    data.services.forEach(service => {
      const statusIcon =
        service.status === 'active'
          ? icons.success
          : service.status === 'invalid'
            ? icons.warning
            : icons.error;
      const statusColor =
        service.status === 'active'
          ? 'green'
          : service.status === 'invalid'
            ? 'yellow'
            : 'red';
      const sourceIcon =
        service.source === 'default'
          ? '🔧'
          : service.source === 'encrypted'
            ? '🔐'
            : '📝';

      console.log(
        `${statusIcon} ${colorize(service.service.padEnd(25), 'bright')} ${sourceIcon} ${service.preview}`
      );
    });

    console.log('');

    if (data.summary.missing > 0 || data.summary.invalid > 0) {
      console.log(colorize('💡 해결 방법:', 'yellow'));
      console.log('   • npm run dev:keys setup    # 자동 설정');
      console.log('   • npm run dev:keys generate # .env.local 생성');
      console.log('   • npm run check-services    # 서비스 상태 확인');
    } else {
      console.log(
        colorize(`${icons.success} 모든 키가 정상 설정되었습니다!`, 'green')
      );
    }
  } catch (error) {
    console.log(
      colorize(`${icons.error} 키 상태 확인 실패: ${error.message}`, 'red')
    );
    process.exit(1);
  }
}

async function showDetailedReport() {
  try {
    printHeader('상세 리포트');

    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';

    const apiUrl = `${baseUrl}/api/config/keys?action=status`;
    const data = await makeRequest(apiUrl);

    console.log(data.report);
  } catch (error) {
    console.log(
      colorize(`${icons.error} 리포트 생성 실패: ${error.message}`, 'red')
    );
    process.exit(1);
  }
}

async function quickSetup() {
  try {
    printHeader('빠른 설정');

    console.log(
      colorize(`${icons.setup} 자동 키 설정을 시작합니다...`, 'yellow')
    );
    console.log('');

    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';

    const apiUrl = `${baseUrl}/api/config/keys?action=quick-setup`;
    const data = await makeRequest(apiUrl);

    if (data.success) {
      console.log(colorize(`${icons.success} ${data.message}`, 'green'));
      console.log('');
      console.log(colorize('🔄 다음 단계:', 'cyan'));
      console.log('   1. npm run dev              # 개발 서버 시작');
      console.log('   2. npm run check-services   # 서비스 상태 확인');
      console.log('   3. http://localhost:3000/dev-tools # 웹 대시보드');
    } else {
      console.log(colorize(`${icons.error} ${data.message}`, 'red'));
      process.exit(1);
    }
  } catch (error) {
    console.log(
      colorize(`${icons.error} 빠른 설정 실패: ${error.message}`, 'red')
    );
    process.exit(1);
  }
}

async function generateEnvFile() {
  try {
    printHeader('.env.local 생성');

    console.log(
      colorize(`${icons.setup} .env.local 파일을 생성합니다...`, 'yellow')
    );
    console.log('');

    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';

    const apiUrl = `${baseUrl}/api/config/keys?action=generate-env`;
    const data = await makeRequest(apiUrl);

    if (data.success) {
      console.log(colorize(`${icons.success} ${data.message}`, 'green'));
      console.log(colorize(`📁 파일 위치: ${data.path}`, 'blue'));
    } else {
      console.log(colorize(`${icons.error} ${data.message}`, 'red'));
      process.exit(1);
    }
  } catch (error) {
    console.log(
      colorize(`${icons.error} 파일 생성 실패: ${error.message}`, 'red')
    );
    process.exit(1);
  }
}

function showHelp() {
  printHeader('사용법');

  console.log(colorize('📖 사용 가능한 명령어:', 'cyan'));
  console.log('');
  console.log(
    `${icons.key} ${colorize('npm run dev:keys status', 'green')}    # 키 상태 확인`
  );
  console.log(
    `${icons.report} ${colorize('npm run dev:keys report', 'green')}    # 상세 리포트`
  );
  console.log(
    `${icons.setup} ${colorize('npm run dev:keys setup', 'green')}     # 빠른 설정`
  );
  console.log(
    `${icons.info} ${colorize('npm run dev:keys generate', 'green')}  # .env.local 생성`
  );
  console.log('');
  console.log(colorize('💡 추천 워크플로우:', 'yellow'));
  console.log('   1. npm run dev:keys setup    # 처음 설정');
  console.log('   2. npm run dev               # 개발 서버 시작');
  console.log('   3. npm run check-services    # 서비스 확인');
  console.log('');
}

// 메인 실행
async function main() {
  const action = process.argv[2] || 'help';

  switch (action) {
    case 'status':
      await showKeyStatus();
      break;
    case 'report':
      await showDetailedReport();
      break;
    case 'setup':
      await quickSetup();
      break;
    case 'generate':
      await generateEnvFile();
      break;
    case 'help':
    default:
      showHelp();
      break;
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error(
      colorize(`${icons.error} 실행 오류: ${error.message}`, 'red')
    );
    process.exit(1);
  });
}

module.exports = { main };
