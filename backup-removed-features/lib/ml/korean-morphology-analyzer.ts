/**
 * 🇰🇷 한국어 형태소 분석기 (규칙 기반)
 *
 * KoNLPy 대체용 경량 형태소 분석
 * - 서버 모니터링 도메인 특화
 * - 조사/어미 분리
 * - 어간 추출
 */

export interface MorphemeResult {
  surface: string; // 표면형
  pos: string; // 품사
  stem: string; // 어간
  feature: string; // 의미적 특징
}

export interface KoreanAnalysisResult {
  morphemes: MorphemeResult[];
  stems: string[];
  keywords: string[];
  entities: string[];
  confidence: number;
}

export class KoreanMorphologyAnalyzer {
  // 조사 패턴
  private readonly particles = [
    '이',
    '가',
    '은',
    '는',
    '을',
    '를',
    '의',
    '에',
    '에서',
    '로',
    '으로',
    '와',
    '과',
    '도',
    '만',
    '부터',
    '까지',
    '께서',
    '에게',
    '한테',
  ];

  // 어미 패턴
  private readonly endings = [
    '다',
    '요',
    '어요',
    '아요',
    '에요',
    '해요',
    '세요',
    '죠',
    '었다',
    '았다',
    '했다',
    '겠다',
    '된다',
    '한다',
    '이다',
  ];

  // 서버 모니터링 도메인 어휘
  private readonly domainVocab = {
    server: ['서버', '시스템', '호스트', '인스턴스', '노드', '클러스터'],
    performance: ['성능', '속도', '지연', '응답시간', '처리량', '대역폭'],
    resource: ['CPU', '메모리', '디스크', '네트워크', '스토리지'],
    status: ['상태', '헬스', '정상', '비정상', '작동', '중단', '장애'],
    action: ['확인', '체크', '분석', '모니터링', '검사', '점검', '최적화'],
    database: ['데이터베이스', 'DB', 'MySQL', 'PostgreSQL', 'Redis', '캐시'],
  };

  /**
   * 🔍 한국어 형태소 분석
   */
  analyze(text: string): KoreanAnalysisResult {
    // 1. 텍스트 전처리
    const normalized = this.normalizeText(text);

    // 2. 토큰화
    const tokens = this.tokenize(normalized);

    // 3. 형태소 분석
    const morphemes = this.analyzeMorphemes(tokens);

    // 4. 어간 추출
    const stems = morphemes.map(m => m.stem).filter((s: any) => s.length > 1);

    // 5. 키워드 추출
    const keywords = this.extractKeywords(morphemes);

    // 6. 개체명 인식
    const entities = this.recognizeEntities(morphemes);

    // 7. 분석 신뢰도 계산
    const confidence = this.calculateConfidence(morphemes);

    return {
      morphemes,
      stems,
      keywords,
      entities,
      confidence,
    };
  }

  /**
   * 🔧 텍스트 정규화
   */
  private normalizeText(text: string): string {
    return (
      text
        .trim()
        .replace(/\s+/g, ' ')
        // 특수문자 정리 (한글, 영문, 숫자, 하이픈, 점, 공백만 유지)
        .replace(/[^\w\sㄱ-ㅎㅏ-ㅣ가-힣.-]/g, ' ')
        .replace(/\s+/g, ' ')
    );
  }

  /**
   * ✂️ 토큰화
   */
  private tokenize(text: string): string[] {
    return text.split(/\s+/).filter(token => token.length > 0);
  }

  /**
   * 🔬 형태소 분석
   */
  private analyzeMorphemes(tokens: string[]): MorphemeResult[] {
    const morphemes: MorphemeResult[] = [];

    for (const token of tokens) {
      if (/[가-힣]/.test(token)) {
        // 한글 토큰 처리
        const result = this.analyzeKoreanToken(token);
        morphemes.push(...result);
      } else {
        // 영문/숫자 토큰 처리 (대소문자 유지)
        morphemes.push({
          surface: token,
          pos: this.classifyEnglishToken(token),
          stem: token, // 대소문자 유지
          feature: this.getSemanticFeature(token),
        });
      }
    }

    return morphemes;
  }

