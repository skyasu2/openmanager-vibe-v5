import { AILogProcessor } from './AILogProcessor';
import { FailurePriorityAnalyzer } from './FailurePriorityAnalyzer';
import { ContextChangelogManager } from './ContextChangelogManager';
import { ContextManager } from './ContextManager';
import { LogSaver } from './LogSaver';
import { VersionSwitcher } from './VersionSwitcher';
import { 
  AIAnalysisRequest, 
  AIAnalysisResponse, 
  AdminAnalysisSession, 
  QueryLogForAI,
  FailurePriority,
  QueryGroup,
  ImprovementHistory
} from '@/types/ai-learning';

export class AIAnalysisService {
  private static instance: AIAnalysisService;
  private logProcessor: AILogProcessor;
  private priorityAnalyzer: FailurePriorityAnalyzer;
  private changelogManager: ContextChangelogManager;
  private contextManager: ContextManager;
  private logSaver: LogSaver;
  private versionSwitcher: VersionSwitcher;
  private analysisSessions: Map<string, AdminAnalysisSession> = new Map();

  private constructor() {
    this.logProcessor = AILogProcessor.getInstance();
    this.priorityAnalyzer = FailurePriorityAnalyzer.getInstance();
    this.changelogManager = ContextChangelogManager.getInstance();
    this.contextManager = ContextManager.getInstance();
    this.logSaver = LogSaver.getInstance();
    this.versionSwitcher = VersionSwitcher.getInstance();
  }

  public static getInstance(): AIAnalysisService {
    if (!AIAnalysisService.instance) {
      AIAnalysisService.instance = new AIAnalysisService();
    }
    return AIAnalysisService.instance;
  }

  /**
   * 관리자 분석 세션 시작
   */
  async startAnalysisSession(
    adminId: string,
    analysisType: AIAnalysisRequest['analysisType'],
    timeRange: { start: Date; end: Date },
    options?: {
      focusArea?: AIAnalysisRequest['focusArea'];
      maxTokens?: number;
      model?: AIAnalysisRequest['model'];
      logLimit?: number;
    }
  ): Promise<AdminAnalysisSession> {
    try {
      console.log(`🔍 [AIAnalysisService] 분석 세션 시작: ${analysisType} (${adminId})`);

      // 분석 대상 로그 선별
      const logs = await this.logProcessor.selectLogsForAnalysis(
        timeRange,
        options?.focusArea,
        options?.logLimit || 500
      );

      if (logs.length === 0) {
        throw new Error('분석할 로그가 없습니다.');
      }

      // 분석 요청 생성
      const analysisRequest = this.logProcessor.createAnalysisRequest(
        analysisType,
        logs,
        timeRange,
        options
      );

      // 토큰 수 확인
      const estimatedTokens = this.logProcessor.estimateTokenCount(analysisRequest);
      if (estimatedTokens > (options?.maxTokens || 4000)) {
        console.warn(`⚠️ [AIAnalysisService] 토큰 수 초과 예상: ${estimatedTokens}`);
        
        // 로그 배치 분할
        const batches = this.logProcessor.splitLogsBatch(logs, 3000);
        console.log(`📦 [AIAnalysisService] ${batches.length}개 배치로 분할`);
        
        // 첫 번째 배치만 사용
        analysisRequest.logs = batches[0];
      }

      // 분석 세션 생성
      const session: AdminAnalysisSession = {
        id: this.generateSessionId(),
        timestamp: new Date().toISOString(),
        adminId,
        analysisRequest,
        adminNotes: '',
        approvedSuggestions: [],
        rejectedSuggestions: [],
        status: 'pending'
      };

      this.analysisSessions.set(session.id, session);

      console.log(`✅ [AIAnalysisService] 분석 세션 생성: ${session.id} (${logs.length}개 로그)`);
      return session;

    } catch (error) {
      console.error('❌ [AIAnalysisService] 분석 세션 시작 실패:', error);
      throw error;
    }
  }

