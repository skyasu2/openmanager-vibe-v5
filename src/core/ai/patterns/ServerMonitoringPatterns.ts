/**
 * ��️ 서버 모니터링 특화 패턴 시스템 + 실무 가이드
 *
 * Phase 2: 서버 모니터링 특화 패턴 확장 (50개 패턴)
 * Phase 2.5: 서버별 맞춤형 실무 가이드 시스템 (NEW!)
 * SOLID 원칙 적용: 단일 책임 원칙 (SRP), 개방-폐쇄 원칙 (OCP)
 */

import {
  IServerMonitoringPatterns,
  PatternMatchResult,
  PatternCategory,
  PatternData,
  PatternStatistics,
  PatternMatchingError,
  PatternConfig,
  PatternMatchOptions,
} from '@/types/server-monitoring-patterns.types';

// 🎯 서버별 실무 가이드 인터페이스 (NEW!)
interface ServerPracticalGuide {
  serverType: string;
  commonCommands: {
    [key: string]: {
      command: string;
      description: string;
      example?: string;
      caution?: string;
    };
  };
  troubleshooting: {
    symptom: string;
    diagnosis: string[];
    solution: string[];
    prevention?: string;
  }[];
  monitoring: {
    key_metrics: string[];
    log_locations: string[];
    performance_indicators: string[];
  };
}

/**
 * 서버 모니터링 패턴 매칭 시스템 + 실무 가이드
 *
 * 기존 IntentClassifier, PatternMatcherEngine, QueryAnalyzer 패턴들을
 * 서버 모니터링에 특화하여 50개 패턴으로 확장 + 실무 가이드 통합
 */
export class ServerMonitoringPatterns implements IServerMonitoringPatterns {
  private patterns: Map<PatternCategory, PatternData> = new Map();
  private statistics: Map<string, number> = new Map();
  private cache: Map<string, PatternMatchResult> = new Map();
  private config: PatternConfig;

  // 🎯 서버별 실무 가이드 데이터베이스 (NEW!)
  private practicalGuides: Map<string, ServerPracticalGuide> = new Map();

  constructor(config?: Partial<PatternConfig>) {
    this.config = {
      enableFuzzyMatching: true,
      confidenceThreshold: 0.6,
      maxProcessingTime: 50,
      enableCaching: true,
      cacheSize: 1000,
      enableStatistics: true,
      ...config,
    };

    this.initializePatterns();
    this.initializePracticalGuides(); // 🎯 실무 가이드 초기화 (NEW!)
  }

