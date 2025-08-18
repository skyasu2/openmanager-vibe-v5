/**
 * 서버 타입별 OS 명령어 매핑 설정
 * 모듈화된 명령어 설정을 re-export하여 기존 코드와의 호환성 유지
 *
 * @deprecated 새로운 코드에서는 './commands' 디렉토리의 개별 모듈을 직접 import하세요
 */

// 타입 re-export
export type { OSCommand, ServerCommands } from './commands/types';

// 공통 명령어 import
import {
  ubuntuCommonCommands,
  rhelCommonCommands,
  windowsCommonCommands,
} from './commands/common-commands';

// 서버별 명령어 및 유틸리티 import
import {
  serverCommandsMap,
  dangerousCommandPatterns,
  recommendCommands as recommendCommandsUtil,
  checkCommandRisk,
  translateCommand,
} from './commands';

// 기존 코드와의 호환성을 위한 re-export
export { serverCommandsMap };
export { dangerousCommandPatterns };

/**
 * 명령어 추천 함수 (기존 인터페이스 유지)
 * @deprecated 새로운 코드에서는 './commands/command-utils'의 recommendCommands를 직접 사용하세요
 */
export function recommendCommands(
  serverId: string,
  scenario: string,
  category?: string
): OSCommand[] {
  const serverCommands = serverCommandsMap[serverId];
  if (!serverCommands) return [];

  return recommendCommandsUtil(serverCommands, scenario, category);
}

// 기존 함수들 re-export
export { checkCommandRisk, translateCommand };

// 하위 호환성을 위한 상수 export
const _ubuntuCommonCommands: OSCommand[] = [
  // 모니터링 명령어
  {
    command: 'top',
    description: '실시간 프로세스 및 시스템 리소스 모니터링',
    category: 'monitoring',
    riskLevel: 'safe',
    usage: 'top [-b] [-n count]',
    example: 'top -b -n 1',
    alternatives: ['htop', 'atop', 'glances'],
  },
  {
    command: 'htop',
    description: '향상된 대화형 프로세스 뷰어',
    category: 'monitoring',
    riskLevel: 'safe',
    usage: 'htop [옵션]',
    alternatives: ['top', 'atop'],
  },
  {
    command: 'df -h',
    description: '디스크 사용량 확인 (사람이 읽기 쉬운 형식)',
    category: 'disk',
    riskLevel: 'safe',
    example: 'df -h | grep -v tmpfs',
  },
  {
    command: 'free -m',
    description: '메모리 사용량 확인 (MB 단위)',
    category: 'monitoring',
    riskLevel: 'safe',
    alternatives: ['free -h', 'vmstat', 'cat /proc/meminfo'],
  },
  {
    command: 'iostat -x 1',
    description: '디스크 I/O 통계 실시간 모니터링',
    category: 'disk',
    riskLevel: 'safe',
    usage: 'iostat -x [interval] [count]',
  },
  {
    command: 'netstat -tuln',
    description: '열린 네트워크 포트 확인',
    category: 'network',
    riskLevel: 'safe',
    alternatives: ['ss -tuln', 'lsof -i'],
  },
  {
    command: 'ps aux | grep',
    description: '특정 프로세스 찾기',
    category: 'process',
    riskLevel: 'safe',
    example: 'ps aux | grep nginx',
  },
  {
    command: 'systemctl status',
    description: '서비스 상태 확인',
    category: 'system',
    riskLevel: 'safe',
    example: 'systemctl status nginx',
  },
  {
    command: 'journalctl -xe',
    description: '시스템 로그 확인 (최근 에러 중심)',
    category: 'system',
    riskLevel: 'safe',
    alternatives: ['journalctl -f', 'tail -f /var/log/syslog'],
  },
];

const _rhelCommonCommands: OSCommand[] = [
  ..._ubuntuCommonCommands,
  {
    command: 'yum check-update',
    description: '업데이트 가능한 패키지 확인',
    category: 'system',
    riskLevel: 'safe',
    alternatives: ['dnf check-update'],
  },
  {
    command: 'systemctl list-units --failed',
    description: '실패한 서비스 목록 확인',
    category: 'system',
    riskLevel: 'safe',
  },
];

