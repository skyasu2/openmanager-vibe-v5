import { KST } from "@/utils/koreanTime";
import { PatternAnalysisService } from '../../../services/ai-agent/PatternAnalysisService';
import { InteractionLogger } from '../../../services/ai-agent/logging/InteractionLogger';

export interface LearningScheduleConfig {
  analysisInterval: number; // 분석 실행 간격 (분)
  suggestionThreshold: number; // 제안 생성 임계값 (자동 승인 아님)
  maxConcurrentTests: number; // 최대 동시 테스트 수
  learningWindowDays: number; // 학습 데이터 기간 (일)
  enableSuggestionGeneration: boolean; // 제안 생성 활성화 (자동 승인 금지)
  enableContinuousLearning: boolean; // 지속적 학습 활성화
  requireAdminApproval: boolean; // 관리자 승인 필수 (항상 true)
}

export interface LearningMetrics {
  totalInteractions: number;
  successRate: number;
  averageConfidence: number;
  improvementRate: number;
  activePatterns: number;
  pendingTests: number;
  lastAnalysisTime: Date;
  nextScheduledAnalysis: Date;
}

export class AutoLearningScheduler {
  private static instance: AutoLearningScheduler;
  private patternAnalysisService: PatternAnalysisService;
  private interactionLogger: InteractionLogger;
  private config: LearningScheduleConfig;
  private schedulerInterval: NodeJS.Timeout | null = null;
  private isRunning = false;

  private constructor() {
    this.patternAnalysisService = PatternAnalysisService.getInstance();
    this.interactionLogger = InteractionLogger.getInstance();
    this.config = this.getDefaultConfig();
  }

  public static getInstance(): AutoLearningScheduler {
    if (!AutoLearningScheduler.instance) {
      AutoLearningScheduler.instance = new AutoLearningScheduler();
    }
    return AutoLearningScheduler.instance;
  }

  private getDefaultConfig(): LearningScheduleConfig {
    return {
      analysisInterval: 60, // 1시간마다
      suggestionThreshold: 0.8, // 80% 이상 신뢰도에서 제안 생성
      maxConcurrentTests: 3,
      learningWindowDays: 7,
      enableSuggestionGeneration: true, // 제안 생성만 허용
      enableContinuousLearning: true,
      requireAdminApproval: true, // 항상 관리자 승인 필요
    };
  }

  public updateConfig(newConfig: Partial<LearningScheduleConfig>): void {
    this.config = { ...this.config, ...newConfig };

    // 스케줄러 재시작
    if (this.isRunning) {
      this.stop();
      this.start();
    }
  }

  public getConfig(): LearningScheduleConfig {
    return { ...this.config };
  }

  public start(): void {
    if (this.isRunning) {
      console.log('자동 학습 스케줄러가 이미 실행 중입니다.');
      return;
    }

    this.isRunning = true;
    console.log('자동 학습 스케줄러를 시작합니다.');

    // 즉시 첫 번째 분석 실행
    this.runScheduledAnalysis();

    // 주기적 분석 스케줄링
    this.schedulerInterval = setInterval(
      () => {
        this.runScheduledAnalysis();
      },
      this.config.analysisInterval * 60 * 1000
    );
  }

  public stop(): void {
    if (!this.isRunning) {
      console.log('자동 학습 스케줄러가 실행되고 있지 않습니다.');
      return;
    }

    this.isRunning = false;
    if (this.schedulerInterval) {
      clearInterval(this.schedulerInterval);
      this.schedulerInterval = null;
    }
    console.log('자동 학습 스케줄러를 중지했습니다.');
  }

  public isSchedulerRunning(): boolean {
    return this.isRunning;
  }

  private async runScheduledAnalysis(): Promise<void> {
    try {
      console.log('스케줄된 패턴 분석을 시작합니다...');

      // 1. 패턴 분석 실행
      const analysisReport =
        await this.patternAnalysisService.runFullAnalysis();

      if (!analysisReport) {
        console.log('분석할 데이터가 충분하지 않습니다.');
        return;
      }

      // 2. 제안서 생성 (자동 승인 금지)
      if (this.config.enableSuggestionGeneration) {
        await this.generateSuggestionReport(analysisReport);
      }

      // 3. 자동 테스트 시작
      await this.startAutomaticTests();

      // 4. 완료된 테스트 처리
      await this.processCompletedTests();

      console.log('스케줄된 분석이 완료되었습니다.');
    } catch (error) {
      console.error('스케줄된 분석 중 오류 발생:', error);
    }
  }

