/**
 * 🧠 Korean NLP Function
 * 
 * 한국어 자연어 처리 전문 Function
 * 메모리: 512MB, 타임아웃: 180초
 */

const functions = require('@google-cloud/functions-framework');
const { createErrorResponse, createSuccessResponse, validateRequest, isKorean, calculateProcessingTime } = require('../shared/types');

// 한국어 NLP 도구 (경량 버전)
const KOREAN_PARTICLES = ['은', '는', '이', '가', '을', '를', '에', '의', '로', '와', '과', '에서', '부터', '까지', '만', '도', '라도', '조차', '마저'];
const KOREAN_ENDINGS = ['다', '요', '습니다', '이다', '였다', '했다', '될', '될까', '하자', '하지만', '그러나', '그런데'];

/**
 * 한국어 의도 분류
 * @param {string} query - 사용자 질의
 * @returns {string}
 */
function classifyIntent(query) {
    const lowerQuery = query.toLowerCase();

    // 질문 패턴
    if (lowerQuery.includes('무엇') || lowerQuery.includes('뭐') || lowerQuery.includes('?')) {
        return 'question';
    }

    // 명령 패턴
    if (lowerQuery.includes('해줘') || lowerQuery.includes('해주세요') || lowerQuery.includes('하자')) {
        return 'command';
    }

    // 요청 패턴
    if (lowerQuery.includes('알려') || lowerQuery.includes('보여') || lowerQuery.includes('설명')) {
        return 'request';
    }

    // 확인 패턴
    if (lowerQuery.includes('확인') || lowerQuery.includes('체크') || lowerQuery.includes('검사')) {
        return 'check';
    }

    // 분석 패턴
    if (lowerQuery.includes('분석') || lowerQuery.includes('분석해') || lowerQuery.includes('조사')) {
        return 'analysis';
    }

    // 서버 관련 패턴
    if (lowerQuery.includes('서버') || lowerQuery.includes('시스템') || lowerQuery.includes('상태')) {
        return 'server-info';
    }

    return 'general';
}

/**
 * 한국어 감정 분석
 * @param {string} query - 사용자 질의
 * @returns {string}
 */
function analyzeSentiment(query) {
    const positiveWords = ['좋다', '좋아', '훌륭', '완벽', '최고', '감사', '고마워', '잘됐다', '성공'];
    const negativeWords = ['나쁘다', '안좋다', '문제', '오류', '에러', '실패', '안됨', '못함', '어려워'];
    const urgentWords = ['급해', '빨리', '즉시', '지금', '당장', '긴급', '중요해'];

    const lowerQuery = query.toLowerCase();

    if (urgentWords.some(word => lowerQuery.includes(word))) {
        return 'urgent';
    }

    if (positiveWords.some(word => lowerQuery.includes(word))) {
        return 'positive';
    }

    if (negativeWords.some(word => lowerQuery.includes(word))) {
        return 'negative';
    }

    return 'neutral';
}

/**
 * 한국어 엔티티 추출
 * @param {string} query - 사용자 질의
 * @returns {string[]}
 */
function extractEntities(query) {
    const entities = [];

    // 서버 관련 엔티티
    const serverPatterns = [
        /서버\s*([가-힣\w]+)/g,
        /시스템\s*([가-힣\w]+)/g,
        /(\w+)\s*서버/g
    ];

    serverPatterns.forEach(pattern => {
        const matches = query.match(pattern);
        if (matches) {
            entities.push(...matches.map(match => match.trim()));
        }
    });

    // 숫자 엔티티
    const numberPattern = /\d+/g;
    const numbers = query.match(numberPattern);
    if (numbers) {
        entities.push(...numbers.map(num => `NUMBER:${num}`));
    }

    // 시간 엔티티
    const timePattern = /(오늘|어제|내일|이번|지난|다음)\s*(주|달|년|시간|분|초)?/g;
    const times = query.match(timePattern);
    if (times) {
        entities.push(...times.map(time => `TIME:${time}`));
    }

    return [...new Set(entities)];
}

/**
 * 한국어 형태소 분석 (단순 버전)
 * @param {string} query - 사용자 질의
 * @returns {Object}
 */
function analyzeMorphology(query) {
    const words = query.split(/\s+/);
    const morphology = {
        nouns: [],
        verbs: [],
        adjectives: [],
        particles: []
    };

    words.forEach(word => {
        // 조사 확인
        const hasParticle = KOREAN_PARTICLES.some(particle => word.includes(particle));
        if (hasParticle) {
            morphology.particles.push(word);
        }

        // 동사 확인 (간단한 패턴)
        if (word.includes('하다') || word.includes('되다') || word.includes('있다') || KOREAN_ENDINGS.some(ending => word.endsWith(ending))) {
            morphology.verbs.push(word);
        }

        // 형용사 확인
        if (word.includes('좋다') || word.includes('나쁘다') || word.includes('크다') || word.includes('작다')) {
            morphology.adjectives.push(word);
        }

        // 나머지는 명사로 분류
        if (!hasParticle && !morphology.verbs.includes(word) && !morphology.adjectives.includes(word)) {
            morphology.nouns.push(word);
        }
    });

    return morphology;
}

/**
 * 한국어 응답 생성
 * @param {Object} analysis - 분석 결과
 * @param {string} query - 원본 질의
 * @returns {string}
 */
