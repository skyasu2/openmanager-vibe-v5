/**
 * LangGraph Error Types
 * AI SDK 스타일의 구조화된 에러 타입 정의
 *
 * @see https://sdk.vercel.ai/docs/ai-sdk-core/error-handling
 */

// ============================================================================
// 1. Base Error Class
// ============================================================================

export class AIError extends Error {
  readonly code: string;
  readonly cause?: Error;
  readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    code: string,
    options?: { cause?: Error; details?: Record<string, unknown> }
  ) {
    super(message);
    this.name = 'AIError';
    this.code = code;
    this.cause = options?.cause;
    this.details = options?.details;
  }

  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      details: this.details,
    };
  }
}

// ============================================================================
// 2. Configuration Errors
// ============================================================================

export class AIConfigError extends AIError {
  constructor(
    message: string,
    options?: { cause?: Error; details?: Record<string, unknown> }
  ) {
    super(message, 'AI_CONFIG_ERROR', options);
    this.name = 'AIConfigError';
  }
}

/**
 * API 키 미설정 에러
 */
export class APIKeyMissingError extends AIConfigError {
  readonly provider: string;

  constructor(provider: string, envVarName: string | string[]) {
    const envVars = Array.isArray(envVarName) ? envVarName : [envVarName];
    const message = `${provider} API key is not configured. Set ${envVars.join(' or ')}.`;

    super(message, {
      details: { provider, requiredEnvVars: envVars },
    });
    this.name = 'APIKeyMissingError';
    this.provider = provider;
  }
}

/**
 * 데이터베이스 연결 설정 에러
 */
export class DatabaseConfigError extends AIConfigError {
  constructor(envVarName: string) {
    super(`Database connection is not configured. Set ${envVarName}.`, {
      details: { requiredEnvVar: envVarName },
    });
    this.name = 'DatabaseConfigError';
  }
}

// ============================================================================
// 3. Model Errors
// ============================================================================

export class AIModelError extends AIError {
  readonly model: string;

  constructor(
    message: string,
    model: string,
    options?: { cause?: Error; details?: Record<string, unknown> }
  ) {
    super(message, 'AI_MODEL_ERROR', {
      ...options,
      details: { ...options?.details, model },
    });
    this.name = 'AIModelError';
    this.model = model;
  }
}

/**
 * 모델 호출 실패 에러
 */
export class ModelInvocationError extends AIModelError {
  constructor(model: string, cause?: Error, details?: Record<string, unknown>) {
    super(`Failed to invoke model: ${model}`, model, { cause, details });
    this.name = 'ModelInvocationError';
  }
}

/**
 * 모델 타임아웃 에러
 */
export class ModelTimeoutError extends AIModelError {
  readonly timeoutMs: number;

  constructor(model: string, timeoutMs: number) {
    super(`Model invocation timed out after ${timeoutMs}ms`, model, {
      details: { timeoutMs },
    });
    this.name = 'ModelTimeoutError';
    this.timeoutMs = timeoutMs;
  }
}

// ============================================================================
// 4. Agent Errors
// ============================================================================

export class AgentError extends AIError {
  readonly agent: string;

  constructor(
    message: string,
    agent: string,
    options?: { cause?: Error; details?: Record<string, unknown> }
  ) {
    super(message, 'AGENT_ERROR', {
      ...options,
      details: { ...options?.details, agent },
    });
    this.name = 'AgentError';
    this.agent = agent;
  }
}

/**
 * 에이전트 실행 에러
 */
export class AgentExecutionError extends AgentError {
  constructor(agent: string, cause?: Error, details?: Record<string, unknown>) {
    super(`Agent execution failed: ${agent}`, agent, { cause, details });
    this.name = 'AgentExecutionError';
  }
}

// ============================================================================
// 5. Tool Errors
// ============================================================================

export class ToolError extends AIError {
  readonly tool: string;

  constructor(
    message: string,
    tool: string,
    options?: { cause?: Error; details?: Record<string, unknown> }
  ) {
    super(message, 'TOOL_ERROR', {
      ...options,
      details: { ...options?.details, tool },
    });
    this.name = 'ToolError';
    this.tool = tool;
  }
}

/**
 * 도구 실행 에러
 */
export class ToolExecutionError extends ToolError {
  constructor(tool: string, cause?: Error, details?: Record<string, unknown>) {
    super(`Tool execution failed: ${tool}`, tool, { cause, details });
    this.name = 'ToolExecutionError';
  }
}

// ============================================================================
// 6. Helper Functions
// ============================================================================

/**
 * 에러 메시지에서 사용자 친화적 메시지 생성
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof AIError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

/**
 * 에러를 JSON 직렬화 가능한 형태로 변환
 */
export function serializeError(error: unknown): Record<string, unknown> {
  if (error instanceof AIError) {
    return error.toJSON();
  }
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
    };
  }
  return { message: String(error) };
}

/**
 * API 키 유효성 검사
 * @throws {APIKeyMissingError} API 키가 없을 경우
 */
export function requireAPIKey(
  provider: string,
  ...envVarNames: string[]
): string {
  for (const envVar of envVarNames) {
    const value = process.env[envVar];
    if (value) {
      return value;
    }
  }
  throw new APIKeyMissingError(provider, envVarNames);
}
