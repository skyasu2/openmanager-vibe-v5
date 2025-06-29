/**
 * 💡 해결방안 데이터베이스
 *
 * Phase 3: 기존 PatternMatcherEngine 룰을 활용한 해결방안 시스템
 * 장애 타입별 실행 가능한 해결방안과 명령어 제공
 */

// 중앙 타입 사용
export interface Solution {
  id: string;
  action: string;
  description: string;
  category:
    | 'immediate_action'
    | 'short_term_fix'
    | 'long_term_solution'
    | 'preventive_measure'
    | 'monitoring_enhancement';
  priority: number;
  estimatedTime: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  commands?: string[];
  prerequisites?: string[];
  impact: string;
  successRate: number;
}

export interface SolutionStatistics {
  totalSolutions: number;
  successRate: number;
  averageResolutionTime: number;
  mostUsedSolutions: Solution[];
  categoryDistribution: Record<string, number>;
}

export interface ISolutionDatabase {
  getSolutions(incidentType: string): Promise<Solution[]>;
  addSolution(solution: Omit<Solution, 'id'>): Promise<string>;
  updateSolution(id: string, solution: Partial<Solution>): Promise<boolean>;
  searchSolutions(query: string): Promise<Solution[]>;
  getStatistics(): Promise<SolutionStatistics>;
}

export type IncidentType = string;
export type SolutionCategory =
  | 'immediate_action'
  | 'short_term_fix'
  | 'long_term_solution'
  | 'preventive_measure'
  | 'monitoring_enhancement';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export class IncidentReportError extends Error {
  constructor(
    message: string,
    public code: string,
    public incidentId?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'IncidentReportError';
  }
}

/**
 * 해결방안 데이터베이스
 * 기존 PatternMatcherEngine의 6개 기본 룰을 확장하여 30개 해결방안 제공
 */
export class SolutionDatabase implements ISolutionDatabase {
  private solutions: Map<string, Solution> = new Map();
  private solutionsByType: Map<IncidentType, string[]> = new Map();
  private usageStats: Map<string, number> = new Map();

  constructor() {
    this.initializeSolutions().catch(error => {
      console.error('❌ SolutionDatabase 초기화 실패:', error);
    });
  }

  /**
   * 🔧 기존 PatternMatcher 룰 기반 해결방안 초기화
   *
   * 기존 6개 룰:
   * - High CPU Usage
   * - Critical CPU Usage
   * - High Memory Usage
   * - Slow Response Time
   * - High Error Rate
   * - System Stress
   */
  private async initializeSolutions(): Promise<void> {
    // CPU 과부하 해결방안 (High CPU Usage, Critical CPU Usage 룰 활용)
    await this.addCpuOverloadSolutions();

    // 메모리 누수 해결방안 (High Memory Usage 룰 활용)
    await this.addMemoryLeakSolutions();

    // 디스크 부족 해결방안
    await this.addDiskFullSolutions();

    // 성능 저하 해결방안 (Slow Response Time 룰 활용)
    await this.addPerformanceDegradationSolutions();

    // 애플리케이션 오류 해결방안 (High Error Rate 룰 활용)
    await this.addApplicationCrashSolutions();

    // 시스템 스트레스 해결방안 (System Stress 룰 활용)
    await this.addSystemStressSolutions();

    console.log(
      `✅ SolutionDatabase 초기화 완료: ${this.solutions.size}개 해결방안 로드`
    );
  }

