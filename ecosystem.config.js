/**
 * PM2 Ecosystem 설정 파일
 * OpenManager VIBE v5.80.0 개발 서버 관리
 *
 * 🎯 목적:
 * - 개발 서버 자동 재시작 및 프로세스 관리
 * - 메모리 제한 및 안정성 향상
 * - 로그 중앙화 및 모니터링
 *
 * 📖 사용법:
 * - pm2 start ecosystem.config.js         # 서버 시작
 * - pm2 stop openmanager-dev              # 서버 중지
 * - pm2 restart openmanager-dev           # 서버 재시작
 * - pm2 logs openmanager-dev              # 로그 확인
 * - pm2 monit                             # 실시간 모니터링
 * - pm2 status                            # 상태 확인
 *
 * @version 1.0.0
 * @since 2025-11-28
 */

module.exports = {
  apps: [
    {
      // 앱 이름 (pm2 명령어에서 사용)
      name: 'openmanager-dev',

      // 실행 스크립트 (npm script 사용)
      script: 'npm',
      args: 'run dev:stable',

      // 프로세스 설정
      instances: 1, // 단일 인스턴스 (개발 환경)
      autorestart: true, // 자동 재시작 활성화
      watch: false, // 파일 변경 감지 비활성화 (Next.js 자체 HMR 사용)

      // 메모리 관리
      max_memory_restart: '2G', // 2GB 초과 시 자동 재시작

      // 환경 변수
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
        // Next.js 최적화 옵션
        NEXT_DISABLE_DEVTOOLS: '1',
        NODE_OPTIONS: '--max-old-space-size=4096',
      },

      // 로그 설정
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z', // 로그 타임스탬프 형식
      error_file: './logs/pm2/error.log', // 에러 로그 파일
      out_file: './logs/pm2/out.log', // 출력 로그 파일
      merge_logs: true, // 로그 병합

      // 재시작 정책
      min_uptime: '10s', // 최소 가동 시간 (이 시간 내 재시작 시 비정상으로 간주)
      max_restarts: 10, // 최대 재시작 횟수 (이 횟수 초과 시 중지)
      restart_delay: 4000, // 재시작 대기 시간 (ms)

      // 기타 옵션
      kill_timeout: 5000, // 강제 종료 대기 시간 (ms)
      listen_timeout: 3000, // 앱 준비 대기 시간 (ms)
      shutdown_with_message: true, // 종료 시 메시지 수신
    },
  ],
};
