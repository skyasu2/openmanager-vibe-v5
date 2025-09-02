/**
 * 🛡️ Performance Error Boundary
 * 
 * React Error #310 "Maximum update depth exceeded" 및 성능 관련 에러를
 * 자동으로 감지하고 복구하는 고급 에러 바운더리
 * 
 * AI 교차검증 결과 반영:
 * - Codex: Error Boundary 강화 + 자동 복구 로직 (8.2/10)
 * - Gemini: 성능 모니터링 통합 (7.5/10)  
 * - Qwen: 메모리 프로파일링 자동화 (6.8/10)
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Clock, Activity } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  maxRetries?: number;
  retryDelay?: number;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  retryCount: number;
  isRecovering: boolean;
  lastStableState?: Record<string, unknown>;
  performanceMetrics: {
    renderTime: number;
    memoryUsage: number;
    errorFrequency: number;
  };
}

class PerformanceErrorBoundary extends Component<Props, State> {
  private performanceObserver: PerformanceObserver | null = null;
  private retryTimer: NodeJS.Timeout | null = null;
  private stableStateInterval: NodeJS.Timeout | null = null;
  private _componentMounted: boolean = false; // 🛡️ setState 오류 방지를 위한 마운트 상태 추적
  
  constructor(props: Props) {
    super(props);
    
    this.state = {
      hasError: false,
      retryCount: 0,
      isRecovering: false,
      performanceMetrics: {
        renderTime: 0,
        memoryUsage: 0,
        errorFrequency: 0
      }
    };
    
    // 안정 상태 주기적 저장은 componentDidMount에서 설정
  }
  
  componentDidMount() {
    this._componentMounted = true; // 🛡️ 컴포넌트 마운트 상태 설정
    
    // 성능 모니터링 시작 (마운트 후에 안전하게 실행)
    this.initPerformanceMonitoring();
    
    // 안정 상태 주기적 저장 (5초마다) - 마운트 후에 안전하게 설정
    this.stableStateInterval = setInterval(() => {
      if (!this.state.hasError) {
        this.saveStableState();
      }
    }, 5000);
  }

  componentWillUnmount() {
    this._componentMounted = false; // 🛡️ setState 오류 방지를 위한 마운트 해제
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
    }
    if (this.stableStateInterval) {
      clearInterval(this.stableStateInterval);
    }
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }
  }
  
  // 🛡️ 마운트 상태를 체크하는 안전한 setState 헬퍼
  private safeSetState(partialState: Partial<State> | ((prevState: State) => Partial<State>)): void {
    if (this._componentMounted) {
      this.setState(partialState as any);
    }
  }
  
  private initPerformanceMonitoring() {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      try {
        this.performanceObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 1000) { // 1초 초과 시
              console.warn(`⚠️ 성능 저하 감지: ${entry.name} - ${entry.duration}ms`);
              
              // 성능 메트릭 업데이트 (마운트 상태 체크)
              this.safeSetState(prevState => ({
                performanceMetrics: {
                  ...prevState.performanceMetrics,
                  renderTime: entry.duration
                }
              }));
            }
          }
        });
        
        this.performanceObserver.observe({ 
          entryTypes: ['measure', 'navigation', 'paint'] 
        });
      } catch (error) {
        console.warn('Performance Observer 초기화 실패:', error);
      }
    }
  }
  
  private saveStableState() {
    // 현재 안정 상태를 저장 (메모리 사용량도 함께)
    const memoryInfo = (performance as any).memory;
    const memoryUsage = memoryInfo ? memoryInfo.usedJSHeapSize : 0;
    
    this.safeSetState(prevState => ({
      lastStableState: {
        timestamp: Date.now(),
        location: window.location.pathname,
        userAgent: navigator.userAgent,
        memoryUsage
      },
      performanceMetrics: {
        ...prevState.performanceMetrics,
        memoryUsage
      }
    }));
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { 
      hasError: true, 
      error,
      performanceMetrics: {
        renderTime: 0,
        memoryUsage: 0,
        errorFrequency: Date.now()
      }
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.safeSetState({ errorInfo });
    
    // React Error #310 특별 처리
    const isMaxUpdateDepthError = error.message.includes('Maximum update depth exceeded');
    const isInfiniteLoopError = error.message.includes('Too many re-renders');
    
    if (isMaxUpdateDepthError || isInfiniteLoopError) {
      console.error('🚨 React Error #310 감지:', error.message);
      this.handleMaxUpdateDepthError(error, errorInfo);
    }
    
    // 에러 정보 로깅
    const errorDetails = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      memoryUsage: (performance as any).memory?.usedJSHeapSize || 0,
      retryCount: this.state.retryCount
    };
    
    if (process.env.NODE_ENV === 'production') {
      // 프로덕션에서는 에러 추적 서비스로 전송
      console.error('Performance Error Boundary:', errorDetails);
      // TODO: Vercel Analytics, Sentry 등으로 전송
    } else {
      console.group('🛡️ Performance Error Boundary');
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.table(errorDetails);
      console.groupEnd();
    }
    
    // 사용자 정의 에러 핸들러 호출
    this.props.onError?.(error, errorInfo);
    
    // 자동 복구 시도
    this.attemptAutoRecovery(error);
  }
  
  private handleMaxUpdateDepthError(error: Error, errorInfo: ErrorInfo) {
    console.log('🔄 React Error #310 자동 복구 시도...');
    
    // 1. 즉시 상태 초기화
    setTimeout(() => {
      this.rollbackToLastStableState();
    }, 100);
    
    // 2. 메모리 정리
    if (typeof window !== 'undefined' && window.gc) {
      try {
        window.gc();
        console.log('✅ 메모리 가비지 컬렉션 실행됨');
      } catch (gcError) {
        console.warn('메모리 GC 실행 실패:', gcError);
      }
    }
    
    // 3. 성능 경고 발행
    console.warn(`
⚠️ React Error #310 감지됨:
- 무한 리렌더링 루프 발생 가능성
- useEffect 의존성 배열 확인 필요  
- 함수 참조 의존성 제거 권장
- 컴포넌트: ${errorInfo.componentStack?.split('\n')[1]?.trim() || 'Unknown'}
    `);
  }
  
  private attemptAutoRecovery(error: Error) {
    const maxRetries = this.props.maxRetries || 3;
    const retryDelay = this.props.retryDelay || 2000;
    
    if (this.state.retryCount < maxRetries) {
      this.safeSetState({ isRecovering: true });
      
      this.retryTimer = setTimeout(() => {
        console.log(`🔄 자동 복구 시도 ${this.state.retryCount + 1}/${maxRetries}`);
        
        this.safeSetState(prevState => ({
          hasError: false,
          error: undefined,
          errorInfo: undefined,
          retryCount: prevState.retryCount + 1,
          isRecovering: false
        }));
      }, retryDelay);
    } else {
      console.error('❌ 최대 재시도 횟수 초과. 수동 복구 필요.');
      this.safeSetState({ isRecovering: false });
    }
  }
  
  private rollbackToLastStableState() {
    if (this.state.lastStableState) {
      console.log('🔙 마지막 안정 상태로 롤백:', this.state.lastStableState);
      
      // 가능한 경우 이전 안정 상태로 복원
      // (실제 상태 복원은 앱별로 구현 필요)
      this.safeSetState({ 
        hasError: false,
        error: undefined,
        errorInfo: undefined,
        isRecovering: false 
      });
    }
  }

  private handleManualRetry = () => {
    console.log('🔄 수동 재시도 실행');
    
    this.safeSetState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      retryCount: 0,
      isRecovering: false
    });
  };
  
  private handleForceRefresh = () => {
    console.log('🔄 페이지 강제 새로고침');
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // 복구 중인 경우
      if (this.state.isRecovering) {
        return (
          <div className="flex flex-col items-center justify-center min-h-[200px] p-6 bg-blue-50/50 border border-blue-200 rounded-xl">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-blue-700 font-medium">자동 복구 중...</p>
            <p className="text-blue-600 text-sm">잠시만 기다려주세요</p>
          </div>
        );
      }
      
      // 사용자 정의 fallback이 있으면 사용
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isMaxUpdateDepthError = this.state.error?.message.includes('Maximum update depth exceeded');
      const maxRetries = this.props.maxRetries || 3;

      // React Error #310 특별 UI
      return (
        <div className="relative min-h-[300px] p-6 bg-gradient-to-br from-red-50/80 via-white/90 to-orange-50/60 border-2 border-red-200/60 rounded-xl">
          <div className="flex flex-col items-center justify-center h-full space-y-6">
            {/* 에러 아이콘 */}
            <div className="rounded-full p-4 bg-red-100/80 backdrop-blur-sm">
              <AlertTriangle className="h-10 w-10 text-red-600" />
            </div>
            
            {/* 에러 메시지 */}
            <div className="text-center space-y-3 max-w-md">
              <h3 className="text-xl font-semibold text-gray-900">
                {isMaxUpdateDepthError ? '🚨 React Error #310 감지' : '⚠️ 성능 문제 발생'}
              </h3>
              
              <p className="text-gray-600">
                {isMaxUpdateDepthError 
                  ? '무한 리렌더링 루프가 감지되었습니다. 자동 복구를 시도했지만 수동 개입이 필요합니다.'
                  : '성능 관련 오류가 발생했습니다. 아래 버튼으로 복구를 시도해보세요.'
                }
              </p>
              
              {/* 성능 메트릭 표시 */}
              <div className="flex justify-center gap-4 text-xs text-gray-500 bg-gray-100/50 rounded-lg p-3">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>렌더: {this.state.performanceMetrics.renderTime.toFixed(0)}ms</span>
                </div>
                <div className="flex items-center gap-1">
                  <Activity className="h-3 w-3" />
                  <span>메모리: {(this.state.performanceMetrics.memoryUsage / 1024 / 1024).toFixed(1)}MB</span>
                </div>
              </div>
              
              {/* 개발 환경에서만 상세 정보 표시 */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="text-xs text-gray-500 mt-4">
                  <summary className="cursor-pointer font-medium">🔍 개발자 정보</summary>
                  <div className="mt-2 p-3 bg-gray-100 rounded text-left space-y-2">
                    <div><strong>에러:</strong> {this.state.error.message}</div>
                    <div><strong>재시도:</strong> {this.state.retryCount}/{maxRetries}</div>
                    {this.state.lastStableState && (
                      <div><strong>마지막 안정:</strong> {
                        typeof this.state.lastStableState.timestamp === 'string' || typeof this.state.lastStableState.timestamp === 'number' 
                          ? new Date(this.state.lastStableState.timestamp).toLocaleTimeString()
                          : 'Unknown'
                      }</div>
                    )}
                  </div>
                </details>
              )}
            </div>

            {/* 복구 버튼들 */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={this.handleManualRetry}
                disabled={this.state.retryCount >= maxRetries}
                className="flex items-center gap-2 px-6 py-3 bg-red-100 hover:bg-red-200 disabled:bg-gray-100 disabled:text-gray-400 text-red-700 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/20"
                aria-label="컴포넌트 재시도"
              >
                <RefreshCw className="h-4 w-4" />
                다시 시도 ({this.state.retryCount}/{maxRetries})
              </button>
              
              <button
                onClick={this.handleForceRefresh}
                className="flex items-center gap-2 px-6 py-3 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                aria-label="페이지 새로고침"
              >
                <Clock className="h-4 w-4" />
                페이지 새로고침
              </button>
            </div>
            
            {/* React Error #310 전용 도움말 */}
            {isMaxUpdateDepthError && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm">
                <h4 className="font-medium text-yellow-800 mb-2">💡 해결 방법:</h4>
                <ul className="text-yellow-700 space-y-1 text-xs">
                  <li>• useEffect 의존성 배열에서 함수 참조 제거</li>
                  <li>• useCallback, useMemo로 함수 메모이제이션</li>
                  <li>• 상태 업데이트 로직 점검</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default PerformanceErrorBoundary;