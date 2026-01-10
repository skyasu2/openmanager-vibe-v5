/**
 * Type Guards
 *
 * 타입 가드 함수
 */

import type { MLData, RAGData, RuleData } from './data';
import type { AIScenario } from './enums';

/**
 * RAG 데이터 타입 가드
 */
export function isRAGData(data: unknown): data is RAGData {
  return (
    typeof data === 'object' &&
    data !== null &&
    'documents' in data &&
    'totalResults' in data &&
    Array.isArray((data as RAGData).documents)
  );
}

/**
 * ML 데이터 타입 가드
 */
export function isMLData(data: unknown): data is MLData {
  return (
    typeof data === 'object' &&
    data !== null &&
    'anomalies' in data &&
    'trends' in data &&
    Array.isArray((data as MLData).anomalies) &&
    Array.isArray((data as MLData).trends)
  );
}

/**
 * Rule 데이터 타입 가드
 */
export function isRuleData(data: unknown): data is RuleData {
  return (
    typeof data === 'object' &&
    data !== null &&
    'keywords' in data &&
    'entities' in data &&
    'intent' in data &&
    Array.isArray((data as RuleData).keywords) &&
    Array.isArray((data as RuleData).entities)
  );
}

/**
 * Scenario 타입 가드
 */
export function isValidScenario(value: unknown): value is AIScenario {
  const validScenarios: AIScenario[] = [
    'failure-analysis',
    'performance-report',
    'document-qa',
    'dashboard-summary',
    'general-query',
    'incident-report',
    'optimization-advice',
  ];
  return (
    typeof value === 'string' && validScenarios.includes(value as AIScenario)
  );
}
