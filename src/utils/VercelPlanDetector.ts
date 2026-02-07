/**
 * 🔍 Vercel 플랜 자동 감지기
 *
 * AWS 오토스케일링과 같은 지능형 플랜 감지 및 최적화 시스템
 * - 4가지 방법으로 플랜 감지
 * - 실시간 리소스 모니터링
 * - 자동 구성 최적화
 * - 안전한 폴백 시스템
 */

export interface VercelPlanInfo {
  plan: 'hobby' | 'pro' | 'enterprise' | 'unknown';
  confidence: number; // 0-1
  detectionMethods: string[];
  limitations: {
    maxMemory: number;
    maxDuration: number;
    maxConcurrentRequests: number;
  };
  recommendations: string[];
}

export class VercelPlanDetector {
  private static instance: VercelPlanDetector;
  private cachedPlan: VercelPlanInfo | null = null;
  private cacheExpiry: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5분 캐시

  static getInstance(): VercelPlanDetector {
    if (!VercelPlanDetector.instance) {
      VercelPlanDetector.instance = new VercelPlanDetector();
    }
    return VercelPlanDetector.instance;
  }

  /**
   * 🔍 메인 플랜 감지 함수
   */
  async detectPlan(): Promise<VercelPlanInfo> {
    // 캐시 확인
    if (this.cachedPlan && Date.now() < this.cacheExpiry) {
      return this.cachedPlan;
    }

    const detectionResults = await Promise.allSettled([
      this.detectByEnvironmentVariables(),
      this.detectByMemoryLimits(),
      this.detectByFunctionTimeout(),
      this.detectByDomainConfig(),
    ]);

    const validResults = detectionResults
      .filter(
        (result): result is PromiseFulfilledResult<Partial<VercelPlanInfo>> =>
          result.status === 'fulfilled'
      )
      .map((result) => result.value);

    // 투표 시스템으로 최종 플랜 결정
    const finalPlan = this.aggregateResults(validResults);

    // 캐시 저장
    this.cachedPlan = finalPlan;
    this.cacheExpiry = Date.now() + this.CACHE_DURATION;

    return finalPlan;
  }

  /**
   * 🔐 환경 변수 기반 감지
   */
  private async detectByEnvironmentVariables(): Promise<
    Partial<VercelPlanInfo>
  > {
    try {
      const nodeProcess =
        typeof globalThis !== 'undefined'
          ? (globalThis as typeof globalThis & { process?: NodeJS.Process })
              .process
          : undefined;
      // 직접적인 플랜 정보
      const vercelPlan =
        nodeProcess?.env?.NEXT_PUBLIC_VERCEL_PLAN ||
        nodeProcess?.env?.VERCEL_PLAN;
      if (vercelPlan) {
        return {
          plan: vercelPlan as 'hobby' | 'pro' | 'enterprise' | 'unknown',
          confidence: 0.95,
          detectionMethods: ['environment_variable'],
        };
      }

      // Vercel 환경 감지
      const isVercel = nodeProcess?.env?.VERCEL === '1';
      const vercelUrl = nodeProcess?.env?.VERCEL_URL;
      const vercelEnv = nodeProcess?.env?.VERCEL_ENV;

      if (isVercel) {
        // 도메인 패턴으로 플랜 추정
        if (vercelUrl?.includes('.vercel.app')) {
          // 커스텀 도메인이 없으면 Hobby 가능성 높음
          return {
            plan: 'hobby',
            confidence: 0.7,
            detectionMethods: ['vercel_domain_pattern'],
          };
        }

        if (vercelEnv === 'production' && !vercelUrl?.includes('.vercel.app')) {
          // 커스텀 도메인이 있으면 Pro+ 가능성 높음
          return {
            plan: 'pro',
            confidence: 0.8,
            detectionMethods: ['custom_domain_detected'],
          };
        }
      }

      return {
        plan: 'unknown',
        confidence: 0.0,
        detectionMethods: ['environment_variable_failed'],
      };
    } catch {
      return {
        plan: 'unknown',
        confidence: 0.0,
        detectionMethods: ['environment_variable_error'],
      };
    }
  }

