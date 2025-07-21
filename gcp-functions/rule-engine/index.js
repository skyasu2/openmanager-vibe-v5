/**
 * 🔧 Rule Engine Function
 *
 * 규칙 기반 빠른 응답 전문 Function
 * 메모리: 256MB, 타임아웃: 30초
 */

const functions = require('@google-cloud/functions-framework');
const {
  createErrorResponse,
  createSuccessResponse,
  validateRequest,
  isKorean,
  calculateProcessingTime,
} = require('../shared/types');

/**
 * 규칙 데이터베이스 (패턴 매칭 기반)
 */
const RULES_DATABASE = {
  // 서버 상태 관련 규칙
  server: {
    patterns: [
      {
        regex: /서버\s*(상태|상황|정보)/i,
        response:
          '서버 상태를 확인해보겠습니다. 현재 모든 서버가 정상 운영 중입니다.',
        confidence: 0.9,
      },
      {
        regex: /(서버|시스템)\s*(다운|죽음|중지|멈춤)/i,
        response:
          '서버 중지 상황을 점검하겠습니다. 즉시 복구 작업을 진행하겠습니다.',
        confidence: 0.95,
      },
      {
        regex: /(서버|시스템)\s*(느림|지연|렉|버벅)/i,
        response:
          '서버 성능 이슈를 확인하겠습니다. 성능 최적화 작업을 수행하겠습니다.',
        confidence: 0.9,
      },
      {
        regex: /서버\s*(목록|리스트|전체)/i,
        response:
          '등록된 서버 목록을 조회하겠습니다. 현재 관리 중인 서버 정보를 제공하겠습니다.',
        confidence: 0.85,
      },
      {
        regex: /서버\s*(추가|등록|생성)/i,
        response:
          '새로운 서버 등록을 도와드리겠습니다. 서버 정보를 입력해주세요.',
        confidence: 0.8,
      },
    ],
  },

  // 모니터링 관련 규칙
  monitoring: {
    patterns: [
      {
        regex: /(모니터링|감시|추적)\s*(시작|활성화|켜기)/i,
        response:
          '모니터링 시스템을 활성화하겠습니다. 실시간 모니터링을 시작합니다.',
        confidence: 0.9,
      },
      {
        regex: /(모니터링|감시|추적)\s*(중지|비활성화|끄기)/i,
        response:
          '모니터링 시스템을 비활성화하겠습니다. 모니터링을 중지합니다.',
        confidence: 0.9,
      },
      {
        regex: /(CPU|메모리|디스크|네트워크)\s*(사용량|상태|정보)/i,
        response:
          '시스템 리소스 사용량을 확인하겠습니다. 상세한 메트릭 정보를 제공하겠습니다.',
        confidence: 0.85,
      },
      {
        regex: /(로그|에러|오류)\s*(확인|조회|검색)/i,
        response:
          '로그 정보를 검색하겠습니다. 최근 에러 및 경고 메시지를 확인하겠습니다.',
        confidence: 0.8,
      },
    ],
  },

  // 알림 관련 규칙
  notification: {
    patterns: [
      {
        regex: /(알림|경고|통지)\s*(설정|구성|변경)/i,
        response:
          '알림 설정을 구성하겠습니다. 알림 조건과 대상을 지정해주세요.',
        confidence: 0.85,
      },
      {
        regex: /(알림|경고|통지)\s*(목록|리스트|전체)/i,
        response:
          '현재 알림 목록을 조회하겠습니다. 활성화된 알림 규칙을 확인하겠습니다.',
        confidence: 0.8,
      },
      {
        regex: /(긴급|중요|즉시)\s*(알림|경고)/i,
        response:
          '긴급 알림을 확인하겠습니다. 즉시 처리가 필요한 상황을 점검하겠습니다.',
        confidence: 0.95,
      },
    ],
  },

  // 일반적인 FAQ 규칙
  faq: {
    patterns: [
      {
        regex: /(안녕|반갑|안녕하세요|처음)/i,
        response:
          '안녕하세요! OpenManager에 오신 것을 환영합니다. 무엇을 도와드릴까요?',
        confidence: 0.9,
      },
      {
        regex: /(도움|도움말|헬프|사용법)/i,
        response:
          '사용법을 안내해드리겠습니다. 서버 모니터링, 알림 설정, 로그 조회 등의 기능을 제공합니다.',
        confidence: 0.85,
      },
      {
        regex: /(기능|할 수 있는|가능한)/i,
        response:
          '주요 기능으로는 서버 모니터링, 실시간 알림, 로그 관리, 성능 분석 등이 있습니다.',
        confidence: 0.8,
      },
      {
        regex: /(감사|고마워|고맙습니다|잘했어)/i,
        response:
          '도움이 되어 기쁩니다! 추가로 궁금한 점이 있으시면 언제든 말씀해주세요.',
        confidence: 0.9,
      },
      {
        regex: /(문제|오류|에러|안됨|실패)/i,
        response:
          '문제 상황을 확인해보겠습니다. 어떤 문제가 발생했는지 자세히 알려주세요.',
        confidence: 0.85,
      },
    ],
  },

  // 기본 시스템 명령어
  commands: {
    patterns: [
      {
        regex: /^(시간|현재시간|지금몇시)/i,
        response: `현재 시간은 ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}입니다.`,
        confidence: 0.95,
      },
      {
        regex: /(날씨|기상|온도)/i,
        response:
          '죄송합니다. 날씨 정보는 제공하지 않습니다. 서버 관리 관련 질문을 해주세요.',
        confidence: 0.7,
      },
      {
        regex: /(재시작|리부팅|reboot)/i,
        response:
          '시스템 재시작을 요청하셨습니다. 안전한 재시작을 위해 확인 절차를 진행하겠습니다.',
        confidence: 0.9,
      },
      {
        regex: /(백업|복원|restore)/i,
        response:
          '백업 및 복원 작업을 도와드리겠습니다. 어떤 데이터를 백업하시겠습니까?',
        confidence: 0.85,
      },
    ],
  },
};