const _windowsCommonCommands: OSCommand[] = [
  {
    command: 'Get-Process | Sort-Object CPU -Descending',
    description: 'CPU 사용량 순으로 프로세스 정렬 (PowerShell)',
    category: 'monitoring',
    riskLevel: 'safe',
    alternatives: ['tasklist /v'],
  },
  {
    command: 'Get-Counter "\\Processor(_Total)\\% Processor Time"',
    description: 'CPU 사용률 확인 (PowerShell)',
    category: 'monitoring',
    riskLevel: 'safe',
  },
  {
    command: 'wmic cpu get loadpercentage',
    description: 'CPU 사용률 확인 (CMD)',
    category: 'monitoring',
    riskLevel: 'safe',
  },
  {
    command: 'Get-WmiObject Win32_LogicalDisk',
    description: '디스크 사용량 확인 (PowerShell)',
    category: 'disk',
    riskLevel: 'safe',
    alternatives: ['wmic logicaldisk get size,freespace,caption'],
  },
  {
    command: 'netstat -an | findstr LISTENING',
    description: '열린 포트 확인',
    category: 'network',
    riskLevel: 'safe',
  },
  {
    command: 'Get-Service | Where-Object {$_.Status -eq "Running"}',
    description: '실행 중인 서비스 목록 (PowerShell)',
    category: 'system',
    riskLevel: 'safe',
    alternatives: ['sc query'],
  },
  {
    command: 'Get-EventLog -LogName System -Newest 100',
    description: '시스템 이벤트 로그 확인 (PowerShell)',
    category: 'system',
    riskLevel: 'safe',
  },
];

