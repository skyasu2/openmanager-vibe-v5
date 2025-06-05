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

// FastAPI 클라이언트 타입 정의
interface FastAPIConfig {
  baseUrl: string;
  retryAttempts?: number;
  timeout?: number;
}

// 간단한 FastAPI 클라이언트 구현
class FastAPIClient {
  private baseUrl: string;
  private retryAttempts: number;
  private timeout: number;

  constructor(config: FastAPIConfig) {
    this.baseUrl = config.baseUrl;
    this.retryAttempts = config.retryAttempts || 2;
    this.timeout = config.timeout || 30000;
  }

  async post(endpoint: string, data: any): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        signal: AbortSignal.timeout(this.timeout)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.warn(`FastAPI POST ${endpoint} 실패:`, error);
      throw error;
    }
  }

  async get(endpoint: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'GET',
        signal: AbortSignal.timeout(this.timeout)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.warn(`FastAPI GET ${endpoint} 실패:`, error);
      throw error;
    }
  }

  async ping(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, { 
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

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
      // 1. MCP 클라이언트 초기화 (필수)
      await this.mcpClient.initialize();
      console.log('✅ MCP 클라이언트 초기화 완료');

      // 2. 문서 인덱스 구축 (빠른 응답을 위해 우선 처리)
      await this.buildDocumentIndex();
      console.log('✅ 문서 인덱스 구축 완료');

      // 3. 백그라운드에서 TensorFlow.js 엔진 초기화 (지연 로딩)
      this.initializeTensorFlowInBackground();
      console.log('⏳ TensorFlow.js 엔진 백그라운드 초기화 시작');

      // 4. Render 자동 관리 시작 (백그라운드)
      this.startRenderManagement();
      console.log('✅ Render 자동 관리 시작');

      this.isInitialized = true;
      console.log('🎉 Enhanced AI Engine 초기화 완료 (고속 모드)');

    } catch (error) {
      console.error('❌ Enhanced AI Engine 초기화 실패:', error);
      throw error;
    }
  }

  /**
   * 🚀 TensorFlow.js 엔진 백그라운드 초기화 (성능 최적화)
   */
  private async initializeTensorFlowInBackground(): Promise<void> {
    try {
      setTimeout(async () => {
        await this.tensorflowEngine.initialize();
        console.log('✅ TensorFlow.js 엔진 백그라운드 초기화 완료');
      }, 100); // 100ms 지연으로 메인 스레드 블로킹 방지
    } catch (error) {
      console.warn('⚠️ TensorFlow.js 백그라운드 초기화 실패 (기본 모드로 동작):', error);
    }
  }

  /**
   * 🔄 TensorFlow.js 엔진 지연 로딩 (필요시에만 초기화)
   */
  private async ensureTensorFlowInitialized(): Promise<void> {
    if (!this.tensorflowEngine || !(this.tensorflowEngine as any).isInitialized) {
      console.log('⚡ TensorFlow.js 엔진 즉시 초기화...');
      await this.tensorflowEngine.initialize();
      console.log('✅ TensorFlow.js 엔진 즉시 초기화 완료');
    }
  }

  /**
   * 📚 MCP 기반 문서 인덱스 구축
   */
  private async buildDocumentIndex(): Promise<void> {
    const startTime = Date.now();
    let documentCount = 0;

    try {
      console.log('🔍 문서 인덱싱 시작...');
      
      // MCP가 실패하면 직접 파일 스캔 시도
      let allFiles: string[] = [];
      
      try {
        // MCP를 통한 AI 컨텍스트 파일 스캔 시도
        const contextFiles = await this.mcpClient.listDirectory('src/modules/ai-agent/context');
        allFiles = contextFiles;
        console.log(`📁 MCP를 통해 ${allFiles.length}개 AI 컨텍스트 파일 발견`);
      } catch (mcpError) {
        console.warn('⚠️ MCP 디렉토리 스캔 실패, 대체 방법 사용:', mcpError);
        
        // 대체 방법: AI 컨텍스트 파일들 하드코딩 (기본→고급→커스텀 순)
        allFiles = [
          // 기본 레벨 (Basic)
          'src/modules/ai-agent/context/system-knowledge.md',
          'src/modules/ai-agent/context/api-reference.md',
          'src/modules/ai-agent/context/troubleshooting-guide.md',
          // 고급 레벨 (Advanced)
          'src/modules/ai-agent/context/advanced-monitoring.md',
          // 커스텀 레벨 (Custom)
          'src/modules/ai-agent/context/custom-scenarios.md',
          // 환경별 가이드
          'src/modules/ai-agent/context/environment-guides.md',
          // 아키텍처 문서
          'src/modules/ai-agent/context/ai-engine-architecture.md',
          'docs/AI-ENGINE-ARCHITECTURE.md'
        ];
        console.log(`📋 하드코딩된 ${allFiles.length}개 AI 컨텍스트 파일 사용`);
      }

      // .md 파일만 필터링
      const markdownFiles = allFiles.filter(file => 
        file.endsWith('.md') || file.includes('.md')
      );

      console.log(`📄 ${markdownFiles.length}개 마크다운 문서 발견`);

      // 각 문서 처리
      for (const file of markdownFiles) {
        try {
          const content = await this.mcpClient.readFile(file);
          if (content && content.length > 50) { // 최소 길이 체크
            const context = await this.analyzeDocument(file, content);
            this.documentIndex.set(file, context);
            documentCount++;

            // 로컬 메모리에 문서 메타데이터 저장
            await this.mcpClient.storeContext(`doc:${file}`, {
              keywords: context.keywords,
              summary: content.substring(0, 200),
              lastAnalyzed: Date.now()
            });
            
            console.log(`✅ 문서 인덱싱 완료: ${file} (${context.keywords.length}개 키워드)`);
          } else {
            console.warn(`⚠️ 문서 내용 없음 또는 너무 짧음: ${file}`);
          }
        } catch (error) {
          console.warn(`⚠️ 문서 처리 실패: ${file}`, error);
          
          // 문서 읽기 실패시 기본 컨텍스트 생성
          if (file.includes('ESSENTIAL_DOCUMENTATION') || file.includes('README')) {
            const fallbackContext = await this.createFallbackDocumentContext(file);
            this.documentIndex.set(file, fallbackContext);
            documentCount++;
            console.log(`📋 기본 컨텍스트 생성: ${file}`);
          }
        }
      }

      this.lastIndexUpdate = Date.now();
      const processingTime = Date.now() - startTime;
      
      console.log(`✅ 문서 인덱스 구축 완료: ${documentCount}개 문서, ${processingTime}ms`);
      
      // 인덱스가 비어있으면 기본 지식 로드
      if (documentCount === 0) {
        await this.loadFallbackKnowledge();
        console.log('📚 기본 지식 베이스 로드 완료');
      }

    } catch (error) {
      console.error('❌ 문서 인덱스 구축 실패:', error);
      await this.loadFallbackKnowledge();
    }
  }

  /**
   * 📋 기본 문서 컨텍스트 생성 (파일 읽기 실패시)
   */
  private async createFallbackDocumentContext(path: string): Promise<DocumentContext> {
    const fallbackKeywords = this.getFallbackKeywords(path);
    
    return {
      path,
      content: `문서 파일: ${path}`,
      keywords: fallbackKeywords,
      lastModified: Date.now(),
      relevanceScore: 2.0,
      contextLinks: []
    };
  }

  /**
   * 📚 기본 지식 베이스 로드 (모든 문서 인덱싱 실패시)
   */
  private async loadFallbackKnowledge(): Promise<void> {
    const fallbackDocs = [
      // 기본 레벨 (Basic) - 기초 지식
      {
        path: 'src/modules/ai-agent/context/system-knowledge.md',
        keywords: ['시스템', '환경설정', 'MCP', 'AI엔진', '모니터링', 'development', 'production', '최적화'],
        content: 'AI 엔진 시스템 지식 베이스 - 환경별 설정 및 핵심 기능',
        relevanceScore: 5.0
      },
      {
        path: 'src/modules/ai-agent/context/api-reference.md',
        keywords: ['API', '엔드포인트', 'REST', 'POST', 'GET', '서버', '메트릭', '알림'],
        content: 'AI 엔진 API 참조 - 엔드포인트 및 사용법',
        relevanceScore: 4.5
      },
      {
        path: 'src/modules/ai-agent/context/troubleshooting-guide.md',
        keywords: ['문제해결', '오류', '성능', '진단', '최적화', '메모리', 'CPU', '데이터베이스'],
        content: 'AI 엔진 문제 해결 가이드 - 증상, 원인, 해결방법',
        relevanceScore: 4.8
      },
      // 고급 레벨 (Advanced) - 전문 지식
      {
        path: 'src/modules/ai-agent/context/advanced-monitoring.md',
        keywords: ['고급', '예측', '분석', 'TensorFlow', '이상탐지', '자동화', '대시보드', 'ML'],
        content: '고급 모니터링 및 분석 가이드 - AI 기반 예측 모니터링',
        relevanceScore: 4.3
      },
      // 커스텀 레벨 (Custom) - 특화 솔루션
      {
        path: 'src/modules/ai-agent/context/custom-scenarios.md',
        keywords: ['커스텀', '특화', '산업별', '금융', 'IoT', 'Kubernetes', '마이크로서비스', '서버리스'],
        content: '커스텀 시나리오 및 특화 솔루션 - 산업별 맞춤 가이드',
        relevanceScore: 4.0
      }
    ];

    for (const doc of fallbackDocs) {
      const context: DocumentContext = {
        path: doc.path,
        content: doc.content,
        keywords: doc.keywords,
        lastModified: Date.now(),
        relevanceScore: doc.relevanceScore,
        contextLinks: []
      };
      
      this.documentIndex.set(doc.path, context);
    }
    
    console.log(`📚 ${fallbackDocs.length}개 기본 문서 로드 완료`);
  }

  /**
   * 🔤 파일 경로 기반 기본 키워드 생성 (서버 모니터링 AI 에이전트 특화)
   */
  private getFallbackKeywords(path: string): string[] {
    const keywords: string[] = [];
    
    // 기본 레벨 (Basic) - 서버 모니터링 기초
    if (path.includes('system-knowledge')) {
      keywords.push('서버모니터링', 'AI에이전트', '메트릭해석', '임계값', '알림', '성능분석', 
                   'CPU', 'Memory', 'Disk', 'Network', '클러스터', '로드밸런서', '헬스체크');
    }
    if (path.includes('api-reference')) {
      keywords.push('API', '엔드포인트', '서버상태', '메트릭수집', '실시간데이터', 'REST', 
                   '모니터링API', '대시보드', '알림설정');
    }
    if (path.includes('troubleshooting-guide')) {
      keywords.push('문제해결', '서버오류', '성능저하', '메모리누수', '디스크부족', 'CPU과부하', 
                   '네트워크지연', '진단', '복구', '예방조치');
    }
    
    // 고급 레벨 (Advanced) - AI 기반 고급 모니터링
    if (path.includes('advanced-monitoring')) {
      keywords.push('예측분석', '장애예측', 'TensorFlow', '이상탐지', '자동스케일링', 
                   '머신러닝', '패턴분석', '용량계획', '성능최적화');
    }
    
    // 커스텀 레벨 (Custom) - 환경별 특화 시나리오
    if (path.includes('custom-scenarios')) {
      keywords.push('커스텀환경', '서버아키텍처', '단일서버', '마스터슬레이브', '로드밸런싱', 
                   '마이크로서비스', '데이터베이스환경', '네트워크토폴로지', 'GPU컴퓨팅', 
                   '고성능스토리지', '컨테이너', 'Kubernetes', 'DMZ', '멀티클라우드', '하이브리드');
    }
    
    return keywords.length > 0 ? keywords : ['서버모니터링', 'AI가이드'];
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
        // TensorFlow.js 엔진이 필요한 경우에만 초기화
        await this.ensureTensorFlowInitialized();
        
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
      } else {
        // TensorFlow.js가 필요하지 않은 경우 건너뛰기
        console.log('⚡ TensorFlow.js 분석 불필요 - 응답 시간 최적화');
        return { optimized: true, message: 'TensorFlow.js 분석 생략됨' };
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
        const isHealthy = await this.fastApiClient.ping();
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
      const isHealthy = await this.fastApiClient.ping();
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