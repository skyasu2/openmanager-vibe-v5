import { PatternAnalysisService } from '../../../services/ai-agent/PatternAnalysisService';
import { InteractionLogger } from '../../../services/ai-agent/logging/InteractionLogger';
import { PatternSuggestion } from '@/types/ai-learning';

export interface ContextUpdate {
  id: string;
  type:
    | 'pattern_addition'
    | 'response_template'
    | 'knowledge_base'
    | 'intent_mapping';
  content: string;
  confidence: number;
  source: 'learning' | 'manual' | 'feedback';
  timestamp: Date;
  appliedAt?: Date;
  status:
    | 'pending_admin_approval'
    | 'admin_approved'
    | 'admin_rejected'
    | 'applied_to_bundle';
  metadata?: Record<string, any>;
  adminNotes?: string; // 관리자 검토 노트
  bundleTarget?: 'base' | 'advanced' | 'custom'; // 적용 대상 번들
}

export interface ContextUpdateConfig {
  maxPendingUpdates: number; // 최대 대기 업데이트 수
  updateBatchSize: number; // 배치 업데이트 크기
  enableSuggestionGeneration: boolean; // 제안 생성 활성화 (자동 적용 아님)
  backupBeforeUpdate: boolean; // 업데이트 전 백업
  requireAdminApproval: boolean; // 관리자 승인 필수 (항상 true)
}

export interface ContextSnapshot {
  id: string;
  timestamp: Date;
  patterns: string[];
  templates: Record<string, string>;
  knowledgeBase: Record<string, any>;
  intentMappings: Record<string, string>;
  version: string;
}

export class ContextUpdateEngine {
  private static instance: ContextUpdateEngine;
  private config: ContextUpdateConfig;
  private patternAnalysisService: PatternAnalysisService;
  private interactionLogger: InteractionLogger;
  private pendingUpdates: Map<string, ContextUpdate> = new Map();
  private appliedUpdates: ContextUpdate[] = [];
  private contextSnapshots: ContextSnapshot[] = [];
  private currentContext: ContextSnapshot;

  private constructor(config?: Partial<ContextUpdateConfig>) {
    this.config = {
      maxPendingUpdates: 50,
      updateBatchSize: 10,
      enableSuggestionGeneration: true, // 제안 생성만 허용
      backupBeforeUpdate: true,
      requireAdminApproval: true, // 항상 관리자 승인 필요
      ...config,
    };

    this.patternAnalysisService = PatternAnalysisService.getInstance();
    this.interactionLogger = InteractionLogger.getInstance();
    this.currentContext = this.initializeContext();
  }

  public static getInstance(
    config?: Partial<ContextUpdateConfig>
  ): ContextUpdateEngine {
    if (!ContextUpdateEngine.instance) {
      ContextUpdateEngine.instance = new ContextUpdateEngine(config);
    }
    return ContextUpdateEngine.instance;
  }

  /**
   * 컨텍스트 업데이트 제안서 생성 (자동 적용 금지)
   */
  async generateUpdateSuggestions(): Promise<ContextUpdate[]> {
    if (!this.config.enableSuggestionGeneration) {
      console.log(
        '🔒 [ContextUpdateEngine] 제안 생성이 비활성화되어 있습니다.'
      );
      return [];
    }

    try {
      console.log(
        '📋 [ContextUpdateEngine] 컨텍스트 업데이트 제안서 생성 시작...'
      );

      const analysisReport =
        await this.patternAnalysisService.getLatestAnalysisReport();
      if (!analysisReport) {
        console.log('📊 [ContextUpdateEngine] 분석 보고서가 없습니다.');
        return [];
      }

      const suggestions: ContextUpdate[] = [];

      // 1. 패턴 제안 (자동 적용 아님)
      const patternSuggestions =
        await this.createPatternSuggestions(analysisReport);
      suggestions.push(...patternSuggestions);

      // 2. 응답 템플릿 제안
      const templateSuggestions =
        await this.generateTemplateSuggestions(analysisReport);
      suggestions.push(...templateSuggestions);

      // 3. 지식 베이스 제안
      const knowledgeSuggestions = await this.generateKnowledgeSuggestions();
      suggestions.push(...knowledgeSuggestions);

      // 4. 인텐트 매핑 제안
      const intentSuggestions = await this.generateIntentSuggestions();
      suggestions.push(...intentSuggestions);

      // 모든 제안을 관리자 승인 대기 상태로 설정
      for (const suggestion of suggestions) {
        suggestion.status = 'pending_admin_approval';
        this.pendingUpdates.set(suggestion.id, suggestion);
      }

      console.log(
        `✅ [ContextUpdateEngine] ${suggestions.length}개의 컨텍스트 업데이트 제안서 생성 완료`
      );
      return suggestions;
    } catch (error) {
      console.error(
        '❌ [ContextUpdateEngine] 컨텍스트 업데이트 제안서 생성 실패:',
        error
      );
      return [];
    }
  }

