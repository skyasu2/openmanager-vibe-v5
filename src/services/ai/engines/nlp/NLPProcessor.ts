/**
 * 🧠 자연어 처리 프로세서
 * 
 * Single Responsibility: 자연어 분석, 의도 감지, 키워드 추출
 * Strategy Pattern: 다양한 NLP 전략을 교체 가능하게 구현
 */

import { NLPAnalysisResult, AIIntent } from '../ai-types/AITypes';

export class NLPProcessor {
  private commonWords = new Set([
    '의', '가', '이', '을', '를', '은', '는', '에', '에서', '와', '과', '도', '만', '부터', '까지',
    'the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but', 'in', 'with', 'to', 'for',
    'of', 'as', 'by', 'from', 'up', 'into', 'over', 'after', 'beneath', 'under', 'above'
  ]);

  /**
   * 자연어 처리 분석
   */
  async processNLP(query: string): Promise<NLPAnalysisResult> {
    try {
      const keywords = this.extractQueryKeywords(query);
      const intent = this.detectIntent(query);
      const language = this.detectLanguage(query);

      return {
        intent,
        confidence: 0.8,
        entities: [],
        keywords,
        language,
        sentiment: 'neutral',
        query_type: this.classifyQueryType(query),
      };
    } catch (error: any) {
      console.warn('⚠️ NLP 처리 실패:', error);
      return this.createFallbackResult(query);
    }
  }

  /**
   * 의도 감지
   */
  private detectIntent(query: string): AIIntent {
    const lowerQuery = query.toLowerCase();

    if (this.matchesPatterns(lowerQuery, ['오류', '에러', '문제', '장애', '문제가', '안됨', '실패', 'error', 'issue', 'problem', 'fail'])) {
      return 'troubleshooting';
    }
    if (this.matchesPatterns(lowerQuery, ['긴급', '응급', '위험', 'critical', 'urgent', 'emergency'])) {
      return 'emergency';
    }
    if (this.matchesPatterns(lowerQuery, ['예측', '미래', '전망', 'predict', 'forecast', 'future'])) {
      return 'prediction';
    }
    if (this.matchesPatterns(lowerQuery, ['분석', '통계', '데이터', 'analyze', 'analysis', 'statistics'])) {
      return 'analysis';
    }
    if (this.matchesPatterns(lowerQuery, ['모니터링', '감시', '상태', 'monitor', 'status', 'health'])) {
      return 'monitoring';
    }
    if (this.matchesPatterns(lowerQuery, ['보고서', '리포트', '요약', 'report', 'summary'])) {
      return 'reporting';
    }
    if (this.matchesPatterns(lowerQuery, ['성능', '속도', '최적화', 'performance', 'speed', 'optimization'])) {
      return 'performance';
    }

    return 'general';
  }

  /**
   * 언어 감지
   */
  private detectLanguage(query: string): string {
    return /[가-힣]/.test(query) ? 'ko' : 'en';
  }

  /**
   * 쿼리 유형 분류
   */
  private classifyQueryType(query: string): string {
    const lowerQuery = query.toLowerCase();

    if (query.includes('?') || lowerQuery.includes('what') || lowerQuery.includes('how') || 
        lowerQuery.includes('무엇') || lowerQuery.includes('어떻게')) {
      return 'question';
    }
    if (lowerQuery.includes('show') || lowerQuery.includes('list') || 
        lowerQuery.includes('보여') || lowerQuery.includes('목록')) {
      return 'command';
    }
    if (lowerQuery.includes('help') || lowerQuery.includes('도움') || lowerQuery.includes('가이드')) {
      return 'help';
    }

    return 'general';
  }

  /**
   * 키워드 추출
   */
  extractQueryKeywords(query: string): string[] {
    // 기본 토큰화
    const tokens = this.simpleTokenize(query.toLowerCase());
    
    // 불용어 제거 및 필터링
    const keywords = tokens
      .filter(token => token.length > 1)
      .filter(token => !this.isCommonWord(token))
      .filter(token => !/^\d+$/.test(token)) // 숫자만으로 된 토큰 제거
      .slice(0, 10); // 상위 10개만 선택

    return [...new Set(keywords)]; // 중복 제거
  }

  /**
   * 패턴 매칭 헬퍼
   */
  private matchesPatterns(query: string, patterns: string[]): boolean {
    return patterns.some(pattern => query.includes(pattern));
  }

  /**
   * 불용어 체크
   */
  private isCommonWord(word: string): boolean {
    return this.commonWords.has(word);
  }

  /**
   * 단순 토큰화
   */
  private simpleTokenize(text: string): string[] {
    return text
      .replace(/[^\w\sㄱ-ㅎㅏ-ㅣ가-힣]/g, ' ')
      .split(/\s+/)
      .filter(token => token.length > 0);
  }

  /**
   * 폴백 결과 생성
   */
  private createFallbackResult(query: string): NLPAnalysisResult {
    return {
      intent: 'general',
      confidence: 0.5,
      entities: [],
      keywords: query.split(' ').slice(0, 5),
      language: 'ko',
      sentiment: 'neutral',
      query_type: 'general',
    };
  }
} 