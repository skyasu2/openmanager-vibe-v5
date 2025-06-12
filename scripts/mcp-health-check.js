#!/usr/bin/env node

/**
 * 🔍 MCP 상태 점검 스크립트
 * 개발 환경에서 MCP 서버 상태를 빠르게 확인
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const http = require('http');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const https = require('https');

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
};

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

async function checkEndpoint(url, name) {
  return new Promise(resolve => {
    const client = url.startsWith('https') ? https : http;
    const startTime = Date.now();

    const req = client.get(url, res => {
      const responseTime = Date.now() - startTime;
      let data = '';

      res.on('data', chunk => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({
            name,
            status: res.statusCode,
            responseTime,
            success: res.statusCode === 200,
            data: parsed,
          });
        } catch (e) {
          resolve({
            name,
            status: res.statusCode,
            responseTime,
            success: res.statusCode === 200,
            data: data.substring(0, 100),
          });
        }
      });
    });

    req.on('error', err => {
      resolve({
        name,
        status: 'ERROR',
        responseTime: Date.now() - startTime,
        success: false,
        error: err.message,
      });
    });

    req.setTimeout(5000, () => {
      req.destroy();
      resolve({
        name,
        status: 'TIMEOUT',
        responseTime: 5000,
        success: false,
        error: 'Request timeout',
      });
    });
  });
}

async function main() {
  log(colors.bold + colors.blue, '\n🔍 OpenManager Vibe v5 - MCP 상태 점검');
  log(colors.blue, '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const endpoints = [
    { url: 'http://localhost:3000/api/health', name: '기본 헬스체크' },
    {
      url: 'http://localhost:3000/api/system/mcp-status',
      name: 'MCP 시스템 상태',
    },
    { url: 'http://localhost:3000/api/mcp/monitoring', name: 'MCP 모니터링' },
    {
      url: 'http://localhost:3000/api/ai/engines/status',
      name: 'AI 엔진 상태',
    },
    { url: 'http://localhost:3000/api/servers', name: '서버 데이터' },
    { url: 'http://localhost:3000/api/dashboard', name: '대시보드 API' },
  ];

  const results = [];

  for (const endpoint of endpoints) {
    process.stdout.write(`📡 ${endpoint.name} 확인 중...`);
    const result = await checkEndpoint(endpoint.url, endpoint.name);
    results.push(result);

    if (result.success) {
      log(colors.green, ` ✅ ${result.responseTime}ms`);
    } else {
      log(colors.red, ` ❌ ${result.status} (${result.responseTime}ms)`);
      if (result.error) {
        log(colors.yellow, `   └─ ${result.error}`);
      }
    }
  }

  // 요약 출력
  log(colors.blue, '\n📊 상태 요약:');
  log(colors.blue, '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const successful = results.filter(r => r.success).length;
  const total = results.length;
  const avgResponseTime =
    results.filter(r => r.success).reduce((sum, r) => sum + r.responseTime, 0) /
      successful || 0;

  log(
    colors.green,
    `✅ 성공: ${successful}/${total} (${Math.round((successful / total) * 100)}%)`
  );
  log(colors.blue, `⚡ 평균 응답시간: ${Math.round(avgResponseTime)}ms`);

  if (successful === total) {
    log(colors.green, '\n🎉 모든 MCP 엔드포인트가 정상 작동 중입니다!');
  } else {
    log(colors.yellow, '\n⚠️  일부 엔드포인트에 문제가 있습니다.');
    log(colors.yellow, '   개발 서버가 실행 중인지 확인해주세요: npm run dev');
  }

  // 실패한 엔드포인트 상세 정보
  const failed = results.filter(r => !r.success);
  if (failed.length > 0) {
    log(colors.red, '\n❌ 실패한 엔드포인트:');
    failed.forEach(f => {
      log(colors.red, `   • ${f.name}: ${f.status}`);
      if (f.error) {
        log(colors.yellow, `     └─ ${f.error}`);
      }
    });
  }

  log(colors.blue, '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { checkEndpoint, main };
