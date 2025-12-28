/**
 * Verifier Agent
 * AI 응답 검증 및 품질 보증 전문 에이전트
 *
 * ## Model
 * - Provider: Mistral
 * - Model: mistral-small-2506 (Small 3.2, 24B params)
 * - Purpose: Higher-quality verification than Groq 8B
 *
 * ## 기능
 * 1. 수치 범위 검증 (0-100% 메트릭)
 * 2. 필수 정보 완전성 확인
 * 3. 응답 포맷 정규화
 * 4. 환각(Hallucination) 탐지
 * 5. 신뢰도 점수 부여
 *
 * @since 2025-12-23
 * @updated 2025-12-26 - Migrated to Mistral 24B (from Groq 8B)
 */

import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import type {
  VerificationCorrection,
  VerificationIssue,
  VerificationResult,
} from '../lib/state-definition';
import { getVerifierModel } from '../lib/model-config';

// Tool Input Types (for TypeScript strict mode)
interface ValidateMetricRangesInput {
  response: string;
}

interface CheckRequiredFieldsInput {
  response: string;
  requiredFields?: string[];
}

interface DetectHallucinationInput {
  response: string;
  context?: string;
}

interface ComprehensiveVerifyInput {
  response: string;
  context?: string;
  config?: VerifierConfig;
}

// ============================================================================
// 1. Verification Rules Configuration
// ============================================================================

export interface VerifierConfig {
  rules: {
    checkMetricRanges: boolean;
    checkRequiredFields: boolean;
    checkFormatConsistency: boolean;
    detectHallucination: boolean;
  };
  thresholds: {
    minConfidence: number;
    metricMin: number;
    metricMax: number;
  };
}

export const DEFAULT_VERIFIER_CONFIG: VerifierConfig = {
  rules: {
    checkMetricRanges: true,
    checkRequiredFields: true,
    checkFormatConsistency: true,
    detectHallucination: true,
  },
  thresholds: {
    minConfidence: 0.7,
    metricMin: 0,
    metricMax: 100,
  },
};

// ============================================================================
// 2. Metric Patterns for Detection
// ============================================================================

const METRIC_PATTERNS = {
  cpu: /cpu[:\s]*(\d+(?:\.\d+)?)\s*%?/gi,
  memory: /(?:memory|메모리|ram)[:\s]*(\d+(?:\.\d+)?)\s*%?/gi,
  disk: /(?:disk|디스크|storage)[:\s]*(\d+(?:\.\d+)?)\s*%?/gi,
  percentage: /(\d+(?:\.\d+)?)\s*%/g,
};

const REQUIRED_RESPONSE_FIELDS = [
  'server',
  'status',
  'metric',
  'analysis',
  'recommendation',
];

// ============================================================================
// 3. Tool Definitions
// ============================================================================

/**
 * 메트릭 수치 범위 검증 도구
 * 0-100% 범위를 벗어나는 비정상적인 수치 탐지
 */
export const validateMetricRangesTool = tool(
  async ({ response }: ValidateMetricRangesInput) => {
    const startTime = Date.now();
    const issues: VerificationIssue[] = [];
    const corrections: VerificationCorrection[] = [];
    let validatedResponse = response;

    // CPU, Memory, Disk 메트릭 추출 및 검증
    for (const [metricType, pattern] of Object.entries(METRIC_PATTERNS)) {
      const matches = [...response.matchAll(pattern)];

      for (const match of matches) {
        const value = parseFloat(match[1]);

        if (isNaN(value)) continue;

        // 0-100% 범위 검증
        if (value < 0 || value > 100) {
          const correctedValue = Math.max(0, Math.min(100, value));

          issues.push({
            type: 'metric_range',
            severity: value > 200 || value < -100 ? 'high' : 'medium',
            field: metricType,
            originalValue: value,
            correctedValue,
            message: `${metricType} 값 ${value}%가 유효 범위(0-100%)를 벗어남`,
          });

          corrections.push({
            field: metricType,
            original: value,
            corrected: correctedValue,
            reason: '0-100% 범위로 정규화',
          });

          // 응답에서 값 수정
          validatedResponse = validatedResponse.replace(
            match[0],
            match[0].replace(String(value), String(correctedValue))
          );
        }
      }
    }

    const processingTimeMs = Date.now() - startTime;
    const hasIssues = issues.length > 0;

    return {
      success: true,
      isValid: !hasIssues,
      issues,
      corrections,
      validatedResponse,
      processingTimeMs,
      rulesApplied: ['metric_range_check'],
    };
  },
  {
    name: 'validateMetricRanges',
    description:
      'AI 응답 내 메트릭 수치(CPU, Memory, Disk)가 0-100% 범위 내에 있는지 검증',
    schema: z.object({
      response: z.string().describe('검증할 AI 응답 텍스트'),
    }),
  }
);