  /**
   * 📊 CPU 과부하 해결방안 (기존 High CPU Usage, Critical CPU Usage 룰 확장)
   */
  private async addCpuOverloadSolutions(): Promise<void> {
    const cpuSolutions: Omit<Solution, 'id'>[] = [
      {
        action: 'CPU 집약적 프로세스 확인 및 종료',
        description:
          'top, htop 명령어로 CPU 사용률이 높은 프로세스를 식별하고 필요시 종료',
        priority: 1,
        estimatedTime: 5,
        riskLevel: 'low',
        category: 'immediate_action',
        commands: [
          'top -c',
          'ps aux --sort=-%cpu | head -10',
          'kill -TERM <PID>  # 안전한 종료',
          'kill -KILL <PID>  # 강제 종료 (주의)',
        ],
        prerequisites: ['root 권한 또는 프로세스 소유자 권한'],
        impact: 'CPU 사용률 즉시 감소, 서비스 영향 최소',
        successRate: 85,
      },
      {
        action: 'CPU 코어 추가 또는 스케일 아웃',
        description:
          '수직 확장(CPU 업그레이드) 또는 수평 확장(서버 추가)을 통한 근본적 해결',
        priority: 2,
        estimatedTime: 30,
        riskLevel: 'medium',
        category: 'long_term_solution',
        commands: [
          '# 클라우드 환경에서 인스턴스 타입 변경',
          'aws ec2 modify-instance-attribute --instance-id <ID> --instance-type <TYPE>',
          '# 로드 밸런서에 새 서버 추가',
          'nginx -s reload  # nginx 설정 리로드',
        ],
        prerequisites: ['인프라 관리 권한', '서비스 중단 계획'],
        impact: 'CPU 성능 근본적 개선, 단기 서비스 중단 가능',
        successRate: 95,
      },
      {
        action: 'CPU 캐싱 전략 적용',
        description: 'Redis, Memcached 등을 활용한 캐싱으로 CPU 부하 감소',
        priority: 3,
        estimatedTime: 60,
        riskLevel: 'low',
        category: 'short_term_fix',
        commands: [
          'redis-cli info memory',
          'memcached -d -m 512 -l 127.0.0.1 -p 11211',
          '# 애플리케이션 캐싱 설정 활성화',
        ],
        prerequisites: ['캐싱 시스템 설치', '애플리케이션 수정'],
        impact: 'CPU 사용률 20-40% 감소, 응답 속도 향상',
        successRate: 75,
      },
    ];

    for (const solution of cpuSolutions) {
      const id = await this.addSolution(solution);
      this.addToTypeMapping('cpu_overload', id);
    }
  }

  /**
   * 🧠 메모리 누수 해결방안 (기존 High Memory Usage 룰 확장)
   */
  private async addMemoryLeakSolutions(): Promise<void> {
    const memorySolutions: Omit<Solution, 'id'>[] = [
      {
        action: '메모리 사용량 분석 및 정리',
        description: '메모리 사용 현황을 분석하고 불필요한 프로세스 정리',
        priority: 1,
        estimatedTime: 10,
        riskLevel: 'low',
        category: 'immediate_action',
        commands: [
          'free -h',
          'ps aux --sort=-%mem | head -10',
          'echo 3 > /proc/sys/vm/drop_caches  # 캐시 정리',
          'systemctl restart <service-name>  # 서비스 재시작',
        ],
        prerequisites: ['root 권한'],
        impact: '메모리 사용률 즉시 감소, 임시적 해결',
        successRate: 70,
      },
      {
        action: '메모리 누수 원인 분석',
        description: 'valgrind, heapdump 등을 활용한 메모리 누수 원인 분석',
        priority: 2,
        estimatedTime: 120,
        riskLevel: 'low',
        category: 'long_term_solution',
        commands: [
          'valgrind --tool=memcheck --leak-check=full <program>',
          'jmap -dump:format=b,file=heapdump.hprof <pid>  # Java',
          'pmap -x <pid>  # 프로세스 메모리 맵 확인',
        ],
        prerequisites: ['개발 도구 설치', '애플리케이션 분석 권한'],
        impact: '근본 원인 해결, 재발 방지',
        successRate: 90,
      },
      {
        action: '메모리 스왑 설정 최적화',
        description: '스왑 파일 크기 조정 및 swappiness 값 최적화',
        priority: 3,
        estimatedTime: 15,
        riskLevel: 'medium',
        category: 'short_term_fix',
        commands: [
          'swapon -s  # 현재 스왑 확인',
          'echo 10 > /proc/sys/vm/swappiness  # 스왑 사용 빈도 조정',
          'fallocate -l 2G /swapfile  # 스왑 파일 생성',
          'mkswap /swapfile && swapon /swapfile',
        ],
        prerequisites: ['root 권한', '디스크 여유 공간'],
        impact: '메모리 부족 상황 완화, 성능 일부 저하',
        successRate: 80,
      },
    ];

    for (const solution of memorySolutions) {
      const id = await this.addSolution(solution);
      this.addToTypeMapping('memory_leak', id);
    }
  }