  /**
   * 자동 업데이트 실행 (폐쇄망 환경에서 금지)
   * @deprecated 운영 환경에서는 사용 금지. 관리자 수동 승인만 허용
   */
  async executeAutoUpdates(): Promise<number> {
    console.warn(
      '🚫 [ContextUpdateEngine] 자동 업데이트는 폐쇄망 환경에서 금지됩니다. 관리자 승인을 통해 수동으로 적용하세요.'
    );
    return 0;
  }

  /**
   * 관리자 승인 처리
   */
  async adminApproveUpdate(
    updateId: string,
    adminNotes?: string,
    bundleTarget: 'base' | 'advanced' | 'custom' = 'advanced'
  ): Promise<boolean> {
    const update = this.pendingUpdates.get(updateId);
    if (!update) {
      console.error(
        `❌ [ContextUpdateEngine] 업데이트를 찾을 수 없습니다: ${updateId}`
      );
      return false;
    }

    if (update.status !== 'pending_admin_approval') {
      console.error(
        `❌ [ContextUpdateEngine] 승인 대기 상태가 아닙니다: ${updateId}`
      );
      return false;
    }

    try {
      update.status = 'admin_approved';
      update.adminNotes = adminNotes;
      update.bundleTarget = bundleTarget;
      update.appliedAt = new Date();

      // 승인된 업데이트를 별도 목록으로 이동
      this.pendingUpdates.delete(updateId);
      this.appliedUpdates.push(update);

      console.log(
        `✅ [ContextUpdateEngine] 관리자 승인 완료: ${updateId} → ${bundleTarget} 번들 대상`
      );
      return true;
    } catch (error) {
      console.error(
        `❌ [ContextUpdateEngine] 관리자 승인 실패: ${updateId}`,
        error
      );
      return false;
    }
  }

  /**
   * 관리자 거부 처리
   */
  async adminRejectUpdate(updateId: string, reason: string): Promise<boolean> {
    const update = this.pendingUpdates.get(updateId);
    if (!update) {
      console.error(
        `❌ [ContextUpdateEngine] 업데이트를 찾을 수 없습니다: ${updateId}`
      );
      return false;
    }

    update.status = 'admin_rejected';
    update.adminNotes = reason;

    this.pendingUpdates.delete(updateId);
    console.log(`❌ [ContextUpdateEngine] 관리자 거부: ${updateId}`, reason);
    return true;
  }

  /**
   * 승인된 업데이트를 .ctxbundle 형태로 내보내기
   */
  async exportApprovedUpdatesToBundle(
    bundleType: 'base' | 'advanced' | 'custom',
    clientId?: string
  ): Promise<{
    patterns: any[];
    templates: Record<string, string>;
    knowledgeBase: Record<string, any>;
    intentMappings: Record<string, string>;
    metadata: {
      version: string;
      timestamp: Date;
      bundleType: string;
      clientId?: string;
      approvedUpdates: string[];
    };
  }> {
    const approvedUpdates = this.appliedUpdates.filter(
      update =>
        update.status === 'admin_approved' && update.bundleTarget === bundleType
    );

    const bundle = {
      patterns: [] as any[],
      templates: {} as Record<string, string>,
      knowledgeBase: {} as Record<string, any>,
      intentMappings: {} as Record<string, string>,
      metadata: {
        version: this.generateVersion(),
        timestamp: new Date(),
        bundleType,
        clientId,
        approvedUpdates: approvedUpdates.map(u => u.id),
      },
    };

    // 승인된 업데이트를 번들에 포함
    for (const update of approvedUpdates) {
      const content = JSON.parse(update.content);

      switch (update.type) {
        case 'pattern_addition':
          bundle.patterns.push(content);
          break;
        case 'response_template':
          bundle.templates[content.key] = content.value;
          break;
        case 'knowledge_base':
          bundle.knowledgeBase[content.key] = content.value;
          break;
        case 'intent_mapping':
          bundle.intentMappings[content.pattern] = content.intent;
          break;
      }
    }

    console.log(
      `📦 [ContextUpdateEngine] ${bundleType} 번들 생성 완료: ${approvedUpdates.length}개 업데이트 포함`
    );
    return bundle;
  }