  /**
   * 🇰🇷 한국어 토큰 분석
   */
  private analyzeKoreanToken(token: string): MorphemeResult[] {
    const results: MorphemeResult[] = [];
    let remaining = token;

    // 조사 분리
    const particle = this.extractParticle(remaining);
    if (particle) {
      remaining = remaining.slice(0, -particle.length);
      results.push({
        surface: particle,
        pos: 'JKS', // 조사
        stem: particle,
        feature: 'particle',
      });
    }

    // 어미 분리
    const ending = this.extractEnding(remaining);
    if (ending) {
      remaining = remaining.slice(0, -ending.length);
      results.push({
        surface: ending,
        pos: 'EF', // 어미
        stem: ending,
        feature: 'ending',
      });
    }

    // 어간 처리
    if (remaining.length > 0) {
      results.unshift({
        surface: remaining,
        pos: this.classifyKoreanStem(remaining),
        stem: remaining,
        feature: this.getSemanticFeature(remaining),
      });
    }

    // 전체 토큰이 분석되지 않은 경우 원형 유지
    if (results.length === 0) {
      results.push({
        surface: token,
        pos: 'NNG', // 일반명사로 분류
        stem: token,
        feature: this.getSemanticFeature(token),
      });
    }

    return results;
  }

  /**
   * 🎯 조사 추출
   */
  private extractParticle(token: string): string | null {
    for (const particle of this.particles) {
      if (token.endsWith(particle) && token.length > particle.length) {
        return particle;
      }
    }
    return null;
  }

  /**
   * 🎯 어미 추출
   */
  private extractEnding(token: string): string | null {
    for (const ending of this.endings) {
      if (token.endsWith(ending) && token.length > ending.length) {
        return ending;
      }
    }
    return null;
  }

  /**
   * 🏷️ 한국어 어간 품사 분류
   */
  private classifyKoreanStem(stem: string): string {
    // 도메인 어휘 기반 분류
    for (const [category, words] of Object.entries(this.domainVocab)) {
      if (words.some(word => stem.includes(word) || word.includes(stem))) {
        switch (category) {
          case 'server':
          case 'database':
            return 'NNG'; // 일반명사
          case 'performance':
          case 'resource':
            return 'NNG'; // 일반명사
          case 'status':
            return 'NNG'; // 일반명사
          case 'action':
            return 'VV'; // 동사
        }
      }
    }

    // 기본 분류 (길이 기반)
    if (stem.length >= 3) {
      return 'NNG'; // 일반명사
    } else {
      return 'MM'; // 관형사
    }
  }

  /**
   * 🏷️ 영문 토큰 분류
   */
  private classifyEnglishToken(token: string): string {
    if (/^\d+$/.test(token)) {
      return 'SN'; // 숫자
    }
    if (/^[A-Z]+$/.test(token)) {
      return 'SL'; // 외국어 (약어)
    }
    return 'SL'; // 외국어
  }

  /**
   * 🎨 의미적 특징 추출
   */
  private getSemanticFeature(word: string): string {
    const lowerWord = word.toLowerCase();

    for (const [category, words] of Object.entries(this.domainVocab)) {
      if (
        words.some(
          w =>
            lowerWord.includes(w.toLowerCase()) ||
            w.toLowerCase().includes(lowerWord)
        )
      ) {
        return category;
      }
    }

    return 'general';
  }

  /**
   * 🔑 키워드 추출
   */
  private extractKeywords(morphemes: MorphemeResult[]): string[] {
    return morphemes
      .filter(
        m =>
          ['NNG', 'VV', 'SL'].includes(m.pos) && // 명사, 동사, 외국어
          m.stem.length > 1 &&
          m.feature !== 'general'
      )
      .map(m => m.stem)
      .filter((stem, index, array) => array.indexOf(stem) === index); // 중복 제거
  }

  /**
   * 🏢 개체명 인식
   */
  private recognizeEntities(morphemes: MorphemeResult[]): string[] {
    const entities: string[] = [];

    for (const morpheme of morphemes) {
      // 서버명 패턴 (server-web-001 형태)
      if (/^[a-z]+-[a-z]+-\d+$/i.test(morpheme.surface)) {
        entities.push(morpheme.surface);
      }

      // IP 주소 패턴
      if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(morpheme.surface)) {
        entities.push(morpheme.surface);
      }

      // 포트 번호 패턴
      if (/^:\d{2,5}$/.test(morpheme.surface)) {
        entities.push(morpheme.surface);
      }

      // 도메인 특화 개체명
      if (
        ['server', 'database', 'performance'].includes(morpheme.feature) &&
        morpheme.stem.length >= 3
      ) {
        entities.push(morpheme.stem);
      }
    }

