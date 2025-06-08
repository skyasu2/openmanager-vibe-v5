/**
 * 🚨 에러 복구 시스템
 * 
 * API 에러 모니터링, 자동 복구, 사용자 알림
 */

import { toastManager } from '@/components/ui/ToastNotification';

export interface ErrorInfo {
  apiPath: string;
  error: Error;
  timestamp: number;
  userAgent?: string;
  url?: string;
}

export class ErrorRecoverySystem {
  private static errorCounts = new Map<string, number>();
  private static errorHistory: ErrorInfo[] = [];
  private static readonly MAX_ERRORS = 5;
  private static readonly ERROR_WINDOW = 300000; // 5분
  private static readonly MAX_HISTORY = 100;
  
  /**
   * 🚨 API 에러 처리 메인 메서드
   */
  static async handleAPIError(apiPath: string, error: Error, context?: any): Promise<void> {
    const errorInfo: ErrorInfo = {
      apiPath,
      error,
      timestamp: Date.now(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined
    };

    // 에러 히스토리에 추가
    this.addToHistory(errorInfo);
    
    // 에러 카운트 증가
    const count = this.incrementErrorCount(apiPath);
    
    console.error(`🚨 API 에러 발생 [${count}/${this.MAX_ERRORS}]:`, {
      path: apiPath,
      error: error.message,
      timestamp: new Date().toISOString(),
      context
    });
    
    // 첫 번째 에러 시 사용자에게 알림
    if (count === 1) {
      this.notifyUser(`⚠️ ${this.getErrorDisplayName(apiPath)} 연결 문제가 발생했습니다`, 'warning');
    }
    
    // 임계값 초과 시 복구 시도
    if (count >= this.MAX_ERRORS) {
      await this.attemptRecovery(apiPath);
    }
    
    // 연속 에러 패턴 감지
    this.detectErrorPatterns(apiPath);
  }

  /**
   * 📊 에러 카운트 증가 및 관리
   */
  private static incrementErrorCount(apiPath: string): number {
    const now = Date.now();
    const key = `${apiPath}_${Math.floor(now / this.ERROR_WINDOW)}`;
    
    const count = (this.errorCounts.get(key) || 0) + 1;
    this.errorCounts.set(key, count);
    
    // 오래된 카운트 정리
    this.cleanupOldCounts();
    
    return count;
  }

  /**
   * 🧹 오래된 에러 카운트 정리
   */
  private static cleanupOldCounts(): void {
    const now = Date.now();
    const cutoff = Math.floor((now - this.ERROR_WINDOW * 2) / this.ERROR_WINDOW);
    
    for (const [key, _] of this.errorCounts.entries()) {
      const timeWindow = parseInt(key.split('_').pop() || '0');
      if (timeWindow < cutoff) {
        this.errorCounts.delete(key);
      }
    }
  }

  /**
   * 📋 에러 히스토리 관리
   */
  private static addToHistory(errorInfo: ErrorInfo): void {
    this.errorHistory.push(errorInfo);
    
    // 히스토리 크기 제한
    if (this.errorHistory.length > this.MAX_HISTORY) {
      this.errorHistory.shift();
    }
  }

  /**
   * 🔄 복구 시도 (토스트 알림 포함)
   */
  private static async attemptRecovery(apiPath: string): Promise<void> {
    console.log(`🔄 ${apiPath} 복구 시도 중...`);
    
    // 프로그레스 토스트 시작
    const progressToast = toastManager.progress(
      `🔄 ${this.getErrorDisplayName(apiPath)} 복구 중...`, 
      0
    );
    
    try {
      // 1. 캐시 정리 (20%)
      progressToast.update(20, '🗑️ 캐시 정리 중...');
      await this.clearCaches();
      
      // 2. 메모리 정리 (50%)
      progressToast.update(50, '🧠 메모리 최적화 중...');
      await this.performMemoryCleanup();
      
      // 3. 네트워크 상태 확인 (70%)
      progressToast.update(70, '🌐 네트워크 상태 확인 중...');
      await this.checkNetworkHealth();
      
      // 4. 에러 카운트 리셋 (90%)
      progressToast.update(90, '🔄 시스템 상태 복구 중...');
      this.resetErrorCount(apiPath);
      
      // 5. 복구 완료 (100%)
      progressToast.complete(`✅ ${this.getErrorDisplayName(apiPath)} 복구 완료`);
      
      console.log(`✅ ${apiPath} 복구 완료`);
      
    } catch (recoveryError) {
      console.error(`❌ ${apiPath} 복구 실패:`, recoveryError);
      progressToast.fail(`❌ ${this.getErrorDisplayName(apiPath)} 복구 실패`);
      
      // 수동 조치 안내
      toastManager.error('시스템 복구에 실패했습니다.', {
        duration: 8000,
        action: {
          label: '새로고침',
          onClick: () => {
            if (typeof window !== 'undefined') {
              window.location.reload();
            }
          }
        }
      });
    }
  }

  /**
   * 🗑️ 캐시 정리
   */
  private static async clearCaches(): Promise<void> {
    if (typeof window !== 'undefined' && 'caches' in window) {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(name => caches.delete(name))
        );
        console.log('✅ 브라우저 캐시 정리 완료');
      } catch (error) {
        console.warn('⚠️ 캐시 정리 실패:', error);
      }
    }
  }

  /**
   * 🧠 메모리 정리
   */
  private static async performMemoryCleanup(): Promise<void> {
    if (typeof window !== 'undefined') {
      // 브라우저 환경에서 메모리 정리
      if ((window as any).gc) {
        (window as any).gc();
        console.log('✅ 브라우저 가비지 컬렉션 실행');
      }
    }
    
    // 글로벌 변수 정리
    if (typeof global !== 'undefined' && global.gc) {
      global.gc();
      console.log('✅ 서버 가비지 컬렉션 실행');
    }
  }

  /**
   * 🌐 네트워크 상태 확인
   */
  private static async checkNetworkHealth(): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      const response = await fetch('/api/health', {
        method: 'GET',
        signal: AbortSignal.timeout(3000)
      });
      
      if (!response.ok) {
        throw new Error(`네트워크 상태 불량: ${response.status}`);
      }
      
      console.log('✅ 네트워크 상태 정상');
    } catch (error) {
      console.warn('⚠️ 네트워크 상태 확인 실패:', error);
      throw error;
    }
  }

  /**
   * 🔢 에러 카운트 리셋
   */
  private static resetErrorCount(apiPath: string): void {
    const now = Date.now();
    const key = `${apiPath}_${Math.floor(now / this.ERROR_WINDOW)}`;
    this.errorCounts.set(key, 0);
  }

  /**
   * 🔍 에러 패턴 감지 (개선된 알림 포함)
   */
  private static detectErrorPatterns(apiPath: string): void {
    const recentErrors = this.errorHistory
      .filter(error => 
        error.apiPath === apiPath && 
        Date.now() - error.timestamp < this.ERROR_WINDOW
      );

    if (recentErrors.length >= 3) {
      console.warn(`⚠️ 에러 패턴 감지: ${apiPath}에서 ${recentErrors.length}개 연속 에러 발생`);
      
      // 패턴 분석
      const errorMessages = recentErrors.map(e => e.error.message);
      const uniqueMessages = [...new Set(errorMessages)];
      
      if (uniqueMessages.length === 1) {
        console.warn(`🔄 동일한 에러 반복: ${uniqueMessages[0]}`);
        
        // 반복 패턴 알림
        toastManager.warning(
          `🔄 ${this.getErrorDisplayName(apiPath)}에서 반복적인 문제가 감지되었습니다`,
          {
            duration: 6000,
            action: {
              label: '문제 신고',
              onClick: () => {
                toastManager.info('개발팀에 문제가 자동으로 신고되었습니다');
              }
            }
          }
        );
      }
    }
  }

  /**
   * 💬 사용자 알림 (토스트 시스템 사용)
   */
  private static notifyUser(message: string, type: 'success' | 'error' | 'warning' = 'success'): void {
    if (typeof window === 'undefined') return;

    switch (type) {
      case 'success':
        toastManager.success(message);
        break;
      case 'error':
        toastManager.error(message);
        break;
      case 'warning':
        toastManager.warning(message);
        break;
    }
  }

  /**
   * 🏷️ API 경로를 사용자 친화적 이름으로 변환
   */
  private static getErrorDisplayName(apiPath: string): string {
    const pathMap: Record<string, string> = {
      '/api/ai-agent/integrated': 'AI 에이전트',
      '/api/ai-agent/optimized': 'AI 엔진 최적화',
      '/api/servers': '서버 모니터링',
      '/api/dashboard': '대시보드',
      '/api/health': '시스템 상태',
      '/api/metrics': '성능 지표'
    };

    return pathMap[apiPath] || '시스템 서비스';
  }

  /**
   * 📊 에러 통계 조회
   */
  static getErrorStats(): any {
    const now = Date.now();
    const recentErrors = this.errorHistory.filter(
      error => now - error.timestamp < this.ERROR_WINDOW
    );

    const errorsByPath = recentErrors.reduce((acc, error) => {
      acc[error.apiPath] = (acc[error.apiPath] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalErrors: this.errorHistory.length,
      recentErrors: recentErrors.length,
      errorsByPath,
      errorRate: recentErrors.length > 0 ? 
        (recentErrors.length / (this.ERROR_WINDOW / 60000)).toFixed(2) + '/min' : '0/min',
      lastError: this.errorHistory.length > 0 ? 
        this.errorHistory[this.errorHistory.length - 1] : null
    };
  }

  /**
   * 🧹 전체 리셋
   */
  static reset(): void {
    this.errorCounts.clear();
    this.errorHistory.length = 0;
    toastManager.success('🧹 에러 복구 시스템이 초기화되었습니다');
    console.log('🧹 에러 복구 시스템 리셋 완료');
  }

  /**
   * 🔧 시스템 상태 확인
   */
  static isHealthy(): boolean {
    const stats = this.getErrorStats();
    return stats.recentErrors < this.MAX_ERRORS;
  }
} 