  /**
   * AI 분석 실행 (현재는 구조화된 데이터 제공, 향후 LLM API 연동)
   */
  async executeAIAnalysis(sessionId: string): Promise<AIAnalysisResponse> {
    const session = this.analysisSessions.get(sessionId);
    if (!session) {
      throw new Error('분석 세션을 찾을 수 없습니다.');
    }

    try {
      console.log(`🤖 [AIAnalysisService] AI 분석 실행: ${sessionId}`);

      // 현재는 구조화된 분석 결과 생성 (향후 LLM API 호출로 대체)
      const aiResponse = await this.generateStructuredAnalysis(session.analysisRequest);

      // 세션 업데이트
      session.aiResponse = aiResponse;
      session.status = 'ai_analyzed';
      this.analysisSessions.set(sessionId, session);

      console.log(`✅ [AIAnalysisService] AI 분석 완료: ${sessionId}`);
      return aiResponse;

    } catch (error) {
      console.error('❌ [AIAnalysisService] AI 분석 실패:', error);
      throw error;
    }
  }

  /**
   * 관리자 검토 완료
   */
  async completeAdminReview(
    sessionId: string,
    adminNotes: string,
    approvedSuggestions: string[],
    rejectedSuggestions: string[]
  ): Promise<AdminAnalysisSession> {
    const session = this.analysisSessions.get(sessionId);
    if (!session) {
      throw new Error('분석 세션을 찾을 수 없습니다.');
    }

    session.adminNotes = adminNotes;
    session.approvedSuggestions = approvedSuggestions;
    session.rejectedSuggestions = rejectedSuggestions;
    session.status = 'admin_reviewed';

    this.analysisSessions.set(sessionId, session);

    console.log(`✅ [AIAnalysisService] 관리자 검토 완료: ${sessionId}`);
    return session;
  }