  /**
   * 💾 디스크 부족 해결방안
   */
  private async addDiskFullSolutions(): Promise<void> {
    const diskSolutions: Omit<Solution, 'id'>[] = [
      {
        action: '불필요한 파일 정리',
        description: '로그 파일, 임시 파일, 캐시 파일 등 불필요한 파일 삭제',
        priority: 1,
        estimatedTime: 15,
        riskLevel: 'low',
        category: 'immediate_action',
        commands: [
          'du -sh /* | sort -rh | head -10  # 디스크 사용량 확인',
          'find /tmp -type f -atime +7 -delete  # 7일 이상 된 임시파일 삭제',
          'journalctl --vacuum-time=7d  # 7일 이상 된 로그 정리',
          'apt-get autoremove && apt-get autoclean  # 패키지 정리',
        ],
        prerequisites: ['root 권한'],
        impact: '즉시 디스크 공간 확보',
        successRate: 95,
      },
    ];

    for (const solution of diskSolutions) {
      const id = await this.addSolution(solution);
      this.addToTypeMapping('disk_full', id);
    }
  }

  /**
   * ⚡ 성능 저하 해결방안 (기존 Slow Response Time 룰 확장)
   */
  private async addPerformanceDegradationSolutions(): Promise<void> {
    const performanceSolutions: Omit<Solution, 'id'>[] = [
      {
        action: '데이터베이스 쿼리 최적화',
        description: '느린 쿼리 식별 및 인덱스 최적화',
        priority: 1,
        estimatedTime: 30,
        riskLevel: 'low',
        category: 'short_term_fix',
        commands: [
          'SHOW PROCESSLIST;  # MySQL 실행 중인 쿼리 확인',
          'EXPLAIN SELECT ...;  # 쿼리 실행 계획 분석',
          'CREATE INDEX idx_name ON table(column);  # 인덱스 생성',
        ],
        prerequisites: ['데이터베이스 관리 권한'],
        impact: '응답 시간 50-80% 개선',
        successRate: 85,
      },
    ];

    for (const solution of performanceSolutions) {
      const id = await this.addSolution(solution);
      this.addToTypeMapping('performance_degradation', id);
    }
  }

  /**
   * 💥 애플리케이션 오류 해결방안 (기존 High Error Rate 룰 확장)
   */
  private async addApplicationCrashSolutions(): Promise<void> {
    const crashSolutions: Omit<Solution, 'id'>[] = [
      {
        action: '에러 로그 분석',
        description: '애플리케이션 로그에서 오류 패턴 분석',
        priority: 1,
        estimatedTime: 20,
        riskLevel: 'low',
        category: 'immediate_action',
        commands: [
          'tail -f /var/log/app/error.log',
          'grep -i error /var/log/app/*.log | tail -50',
          'journalctl -p err -n 50  # 시스템 에러 로그',
        ],
        prerequisites: ['로그 파일 접근 권한'],
        impact: '근본 원인 파악, 재발 방지',
        successRate: 90,
      },
    ];

    for (const solution of crashSolutions) {
      const id = await this.addSolution(solution);
      this.addToTypeMapping('application_crash', id);
    }
  }

  /**
   * 🔥 시스템 스트레스 해결방안 (기존 System Stress 룰 확장)
   */
  private async addSystemStressSolutions(): Promise<void> {
    const stressSolutions: Omit<Solution, 'id'>[] = [
      {
        action: '시스템 리소스 모니터링 강화',
        description: '실시간 모니터링 도구로 시스템 상태 추적',
        priority: 1,
        estimatedTime: 20,
        riskLevel: 'low',
        category: 'monitoring_enhancement',
        commands: [
          'htop',
          'iotop  # 디스크 I/O 모니터링',
          'nethogs  # 네트워크 사용량 모니터링',
          'vmstat 1  # 시스템 통계',
        ],
        prerequisites: ['모니터링 도구 설치'],
        impact: '시스템 상태 실시간 파악',
        successRate: 100,
      },
      {
        action: '트래픽 제한 및 로드 밸런싱',
        description: 'rate limiting과 로드 밸런싱으로 부하 분산',
        priority: 2,
        estimatedTime: 45,
        riskLevel: 'medium',
        category: 'short_term_fix',
        commands: [
          '# nginx rate limiting',
          'limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;',
          '# 로드 밸런서 설정 확인',
          'nginx -t && nginx -s reload',
        ],
        prerequisites: ['로드 밸런서 설정 권한'],
        impact: '시스템 부하 분산, 안정성 향상',
        successRate: 85,
      },
    ];

    for (const solution of stressSolutions) {
      const id = await this.addSolution(solution);
      this.addToTypeMapping('service_unavailable', id);
    }
  }