    return [...new Set(entities)]; // 중복 제거
  }

  /**
   * 📊 분석 신뢰도 계산
   */
  private calculateConfidence(morphemes: MorphemeResult[]): number {
    if (morphemes.length === 0) return 0.1;

    // 도메인 특화 형태소 비율
    const domainMorphemes = morphemes.filter(m => m.feature !== 'general');
    const domainRatio = domainMorphemes.length / morphemes.length;

    // 품사 다양성
    const posTypes = new Set(morphemes.map(m => m.pos));
    const diversityBonus = Math.min(0.2, posTypes.size * 0.05);

    // 기본 신뢰도 + 도메인 비율 + 다양성 보너스
    const confidence = 0.5 + domainRatio * 0.3 + diversityBonus;

    return Math.min(0.95, confidence);
  }

  /**
   * 🔍 어간 기반 유사도 계산
   */
  calculateStemSimilarity(text1: string, text2: string): number {
    const analysis1 = this.analyze(text1);
    const analysis2 = this.analyze(text2);

    // 대소문자 무시하고 비교
    const stems1 = new Set(analysis1.stems.map((s: any) => s.toLowerCase()));
    const stems2 = new Set(analysis2.stems.map((s: any) => s.toLowerCase()));

    const intersection = new Set([...stems1].filter(x => stems2.has(x)));
    const union = new Set([...stems1, ...stems2]);

    // 유사도 계산 (Jaccard 계수)
    const jaccardSimilarity =
      union.size > 0 ? intersection.size / union.size : 0;

    // 동의어 매핑을 통한 의미적 유사도 추가
    const semanticBoost = this.calculateSemanticSimilarity(
      analysis1.stems,
      analysis2.stems
    );

    return Math.min(1.0, jaccardSimilarity + semanticBoost * 0.3);
  }

  /**
   * 🎯 동의어 기반 의미적 유사도 계산
   */
  private calculateSemanticSimilarity(
    stems1: string[],
    stems2: string[]
  ): number {
    let semanticMatches = 0;
    let totalComparisons = 0;

    for (const stem1 of stems1) {
      for (const stem2 of stems2) {
        totalComparisons++;

        // 동의어 그룹에서 매칭 확인
        const stem1Lower = stem1.toLowerCase();
        const stem2Lower = stem2.toLowerCase();

        // 동의어 매핑 확인
        const synonymGroups: Record<string, string[]> = {
          성능: ['속도', '퍼포먼스', '처리능력'],
          느림: ['지연', '늦음', '더딤'],
          빠름: ['신속', '고속', '빠른속도'],
          확인: ['체크', '점검', '검사'],
          문제: ['이슈', '장애', '오류', '에러'],
          서버: ['시스템', '호스트', '머신'],
          데이터베이스: ['DB', '디비', '저장소'],
        };

        for (const [main, synonyms] of Object.entries(synonymGroups)) {
          const group = [main, ...synonyms];

          const stem1InGroup = group.some(
            word => stem1Lower.includes(word) || word.includes(stem1Lower)
          );
          const stem2InGroup = group.some(
            word => stem2Lower.includes(word) || word.includes(stem2Lower)
          );

          if (stem1InGroup && stem2InGroup) {
            semanticMatches++;
            break;
          }
        }
      }
    }

    return totalComparisons > 0 ? semanticMatches / totalComparisons : 0;
  }

  /**
   * 🎯 의도 분석 (형태소 기반)
   */
  analyzeIntent(text: string): {
    intent: string;
    confidence: number;
    evidence: string[];
  } {
    const analysis = this.analyze(text);
    const evidence: string[] = [];

    // 의도별 키워드 패턴
    const intentPatterns = {
      status_check: ['상태', '확인', '체크', '헬스', '점검'],
      performance_analysis: ['성능', '속도', '지연', '응답시간', '최적화'],
      error_diagnosis: ['오류', '에러', '장애', '문제', '실패'],
      monitoring: ['모니터링', '감시', '추적', '관찰'],
      resource_check: ['CPU', '메모리', '디스크', '네트워크'],
    };

    let bestIntent = 'general';
    let maxScore = 0;

    for (const [intent, keywords] of Object.entries(intentPatterns)) {
      let score = 0;
      const matches: string[] = [];

      for (const stem of analysis.stems) {
        for (const keyword of keywords) {
          if (stem.includes(keyword) || keyword.includes(stem)) {
            score += 1;
            matches.push(stem);
          }
        }
      }

      if (score > maxScore) {
        maxScore = score;
        bestIntent = intent;
        evidence.length = 0;
        evidence.push(...matches);
      }
    }

    const confidence = maxScore > 0 ? Math.min(0.9, 0.4 + maxScore * 0.2) : 0.3;

    return {
      intent: bestIntent,
      confidence,
      evidence,
    };
  }
}

export const koreanMorphologyAnalyzer = new KoreanMorphologyAnalyzer();