  private async generateSuggestionReport(analysisReport: any): Promise<void> {
    const highConfidencePatterns =
      analysisReport.patternSuggestions?.filter(
        (suggestion: any) =>
          suggestion.confidence >= this.config.suggestionThreshold
      ) || [];

    // 관리자 검토용 제안서 생성 (자동 승인 금지)
    const suggestionReport = {
      analysisId: analysisReport.id,
      timestamp: new Date(),
      totalPatterns: analysisReport.patternSuggestions?.length || 0,
      highConfidencePatterns: highConfidencePatterns.length,
      recommendedForReview: highConfidencePatterns.map((pattern: any) => ({
        id: pattern.id,
        pattern: pattern.suggestedPattern,
        confidence: pattern.confidence,
        estimatedImprovement: pattern.estimatedImprovement,
        requiresAdminApproval: true,
      })),
    };

    console.log(
      `📋 [AutoLearningScheduler] 제안서 생성 완료: ${highConfidencePatterns.length}개 고신뢰도 패턴 (관리자 검토 필요)`
    );
    console.log(
      '🔒 [AutoLearningScheduler] 자동 승인 금지 - 모든 패턴은 관리자 승인 필요'
    );

    // 관리자 알림 시스템에 제안서 전송
    await this.notifyAdminForReview(suggestionReport);
  }

  private async startAutomaticTests(): Promise<void> {
    try {
      const activeTests = await this.patternAnalysisService.getActiveTests();
      const availableSlots =
        this.config.maxConcurrentTests - activeTests.length;

      if (availableSlots > 0) {
        await this.patternAnalysisService.startAutomaticTests(availableSlots);
        console.log(`${availableSlots}개의 자동 테스트를 시작했습니다.`);
      }
    } catch (error) {
      console.error('자동 테스트 시작 실패:', error);
    }
  }

  private async processCompletedTests(): Promise<void> {
    try {
      const completedTests =
        await this.patternAnalysisService.getCompletedTests();

      for (const test of completedTests) {
        if ((test as any).shouldApprove) {
          await this.patternAnalysisService.approvePatternSuggestion(
            test.patternId
          );
          console.log(`테스트 완료된 패턴 ${test.patternId}를 승인했습니다.`);
        }
      }
    } catch (error) {
      console.error('완료된 테스트 처리 실패:', error);
    }
  }

  public async getLearningMetrics(): Promise<LearningMetrics> {
    try {
      const interactions = await this.interactionLogger.getInteractions({
        startDate: new Date(
          Date.now() - this.config.learningWindowDays * 24 * 60 * 60 * 1000
        ),
        endDate: new Date(),
      });

      const successfulInteractions = interactions.filter(
        (i: any) => i.userFeedback === 'helpful' || i.confidence > 0.7
      );

      const totalInteractions = interactions.length;
      const successRate =
        totalInteractions > 0
          ? successfulInteractions.length / totalInteractions
          : 0;
      const averageConfidence =
        totalInteractions > 0
          ? interactions.reduce(
            (sum: number, i: any) => sum + i.confidence,
            0
          ) / totalInteractions
          : 0;

      // 개선율 계산 (최근 데이터와 이전 데이터 비교)
      const recentInteractions = interactions.filter(
        (i: any) =>
          new Date(i.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)
      );
      const recentSuccessRate =
        recentInteractions.length > 0
          ? recentInteractions.filter(
            (i: any) => i.userFeedback === 'helpful' || i.confidence > 0.7
          ).length / recentInteractions.length
          : 0;

      const improvementRate =
        successRate > 0 ? (recentSuccessRate - successRate) / successRate : 0;

      const activeTests = await this.patternAnalysisService.getActiveTests();
      const analysisReport =
        await this.patternAnalysisService.getLatestAnalysisReport();

      return {
        totalInteractions,
        successRate,
        averageConfidence,
        improvementRate,
        activePatterns:
          analysisReport?.suggestions?.filter((s: any) => (s as any).approved)
            ?.length || 0,
        pendingTests: activeTests.length,
        lastAnalysisTime: analysisReport?.timestamp || new Date(0),
        nextScheduledAnalysis: new Date(
          Date.now() + this.config.analysisInterval * 60 * 1000
        ),
      };
    } catch (error) {
      console.error('학습 메트릭 계산 실패:', error);
      return {
        totalInteractions: 0,
        successRate: 0,
        averageConfidence: 0,
        improvementRate: 0,
        activePatterns: 0,
        pendingTests: 0,
        lastAnalysisTime: new Date(0),
        nextScheduledAnalysis: new Date(
          Date.now() + this.config.analysisInterval * 60 * 1000
        ),
      };
    }
  }

  public async forceAnalysis(): Promise<void> {
    console.log('강제 분석을 실행합니다...');
    await this.runScheduledAnalysis();
  }

