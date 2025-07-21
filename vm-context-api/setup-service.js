/**
 * 🔧 VM Context API 서비스 설치 스크립트
 *
 * systemd 서비스로 등록하여 자동 시작 및 관리
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SERVICE_NAME = 'vm-context-api';
const CURRENT_DIR = __dirname;
const USER = process.env.USER || 'ubuntu';

// 서비스 파일 내용
const serviceContent = `[Unit]
Description=OpenManager VM Context API Server
After=network.target
Wants=network.target

[Service]
Type=simple
User=${USER}
WorkingDirectory=${CURRENT_DIR}
ExecStart=/usr/bin/node ${CURRENT_DIR}/app.js
Restart=always
RestartSec=3
Environment=NODE_ENV=production
Environment=PORT=10001

# 로깅
StandardOutput=journal
StandardError=journal
SyslogIdentifier=${SERVICE_NAME}

# 보안 설정
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=${CURRENT_DIR}

# 리소스 제한
LimitNOFILE=1024
MemoryLimit=100M

[Install]
WantedBy=multi-user.target
`;

function log(message) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

function runCommand(command, description) {
  try {
    log(`${description}...`);
    execSync(command, { stdio: 'inherit' });
    log(`✅ ${description} 완료`);
  } catch (error) {
    log(`❌ ${description} 실패: ${error.message}`);
    throw error;
  }
}

async function setupService() {
  try {
    log('🚀 VM Context API 서비스 설치 시작');

    // 1. 필요한 디렉토리 및 권한 확인
    log('📁 디렉토리 및 권한 확인');
    if (!fs.existsSync(path.join(CURRENT_DIR, 'app.js'))) {
      throw new Error('app.js 파일을 찾을 수 없습니다');
    }

    if (!fs.existsSync(path.join(CURRENT_DIR, 'package.json'))) {
      throw new Error('package.json 파일을 찾을 수 없습니다');
    }

    // 2. 의존성 설치
    runCommand('npm install --production', 'NPM 의존성 설치');

    // 3. 서비스 파일 생성
    const servicePath = `/etc/systemd/system/${SERVICE_NAME}.service`;
    log(`📝 서비스 파일 생성: ${servicePath}`);

    try {
      fs.writeFileSync(servicePath, serviceContent);
      log('✅ 서비스 파일 생성 완료');
    } catch (error) {
      if (error.code === 'EACCES') {
        log('❌ 권한 오류: sudo 권한이 필요합니다');
        log('📌 다음 명령어를 실행하세요:');
        log(`sudo node ${__filename}`);
        return;
      }
      throw error;
    }

    // 4. systemd 재로드
    runCommand('systemctl daemon-reload', 'systemd 데몬 재로드');

    // 5. 서비스 활성화
    runCommand(`systemctl enable ${SERVICE_NAME}`, '서비스 자동 시작 활성화');

    // 6. 서비스 시작
    runCommand(`systemctl start ${SERVICE_NAME}`, '서비스 시작');

    // 7. 상태 확인
    log('🔍 서비스 상태 확인');
    setTimeout(() => {
      try {
        execSync(`systemctl is-active ${SERVICE_NAME}`, { stdio: 'pipe' });
        log('✅ 서비스가 정상적으로 실행 중입니다');

        // 포트 확인
        setTimeout(() => {
          try {
            execSync('curl -s http://localhost:10001/health', {
              stdio: 'pipe',
            });
            log('✅ 포트 10001에서 서비스가 응답하고 있습니다');
          } catch (error) {
            log('⚠️ 포트 10001 응답 확인 실패 (서비스 시작 중일 수 있습니다)');
          }
        }, 2000);
      } catch (error) {
        log('❌ 서비스 상태 확인 실패');
        log('📋 서비스 로그 확인: journalctl -u vm-context-api -f');
      }
    }, 3000);

    // 8. 완료 메시지
    log('🎉 VM Context API 서비스 설치 완료!');
    log('');
    log('📋 유용한 명령어:');
    log(`  상태 확인: systemctl status ${SERVICE_NAME}`);
    log(`  로그 확인: journalctl -u ${SERVICE_NAME} -f`);
    log(`  재시작: sudo systemctl restart ${SERVICE_NAME}`);
    log(`  중지: sudo systemctl stop ${SERVICE_NAME}`);
    log(
      `  제거: sudo systemctl stop ${SERVICE_NAME} && sudo systemctl disable ${SERVICE_NAME} && sudo rm ${servicePath}`
    );
    log('');
    log('🌐 API 엔드포인트:');
    log('  헬스체크: http://localhost:10001/health');
    log('  시스템 정보: http://localhost:10001/context/system');
    log('  MCP 상태: http://localhost:10001/context/mcp');
    log('  메트릭: http://localhost:10001/context/metrics');
    log('  전체 정보: http://localhost:10001/context/all');
  } catch (error) {
    log(`❌ 설치 실패: ${error.message}`);
    process.exit(1);
  }
}

// 루트 권한 확인
if (process.getuid && process.getuid() !== 0) {
  log('⚠️ 이 스크립트는 sudo 권한이 필요합니다');
  log('📌 다음 명령어로 실행하세요:');
  log(`sudo node ${__filename}`);
  process.exit(1);
}

// 실행
setupService();