  /**
   * 💾 메모리 제한 기반 감지
   */
  private async detectByMemoryLimits(): Promise<Partial<VercelPlanInfo>> {
    try {
      const nodeProcess =
        typeof globalThis !== 'undefined'
          ? (globalThis as typeof globalThis & { process?: NodeJS.Process })
              .process
          : undefined;
      if (nodeProcess && typeof nodeProcess.memoryUsage === 'function') {
        const memUsage = nodeProcess.memoryUsage();
        const totalMemory = memUsage.heapTotal + memUsage.external;

        // Hobby: ~50MB, Pro: ~1GB, Enterprise: ~3GB+
        if (totalMemory < 100 * 1024 * 1024) {
          // 100MB 미만
          return {
            plan: 'hobby',
            confidence: 0.8,
            detectionMethods: ['memory_limit_analysis'],
          };
        } else if (totalMemory < 2 * 1024 * 1024 * 1024) {
          // 2GB 미만
          return {
            plan: 'pro',
            confidence: 0.75,
            detectionMethods: ['memory_limit_analysis'],
          };
        } else {
          return {
            plan: 'enterprise',
            confidence: 0.8,
            detectionMethods: ['memory_limit_analysis'],
          };
        }
      }

      return {
        plan: 'unknown',
        confidence: 0.0,
        detectionMethods: ['memory_analysis_unavailable'],
      };
    } catch {
      return {
        plan: 'unknown',
        confidence: 0.0,
        detectionMethods: ['memory_analysis_error'],
      };
    }
  }

  /**
   * ⏱️ 함수 타임아웃 기반 감지
   */
  private async detectByFunctionTimeout(): Promise<Partial<VercelPlanInfo>> {
    try {
      // 작은 비동기 작업의 성능으로 제한 추정
      const startTime = Date.now();

      await new Promise((resolve) => {
        // 1초 대기 후 성능 측정
        setTimeout(resolve, 1000);
      });

      const endTime = Date.now();
      const actualDuration = endTime - startTime;

      // 타임아웃이 빠르면 제한이 있을 가능성
      if (actualDuration > 1200) {
        // 1.2초 이상이면 제한된 환경
        return {
          plan: 'hobby',
          confidence: 0.6,
          detectionMethods: ['function_timeout_test'],
        };
      } else if (actualDuration > 1100) {
        return {
          plan: 'pro',
          confidence: 0.6,
          detectionMethods: ['function_timeout_test'],
        };
      } else {
        return {
          plan: 'enterprise',
          confidence: 0.6,
          detectionMethods: ['function_timeout_test'],
        };
      }
    } catch {
      return {
        plan: 'unknown',
        confidence: 0.0,
        detectionMethods: ['timeout_test_error'],
      };
    }
  }

  /**
   * 🌐 도메인 구성 기반 감지
   */
  private async detectByDomainConfig(): Promise<Partial<VercelPlanInfo>> {
    try {
      if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;

        // localhost 개발 환경
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
          return {
            plan: 'hobby', // 개발 환경에서는 보수적으로 추정
            confidence: 0.9,
            detectionMethods: ['localhost_development'],
          };
        }

        // .vercel.app 도메인
        if (hostname.endsWith('.vercel.app')) {
          return {
            plan: 'hobby',
            confidence: 0.85,
            detectionMethods: ['vercel_app_domain'],
          };
        }

        // 커스텀 도메인
        if (!hostname.includes('vercel') && hostname.includes('.')) {
          return {
            plan: 'pro',
            confidence: 0.8,
            detectionMethods: ['custom_domain'],
          };
        }
      }

