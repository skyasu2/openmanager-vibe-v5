/**
 * 🤖 통합 AI 엔진 v3.0
 *
 * ✅ 현재: MCP + TensorFlow.js + NLP 로컬 추론 (완전 독립 동작)
 * ✅ LLM API 없이도 동작하는 자연어 질의응답
 * ✅ 실시간 장애 예측
 * ✅ 자동 보고서 생성
 * ✅ Vercel Edge Runtime 최적화
 * 🚀 향후: 선택적 외부 LLM API 연동으로 고급 기능 확장 계획
 * 
 * 🔄 v3.0 모듈화 완료:
 * - 8개 모듈로 분리 (1,303줄 → 8개 모듈)
 * - SOLID 원칙 적용
 * - 의존성 주입 패턴
 * - 확장 가능한 아키텍처
 */

// 통합 AI 엔진 익스포트
export {
    IntegratedAIEngine,
    integratedAIEngine
} from './integrated-ai-engine/IntegratedAIEngine';

// 타입 정의 익스포트
export type {
    AIQueryRequest,
    AIQueryResponse,
    SystemMetrics,
    AIEngineConfig,
    AIEngineStatus,
    StreamingChunk,
    NLPResult,
    IntentType,
    QueryType
} from './integrated-ai-engine/types/AIEngineTypes';

// 유틸리티 익스포트
export { aiEngineUtils } from './integrated-ai-engine/utils/AIEngineUtils';

// 기본 인스턴스를 기존 인터페이스로 익스포트 (하위 호환성)
import { integratedAIEngine } from './integrated-ai-engine/IntegratedAIEngine';

// 기존 코드와의 호환성을 위한 기본 내보내기
export default integratedAIEngine;

// 심플 토큰화 함수 (기존 호환성)
export function simpleTokenize(text: string): string[] {
    return text
        .toLowerCase()
        .replace(/[^\w\s가-힣]/g, ' ')
        .split(/\s+/)
        .filter(token => token.length > 1);
} 