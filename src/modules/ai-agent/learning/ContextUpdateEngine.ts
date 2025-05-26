import { PatternAnalysisService } from '../../../services/ai-agent/PatternAnalysisService';
import { InteractionLogger } from '../../../services/ai-agent/logging/InteractionLogger';
import { PatternSuggestion } from '@/types/ai-learning';

export interface ContextUpdate {
  id: string;
  type: 'pattern_addition' | 'response_template' | 'knowledge_base' | 'intent_mapping';
  content: string;
  confidence: number;
  source: 'learning' | 'manual' | 'feedback';
  timestamp: Date;
  appliedAt?: Date;
  status: 'pending' | 'applied' | 'rejected';
  metadata?: Record<string, any>;
}

export interface ContextUpdateConfig {
  autoApplyThreshold: number; // 자동 적용 임계값
  maxPendingUpdates: number; // 최대 대기 업데이트 수
  updateBatchSize: number; // 배치 업데이트 크기
  enableAutoUpdate: boolean; // 자동 업데이트 활성화
  backupBeforeUpdate: boolean; // 업데이트 전 백업
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
      autoApplyThreshold: 0.85,
      maxPendingUpdates: 50,
      updateBatchSize: 10,
      enableAutoUpdate: true,
      backupBeforeUpdate: true,
      ...config
    };

    this.patternAnalysisService = PatternAnalysisService.getInstance();
    this.interactionLogger = InteractionLogger.getInstance();
    this.currentContext = this.initializeContext();
  }

  public static getInstance(config?: Partial<ContextUpdateConfig>): ContextUpdateEngine {
    if (!ContextUpdateEngine.instance) {
      ContextUpdateEngine.instance = new ContextUpdateEngine(config);
    }
    return ContextUpdateEngine.instance;
  }

  /**
   * 학습 결과를 기반으로 컨텍스트 업데이트 제안 생성
   */
  async generateContextUpdates(): Promise<ContextUpdate[]> {
    try {
      console.log('🔄 [ContextUpdateEngine] 컨텍스트 업데이트 제안 생성 시작...');

      const analysisReport = await this.patternAnalysisService.getLatestAnalysisReport();
      if (!analysisReport) {
        console.log('📊 [ContextUpdateEngine] 분석 보고서가 없습니다.');
        return [];
      }

      const updates: ContextUpdate[] = [];

      // 1. 승인된 패턴 기반 업데이트
      const approvedPatterns = analysisReport.suggestions.filter(s => (s as any).approved);
      for (const pattern of approvedPatterns) {
        const update = await this.createPatternUpdate(pattern);
        updates.push(update);
      }

      // 2. 응답 템플릿 업데이트
      const templateUpdates = await this.generateTemplateUpdates(analysisReport);
      updates.push(...templateUpdates);

      // 3. 지식 베이스 업데이트
      const knowledgeUpdates = await this.generateKnowledgeUpdates();
      updates.push(...knowledgeUpdates);

      // 4. 인텐트 매핑 업데이트
      const intentUpdates = await this.generateIntentUpdates();
      updates.push(...intentUpdates);

      // 대기 중인 업데이트에 추가
      for (const update of updates) {
        this.pendingUpdates.set(update.id, update);
      }

      console.log(`✅ [ContextUpdateEngine] ${updates.length}개의 컨텍스트 업데이트 제안 생성 완료`);
      return updates;

    } catch (error) {
      console.error('❌ [ContextUpdateEngine] 컨텍스트 업데이트 제안 생성 실패:', error);
      return [];
    }
  }

  /**
   * 자동 컨텍스트 업데이트 실행
   */
  async executeAutoUpdates(): Promise<number> {
    if (!this.config.enableAutoUpdate) {
      console.log('🔒 [ContextUpdateEngine] 자동 업데이트가 비활성화되어 있습니다.');
      return 0;
    }

    const highConfidenceUpdates = Array.from(this.pendingUpdates.values())
      .filter(update => 
        update.confidence >= this.config.autoApplyThreshold && 
        update.status === 'pending'
      )
      .slice(0, this.config.updateBatchSize);

    if (highConfidenceUpdates.length === 0) {
      console.log('📋 [ContextUpdateEngine] 자동 적용할 업데이트가 없습니다.');
      return 0;
    }

    // 백업 생성
    if (this.config.backupBeforeUpdate) {
      await this.createContextSnapshot();
    }

    let appliedCount = 0;
    for (const update of highConfidenceUpdates) {
      try {
        await this.applyUpdate(update);
        appliedCount++;
      } catch (error) {
        console.error(`❌ [ContextUpdateEngine] 업데이트 적용 실패: ${update.id}`, error);
      }
    }

    console.log(`✅ [ContextUpdateEngine] ${appliedCount}개의 자동 업데이트 적용 완료`);
    return appliedCount;
  }

  /**
   * 수동 업데이트 승인
   */
  async approveUpdate(updateId: string): Promise<boolean> {
    const update = this.pendingUpdates.get(updateId);
    if (!update) {
      console.error(`❌ [ContextUpdateEngine] 업데이트를 찾을 수 없습니다: ${updateId}`);
      return false;
    }

    try {
      await this.applyUpdate(update);
      console.log(`✅ [ContextUpdateEngine] 업데이트 수동 승인 완료: ${updateId}`);
      return true;
    } catch (error) {
      console.error(`❌ [ContextUpdateEngine] 업데이트 승인 실패: ${updateId}`, error);
      return false;
    }
  }

  /**
   * 업데이트 거부
   */
  async rejectUpdate(updateId: string, reason?: string): Promise<boolean> {
    const update = this.pendingUpdates.get(updateId);
    if (!update) {
      console.error(`❌ [ContextUpdateEngine] 업데이트를 찾을 수 없습니다: ${updateId}`);
      return false;
    }

    update.status = 'rejected';
    update.metadata = { ...update.metadata, rejectionReason: reason };
    
    this.pendingUpdates.delete(updateId);
    console.log(`❌ [ContextUpdateEngine] 업데이트 거부: ${updateId}`, reason);
    return true;
  }

  /**
   * 업데이트 적용
   */
  private async applyUpdate(update: ContextUpdate): Promise<void> {
    switch (update.type) {
      case 'pattern_addition':
        await this.applyPatternUpdate(update);
        break;
      case 'response_template':
        await this.applyTemplateUpdate(update);
        break;
      case 'knowledge_base':
        await this.applyKnowledgeUpdate(update);
        break;
      case 'intent_mapping':
        await this.applyIntentUpdate(update);
        break;
      default:
        throw new Error(`지원하지 않는 업데이트 타입: ${update.type}`);
    }

    update.status = 'applied';
    update.appliedAt = new Date();
    
    this.pendingUpdates.delete(update.id);
    this.appliedUpdates.push(update);

    console.log(`✅ [ContextUpdateEngine] 업데이트 적용 완료: ${update.id} (${update.type})`);
  }

  /**
   * 패턴 업데이트 적용
   */
  private async applyPatternUpdate(update: ContextUpdate): Promise<void> {
    const pattern = JSON.parse(update.content);
    this.currentContext.patterns.push(pattern.pattern);
    
    // TODO: 실제 AI 에이전트 패턴 저장소에 적용
    console.log(`🔧 [ContextUpdateEngine] 패턴 추가: ${pattern.pattern}`);
  }

  /**
   * 템플릿 업데이트 적용
   */
  private async applyTemplateUpdate(update: ContextUpdate): Promise<void> {
    const template = JSON.parse(update.content);
    this.currentContext.templates[template.key] = template.value;
    
    // TODO: 실제 응답 템플릿 시스템에 적용
    console.log(`📝 [ContextUpdateEngine] 템플릿 업데이트: ${template.key}`);
  }

  /**
   * 지식 베이스 업데이트 적용
   */
  private async applyKnowledgeUpdate(update: ContextUpdate): Promise<void> {
    const knowledge = JSON.parse(update.content);
    this.currentContext.knowledgeBase[knowledge.key] = knowledge.value;
    
    // TODO: 실제 지식 베이스에 적용
    console.log(`📚 [ContextUpdateEngine] 지식 베이스 업데이트: ${knowledge.key}`);
  }

  /**
   * 인텐트 매핑 업데이트 적용
   */
  private async applyIntentUpdate(update: ContextUpdate): Promise<void> {
    const intent = JSON.parse(update.content);
    this.currentContext.intentMappings[intent.pattern] = intent.intent;
    
    // TODO: 실제 인텐트 매핑 시스템에 적용
    console.log(`🎯 [ContextUpdateEngine] 인텐트 매핑 업데이트: ${intent.pattern} -> ${intent.intent}`);
  }

  /**
   * 패턴 업데이트 생성
   */
     private async createPatternUpdate(suggestion: PatternSuggestion): Promise<ContextUpdate> {
     return {
       id: this.generateUpdateId(),
       type: 'pattern_addition',
       content: JSON.stringify({
         pattern: suggestion.suggestedPattern,
         description: `자동 생성된 패턴 (제안 ID: ${suggestion.id})`,
         category: 'auto_generated'
       }),
       confidence: suggestion.confidenceScore,
       source: 'learning',
       timestamp: new Date(),
       status: 'pending',
       metadata: {
         suggestionId: suggestion.id,
         basedOnInteractions: suggestion.basedOnInteractions,
         estimatedImprovement: suggestion.estimatedImprovement
       }
     };
   }

  /**
   * 템플릿 업데이트 생성
   */
  private async generateTemplateUpdates(analysisReport: any): Promise<ContextUpdate[]> {
    const updates: ContextUpdate[] = [];
    
    // 자주 실패하는 질문 유형에 대한 새로운 템플릿 생성
    const failurePatterns = analysisReport.analysisResult?.patterns || [];
    
    for (const pattern of failurePatterns) {
      if (pattern.frequency > 5) { // 5회 이상 실패한 패턴
        const templateUpdate: ContextUpdate = {
          id: this.generateUpdateId(),
          type: 'response_template',
          content: JSON.stringify({
            key: `template_${pattern.category}`,
            value: this.generateResponseTemplate(pattern)
          }),
          confidence: 0.7,
          source: 'learning',
          timestamp: new Date(),
          status: 'pending',
          metadata: {
            patternId: pattern.id,
            failureCount: pattern.frequency
          }
        };
        updates.push(templateUpdate);
      }
    }

    return updates;
  }

  /**
   * 지식 베이스 업데이트 생성
   */
  private async generateKnowledgeUpdates(): Promise<ContextUpdate[]> {
    const updates: ContextUpdate[] = [];
    
    // 최근 상호작용에서 새로운 지식 추출
    const recentInteractions = await this.interactionLogger.getInteractions({
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 최근 7일
    });

    const successfulInteractions = recentInteractions.filter((i: any) => 
      i.userFeedback === 'helpful' && i.confidence > 0.8
    );

    // 성공적인 응답에서 지식 패턴 추출
    const knowledgePatterns = this.extractKnowledgePatterns(successfulInteractions);
    
    for (const pattern of knowledgePatterns) {
      const knowledgeUpdate: ContextUpdate = {
        id: this.generateUpdateId(),
        type: 'knowledge_base',
        content: JSON.stringify({
          key: pattern.key,
          value: pattern.value,
          context: pattern.context
        }),
        confidence: pattern.confidence,
        source: 'learning',
        timestamp: new Date(),
        status: 'pending',
        metadata: {
          sourceInteractions: pattern.sourceInteractions
        }
      };
      updates.push(knowledgeUpdate);
    }

    return updates;
  }

  /**
   * 인텐트 업데이트 생성
   */
  private async generateIntentUpdates(): Promise<ContextUpdate[]> {
    const updates: ContextUpdate[] = [];
    
    // 분류되지 않은 질문들에 대한 새로운 인텐트 매핑 생성
    const unclassifiedQueries = await this.getUnclassifiedQueries();
    
    for (const query of unclassifiedQueries) {
      const suggestedIntent = this.suggestIntent(query);
      
      if (suggestedIntent.confidence > 0.6) {
        const intentUpdate: ContextUpdate = {
          id: this.generateUpdateId(),
          type: 'intent_mapping',
          content: JSON.stringify({
            pattern: query.pattern,
            intent: suggestedIntent.intent,
            examples: query.examples
          }),
          confidence: suggestedIntent.confidence,
          source: 'learning',
          timestamp: new Date(),
          status: 'pending',
          metadata: {
            queryCount: query.count,
            examples: query.examples
          }
        };
        updates.push(intentUpdate);
      }
    }

    return updates;
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
      version: this.generateVersion()
    };

    this.contextSnapshots.push(snapshot);
    
    // 최대 10개의 스냅샷만 유지
    if (this.contextSnapshots.length > 10) {
      this.contextSnapshots.shift();
    }

    console.log(`📸 [ContextUpdateEngine] 컨텍스트 스냅샷 생성: ${snapshot.id}`);
    return snapshot;
  }

  /**
   * 컨텍스트 롤백
   */
  async rollbackToSnapshot(snapshotId: string): Promise<boolean> {
    const snapshot = this.contextSnapshots.find(s => s.id === snapshotId);
    if (!snapshot) {
      console.error(`❌ [ContextUpdateEngine] 스냅샷을 찾을 수 없습니다: ${snapshotId}`);
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
      version: '1.0.0'
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