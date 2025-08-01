/**
 * 에러 추적 시스템
 */

export interface ErrorDetails {
  id: string;
  timestamp: number;
  server: string;

  // 에러 정보
  error: {
    type: string;
    message: string;
    stack?: string;
    code?: string;
  };

  // 컨텍스트
  context: {
    operation: string;
    parameters?: Record<string, unknown>;
    userId?: string;
    sessionId?: string;
    requestId?: string;
  };

  // 메트릭
  metrics: {
    occurrenceCount: number;
    firstSeen: number;
    lastSeen: number;
    affectedUsers: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
  };

  // 상태
  status: 'new' | 'acknowledged' | 'investigating' | 'resolved';
  assignedTo?: string;
  resolution?: {
    resolvedAt: number;
    resolvedBy: string;
    notes: string;
    rootCause?: string;
  };
}

export class ErrorTracker {
  private errors: Map<string, ErrorDetails> = new Map();

  trackError(error: Error, context: ErrorDetails['context']): ErrorDetails {
    const errorId = this.generateErrorId(error, context);
    const existing = this.errors.get(errorId);

    if (existing) {
      existing.metrics.occurrenceCount++;
      existing.metrics.lastSeen = Date.now();
      return existing;
    }

    const newError: ErrorDetails = {
      id: errorId,
      timestamp: Date.now(),
      server: context.operation.split('.')[0] || 'unknown',
      error: {
        type: error.name,
        message: error.message,
        stack: error.stack,
      },
      context,
      metrics: {
        occurrenceCount: 1,
        firstSeen: Date.now(),
        lastSeen: Date.now(),
        affectedUsers: 1,
        severity: this.calculateSeverity(error),
      },
      status: 'new',
    };

    this.errors.set(errorId, newError);
    return newError;
  }

  private generateErrorId(
    error: Error,
    context: ErrorDetails['context']
  ): string {
    return `${error.name}-${error.message}-${context.operation}`.replace(
      /\s+/g,
      '-'
    );
  }

  private calculateSeverity(error: Error): ErrorDetails['metrics']['severity'] {
    if (error.message.includes('critical') || error.message.includes('fatal')) {
      return 'critical';
    }
    if (error.message.includes('error') || error.name.includes('Error')) {
      return 'high';
    }
    if (error.message.includes('warning')) {
      return 'medium';
    }
    return 'low';
  }

  getErrors(): ErrorDetails[] {
    return Array.from(this.errors.values());
  }

  clearErrors(): void {
    this.errors.clear();
  }
}
