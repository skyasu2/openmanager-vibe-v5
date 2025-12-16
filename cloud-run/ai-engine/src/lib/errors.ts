/**
 * LangGraph Error Types
 */

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

export class AIConfigError extends AIError {
  constructor(
    message: string,
    options?: { cause?: Error; details?: Record<string, unknown> }
  ) {
    super(message, 'AI_CONFIG_ERROR', options);
    this.name = 'AIConfigError';
  }
}

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

export class DatabaseConfigError extends AIConfigError {
  constructor(envVarName: string) {
    super(`Database connection is not configured. Set ${envVarName}.`, {
      details: { requiredEnvVar: envVarName },
    });
    this.name = 'DatabaseConfigError';
  }
}

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

export class ModelInvocationError extends AIModelError {
  constructor(model: string, cause?: Error, details?: Record<string, unknown>) {
    super(`Failed to invoke model: ${model}`, model, { cause, details });
    this.name = 'ModelInvocationError';
  }
}

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

export class RateLimitError extends AIModelError {
  readonly retryAfterMs?: number;

  constructor(model: string, retryAfterMs?: number, cause?: Error) {
    super(`Rate limit exceeded for model: ${model}`, model, {
      cause,
      details: { retryAfterMs },
    });
    this.name = 'RateLimitError';
    this.retryAfterMs = retryAfterMs;
  }

  static isRateLimitError(error: unknown): boolean {
    if (error instanceof RateLimitError) return true;
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      return (
        message.includes('429') ||
        message.includes('rate limit') ||
        message.includes('quota exceeded') ||
        message.includes('resource exhausted')
      );
    }
    return false;
  }
}

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

export class AgentExecutionError extends AgentError {
  constructor(agent: string, cause?: Error, details?: Record<string, unknown>) {
    super(`Agent execution failed: ${agent}`, agent, { cause, details });
    this.name = 'AgentExecutionError';
  }
}

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

export class ToolExecutionError extends ToolError {
  constructor(tool: string, cause?: Error, details?: Record<string, unknown>) {
    super(`Tool execution failed: ${tool}`, tool, { cause, details });
    this.name = 'ToolExecutionError';
  }
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof AIError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

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
