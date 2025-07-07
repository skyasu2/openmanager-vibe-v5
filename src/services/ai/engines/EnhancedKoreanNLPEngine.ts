/**
 * Enhanced Korean NLP Engine (Vercel Optimized)
 *
 * Features:
 * - Vercel environment optimization (30s timeout)
 * - Quality-first design (accuracy over speed)
 * - Server monitoring domain specialization
 * - Multi-layer analysis pipeline
 * - Context-aware response generation
 */

export interface EnhancedKoreanAnalysis {
  // Basic analysis results
  intent: string;
  entities: Array<{
    type: 'server' | 'metric' | 'status' | 'action' | 'time';
    value: string;
    confidence: number;
    normalized: string;
  }>;

  // Advanced analysis results
  semanticAnalysis: {
    mainTopic: string;
    subTopics: string[];
    urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
    technicalComplexity: number; // 0-1
  };

  // Server monitoring specialized analysis
  serverContext: {
    targetServers: string[];
    metrics: string[];
    timeRange?: { start?: string; end?: string; period?: string };
    comparisonType?: 'current' | 'historical' | 'threshold' | 'trend';
  };

  // Response generation guide
  responseGuidance: {
    responseType: 'informational' | 'analytical' | 'actionable' | 'alerting';
    detailLevel: 'summary' | 'detailed' | 'comprehensive';
    visualizationSuggestions: string[];
    followUpQuestions: string[];
  };

  // Quality metrics
  qualityMetrics: {
    confidence: number;
    processingTime: number;
    analysisDepth: number;
    contextRelevance: number;
  };
}

export class EnhancedKoreanNLPEngine {
  private initialized = false;

  // Domain-specific vocabulary dictionary
  private domainVocabulary = {
    servers: {
      'web server': ['nginx', 'apache', 'iis', 'lighttpd'],
      'api server': ['nodejs', 'express', 'fastapi', 'spring'],
      database: ['mysql', 'postgresql', 'mongodb', 'redis'],
      'load balancer': ['haproxy', 'nginx', 'cloudflare', 'aws-alb'],
      'cache server': ['redis', 'memcached', 'varnish'],
    },
    metrics: {
      CPU: ['processor', 'cpu usage', 'cpu rate'],
      memory: ['ram', 'memory usage', 'memory rate'],
      disk: ['hard disk', 'ssd', 'storage', 'disk usage'],
      network: ['bandwidth', 'traffic', 'network usage', 'communication'],
      'response time': ['latency', 'delay', 'response speed', 'latency'],
    },
    statuses: {
      normal: ['online', 'active', 'running', 'operational', 'healthy'],
      warning: ['caution', 'danger', 'threshold', 'warning'],
      error: ['error', 'failure', 'down', 'offline', 'error', 'critical'],
      maintenance: ['maintenance', 'update', 'restart', 'maintenance'],
    },
    actions: {
      check: ['check', 'inspect', 'query', 'view', 'examine'],
      analyze: ['interpret', 'review', 'evaluate', 'diagnose'],
      optimize: ['improve', 'tuning', 'performance improvement', 'efficiency'],
      monitor: ['surveillance', 'tracking', 'observation', 'monitor'],
    },
  };

  async initialize(): Promise<void> {
    if (this.initialized) return;

    console.log('Enhanced Korean NLP Engine initializing...');

    try {
      console.log('Enhanced Korean NLP Engine initialization complete');
      this.initialized = true;
    } catch (error) {
      console.error('Korean NLP Engine initialization failed:', error);
      throw error;
    }
  }

