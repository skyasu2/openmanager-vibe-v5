/**
 * 🚀 PM2 Ecosystem Configuration
 *
 * WSL2 포트 충돌 해결 시스템 - AI 교차검증 기반
 * Codex (실무) + Gemini (아키텍처) + Qwen (성능) 최적화 통합
 */

const { getAvailablePort, createPortManager } = require('./utils/dynamic-port');

module.exports = {
  apps: [
    // 🎯 메인 개발 서버
    {
      name: 'openmanager-dev',
      script: 'npm',
      args: 'run dev:ai-port',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'development',
        PORT: 0, // 동적 할당
        NODE_OPTIONS: '--max-old-space-size=4096',
        NEXT_DISABLE_DEVTOOLS: '1',
        NEXT_TELEMETRY_DISABLED: '0',
        PM2_MANAGED: 'true'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 0,
        NODE_OPTIONS: '--max-old-space-size=2048'
      },
      // PM2 프로세스 관리 설정
      kill_timeout: 3000,
      wait_ready: true,
      listen_timeout: 30000,
      max_memory_restart: '4G',

      // 포트 충돌 해결 설정
      increment_var_on_restart: 'PORT',
      restart_delay: 2000,
      max_restarts: 5,
      min_uptime: '10s',

      // 자동 복구 설정
      autorestart: true,
      watch: false, // HMR과 충돌 방지
      ignore_watch: [
        'node_modules',
        '.next',
        'logs',
        'test-results'
      ],

      // 로그 설정
      log_file: 'logs/pm2-dev-combined.log',
      out_file: 'logs/pm2-dev-out.log',
      error_file: 'logs/pm2-dev-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,

      // 헬스체크
      health_check_http: true,
      health_check_grace_period: 3000,
      health_check_interval: 30000
    },

    // 🧪 테스트 서버
    {
      name: 'openmanager-test',
      script: 'npm',
      args: 'run dev:ai-port',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'test',
        PORT: 0,
        NODE_OPTIONS: '--max-old-space-size=2048',
        NEXT_DISABLE_DEVTOOLS: '1',
        NEXT_TELEMETRY_DISABLED: '1',
        TEST_MODE: 'true',
        PM2_MANAGED: 'true'
      },
      autorestart: false, // 테스트 시에만 실행
      max_memory_restart: '2G',
      log_file: 'logs/pm2-test-combined.log',
      out_file: 'logs/pm2-test-out.log',
      error_file: 'logs/pm2-test-error.log'
    },

    // 🎭 스테이징 서버
    {
      name: 'openmanager-staging',
      script: 'npm',
      args: 'run dev:staging',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'staging',
        PORT: 0,
        NODE_OPTIONS: '--max-old-space-size=3072',
        VERCEL_ENV: 'preview',
        PM2_MANAGED: 'true'
      },
      autorestart: true,
      max_memory_restart: '3G',
      increment_var_on_restart: 'PORT',
      log_file: 'logs/pm2-staging-combined.log',
      out_file: 'logs/pm2-staging-out.log',
      error_file: 'logs/pm2-staging-error.log'
    },

    // 🏗️ 빌드 서버 (필요시)
    {
      name: 'openmanager-build',
      script: 'npm',
      args: 'run build',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        NODE_OPTIONS: '--max-old-space-size=2048',
        VERCEL_BUILD_OPTIMIZATION: 'true'
      },
      autorestart: false, // 빌드는 일회성
      max_memory_restart: '2G',
      log_file: 'logs/pm2-build-combined.log',
      out_file: 'logs/pm2-build-out.log',
      error_file: 'logs/pm2-build-error.log'
    },

    // 📊 포트 모니터링 서비스
    {
      name: 'port-monitor',
      script: 'node',
      args: 'scripts/port-monitoring-service.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'development',
        MONITOR_PORTS: '3000,3001,3002,3003,3004,3005',
        CHECK_INTERVAL: '5000', // 5초마다 체크
        LOG_LEVEL: 'info'
      },
      autorestart: true,
      max_memory_restart: '256M',
      restart_delay: 1000,
      log_file: 'logs/pm2-port-monitor.log',
      out_file: 'logs/pm2-port-monitor-out.log',
      error_file: 'logs/pm2-port-monitor-error.log'
    }
  ],

  // 🚀 배포 설정
  deploy: {
    development: {
      user: 'developer',
      host: 'localhost',
      ref: 'origin/develop',
      repo: 'https://github.com/your-username/openmanager-vibe-v5.git',
      path: '/var/www/development',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env development',
      'pre-setup': ''
    },

    staging: {
      user: 'deploy',
      host: 'staging-server',
      ref: 'origin/staging',
      repo: 'https://github.com/your-username/openmanager-vibe-v5.git',
      path: '/var/www/staging',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env staging',
      'pre-setup': ''
    },

    production: {
      user: 'deploy',
      host: 'production-server',
      ref: 'origin/main',
      repo: 'https://github.com/your-username/openmanager-vibe-v5.git',
      path: '/var/www/production',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  },

  // 📋 PM2+ 모니터링 설정 (선택사항)
  pmx: {
    enabled: true,
    network: true,
    ports: true,
    custom_probes: [
      {
        name: 'Available Ports',
        value: function() {
          const portManager = createPortManager();
          return portManager.getAllPortInfo().length;
        }
      },
      {
        name: 'Memory Usage',
        value: function() {
          return Math.round(process.memoryUsage().rss / 1024 / 1024) + ' MB';
        }
      }
    ]
  }
};