/**
 * 필수 필드 완전성 검증 도구
 * 응답에 필수 정보가 포함되어 있는지 확인
 */
export const checkRequiredFieldsTool = tool(
  async ({ response, requiredFields }: CheckRequiredFieldsInput) => {
    const startTime = Date.now();
    const issues: VerificationIssue[] = [];
    const fieldsToCheck = requiredFields || REQUIRED_RESPONSE_FIELDS;
    const lowerResponse = response.toLowerCase();

    const missingFields: string[] = [];
    const foundFields: string[] = [];

    for (const field of fieldsToCheck) {
      // 필드명 또는 한글 대응어 검색
      const fieldPatterns = getFieldPatterns(field);
      const found = fieldPatterns.some((pattern) =>
        lowerResponse.includes(pattern.toLowerCase())
      );

      if (found) {
        foundFields.push(field);
      } else {
        missingFields.push(field);
        issues.push({
          type: 'missing_field',
          severity: 'medium',
          field,
          message: `필수 정보 '${field}'가 응답에 포함되지 않음`,
        });
      }
    }

    const processingTimeMs = Date.now() - startTime;
    const completenessScore = foundFields.length / fieldsToCheck.length;

    return {
      success: true,
      isValid: missingFields.length === 0,
      completenessScore,
      foundFields,
      missingFields,
      issues,
      processingTimeMs,
      rulesApplied: ['required_fields_check'],
    };
  },
  {
    name: 'checkRequiredFields',
    description: 'AI 응답에 필수 정보 필드가 포함되어 있는지 확인',
    schema: z.object({
      response: z.string().describe('검증할 AI 응답 텍스트'),
      requiredFields: z
        .array(z.string())
        .optional()
        .describe('검사할 필수 필드 목록 (미지정시 기본 필드 사용)'),
    }),
  }
);

/**
 * 환각(Hallucination) 탐지 도구
 * 비정상적인 패턴이나 일관성 없는 정보 탐지
 */
export const detectHallucinationTool = tool(
  async ({ response, context }: DetectHallucinationInput) => {
    const startTime = Date.now();
    const issues: VerificationIssue[] = [];

    // 1. 비정상적인 수치 패턴 탐지 (예: 999%, -50%)
    const extremeValues = response.match(/(-?\d{3,})\s*%/g);
    if (extremeValues) {
      for (const match of extremeValues) {
        issues.push({
          type: 'hallucination',
          severity: 'high',
          originalValue: match,
          message: `비정상적인 수치 패턴 발견: ${match}`,
        });
      }
    }

    // 2. 자기 모순 탐지 (예: "정상" + "위험" 동시 언급)
    const contradictions = detectContradictions(response);
    for (const contradiction of contradictions) {
      issues.push({
        type: 'hallucination',
        severity: 'medium',
        message: `잠재적 자기 모순: ${contradiction}`,
      });
    }

    // 3. 컨텍스트와의 불일치 검사 (컨텍스트가 제공된 경우)
    if (context) {
      const contextIssues = checkContextConsistency(response, context);
      issues.push(...contextIssues);
    }

    // 4. 반복 패턴 탐지 (환각의 일반적인 특징)
    const repetitionScore = detectRepetition(response);
    if (repetitionScore > 0.3) {
      issues.push({
        type: 'hallucination',
        severity: 'low',
        message: `높은 반복률 감지: ${(repetitionScore * 100).toFixed(1)}%`,
      });
    }

    const processingTimeMs = Date.now() - startTime;
    const hallucinationRisk =
      issues.length === 0 ? 'low' : issues.length > 2 ? 'high' : 'medium';

    return {
      success: true,
      isValid: issues.length === 0,
      hallucinationRisk,
      issueCount: issues.length,
      issues,
      processingTimeMs,
      rulesApplied: ['hallucination_detection'],
    };
  },
  {
    name: 'detectHallucination',
    description:
      'AI 응답의 환각(hallucination) 징후를 탐지 - 비정상 수치, 자기 모순, 반복 패턴 등',
    schema: z.object({
      response: z.string().describe('검증할 AI 응답 텍스트'),
      context: z
        .string()
        .optional()
        .describe('원본 컨텍스트/데이터 (불일치 검사용)'),
    }),
  }
);

/**
 * 종합 검증 도구
 * 모든 검증 규칙을 순차적으로 적용하고 최종 신뢰도 점수 산출
 */