  /**
   * High-quality Korean query analysis (main entry point)
   */
  async analyzeQuery(
    query: string,
    context?: {
      serverData?: any;
      previousQueries?: string[];
      userIntent?: string;
    }
  ): Promise<EnhancedKoreanAnalysis> {
    await this.initialize();

    const startTime = Date.now();
    console.log('High-quality Korean query analysis started:', query);

    try {
      // Phase 1: Basic NLU analysis
      const basicNLU = await this.performBasicNLU(query);

      // Phase 2: Semantic analysis
      const semanticAnalysis = await this.performSemanticAnalysis(
        query,
        basicNLU
      );

      // Phase 3: Domain-specific analysis
      const domainAnalysis = await this.performDomainAnalysis(query, context);

      // Phase 4: Context analysis
      const contextAnalysis = await this.performContextAnalysis(query, context);

      // Phase 5: Response guide generation
      const responseGuidance = await this.generateResponseGuidance(
        basicNLU,
        semanticAnalysis,
        domainAnalysis,
        contextAnalysis
      );

      // Phase 6: Quality metrics calculation
      const qualityMetrics = this.calculateQualityMetrics(
        startTime,
        basicNLU,
        semanticAnalysis,
        domainAnalysis
      );

      const result: EnhancedKoreanAnalysis = {
        intent: basicNLU.intent,
        entities: domainAnalysis.entities,
        semanticAnalysis,
        serverContext: contextAnalysis,
        responseGuidance,
        qualityMetrics,
      };

      console.log(
        `High-quality Korean analysis complete (${qualityMetrics.processingTime}ms, confidence: ${qualityMetrics.confidence})`
      );
      return result;
    } catch (error) {
      console.error('Korean query analysis failed:', error);
      throw error;
    }
  }

  /**
   * Phase 1: Basic Natural Language Understanding (NLU)
   */
  private async performBasicNLU(query: string): Promise<any> {
    console.log('Phase 1: Basic NLU analysis');

    // Basic preprocessing
    const normalizedQuery = this.normalizeKoreanText(query);

    // Intent classification
    const intent = this.classifyIntent(normalizedQuery);

    // Keyword extraction
    const keywords = this.extractKeywords(normalizedQuery);

    // Basic confidence calculation
    const confidence = this.calculateBasicConfidence(
      normalizedQuery,
      intent,
      keywords
    );

    return {
      intent,
      keywords,
      confidence,
      normalizedQuery,
    };
  }

  /**
   * Phase 2: Semantic analysis
   */
  private async performSemanticAnalysis(
    query: string,
    basicNLU: any
  ): Promise<EnhancedKoreanAnalysis['semanticAnalysis']> {
    console.log('Phase 2: Semantic analysis');

    // Topic extraction
    const mainTopic = this.extractMainTopic(query, basicNLU);
    const subTopics = this.extractSubTopics(query, basicNLU);

    // Urgency analysis
    const urgencyLevel = this.analyzeUrgency(query);

    // Technical complexity calculation
    const technicalComplexity = this.calculateTechnicalComplexity(
      query,
      basicNLU
    );

    return {
      mainTopic,
      subTopics,
      urgencyLevel,
      technicalComplexity,
    };
  }

  /**
   * Phase 3: Domain-specific analysis
   */
  private async performDomainAnalysis(
    query: string,
    context?: any
  ): Promise<{ entities: EnhancedKoreanAnalysis['entities'] }> {
    console.log('Phase 3: Domain-specific analysis');

    const entities: EnhancedKoreanAnalysis['entities'] = [];

    // Server entity extraction
    entities.push(...this.extractServerEntities(query));

    // Metric entity extraction
    entities.push(...this.extractMetricEntities(query));

    // Status entity extraction
    entities.push(...this.extractStatusEntities(query));

    // Action entity extraction
    entities.push(...this.extractActionEntities(query));

    // Time entity extraction
    entities.push(...this.extractTimeEntities(query));

    return { entities };
  }

  /**
   * Phase 4: Context analysis
   */
  private async performContextAnalysis(
    query: string,
    context?: any
  ): Promise<EnhancedKoreanAnalysis['serverContext']> {
    console.log('Phase 4: Context analysis');

    // Target server identification
    const targetServers = this.identifyTargetServers(
      query,
      context?.serverData
    );

    // Metric identification
    const metrics = this.identifyMetrics(query);

    // Time range extraction
    const timeRange = this.extractTimeRange(query);

    // Comparison type determination
    const comparisonType = this.determineComparisonType(query);

    return {
      targetServers,
      metrics,
      timeRange,
      comparisonType,
    };
  }

