/**
 * 웹 서버 명령어 설정
 * Nginx, Apache 등 웹 서버별 명령어 정의
 */

import type { ServerCommands } from './types';
import { ubuntuCommonCommands, rhelCommonCommands } from './common-commands';

export const webServerCommands: Record<string, ServerCommands> = {
  // 웹 서버 #1 - Ubuntu + Nginx
  'web-prd-01': {
    os: 'Ubuntu 22.04 LTS',
    service: 'Nginx 1.22.0',
    commands: {
      basic: [
        ...ubuntuCommonCommands,
        {
          command: 'nginx -t',
          description: 'Nginx 설정 파일 구문 검사',
          category: 'system',
          riskLevel: 'safe',
        },
        {
          command: 'nginx -T',
          description: 'Nginx 전체 설정 덤프',
          category: 'system',
          riskLevel: 'safe',
        },
        {
          command: 'tail -f /var/log/nginx/access.log',
          description: 'Nginx 액세스 로그 실시간 모니터링',
          category: 'monitoring',
          riskLevel: 'safe',
        },
        {
          command: 'tail -f /var/log/nginx/error.log',
          description: 'Nginx 에러 로그 실시간 모니터링',
          category: 'monitoring',
          riskLevel: 'safe',
        },
      ],
      advanced: [
        {
          command: 'systemctl reload nginx',
          description: 'Nginx 설정 재로드 (무중단)',
          category: 'system',
          riskLevel: 'moderate',
        },
        {
          command: 'nginx -s reload',
          description: 'Nginx 설정 재로드 (직접 명령)',
          category: 'system',
          riskLevel: 'moderate',
        },
        {
          command: 'ab -n 1000 -c 10 http://localhost/',
          description: 'Apache Bench로 부하 테스트',
          category: 'monitoring',
          riskLevel: 'moderate',
          usage: 'ab -n [requests] -c [concurrency] [URL]',
        },
      ],
      troubleshooting: [
        {
          command: 'strace -p $(pgrep nginx | head -1)',
          description: 'Nginx 프로세스 시스템 콜 추적',
          category: 'process',
          riskLevel: 'moderate',
        },
        {
          command: 'lsof -i :80',
          description: '80번 포트 사용 프로세스 확인',
          category: 'network',
          riskLevel: 'safe',
        },
        {
          command: 'tcpdump -i any port 80 -n',
          description: 'HTTP 트래픽 캡처',
          category: 'network',
          riskLevel: 'moderate',
        },
      ],
    },
  },

  // 웹 서버 #2 - CentOS + Apache
  'web-prd-02': {
    os: 'CentOS 8.5',
    service: 'Apache 2.4.51',
    commands: {
      basic: [
        ...rhelCommonCommands,
        {
          command: 'httpd -t',
          description: 'Apache 설정 파일 구문 검사',
          category: 'system',
          riskLevel: 'safe',
        },
        {
          command: 'httpd -S',
          description: 'Apache 가상 호스트 설정 확인',
          category: 'system',
          riskLevel: 'safe',
        },
        {
          command: 'tail -f /var/log/httpd/access_log',
          description: 'Apache 액세스 로그 실시간 모니터링',
          category: 'monitoring',
          riskLevel: 'safe',
        },
        {
          command: 'tail -f /var/log/httpd/error_log',
          description: 'Apache 에러 로그 실시간 모니터링',
          category: 'monitoring',
          riskLevel: 'safe',
        },
      ],
      advanced: [
        {
          command: 'systemctl reload httpd',
          description: 'Apache 설정 재로드',
          category: 'system',
          riskLevel: 'moderate',
        },
        {
          command: 'apachectl graceful',
          description: 'Apache 우아한 재시작',
          category: 'system',
          riskLevel: 'moderate',
        },
        {
          command: 'apachectl configtest',
          description: 'Apache 설정 테스트',
          category: 'system',
          riskLevel: 'safe',
        },
        {
          command: 'mod_status 상태 확인',
          description: 'Apache 서버 상태 모니터링',
          category: 'monitoring',
          riskLevel: 'safe',
          example: 'curl http://localhost/server-status?auto',
        },
      ],
      troubleshooting: [
        {
          command: 'strace -p $(pgrep httpd | head -1)',
          description: 'Apache 프로세스 시스템 콜 추적',
          category: 'process',
          riskLevel: 'moderate',
        },
        {
          command: 'lsof -i :80',
          description: '80번 포트 사용 프로세스 확인',
          category: 'network',
          riskLevel: 'safe',
        },
        {
          command: 'httpd -M',
          description: '로드된 Apache 모듈 목록',
          category: 'system',
          riskLevel: 'safe',
        },
      ],
    },
  },
};
