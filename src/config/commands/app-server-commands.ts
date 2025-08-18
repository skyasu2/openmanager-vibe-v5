/**
 * 애플리케이션 서버 명령어 설정
 * Tomcat, Node.js 등 애플리케이션 서버별 명령어 정의
 */

import type { ServerCommands } from './types';
import { ubuntuCommonCommands, rhelCommonCommands } from './common-commands';

export const appServerCommands: Record<string, ServerCommands> = {
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
          description: 'PM2 로그 확인',
          category: 'monitoring',
          riskLevel: 'safe',
          usage: 'pm2 logs [app-name] [--lines 100]',
        },
        {
          command: 'node --version',
          description: 'Node.js 버전 확인',
          category: 'system',
          riskLevel: 'safe',
        },
      ],
      advanced: [
        {
          command: 'pm2 restart all',
          description: '모든 PM2 프로세스 재시작',
          category: 'system',
          riskLevel: 'moderate',
        },
        {
          command: 'pm2 reload ecosystem.config.js',
          description: 'PM2 설정 재로드',
          category: 'system',
          riskLevel: 'moderate',
        },
        {
          command: 'pm2 save',
          description: 'PM2 프로세스 목록 저장',
          category: 'system',
          riskLevel: 'safe',
        },
        {
          command: 'node --inspect=0.0.0.0:9229',
          description: 'Node.js 디버그 모드 실행',
          category: 'process',
          riskLevel: 'dangerous',
          usage: 'node --inspect=[host:port] app.js',
        },
      ],
      troubleshooting: [
        {
          command: 'pm2 describe <app-name>',
          description: 'PM2 앱 상세 정보',
          category: 'process',
          riskLevel: 'safe',
        },
        {
          command: 'pm2 info <app-name>',
          description: 'PM2 앱 전체 정보',
          category: 'process',
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
        {
          command: 'lsof -i :3000',
          description: '포트 3000 사용 프로세스 확인',
          category: 'network',
          riskLevel: 'safe',
        },
      ],
    },
  },
};