  /**
   * Phase 5: Response guide generation
   */
  private async generateResponseGuidance(
    basicNLU: any,
    semanticAnalysis: EnhancedKoreanAnalysis['semanticAnalysis'],
    domainAnalysis: { entities: EnhancedKoreanAnalysis['entities'] },
    contextAnalysis: EnhancedKoreanAnalysis['serverContext']
  ): Promise<EnhancedKoreanAnalysis['responseGuidance']> {
    console.log('Phase 5: Response guide generation');

    // Response type determination
    const responseType = this.determineResponseType(basicNLU, semanticAnalysis);

    // Detail level determination
    const detailLevel = this.determineDetailLevel(
      semanticAnalysis,
      domainAnalysis
    );

    // Visualization suggestions
    const visualizationSuggestions =
      this.generateVisualizationSuggestions(contextAnalysis);

    // Follow-up question generation
    const followUpQuestions = this.generateFollowUpQuestions(
      basicNLU,
      contextAnalysis
    );

    return {
      responseType,
      detailLevel,
      visualizationSuggestions,
      followUpQuestions,
    };
  }

  // Helper methods
  private normalizeKoreanText(text: string): string {
    return text.toLowerCase().replace(/\s+/g, ' ').trim();
  }

  private classifyIntent(query: string): string {
    if (query.includes('check') || query.includes('query')) return 'inquiry';
    if (query.includes('analyze') || query.includes('review'))
      return 'analysis';
    if (query.includes('optimize') || query.includes('improve'))
      return 'optimization';
    if (query.includes('problem') || query.includes('error'))
      return 'troubleshooting';
    return 'general';
  }

  private extractKeywords(query: string): string[] {
    const words = query.split(' ').filter(word => word.length > 1);
    return words.filter(word =>
      Object.values(this.domainVocabulary).some(category =>
        Object.keys(category).some(
          key =>
            key.includes(word) ||
            (category as any)[key].some((synonym: string) => synonym.includes(word))
        )
      )
    );
  }

  private calculateBasicConfidence(
    query: string,
    intent: string,
    keywords: string[]
  ): number {
    let confidence = 0.5; // Base confidence

    if (intent !== 'general') confidence += 0.2;
    if (keywords.length > 0) confidence += keywords.length * 0.1;
    if (query.length > 10) confidence += 0.1;

    return Math.min(1, confidence);
  }

  private extractMainTopic(query: string, nluResult: any): string {
    const serverKeywords = ['server', 'system', 'infrastructure', 'service'];
    const performanceKeywords = [
      'performance',
      'speed',
      'response time',
      'throughput',
    ];
    const monitoringKeywords = [
      'monitoring',
      'surveillance',
      'tracking',
      'observation',
    ];
    const troubleshootingKeywords = ['problem', 'error', 'failure', 'issue'];

    if (serverKeywords.some(k => query.includes(k))) return 'Server Management';
    if (performanceKeywords.some(k => query.includes(k)))
      return 'Performance Analysis';
    if (monitoringKeywords.some(k => query.includes(k))) return 'Monitoring';
    if (troubleshootingKeywords.some(k => query.includes(k)))
      return 'Troubleshooting';

    return 'General Query';
  }

  private extractSubTopics(query: string, nluResult: any): string[] {
    const subTopics: string[] = [];

    if (query.includes('CPU') || query.includes('processor'))
      subTopics.push('CPU Analysis');
    if (query.includes('memory') || query.includes('RAM'))
      subTopics.push('Memory Analysis');
    if (query.includes('disk') || query.includes('storage'))
      subTopics.push('Disk Analysis');
    if (query.includes('network') || query.includes('traffic'))
      subTopics.push('Network Analysis');

    return subTopics;
  }

  private analyzeUrgency(
    query: string
  ): 'low' | 'medium' | 'high' | 'critical' {
    const criticalWords = ['urgent', 'serious', 'down', 'failure', 'stop'];
    const highWords = ['high', 'danger', 'warning', 'problem'];
    const mediumWords = ['check', 'inspect', 'analyze'];

    if (criticalWords.some(w => query.includes(w))) return 'critical';
    if (highWords.some(w => query.includes(w))) return 'high';
    if (mediumWords.some(w => query.includes(w))) return 'medium';

    return 'low';
  }

  private calculateTechnicalComplexity(query: string, nluResult: any): number {
    let complexity = 0;

    complexity += query.length * 0.001;
    complexity += nluResult.keywords.length * 0.1;

    const technicalTerms = [
      'cluster',
      'load balancing',
      'caching',
      'sharding',
      'replication',
    ];
    complexity +=
      technicalTerms.filter(term => query.includes(term)).length * 0.2;

    return Math.min(1, complexity);
  }