  /**
   * 분석 세션 목록 조회
   */
  getAnalysisSessions(adminId?: string): AdminAnalysisSession[] {
    const sessions = Array.from(this.analysisSessions.values());
    
    if (adminId) {
      return sessions.filter(session => session.adminId === adminId);
    }
    
    return sessions.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  /**
   * 분석 세션 조회
   */
  getAnalysisSession(sessionId: string): AdminAnalysisSession | undefined {
    return this.analysisSessions.get(sessionId);
  }

  /**
   * 분석 요약 생성
   */
  generateAnalysisSummary(logs: QueryLogForAI[], focusArea?: string): string {
    return this.logProcessor.generateAnalysisSummary(logs, focusArea);
  }

  /**
   * LLM API 연동 준비 (향후 구현)
   */
  async callLLMAPI(request: AIAnalysisRequest): Promise<AIAnalysisResponse> {
    // TODO: 실제 LLM API 호출 구현
    // - OpenAI GPT-4 API
    // - Anthropic Claude API
    // - 내부 모델 API
    
    console.log('🔮 [AIAnalysisService] LLM API 호출 (미구현)');
    
    // 현재는 구조화된 분석으로 대체
    return this.generateStructuredAnalysis(request);
  }

  /**
   * 우선순위 기반 실패 로그 분석
   */
  async getTopFailuresForReview(
    timeRange: { start: Date; end: Date },
    limit: number = 50
  ): Promise<FailurePriority[]> {
    return this.priorityAnalyzer.getTopFailuresForReview(timeRange, limit);
  }

  /**
   * 유사 질의 그룹핑 분석
   */
  async analyzeQueryGroups(
    timeRange: { start: Date; end: Date },
    similarityThreshold: number = 0.7
  ): Promise<{
    groups: QueryGroup[];
    improvements: Array<{
      groupId: string;
      priority: 'critical' | 'high' | 'medium' | 'low';
      suggestions: string[];
      estimatedImpact: number;
    }>;
  }> {
    try {
      console.log(`🔗 [AIAnalysisService] 유사 질의 그룹 분석 시작`);

      // 분석 대상 로그 조회
      const logs = await this.logProcessor.selectLogsForAnalysis(timeRange, undefined, 1000);
      
      // 유사 질의 그룹핑
      const groups = await this.priorityAnalyzer.groupSimilarQueries(logs, similarityThreshold);
      
      // 그룹별 개선 제안 생성
      const improvements = this.priorityAnalyzer.generateGroupImprovements(groups);

      console.log(`✅ [AIAnalysisService] ${groups.length}개 그룹, ${improvements.length}개 개선 제안 생성`);
      
      return { groups, improvements };

    } catch (error) {
      console.error('❌ [AIAnalysisService] 유사 질의 그룹 분석 실패:', error);
      throw error;
    }
  }

  /**
   * 개선 제안 승인 및 이력 기록
   */
  async approveImprovements(
    sessionId: string,
    adminId: string,
    approvedSuggestions: Array<{
      type: 'pattern' | 'intent' | 'response' | 'context';
      description: string;
      beforeValue?: string;
      afterValue: string;
      estimatedImpact: number;
    }>
  ): Promise<ImprovementHistory> {
    try {
      console.log(`✅ [AIAnalysisService] 개선 제안 승인 처리: ${sessionId}`);

      // 개선 이력 기록
      const history = await this.changelogManager.recordImprovement(
        adminId,
        sessionId,
        approvedSuggestions
      );

      // 세션 상태 업데이트
      const session = this.analysisSessions.get(sessionId);
      if (session) {
        session.status = 'implemented';
        session.approvedSuggestions = approvedSuggestions.map(s => s.description);
        this.analysisSessions.set(sessionId, session);
      }

      console.log(`🎉 [AIAnalysisService] 개선 제안 승인 완료: ${history.id}`);
      return history;

    } catch (error) {
      console.error('❌ [AIAnalysisService] 개선 제안 승인 실패:', error);
      throw error;
    }
  }

  /**
   * 개선 이력 조회
   */
  getImprovementHistory(filters?: {
    adminId?: string;
    startDate?: Date;
    endDate?: Date;
    status?: ImprovementHistory['status'];
  }): ImprovementHistory[] {
    return this.changelogManager.getImprovementHistory(filters);
  }

  /**
   * 최근 개선사항 요약
   */
  getRecentImprovements(days: number = 7): {
    totalChanges: number;
    byType: Record<string, number>;
    totalImpact: number;
    recentEntries: ImprovementHistory[];
  } {
    return this.changelogManager.getRecentChanges(days);
  }

  /**
   * 개선 효과 분석
   */
  analyzeImprovementEffects(): {
    totalImprovements: number;
    averageImpact: number;
    mostCommonType: string;
    improvementTrend: Array<{
      month: string;
      count: number;
      impact: number;
    }>;
  } {
    return this.changelogManager.analyzeImprovementEffects();
  }

  /**
   * Changelog 생성
   */
  generateChangelog(): string {
    return this.changelogManager.generateFullChangelog();
  }

  /**
   * 컨텍스트 문서 저장
   */
  async saveContextDocument(
    type: 'base' | 'advanced' | 'custom',
    filename: string,
    content: string,
    clientId?: string
  ): Promise<boolean> {
    try {
      console.log(`📝 [AIAnalysisService] 컨텍스트 문서 저장: ${type}/${filename}`);
      
      const success = await this.contextManager.saveContextDocument(type, filename, content, clientId);
      
      if (success) {
        // 로그 저장
        await this.logSaver.saveInteractionLog(
          this.logSaver.getCurrentDateString(),
          {
            type: 'context_document_saved',
            documentType: type,
            filename,
            clientId: clientId || null,
            contentLength: content.length
          }
        );
      }
      
      return success;
    } catch (error) {
      console.error('❌ [AIAnalysisService] 컨텍스트 문서 저장 실패:', error);
      return false;
    }
  }

  /**
   * 패턴 파일 저장
   */
  async savePatternFile(
    type: 'base' | 'advanced' | 'custom',
    filename: string,
    patterns: any,
    clientId?: string
  ): Promise<boolean> {
    try {
      console.log(`📝 [AIAnalysisService] 패턴 파일 저장: ${type}/${filename}`);
      
      const success = await this.contextManager.savePatternFile(type, filename, patterns, clientId);
      
      if (success) {
        // 로그 저장
        await this.logSaver.saveInteractionLog(
          this.logSaver.getCurrentDateString(),
          {
            type: 'pattern_file_saved',
            documentType: type,
            filename,
            clientId: clientId || null,
            patternCount: Object.keys(patterns.intentPatterns || {}).length
          }
        );
      }
      
      return success;
    } catch (error) {
      console.error('❌ [AIAnalysisService] 패턴 파일 저장 실패:', error);
      return false;
    }
  }

  /**
   * 통합 컨텍스트 로드
   */
  async loadMergedContext(clientId?: string): Promise<{
    knowledgeBase: string;
    patterns: any;
    metadata: {
      sources: string[];
      loadedAt: Date;
      version: string;
    };
  }> {
    try {
      console.log(`📖 [AIAnalysisService] 통합 컨텍스트 로드 시작`);
      
      const context = await this.contextManager.loadMergedContext(clientId);
      
      // 로그 저장
      await this.logSaver.saveInteractionLog(
        this.logSaver.getCurrentDateString(),
        {
          type: 'context_loaded',
          clientId: clientId || null,
          sourceCount: context.metadata.sources.length,
          knowledgeBaseLength: context.knowledgeBase.length
        }
      );
      
      return context;
    } catch (error) {
      console.error('❌ [AIAnalysisService] 통합 컨텍스트 로드 실패:', error);
      throw error;
    }
  }

  /**
   * 버전 전환
   */
  async switchContextVersion(
    type: 'base' | 'advanced' | 'custom',
    targetVersion: string,
    clientId?: string,
    createBackup: boolean = true
  ): Promise<{
    success: boolean;
    message: string;
    backupVersion?: string;
  }> {
    try {
      console.log(`🔄 [AIAnalysisService] 컨텍스트 버전 전환: ${type} → v${targetVersion}`);
      
      const result = await this.versionSwitcher.switchToVersion(type, targetVersion, clientId, createBackup);
      
      // 로그 저장
      await this.logSaver.saveInteractionLog(
        this.logSaver.getCurrentDateString(),
        {
          type: 'version_switched',
          documentType: type,
          targetVersion,
          clientId: clientId || null,
          success: result.success,
          backupVersion: result.backupVersion || null
        }
      );
      
      return result;
    } catch (error) {
      console.error('❌ [AIAnalysisService] 버전 전환 실패:', error);
      return {
        success: false,
        message: `버전 전환 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
      };
    }
  }

  /**
   * 릴리스 버전 생성
   */
  async createReleaseVersion(
    type: 'base' | 'advanced' | 'custom',
    version: string,
    clientId?: string,
    description?: string
  ): Promise<{
    success: boolean;
    message: string;
    versionPath?: string;
  }> {
    try {
      console.log(`📦 [AIAnalysisService] 릴리스 버전 생성: ${type} v${version}`);
      
      const result = await this.versionSwitcher.createReleaseVersion(type, version, clientId, description);
      
      // 로그 저장
      await this.logSaver.saveInteractionLog(
        this.logSaver.getCurrentDateString(),
        {
          type: 'release_version_created',
          documentType: type,
          version,
          clientId: clientId || null,
          description: description || null,
          success: result.success
        }
      );
      
      return result;
    } catch (error) {
      console.error('❌ [AIAnalysisService] 릴리스 버전 생성 실패:', error);
      return {
        success: false,
        message: `릴리스 버전 생성 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
      };
    }
  }

  /**
   * 사용 가능한 버전 목록 조회
   */
  async getAvailableVersions(
    type: 'base' | 'advanced' | 'custom',
    clientId?: string
  ): Promise<{
    current: string | null;
    versions: Array<{
      version: string;
      type: 'release' | 'backup';
      createdAt: Date;
      fileCount: number;
      size: string;
    }>;
  }> {
    try {
      return await this.versionSwitcher.getAvailableVersions(type, clientId);
    } catch (error) {
      console.error('❌ [AIAnalysisService] 버전 목록 조회 실패:', error);
      return { current: null, versions: [] };
    }
  }

  /**
   * 실패 로그 저장
   */
  async saveFailureAnalysisLog(failures: any[]): Promise<boolean> {
    try {
      const date = this.logSaver.getCurrentDateString();
      const success = await this.logSaver.saveFailureLog(date, failures);
      
      if (success) {
        console.log(`✅ [AIAnalysisService] 실패 분석 로그 저장 완료: ${failures.length}개`);
      }
      
      return success;
    } catch (error) {
      console.error('❌ [AIAnalysisService] 실패 로그 저장 실패:', error);
      return false;
    }
  }

  /**
   * 개선 로그 저장
   */
  async saveImprovementAnalysisLog(improvements: any[]): Promise<boolean> {
    try {
      const date = this.logSaver.getCurrentDateString();
      const success = await this.logSaver.saveImprovementLog(date, improvements);
      
      if (success) {
        console.log(`✅ [AIAnalysisService] 개선 분석 로그 저장 완료: ${improvements.length}개`);
      }
      
      return success;
    } catch (error) {
      console.error('❌ [AIAnalysisService] 개선 로그 저장 실패:', error);
      return false;
    }
  }

  /**
   * 로그 통계 조회
   */
  async getLogStatistics(): Promise<{
    categories: Record<string, number>;
    totalFiles: number;
    totalSize: string;
    oldestLog: string | null;
    newestLog: string | null;
  }> {
    try {
      return await this.logSaver.getLogStatistics();
    } catch (error) {
      console.error('❌ [AIAnalysisService] 로그 통계 조회 실패:', error);
      return {
        categories: {},
        totalFiles: 0,
        totalSize: '0B',
        oldestLog: null,
        newestLog: null
      };
    }
  }

  /**
   * 버전 비교
   */
  async compareVersions(
    type: 'base' | 'advanced' | 'custom',
    version1: string,
    version2: string,
    clientId?: string
  ): Promise<{
    success: boolean;
    comparison?: {
      version1: { path: string; files: string[]; };
      version2: { path: string; files: string[]; };
      differences: {
        added: string[];
        removed: string[];
        modified: string[];
      };
    };
    message: string;
  }> {
    try {
      return await this.versionSwitcher.compareVersions(type, version1, version2, clientId);
    } catch (error) {
      console.error('❌ [AIAnalysisService] 버전 비교 실패:', error);
      return {
        success: false,
        message: `버전 비교 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
      };
    }
  }

  /**
   * 고급 분석 실행 (우선순위 + 그룹핑 통합)
   */
  async executeAdvancedAnalysis(
    timeRange: { start: Date; end: Date },
    options?: {
      priorityLimit?: number;
      similarityThreshold?: number;
      includeFullText?: boolean;
    }
  ): Promise<{
    topFailures: FailurePriority[];
    queryGroups: QueryGroup[];
    groupImprovements: Array<{
      groupId: string;
      priority: 'critical' | 'high' | 'medium' | 'low';
      suggestions: string[];
      estimatedImpact: number;
    }>;
    summary: {
      totalFailures: number;
      totalGroups: number;
      criticalIssues: number;
      estimatedTotalImpact: number;
    };
  }> {
    try {
      console.log(`🚀 [AIAnalysisService] 고급 분석 실행 시작`);

      const {
        priorityLimit = 50,
        similarityThreshold = 0.7,
        includeFullText = false
      } = options || {};

      // 병렬로 분석 실행
      const [topFailures, groupAnalysis] = await Promise.all([
        this.getTopFailuresForReview(timeRange, priorityLimit),
        this.analyzeQueryGroups(timeRange, similarityThreshold)
      ]);

      const { groups: queryGroups, improvements: groupImprovements } = groupAnalysis;

      // 요약 통계 계산
      const criticalIssues = [
        ...topFailures.filter(f => f.urgencyLevel === 'critical'),
        ...groupImprovements.filter(g => g.priority === 'critical')
      ].length;

      const estimatedTotalImpact = groupImprovements.reduce(
        (sum, improvement) => sum + improvement.estimatedImpact, 0
      );

      const summary = {
        totalFailures: topFailures.length,
        totalGroups: queryGroups.length,
        criticalIssues,
        estimatedTotalImpact
      };

      console.log(`✅ [AIAnalysisService] 고급 분석 완료:`, summary);

      return {
        topFailures,
        queryGroups,
        groupImprovements,
        summary
      };

    } catch (error) {
      console.error('❌ [AIAnalysisService] 고급 분석 실패:', error);
      throw error;
    }
  }

  // Private 메서드들
  private async generateStructuredAnalysis(request: AIAnalysisRequest): Promise<AIAnalysisResponse> {
    const { analysisType, logs } = request;

    // 기본 통계 분석
    const stats = this.calculateLogStatistics(logs);
    
    // 분석 타입별 결과 생성
    let findings: AIAnalysisResponse['findings'];
    let summary: string;
    let recommendations: string[];
    let nextSteps: string[];

    switch (analysisType) {
      case 'pattern_discovery':
        findings = this.analyzePatterns(logs);
        summary = `${logs.length}개 로그에서 ${findings.patterns.length}개 패턴 발견`;
        recommendations = this.generatePatternRecommendations(findings.patterns);
        nextSteps = ['패턴 검증', '새로운 정규식 생성', 'A/B 테스트 실행'];
        break;

      case 'failure_analysis':
        findings = this.analyzeFailures(logs);
        summary = `실패 분석: ${findings.improvements.length}개 개선 영역 식별`;
        recommendations = this.generateFailureRecommendations(findings.improvements);
        nextSteps = ['실패 원인 상세 분석', '개선 방안 구현', '성능 모니터링'];
        break;

      case 'improvement_suggestion':
        findings = this.analyzeImprovements(logs);
        summary = `개선 제안: ${findings.improvements.length}개 우선순위 개선사항`;
        recommendations = this.generateImprovementRecommendations(findings.improvements);
        nextSteps = ['우선순위 검토', '구현 계획 수립', '효과 측정'];
        break;

      case 'intent_classification':
        findings = this.analyzeIntents(logs);
        summary = `인텐트 분석: ${findings.newIntents.length}개 새로운 인텐트 후보`;
        recommendations = this.generateIntentRecommendations(findings.newIntents);
        nextSteps = ['인텐트 정의', '패턴 매핑', '분류 정확도 테스트'];
        break;

      default:
        throw new Error(`지원하지 않는 분석 타입: ${analysisType}`);
    }

    return {
      id: this.generateAnalysisId(),
      timestamp: new Date().toISOString(),
      analysisType,
      model: request.model || 'structured_analysis',
      tokensUsed: this.logProcessor.estimateTokenCount(request),
      findings,
      summary,
      recommendations,
      nextSteps
    };
  }

  private calculateLogStatistics(logs: QueryLogForAI[]) {
    return {
      total: logs.length,
      withFeedback: logs.filter(log => log.feedback).length,
      negativeFeedback: logs.filter(log => 
        log.feedback === 'not_helpful' || log.feedback === 'incorrect'
      ).length,
      lowConfidence: logs.filter(log => log.confidence < 0.7).length,
      avgConfidence: logs.reduce((sum, log) => sum + log.confidence, 0) / logs.length,
      avgResponseTime: logs.reduce((sum, log) => sum + log.responseTime, 0) / logs.length
    };
  }

  private analyzePatterns(logs: QueryLogForAI[]): AIAnalysisResponse['findings'] {
    const patternMap = new Map<string, { count: number; examples: string[] }>();
    
    logs.forEach(log => {
      const pattern = this.extractQueryPattern(log.query);
      const existing = patternMap.get(pattern);
      
      if (existing) {
        existing.count++;
        if (existing.examples.length < 3) {
          existing.examples.push(log.query);
        }
      } else {
        patternMap.set(pattern, { count: 1, examples: [log.query] });
      }
    });

    const patterns = Array.from(patternMap.entries())
      .filter(([, data]) => data.count >= 2)
      .map(([pattern, data]) => ({
        pattern,
        frequency: data.count,
        confidence: Math.min(0.9, data.count / logs.length * 10),
        examples: data.examples
      }))
      .sort((a, b) => b.frequency - a.frequency);

    return {
      patterns,
      improvements: [],
      newIntents: []
    };
  }

  private analyzeFailures(logs: QueryLogForAI[]): AIAnalysisResponse['findings'] {
    const failureLogs = logs.filter(log => 
      log.feedback === 'not_helpful' || 
      log.feedback === 'incorrect' || 
      log.confidence < 0.5
    );

    const improvements = [
      {
        area: '낮은 신뢰도 응답',
        suggestion: `${failureLogs.filter(log => log.confidence < 0.5).length}개 응답의 신뢰도 개선 필요`,
        priority: 'high' as const,
        estimatedImpact: 80
      },
      {
        area: '부정적 피드백',
        suggestion: `${failureLogs.filter(log => log.feedback === 'not_helpful').length}개 응답의 유용성 개선 필요`,
        priority: 'medium' as const,
        estimatedImpact: 60
      }
    ].filter(improvement => improvement.estimatedImpact > 0);

    return {
      patterns: [],
      improvements,
      newIntents: []
    };
  }

  private analyzeImprovements(logs: QueryLogForAI[]): AIAnalysisResponse['findings'] {
    const improvements = [];

    // 응답 시간 개선
    const slowLogs = logs.filter(log => log.responseTime > 3000);
    if (slowLogs.length > 0) {
      improvements.push({
        area: '응답 시간',
        suggestion: `${slowLogs.length}개 응답의 속도 개선 필요 (평균 ${Math.round(slowLogs.reduce((sum, log) => sum + log.responseTime, 0) / slowLogs.length)}ms)`,
        priority: 'medium' as const,
        estimatedImpact: 40
      });
    }

    // 신뢰도 개선
    const lowConfidenceLogs = logs.filter(log => log.confidence < 0.8);
    if (lowConfidenceLogs.length > 0) {
      improvements.push({
        area: '신뢰도',
        suggestion: `${lowConfidenceLogs.length}개 응답의 신뢰도 개선 필요`,
        priority: 'high' as const,
        estimatedImpact: 70
      });
    }

    return {
      patterns: [],
      improvements,
      newIntents: []
    };
  }

  private analyzeIntents(logs: QueryLogForAI[]): AIAnalysisResponse['findings'] {
    const unknownIntentLogs = logs.filter(log => 
      log.intent === 'unknown' || log.confidence < 0.5
    );

    const intentCandidates = new Map<string, string[]>();
    
    unknownIntentLogs.forEach(log => {
      const suggestedIntent = this.suggestIntent(log.query);
      const existing = intentCandidates.get(suggestedIntent);
      
      if (existing) {
        existing.push(log.query);
      } else {
        intentCandidates.set(suggestedIntent, [log.query]);
      }
    });

    const newIntents = Array.from(intentCandidates.entries())
      .filter(([, queries]) => queries.length >= 2)
      .map(([intent, queries]) => ({
        intent,
        patterns: queries.slice(0, 3),
        confidence: Math.min(0.8, queries.length / unknownIntentLogs.length * 5)
      }));

    return {
      patterns: [],
      improvements: [],
      newIntents
    };
  }

  private extractQueryPattern(query: string): string {
    // 간단한 패턴 추출 (실제로는 더 정교한 NLP 처리)
    const words = query.toLowerCase().split(' ');
    const keywords = words.filter(word => 
      ['서버', '상태', 'cpu', '메모리', '디스크', '네트워크', '알림', '에러'].includes(word)
    );
    
    return keywords.length > 0 ? keywords.join(' ') : '기타';
  }

  private suggestIntent(query: string): string {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('서버') && lowerQuery.includes('상태')) return 'server_status';
    if (lowerQuery.includes('cpu') || lowerQuery.includes('메모리')) return 'performance_check';
    if (lowerQuery.includes('에러') || lowerQuery.includes('오류')) return 'error_analysis';
    if (lowerQuery.includes('알림') || lowerQuery.includes('경고')) return 'alert_management';
    
    return 'general_inquiry';
  }

  private generatePatternRecommendations(patterns: any[]): string[] {
    return [
      `${patterns.length}개의 새로운 패턴을 정규식으로 변환하세요`,
      '고빈도 패턴부터 우선 적용하세요',
      'A/B 테스트를 통해 패턴 효과를 검증하세요'
    ];
  }

  private generateFailureRecommendations(improvements: any[]): string[] {
    return [
      '높은 우선순위 개선사항부터 처리하세요',
      '실패 원인을 상세히 분석하세요',
      '개선 후 성능 변화를 모니터링하세요'
    ];
  }

  private generateImprovementRecommendations(improvements: any[]): string[] {
    return [
      '영향도가 높은 개선사항부터 구현하세요',
      '구현 전후 성능을 비교 측정하세요',
      '사용자 피드백을 지속적으로 수집하세요'
    ];
  }

  private generateIntentRecommendations(intents: any[]): string[] {
    return [
      '새로운 인텐트 정의를 검토하세요',
      '기존 인텐트와의 중복성을 확인하세요',
      '인텐트별 응답 템플릿을 준비하세요'
    ];
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateAnalysisId(): string {
    return `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
} 