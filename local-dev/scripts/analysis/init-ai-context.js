const fs = require('fs');
const path = require('path');

/**
 * AI 컨텍스트 관리 시스템 초기화 스크립트
 * - 기본 디렉토리 구조 생성
 * - 샘플 컨텍스트 파일 생성
 * - 로그 디렉토리 구조 생성
 */

const BASE_DIR = path.join(process.cwd());
const DOCUMENTS_DIR = path.join(BASE_DIR, 'src', 'mcp', 'documents');
const LOGS_DIR = path.join(BASE_DIR, 'logs');

// 생성할 디렉토리 구조
const DIRECTORIES = [
  // 컨텍스트 문서 디렉토리
  path.join(DOCUMENTS_DIR, 'base'),
  path.join(DOCUMENTS_DIR, 'advanced'),
  path.join(DOCUMENTS_DIR, 'custom'),

  // 로그 디렉토리
  path.join(LOGS_DIR, 'failures'),
  path.join(LOGS_DIR, 'improvements'),
  path.join(LOGS_DIR, 'analysis'),
  path.join(LOGS_DIR, 'interactions'),
  path.join(LOGS_DIR, 'patterns'),
  path.join(LOGS_DIR, 'summaries'),
  path.join(LOGS_DIR, 'backups'),
];