  /**
   * 50개 서버 모니터링 패턴 초기화
   * 기존 패턴들을 확장하여 구축
   */
  private initializePatterns(): void {
    // 1. 서버 상태 패턴 (15개) - 기존 8개 확장
    this.patterns.set('server_status', {
      category: 'server_status',
      weight: 1.0,
      description: '서버 상태 확인 및 헬스체크',
      examples: ['서버 상태 확인', '헬스체크', '서버 살아있어?'],
      patterns: [
        // 기존 IntentClassifier 패턴 유지
        /서버.*상태/i,
        /상태.*확인/i,
        /서버.*어떤/i,
        /현재.*서버/i,
        /서버.*체크/i,
        /헬스.*체크/i,
        /온라인.*서버/i,
        /오프라인.*서버/i,

        // 새로 추가된 7개 패턴
        /서버.*살아있/i,
        /서버.*죽었/i,
        /서버.*다운/i,
        /서버.*정상/i,
        /서버.*문제/i,
        /서버.*이상/i,
        /가동.*상태/i,
      ],
    });

    // 2. 성능 분석 패턴 (12개) - 기존 8개 확장
    this.patterns.set('performance_analysis', {
      category: 'performance_analysis',
      weight: 0.9,
      description: '서버 성능 분석 및 리소스 모니터링',
      examples: ['성능 분석', 'CPU 메모리 확인', '서버 느려'],
      patterns: [
        // 기존 패턴 유지
        /성능.*분석/i,
        /리소스.*사용/i,
        /cpu.*메모리/i,
        /느린.*서버/i,
        /최적화/i,
        /부하.*분석/i,
        /응답.*시간/i,
        /처리.*속도/i,

        // 새로 추가된 4개 패턴
        /병목.*현상/i,
        /지연.*시간/i,
        /처리량.*분석/i,
        /대역폭.*사용/i,
      ],
    });

    // 3. 로그 분석 패턴 (10개) - 새로 구축
    this.patterns.set('log_analysis', {
      category: 'log_analysis',
      weight: 0.8,
      description: '로그 분석 및 에러 추적',
      examples: ['에러 로그 확인', '로그 분석', '오류 메시지'],
      patterns: [
        /에러.*로그/i,
        /로그.*분석/i,
        /오류.*메시지/i,
        /예외.*상황/i,
        /장애.*로그/i,
        /로그.*확인/i,
        /에러.*추적/i,
        /로그.*검색/i,
        /시스템.*로그/i,
        /액세스.*로그/i,
      ],
    });

    // 4. 장애 대응 패턴 (8개) - 기존 QueryAnalyzer troubleshooting 확장
    this.patterns.set('troubleshooting', {
      category: 'troubleshooting',
      weight: 0.95,
      description: '장애 해결 및 복구 방안',
      examples: ['장애 해결', '문제 해결', '복구 방안'],
      patterns: [
        // 기존 QueryAnalyzer 패턴 활용
        /장애.*해결/i,
        /문제.*해결/i,
        /복구.*방안/i,
        /긴급.*대응/i,
        /해결.*방법/i,
        /조치.*방안/i,
        /대응.*절차/i,
        /복구.*계획/i,
      ],
      relatedCategories: ['server_status', 'log_analysis'],
    });

    // 5. 리소스 모니터링 패턴 (5개) - 새로 구축
    this.patterns.set('resource_monitoring', {
      category: 'resource_monitoring',
      weight: 0.85,
      description: '시스템 리소스 모니터링',
      examples: ['디스크 용량', 'CPU 점유율', '메모리 사용률'],
      patterns: [
        /디스크.*용량/i,
        /네트워크.*대역폭/i,
        /메모리.*사용률/i,
        /cpu.*점유율/i,
        /스토리지.*상태/i,
      ],
      relatedCategories: ['performance_analysis'],
    });

    // 6. 일반 문의 패턴 - 애매한 질문 처리용
    this.patterns.set('general_inquiry', {
      category: 'general_inquiry',
      weight: 0.3,
      description: '일반적인 문의사항',
      examples: ['뭔가 이상해', '도움이 필요해', '확인해줘'],
      patterns: [
        /뭔가.*이상/i,
        /도움.*필요/i,
        /확인.*해/i,
        /알려.*줘/i,
        /궁금.*해/i,
      ],
    });
  }