  /**
   * 패턴 제안 생성 (자동 적용 아님)
   */
  private async createPatternSuggestions(
    analysisReport: any
  ): Promise<ContextUpdate[]> {
    const suggestions: ContextUpdate[] = [];

    // 분석 보고서에서 패턴 제안 추출
    const patternSuggestions = analysisReport.suggestions || [];

    for (const suggestion of patternSuggestions) {
      suggestions.push({
        id: this.generateUpdateId(),
        type: 'pattern_addition',
        content: JSON.stringify({
          pattern: suggestion.suggestedPattern,
          description: `학습 기반 패턴 제안 (제안 ID: ${suggestion.id})`,
          category: 'learning_suggested',
          confidence: suggestion.confidenceScore,
          basedOnInteractions: suggestion.basedOnInteractions,
        }),
        confidence: suggestion.confidenceScore,
        source: 'learning',
        timestamp: new Date(),
        status: 'pending_admin_approval',
        metadata: {
          suggestionId: suggestion.id,
          basedOnInteractions: suggestion.basedOnInteractions,
          estimatedImprovement: suggestion.estimatedImprovement,
          analysisReportId: analysisReport.id,
        },
      });
    }

    return suggestions;
  }

  /**
   * 템플릿 제안 생성
   */
  private async generateTemplateSuggestions(
    analysisReport: any
  ): Promise<ContextUpdate[]> {
    const suggestions: ContextUpdate[] = [];

    // 자주 실패하는 질문 유형에 대한 새로운 템플릿 제안
    const failurePatterns = analysisReport.analysisResult?.patterns || [];

    for (const pattern of failurePatterns) {
      if (pattern.frequency > 5) {
        // 5회 이상 실패한 패턴
        suggestions.push({
          id: this.generateUpdateId(),
          type: 'response_template',
          content: JSON.stringify({
            key: `template_${pattern.category}`,
            value: this.generateResponseTemplate(pattern),
            description: `실패 패턴 기반 템플릿 제안`,
          }),
          confidence: 0.7,
          source: 'learning',
          timestamp: new Date(),
          status: 'pending_admin_approval',
          metadata: {
            patternId: pattern.id,
            failureCount: pattern.frequency,
            category: pattern.category,
          },
        });
      }
    }

    return suggestions;
  }

  /**
   * 지식 베이스 제안 생성
   */
  private async generateKnowledgeSuggestions(): Promise<ContextUpdate[]> {
    const suggestions: ContextUpdate[] = [];

    // 최근 성공적인 상호작용에서 지식 패턴 추출
    const recentInteractions = await this.interactionLogger.getInteractions({
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 최근 7일
    });

    const successfulInteractions = recentInteractions.filter(
      (i: any) => i.userFeedback === 'helpful' && i.confidence > 0.8
    );

    // 성공적인 응답에서 지식 패턴 추출
    const knowledgePatterns = this.extractKnowledgePatterns(
      successfulInteractions
    );

    for (const pattern of knowledgePatterns) {
      suggestions.push({
        id: this.generateUpdateId(),
        type: 'knowledge_base',
        content: JSON.stringify({
          key: pattern.key,
          value: pattern.value,
          context: pattern.context,
          description: '성공적인 상호작용 기반 지식 제안',
        }),
        confidence: pattern.confidence,
        source: 'learning',
        timestamp: new Date(),
        status: 'pending_admin_approval',
        metadata: {
          sourceInteractions: pattern.sourceInteractions,
          successRate: pattern.successRate,
        },
      });
    }

    return suggestions;
  }

