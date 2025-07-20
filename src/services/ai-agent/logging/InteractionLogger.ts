/**
 * 🔍 InteractionLogger - AI 상호작용 로깅 서비스
 * 
 * f129a18fb 커밋 복구를 위한 더미 구현
 */

export class InteractionLogger {
  private static instance: InteractionLogger;
  
  private constructor() {}
  
  static getInstance(): InteractionLogger {
    if (!InteractionLogger.instance) {
      InteractionLogger.instance = new InteractionLogger();
    }
    return InteractionLogger.instance;
  }
  
  log(event: string, data?: any): void {
    console.log(`[InteractionLogger] ${event}`, data);
  }
  
  logFeedback(feedback: any): void {
    console.log('[InteractionLogger] Feedback:', feedback);
  }
  
  logUserFeedback(feedback: any): void {
    console.log('[InteractionLogger] User feedback:', feedback);
  }
  
  logError(error: Error, context?: any): void {
    console.error('[InteractionLogger] Error:', error, context);
  }
}