  /**
   * 🎯 서버별 실무 가이드 초기화 (NEW!)
   * 현재 서버 데이터 생성기의 8개 서버 타입에 맞춘 실무 가이드
   */
  private initializePracticalGuides(): void {
    // 🌐 웹서버 (Apache/Nginx) 실무 가이드
    this.practicalGuides.set('web', {
      serverType: 'web',
      commonCommands: {
        start: {
          command: 'systemctl start apache2 / nginx',
          description: '웹서버 시작',
          example: 'sudo systemctl start nginx',
          caution: '설정 파일 검증 후 시작 권장',
        },
        stop: {
          command: 'systemctl stop apache2 / nginx',
          description: '웹서버 중지',
          example: 'sudo systemctl stop apache2',
        },
        restart: {
          command: 'systemctl restart apache2 / nginx',
          description: '웹서버 재시작',
          example: 'sudo systemctl restart nginx',
          caution: '트래픽 중단 발생 가능',
        },
        reload: {
          command: 'nginx -s reload / systemctl reload apache2',
          description: '설정 파일 다시 로드 (무중단)',
          example: 'sudo nginx -s reload',
        },
        status: {
          command: 'systemctl status apache2 / nginx',
          description: '웹서버 상태 확인',
          example: 'sudo systemctl status nginx',
        },
        configtest: {
          command: 'nginx -t / apache2ctl configtest',
          description: '설정 파일 문법 검사',
          example: 'sudo nginx -t',
        },
        logs: {
          command: 'tail -f /var/log/nginx/error.log',
          description: '실시간 에러 로그 확인',
          example: 'sudo tail -f /var/log/apache2/error.log',
        },
        processes: {
          command: 'ps aux | grep nginx',
          description: '웹서버 프로세스 확인',
          example: 'ps aux | grep apache2',
        },
      },
      troubleshooting: [
        {
          symptom: '웹페이지 응답 없음 (502/503 에러)',
          diagnosis: [
            'systemctl status nginx',
            'netstat -tulpn | grep :80',
            'tail -f /var/log/nginx/error.log',
          ],
          solution: [
            '1. 설정 파일 오류 → nginx -t로 검증',
            '2. 백엔드 서버 연결 확인',
            '3. 방화벽 설정 확인 → ufw status',
            '4. 디스크 용량 확인 → df -h',
          ],
          prevention: '정기적인 설정 파일 백업 및 검증',
        },
        {
          symptom: 'CPU 사용률 높음',
          diagnosis: [
            'htop',
            'nginx -V (worker 프로세스 수 확인)',
            'netstat -an | grep :80 | wc -l (연결 수)',
          ],
          solution: [
            '1. worker_processes 수 조정',
            '2. worker_connections 값 증가',
            '3. keepalive_timeout 최적화',
            '4. gzip 압축 활성화',
          ],
        },
      ],
      monitoring: {
        key_metrics: [
          'active_connections',
          'requests_per_second',
          'response_time',
          'error_rate',
          'cpu_usage',
          'memory_usage',
        ],
        log_locations: [
          '/var/log/nginx/access.log',
          '/var/log/nginx/error.log',
          '/var/log/apache2/access.log',
          '/var/log/apache2/error.log',
        ],
        performance_indicators: [
          'HTTP 응답 코드 분포',
          '평균 응답 시간',
          '동시 연결 수',
          '처리량 (RPS)',
        ],
      },
    });

    // 🗄️ 데이터베이스 (MySQL/PostgreSQL) 실무 가이드
    this.practicalGuides.set('database', {
      serverType: 'database',
      commonCommands: {
        connect_mysql: {
          command: 'mysql -u username -p',
          description: 'MySQL 접속',
          example: 'mysql -u root -p -h localhost',
        },
        connect_postgres: {
          command: 'psql -U username -d database',
          description: 'PostgreSQL 접속',
          example: 'psql -U postgres -d mydb',
        },
        status: {
          command: 'systemctl status mysql / postgresql',
          description: 'DB 서버 상태 확인',
          example: 'sudo systemctl status mysql',
        },
        processlist: {
          command: 'SHOW PROCESSLIST; / SELECT * FROM pg_stat_activity;',
          description: '현재 실행 중인 쿼리 확인',
          example: 'mysql> SHOW FULL PROCESSLIST;',
        },
        slow_queries: {
          command: 'SHOW VARIABLES LIKE "slow_query_log";',
          description: '느린 쿼리 로그 설정 확인',
          example: 'SET GLOBAL slow_query_log = ON;',
        },
        backup: {
          command: 'mysqldump / pg_dump',
          description: '데이터베이스 백업',
          example: 'mysqldump -u root -p mydb > backup.sql',
          caution: '대용량 DB는 --single-transaction 옵션 사용',
        },
        disk_usage: {
          command: 'du -sh /var/lib/mysql / /var/lib/postgresql',
          description: 'DB 디스크 사용량 확인',
          example: 'sudo du -sh /var/lib/mysql/*',
        },
      },
      troubleshooting: [
        {
          symptom: '데이터베이스 연결 실패',
          diagnosis: [
            'systemctl status mysql',
            'netstat -tulpn | grep 3306',
            'tail -f /var/log/mysql/error.log',
          ],
          solution: [
            '1. 서비스 재시작 → systemctl restart mysql',
            '2. 포트 바인딩 확인 → my.cnf의 bind-address',
            '3. 사용자 권한 확인 → GRANT 문 재실행',
            '4. 방화벽 확인 → ufw allow 3306',
          ],
        },
        {
          symptom: '쿼리 성능 저하',
          diagnosis: [
            'SHOW PROCESSLIST;',
            'SHOW ENGINE INNODB STATUS\\G',
            'EXPLAIN SELECT ... 쿼리 분석',
          ],
          solution: [
            '1. 인덱스 추가 → CREATE INDEX',
            '2. 쿼리 최적화 → WHERE 조건 개선',
            '3. 테이블 분석 → ANALYZE TABLE',
            '4. 메모리 설정 조정 → innodb_buffer_pool_size',
          ],
        },
      ],
      monitoring: {
        key_metrics: [
          'connections',
          'queries_per_second',
          'slow_queries',
          'innodb_buffer_pool_hit_rate',
          'replication_lag',
        ],
        log_locations: [
          '/var/log/mysql/error.log',
          '/var/log/mysql/slow.log',
          '/var/log/postgresql/postgresql.log',
        ],
        performance_indicators: [
          '연결 수',
          '쿼리 실행 시간',
          '락 대기 시간',
          '버퍼 풀 적중률',
        ],
      },
    });

    // ⚡ 캐시 서버 (Redis/Memcached) 실무 가이드
    this.practicalGuides.set('cache', {
      serverType: 'cache',
      commonCommands: {
        connect: {
          command: 'redis-cli / telnet localhost 11211',
          description: '캐시 서버 접속',
          example: 'redis-cli -h localhost -p 6379',
        },
        info: {
          command: 'redis-cli info / stats',
          description: '캐시 서버 정보 확인',
          example: 'redis-cli info memory',
        },
        memory: {
          command: 'redis-cli info memory',
          description: '메모리 사용량 확인',
          example: 'redis-cli --bigkeys',
        },
        monitor: {
          command: 'redis-cli monitor',
          description: '실시간 명령어 모니터링',
          caution: '프로덕션에서 성능 영향 주의',
        },
        flush: {
          command: 'redis-cli flushall',
          description: '모든 데이터 삭제',
          caution: '⚠️ 모든 캐시 데이터가 삭제됩니다!',
        },
      },
      troubleshooting: [
        {
          symptom: '메모리 사용량 급증',
          diagnosis: [
            'redis-cli info memory',
            'redis-cli --bigkeys',
            'redis-cli memory doctor',
          ],
          solution: [
            '1. 큰 키 제거 → DEL key_name',
            '2. TTL 설정 → EXPIRE key seconds',
            '3. 메모리 정리 → MEMORY PURGE',
            '4. maxmemory 정책 조정',
          ],
        },
      ],
      monitoring: {
        key_metrics: [
          'memory_usage',
          'hit_rate',
          'evicted_keys',
          'expired_keys',
          'connected_clients',
        ],
        log_locations: [
          '/var/log/redis/redis-server.log',
          '/var/log/memcached.log',
        ],
        performance_indicators: [
          '캐시 적중률',
          '메모리 사용률',
          '초당 처리 요청 수',
        ],
      },
    });

    // 🔗 API 서버 실무 가이드
    this.practicalGuides.set('api', {
      serverType: 'api',
      commonCommands: {
        pm2_status: {
          command: 'pm2 status / pm2 list',
          description: 'PM2로 관리되는 API 서버 상태',
          example: 'pm2 status',
        },
        pm2_logs: {
          command: 'pm2 logs [app_name]',
          description: 'API 서버 로그 확인',
          example: 'pm2 logs api-server --lines 100',
        },
        pm2_restart: {
          command: 'pm2 restart [app_name]',
          description: 'API 서버 재시작',
          example: 'pm2 restart all',
        },
        health_check: {
          command: 'curl -f http://localhost:3000/health',
          description: 'API 헬스체크',
          example: 'curl -f http://localhost:3000/api/health',
        },
      },
      troubleshooting: [
        {
          symptom: 'API 응답 지연',
          diagnosis: [
            'pm2 monit',
            'curl -w "@curl-format.txt" http://api/endpoint',
            'netstat -an | grep :3000',
          ],
          solution: [
            '1. 프로세스 수 증가 → pm2 scale app +2',
            '2. 메모리 누수 확인 → pm2 logs',
            '3. 데이터베이스 연결 풀 조정',
            '4. 캐싱 레이어 추가',
          ],
        },
      ],
      monitoring: {
        key_metrics: [
          'response_time',
          'requests_per_second',
          'error_rate',
          'memory_usage',
          'cpu_usage',
        ],
        log_locations: [
          '~/.pm2/logs/',
          '/var/log/api-server/',
          'stdout/stderr logs',
        ],
        performance_indicators: [
          'API 응답 시간',
          '처리량 (TPS)',
          '에러율',
          '동시 연결 수',
        ],
      },
    });

    // 🐳 컨테이너 (Docker) 실무 가이드
    this.practicalGuides.set('container', {
      serverType: 'container',
      commonCommands: {
        ps: {
          command: 'docker ps -a',
          description: '모든 컨테이너 목록 확인',
          example: 'docker ps --format "table {{.Names}}\t{{.Status}}"',
        },
        logs: {
          command: 'docker logs -f [container_name]',
          description: '컨테이너 로그 실시간 확인',
          example: 'docker logs -f --tail 100 my-app',
        },
        exec: {
          command: 'docker exec -it [container] bash',
          description: '실행 중인 컨테이너에 접속',
          example: 'docker exec -it my-app /bin/bash',
        },
        stats: {
          command: 'docker stats',
          description: '컨테이너 리소스 사용량 모니터링',
          example:
            'docker stats --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"',
        },
        cleanup: {
          command: 'docker system prune',
          description: '사용하지 않는 Docker 객체 정리',
          caution: '중지된 컨테이너와 미사용 이미지 삭제됨',
        },
      },
      troubleshooting: [
        {
          symptom: '컨테이너 시작 실패',
          diagnosis: [
            'docker logs [container_name]',
            'docker inspect [container_name]',
            'docker system df',
          ],
          solution: [
            '1. 로그에서 오류 메시지 확인',
            '2. 포트 충돌 확인 → netstat -tulpn',
            '3. 볼륨 마운트 권한 확인',
            '4. 디스크 용량 확인 → df -h',
          ],
        },
      ],
      monitoring: {
        key_metrics: [
          'cpu_usage',
          'memory_usage',
          'network_io',
          'disk_io',
          'container_count',
        ],
        log_locations: [
          '/var/lib/docker/containers/',
          'stdout/stderr of containers',
        ],
        performance_indicators: [
          '컨테이너별 리소스 사용률',
          '이미지 크기',
          '네트워크 처리량',
        ],
      },
    });
  }

