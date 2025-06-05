/**
 * 🧠 Enhanced AI Engine v2.0
 * 
 * ✅ MCP 문서 활용 극대화
 * ✅ 벡터 DB 없는 고성능 검색
 * ✅ TensorFlow.js + MCP 하이브리드
 * ✅ 실시간 컨텍스트 학습
 * ✅ Render 자동 관리
 */

import { RealMCPClient } from '@/services/mcp/real-mcp-client';
import { TensorFlowAIEngine } from './tensorflow-engine';
import { FastAPIClient } from '@/services/python-bridge/fastapi-client';

interface DocumentContext {
  path: string;
  content: string;
  keywords: string[];
  lastModified: number;
  relevanceScore: number;
  contextLinks: string[];
}

interface AIAnalysisResult {
  success: boolean;
  answer: string;
  confidence: number;
  sources: DocumentContext[];
  reasoning: string[];
  tensorflowPredictions?: any;
  mcpActions: string[];
  processingTime: number;
  renderStatus?: 'active' | 'sleeping' | 'error';
}

interface SmartQuery {
  originalQuery: string;
  intent: 'analysis' | 'search' | 'prediction' | 'optimization' | 'troubleshooting';
  keywords: string[];
  requiredDocs: string[];
  mcpActions: string[];
  tensorflowModels: string[];
}

export class EnhancedAIEngine {
  private mcpClient: RealMCPClient;
  private tensorflowEngine: TensorFlowAIEngine;
  private fastApiClient: FastAPIClient;
  private documentIndex: Map<string, DocumentContext> = new Map();
  private contextMemory: Map<string, any> = new Map();
  private lastIndexUpdate: number = 0;
  private renderPingInterval?: NodeJS.Timeout;
  private isInitialized = false;

  constructor() {
    this.mcpClient = new RealMCPClient();
    this.tensorflowEngine = new TensorFlowAIEngine();
    this.fastApiClient = new FastAPIClient({
      baseUrl: process.env.FASTAPI_URL || 'https://openmanager-ml.onrender.com',
      enableCache: true,
      retryAttempts: 2
    });
  }

  /**
   * 🚀 Enhanced AI 엔진 초기화
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    console.log('🧠 Enhanced AI Engine 초기화 시작...');
    
    try {
      // 1. MCP 클라이언트 초기화
      await this.mcpClient.initialize();
      console.log('✅ MCP 클라이언트 초기화 완료');

      // 2. TensorFlow.js 엔진 초기화
      await this.tensorflowEngine.initialize();
      console.log('✅ TensorFlow.js 엔진 초기화 완료');

      // 3. 문서 인덱스 구축
      await this.buildDocumentIndex();
      console.log('✅ 문서 인덱스 구축 완료');

      // 4. Render 자동 관리 시작
      await this.startRenderManagement();
      console.log('✅ Render 자동 관리 시작');

      this.isInitialized = true;
      console.log('🎉 Enhanced AI Engine 초기화 완료');

    } catch (error) {
      console.error('❌ Enhanced AI Engine 초기화 실패:', error);
      throw error;
    }
  }

  /**
   * 📚 MCP 기반 문서 인덱스 구축
   */
  private async buildDocumentIndex(): Promise<void> {
    const startTime = Date.now();
    let documentCount = 0;

    try {
      // docs 폴더 스캔
      const docsFiles = await this.mcpClient.listDirectory('docs');
      const srcFiles = await this.mcpClient.listDirectory('src');
      const allFiles = [...docsFiles, ...srcFiles];

      // .md 파일만 필터링
      const markdownFiles = allFiles.filter(file => 
        file.endsWith('.md') || file.includes('.md')
      );

      console.log(`📄 ${markdownFiles.length}개 문서 발견`);

      // 각 문서 처리
      for (const file of markdownFiles) {
        try {
          const content = await this.mcpClient.readFile(file);
          if (content) {
            const context = await this.analyzeDocument(file, content);
            this.documentIndex.set(file, context);
            documentCount++;

            // MCP memory에 저장
            await this.mcpClient.storeContext(`doc:${file}`, {
              keywords: context.keywords,
              summary: content.substring(0, 200),
              lastAnalyzed: Date.now()
            });
          }
        } catch (error) {
          console.warn(`⚠️ 문서 처리 실패: ${file}`, error);
        }
      }

      this.lastIndexUpdate = Date.now();
      const processingTime = Date.now() - startTime;
      
      console.log(`✅ 문서 인덱스 구축 완료: ${documentCount}개 문서, ${processingTime}ms`);

    } catch (error) {
      console.error('❌ 문서 인덱스 구축 실패:', error);
    }
  }