export const comprehensiveVerifyTool = tool(
  async ({ response, context, config }: ComprehensiveVerifyInput) => {
    const startTime = Date.now();
    const verifierConfig = config
      ? { ...DEFAULT_VERIFIER_CONFIG, ...config }
      : DEFAULT_VERIFIER_CONFIG;

    const allIssues: VerificationIssue[] = [];
    const allCorrections: VerificationCorrection[] = [];
    const rulesApplied: string[] = [];
    let validatedResponse = response;

    // 1. 메트릭 범위 검증
    if (verifierConfig.rules.checkMetricRanges) {
      const metricResult = await validateMetricRangesTool.invoke({
        response: validatedResponse,
      });
      if (metricResult.issues) allIssues.push(...metricResult.issues);
      if (metricResult.corrections)
        allCorrections.push(...metricResult.corrections);
      if (metricResult.validatedResponse)
        validatedResponse = metricResult.validatedResponse;
      rulesApplied.push('metric_range_check');
    }

    // 2. 필수 필드 확인
    if (verifierConfig.rules.checkRequiredFields) {
      const fieldResult = await checkRequiredFieldsTool.invoke({
        response: validatedResponse,
      });
      if (fieldResult.issues) allIssues.push(...fieldResult.issues);
      rulesApplied.push('required_fields_check');
    }

    // 3. 환각 탐지
    if (verifierConfig.rules.detectHallucination) {
      const hallucinationResult = await detectHallucinationTool.invoke({
        response: validatedResponse,
        context,
      });
      if (hallucinationResult.issues)
        allIssues.push(...hallucinationResult.issues);
      rulesApplied.push('hallucination_detection');
    }

    // 4. 신뢰도 점수 계산
    const confidence = calculateConfidence(allIssues);
    const minConfidence = verifierConfig.thresholds?.minConfidence ?? DEFAULT_VERIFIER_CONFIG.thresholds.minConfidence;
    const isValid = confidence >= minConfidence;

    const processingTimeMs = Date.now() - startTime;

    const result: VerificationResult = {
      isValid,
      confidence,
      originalResponse: response,
      validatedResponse,
      issues: allIssues,
      metadata: {
        verifiedAt: new Date().toISOString(),
        rulesApplied,
        corrections: allCorrections,
        processingTimeMs,
      },
    };

    return {
      success: true,
      ...result,
    };
  },
  {
    name: 'comprehensiveVerify',
    description:
      '모든 검증 규칙을 적용하여 AI 응답을 종합 검증하고 신뢰도 점수 산출',
    schema: z.object({
      response: z.string().describe('검증할 AI 응답 텍스트'),
      context: z
        .string()
        .optional()
        .describe('원본 컨텍스트/데이터 (불일치 검사용)'),
      config: z
        .object({
          rules: z
            .object({
              checkMetricRanges: z.boolean().optional(),
              checkRequiredFields: z.boolean().optional(),
              checkFormatConsistency: z.boolean().optional(),
              detectHallucination: z.boolean().optional(),
            })
            .optional(),
          thresholds: z
            .object({
              minConfidence: z.number().optional(),
              metricMin: z.number().optional(),
              metricMax: z.number().optional(),
            })
            .optional(),
        })
        .optional()
        .describe('검증 설정 (미지정시 기본값 사용)'),
    }),
  }
);

// ============================================================================
// 4. Helper Functions
// ============================================================================

/**
 * 필드명에 대응하는 검색 패턴 반환
 */
function getFieldPatterns(field: string): string[] {
  const fieldMappings: Record<string, string[]> = {
    server: ['server', '서버', '호스트', 'host'],
    status: ['status', '상태', '현황', 'state'],
    metric: ['metric', '메트릭', '지표', '수치', 'cpu', 'memory', 'disk'],
    analysis: ['analysis', '분석', '진단', '평가'],
    recommendation: ['recommendation', '권장', '조치', '대응', '해결'],
  };

  return fieldMappings[field] || [field];
}

/**
 * 자기 모순 탐지
 */
function detectContradictions(response: string): string[] {
  const contradictions: string[] = [];
  const lowerResponse = response.toLowerCase();

  const contradictionPairs = [
    { a: ['정상', 'normal', '안정'], b: ['위험', 'critical', '장애'] },
    { a: ['증가', 'increase', '상승'], b: ['감소', 'decrease', '하락'] },
    { a: ['성공', 'success'], b: ['실패', 'fail', 'error'] },
  ];

  for (const pair of contradictionPairs) {
    const hasA = pair.a.some((term) => lowerResponse.includes(term));
    const hasB = pair.b.some((term) => lowerResponse.includes(term));

    if (hasA && hasB) {
      contradictions.push(`'${pair.a[0]}' vs '${pair.b[0]}'`);
    }
  }

  return contradictions;
}

/**
 * 컨텍스트와의 일관성 검사
 */