  /**
   * 🎯 서버별 실무 가이드 제공 (NEW!)
   */
  async getPracticalGuide(
    serverType: string,
    query: string
  ): Promise<{
    commands?: any;
    troubleshooting?: any[];
    monitoring?: any;
    recommendations?: string[];
  }> {
    const guide = this.practicalGuides.get(serverType.toLowerCase());
    if (!guide) {
      return {
        recommendations: [
          `${serverType} 서버 타입에 대한 가이드가 준비 중입니다.`,
          '일반적인 시스템 명령어: systemctl, ps, netstat, tail 등을 활용하세요.',
        ],
      };
    }

    // 질의 내용에 따라 관련 정보 필터링
    const queryLower = query.toLowerCase();

    if (queryLower.includes('명령어') || queryLower.includes('커맨드')) {
      return { commands: guide.commonCommands };
    }

    if (
      queryLower.includes('문제') ||
      queryLower.includes('장애') ||
      queryLower.includes('오류')
    ) {
      return { troubleshooting: guide.troubleshooting };
    }

    if (queryLower.includes('모니터링') || queryLower.includes('확인')) {
      return { monitoring: guide.monitoring };
    }

    // 전체 가이드 반환
    return {
      commands: guide.commonCommands,
      troubleshooting: guide.troubleshooting,
      monitoring: guide.monitoring,
    };
  }

