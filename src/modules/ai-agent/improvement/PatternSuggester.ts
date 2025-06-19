import {
  UserInteractionLog,
  PatternSuggestion,
  QuestionType,
} from '@/types/ai-learning';
import { QuestionGroup } from '../analytics/FailureAnalyzer';

export interface RegexPattern {
  id: string;
  pattern: string;
  description: string;
  category: string;
  confidence: number;
  testCases: string[];
  expectedMatches: number;
}

export interface ResponseTemplate {
  id: string;
  category: string;
  template: string;
  variables: string[];
  examples: string[];
  applicablePatterns: string[];
}

export interface PatternSuggesterConfig {
  minGroupSize: number;
  maxSuggestions: number;
  confidenceThreshold: number;
  similarityThreshold: number;
}

export class PatternSuggester {
  private config: PatternSuggesterConfig;

  constructor(config?: Partial<PatternSuggesterConfig>) {
    this.config = {
      minGroupSize: 3,
      maxSuggestions: 20,
      confidenceThreshold: 0.7,
      similarityThreshold: 0.6,
      ...config,
    };
  }

  /**
   * 유사 질문 그룹핑
   */
  async groupSimilarQuestions(questions: string[]): Promise<QuestionGroup[]> {
    const groups: QuestionGroup[] = [];
    const processed = new Set<string>();

    for (const question of questions) {
      if (processed.has(question)) continue;

      const similarQuestions = this.findSimilarQuestions(question, questions);

      if (similarQuestions.length >= this.config.minGroupSize) {
        const group = this.createQuestionGroup(similarQuestions);
        groups.push(group);

        // 처리된 질문들 마킹
        similarQuestions.forEach(q => processed.add(q));
      }
    }

    // 빈도순으로 정렬
    groups.sort((a, b) => b.frequency - a.frequency);

    console.log(`🔗 [PatternSuggester] 질문 그룹핑 완료:`, {
      totalQuestions: questions.length,
      groupsCreated: groups.length,
      averageGroupSize:
        groups.length > 0
          ? Math.round(
              groups.reduce((sum, g) => sum + g.frequency, 0) / groups.length
            )
          : 0,
    });

    return groups.slice(0, this.config.maxSuggestions);
  }

  /**
   * 새로운 정규식 패턴 생성
   */
  async generateRegexPatterns(
    questionGroup: QuestionGroup
  ): Promise<RegexPattern[]> {
    const patterns: RegexPattern[] = [];

    // 1. 키워드 기반 패턴
    const keywordPattern = this.generateKeywordPattern(questionGroup);
    if (keywordPattern) {
      patterns.push(keywordPattern);
    }

    // 2. 구조 기반 패턴
    const structurePattern = this.generateStructurePattern(questionGroup);
    if (structurePattern) {
      patterns.push(structurePattern);
    }

    // 3. 의미 기반 패턴
    const semanticPattern = this.generateSemanticPattern(questionGroup);
    if (semanticPattern) {
      patterns.push(semanticPattern);
    }

    // 신뢰도 기준으로 필터링
    const validPatterns = patterns.filter(
      p => p.confidence >= this.config.confidenceThreshold
    );

    console.log(`🎯 [PatternSuggester] 정규식 패턴 생성 완료:`, {
      groupId: questionGroup.id,
      patternsGenerated: patterns.length,
      validPatterns: validPatterns.length,
      category: questionGroup.suggestedCategory,
    });

    return validPatterns;
  }