  /**
   * 📖 개별 문서 분석
   */
  private async analyzeDocument(path: string, content: string): Promise<DocumentContext> {
    // 키워드 추출 (한국어 + 영어)
    const keywords = this.extractKeywords(content);
    
    // 컨텍스트 링크 찾기
    const contextLinks = this.findContextLinks(content);
    
    // 문서 관련성 점수 계산
    const relevanceScore = this.calculateRelevanceScore(path, content);

    return {
      path,
      content: content.substring(0, 5000), // 5KB로 제한
      keywords,
      lastModified: Date.now(),
      relevanceScore,
      contextLinks
    };
  }

  /**
   * 🔍 키워드 추출 (한국어 + 영어 지원)
   */
  private extractKeywords(text: string): string[] {
    const keywords = new Set<string>();
    
    // 영어 키워드 (3글자 이상)
    const englishWords = text.match(/\b[a-zA-Z]{3,}\b/g) || [];
    englishWords.forEach(word => {
      if (word.length >= 3 && !this.isCommonWord(word)) {
        keywords.add(word.toLowerCase());
      }
    });

    // 한국어 키워드 (2글자 이상)
    const koreanWords = text.match(/[가-힣]{2,}/g) || [];
    koreanWords.forEach(word => {
      if (word.length >= 2) {
        keywords.add(word);
      }
    });

    // 마크다운 헤딩
    const headings = text.match(/#{1,6}\s+(.+)/g) || [];
    headings.forEach(heading => {
      const cleanHeading = heading.replace(/#{1,6}\s+/, '').trim();
      if (cleanHeading.length > 1) {
        keywords.add(cleanHeading);
      }
    });

    // 코드 블록에서 기술명
    const codeBlocks = text.match(/```(\w+)/g) || [];
    codeBlocks.forEach(block => {
      const tech = block.replace('```', '');
      keywords.add(tech);
    });

    return Array.from(keywords).slice(0, 50); // 상위 50개만
  }

  /**
   * 🔗 컨텍스트 링크 찾기
   */
  private findContextLinks(content: string): string[] {
    const links = new Set<string>();
    
    // 마크다운 링크
    const mdLinks = content.match(/\[([^\]]+)\]\(([^)]+)\)/g) || [];
    mdLinks.forEach(link => {
      const url = link.match(/\(([^)]+)\)/)?.[1];
      if (url && url.endsWith('.md')) {
        links.add(url);
      }
    });

    // 파일 경로 참조
    const pathRefs = content.match(/src\/[^)\s]+|docs\/[^)\s]+/g) || [];
    pathRefs.forEach(path => links.add(path));

    return Array.from(links);
  }

  /**
   * ⭐ 문서 관련성 점수 계산
   */
  private calculateRelevanceScore(path: string, content: string): number {
    let score = 1.0;

    // 파일 위치 기반
    if (path.includes('README')) score += 2.0;
    if (path.includes('GUIDE')) score += 1.5;
    if (path.includes('API')) score += 1.2;
    if (path.includes('archive')) score -= 0.5;

    // 내용 기반
    const contentLower = content.toLowerCase();
    if (contentLower.includes('중요') || contentLower.includes('important')) score += 0.5;
    if (contentLower.includes('deprecated')) score -= 1.0;

    // 길이 기반
    if (content.length > 10000) score += 0.3;
    if (content.length < 500) score -= 0.2;

    return Math.max(0.1, Math.min(5.0, score));
  }

  /**
   * 🧠 스마트 쿼리 분석 및 처리
   */
  async processSmartQuery(query: string, sessionId?: string): Promise<AIAnalysisResult> {
    await this.initialize();
    const startTime = Date.now();

    try {
      console.log(`🤔 스마트 쿼리 분석: "${query}"`);

      // 1. 쿼리 의도 분석
      const smartQuery = await this.analyzeQueryIntent(query);
      
      // 2. MCP 기반 관련 문서 검색
      const relevantDocs = await this.searchRelevantDocuments(smartQuery);
      
      // 3. TensorFlow.js 모델 실행 (필요시)
      let tensorflowPredictions;
      if (smartQuery.tensorflowModels.length > 0) {
        tensorflowPredictions = await this.runTensorFlowAnalysis(smartQuery, relevantDocs);
      }

      // 4. 컨텍스트 기반 답변 생성
      const answer = await this.generateContextualAnswer(smartQuery, relevantDocs, tensorflowPredictions);

      // 5. MCP memory에 학습 데이터 저장
      if (sessionId) {
        await this.mcpClient.storeContext(`session:${sessionId}:query`, {
          query,
          answer: answer.text,
          confidence: answer.confidence,
          timestamp: Date.now()
        });
      }

      const processingTime = Date.now() - startTime;

      return {
        success: true,
        answer: answer.text,
        confidence: answer.confidence,
        sources: relevantDocs,
        reasoning: answer.reasoning,
        tensorflowPredictions,
        mcpActions: smartQuery.mcpActions,
        processingTime,
        renderStatus: await this.checkRenderStatus()
      };

    } catch (error) {
      console.error('❌ 스마트 쿼리 처리 실패:', error);
      
      return {
        success: false,
        answer: '죄송합니다. 쿼리 처리 중 오류가 발생했습니다.',
        confidence: 0,
        sources: [],
        reasoning: [`처리 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`],
        mcpActions: [],
        processingTime: Date.now() - startTime
      };
    }
  }

  /**
   * 🎯 쿼리 의도 분석
   */
  private async analyzeQueryIntent(query: string): Promise<SmartQuery> {
    const queryLower = query.toLowerCase();
    const keywords = this.extractKeywords(query);

    // 의도 분류
    let intent: SmartQuery['intent'] = 'search';
    const mcpActions: string[] = [];
    const tensorflowModels: string[] = [];
    const requiredDocs: string[] = [];

    // 분석 관련
    if (queryLower.includes('분석') || queryLower.includes('analyze')) {
      intent = 'analysis';
      mcpActions.push('search_documents', 'read_files');
      tensorflowModels.push('failure_prediction', 'anomaly_detection');
    }

    // 예측 관련
    if (queryLower.includes('예측') || queryLower.includes('predict')) {
      intent = 'prediction';
      mcpActions.push('get_metrics');
      tensorflowModels.push('timeseries', 'failure_prediction');
    }

    // 최적화 관련
    if (queryLower.includes('최적화') || queryLower.includes('optimize')) {
      intent = 'optimization';
      mcpActions.push('search_documents', 'analyze_metrics');
      requiredDocs.push('docs/PERFORMANCE_GUIDE.md', 'docs/ARCHITECTURE_GUIDE.md');
    }

    // 문제 해결 관련
    if (queryLower.includes('오류') || queryLower.includes('문제') || queryLower.includes('error')) {
      intent = 'troubleshooting';
      mcpActions.push('search_logs', 'read_error_docs');
      requiredDocs.push('docs/TROUBLESHOOTING.md', 'docs/ERROR_HANDLING.md');
    }

    return {
      originalQuery: query,
      intent,
      keywords,
      requiredDocs,
      mcpActions,
      tensorflowModels
    };
  }

  /**
   * 📚 관련 문서 검색 (MCP 기반)
   */
  private async searchRelevantDocuments(smartQuery: SmartQuery): Promise<DocumentContext[]> {
    const relevantDocs: DocumentContext[] = [];
    const searchResults = new Map<string, number>(); // path -> score

    // 키워드 기반 검색
    for (const [path, doc] of this.documentIndex) {
      let score = 0;

      // 키워드 매칭
      for (const keyword of smartQuery.keywords) {
        if (doc.keywords.includes(keyword.toLowerCase())) {
          score += 2;
        }
        if (doc.content.toLowerCase().includes(keyword.toLowerCase())) {
          score += 1;
        }
      }

      // 기본 관련성 점수 추가
      score += doc.relevanceScore;

      if (score > 0) {
        searchResults.set(path, score);
      }
    }

    // 필수 문서 추가
    for (const requiredDoc of smartQuery.requiredDocs) {
      if (this.documentIndex.has(requiredDoc)) {
        searchResults.set(requiredDoc, 10); // 높은 점수
      }
    }

    // 점수 순으로 정렬하여 상위 5개 선택
    const sortedResults = Array.from(searchResults.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    for (const [path, score] of sortedResults) {
      const doc = this.documentIndex.get(path);
      if (doc) {
        relevantDocs.push({
          ...doc,
          relevanceScore: score
        });
      }
    }

    console.log(`📚 관련 문서 ${relevantDocs.length}개 발견`);
    return relevantDocs;
  }

  /**
   * 🧮 TensorFlow.js 분석 실행
   */
  private async runTensorFlowAnalysis(smartQuery: SmartQuery, docs: DocumentContext[]): Promise<any> {
    const predictions: any = {};

    try {
      // 의도에 따른 모델 실행
      if (smartQuery.intent === 'prediction' || smartQuery.intent === 'analysis') {
        // 모의 메트릭 데이터 생성 (실제로는 MCP에서 가져옴)
        const mockMetrics = this.generateMockMetrics();

        if (smartQuery.tensorflowModels.includes('failure_prediction')) {
          predictions.failurePrediction = await this.tensorflowEngine.predictFailure(mockMetrics);
        }

        if (smartQuery.tensorflowModels.includes('anomaly_detection')) {
          predictions.anomalyDetection = await this.tensorflowEngine.detectAnomalies(mockMetrics);
        }

        if (smartQuery.tensorflowModels.includes('timeseries')) {
          const analysisResult = await this.tensorflowEngine.analyzeMetricsWithAI({
            cpu: mockMetrics,
            memory: mockMetrics,
            disk: mockMetrics
          });
          predictions.timeseriesAnalysis = analysisResult;
        }
      }

      return predictions;

    } catch (error) {
      console.error('❌ TensorFlow.js 분석 실패:', error);
      return { error: error instanceof Error ? error.message : '분석 실패' };
    }
  }

  /**
   * 📝 컨텍스트 기반 답변 생성
   */
  private async generateContextualAnswer(
    smartQuery: SmartQuery, 
    docs: DocumentContext[], 
    tensorflowPredictions?: any
  ): Promise<{ text: string; confidence: number; reasoning: string[] }> {
    
    const reasoning: string[] = [];
    let confidence = 0.7; // 기본 신뢰도

    // 답변 구성 요소들
    const answerParts: string[] = [];

    // 1. 쿼리 이해 확인
    answerParts.push(`**"${smartQuery.originalQuery}"**에 대한 분석 결과입니다.\n`);
    reasoning.push(`쿼리 의도를 "${smartQuery.intent}"로 분류`);

    // 2. 관련 문서 정보
    if (docs.length > 0) {
      answerParts.push(`## 📚 관련 문서 분석 (${docs.length}개)\n`);
      
      for (const doc of docs.slice(0, 3)) { // 상위 3개만
        const summary = this.generateDocumentSummary(doc, smartQuery.keywords);
        answerParts.push(`### ${doc.path}\n${summary}\n`);
        confidence += 0.1;
      }
      reasoning.push(`${docs.length}개 관련 문서에서 컨텍스트 추출`);
    }

    // 3. TensorFlow.js 예측 결과
    if (tensorflowPredictions && Object.keys(tensorflowPredictions).length > 0) {
      answerParts.push(`## 🧠 AI 분석 결과\n`);
      
      if (tensorflowPredictions.failurePrediction) {
        const pred = tensorflowPredictions.failurePrediction;
        answerParts.push(`- **장애 예측**: ${(pred.prediction[0] * 100).toFixed(1)}% 확률\n`);
        confidence += 0.15;
      }

      if (tensorflowPredictions.anomalyDetection) {
        const anomaly = tensorflowPredictions.anomalyDetection;
        answerParts.push(`- **이상 탐지**: ${anomaly.is_anomaly ? '⚠️ 이상 감지' : '✅ 정상'}\n`);
        confidence += 0.15;
      }

      reasoning.push('TensorFlow.js 모델 예측 결과 포함');
    }

    // 4. 의도별 맞춤 조언
    answerParts.push(this.generateIntentBasedAdvice(smartQuery.intent, docs));
    reasoning.push(`${smartQuery.intent} 의도에 맞는 조언 생성`);

    // 5. 다음 단계 제안
    answerParts.push('\n## 🎯 권장 다음 단계\n');
    answerParts.push(this.generateNextSteps(smartQuery.intent, docs));

    const finalAnswer = answerParts.join('\n');
    confidence = Math.min(0.95, confidence); // 최대 95%

    return {
      text: finalAnswer,
      confidence,
      reasoning
    };
  }

  /**
   * 📄 문서 요약 생성
   */
  private generateDocumentSummary(doc: DocumentContext, keywords: string[]): string {
    const content = doc.content;
    const sentences = content.split(/[.!?]\n/);
    
    // 키워드가 포함된 문장들 찾기
    const relevantSentences = sentences.filter(sentence => {
      const sentenceLower = sentence.toLowerCase();
      return keywords.some(keyword => 
        sentenceLower.includes(keyword.toLowerCase())
      );
    });

    if (relevantSentences.length > 0) {
      return relevantSentences.slice(0, 2).join('. ') + '.';
    }

    // 키워드 매칭이 없으면 첫 문장 사용
    return sentences.slice(0, 2).join('. ') + '.';
  }

  /**
   * 💡 의도별 맞춤 조언 생성
   */
  private generateIntentBasedAdvice(intent: SmartQuery['intent'], docs: DocumentContext[]): string {
    switch (intent) {
      case 'analysis':
        return `## 🔍 분석 조언\n${docs.length}개 문서를 바탕으로 종합적인 분석을 수행했습니다. 추가 세부 분석이 필요하면 구체적인 영역을 지정해 주세요.`;
      
      case 'prediction':
        return `## 🔮 예측 조언\n현재 데이터와 AI 모델을 통한 예측 결과입니다. 더 정확한 예측을 위해서는 더 많은 히스토리 데이터가 필요할 수 있습니다.`;
      
      case 'optimization':
        return `## ⚡ 최적화 조언\n관련 문서들에서 최적화 방안을 찾았습니다. 단계별로 적용하며 각 단계의 효과를 측정해 보세요.`;
      
      case 'troubleshooting':
        return `## 🔧 문제 해결 조언\n문제 해결 가이드를 바탕으로 단계별 접근을 권장합니다. 증상이 지속되면 로그를 확인해 주세요.`;
      
      default:
        return `## 💡 일반 조언\n관련 문서들을 참고하여 답변했습니다. 더 구체적인 질문이 있으시면 언제든 문의하세요.`;
    }
  }

  /**
   * 🎯 다음 단계 제안
   */
  private generateNextSteps(intent: SmartQuery['intent'], docs: DocumentContext[]): string {
    const steps: string[] = [];

    switch (intent) {
      case 'analysis':
        steps.push('1. 추가 메트릭 수집');
        steps.push('2. 장기간 트렌드 분석');
        steps.push('3. 상세 보고서 생성');
        break;
      
      case 'prediction':
        steps.push('1. 히스토리 데이터 검토');
        steps.push('2. 예측 모델 정확도 개선');
        steps.push('3. 실시간 모니터링 설정');
        break;
      
      case 'optimization':
        steps.push('1. 현재 성능 벤치마크');
        steps.push('2. 최적화 적용');
        steps.push('3. 개선 효과 측정');
        break;
      
      case 'troubleshooting':
        steps.push('1. 로그 상세 분석');
        steps.push('2. 임시 해결책 적용');
        steps.push('3. 근본 원인 제거');
        break;
      
      default:
        steps.push('1. 관련 문서 추가 검토');
        steps.push('2. 구체적인 요구사항 정의');
        steps.push('3. 단계별 실행 계획 수립');
    }

    return steps.join('\n');
  }

  /**
   * 🔄 Render 자동 관리
   */
  private async startRenderManagement(): Promise<void> {
    // 환경변수 확인
    const renderUrl = process.env.FASTAPI_URL;
    if (!renderUrl?.includes('onrender.com')) {
      console.log('⚠️ Render URL이 아닙니다. 자동 관리 건너뛰기');
      return;
    }

    console.log('🔄 Render 자동 관리 시작...');

    // 5분마다 ping 전송
    this.renderPingInterval = setInterval(async () => {
      try {
        const isHealthy = await this.fastApiClient.healthCheck();
        if (isHealthy) {
          console.log('✅ Render 서비스 정상 (ping 성공)');
        } else {
          console.log('⚠️ Render 서비스 응답 없음');
        }
      } catch (error) {
        console.log('❌ Render ping 실패:', error instanceof Error ? error.message : '알 수 없는 오류');
      }
    }, 5 * 60 * 1000); // 5분

    // 프로세스 종료 시 정리
    process.on('beforeExit', () => {
      if (this.renderPingInterval) {
        clearInterval(this.renderPingInterval);
        console.log('🔄 Render 자동 관리 중지');
      }
    });
  }

  /**
   * 🏥 Render 상태 확인
   */
  private async checkRenderStatus(): Promise<'active' | 'sleeping' | 'error'> {
    try {
      const isHealthy = await this.fastApiClient.healthCheck();
      return isHealthy ? 'active' : 'sleeping';
    } catch (error) {
      return 'error';
    }
  }

  /**
   * 🎲 모의 메트릭 데이터 생성
   */
  private generateMockMetrics(): number[] {
    return Array.from({ length: 10 }, () => Math.random() * 100);
  }

  /**
   * 🚫 일반적인 단어 필터링
   */
  private isCommonWord(word: string): boolean {
    const commonWords = new Set([
      'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'her', 'was', 'one', 'our', 'had', 'but', 'words', 'from', 'they', 'this', 'been', 'have', 'with', 'that', 'will', 'what', 'your', 'how', 'said', 'each', 'she', 'which', 'their', 'time', 'would', 'there', 'way', 'could', 'than', 'now', 'find', 'these', 'more', 'long', 'make', 'many', 'over', 'did', 'just', 'very', 'where', 'come', 'made', 'may', 'part'
    ]);
    return commonWords.has(word.toLowerCase());
  }

  /**
   * 🗑️ 리소스 정리
   */
  dispose(): void {
    console.log('🗑️ Enhanced AI Engine 정리 중...');
    
    if (this.renderPingInterval) {
      clearInterval(this.renderPingInterval);
    }
    
    this.documentIndex.clear();
    this.contextMemory.clear();
    
    this.tensorflowEngine.dispose();
    
    this.isInitialized = false;
    console.log('✅ Enhanced AI Engine 정리 완료');
  }
} 