  private extractServerEntities(
    query: string
  ): EnhancedKoreanAnalysis['entities'] {
    const entities: EnhancedKoreanAnalysis['entities'] = [];

    Object.entries(this.domainVocabulary.servers).forEach(
      ([serverType, synonyms]) => {
        if (
          query.includes(serverType) ||
          synonyms.some(s => query.includes(s))
        ) {
          entities.push({
            type: 'server',
            value: serverType,
            confidence: 0.8,
            normalized: serverType.toLowerCase(),
          });
        }
      }
    );

    return entities;
  }

  private extractMetricEntities(
    query: string
  ): EnhancedKoreanAnalysis['entities'] {
    const entities: EnhancedKoreanAnalysis['entities'] = [];

    Object.entries(this.domainVocabulary.metrics).forEach(
      ([metricType, synonyms]) => {
        if (
          query.includes(metricType) ||
          synonyms.some(s => query.includes(s))
        ) {
          entities.push({
            type: 'metric',
            value: metricType,
            confidence: 0.9,
            normalized: metricType.toLowerCase(),
          });
        }
      }
    );

    return entities;
  }

  private extractStatusEntities(
    query: string
  ): EnhancedKoreanAnalysis['entities'] {
    const entities: EnhancedKoreanAnalysis['entities'] = [];

    Object.entries(this.domainVocabulary.statuses).forEach(
      ([statusType, synonyms]) => {
        if (
          query.includes(statusType) ||
          synonyms.some(s => query.includes(s))
        ) {
          entities.push({
            type: 'status',
            value: statusType,
            confidence: 0.85,
            normalized: statusType.toLowerCase(),
          });
        }
      }
    );

    return entities;
  }

  private extractActionEntities(
    query: string
  ): EnhancedKoreanAnalysis['entities'] {
    const entities: EnhancedKoreanAnalysis['entities'] = [];

    Object.entries(this.domainVocabulary.actions).forEach(
      ([actionType, synonyms]) => {
        if (
          query.includes(actionType) ||
          synonyms.some(s => query.includes(s))
        ) {
          entities.push({
            type: 'action',
            value: actionType,
            confidence: 0.8,
            normalized: actionType.toLowerCase(),
          });
        }
      }
    );

    return entities;
  }

  private extractTimeEntities(
    query: string
  ): EnhancedKoreanAnalysis['entities'] {
    const entities: EnhancedKoreanAnalysis['entities'] = [];

    const timePatterns = [
      { pattern: /(\d+)hour/, type: 'hour' },
      { pattern: /(\d+)minute/, type: 'minute' },
      { pattern: /(\d+)day/, type: 'day' },
      { pattern: /(today|yesterday|tomorrow)/, type: 'relative' },
      { pattern: /(past|recent|current)/, type: 'period' },
    ];

    timePatterns.forEach(({ pattern, type }) => {
      const match = query.match(pattern);
      if (match) {
        entities.push({
          type: 'time',
          value: match[0],
          confidence: 0.9,
          normalized: type,
        });
      }
    });

    return entities;
  }

  private identifyTargetServers(query: string, serverData?: any): string[] {
    const targets: string[] = [];

    const serverNamePattern = /([a-zA-Z0-9-]+server|[a-zA-Z0-9-]+-\d+)/g;
    const matches = query.match(serverNamePattern);
    if (matches) {
      targets.push(...matches);
    }

    if (query.includes('web server')) targets.push('web-servers');
    if (query.includes('database')) targets.push('database-servers');
    if (query.includes('API server')) targets.push('api-servers');

    return targets;
  }

  private identifyMetrics(query: string): string[] {
    const metrics: string[] = [];

    if (query.includes('CPU') || query.includes('processor'))
      metrics.push('cpu');
    if (query.includes('memory') || query.includes('RAM'))
      metrics.push('memory');
    if (query.includes('disk')) metrics.push('disk');
    if (query.includes('network')) metrics.push('network');
    if (query.includes('response time')) metrics.push('response_time');

    return metrics;
  }