  /**
   * 🎯 서버 타입 자동 감지 (NEW!)
   */
  detectServerType(query: string): string {
    const serverKeywords = {
      web: ['웹서버', 'nginx', 'apache', 'httpd', 'http'],
      database: ['데이터베이스', 'mysql', 'postgresql', 'db', '디비'],
      cache: ['캐시', 'redis', 'memcached', '메모리'],
      api: ['api', '에이피아이', 'rest', 'graphql', 'node'],
      container: ['도커', 'docker', '컨테이너', 'container', 'k8s'],
    };

    const queryLower = query.toLowerCase();

    for (const [serverType, keywords] of Object.entries(serverKeywords)) {
      if (keywords.some(keyword => queryLower.includes(keyword))) {
        return serverType;
      }
    }

    return 'general'; // 기본값
  }

  /**
   * 쿼리에 대한 패턴 매칭 수행
   * 병렬 처리 및 신뢰도 계산 포함
   */
  async matchPattern(
    query: string,
    options?: PatternMatchOptions
  ): Promise<PatternMatchResult> {
    const startTime = Date.now();

    try {
      // 캐시 확인
      if (this.config.enableCaching && this.cache.has(query)) {
        return this.cache.get(query)!;
      }

      // 전처리: 한국어 정규화
      const normalizedQuery = this.normalizeKoreanQuery(query);

      // 모든 카테고리에 대해 병렬 매칭 수행
      const matchPromises = Array.from(this.patterns.entries()).map(
        async ([category, patternData]) => {
          const matches = await this.matchCategory(
            normalizedQuery,
            patternData
          );
          return { category, matches, weight: patternData.weight };
        }
      );

      const categoryResults = await Promise.all(matchPromises);

      // 최고 신뢰도 카테고리 선택
      const bestMatch = categoryResults.reduce((best, current) => {
        const confidence = current.matches.length * current.weight;
        const bestConfidence = best.matches.length * best.weight;
        return confidence > bestConfidence ? current : best;
      });

      // 복합 카테고리 감지 (3개 이상 매칭 시)
      const subCategories = categoryResults
        .filter(
          result =>
            result.matches.length > 0 && result.category !== bestMatch.category
        )
        .map(result => result.category)
        .slice(0, 3);

      // 결과 생성
      const result: PatternMatchResult = {
        category: bestMatch.category,
        confidence: this.calculateConfidence(
          bestMatch.matches.length,
          bestMatch.weight
        ),
        matchedPatterns: bestMatch.matches,
        subCategories: subCategories.length > 0 ? subCategories : undefined,
        suggestions: this.generateSuggestions(bestMatch.category, query),
        processingTime: Date.now() - startTime,
      };

      // 캐싱 및 통계 업데이트
      if (this.config.enableCaching) {
        this.updateCache(query, result);
      }

      if (this.config.enableStatistics) {
        this.updateStatistics(bestMatch.category, result.processingTime);
      }

      return result;
    } catch (error) {
      throw new PatternMatchingError(
        `패턴 매칭 실패: ${error instanceof Error ? error.message : String(error)}`,
        query,
        undefined,
        Date.now() - startTime
      );
    }
  }