// 샘플 컨텍스트 파일들
const SAMPLE_FILES = {
  // Base 컨텍스트
  [path.join(DOCUMENTS_DIR, 'base', 'troubleshooting.md')]:
    `# 서버 트러블슈팅 가이드

## 일반적인 서버 문제 해결

### CPU 사용률 높음
- 프로세스 확인: \`top\`, \`htop\` 명령어 사용
- 리소스 집약적 프로세스 식별
- 필요시 프로세스 재시작 또는 종료

### 메모리 부족
- 메모리 사용량 확인: \`free -h\`, \`vmstat\`
- 메모리 누수 프로세스 식별
- 스왑 사용량 모니터링

### 디스크 공간 부족
- 디스크 사용량 확인: \`df -h\`
- 큰 파일 찾기: \`du -sh /*\`
- 로그 파일 정리 및 압축

### 네트워크 연결 문제
- 네트워크 상태 확인: \`netstat -tuln\`
- 포트 연결 테스트: \`telnet\`, \`nc\`
- 방화벽 설정 확인

## 모니터링 도구
- Nagios, Zabbix, Prometheus
- 로그 분석: ELK Stack
- 성능 모니터링: Grafana
`,

  [path.join(DOCUMENTS_DIR, 'base', 'server-commands.md')]: `# 서버 관리 명령어

## 시스템 정보
- \`uname -a\`: 시스템 정보
- \`lscpu\`: CPU 정보
- \`lsmem\`: 메모리 정보
- \`lsblk\`: 블록 디바이스 정보

## 프로세스 관리
- \`ps aux\`: 실행 중인 프로세스
- \`kill -9 <PID>\`: 프로세스 강제 종료
- \`systemctl status <service>\`: 서비스 상태
- \`systemctl restart <service>\`: 서비스 재시작

## 로그 확인
- \`tail -f /var/log/syslog\`: 시스템 로그 실시간 확인
- \`journalctl -u <service>\`: 특정 서비스 로그
- \`dmesg\`: 커널 메시지

## 네트워크
- \`ping <host>\`: 연결 테스트
- \`wget <url>\`: 파일 다운로드
- \`curl -I <url>\`: HTTP 헤더 확인
`,

  // Advanced 컨텍스트
  [path.join(DOCUMENTS_DIR, 'advanced', 'patterns.json')]: JSON.stringify(
    {
      intentPatterns: {
        server_status: {
          patterns: [
            '서버.*상태',
            '서버.*확인',
            '시스템.*상태',
            '서비스.*상태',
          ],
          confidence: 0.9,
          examples: [
            '서버 상태를 확인해주세요',
            '시스템 상태가 어떤가요?',
            '서비스 상태 확인',
          ],
        },
        performance_check: {
          patterns: [
            'cpu.*사용률',
            '메모리.*사용량',
            '디스크.*용량',
            '성능.*확인',
          ],
          confidence: 0.85,
          examples: [
            'CPU 사용률이 높아요',
            '메모리 사용량 확인',
            '디스크 용량 부족',
          ],
        },
        error_analysis: {
          patterns: ['에러.*분석', '오류.*해결', '문제.*진단', '장애.*원인'],
          confidence: 0.8,
          examples: [
            '에러 로그 분석해주세요',
            '오류 원인을 찾아주세요',
            '장애 진단 필요',
          ],
        },
      },
    },
    null,
    2
  ),

  [path.join(DOCUMENTS_DIR, 'advanced', 'failure-cases.md')]:
    `# 고급 장애 사례 분석

## 복합적 장애 상황

### 메모리 누수 + CPU 과부하
**증상:**
- 메모리 사용률 지속적 증가
- CPU 사용률 90% 이상 유지
- 응답 시간 급격히 증가

**해결 방법:**
1. 메모리 덤프 분석
2. 프로파일링 도구 사용
3. 애플리케이션 재시작
4. 코드 레벨 최적화

### 네트워크 분할 (Network Partition)
**증상:**
- 일부 서버 간 통신 불가
- 클러스터 상태 불일치
- 데이터 동기화 실패

**해결 방법:**
1. 네트워크 토폴로지 확인
2. 스위치/라우터 상태 점검
3. Split-brain 방지 설정
4. 수동 복구 절차 실행

### 디스크 I/O 병목
**증상:**
- 높은 iowait 시간
- 디스크 큐 길이 증가
- 애플리케이션 응답 지연

**해결 방법:**
1. iostat으로 I/O 패턴 분석
2. 디스크 사용량 최적화
3. SSD 업그레이드 고려
4. 캐싱 전략 개선
`,

  // Custom 샘플 (ACME 회사용)
  [path.join(DOCUMENTS_DIR, 'custom', 'acme', 'acme-server-guides.md')]:
    `# ACME 회사 서버 관리 가이드

## ACME 특화 설정

### 애플리케이션 서버
- **포트:** 8080, 8443
- **로그 위치:** /opt/acme/logs/
- **설정 파일:** /etc/acme/app.conf

### 데이터베이스 서버
- **타입:** PostgreSQL 13
- **포트:** 5432
- **백업 위치:** /backup/db/

### 모니터링 설정
- **Grafana:** http://monitor.acme.com:3000
- **알림 채널:** #ops-alerts (Slack)
- **임계값:**
  - CPU: 80%
  - Memory: 85%
  - Disk: 90%

## 비상 연락처
- **운영팀:** ops@acme.com
- **개발팀:** dev@acme.com
- **인프라팀:** infra@acme.com
`,

  // 로그 샘플
  [path.join(LOGS_DIR, 'summaries', 'summary-intent-analysis.json')]:
    JSON.stringify(
      {
        metadata: {
          type: 'summary_log',
          summaryType: 'intent-analysis',
          savedAt: new Date().toISOString(),
          version: '1.0.0',
        },
        data: {
          totalQueries: 1250,
          classifiedQueries: 1100,
          unclassifiedQueries: 150,
          topIntents: [
            { intent: 'server_status', count: 450, percentage: 36 },
            { intent: 'performance_check', count: 320, percentage: 25.6 },
            { intent: 'error_analysis', count: 230, percentage: 18.4 },
            { intent: 'general_inquiry', count: 100, percentage: 8 },
          ],
          improvementSuggestions: [
            '미분류 질의에 대한 새로운 인텐트 패턴 추가 필요',
            'server_status 인텐트의 세분화 고려',
            '성능 관련 질의의 자동 분류 정확도 개선',
          ],
        },
      },
      null,
      2
    ),
};

/**
 * 디렉토리 생성
 */
function createDirectories() {
  console.log('📁 디렉토리 구조 생성 중...');

  DIRECTORIES.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`✅ 생성: ${dir}`);
    } else {
      console.log(`⏭️  이미 존재: ${dir}`);
    }
  });
}

/**
 * 샘플 파일 생성
 */
function createSampleFiles() {
  console.log('\n📄 샘플 파일 생성 중...');

  Object.entries(SAMPLE_FILES).forEach(([filePath, content]) => {
    // 파일의 디렉토리가 존재하는지 확인
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, content, 'utf-8');
      console.log(`✅ 생성: ${filePath}`);
    } else {
      console.log(`⏭️  이미 존재: ${filePath}`);
    }
  });
}

/**
 * .gitkeep 파일 생성 (빈 디렉토리 유지용)
 */
