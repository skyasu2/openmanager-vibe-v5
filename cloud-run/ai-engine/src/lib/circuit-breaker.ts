/**
 * Circuit Breaker for Model Failover
 *
 * Extracted from state-definition.ts to remove LangGraph dependency.
 * Provides circuit breaker pattern for AI model failover.
 *
 * @version 1.0.0
 * @updated 2025-12-28
 */

// ============================================================================
// Types
// ============================================================================

export interface ModelHealthState {
  failures: number;
  lastFailure: number | null;
  isOpen: boolean;
  halfOpenAttempts: number;
}

export interface CircuitBreakerState {
  models: Record<string, ModelHealthState>;
  threshold: number;
  resetTimeMs: number;
}

// ============================================================================
// Circuit Breaker Functions
// ============================================================================

/**
 * Check if a model is healthy (circuit is closed or in half-open recovery)
 */
export function isModelHealthy(
  state: CircuitBreakerState,
  modelId: string
): boolean {
  const health = state.models[modelId];
  if (!health) return true;

  if (health.isOpen) {
    if (
      health.lastFailure &&
      Date.now() - health.lastFailure > state.resetTimeMs
    ) {
      return true;
    }
    return false;
  }

  return true;
}

/**
 * Record a failure for a model, potentially opening the circuit
 */
export function recordFailure(
  state: CircuitBreakerState,
  modelId: string
): CircuitBreakerState {
  const current = state.models[modelId] || {
    failures: 0,
    lastFailure: null,
    isOpen: false,
    halfOpenAttempts: 0,
  };

  const newFailures = current.failures + 1;
  const shouldOpen = newFailures >= state.threshold;

  return {
    ...state,
    models: {
      ...state.models,
      [modelId]: {
        failures: newFailures,
        lastFailure: Date.now(),
        isOpen: shouldOpen,
        halfOpenAttempts: current.halfOpenAttempts,
      },
    },
  };
}

/**
 * Record a success for a model, resetting its circuit breaker
 */
export function recordSuccess(
  state: CircuitBreakerState,
  modelId: string
): CircuitBreakerState {
  return {
    ...state,
    models: {
      ...state.models,
      [modelId]: {
        failures: 0,
        lastFailure: null,
        isOpen: false,
        halfOpenAttempts: 0,
      },
    },
  };
}

/**
 * Create initial circuit breaker state
 */
export function createCircuitBreakerState(
  threshold = 3,
  resetTimeMs = 60000
): CircuitBreakerState {
  return {
    models: {},
    threshold,
    resetTimeMs,
  };
}