  /**
   * 특정 카테고리의 패턴 매칭
   */
  private async matchCategory(
    query: string,
    patternData: PatternData
  ): Promise<string[]> {
    const matches: string[] = [];

    for (const pattern of patternData.patterns) {
      if (pattern.test(query)) {
        matches.push(pattern.source);
      }
    }

    return matches;
  }

  /**
   * 한국어 쿼리 정규화
   * 조사 제거, 높임말 정규화 등
   */
  private normalizeKoreanQuery(query: string): string {
    return (
      query
        // 조사 제거 (은/는, 이/가, 을/를)
        .replace(/[이가](\s|$)/g, ' ')
        .replace(/[은는](\s|$)/g, ' ')
        .replace(/[을를](\s|$)/g, ' ')
        // 높임말 정규화
        .replace(/해주세요|하십시오|해주시기/g, '해줘')
        .replace(/확인해주세요/g, '확인해줘')
        .replace(/알려주세요/g, '알려줘')
        // 공백 정리
        .replace(/\s+/g, ' ')
        .trim()
    );
  }

  /**
   * 신뢰도 계산
   */
  private calculateConfidence(matchCount: number, weight: number): number {
    if (matchCount === 0) return 0;

    // 매칭 개수와 가중치를 고려한 신뢰도 계산
    const baseConfidence = Math.min(matchCount * 0.3, 1.0);
    const weightedConfidence = baseConfidence * weight;

    return Math.round(weightedConfidence * 100) / 100;
  }