function generateKoreanResponse(analysis, query) {
    const { intent, sentiment, entities } = analysis;

    // 의도별 응답 템플릿
    const templates = {
        question: [
            "질문해주신 내용을 분석해보겠습니다.",
            "궁금해하시는 점에 대해 알려드리겠습니다.",
            "문의하신 내용을 확인해보겠습니다."
        ],
        command: [
            "요청하신 작업을 수행하겠습니다.",
            "지시사항을 실행하겠습니다.",
            "명령을 처리하겠습니다."
        ],
        request: [
            "요청하신 정보를 제공해드리겠습니다.",
            "필요하신 내용을 알려드리겠습니다.",
            "원하시는 정보를 찾아보겠습니다."
        ],
        check: [
            "확인 작업을 진행하겠습니다.",
            "검사 결과를 알려드리겠습니다.",
            "상태를 체크해보겠습니다."
        ],
        analysis: [
            "분석 작업을 수행하겠습니다.",
            "데이터를 분석해보겠습니다.",
            "상세한 분석 결과를 제공하겠습니다."
        ],
        'server-info': [
            "서버 정보를 확인해보겠습니다.",
            "시스템 상태를 점검하겠습니다.",
            "서버 모니터링 결과를 알려드리겠습니다."
        ],
        general: [
            "요청을 처리하겠습니다.",
            "도움을 드리겠습니다.",
            "문의사항을 해결해드리겠습니다."
        ]
    };

    // 감정에 따른 응답 수정
    let response = templates[intent][Math.floor(Math.random() * templates[intent].length)];

    if (sentiment === 'urgent') {
        response = '긴급 ' + response.replace('겠습니다', '드리겠습니다');
    } else if (sentiment === 'positive') {
        response = response.replace('겠습니다', '드리겠습니다');
    } else if (sentiment === 'negative') {
        response = '문제 해결을 위해 ' + response;
    }

    // 엔티티 정보 추가
    if (entities.length > 0) {
        const entityInfo = entities.filter(e => !e.startsWith('NUMBER:') && !e.startsWith('TIME:'));
        if (entityInfo.length > 0) {
            response += ` ${entityInfo.join(', ')}에 대한 정보를 포함하여 답변드리겠습니다.`;
        }
    }

    return response;
}

/**
 * 메인 한국어 NLP 처리
 * @param {string} query - 사용자 질의
 * @returns {Object}
 */
function processKoreanNLP(query) {
    const startTime = Date.now();

    // 한국어 검증
    if (!isKorean(query)) {
        return {
            success: false,
            confidence: 0.1,
            error: 'Not a Korean query'
        };
    }

    // 분석 수행
    const intent = classifyIntent(query);
    const sentiment = analyzeSentiment(query);
    const entities = extractEntities(query);
    const morphology = analyzeMorphology(query);

    const analysis = {
        intent,
        sentiment,
        entities,
        morphology,
        confidence: 0.85 // 한국어 특화 처리에 대한 기본 신뢰도
    };

    // 응답 생성
    const response = generateKoreanResponse(analysis, query);

    // 신뢰도 계산
    let confidence = 0.85;
    if (entities.length > 0) confidence += 0.05;
    if (intent !== 'general') confidence += 0.05;
    if (sentiment !== 'neutral') confidence += 0.03;

    const processingTime = Date.now() - startTime;

    return {
        success: true,
        response,
        confidence: Math.min(confidence, 0.98),
        analysis,
        processingTime
    };
}

/**
 * 메인 핸들러
 */
functions.http('korean-nlp', async (req, res) => {
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
        res.status(405).json(createErrorResponse('Method not allowed', 'korean-nlp'));
        return;
    }

    try {
        // 요청 검증
        const requestData = validateRequest(req);
        if (!requestData) {
            res.status(400).json(createErrorResponse('Invalid request format', 'korean-nlp'));
            return;
        }

        console.log(`Korean NLP: Processing "${requestData.query}"`);

        // 한국어 NLP 처리
        const result = processKoreanNLP(requestData.query);

        if (!result.success) {
            res.status(400).json(createErrorResponse(result.error, 'korean-nlp'));
            return;
        }

        // 응답 생성
        const response = createSuccessResponse(
            result.response,
            'korean-nlp',
            result.confidence,
            calculateProcessingTime(startTime),
            {
                analysis: result.analysis,
                koreanSpecific: true
            }
        );

        console.log(`Korean NLP: Completed in ${response.processingTime}ms (confidence: ${result.confidence})`);

        res.status(200).json(response);

    } catch (error) {
        console.error('Korean NLP error:', error);

        const errorResponse = createErrorResponse(
            error.message || 'Korean NLP processing failed',
            'korean-nlp',
            calculateProcessingTime(startTime)
        );

        res.status(500).json(errorResponse);
    }
});

// 헬스 체크
functions.http('korean-nlp-health', async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');

    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }

    // 간단한 한국어 처리 테스트
    const testResult = processKoreanNLP('서버 상태가 어떻습니까?');

    const health = {
        status: testResult.success ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        function: 'korean-nlp',
        memory: '512MB',
        timeout: '180s',
        version: '1.0.0',
        test: {
            query: '서버 상태가 어떻습니까?',
            confidence: testResult.confidence,
            processingTime: testResult.processingTime
        }
    };

    res.status(testResult.success ? 200 : 500).json(health);
}); 