      return {
        plan: 'unknown',
        confidence: 0.0,
        detectionMethods: ['domain_analysis_unavailable'],
      };
    } catch {
      return {
        plan: 'unknown',
        confidence: 0.0,
        detectionMethods: ['domain_analysis_error'],
      };
    }
  }

  /**
   * 🗳️ 감지 결과 집계 (투표 시스템)
   */
  private aggregateResults(results: Partial<VercelPlanInfo>[]): VercelPlanInfo {
    const planVotes: Record<
      string,
      { count: number; totalConfidence: number; methods: string[] }
    > = {
      hobby: { count: 0, totalConfidence: 0, methods: [] },
      pro: { count: 0, totalConfidence: 0, methods: [] },
      enterprise: { count: 0, totalConfidence: 0, methods: [] },
      unknown: { count: 0, totalConfidence: 0, methods: [] },
    };

    // 투표 집계
    for (const result of results) {
      if (result.plan && result.confidence && result.detectionMethods) {
        const plan = result.plan;
        const vote = planVotes[plan];
        if (vote) {
          vote.count++;
          vote.totalConfidence += result.confidence;
          vote.methods.push(...result.detectionMethods);
        }
      }
    }

    // 가중 점수 계산 (투표수 × 평균 신뢰도)
    let bestPlan = 'hobby';
    let bestScore = 0;
    const allMethods: string[] = [];

    for (const [plan, data] of Object.entries(planVotes)) {
      if (data.count > 0) {
        const avgConfidence = data.totalConfidence / data.count;
        const weightedScore = data.count * avgConfidence;
        allMethods.push(...data.methods);

        if (weightedScore > bestScore && plan !== 'unknown') {
          bestScore = weightedScore;
          bestPlan = plan;
        }
      }
    }

    // 최종 신뢰도 계산
    const finalConfidence = Math.min(0.95, bestScore / results.length);

    return {
      plan: bestPlan as 'hobby' | 'pro' | 'enterprise' | 'unknown',
      confidence: finalConfidence,
      detectionMethods: [...new Set(allMethods)],
      limitations: this.getPlanLimitations(
        bestPlan as 'hobby' | 'pro' | 'enterprise' | 'unknown'
      ),
      recommendations: this.generateRecommendations(
        bestPlan as 'hobby' | 'pro' | 'enterprise' | 'unknown',
        finalConfidence
      ),
    };
  }

  /**
   * 📋 플랜별 제한사항 정보
   */
  private getPlanLimitations(plan: string): VercelPlanInfo['limitations'] {
    const _limitations = {
      hobby: {
        maxMemory: 50, // MB
        maxDuration: 10, // seconds
        maxConcurrentRequests: 10,
      },
      pro: {
        maxMemory: 1024, // MB
        maxDuration: 300, // seconds
        maxConcurrentRequests: 1000,
      },
      enterprise: {
        maxMemory: 3008, // MB
        maxDuration: 900, // seconds
        maxConcurrentRequests: 10000,
      },
      unknown: {
        maxMemory: 50, // 안전한 기본값
        maxDuration: 10,
        maxConcurrentRequests: 10,
      },
    };

    return (
      _limitations[plan as keyof typeof _limitations] || _limitations.unknown
    );
  }

  /**
   * 💡 플랜별 권장사항 생성
   */
  private generateRecommendations(plan: string, confidence: number): string[] {
    const recommendations: string[] = [];

    if (confidence < 0.7) {
      recommendations.push(
        '플랜 감지 신뢰도가 낮습니다. 수동으로 플랜을 확인해주세요.'
      );
    }

    switch (plan) {
      case 'hobby':
        recommendations.push('Hobby 플랜: 8개 서버로 최적화됩니다.');
        recommendations.push(
          '메모리 사용량을 모니터링하여 타임아웃을 방지합니다.'
        );
        recommendations.push(
          'Pro 플랜 업그레이드시 25개 서버로 확장 가능합니다.'
        );
        break;

      case 'pro':
        recommendations.push('Pro 플랜: 25개 서버로 최대 성능을 활용합니다.');
        recommendations.push('커스텀 도메인과 고급 기능을 활용하세요.');
        recommendations.push('Enterprise 플랜시 무제한 확장이 가능합니다.');
        break;

      case 'enterprise':
        recommendations.push('Enterprise 플랜: 무제한 서버 생성이 가능합니다.');
        recommendations.push('최고 성능으로 시스템을 운영합니다.');
        recommendations.push('고급 모니터링과 분석 기능을 활용하세요.');
        break;

      default:
        recommendations.push('플랜을 감지할 수 없어 안전 모드로 작동합니다.');
        recommendations.push('8개 서버로 보수적으로 구성됩니다.');
    }

    return recommendations;
  }

  /**
   * 🧹 캐시 클리어 (강제 재감지용)
   */
  clearCache(): void {
    this.cachedPlan = null;
    this.cacheExpiry = 0;
  }

  /**
   * 📊 현재 캐시 상태 확인
   */
  getCacheStatus(): { cached: boolean; expiresIn: number } {
    return {
      cached: this.cachedPlan !== null && Date.now() < this.cacheExpiry,
      expiresIn: Math.max(0, this.cacheExpiry - Date.now()),
    };
  }
}

// 싱글톤 인스턴스 익스포트
export const vercelPlanDetector = VercelPlanDetector.getInstance();