// 더미 맵 (실제로는 './commands'에서 가져옴)
const _serverCommandsMap: Record<string, ServerCommands> = {
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
          command: 'mod_status 활성화 확인',
          description: 'Apache 상태 모듈 확인',
          category: 'monitoring',
          riskLevel: 'safe',
          example: 'curl http://localhost/server-status',
        },
      ],
      troubleshooting: [
        {
          command: 'semanage port -l | grep http',
          description: 'SELinux HTTP 포트 정책 확인',
          category: 'security',
          riskLevel: 'safe',
        },
        {
          command: 'getsebool -a | grep httpd',
          description: 'SELinux httpd 부울 값 확인',
          category: 'security',
          riskLevel: 'safe',
        },
        {
          command: 'firewall-cmd --list-services',
          description: '방화벽 허용 서비스 목록',
          category: 'security',
          riskLevel: 'safe',
        },
      ],
    },
  },

  // 애플리케이션 서버 #1 - RHEL + Tomcat
  'app-prd-01': {
    os: 'Red Hat Enterprise Linux 8.7',
    service: 'Apache Tomcat 9.0.71',
    commands: {
      basic: [
        ...rhelCommonCommands,
        {
          command: 'ps aux | grep java',
          description: 'Java/Tomcat 프로세스 확인',
          category: 'process',
          riskLevel: 'safe',
        },
        {
          command: 'jps -lv',
          description: 'Java 프로세스 상세 정보',
          category: 'process',
          riskLevel: 'safe',
        },
        {
          command: 'tail -f $CATALINA_HOME/logs/catalina.out',
          description: 'Tomcat 메인 로그 모니터링',
          category: 'monitoring',
          riskLevel: 'safe',
        },
        {
          command: 'jstat -gcutil <pid> 1000',
          description: 'JVM 가비지 컬렉션 통계',
          category: 'monitoring',
          riskLevel: 'safe',
          usage: 'jstat -gcutil [pid] [interval_ms]',
        },
      ],
      advanced: [
        {
          command: 'jmap -heap <pid>',
          description: 'JVM 힙 메모리 정보',
          category: 'monitoring',
          riskLevel: 'moderate',
          usage: 'jmap -heap [pid]',
        },
        {
          command: 'jstack <pid>',
          description: 'Java 스레드 덤프',
          category: 'process',
          riskLevel: 'moderate',
          usage: 'jstack [pid] > thread_dump.txt',
        },
        {
          command: '$CATALINA_HOME/bin/catalina.sh stop',
          description: 'Tomcat 정지',
          category: 'system',
          riskLevel: 'dangerous',
        },
        {
          command: '$CATALINA_HOME/bin/catalina.sh start',
          description: 'Tomcat 시작',
          category: 'system',
          riskLevel: 'moderate',
        },
      ],
      troubleshooting: [
        {
          command: 'jmap -histo:live <pid> | head -20',
          description: 'JVM 라이브 객체 히스토그램',
          category: 'monitoring',
          riskLevel: 'moderate',
        },
        {
          command: 'jcmd <pid> GC.heap_dump /tmp/heap.hprof',
          description: '힙 덤프 생성',
          category: 'process',
          riskLevel: 'dangerous',
          usage: 'jcmd [pid] GC.heap_dump [output_file]',
        },
        {
          command: 'netstat -an | grep 8080',
          description: 'Tomcat 포트 연결 상태',
          category: 'network',
          riskLevel: 'safe',
        },
      ],
    },
  },

  // 애플리케이션 서버 #2 - Ubuntu + Node.js
  'app-prd-02': {
    os: 'Ubuntu 20.04 LTS',
    service: 'Node.js 18.17.1 (PM2)',
    commands: {
      basic: [
        ...ubuntuCommonCommands,
        {
          command: 'pm2 list',
          description: 'PM2 프로세스 목록',
          category: 'process',
          riskLevel: 'safe',
        },
        {
          command: 'pm2 status',
          description: 'PM2 프로세스 상태',
          category: 'process',
          riskLevel: 'safe',
        },
        {
          command: 'pm2 monit',
          description: 'PM2 실시간 모니터링',
          category: 'monitoring',
          riskLevel: 'safe',
        },
        {
          command: 'pm2 logs',
          description: 'PM2 로그 스트리밍',
          category: 'monitoring',
          riskLevel: 'safe',
          alternatives: ['pm2 logs --lines 100'],
        },
      ],
      advanced: [
        {
          command: 'pm2 reload all',
          description: 'PM2 무중단 재시작',
          category: 'system',
          riskLevel: 'moderate',
        },
        {
          command: 'pm2 scale app +2',
          description: 'PM2 인스턴스 스케일링',
          category: 'system',
          riskLevel: 'moderate',
          usage: 'pm2 scale [app_name] [+/-instances]',
        },
        {
          command: 'node --inspect=0.0.0.0:9229 app.js',
          description: 'Node.js 디버그 모드 실행',
          category: 'process',
          riskLevel: 'dangerous',
        },
      ],
      troubleshooting: [
        {
          command: 'pm2 describe <app_name>',
          description: 'PM2 앱 상세 정보',
          category: 'process',
          riskLevel: 'safe',
        },
        {
          command: 'pm2 env <app_id>',
          description: 'PM2 환경 변수 확인',
          category: 'system',
          riskLevel: 'safe',
        },
        {
          command: 'node --trace-warnings app.js',
          description: 'Node.js 경고 추적',
          category: 'process',
          riskLevel: 'moderate',
        },
        {
          command: 'npx clinic doctor -- node app.js',
          description: 'Node.js 성능 진단',
          category: 'monitoring',
          riskLevel: 'moderate',
        },
      ],
    },
  },

  // 데이터베이스 서버 #1 - Ubuntu + PostgreSQL
  'db-main-01': {
    os: 'Ubuntu 20.04 LTS',
    service: 'PostgreSQL 14.9',
    commands: {
      basic: [
        ...ubuntuCommonCommands,
        {
          command: 'sudo -u postgres psql -c "SELECT version();"',
          description: 'PostgreSQL 버전 확인',
          category: 'system',
          riskLevel: 'safe',
        },
        {
          command: 'sudo -u postgres psql -c "\\l"',
          description: '데이터베이스 목록',
          category: 'system',
          riskLevel: 'safe',
        },
        {
          command: 'sudo -u postgres psql -c "SELECT * FROM pg_stat_activity;"',
          description: '활성 연결 및 쿼리 확인',
          category: 'monitoring',
          riskLevel: 'safe',
        },
        {
          command: 'tail -f /var/log/postgresql/postgresql-14-main.log',
          description: 'PostgreSQL 로그 모니터링',
          category: 'monitoring',
          riskLevel: 'safe',
        },
      ],
      advanced: [
        {
          command:
            'sudo -u postgres psql -c "SELECT pg_database_size(\'dbname\');"',
          description: '데이터베이스 크기 확인',
          category: 'disk',
          riskLevel: 'safe',
          usage: "SELECT pg_database_size('[database_name]');",
        },
        {
          command:
            'sudo -u postgres psql -c "SELECT * FROM pg_stat_user_tables;"',
          description: '테이블 통계 정보',
          category: 'monitoring',
          riskLevel: 'safe',
        },
        {
          command: 'sudo -u postgres psql -c "VACUUM ANALYZE;"',
          description: '데이터베이스 최적화',
          category: 'system',
          riskLevel: 'moderate',
        },
        {
          command: 'pg_dump -U postgres dbname > backup.sql',
          description: '데이터베이스 백업',
          category: 'system',
          riskLevel: 'moderate',
          usage: 'pg_dump -U [user] [database] > [output_file]',
        },
      ],
      troubleshooting: [
        {
          command: 'sudo -u postgres psql -c "SELECT * FROM pg_locks;"',
          description: '락 정보 확인',
          category: 'monitoring',
          riskLevel: 'safe',
        },
        {
          command:
            "sudo -u postgres psql -c \"SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle' AND state_change < current_timestamp - interval '1 hour';\"",
          description: '오래된 idle 연결 종료',
          category: 'process',
          riskLevel: 'dangerous',
        },
        {
          command: 'sudo -u postgres psql -c "EXPLAIN ANALYZE [query];"',
          description: '쿼리 실행 계획 분석',
          category: 'monitoring',
          riskLevel: 'safe',
        },
      ],
    },
  },

  // 데이터베이스 서버 #2 - Ubuntu + PostgreSQL (Replica)
  'db-repl-01': {
    os: 'Ubuntu 20.04 LTS',
    service: 'PostgreSQL 14.9 (Replica)',
    commands: {
      basic: [
        ...ubuntuCommonCommands,
        {
          command: 'sudo -u postgres psql -c "SELECT pg_is_in_recovery();"',
          description: '복제 상태 확인',
          category: 'monitoring',
          riskLevel: 'safe',
        },
        {
          command:
            'sudo -u postgres psql -c "SELECT * FROM pg_stat_replication;"',
          description: '복제 통계 정보',
          category: 'monitoring',
          riskLevel: 'safe',
        },
        {
          command:
            'sudo -u postgres psql -c "SELECT pg_last_wal_receive_lsn(), pg_last_wal_replay_lsn();"',
          description: 'WAL 수신/재생 위치',
          category: 'monitoring',
          riskLevel: 'safe',
        },
      ],
      advanced: [
        {
          command:
            'sudo -u postgres psql -c "SELECT pg_wal_lsn_diff(pg_last_wal_receive_lsn(), pg_last_wal_replay_lsn());"',
          description: '복제 지연 바이트 수',
          category: 'monitoring',
          riskLevel: 'safe',
        },
        {
          command:
            'pg_basebackup -h master_host -D /backup -U replicator -v -P -W',
          description: '베이스 백업 생성',
          category: 'system',
          riskLevel: 'dangerous',
        },
      ],
      troubleshooting: [
        {
          command:
            'tail -100 /var/log/postgresql/postgresql-14-main.log | grep -i "conflict"',
          description: '복제 충돌 로그 확인',
          category: 'monitoring',
          riskLevel: 'safe',
        },
        {
          command: 'sudo systemctl status postgresql@14-main',
          description: 'PostgreSQL 서비스 상태',
          category: 'system',
          riskLevel: 'safe',
        },
      ],
    },
  },

  // 파일/스토리지 서버 - Windows Server
  'file-nas-01': {
    os: 'Windows Server 2019 Standard',
    service: 'SMB/CIFS File Server',
    commands: {
      basic: [
        ...windowsCommonCommands,
        {
          command: 'Get-SmbShare',
          description: 'SMB 공유 목록 확인',
          category: 'system',
          riskLevel: 'safe',
        },
        {
          command: 'Get-SmbSession',
          description: 'SMB 세션 목록',
          category: 'network',
          riskLevel: 'safe',
        },
        {
          command: 'Get-SmbOpenFile',
          description: '열린 SMB 파일 목록',
          category: 'monitoring',
          riskLevel: 'safe',
        },
        {
          command: 'Get-DedupStatus',
          description: '중복 제거 상태 확인',
          category: 'disk',
          riskLevel: 'safe',
        },
      ],
      advanced: [
        {
          command: 'Start-DedupJob -Type Optimization -Volume D:',
          description: '중복 제거 최적화 시작',
          category: 'disk',
          riskLevel: 'moderate',
        },
        {
          command: 'Set-SmbServerConfiguration -EnableSMB1Protocol $false',
          description: 'SMBv1 프로토콜 비활성화',
          category: 'security',
          riskLevel: 'moderate',
        },
        {
          command: 'Get-StorageReliabilityCounter -Disk (Get-Disk)',
          description: '디스크 신뢰성 카운터',
          category: 'disk',
          riskLevel: 'safe',
        },
      ],
      troubleshooting: [
        {
          command: 'Test-NetConnection -ComputerName client -Port 445',
          description: 'SMB 포트 연결 테스트',
          category: 'network',
          riskLevel: 'safe',
        },
        {
          command: 'Get-SmbMultichannelConnection',
          description: 'SMB 멀티채널 연결 상태',
          category: 'network',
          riskLevel: 'safe',
        },
        {
          command: 'Repair-Volume -DriveLetter D -Scan',
          description: '볼륨 오류 스캔',
          category: 'disk',
          riskLevel: 'moderate',
        },
      ],
    },
  },

  // 백업 서버 - Debian + Bacula
  'backup-01': {
    os: 'Debian 11 (Bullseye)',
    service: 'Bacula 9.6.7',
    commands: {
      basic: [
        ...ubuntuCommonCommands, // Debian도 대부분 동일
        {
          command: 'bconsole -c /etc/bacula/bconsole.conf',
          description: 'Bacula 콘솔 접속',
          category: 'system',
          riskLevel: 'safe',
        },
        {
          command: 'echo "status dir" | bconsole',
          description: 'Bacula Director 상태',
          category: 'monitoring',
          riskLevel: 'safe',
        },
        {
          command: 'echo "status storage" | bconsole',
          description: 'Bacula Storage 상태',
          category: 'monitoring',
          riskLevel: 'safe',
        },
        {
          command: 'echo "list jobs" | bconsole',
          description: '백업 작업 목록',
          category: 'monitoring',
          riskLevel: 'safe',
        },
      ],
      advanced: [
        {
          command: 'echo "run job=BackupJob yes" | bconsole',
          description: '백업 작업 수동 실행',
          category: 'system',
          riskLevel: 'moderate',
        },
        {
          command: 'echo "cancel jobid=123" | bconsole',
          description: '백업 작업 취소',
          category: 'process',
          riskLevel: 'moderate',
          usage: 'cancel jobid=[job_id]',
        },
        {
          command: 'echo "prune volume=Vol001" | bconsole',
          description: '볼륨 정리',
          category: 'disk',
          riskLevel: 'dangerous',
        },
      ],
      troubleshooting: [
        {
          command: 'tail -f /var/log/bacula/bacula.log',
          description: 'Bacula 로그 모니터링',
          category: 'monitoring',
          riskLevel: 'safe',
        },
        {
          command: 'echo "list volumes" | bconsole',
          description: '백업 볼륨 목록',
          category: 'disk',
          riskLevel: 'safe',
        },
        {
          command: 'echo "messages" | bconsole',
          description: 'Bacula 메시지 확인',
          category: 'monitoring',
          riskLevel: 'safe',
        },
        {
          command: 'bacula-dir -t -c /etc/bacula/bacula-dir.conf',
          description: 'Bacula 설정 검증',
          category: 'system',
          riskLevel: 'safe',
        },
      ],
    },
  },
};