  private extractTimeRange(
    query: string
  ): { start?: string; end?: string; period?: string } | undefined {
    if (query.includes('1 hour')) return { period: '1h' };
    if (query.includes('24 hours') || query.includes('day'))
      return { period: '24h' };
    if (query.includes('1 week')) return { period: '7d' };
    if (query.includes('today')) return { period: 'today' };
    if (query.includes('yesterday')) return { period: 'yesterday' };

    return undefined;
  }

  private determineComparisonType(
    query: string
  ): 'current' | 'historical' | 'threshold' | 'trend' | undefined {
    if (query.includes('current') || query.includes('now')) return 'current';
    if (query.includes('past') || query.includes('previous'))
      return 'historical';
    if (query.includes('threshold') || query.includes('criteria'))
      return 'threshold';
    if (query.includes('trend') || query.includes('change')) return 'trend';

    return undefined;
  }

  private determineResponseType(
    nluResult: any,
    semanticAnalysis: EnhancedKoreanAnalysis['semanticAnalysis']
  ): 'informational' | 'analytical' | 'actionable' | 'alerting' {
    if (semanticAnalysis.urgencyLevel === 'critical') return 'alerting';
    if (semanticAnalysis.mainTopic === 'Performance Analysis')
      return 'analytical';
    if (nluResult.intent === 'action') return 'actionable';

    return 'informational';
  }

  private determineDetailLevel(
    semanticAnalysis: EnhancedKoreanAnalysis['semanticAnalysis'],
    domainAnalysis: { entities: EnhancedKoreanAnalysis['entities'] }
  ): 'summary' | 'detailed' | 'comprehensive' {
    if (semanticAnalysis.technicalComplexity > 0.7) return 'comprehensive';
    if (domainAnalysis.entities.length > 3) return 'detailed';

    return 'summary';
  }

  private generateVisualizationSuggestions(
    contextAnalysis: EnhancedKoreanAnalysis['serverContext']
  ): string[] {
    const suggestions: string[] = [];

    if (contextAnalysis.metrics.includes('cpu'))
      suggestions.push('CPU Usage Chart');
    if (contextAnalysis.metrics.includes('memory'))
      suggestions.push('Memory Usage Graph');
    if (contextAnalysis.comparisonType === 'trend')
      suggestions.push('Time Series Trend Graph');
    if (contextAnalysis.targetServers.length > 1)
      suggestions.push('Server Comparison Chart');

    return suggestions;
  }

  private generateFollowUpQuestions(
    nluResult: any,
    contextAnalysis: EnhancedKoreanAnalysis['serverContext']
  ): string[] {
    const questions: string[] = [];

    if (contextAnalysis.metrics.length === 1) {
      questions.push('Would you like to check other metrics as well?');
    }

    if (!contextAnalysis.timeRange) {
      questions.push('Would you like to specify a time range?');
    }

    if (contextAnalysis.targetServers.length === 0) {
      questions.push('Would you like to specify a particular server?');
    }

    return questions;
  }

  private calculateQualityMetrics(
    startTime: number,
    basicNLU: any,
    semanticAnalysis: EnhancedKoreanAnalysis['semanticAnalysis'],
    domainAnalysis: { entities: EnhancedKoreanAnalysis['entities'] }
  ): EnhancedKoreanAnalysis['qualityMetrics'] {
    const processingTime = Date.now() - startTime;

    const confidence =
      basicNLU.confidence * 0.3 +
      (semanticAnalysis.technicalComplexity > 0.5 ? 0.8 : 0.6) * 0.3 +
      (domainAnalysis.entities.length > 0 ? 0.9 : 0.5) * 0.4;

    const analysisDepth = Math.min(
      1,
      semanticAnalysis.subTopics.length * 0.2 +
      domainAnalysis.entities.length * 0.1 +
      semanticAnalysis.technicalComplexity * 0.5
    );

    const contextRelevance = Math.min(
      1,
      domainAnalysis.entities.filter(
        e => e.type === 'server' || e.type === 'metric'
      ).length *
      0.3 +
      (semanticAnalysis.mainTopic !== 'General Query' ? 0.7 : 0.3)
    );

    return {
      confidence: Math.round(confidence * 100) / 100,
      processingTime,
      analysisDepth: Math.round(analysisDepth * 100) / 100,
      contextRelevance: Math.round(contextRelevance * 100) / 100,
    };
  }
}

// Singleton instance
export const enhancedKoreanNLPEngine = new EnhancedKoreanNLPEngine();
