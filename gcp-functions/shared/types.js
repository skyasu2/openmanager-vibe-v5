/**
 * 🔷 GCP Functions 공통 타입 정의
 * 
 * OpenManager AI 엔진 이전을 위한 타입 정의
 */

/**
 * AI 요청 타입
 * @typedef {Object} AIRequest
 * @property {string} query - 사용자 질의
 * @property {string} [mode] - 처리 모드 ('korean', 'rule', 'ml', 'auto')
 * @property {Object} [context] - 추가 컨텍스트
 * @property {string} [sessionId] - 세션 ID
 * @property {string} [requestId] - 요청 ID
 * @property {number} [timestamp] - 타임스탬프
 */

/**
 * AI 응답 타입
 * @typedef {Object} AIResponse
 * @property {boolean} success - 성공 여부
 * @property {string} response - 응답 내용
 * @property {number} confidence - 신뢰도 (0-1)
 * @property {string} engine - 사용된 엔진
 * @property {number} processingTime - 처리 시간 (ms)
 * @property {string[]} [sources] - 응답 소스
 * @property {string[]} [suggestions] - 추천사항
 * @property {Object} [metadata] - 메타데이터
 * @property {string} [error] - 오류 메시지
 */

/**
 * 한국어 NLP 결과 타입
 * @typedef {Object} KoreanNLPResult
 * @property {string} intent - 의도 분류
 * @property {string} sentiment - 감정 분석
 * @property {string[]} entities - 엔티티 추출
 * @property {Object} morphology - 형태소 분석
 * @property {number} confidence - 신뢰도
 */

/**
 * 규칙 엔진 결과 타입
 * @typedef {Object} RuleEngineResult
 * @property {boolean} matched - 규칙 매칭 여부
 * @property {string} rule - 매칭된 규칙
 * @property {string} response - 생성된 응답
 * @property {number} confidence - 신뢰도
 * @property {string[]} keywords - 키워드
 */

/**
 * ML 분석 결과 타입
 * @typedef {Object} MLAnalysisResult
 * @property {string} classification - 분류 결과
 * @property {number[]} embeddings - 임베딩 벡터
 * @property {Object} predictions - 예측 결과
 * @property {number} confidence - 신뢰도
 * @property {string} model - 사용된 모델
 */

/**
 * 컨텍스트 데이터 타입
 * @typedef {Object} ContextData
 * @property {Object} system - 시스템 상태
 * @property {Object} mcp - MCP 데이터
 * @property {Object} metrics - 메트릭 데이터
 * @property {number} timestamp - 수집 시간
 */

/**
 * 에러 응답 생성
 * @param {string} message - 에러 메시지
 * @param {string} [engine] - 엔진 이름
 * @param {number} [processingTime] - 처리 시간
 * @returns {AIResponse}
 */
function createErrorResponse(message, engine = 'unknown', processingTime = 0) {
    return {
        success: false,
        response: `처리 중 오류가 발생했습니다: ${message}`,
        confidence: 0,
        engine,
        processingTime,
        error: message,
        metadata: {
            errorCode: 'PROCESSING_ERROR',
            timestamp: Date.now()
        }
    };
}

/**
 * 성공 응답 생성
 * @param {string} response - 응답 내용
 * @param {string} engine - 엔진 이름
 * @param {number} confidence - 신뢰도
 * @param {number} processingTime - 처리 시간
 * @param {Object} [metadata] - 추가 메타데이터
 * @returns {AIResponse}
 */
function createSuccessResponse(response, engine, confidence, processingTime, metadata = {}) {
    return {
        success: true,
        response,
        confidence,
        engine,
        processingTime,
        sources: [`gcp-${engine}`],
        metadata: {
            timestamp: Date.now(),
            gcpFunction: engine,
            ...metadata
        }
    };
}

/**
 * 요청 유효성 검사
 * @param {Object} req - 요청 객체
 * @returns {AIRequest|null}
 */
function validateRequest(req) {
    const { query, mode, context, sessionId } = req.body || {};

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
        return null;
    }

    return {
        query: query.trim(),
        mode: mode || 'auto',
        context: context || {},
        sessionId: sessionId || `gcp_${Date.now()}`,
        requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now()
    };
}

/**
 * 한국어 감지
 * @param {string} text - 검사할 텍스트
 * @returns {boolean}
 */
function isKorean(text) {
    const koreanRegex = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/;
    return koreanRegex.test(text);
}

/**
 * 응답 시간 계산
 * @param {number} startTime - 시작 시간
 * @returns {number}
 */
function calculateProcessingTime(startTime) {
    return Date.now() - startTime;
}

module.exports = {
    createErrorResponse,
    createSuccessResponse,
    validateRequest,
    isKorean,
    calculateProcessingTime
}; 