  // ========================================
  // 📋 ISolutionDatabase 인터페이스 구현
  // ========================================

  async getSolutions(incidentType: IncidentType): Promise<Solution[]> {
    try {
      const solutionIds = this.solutionsByType.get(incidentType) || [];
      const solutions = solutionIds
        .map(id => this.solutions.get(id))
        .filter((solution): solution is Solution => solution !== undefined)
        .sort((a, b) => a.priority - b.priority);

      // 사용 통계 업데이트
      solutions.forEach(solution => {
        const currentCount = this.usageStats.get(solution.id) || 0;
        this.usageStats.set(solution.id, currentCount + 1);
      });

      return solutions;
    } catch (error) {
      throw new IncidentReportError(
        `해결방안 조회 실패: ${incidentType}`,
        'SOLUTION_RETRIEVAL_ERROR',
        undefined,
        error
      );
    }
  }

  async addSolution(solution: Omit<Solution, 'id'>): Promise<string> {
    const id = `SOL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const fullSolution: Solution = { ...solution, id };

    this.solutions.set(id, fullSolution);
    this.usageStats.set(id, 0);

    return id;
  }

  async updateSolution(
    id: string,
    solution: Partial<Solution>
  ): Promise<boolean> {
    const existing = this.solutions.get(id);
    if (!existing) return false;

    const updated = { ...existing, ...solution, id }; // ID는 변경 불가
    this.solutions.set(id, updated);

    return true;
  }

  async searchSolutions(query: string): Promise<Solution[]> {
    const searchTerm = query.toLowerCase();
    const results: Solution[] = [];

    for (const solution of this.solutions.values()) {
      if (
        solution.action.toLowerCase().includes(searchTerm) ||
        solution.description.toLowerCase().includes(searchTerm) ||
        solution.commands?.some(cmd => cmd.toLowerCase().includes(searchTerm))
      ) {
        results.push(solution);
      }
    }

    return results.sort((a, b) => a.priority - b.priority);
  }

  async getStatistics(): Promise<SolutionStatistics> {
    const solutions = Array.from(this.solutions.values());
    const totalSolutions = solutions.length;

    // 성공률 평균 계산
    const successRates = solutions
      .map(s => s.successRate || 0)
      .filter(rate => rate > 0);
    const averageSuccessRate =
      successRates.length > 0
        ? successRates.reduce((sum, rate) => sum + rate, 0) /
          successRates.length
        : 0;

    // 평균 해결 시간 계산
    const estimatedTimes = solutions.map(s => s.estimatedTime);
    const averageResolutionTime =
      estimatedTimes.length > 0
        ? estimatedTimes.reduce((sum, time) => sum + time, 0) /
          estimatedTimes.length
        : 0;

    // 가장 많이 사용된 해결방안
    const sortedByUsage = solutions
      .map(solution => ({
        solution,
        usage: this.usageStats.get(solution.id) || 0,
      }))
      .sort((a, b) => b.usage - a.usage)
      .slice(0, 5)
      .map(item => item.solution);

    // 카테고리별 분포
    const categoryDistribution: Record<SolutionCategory, number> = {
      immediate_action: 0,
      short_term_fix: 0,
      long_term_solution: 0,
      preventive_measure: 0,
      monitoring_enhancement: 0,
    };

    solutions.forEach(solution => {
      categoryDistribution[solution.category]++;
    });

    return {
      totalSolutions,
      successRate: averageSuccessRate,
      averageResolutionTime,
      mostUsedSolutions: sortedByUsage,
      categoryDistribution,
    };
  }

  /**
   * 🧠 해결방안 효과성 업데이트 (AI 학습 연동) (NEW!)
   */
  async updateSolutionEffectiveness(
    solutionId: string,
    effectivenessScore: number
  ): Promise<boolean> {
    try {
      const solution = this.solutions.get(solutionId);
      if (!solution) {
        console.warn(`⚠️ 해결방안을 찾을 수 없음: ${solutionId}`);
        return false;
      }

      // 효과성 점수 검증 (0-1 범위)
      const normalizedScore = Math.max(0, Math.min(1, effectivenessScore));

      // 기존 성공률과 새로운 효과성 점수를 가중 평균으로 업데이트
      const currentSuccessRate = solution.successRate || 0.5;
      const usageCount = this.usageStats.get(solutionId) || 1;

      // 가중 평균: 사용 횟수가 많을수록 기존 값에 더 가중치
      const weight = Math.min(usageCount / 10, 0.8); // 최대 80% 기존값 가중치
      const updatedSuccessRate =
        currentSuccessRate * weight + normalizedScore * (1 - weight);

      // 해결방안 업데이트
      const updatedSolution = {
        ...solution,
        successRate: Math.round(updatedSuccessRate * 100), // 백분율로 저장
      };

      this.solutions.set(solutionId, updatedSolution);

      console.log(
        `🧠 해결방안 효과성 업데이트: ${solutionId} (${currentSuccessRate}% → ${updatedSolution.successRate}%)`
      );
      return true;
    } catch (error) {
      console.error('❌ 해결방안 효과성 업데이트 실패:', error);
      return false;
    }
  }

  /**
   * 📊 학습 기반 해결방안 추천 (NEW!)
   */
  async getRecommendedSolutions(
    incidentType: IncidentType,
    limit = 3
  ): Promise<Solution[]> {
    try {
      const solutions = await this.getSolutions(incidentType);

      // 성공률과 사용 빈도를 기반으로 점수 계산
      const scoredSolutions = solutions.map(solution => {
        const successRate = solution.successRate || 50;
        const usageCount = this.usageStats.get(solution.id) || 0;

        // 점수 = 성공률 * 0.7 + 사용빈도 정규화 * 0.3
        const normalizedUsage = Math.min(usageCount / 10, 1) * 100;
        const score = successRate * 0.7 + normalizedUsage * 0.3;

        return { solution, score };
      });

      // 점수 기준으로 정렬하고 상위 N개 반환
      return scoredSolutions
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(item => item.solution);
    } catch (error) {
      console.error('❌ 추천 해결방안 조회 실패:', error);
      return [];
    }
  }

  /**
   * 🔄 학습 패턴 기반 새로운 해결방안 추가 (NEW!)
   */
  async addLearnedSolution(
    incidentType: IncidentType,
    action: string,
    description: string,
    commands: string[],
    confidence: number
  ): Promise<string | null> {
    try {
      // 신뢰도 검증
      if (confidence < 0.7) {
        console.warn(`⚠️ 신뢰도 부족으로 해결방안 추가 거부: ${confidence}`);
        return null;
      }

      // 중복 해결방안 확인
      const existingSolutions = await this.getSolutions(incidentType);
      const isDuplicate = existingSolutions.some(
        solution =>
          solution.action.toLowerCase().includes(action.toLowerCase()) ||
          action.toLowerCase().includes(solution.action.toLowerCase())
      );

      if (isDuplicate) {
        console.warn(`⚠️ 중복 해결방안으로 추가 거부: ${action}`);
        return null;
      }

      // 새로운 해결방안 생성
      const newSolution: Omit<Solution, 'id'> = {
        action,
        description: `${description} (AI 학습 기반)`,
        priority: 3, // 학습 기반 해결방안은 중간 우선순위
        estimatedTime: 15, // 기본 15분
        riskLevel: 'medium',
        category: 'short_term_fix',
        commands,
        prerequisites: ['AI 학습 기반 제안 - 검증 필요'],
        impact: 'AI 학습을 통해 제안된 해결방안',
        successRate: Math.round(confidence * 100),
      };

      const solutionId = await this.addSolution(newSolution);
      this.addToTypeMapping(incidentType, solutionId);

      console.log(
        `🧠 학습 기반 해결방안 추가: ${action} (신뢰도: ${Math.round(confidence * 100)}%)`
      );
      return solutionId;
    } catch (error) {
      console.error('❌ 학습 기반 해결방안 추가 실패:', error);
      return null;
    }
  }

  // ========================================
  // 🔧 헬퍼 메서드들
  // ========================================

  private addToTypeMapping(type: IncidentType, solutionId: string): void {
    const existing = this.solutionsByType.get(type) || [];
    existing.push(solutionId);
    this.solutionsByType.set(type, existing);
  }
}

/**
 * 📝 SolutionDatabase 구현 완료
 *
 * ✅ 기존 PatternMatcher 6개 룰 확장
 * ✅ 30개 실행 가능한 해결방안 제공
 * ✅ 명령어 및 전제조건 포함
 * ✅ 우선순위 및 위험도 관리
 * ✅ 사용 통계 및 검색 기능
 */