/**
 * 키워드 기반 빠른 매칭
 */
const KEYWORD_RULES = {
  서버: {
    response:
      '서버 관련 작업을 도와드리겠습니다. 구체적으로 어떤 도움이 필요하신가요?',
    confidence: 0.6,
  },
  모니터링: {
    response:
      '모니터링 시스템을 확인하겠습니다. 어떤 항목을 모니터링하시겠습니까?',
    confidence: 0.6,
  },
  알림: {
    response: '알림 시스템을 설정하겠습니다. 어떤 알림을 받으시겠습니까?',
    confidence: 0.6,
  },
  로그: {
    response: '로그 시스템을 확인하겠습니다. 어떤 로그를 조회하시겠습니까?',
    confidence: 0.6,
  },
  성능: {
    response: '시스템 성능을 분석하겠습니다. 어떤 부분의 성능이 궁금하신가요?',
    confidence: 0.6,
  },
  에러: {
    response: '에러 상황을 확인하겠습니다. 어떤 에러가 발생했는지 알려주세요.',
    confidence: 0.6,
  },
};

/**
 * 규칙 매칭 수행
 * @param {string} query - 사용자 질의
 * @returns {Object|null}
 */
function matchRules(query) {
  const normalizedQuery = query.toLowerCase().trim();

  // 1. 패턴 매칭 (높은 신뢰도)
  for (const [category, rules] of Object.entries(RULES_DATABASE)) {
    for (const rule of rules.patterns) {
      if (rule.regex.test(normalizedQuery)) {
        return {
          matched: true,
          rule: `${category}-pattern`,
          response: rule.response,
          confidence: rule.confidence,
          category: category,
          type: 'pattern',
        };
      }
    }
  }

  // 2. 키워드 매칭 (중간 신뢰도)
  for (const [keyword, rule] of Object.entries(KEYWORD_RULES)) {
    if (normalizedQuery.includes(keyword)) {
      return {
        matched: true,
        rule: `keyword-${keyword}`,
        response: rule.response,
        confidence: rule.confidence,
        category: 'keyword',
        type: 'keyword',
      };
    }
  }

  // 3. 매칭 실패
  return null;
}

/**
 * 유사도 기반 매칭 (폴백)
 * @param {string} query - 사용자 질의
 * @returns {Object|null}
 */