  /**
   * 응답 템플릿 제안
   */
  async suggestResponseTemplates(
    questionGroup: QuestionGroup,
    contextData?: any
  ): Promise<ResponseTemplate[]> {
    const templates: ResponseTemplate[] = [];
    const category = questionGroup.suggestedCategory;

    // 카테고리별 템플릿 생성
    switch (category) {
      case 'CPU 모니터링':
        templates.push(this.createCPUMonitoringTemplate(questionGroup));
        break;
      case '메모리 관리':
        templates.push(this.createMemoryManagementTemplate(questionGroup));
        break;
      case '네트워크 모니터링':
        templates.push(this.createNetworkMonitoringTemplate(questionGroup));
        break;
      case '장애 대응':
        templates.push(this.createIncidentResponseTemplate(questionGroup));
        break;
      case '서버 관리':
        templates.push(this.createServerManagementTemplate(questionGroup));
        break;
      default:
        templates.push(this.createGenericTemplate(questionGroup));
    }

    // 컨텍스트 기반 추가 템플릿
    if (contextData) {
      const contextTemplate = this.createContextAwareTemplate(
        questionGroup,
        contextData
      );
      if (contextTemplate) {
        templates.push(contextTemplate);
      }
    }

    console.log(`📝 [PatternSuggester] 응답 템플릿 제안 완료:`, {
      category,
      templatesCreated: templates.length,
      groupSize: questionGroup.frequency,
    });

    return templates;
  }

  /**
   * 패턴 제안 생성
   */
  async generatePatternSuggestions(
    interactions: UserInteractionLog[],
    questionGroups: QuestionGroup[]
  ): Promise<PatternSuggestion[]> {
    const suggestions: PatternSuggestion[] = [];

    for (const group of questionGroups) {
      // 해당 그룹의 상호작용들 찾기
      const groupInteractions = interactions.filter(i =>
        group.questions.includes(i.query)
      );

      if (groupInteractions.length === 0) continue;

      // 정규식 패턴 생성
      const regexPatterns = await this.generateRegexPatterns(group);

      for (const regexPattern of regexPatterns) {
        const suggestion: PatternSuggestion = {
          id: this.generateSuggestionId(),
          suggestedPattern: regexPattern.pattern,
          basedOnInteractions: groupInteractions.map(i => i.id),
          confidenceScore: regexPattern.confidence,
          estimatedImprovement:
            this.calculateEstimatedImprovement(groupInteractions),
          status: 'pending',
          createdAt: new Date(),
        };

        suggestions.push(suggestion);
      }
    }

    // 예상 개선 효과순으로 정렬
    suggestions.sort((a, b) => b.estimatedImprovement - a.estimatedImprovement);

    console.log(`💡 [PatternSuggester] 패턴 제안 생성 완료:`, {
      totalSuggestions: suggestions.length,
      highConfidenceSuggestions: suggestions.filter(
        s => s.confidenceScore > 0.8
      ).length,
      averageImprovement:
        suggestions.length > 0
          ? Math.round(
              suggestions.reduce((sum, s) => sum + s.estimatedImprovement, 0) /
                suggestions.length
            )
          : 0,
    });

    return suggestions.slice(0, this.config.maxSuggestions);
  }

  /**
   * 유사 질문 찾기
   */
  private findSimilarQuestions(
    targetQuestion: string,
    allQuestions: string[]
  ): string[] {
    const similar = [targetQuestion];
    const targetKeywords = this.extractKeywords(targetQuestion);
    const targetStructure = this.analyzeQuestionStructure(targetQuestion);

    for (const question of allQuestions) {
      if (question === targetQuestion) continue;

      const similarity = this.calculateSimilarity(
        targetQuestion,
        question,
        targetKeywords,
        targetStructure
      );

      if (similarity >= this.config.similarityThreshold) {
        similar.push(question);
      }
    }

    return similar;
  }

  /**
   * 질문 그룹 생성
   */
  private createQuestionGroup(questions: string[]): QuestionGroup {
    const allKeywords = questions.flatMap(q => this.extractKeywords(q));
    const keywordFreq = this.calculateKeywordFrequency(allKeywords);
    const commonKeywords = Object.entries(keywordFreq)
      .filter(([_, freq]) => freq >= Math.ceil(questions.length * 0.3))
      .map(([keyword, _]) => keyword)
      .slice(0, 10);

    const pattern = this.generateGroupPattern(commonKeywords);
    const category = this.categorizeQuestions(questions, commonKeywords);

    return {
      id: this.generateGroupId(),
      pattern,
      questions,
      frequency: questions.length,
      averageConfidence: this.calculateAverageConfidence([]),
      commonKeywords,
      suggestedCategory: category,
    };
  }

