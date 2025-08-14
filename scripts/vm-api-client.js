#!/usr/bin/env node

/**
 * GCP VM API Client
 * SSH 없이 VM을 관리하기 위한 CLI 도구
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

// VM 설정
const VM_HOST = process.env.VM_API_HOST || '104.154.205.25';
const VM_PORT = process.env.VM_API_PORT || 10000;
const API_TOKEN = process.env.VM_API_TOKEN || 'dev-token-2025';

// API 요청 헬퍼
function apiRequest(method, endpoint, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: VM_HOST,
      port: VM_PORT,
      path: endpoint,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_TOKEN}`
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk.toString());
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          resolve(body);
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// CLI 명령어 처리
const commands = {
  // 상태 확인
  async status() {
    console.log('📊 VM 상태 확인 중...\n');
    const status = await apiRequest('GET', '/api/status');
    console.log('시스템 상태:', status.status);
    console.log('호스트명:', status.hostname);
    console.log('업타임:', Math.floor(status.uptime / 60), '분');
    console.log('메모리 사용률:', status.memory.percentage + '%');
    console.log('여유 메모리:', Math.round(status.memory.free / 1024 / 1024), 'MB');
  },

  // 로그 확인
  async logs(lines = 50) {
    console.log(`📜 최근 ${lines}줄 로그:\n`);
    const result = await apiRequest('GET', `/api/logs?lines=${lines}`);
    if (result.success) {
      console.log(result.logs);
    } else {
      console.error('❌ 로그 조회 실패:', result.error);
    }
  },

  // 명령 실행
  async exec(command) {
    console.log(`🔧 명령 실행: ${command}\n`);
    const result = await apiRequest('POST', '/api/execute', { command });
    if (result.success) {
      console.log('✅ 실행 성공:\n');
      if (result.stdout) console.log('출력:\n', result.stdout);
      if (result.stderr) console.log('에러:\n', result.stderr);
    } else {
      console.error('❌ 실행 실패:', result.error);
    }
  },

  // 코드 배포
  async deploy(filepath) {
    if (!fs.existsSync(filepath)) {
      console.error('❌ 파일을 찾을 수 없습니다:', filepath);
      return;
    }

    const code = fs.readFileSync(filepath, 'utf8');
    const filename = path.basename(filepath);
    
    console.log(`📦 ${filename} 배포 중...\n`);
    const result = await apiRequest('POST', '/api/deploy', { code, filename });
    
    if (result.success) {
      console.log('✅ 배포 성공!');
      console.log('파일 위치:', result.filepath);
      if (result.pm2) {
        console.log('PM2 상태:', result.pm2.success ? '정상' : '오류');
      }
    } else {
      console.error('❌ 배포 실패:', result.error);
    }
  },

  // PM2 상태
  async pm2() {
    console.log('🔄 PM2 프로세스 상태:\n');
    const result = await apiRequest('GET', '/api/pm2');
    
    if (result.success && result.processes) {
      result.processes.forEach(p => {
        console.log(`📌 ${p.name}`);
        console.log(`   상태: ${p.status}`);
        console.log(`   CPU: ${p.cpu}%`);
        console.log(`   메모리: ${Math.round(p.memory / 1024 / 1024)}MB`);
        console.log(`   재시작: ${p.restarts}회`);
        console.log(`   업타임: ${Math.floor(p.uptime / 1000 / 60)}분\n`);
      });
    } else {
      console.error('PM2 상태 조회 실패');
    }
  },

  // 파일 목록
  async files(dir = '/tmp') {
    console.log(`📁 ${dir} 디렉토리 파일:\n`);
    const result = await apiRequest('GET', `/api/files?dir=${dir}`);
    
    if (result.success) {
      result.files.forEach(f => {
        const type = f.isDirectory ? '📁' : '📄';
        const size = f.isDirectory ? '' : `(${Math.round(f.size / 1024)}KB)`;
        console.log(`${type} ${f.name} ${size}`);
      });
    } else {
      console.error('❌ 파일 목록 조회 실패:', result.error);
    }
  },

  // 서비스 재시작
  async restart() {
    console.log('🔄 서비스 재시작 중...\n');
    const result = await apiRequest('POST', '/api/restart');
    
    if (result.success) {
      console.log('✅ 재시작 완료!');
    } else {
      console.error('❌ 재시작 실패:', result.error);
    }
  },

  // 서버 업데이트
  async update(filepath) {
    if (!fs.existsSync(filepath)) {
      console.error('❌ 파일을 찾을 수 없습니다:', filepath);
      return;
    }

    const serverCode = fs.readFileSync(filepath, 'utf8');
    
    console.log('🔧 서버 코드 업데이트 중...\n');
    const result = await apiRequest('POST', '/api/update-server', { serverCode });
    
    if (result.success) {
      console.log('✅ 서버 업데이트 완료!');
      console.log(result.message);
    } else {
      console.error('❌ 업데이트 실패:', result.error);
    }
  },

  // 헬스체크
  async health() {
    console.log('💚 헬스체크:\n');
    const health = await apiRequest('GET', '/health');
    console.log('상태:', health.status);
    console.log('버전:', health.version);
    console.log('포트:', health.port);
    console.log('시간:', health.timestamp);
  },

  // 도움말
  help() {
    console.log(`
╔══════════════════════════════════════════╗
║     GCP VM API Client - 명령어 도움말      ║
╚══════════════════════════════════════════╝

사용법: node vm-api-client.js <명령> [옵션]

명령어:
  status         - VM 상태 확인
  health         - 헬스체크
  logs [lines]   - 로그 확인 (기본 50줄)
  exec <cmd>     - 명령 실행
  deploy <file>  - 코드 배포
  update <file>  - 서버 코드 업데이트
  pm2            - PM2 프로세스 상태
  files [dir]    - 파일 목록 (기본 /tmp)
  restart        - 서비스 재시작
  help           - 이 도움말 표시

예제:
  node vm-api-client.js status
  node vm-api-client.js logs 100
  node vm-api-client.js exec "ls -la /tmp"
  node vm-api-client.js deploy my-app.js
  node vm-api-client.js files /var/log

환경변수:
  VM_API_TOKEN   - API 인증 토큰 (기본: dev-token-2025)

VM 정보:
  호스트: ${VM_HOST}
  포트: ${VM_PORT}
    `);
  }
};

// CLI 실행
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const params = args.slice(1);

  if (!command || command === 'help') {
    commands.help();
    return;
  }

  if (!commands[command]) {
    console.error(`❌ 알 수 없는 명령: ${command}`);
    console.log('도움말을 보려면: node vm-api-client.js help');
    return;
  }

  try {
    await commands[command](...params);
  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('VM에 연결할 수 없습니다. VM이 실행 중인지 확인하세요.');
      console.error(`주소: http://${VM_HOST}:${VM_PORT}`);
    }
  }
}

// 직접 실행시만 CLI 모드
if (require.main === module) {
  main();
}

// 모듈로 export
module.exports = { apiRequest, commands };