function createGitkeepFiles() {
  console.log('\n📌 .gitkeep 파일 생성 중...');

  const emptyDirs = [
    path.join(LOGS_DIR, 'failures'),
    path.join(LOGS_DIR, 'improvements'),
    path.join(LOGS_DIR, 'analysis'),
    path.join(LOGS_DIR, 'interactions'),
    path.join(LOGS_DIR, 'patterns'),
    path.join(LOGS_DIR, 'backups'),
  ];

  emptyDirs.forEach(dir => {
    const gitkeepPath = path.join(dir, '.gitkeep');
    if (!fs.existsSync(gitkeepPath)) {
      fs.writeFileSync(gitkeepPath, '', 'utf-8');
      console.log(`✅ 생성: ${gitkeepPath}`);
    }
  });
}

/**
 * README 파일 생성
 */
function createReadme() {
  const readmePath = path.join(DOCUMENTS_DIR, 'README.md');
  const readmeContent = `# AI 컨텍스트 관리 시스템

이 디렉토리는 AI 에이전트의 컨텍스트 문서들을 관리합니다.

## 디렉토리 구조

### \`base/\`
기본 서버 관리 지식과 트러블슈팅 가이드가 포함됩니다.
- \`troubleshooting.md\`: 일반적인 서버 문제 해결 방법
- \`server-commands.md\`: 자주 사용하는 서버 관리 명령어

### \`advanced/\`
고급 패턴 분석과 복잡한 장애 사례가 포함됩니다.
- \`patterns.json\`: 인텐트 분류를 위한 패턴 정의
- \`failure-cases.md\`: 복합적 장애 상황과 해결 방법

### \`custom/\`
클라이언트별 특화된 컨텍스트가 포함됩니다.
- \`<client-id>/\`: 각 클라이언트별 전용 디렉토리

## 버전 관리

- 각 타입별로 버전 디렉토리 생성 가능 (예: \`base-v1.1/\`)
- Git을 통한 변경 이력 추적
- 자동 백업 및 롤백 기능

## 사용 방법

1. 관리자 페이지에서 컨텍스트 문서 편집
2. 버전 생성 및 전환
3. 통합 컨텍스트 로드 및 테스트
4. AI 에이전트에 적용

## 주의사항

- 파일은 UTF-8 인코딩으로 저장
- 마크다운 형식 권장 (.md)
- JSON 파일은 유효한 형식 유지
- 백업 파일은 자동 생성됨
`;

  if (!fs.existsSync(readmePath)) {
    fs.writeFileSync(readmePath, readmeContent, 'utf-8');
    console.log(`✅ 생성: ${readmePath}`);
  }
}

/**
 * 메인 실행 함수
 */
function main() {
  console.log('🚀 AI 컨텍스트 관리 시스템 초기화 시작\n');

  try {
    createDirectories();
    createSampleFiles();
    createGitkeepFiles();
    createReadme();

    console.log('\n🎉 초기화 완료!');
    console.log('\n📋 생성된 구조:');
    console.log(`📁 ${DOCUMENTS_DIR}`);
    console.log('├── base/');
    console.log('│   ├── troubleshooting.md');
    console.log('│   └── server-commands.md');
    console.log('├── advanced/');
    console.log('│   ├── patterns.json');
    console.log('│   └── failure-cases.md');
    console.log('├── custom/');
    console.log('│   └── acme/');
    console.log('│       └── acme-server-guides.md');
    console.log('└── README.md');
    console.log('');
    console.log(`📁 ${LOGS_DIR}`);
    console.log('├── failures/');
    console.log('├── improvements/');
    console.log('├── analysis/');
    console.log('├── interactions/');
    console.log('├── patterns/');
    console.log('├── summaries/');
    console.log('│   └── summary-intent-analysis.json');
    console.log('└── backups/');
    console.log('');
    console.log('💡 다음 단계:');
    console.log('1. npm run dev로 개발 서버 시작');
    console.log('2. http://localhost:3000/admin/ai-analysis 접속');
    console.log('3. "컨텍스트 관리" 탭에서 파일 확인');
    console.log('4. 필요에 따라 컨텍스트 수정 및 버전 관리');
  } catch (error) {
    console.error('❌ 초기화 실패:', error);
    process.exit(1);
  }
}

// 스크립트 실행
if (require.main === module) {
  main();
}

module.exports = {
  createDirectories,
  createSampleFiles,
  createGitkeepFiles,
  createReadme,
};