  /**
   * 키워드 추출
   */
  private extractKeywords(text: string): string[] {
    const normalized = text
      .toLowerCase()
      .replace(/[^\w\s가-힣]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const words = normalized.split(' ').filter(word => word.length > 1);

    // 불용어 제거
    const stopWords = [
      '은',
      '는',
      '이',
      '가',
      '을',
      '를',
      '에',
      '의',
      '와',
      '과',
      '도',
      '만',
      '부터',
      '까지',
      '어떻게',
      '무엇',
      '언제',
      '어디서',
    ];
    return words.filter(word => !stopWords.includes(word));
  }

  /**
   * 질문 구조 분석
   */
  private analyzeQuestionStructure(question: string): any {
    return {
      hasQuestion: /[?？]/.test(question),
      hasCommand: /해주세요|확인|조회|분석|해결/.test(question),
      hasNumbers: /\d+/.test(question),
      length: question.length,
      wordCount: question.split(/\s+/).length,
    };
  }

  /**
   * 유사도 계산
   */
  private calculateSimilarity(
    q1: string,
    q2: string,
    keywords1: string[],
    structure1: any
  ): number {
    const keywords2 = this.extractKeywords(q2);
    const structure2 = this.analyzeQuestionStructure(q2);

    // 키워드 유사도 (50%)
    const commonKeywords = keywords1.filter(k => keywords2.includes(k));
    const keywordSimilarity =
      commonKeywords.length / Math.max(keywords1.length, keywords2.length, 1);

    // 구조 유사도 (30%)
    let structureSimilarity = 0;
    if (structure1.hasQuestion === structure2.hasQuestion)
      structureSimilarity += 0.3;
    if (structure1.hasCommand === structure2.hasCommand)
      structureSimilarity += 0.3;
    if (Math.abs(structure1.wordCount - structure2.wordCount) <= 2)
      structureSimilarity += 0.4;

    // 길이 유사도 (20%)
    const lengthDiff = Math.abs(structure1.length - structure2.length);
    const lengthSimilarity = Math.max(
      0,
      1 - lengthDiff / Math.max(structure1.length, structure2.length)
    );

    return (
      keywordSimilarity * 0.5 +
      structureSimilarity * 0.3 +
      lengthSimilarity * 0.2
    );
  }

  /**
   * 키워드 빈도 계산
   */
  private calculateKeywordFrequency(
    keywords: string[]
  ): Record<string, number> {
    const freq: Record<string, number> = {};
    keywords.forEach(keyword => {
      freq[keyword] = (freq[keyword] || 0) + 1;
    });
    return freq;
  }

  /**
   * 그룹 패턴 생성
   */
  private generateGroupPattern(commonKeywords: string[]): string {
    if (commonKeywords.length === 0) return 'general_query';

    const primaryKeywords = commonKeywords.slice(0, 3);
    return primaryKeywords.join('_');
  }

  /**
   * 질문 분류
   */
  private categorizeQuestions(questions: string[], keywords: string[]): string {
    const keywordStr = keywords.join(' ').toLowerCase();

    if (keywordStr.includes('cpu') || keywordStr.includes('프로세서'))
      return 'CPU 모니터링';
    if (keywordStr.includes('메모리') || keywordStr.includes('ram'))
      return '메모리 관리';
    if (keywordStr.includes('네트워크') || keywordStr.includes('통신'))
      return '네트워크 모니터링';
    if (keywordStr.includes('디스크') || keywordStr.includes('저장'))
      return '스토리지 관리';
    if (keywordStr.includes('로그') || keywordStr.includes('기록'))
      return '로그 분석';
    if (
      keywordStr.includes('에러') ||
      keywordStr.includes('장애') ||
      keywordStr.includes('오류')
    )
      return '장애 대응';
    if (keywordStr.includes('서버') || keywordStr.includes('시스템'))
      return '서버 관리';

    return '일반 질의';
  }

  /**
   * 키워드 기반 패턴 생성
   */
  private generateKeywordPattern(group: QuestionGroup): RegexPattern | null {
    if (group.commonKeywords.length < 2) return null;

    const keywords = group.commonKeywords.slice(0, 3);
    const pattern = `(${keywords.join('|')}).*`;

    return {
      id: this.generatePatternId(),
      pattern,
      description: `${keywords.join(', ')} 키워드를 포함하는 질문 패턴`,
      category: group.suggestedCategory,
      confidence: Math.min(0.9, 0.6 + keywords.length * 0.1),
      testCases: group.questions.slice(0, 5),
      expectedMatches: group.frequency,
    };
  }

  /**
   * 구조 기반 패턴 생성
   */
  private generateStructurePattern(group: QuestionGroup): RegexPattern | null {
    const structures = group.questions.map(q =>
      this.analyzeQuestionStructure(q)
    );
    const hasQuestionMark =
      structures.filter(s => s.hasQuestion).length > structures.length * 0.7;
    const hasCommand =
      structures.filter(s => s.hasCommand).length > structures.length * 0.7;

    if (!hasQuestionMark && !hasCommand) return null;

    let pattern = '';
    if (hasCommand) {
      pattern = '.*(확인|조회|분석|해결|해주세요).*';
    } else if (hasQuestionMark) {
      pattern = '.*[?？]$';
    }

    return {
      id: this.generatePatternId(),
      pattern,
      description: `${group.suggestedCategory} 관련 ${hasCommand ? '명령형' : '질문형'} 패턴`,
      category: group.suggestedCategory,
      confidence: 0.75,
      testCases: group.questions.slice(0, 5),
      expectedMatches: group.frequency,
    };
  }

  /**
   * 의미 기반 패턴 생성
   */
  private generateSemanticPattern(group: QuestionGroup): RegexPattern | null {
    const category = group.suggestedCategory;
    let pattern = '';

    switch (category) {
      case 'CPU 모니터링':
        pattern = '.*(cpu|프로세서|사용률|부하).*';
        break;
      case '메모리 관리':
        pattern = '.*(메모리|ram|사용량|부족).*';
        break;
      case '네트워크 모니터링':
        pattern = '.*(네트워크|통신|연결|지연).*';
        break;
      case '장애 대응':
        pattern = '.*(에러|오류|장애|문제|해결).*';
        break;
      default:
        return null;
    }

    return {
      id: this.generatePatternId(),
      pattern,
      description: `${category} 관련 의미 기반 패턴`,
      category,
      confidence: 0.8,
      testCases: group.questions.slice(0, 5),
      expectedMatches: group.frequency,
    };
  }

  /**
   * 응답 템플릿 생성 메서드들
   */
  private createCPUMonitoringTemplate(group: QuestionGroup): ResponseTemplate {
    return {
      id: this.generateTemplateId(),
      category: 'CPU 모니터링',
      template: `🖥️ **CPU 상태 분석 결과**

**현재 CPU 사용률**: {{cpu_usage}}%
**평균 부하**: {{load_average}}
**프로세스 수**: {{process_count}}개

{{#if high_cpu}}
⚠️ **높은 CPU 사용률 감지**
- 상위 프로세스: {{top_processes}}
- 권장 조치: {{recommendations}}
{{/if}}

**상세 분석**:
{{detailed_analysis}}`,
      variables: [
        'cpu_usage',
        'load_average',
        'process_count',
        'high_cpu',
        'top_processes',
        'recommendations',
        'detailed_analysis',
      ],
      examples: group.questions.slice(0, 3),
      applicablePatterns: [group.pattern],
    };
  }

  private createMemoryManagementTemplate(
    group: QuestionGroup
  ): ResponseTemplate {
    return {
      id: this.generateTemplateId(),
      category: '메모리 관리',
      template: `💾 **메모리 상태 분석 결과**

**총 메모리**: {{total_memory}}GB
**사용 중**: {{used_memory}}GB ({{memory_percentage}}%)
**사용 가능**: {{available_memory}}GB

{{#if memory_warning}}
⚠️ **메모리 부족 경고**
- 메모리 사용량이 높습니다
- 권장 조치: {{memory_recommendations}}
{{/if}}

**메모리 사용 상위 프로세스**:
{{top_memory_processes}}`,
      variables: [
        'total_memory',
        'used_memory',
        'memory_percentage',
        'available_memory',
        'memory_warning',
        'memory_recommendations',
        'top_memory_processes',
      ],
      examples: group.questions.slice(0, 3),
      applicablePatterns: [group.pattern],
    };
  }

  private createNetworkMonitoringTemplate(
    group: QuestionGroup
  ): ResponseTemplate {
    return {
      id: this.generateTemplateId(),
      category: '네트워크 모니터링',
      template: `🌐 **네트워크 상태 분석 결과**

**연결 상태**: {{connection_status}}
**네트워크 지연**: {{latency}}ms
**대역폭 사용률**: {{bandwidth_usage}}%

{{#if network_issues}}
⚠️ **네트워크 문제 감지**
- 문제 유형: {{issue_type}}
- 영향 범위: {{affected_services}}
- 권장 조치: {{network_recommendations}}
{{/if}}

**상세 정보**:
{{network_details}}`,
      variables: [
        'connection_status',
        'latency',
        'bandwidth_usage',
        'network_issues',
        'issue_type',
        'affected_services',
        'network_recommendations',
        'network_details',
      ],
      examples: group.questions.slice(0, 3),
      applicablePatterns: [group.pattern],
    };
  }

  private createIncidentResponseTemplate(
    group: QuestionGroup
  ): ResponseTemplate {
    return {
      id: this.generateTemplateId(),
      category: '장애 대응',
      template: `🚨 **장애 대응 가이드**

**장애 유형**: {{incident_type}}
**심각도**: {{severity_level}}
**영향 범위**: {{impact_scope}}

**즉시 조치사항**:
{{immediate_actions}}

**단계별 해결 방안**:
{{step_by_step_solution}}

**추가 모니터링 항목**:
{{monitoring_items}}`,
      variables: [
        'incident_type',
        'severity_level',
        'impact_scope',
        'immediate_actions',
        'step_by_step_solution',
        'monitoring_items',
      ],
      examples: group.questions.slice(0, 3),
      applicablePatterns: [group.pattern],
    };
  }

  private createServerManagementTemplate(
    group: QuestionGroup
  ): ResponseTemplate {
    return {
      id: this.generateTemplateId(),
      category: '서버 관리',
      template: `🖥️ **서버 관리 정보**

**서버 상태**: {{server_status}}
**가동 시간**: {{uptime}}
**시스템 로드**: {{system_load}}

**주요 지표**:
- CPU: {{cpu_status}}
- 메모리: {{memory_status}}
- 디스크: {{disk_status}}
- 네트워크: {{network_status}}

**권장 작업**:
{{recommended_actions}}`,
      variables: [
        'server_status',
        'uptime',
        'system_load',
        'cpu_status',
        'memory_status',
        'disk_status',
        'network_status',
        'recommended_actions',
      ],
      examples: group.questions.slice(0, 3),
      applicablePatterns: [group.pattern],
    };
  }

  private createGenericTemplate(group: QuestionGroup): ResponseTemplate {
    return {
      id: this.generateTemplateId(),
      category: '일반 질의',
      template: `📋 **질의 응답**

**요청 내용**: {{user_query}}
**분석 결과**: {{analysis_result}}

**상세 정보**:
{{detailed_information}}

**추가 도움말**:
{{additional_help}}`,
      variables: [
        'user_query',
        'analysis_result',
        'detailed_information',
        'additional_help',
      ],
      examples: group.questions.slice(0, 3),
      applicablePatterns: [group.pattern],
    };
  }

  private createContextAwareTemplate(
    group: QuestionGroup,
    contextData: any
  ): ResponseTemplate | null {
    if (!contextData || typeof contextData !== 'object') {
      return null;
    }

    // 컨텍스트 데이터 분석
    const hasServerMetrics =
      contextData.servers && Array.isArray(contextData.servers);
    const hasTimeRange = contextData.timeRange && contextData.timeRange.start;
    const hasUserPreferences =
      contextData.userPreferences && contextData.userPreferences.language;
    const hasErrorLogs =
      contextData.errorLogs && Array.isArray(contextData.errorLogs);

    // 컨텍스트 기반 동적 템플릿 생성
    let template = `🎯 **컨텍스트 기반 분석 결과**\n\n`;
    let variables: string[] = ['user_query', 'context_summary'];
    let category = '컨텍스트 인식';

    // 서버 메트릭 컨텍스트
    if (hasServerMetrics) {
      template += `**서버 현황**:\n`;
      template += `- 총 서버 수: {{server_count}}개\n`;
      template += `- 온라인 서버: {{online_servers}}개\n`;
      template += `- 평균 CPU 사용률: {{avg_cpu}}%\n`;
      template += `- 평균 메모리 사용률: {{avg_memory}}%\n\n`;

      variables.push('server_count', 'online_servers', 'avg_cpu', 'avg_memory');
      category = '실시간 서버 분석';
    }

    // 시간 범위 컨텍스트
    if (hasTimeRange) {
      template += `**분석 기간**: {{start_time}} ~ {{end_time}}\n\n`;
      variables.push('start_time', 'end_time');
    }

    // 에러 로그 컨텍스트
    if (hasErrorLogs) {
      template += `**최근 오류 현황**:\n`;
      template += `{{#if has_errors}}\n`;
      template += `- 총 오류 수: {{error_count}}건\n`;
      template += `- 주요 오류 유형: {{error_types}}\n`;
      template += `- 영향받은 서버: {{affected_servers}}\n`;
      template += `{{else}}\n`;
      template += `- ✅ 최근 심각한 오류 없음\n`;
      template += `{{/if}}\n\n`;

      variables.push(
        'has_errors',
        'error_count',
        'error_types',
        'affected_servers'
      );
      category = '오류 분석 및 해결';
    }

    // 사용자 선호도 컨텍스트
    if (hasUserPreferences) {
      const lang = contextData.userPreferences.language;
      if (lang === 'ko') {
        template += `**상세 분석**:\n{{detailed_analysis_ko}}\n\n`;
        variables.push('detailed_analysis_ko');
      } else {
        template += `**Detailed Analysis**:\n{{detailed_analysis_en}}\n\n`;
        variables.push('detailed_analysis_en');
      }
    }

    // 질문 그룹 기반 맞춤 섹션
    if (group.suggestedCategory) {
      switch (group.suggestedCategory) {
        case 'CPU 모니터링':
          template += `**CPU 최적화 제안**:\n{{cpu_optimization}}\n\n`;
          variables.push('cpu_optimization');
          break;
        case '메모리 관리':
          template += `**메모리 최적화 제안**:\n{{memory_optimization}}\n\n`;
          variables.push('memory_optimization');
          break;
        case '네트워크 모니터링':
          template += `**네트워크 최적화 제안**:\n{{network_optimization}}\n\n`;
          variables.push('network_optimization');
          break;
      }
    }

    // 액션 가이드
    template += `**권장 조치사항**:\n{{recommended_actions}}\n\n`;
    template += `**추가 모니터링**:\n{{additional_monitoring}}`;

    variables.push('recommended_actions', 'additional_monitoring');

    return {
      id: this.generateTemplateId(),
      category,
      template,
      variables,
      examples: group.questions.slice(0, 2),
      applicablePatterns: [group.pattern],
    };
  }

  /**
   * 예상 개선 효과 계산
   */
  private calculateEstimatedImprovement(
    interactions: UserInteractionLog[]
  ): number {
    const totalInteractions = interactions.length;
    const lowConfidenceCount = interactions.filter(
      i => i.confidence < 0.6
    ).length;
    const negativeCount = interactions.filter(
      i => i.userFeedback === 'not_helpful' || i.userFeedback === 'incorrect'
    ).length;

    const improvementPotential =
      (lowConfidenceCount + negativeCount) / totalInteractions;
    return Math.round(improvementPotential * 100);
  }

  /**
   * 유틸리티 메서드들
   */
  private generateSuggestionId(): string {
    return `suggestion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateGroupId(): string {
    return `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generatePatternId(): string {
    return `pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateTemplateId(): string {
    return `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private calculateAverageConfidence(patterns: any[]): number {
    if (patterns.length === 0) return 0;
    return (
      patterns.reduce((sum, p) => sum + (p.confidence || 0), 0) /
      patterns.length
    );
  }
}