// 🛠️ 동적 포트 할당 헬퍼 함수들
async function setupDynamicPorts() {
  console.log('🔧 동적 포트 할당 설정 중...');

  const portManager = createPortManager({
    startPort: 3000,
    endPort: 4000,
    preferredPorts: [3000, 3001, 3002, 3003]
  });

  // 각 앱에 대해 포트 예약
  const apps = module.exports.apps;

  for (let i = 0; i < apps.length; i++) {
    const app = apps[i];

    if (app.env && app.env.PORT === 0) {
      try {
        const port = await portManager.allocateOptimalPort(app.name);
        app.env.PORT = port;
        console.log(`✅ ${app.name}: 포트 ${port} 할당됨`);
      } catch (error) {
        console.error(`❌ ${app.name}: 포트 할당 실패 - ${error.message}`);
        // 폴백으로 랜덤 포트 사용
        app.env.PORT = 3000 + i + Math.floor(Math.random() * 1000);
      }
    }
  }

  console.log('🎯 동적 포트 할당 완료!');
}

// 🚀 시작 시 포트 설정
if (require.main === module) {
  setupDynamicPorts().then(() => {
    console.log('📋 PM2 Ecosystem 설정 완료');
    console.log('사용법:');
    console.log('  pm2 start ecosystem.config.js');
    console.log('  pm2 start ecosystem.config.js --env production');
    console.log('  pm2 monit  # 모니터링');
    console.log('  pm2 logs   # 로그 보기');
  });
}

// 💡 추가 유틸리티 함수들
module.exports.utils = {
  // 포트 상태 체크
  checkPortHealth: async () => {
    const { healthCheckPorts } = require('./utils/dynamic-port');
    const ports = [3000, 3001, 3002, 3003, 3004, 3005];
    return await healthCheckPorts(ports);
  },

  // 모든 앱 재시작 (포트 충돌 해결용)
  restartAllApps: () => {
    const { exec } = require('child_process');
    return new Promise((resolve, reject) => {
      exec('pm2 restart all --update-env', (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else {
          resolve(stdout);
        }
      });
    });
  },

  // 포트 충돌 자동 해결
  resolvePortConflicts: async () => {
    console.log('🔧 포트 충돌 자동 해결 시작...');

    try {
      // 1. 포트 정리
      const { exec } = require('child_process');
      await new Promise((resolve) => {
        exec('npm run clean:ports', () => resolve());
      });

      // 2. PM2 앱들 재시작
      await module.exports.utils.restartAllApps();

      console.log('✅ 포트 충돌 해결 완료');
      return true;
    } catch (error) {
      console.error('❌ 포트 충돌 해결 실패:', error);
      return false;
    }
  }
};