  /**
   * 인텐트 매핑 제안 생성
   */
  private async generateIntentSuggestions(): Promise<ContextUpdate[]> {
    const suggestions: ContextUpdate[] = [];

    // 분류되지 않은 질문들에 대한 새로운 인텐트 매핑 제안
    const unclassifiedQueries = await this.getUnclassifiedQueries();

    for (const query of unclassifiedQueries) {
      const suggestedIntent = this.suggestIntent(query);

      if (suggestedIntent.confidence > 0.6) {
        suggestions.push({
          id: this.generateUpdateId(),
          type: 'intent_mapping',
          content: JSON.stringify({
            pattern: query.pattern,
            intent: suggestedIntent.intent,
            examples: query.examples,
            description: '미분류 질문 기반 인텐트 매핑 제안',
          }),
          confidence: suggestedIntent.confidence,
          source: 'learning',
          timestamp: new Date(),
          status: 'pending_admin_approval',
          metadata: {
            queryCount: query.count,
            examples: query.examples,
            unclassifiedRate: query.unclassifiedRate,
          },
        });
      }
    }

    return suggestions;
  }

  /**
   * 컨텍스트 스냅샷 생성
   */
  async createContextSnapshot(): Promise<ContextSnapshot> {
    const snapshot: ContextSnapshot = {
      id: this.generateSnapshotId(),
      timestamp: new Date(),
      patterns: [...this.currentContext.patterns],
      templates: { ...this.currentContext.templates },
      knowledgeBase: { ...this.currentContext.knowledgeBase },
      intentMappings: { ...this.currentContext.intentMappings },
      version: this.generateVersion(),
    };

    this.contextSnapshots.push(snapshot);

    // 무료 티어 최적화: 최대 8개의 스냅샷 유지 (실용성 고려)
    if (this.contextSnapshots.length > 8) {
      this.contextSnapshots.shift();
    }

    console.log(
      `📸 [ContextUpdateEngine] 컨텍스트 스냅샷 생성: ${snapshot.id}`
    );
    return snapshot;
  }

  /**
   * 컨텍스트 롤백
   */
  async rollbackToSnapshot(snapshotId: string): Promise<boolean> {
    const snapshot = this.contextSnapshots.find(s => s.id === snapshotId);
    if (!snapshot) {
      console.error(
        `❌ [ContextUpdateEngine] 스냅샷을 찾을 수 없습니다: ${snapshotId}`
      );
      return false;
    }

    this.currentContext = { ...snapshot };
    console.log(`🔄 [ContextUpdateEngine] 컨텍스트 롤백 완료: ${snapshotId}`);
    return true;
  }

  /**
   * 대기 중인 업데이트 조회
   */
  getPendingUpdates(): ContextUpdate[] {
    return Array.from(this.pendingUpdates.values());
  }

  /**
   * 적용된 업데이트 조회
   */
  getAppliedUpdates(): ContextUpdate[] {
    return [...this.appliedUpdates];
  }

  /**
   * 현재 컨텍스트 조회
   */
  getCurrentContext(): ContextSnapshot {
    return { ...this.currentContext };
  }

  /**
   * 컨텍스트 스냅샷 목록 조회
   */
  getContextSnapshots(): ContextSnapshot[] {
    return [...this.contextSnapshots];
  }

  // 헬퍼 메서드들
  private initializeContext(): ContextSnapshot {
    return {
      id: 'initial',
      timestamp: new Date(),
      patterns: [],
      templates: {},
      knowledgeBase: {},
      intentMappings: {},
      version: '1.0.0',
    };
  }

  private generateResponseTemplate(pattern: any): string {
    // 패턴 기반 응답 템플릿 생성 로직
    return `${pattern.category}에 대한 질문입니다. 다음과 같이 도움을 드릴 수 있습니다...`;
  }

  private extractKnowledgePatterns(interactions: any[]): any[] {
    // 성공적인 상호작용에서 지식 패턴 추출
    return [];
  }

  private async getUnclassifiedQueries(): Promise<any[]> {
    // 분류되지 않은 질문들 조회
    return [];
  }

  private suggestIntent(query: any): { intent: string; confidence: number } {
    // 질문에 대한 인텐트 제안
    return { intent: 'unknown', confidence: 0.5 };
  }

  private generateUpdateId(): string {
    return `update_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSnapshotId(): string {
    return `snapshot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateVersion(): string {
    const now = new Date();
    return `${now.getFullYear()}.${now.getMonth() + 1}.${now.getDate()}.${now.getHours()}${now.getMinutes()}`;
  }
}