function checkContextConsistency(
  response: string,
  context: string
): VerificationIssue[] {
  const issues: VerificationIssue[] = [];

  // 컨텍스트에 없는 서버 ID가 응답에 언급된 경우
  const responseServerIds = response.match(/server[_-]?\d+/gi) || [];
  const contextServerIds = context.match(/server[_-]?\d+/gi) || [];

  for (const serverId of responseServerIds) {
    if (
      !contextServerIds.some(
        (cid) => cid.toLowerCase() === serverId.toLowerCase()
      )
    ) {
      issues.push({
        type: 'hallucination',
        severity: 'medium',
        field: 'server_id',
        originalValue: serverId,
        message: `컨텍스트에 없는 서버 ID 언급: ${serverId}`,
      });
    }
  }

  return issues;
}

/**
 * 반복 패턴 탐지
 */
function detectRepetition(response: string): number {
  const words = response.toLowerCase().split(/\s+/);
  if (words.length < 10) return 0;

  const wordCounts = new Map<string, number>();
  for (const word of words) {
    if (word.length > 3) {
      wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
    }
  }

  const repeatedWords = [...wordCounts.entries()].filter(
    ([, count]) => count > 3
  );
  const repetitionScore = repeatedWords.length / wordCounts.size;

  return repetitionScore;
}

/**
 * 신뢰도 점수 계산
 */
function calculateConfidence(issues: VerificationIssue[]): number {
  if (issues.length === 0) return 1.0;

  let deduction = 0;

  for (const issue of issues) {
    switch (issue.severity) {
      case 'high':
        deduction += 0.25;
        break;
      case 'medium':
        deduction += 0.1;
        break;
      case 'low':
        deduction += 0.05;
        break;
    }
  }

  return Math.max(0, Math.min(1, 1 - deduction));
}

// ============================================================================
// 5. Retry Prompt Builder (Phase 5.7: Hybrid Verification)
// ============================================================================

/**
 * 검증 실패 시 재시도 프롬프트 생성
 * severity: high 이슈가 발견된 경우 원래 Agent에게 피드백과 함께 재요청
 */
export function buildRetryPrompt(
  originalResponse: string,
  issues: VerificationIssue[],
  originalQuery?: string
): string {
  const highSeverityIssues = issues.filter((i) => i.severity === 'high');
  const mediumSeverityIssues = issues.filter((i) => i.severity === 'medium');

  const issueDescriptions = [
    ...highSeverityIssues.map((i) => `❌ [심각] ${i.message}`),
    ...mediumSeverityIssues.map((i) => `⚠️ [주의] ${i.message}`),
  ].join('\n');

  return `## 응답 재생성 요청

이전 응답에서 다음과 같은 문제가 발견되었습니다:

${issueDescriptions}

### 이전 응답 (문제 있음):
${originalResponse.substring(0, 500)}${originalResponse.length > 500 ? '...' : ''}

### 요청 사항:
1. 위에서 지적된 문제들을 수정하여 새로운 응답을 생성해주세요.
2. 메트릭 수치는 반드시 0-100% 범위 내로 유지해주세요.
3. 자기 모순적인 표현(예: "정상" + "위험" 동시 언급)을 피해주세요.
4. 실제 데이터에 기반한 정확한 정보만 포함해주세요.

${originalQuery ? `### 원본 질문:\n${originalQuery}` : ''}

수정된 응답을 생성해주세요.`;
}

/**
 * 검증 결과에 따른 처리 전략 결정
 */
export type VerificationStrategy = 'pass' | 'direct_fix' | 'retry' | 'last_keeper';

export function determineVerificationStrategy(
  issues: VerificationIssue[],
  retryCount: number,
  maxRetries: number = 1
): VerificationStrategy {
  if (issues.length === 0) {
    return 'pass';
  }

  const highSeverityCount = issues.filter((i) => i.severity === 'high').length;
  const mediumSeverityCount = issues.filter((i) => i.severity === 'medium').length;

  // 재시도 횟수 초과 시 Last Keeper 모드
  if (retryCount >= maxRetries) {
    console.log(`⚠️ [Verifier] Max retries (${maxRetries}) reached, using Last Keeper`);
    return 'last_keeper';
  }

  // 심각한 문제 (환각, 자기 모순) → 재시도 요청
  if (highSeverityCount > 0) {
    return 'retry';
  }

  // 중간 심각도 → 직접 수정
  if (mediumSeverityCount > 0) {
    return 'direct_fix';
  }

  // 경미한 문제만 → 직접 수정
  return 'direct_fix';
}

/**
 * 고심각도 이슈 추출
 */
export function extractHighSeverityIssues(
  issues: VerificationIssue[]
): VerificationIssue[] {
  return issues.filter((i) => i.severity === 'high');
}

// ============================================================================
// 6. Exports
// ============================================================================

export const verifierTools = [
  validateMetricRangesTool,
  checkRequiredFieldsTool,
  detectHallucinationTool,
  comprehensiveVerifyTool,
];

export { getVerifierModel };