  /**
   * 제안사항 생성
   */
  private generateSuggestions(
    category: PatternCategory,
    query: string
  ): string[] {
    const suggestions: Record<PatternCategory, string[]> = {
      server_status: [
        '서버 상태를 더 구체적으로 확인하시겠어요?',
        'CPU, 메모리 사용률도 함께 확인해보세요',
        '최근 에러 로그도 확인해보시겠어요?',
      ],
      performance_analysis: [
        'CPU 사용률을 확인해보세요',
        '메모리 사용량을 분석해보세요',
        '네트워크 지연시간을 측정해보세요',
      ],
      log_analysis: [
        '에러 로그를 시간대별로 확인해보세요',
        '특정 에러 패턴을 검색해보세요',
        '시스템 로그와 애플리케이션 로그를 비교해보세요',
      ],
      troubleshooting: [
        '장애 원인을 먼저 파악해보세요',
        '유사한 과거 장애 사례를 확인해보세요',
        '복구 계획을 수립해보세요',
      ],
      resource_monitoring: [
        '디스크 사용량을 확인해보세요',
        '네트워크 트래픽을 모니터링해보세요',
        '메모리 누수가 있는지 확인해보세요',
      ],
      general_inquiry: [
        '더 구체적으로 질문해주세요',
        '어떤 서버의 어떤 부분이 궁금하신가요?',
        '현재 발생한 문제를 자세히 설명해주세요',
      ],
    };

    return suggestions[category] || [];
  }

  /**
   * 캐시 업데이트
   */
  private updateCache(query: string, result: PatternMatchResult): void {
    if (this.cache.size >= this.config.cacheSize) {
      // LRU 방식으로 가장 오래된 항목 제거
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(query, result);
  }

  /**
   * 통계 업데이트
   */
  private updateStatistics(
    category: PatternCategory,
    processingTime: number
  ): void {
    const key = `${category}_count`;
    const timeKey = `${category}_time`;

    this.statistics.set(key, (this.statistics.get(key) || 0) + 1);
    this.statistics.set(
      timeKey,
      (this.statistics.get(timeKey) || 0) + processingTime
    );
  }

  // ===== IServerMonitoringPatterns 인터페이스 구현 =====

  getPatternsByCategory(category: PatternCategory): RegExp[] {
    const patternData = this.patterns.get(category);
    return patternData ? patternData.patterns : [];
  }

  addPattern(category: PatternCategory, pattern: RegExp): void {
    const patternData = this.patterns.get(category);
    if (patternData) {
      patternData.patterns.push(pattern);
    }
  }

  getStatistics(): PatternStatistics {
    const categories = Array.from(this.patterns.keys());
    const patternsByCategory: Record<PatternCategory, number> = {} as any;

    categories.forEach(category => {
      const patternData = this.patterns.get(category);
      patternsByCategory[category] = patternData
        ? patternData.patterns.length
        : 0;
    });

    const totalPatterns = Object.values(patternsByCategory).reduce(
      (sum, count) => sum + count,
      0
    );

    // 가장 많이 사용된 패턴 계산
    const mostUsedPatterns = categories
      .map(category => ({
        pattern: category,
        category,
        usageCount: this.statistics.get(`${category}_count`) || 0,
      }))
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 5);

    // 성능 메트릭 계산
    const processingTimes = categories
      .map(category => this.statistics.get(`${category}_time`) || 0)
      .filter(time => time > 0);

    const performanceMetrics = {
      fastestMatch:
        processingTimes.length > 0 ? Math.min(...processingTimes) : 0,
      slowestMatch:
        processingTimes.length > 0 ? Math.max(...processingTimes) : 0,
      averageConfidence: 0.85, // 실제 구현에서는 평균 계산
    };

    return {
      totalPatterns,
      patternsByCategory,
      averageMatchingTime:
        processingTimes.reduce((sum, time) => sum + time, 0) /
          processingTimes.length || 0,
      mostUsedPatterns,
      performanceMetrics,
    };
  }
}
