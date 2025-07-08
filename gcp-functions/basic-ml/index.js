/**
 * 🤖 Basic ML Function
 * 
 * 기본 머신러닝 처리 전문 Function
 * 메모리: 512MB, 타임아웃: 120초
 */

const functions = require('@google-cloud/functions-framework');
const { createErrorResponse, createSuccessResponse, validateRequest, isKorean, calculateProcessingTime } = require('../shared/types');

/**
 * 텍스트 분류 모델 (단순 베이즈 분류기)
 */
const TEXT_CLASSIFICATION_MODEL = {
    categories: {
        'technical': {
            keywords: ['서버', '시스템', '네트워크', '데이터베이스', 'CPU', '메모리', '디스크', '로그', '모니터링', '성능', '에러', '오류'],
            weight: 1.0
        },
        'operational': {
            keywords: ['운영', '관리', '설정', '배포', '백업', '복원', '유지보수', '업데이트', '보안', '권한'],
            weight: 0.9
        },
        'analysis': {
            keywords: ['분석', '통계', '예측', '추이', '트렌드', '패턴', '지표', '메트릭', '리포트'],
            weight: 0.8
        },
        'support': {
            keywords: ['도움', '문제', '해결', '지원', '가이드', '설명', '방법', '절차'],
            weight: 0.7
        },
        'general': {
            keywords: ['안녕', '감사', '확인', '상태', '정보', '알림', '질문'],
            weight: 0.5
        }
    }
};

/**
 * 간단한 벡터 임베딩 (TF-IDF 기반)
 */
const VOCABULARY = [
    '서버', '시스템', '모니터링', '알림', '로그', '성능', '에러', '분석', '상태', '설정',
    '네트워크', 'CPU', '메모리', '디스크', '데이터베이스', '운영', '관리', '백업', '보안',
    '문제', '해결', '도움', '확인', '정보', '예측', '통계', '지표', '트렌드', '패턴'
];

/**
 * 텍스트 분류
 * @param {string} text - 분류할 텍스트
 * @returns {Object}
 */
function classifyText(text) {
    const normalizedText = text.toLowerCase();
    const scores = {};

    // 각 카테고리별 점수 계산
    for (const [category, data] of Object.entries(TEXT_CLASSIFICATION_MODEL.categories)) {
        let score = 0;
        let matchCount = 0;

        for (const keyword of data.keywords) {
            if (normalizedText.includes(keyword)) {
                score += data.weight;
                matchCount++;
            }
        }

        // 정규화된 점수 계산
        scores[category] = {
            score: score,
            matchCount: matchCount,
            normalizedScore: score / data.keywords.length
        };
    }

    // 최고 점수 카테고리 선택
    const bestCategory = Object.entries(scores).reduce((best, [category, data]) =>
        data.score > best.score ? { category, score: data.score, matchCount: data.matchCount } : best
        , { category: 'general', score: 0, matchCount: 0 });

    return {
        classification: bestCategory.category,
        confidence: Math.min(bestCategory.score / 5, 1), // 최대 신뢰도 1로 제한
        scores: scores,
        matchCount: bestCategory.matchCount
    };
}

/**
 * 텍스트 임베딩 생성 (간단한 TF-IDF)
 * @param {string} text - 임베딩할 텍스트
 * @returns {number[]}
 */
function generateEmbedding(text) {
    const normalizedText = text.toLowerCase();
    const embedding = new Array(VOCABULARY.length).fill(0);

    // 용어 빈도 계산
    VOCABULARY.forEach((word, index) => {
        const regex = new RegExp(word, 'gi');
        const matches = normalizedText.match(regex);
        embedding[index] = matches ? matches.length : 0;
    });

    // L2 정규화
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    if (magnitude > 0) {
        return embedding.map(val => val / magnitude);
    }

    return embedding;
}

/**
 * 간단한 예측 모델 (시계열 예측)
 * @param {number[]} data - 시계열 데이터
 * @returns {Object}
 */