// 위험한 명령어 패턴은 이미 './commands'에서 import됨
const _dangerousCommandPatterns = [
  /rm\s+-rf\s+\//, // rm -rf /
  /dd\s+if=.*of=\/dev\//, // dd 명령어로 디바이스 덮어쓰기
  /format\s+[cC]:/, // Windows 포맷
  /del\s+\/[sS]\s+\/[qQ]\s+[cC]:\\/, // Windows 전체 삭제
  /shutdown|reboot|halt/, // 시스템 종료/재시작
  /kill\s+-9\s+1/, // init 프로세스 종료
  /chmod\s+777\s+\//, // 루트 권한 변경
  /mkfs\./, // 파일시스템 포맷
  />\/dev\/null\s+2>&1/, // 출력 무시 (숨겨진 작업)
];

// recommendCommands 함수는 이미 위에서 정의됨

// 더미 함수 (실제로는 위에서 정의된 것 사용)
function _recommendCommands(
  serverId: string,
  scenario: string,
  category?: string
): OSCommand[] {
  const serverCommands = serverCommandsMap[serverId];
  if (!serverCommands) return [];

  let commands: OSCommand[] = [];

  // 시나리오별 명령어 선택
  switch (scenario) {
    case 'cpu_high':
      commands = [
        ...serverCommands.commands.basic.filter(
          (cmd) => cmd.category === 'monitoring' || cmd.category === 'process'
        ),
        ...serverCommands.commands.troubleshooting.filter(
          (cmd) => cmd.category === 'process'
        ),
      ];
      break;

    case 'memory_leak':
      commands = serverCommands.commands.basic.filter(
        (cmd) =>
          cmd.command.includes('memory') ||
          cmd.command.includes('free') ||
          cmd.command.includes('ps') ||
          cmd.command.includes('jmap') // Java 메모리
      );
      break;

    case 'disk_full':
      commands = [
        ...serverCommands.commands.basic.filter(
          (cmd) => cmd.category === 'disk'
        ),
        ...serverCommands.commands.troubleshooting.filter(
          (cmd) => cmd.category === 'disk'
        ),
      ];
      break;

    case 'service_down':
      commands = [
        ...serverCommands.commands.basic.filter(
          (cmd) => cmd.category === 'system'
        ),
        ...serverCommands.commands.advanced.filter(
          (cmd) =>
            cmd.command.includes('start') || cmd.command.includes('restart')
        ),
      ];
      break;

    default:
      // 기본: 안전한 모니터링 명령어
      commands = serverCommands.commands.basic.filter(
        (cmd) =>
          cmd.riskLevel === 'safe' &&
          (category ? cmd.category === category : true)
      );
  }

  return commands;
}

