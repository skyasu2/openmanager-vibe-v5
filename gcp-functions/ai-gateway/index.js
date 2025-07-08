/**
 * 🚀 AI Gateway Function
 * 
 * 베르셀 요청을 받아 적절한 GCP Function으로 라우팅하는 게이트웨이
 * 메모리: 256MB, 타임아웃: 60초
 */

const functions = require('@google-cloud/functions-framework');
const { createErrorResponse, createSuccessResponse, validateRequest, isKorean, calculateProcessingTime } = require('../shared/types');

// 환경 변수 설정
const KOREAN_NLP_URL = process.env.KOREAN_NLP_URL || 'https://asia-northeast3-openmanager-ai.cloudfunctions.net/korean-nlp';
const RULE_ENGINE_URL = process.env.RULE_ENGINE_URL || 'https://asia-northeast3-openmanager-ai.cloudfunctions.net/rule-engine';
const BASIC_ML_URL = process.env.BASIC_ML_URL || 'https://asia-northeast3-openmanager-ai.cloudfunctions.net/basic-ml';
const VM_CONTEXT_URL = process.env.VM_CONTEXT_URL || 'http://34.64.213.108:10001';

/**
 * 엔진 우선순위 결정
 * @param {string} query - 사용자 질의
 * @param {string} mode - 처리 모드
 * @returns {string[]} 우선순위 엔진 배열
 */
function determineEngineOrder(query, mode) {
    // 모드별 우선순위
    if (mode === 'korean') return ['korean-nlp', 'rule-engine', 'basic-ml'];
    if (mode === 'rule') return ['rule-engine', 'korean-nlp', 'basic-ml'];
    if (mode === 'ml') return ['basic-ml', 'korean-nlp', 'rule-engine'];

    // 자동 모드 - 내용 기반 우선순위
    const isKoreanQuery = isKorean(query);
    const isSimpleQuery = query.length < 50 && !query.includes('?');
    const isComplexQuery = query.length > 100 || query.includes('분석') || query.includes('예측');

    if (isKoreanQuery && isSimpleQuery) {
        return ['rule-engine', 'korean-nlp', 'basic-ml'];
    } else if (isKoreanQuery) {
        return ['korean-nlp', 'rule-engine', 'basic-ml'];
    } else if (isComplexQuery) {
        return ['basic-ml', 'korean-nlp', 'rule-engine'];
    } else {
        return ['rule-engine', 'basic-ml', 'korean-nlp'];
    }
}

/**
 * 엔진 호출
 * @param {string} engine - 엔진 이름
 * @param {Object} requestData - 요청 데이터
 * @returns {Promise<Object>}
 */
async function callEngine(engine, requestData) {
    const urls = {
        'korean-nlp': KOREAN_NLP_URL,
        'rule-engine': RULE_ENGINE_URL,
        'basic-ml': BASIC_ML_URL
    };

    const url = urls[engine];
    if (!url) {
        throw new Error(`Unknown engine: ${engine}`);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000); // 45초 타임아웃

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Gateway-Request': 'true'
            },
            body: JSON.stringify(requestData),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        clearTimeout(timeoutId);
        throw error;
    }
}

/**
 * 컨텍스트 수집 (선택적)
 * @param {Object} requestData - 요청 데이터
 * @returns {Promise<Object>}
 */
async function collectContext(requestData) {
    // 복잡한 쿼리나 시스템 관련 쿼리에서만 컨텍스트 수집
    const needsContext = requestData.query.includes('서버') ||
        requestData.query.includes('시스템') ||
        requestData.query.includes('상태') ||
        requestData.query.includes('모니터링');

    if (!needsContext) {
        return {};
    }

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5초 타임아웃

        const response = await fetch(`${VM_CONTEXT_URL}/context/system`, {
            method: 'GET',
            headers: {
                'X-Gateway-Request': 'true'
            },
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (response.ok) {
            return await response.json();
        }
    } catch (error) {
        console.warn('Context collection failed:', error.message);
    }

    return {};
}

/**
 * 병렬 처리 (빠른 응답을 위한 최적화)
 * @param {Object} requestData - 요청 데이터
 * @param {string[]} engines - 엔진 배열
 * @returns {Promise<Object>}
 */
async function processInParallel(requestData, engines) {
    const [primaryEngine, ...fallbackEngines] = engines;

    try {
        // 1차 엔진 호출
        const primaryResult = await callEngine(primaryEngine, requestData);

        // 신뢰도가 높으면 즉시 반환
        if (primaryResult.confidence > 0.8) {
            return primaryResult;
        }

        // 신뢰도가 낮으면 2차 엔진 병렬 호출
        const fallbackPromises = fallbackEngines.slice(0, 2).map(engine =>
            callEngine(engine, requestData).catch(error => ({
                success: false,
                error: error.message,
                engine
            }))
        );

        const fallbackResults = await Promise.all(fallbackPromises);

        // 가장 신뢰도 높은 결과 선택
        const allResults = [primaryResult, ...fallbackResults.filter(r => r.success)];
        return allResults.reduce((best, current) =>
            current.confidence > best.confidence ? current : best
        );

    } catch (error) {
        // 1차 엔진 실패 시 폴백 엔진 순차 실행
        for (const engine of fallbackEngines) {
            try {
                const result = await callEngine(engine, requestData);
                if (result.success) {
                    return result;
                }
            } catch (fallbackError) {
                console.warn(`Fallback engine ${engine} failed:`, fallbackError.message);
            }
        }

        throw error;
    }
}

/**
 * 메인 핸들러
 */
functions.http('ai-gateway', async (req, res) => {
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
        res.status(405).json(createErrorResponse('Method not allowed', 'ai-gateway'));
        return;
    }

    try {
        // 요청 검증
        const requestData = validateRequest(req);
        if (!requestData) {
            res.status(400).json(createErrorResponse('Invalid request format', 'ai-gateway'));
            return;
        }

        console.log(`AI Gateway: Processing query "${requestData.query}" (mode: ${requestData.mode})`);

        // 엔진 우선순위 결정
        const engines = determineEngineOrder(requestData.query, requestData.mode);

        // 컨텍스트 수집 (병렬)
        const contextPromise = collectContext(requestData);

        // AI 처리 (병렬)
        const aiPromise = processInParallel(requestData, engines);

        // 결과 대기
        const [context, aiResult] = await Promise.all([
            contextPromise.catch(() => ({})),
            aiPromise
        ]);

        // 컨텍스트 추가
        if (Object.keys(context).length > 0) {
            aiResult.metadata = {
                ...aiResult.metadata,
                context: context
            };
        }

        // 처리 시간 업데이트
        aiResult.processingTime = calculateProcessingTime(startTime);

        console.log(`AI Gateway: Completed in ${aiResult.processingTime}ms (engine: ${aiResult.engine})`);

        res.status(200).json(aiResult);

    } catch (error) {
        console.error('AI Gateway error:', error);

        const errorResponse = createErrorResponse(
            error.message || 'Unknown error',
            'ai-gateway',
            calculateProcessingTime(startTime)
        );

        res.status(500).json(errorResponse);
    }
});

// 헬스 체크
functions.http('ai-gateway-health', async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');

    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }

    const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        function: 'ai-gateway',
        memory: '256MB',
        timeout: '60s',
        version: '1.0.0'
    };

    res.status(200).json(health);
}); 