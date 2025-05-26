import { PatternAnalysisService } from '../../../services/ai-agent/PatternAnalysisService';
import { InteractionLogger } from '../../../services/ai-agent/logging/InteractionLogger';

export interface LearningScheduleConfig {
  analysisInterval: number; // 분석 실행 간격 (분)
  autoApprovalThreshold: number; // 자동 승인 임계값
  maxConcurrentTests: number; // 최대 동시 테스트 수
  learningWindowDays: number; // 학습 데이터 기간 (일)
  enableAutoApproval: boolean; // 자동 승인 활성화
  enableContinuousLearning: boolean; // 지속적 학습 활성화
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
      autoApprovalThreshold: 0.8, // 80% 이상 신뢰도
      maxConcurrentTests: 3,
      learningWindowDays: 7,
      enableAutoApproval: true,
      enableContinuousLearning: true
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
    this.schedulerInterval = setInterval(() => {
      this.runScheduledAnalysis();
    }, this.config.analysisInterval * 60 * 1000);
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
      const analysisReport = await this.patternAnalysisService.runFullAnalysis();
      
      if (!analysisReport) {
        console.log('분석할 데이터가 충분하지 않습니다.');
        return;
      }

      // 2. 자동 승인 처리
      if (this.config.enableAutoApproval) {
        await this.processAutoApprovals(analysisReport);
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

  private async processAutoApprovals(analysisReport: any): Promise<void> {
    const highConfidencePatterns = analysisReport.patternSuggestions?.filter(
      (suggestion: any) => suggestion.confidence >= this.config.autoApprovalThreshold
    ) || [];

    for (const pattern of highConfidencePatterns) {
      try {
        await this.patternAnalysisService.approvePatternSuggestion(pattern.id);
        console.log(`패턴 ${pattern.id}를 자동 승인했습니다. (신뢰도: ${pattern.confidence})`);
      } catch (error) {
        console.error(`패턴 ${pattern.id} 자동 승인 실패:`, error);
      }
    }
  }

  private async startAutomaticTests(): Promise<void> {
    try {
      const activeTests = await this.patternAnalysisService.getActiveTests();
      const availableSlots = this.config.maxConcurrentTests - activeTests.length;

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
      const completedTests = await this.patternAnalysisService.getCompletedTests();
      
      for (const test of completedTests) {
        if ((test as any).shouldApprove) {
          await this.patternAnalysisService.approvePatternSuggestion(test.patternId);
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
        startDate: new Date(Date.now() - this.config.learningWindowDays * 24 * 60 * 60 * 1000),
        endDate: new Date()
      });

      const successfulInteractions = interactions.filter((i: any) => 
        i.userFeedback === 'helpful' || i.confidence > 0.7
      );

      const totalInteractions = interactions.length;
      const successRate = totalInteractions > 0 ? successfulInteractions.length / totalInteractions : 0;
      const averageConfidence = totalInteractions > 0 
        ? interactions.reduce((sum: number, i: any) => sum + i.confidence, 0) / totalInteractions 
        : 0;

      // 개선율 계산 (최근 데이터와 이전 데이터 비교)
      const recentInteractions = interactions.filter((i: any) => 
        new Date(i.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)
      );
      const recentSuccessRate = recentInteractions.length > 0 
        ? recentInteractions.filter((i: any) => i.userFeedback === 'helpful' || i.confidence > 0.7).length / recentInteractions.length
        : 0;
      
      const improvementRate = successRate > 0 ? (recentSuccessRate - successRate) / successRate : 0;

      const activeTests = await this.patternAnalysisService.getActiveTests();
      const analysisReport = await this.patternAnalysisService.getLatestAnalysisReport();

      return {
        totalInteractions,
        successRate,
        averageConfidence,
        improvementRate,
        activePatterns: analysisReport?.suggestions?.filter(s => (s as any).approved)?.length || 0,
        pendingTests: activeTests.length,
        lastAnalysisTime: analysisReport?.timestamp || new Date(0),
        nextScheduledAnalysis: new Date(Date.now() + this.config.analysisInterval * 60 * 1000)
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
        nextScheduledAnalysis: new Date(Date.now() + this.config.analysisInterval * 60 * 1000)
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
      metrics
    };
  }
} 