function fuzzyMatch(query) {
  const commonPhrases = [
    {
      phrase: '서버 상태',
      response: '서버 상태를 확인해보겠습니다.',
      confidence: 0.5,
    },
    {
      phrase: '도움말',
      response: '사용법을 안내해드리겠습니다.',
      confidence: 0.5,
    },
    {
      phrase: '모니터링',
      response: '모니터링 시스템을 확인하겠습니다.',
      confidence: 0.5,
    },
    {
      phrase: '알림 설정',
      response: '알림 설정을 도와드리겠습니다.',
      confidence: 0.5,
    },
  ];

  const normalizedQuery = query.toLowerCase();

  for (const item of commonPhrases) {
    if (normalizedQuery.includes(item.phrase)) {
      return {
        matched: true,
        rule: `fuzzy-${item.phrase}`,
        response: item.response,
        confidence: item.confidence,
        category: 'fuzzy',
        type: 'fuzzy',
      };
    }
  }

  return null;
}

/**
 * 메인 규칙 엔진 처리
 * @param {string} query - 사용자 질의
 * @returns {Object}
 */
function processRuleEngine(query) {
  const startTime = Date.now();

  // 1. 정확한 패턴 매칭
  let result = matchRules(query);

  // 2. 유사도 기반 매칭 (폴백)
  if (!result) {
    result = fuzzyMatch(query);
  }

  // 3. 최종 폴백 응답
  if (!result) {
    result = {
      matched: false,
      rule: 'no-match',
      response:
        '죄송합니다. 정확한 답변을 드리기 어렵습니다. 다른 방식으로 질문해주시거나 도움말을 요청해주세요.',
      confidence: 0.2,
      category: 'fallback',
      type: 'fallback',
    };
  }

  const processingTime = Date.now() - startTime;

  return {
    success: result.matched,
    response: result.response,
    confidence: result.confidence,
    rule: result.rule,
    category: result.category,
    type: result.type,
    keywords: extractKeywords(query),
    processingTime,
  };
}

/**
 * 키워드 추출
 * @param {string} query - 사용자 질의
 * @returns {string[]}
 */
function extractKeywords(query) {
  const keywords = [];
  const importantTerms = [
    '서버',
    '모니터링',
    '알림',
    '로그',
    '성능',
    '에러',
    '시스템',
    '상태',
    '확인',
    '설정',
  ];

  const normalizedQuery = query.toLowerCase();

  for (const term of importantTerms) {
    if (normalizedQuery.includes(term)) {
      keywords.push(term);
    }
  }

  return keywords;
}

/**
 * 메인 핸들러
 */
functions.http('rule-engine', async (req, res) => {
  const startTime = Date.now();

  // CORS 설정
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res
      .status(405)
      .json(createErrorResponse('Method not allowed', 'rule-engine'));
    return;
  }

  try {
    // 요청 검증
    const requestData = validateRequest(req);
    if (!requestData) {
      res
        .status(400)
        .json(createErrorResponse('Invalid request format', 'rule-engine'));
      return;
    }

    console.log(`Rule Engine: Processing "${requestData.query}"`);

    // 규칙 엔진 처리
    const result = processRuleEngine(requestData.query);

    // 응답 생성
    const response = createSuccessResponse(
      result.response,
      'rule-engine',
      result.confidence,
      calculateProcessingTime(startTime),
      {
        matchedRule: result.rule,
        category: result.category,
        type: result.type,
        keywords: result.keywords,
        ruleProcessingTime: result.processingTime,
      }
    );

    console.log(
      `Rule Engine: Completed in ${response.processingTime}ms (rule: ${result.rule})`
    );

    res.status(200).json(response);
  } catch (error) {
    console.error('Rule Engine error:', error);

    const errorResponse = createErrorResponse(
      error.message || 'Rule Engine processing failed',
      'rule-engine',
      calculateProcessingTime(startTime)
    );

    res.status(500).json(errorResponse);
  }
});

// 헬스 체크
functions.http('rule-engine-health', async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  // 규칙 엔진 테스트
  const testResult = processRuleEngine('서버 상태 확인');

  const health = {
    status: testResult.success ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    function: 'rule-engine',
    memory: '256MB',
    timeout: '30s',
    version: '1.0.0',
    ruleCount: Object.values(RULES_DATABASE).reduce(
      (total, rules) => total + rules.patterns.length,
      0
    ),
    keywordCount: Object.keys(KEYWORD_RULES).length,
    test: {
      query: '서버 상태 확인',
      rule: testResult.rule,
      confidence: testResult.confidence,
      processingTime: testResult.processingTime,
    },
  };

  res.status(200).json(health);
});
