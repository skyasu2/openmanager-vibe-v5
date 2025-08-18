/**
 * 데이터베이스 서버 명령어 설정
 * PostgreSQL, MySQL, MongoDB 등 데이터베이스별 명령어 정의
 */

import type { ServerCommands } from './types';
import { ubuntuCommonCommands } from './common-commands';

export const databaseCommands: Record<string, ServerCommands> = {
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
          description: 'WAL 수신/재생 위치 확인',
          category: 'monitoring',
          riskLevel: 'safe',
        },
        {
          command:
            'sudo -u postgres psql -c "SELECT * FROM pg_stat_wal_receiver;"',
          description: 'WAL 수신자 상태',
          category: 'monitoring',
          riskLevel: 'safe',
        },
      ],
      advanced: [
        {
          command: 'sudo -u postgres psql -c "SELECT pg_wal_replay_pause();"',
          description: 'WAL 재생 일시중지',
          category: 'system',
          riskLevel: 'dangerous',
        },
        {
          command: 'sudo -u postgres psql -c "SELECT pg_wal_replay_resume();"',
          description: 'WAL 재생 재개',
          category: 'system',
          riskLevel: 'moderate',
        },
        {
          command:
            'sudo -u postgres psql -c "SELECT * FROM pg_replication_slots;"',
          description: '복제 슬롯 정보',
          category: 'monitoring',
          riskLevel: 'safe',
        },
      ],
      troubleshooting: [
        {
          command:
            'sudo -u postgres psql -c "SELECT now() - pg_last_xact_replay_timestamp() AS replication_lag;"',
          description: '복제 지연 시간 확인',
          category: 'monitoring',
          riskLevel: 'safe',
        },
        {
          command:
            'tail -n 100 /var/log/postgresql/postgresql-14-main.log | grep -E "(FATAL|ERROR)"',
          description: 'PostgreSQL 에러 로그 필터링',
          category: 'monitoring',
          riskLevel: 'safe',
        },
        {
          command:
            'pg_basebackup -h master_host -D /var/lib/postgresql/14/main -U replicator -v -P -W',
          description: '베이스 백업 재생성',
          category: 'system',
          riskLevel: 'dangerous',
        },
      ],
    },
  },
};