  public getNextAnalysisTime(): Date {
    if (!this.isRunning) {
      return new Date(0);
    }
    return new Date(Date.now() + this.config.analysisInterval * 60 * 1000);
  }

  public async getSchedulerStatus(): Promise<{
    isRunning: boolean;
    config: LearningScheduleConfig;
    nextAnalysis: Date;
    metrics: LearningMetrics;
  }> {
    const metrics = await this.getLearningMetrics();

    return {
      isRunning: this.isRunning,
      config: this.config,
      nextAnalysis: this.getNextAnalysisTime(),
      metrics,
    };
  }

  /**
   * 관리자 검토 알림 전송
   */
  private async notifyAdminForReview(suggestionReport: {
    analysisId: string;
    timestamp: Date;
    totalPatterns: number;
    highConfidencePatterns: number;
    recommendedForReview: any[];
  }): Promise<void> {
    try {
      console.log(`📋 관리자 검토 알림 시작: ${suggestionReport.analysisId}`);

      // 1. 데이터베이스에 알림 저장
      await this.storeAdminNotification(suggestionReport);

      // 2. 웹소켓 실시간 알림 (Vercel 호환)
      await this.sendWebSocketNotification(suggestionReport);

      // 이메일 알림은 Vercel 환경에서 제거됨 (SMTP 제한)

      console.log(`✅ 관리자 검토 알림 완료: ${suggestionReport.analysisId}`);
    } catch (error) {
      console.error('관리자 알림 전송 실패:', error);
    }
  }

  /**
   * 알림을 데이터베이스에 저장
   */
  private async storeAdminNotification(suggestionReport: any): Promise<void> {
    try {
      const notification = {
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'pattern_suggestions',
        title: `${suggestionReport.highConfidencePatterns}개의 새로운 패턴 제안`,
        message: `AI 에이전트가 ${suggestionReport.totalPatterns}개의 패턴을 분석하여 ${suggestionReport.highConfidencePatterns}개의 고신뢰도 제안을 생성했습니다.`,
        priority:
          suggestionReport.highConfidencePatterns > 5 ? 'high' : 'medium',
        status: 'unread',
        data: suggestionReport,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7일 후 만료
      };

      // Supabase에 저장 (가능한 경우)
      if (
        typeof window !== 'undefined' &&
        process.env.NEXT_PUBLIC_SUPABASE_URL
      ) {
        await fetch('/api/admin/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notification }),
        });
      }

      // 로컬 저장 (폴백)
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem('admin-notifications') || '[]';
        const notifications = JSON.parse(stored);
        notifications.push(notification);
        localStorage.setItem(
          'admin-notifications',
          JSON.stringify(notifications)
        );
      }

      console.log(`💾 알림 저장 완료: ${notification.id}`);
    } catch (error) {
      console.error('알림 저장 실패:', error);
    }
  }

  /**
   * 웹소켓을 통한 실시간 알림
   */
  private async sendWebSocketNotification(
    suggestionReport: any
  ): Promise<void> {
    try {
      const wsMessage = {
        type: 'admin_notification',
        subtype: 'pattern_suggestions',
        data: {
          title: `${suggestionReport.highConfidencePatterns}개의 새로운 패턴 제안`,
          message: `AI가 분석한 ${suggestionReport.totalPatterns}개 패턴 중 ${suggestionReport.highConfidencePatterns}개가 검토 대상입니다.`,
          priority:
            suggestionReport.highConfidencePatterns > 5 ? 'high' : 'medium',
          actionUrl: '/admin/mcp-monitoring',
          timestamp: suggestionReport.timestamp,
          data: suggestionReport,
        },
      };

      // 웹소켓 API를 통해 브로드캐스트
      await fetch('/api/websocket/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: 'admin_notifications',
          message: wsMessage,
        }),
      });

      console.log('✅ 웹소켓 실시간 알림 전송 완료');
    } catch (error) {
      console.error('웹소켓 알림 전송 에러:', error);
    }
  }

  /**
   * 📊 개선 제안 보고서 전송
   */
  private async sendImprovementReport(suggestionReport: any): Promise<void> {
    try {
      // 1. 콘솔 로깅
      console.log('📊 AI 개선 제안 보고서:', {
        총_제안수: suggestionReport.suggestions?.length || 0,
        우선순위_높음: suggestionReport.highPriority?.length || 0,
        예상_성능_향상: suggestionReport.expectedImprovement || 'N/A',
        생성_시간: KST.now(),
        주요_제안:
          suggestionReport.suggestions?.slice(0, 3)?.map((s: any) => s.title) ||
          [],
      });

      // Slack 알림 기능 제거됨 (포트폴리오용)
    } catch (error) {
      console.error('❌ 개선 제안 보고서 전송 실패:', error);
    }
  }
}