function predictTrend(data) {
    if (data.length < 2) {
        return {
            trend: 'stable',
            confidence: 0.1,
            prediction: data[0] || 0
        };
    }

    // 선형 회귀 계산
    const n = data.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = data;

    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumXX = x.reduce((sum, val) => sum + val * val, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // 다음 값 예측
    const nextValue = slope * n + intercept;

    // 트렌드 분석
    let trend = 'stable';
    if (slope > 0.1) trend = 'increasing';
    else if (slope < -0.1) trend = 'decreasing';

    // 신뢰도 계산 (R-squared 기반)
    const yMean = sumY / n;
    const totalVariation = y.reduce((sum, val) => sum + Math.pow(val - yMean, 2), 0);
    const residualVariation = y.reduce((sum, val, i) => {
        const predicted = slope * i + intercept;
        return sum + Math.pow(val - predicted, 2);
    }, 0);

    const rSquared = 1 - (residualVariation / totalVariation);
    const confidence = Math.max(0.1, Math.min(0.9, rSquared));

    return {
        trend,
        confidence,
        prediction: nextValue,
        slope,
        intercept,
        rSquared
    };
}

/**
 * 통계 분석
 * @param {number[]} data - 분석할 데이터
 * @returns {Object}
 */
function analyzeStatistics(data) {
    if (data.length === 0) {
        return {
            mean: 0,
            median: 0,
            std: 0,
            min: 0,
            max: 0,
            outliers: []
        };
    }

    const sorted = [...data].sort((a, b) => a - b);
    const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
    const median = sorted.length % 2 === 0
        ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
        : sorted[Math.floor(sorted.length / 2)];

    const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
    const std = Math.sqrt(variance);

    // 이상치 탐지 (IQR 방법)
    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;

    const outliers = data.filter(val => val < lowerBound || val > upperBound);

    return {
        mean,
        median,
        std,
        min: sorted[0],
        max: sorted[sorted.length - 1],
        q1,
        q3,
        iqr,
        outliers
    };
}

/**
 * 메인 ML 처리
 * @param {string} query - 사용자 질의
 * @param {Object} context - 추가 컨텍스트
 * @returns {Object}
 */
function processBasicML(query, context = {}) {
    const startTime = Date.now();

    // 1. 텍스트 분류
    const classification = classifyText(query);

    // 2. 임베딩 생성
    const embeddings = generateEmbedding(query);

    // 3. 예측 및 분석 (컨텍스트 데이터가 있는 경우)
    let predictions = null;
    let statistics = null;

    if (context.metrics && Array.isArray(context.metrics)) {
        predictions = predictTrend(context.metrics);
        statistics = analyzeStatistics(context.metrics);
    }

    // 4. 응답 생성
    let response = '';
    const categoryResponses = {
        technical: '기술적 분석을 수행했습니다. 시스템 상태와 성능 지표를 확인하겠습니다.',
        operational: '운영 관련 분석을 수행했습니다. 시스템 관리 및 운영 최적화를 도와드리겠습니다.',
        analysis: '데이터 분석을 수행했습니다. 통계적 패턴과 트렌드를 분석하겠습니다.',
        support: '지원 요청을 분석했습니다. 문제 해결을 도와드리겠습니다.',
        general: '일반적인 질의를 분석했습니다. 추가 정보를 제공해드리겠습니다.'
    };

    response = categoryResponses[classification.classification] || categoryResponses.general;

    // 예측 결과 추가
    if (predictions) {
        response += ` 시스템 트렌드는 ${predictions.trend}이며, 다음 예측값은 ${predictions.prediction.toFixed(2)}입니다.`;
    }

    // 통계 정보 추가
    if (statistics && statistics.outliers.length > 0) {
        response += ` 이상치 ${statistics.outliers.length}개를 발견했습니다.`;
    }

    const processingTime = Date.now() - startTime;

    return {
        success: true,
        response,
        confidence: classification.confidence,
        classification: classification.classification,
        embeddings,
        predictions,
        statistics,
        processingTime
    };
}

/**
 * 메인 핸들러
 */
functions.http('basic-ml', async (req, res) => {
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
        res.status(405).json(createErrorResponse('Method not allowed', 'basic-ml'));
        return;
    }

    try {
        // 요청 검증
        const requestData = validateRequest(req);
        if (!requestData) {
            res.status(400).json(createErrorResponse('Invalid request format', 'basic-ml'));
            return;
        }

        console.log(`Basic ML: Processing "${requestData.query}"`);

        // ML 처리
        const result = processBasicML(requestData.query, requestData.context);

        // 응답 생성
        const response = createSuccessResponse(
            result.response,
            'basic-ml',
            result.confidence,
            calculateProcessingTime(startTime),
            {
                classification: result.classification,
                embeddingDimension: result.embeddings.length,
                predictions: result.predictions,
                statistics: result.statistics,
                mlProcessingTime: result.processingTime
            }
        );

        console.log(`Basic ML: Completed in ${response.processingTime}ms (classification: ${result.classification})`);

        res.status(200).json(response);

    } catch (error) {
        console.error('Basic ML error:', error);

        const errorResponse = createErrorResponse(
            error.message || 'Basic ML processing failed',
            'basic-ml',
            calculateProcessingTime(startTime)
        );

        res.status(500).json(errorResponse);
    }
});

// 헬스 체크
functions.http('basic-ml-health', async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');

    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }

    // ML 시스템 테스트
    const testResult = processBasicML('서버 성능 분석해주세요', {
        metrics: [10, 15, 12, 18, 20, 16, 22]
    });

    const health = {
        status: testResult.success ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        function: 'basic-ml',
        memory: '512MB',
        timeout: '120s',
        version: '1.0.0',
        vocabularySize: VOCABULARY.length,
        categories: Object.keys(TEXT_CLASSIFICATION_MODEL.categories),
        test: {
            query: '서버 성능 분석해주세요',
            classification: testResult.classification,
            confidence: testResult.confidence,
            processingTime: testResult.processingTime,
            embeddingDimension: testResult.embeddings.length
        }
    };

    res.status(testResult.success ? 200 : 500).json(health);
}); 