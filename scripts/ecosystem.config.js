/**
 * PM2 Ecosystem Configuration
 * GCP VM mcp-server 용
 * 작성일: 2025-08-14
 */

module.exports = {
  apps: [{
    name: 'mcp-server',
    script: './fix-vm-api-routing.js',
    instances: 1,
    exec_mode: 'cluster',
    
    // 환경 변수
    env: {
      NODE_ENV: 'production',
      PORT: 10000,
      MCP_SERVER_NAME: 'openmanager-vibe-v5',
      GOOGLE_AI_ENABLED: true
    },
    
    // 메모리 제한 (e2-micro는 1GB RAM)
    max_memory_restart: '800M',
    
    // 로그 설정
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    
    // 자동 재시작 설정
    autorestart: true,
    watch: false,
    max_restarts: 10,
    min_uptime: '10s',
    
    // 헬스체크
    health_check_interval: 30000,
    
    // 크래시 시 지수 백오프
    exp_backoff_restart_delay: 100,
    
    // 시작 시 대기
    wait_ready: true,
    listen_timeout: 5000,
    
    // 종료 시 graceful shutdown
    kill_timeout: 5000,
    
    // 무중단 재시작
    reload: true,
    reload_delay: 1000
  }],
  
  // 배포 설정 (옵션)
  deploy: {
    production: {
      user: 'YOUR_USERNAME',
      host: '104.154.205.25',
      ref: 'origin/main',
      repo: 'git@github.com:YOUR_REPO.git',
      path: '/home/YOUR_USERNAME/mcp-server',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
      'pre-deploy-local': 'echo "Deploying to GCP VM..."'
    }
  }
};