// checkCommandRisk는 이미 './commands'에서 import됨

// 더미 함수 (실제로는 import된 것 사용)
function _checkCommandRisk(command: string): {
  isAllowed: boolean;
  riskLevel: 'safe' | 'moderate' | 'dangerous';
  reason?: string;
} {
  // 위험한 패턴 검사
  for (const pattern of dangerousCommandPatterns) {
    if (pattern.test(command)) {
      return {
        isAllowed: false,
        riskLevel: 'dangerous',
        reason: '이 명령어는 시스템에 심각한 영향을 줄 수 있습니다.',
      };
    }
  }

  // 특정 키워드 검사
  const dangerousKeywords = ['format', 'delete', 'drop', 'truncate', 'rm -rf'];
  const moderateKeywords = ['restart', 'reload', 'stop', 'kill'];

  const lowerCommand = command.toLowerCase();

  for (const keyword of dangerousKeywords) {
    if (lowerCommand.includes(keyword)) {
      return {
        isAllowed: false,
        riskLevel: 'dangerous',
        reason: `'${keyword}' 명령어는 데이터 손실을 일으킬 수 있습니다.`,
      };
    }
  }

  for (const keyword of moderateKeywords) {
    if (lowerCommand.includes(keyword)) {
      return {
        isAllowed: true,
        riskLevel: 'moderate',
        reason: `'${keyword}' 명령어는 서비스에 영향을 줄 수 있습니다. 주의해서 사용하세요.`,
      };
    }
  }

  return {
    isAllowed: true,
    riskLevel: 'safe',
  };
}

// translateCommand는 이미 './commands'에서 import됨

// 더미 함수 (실제로는 import된 것 사용)
function _translateCommand(
  command: string,
  fromOS: string,
  toOS: string
): string | null {
  const translations: Record<string, Record<string, string>> = {
    'ps aux': {
      windows: 'Get-Process | Format-Table -AutoSize',
    },
    'df -h': {
      windows: 'Get-PSDrive -PSProvider FileSystem',
    },
    'free -m': {
      windows:
        'Get-WmiObject Win32_OperatingSystem | Select-Object TotalVisibleMemorySize,FreePhysicalMemory',
    },
    'netstat -tuln': {
      windows: 'netstat -an | findstr LISTENING',
    },
    'systemctl status': {
      windows: 'Get-Service | Where-Object {$_.Status -eq "Running"}',
    },
    'tail -f': {
      windows: 'Get-Content -Path [file] -Wait -Tail 10',
    },
  };

  const isWindows = toOS.toLowerCase().includes('windows');
  const isLinux = !isWindows;

  if (isWindows && translations[command]) {
    return translations[command]['windows'];
  }

  // Windows에서 Linux로의 역변환은 구현 필요시 추가
  return null;
}
