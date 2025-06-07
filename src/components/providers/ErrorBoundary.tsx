'use client';

import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: any;
  retryCount: number;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: any) => void;
  maxRetries?: number;
  resetOnRoute?: boolean;
}

export class AIAgentErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  private retryTimeout: NodeJS.Timeout | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    // 🚨 상세 에러 분석 시스템 (첫 번째 ErrorBoundary에서 통합)
    const isHydrationError = this.isHydrationError(error);
    const isMinifiedError = this.isMinifiedReactError(error);
    const isZustandError = this.isZustandError(error);

    // 🚨 React minified error #185 및 Zustand 전용 처리
    if (error.message.includes('Minified React error #185') || isZustandError) {
      console.error('🚨 [ErrorBoundary] React #185/Zustand 오류 감지:', {
        error: error.message,
        stack: error.stack,
        errorInfo,
        isZustandError,
        url: 'https://react.dev/errors/185',
      });

      // 상태 저장소 정리 시도
      this.cleanupStateStores();
    }

    // 🔍 특별한 에러 타입에 대한 추가 로깅 (첫 번째 ErrorBoundary에서 통합)
    if (isHydrationError) {
      console.warn('🔄 Hydration error detected - client/server mismatch');
      console.warn(
        '💡 Common causes: localStorage access, Date objects, random values during SSR'
      );
    }

    if (isMinifiedError) {
      console.warn(
        '⚠️ Minified React error detected - check React error decoder'
      );
      console.warn(
        '🔗 Visit: https://react.dev/errors/' + this.extractErrorCode(error)
      );
    }

    // 🚨 Zustand 스토어 관련 오류 감지
    if (
      error.message.includes('forceStoreRerender') ||
      error.message.includes('setState') ||
      error.stack?.includes('updateActivity') ||
      error.message.includes('Cannot read properties of') ||
      error.message.includes('Minified React error #185')
    ) {
      console.error('🚨 [ErrorBoundary] Zustand 스토어 오류 감지:', {
        error: error.message,
        isZustandError: true,
        component: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
      });

      // 🔄 스토어 상태 복구 시도
      try {
        // 전역 window에서 스토어 리셋 함수 찾기
        if (typeof window !== 'undefined') {
          // SystemStore 리셋
          const systemStoreKey = Object.keys(localStorage).find(key =>
            key.includes('system-store')
          );
          if (systemStoreKey) {
            localStorage.removeItem(systemStoreKey);
            console.log('🔄 [ErrorBoundary] SystemStore 상태 리셋');
          }

          // PowerStore 리셋
          const powerStoreKey = Object.keys(localStorage).find(key =>
            key.includes('power-store')
          );
          if (powerStoreKey) {
            localStorage.removeItem(powerStoreKey);
            console.log('🔄 [ErrorBoundary] PowerStore 상태 리셋');
          }
        }
      } catch (resetError) {
        console.warn('⚠️ [ErrorBoundary] 스토어 리셋 실패:', resetError);
      }
    }

    console.error('🚨 AI Agent Error Boundary 감지된 오류:', error);
    console.error('📍 오류 정보:', errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // 에러 리포팅
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // 개발 모드에서 상세 로깅
    if (process.env.NODE_ENV === 'development') {
      console.group('🔍 [Dev] 상세 에러 정보');
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.error('Component Stack:', errorInfo.componentStack);
      console.groupEnd();
    }
  }

  handleRetry = () => {
    const { maxRetries = 3 } = this.props;

    if (this.state.retryCount < maxRetries) {
      console.log(
        `🔄 AI Agent 재시도 중... (${this.state.retryCount + 1}/${maxRetries})`
      );

      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1,
      }));
    } else {
      console.warn('⚠️ 최대 재시도 횟수 초과, 홈으로 이동 권장');
    }
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  /**
   * 🧹 상태 저장소 정리 (기존 로직 유지하되 메서드화)
   */
  private cleanupStateStores() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const storeKeys = Object.keys(localStorage).filter(
          key =>
            key.includes('system-store') ||
            key.includes('unified-admin-storage') ||
            key.includes('power-store')
        );
        storeKeys.forEach(key => {
          try {
            localStorage.removeItem(key);
            console.log(`🧹 [ErrorBoundary] 정리된 스토어: ${key}`);
          } catch (e) {
            console.warn(`⚠️ [ErrorBoundary] 스토어 정리 실패: ${key}`, e);
          }
        });
      }
    } catch (cleanupError) {
      console.warn('⚠️ [ErrorBoundary] 상태 정리 중 오류:', cleanupError);
    }
  }

  /**
   * 🔍 에러 분석 메서드들 (첫 번째 ErrorBoundary에서 통합)
   */
  private isHydrationError(error: Error): boolean {
    return (
      error.message.includes('Hydration') ||
      error.message.includes('Text content does not match') ||
      error.message.includes('server-rendered HTML')
    );
  }

  private isMinifiedReactError(error: Error): boolean {
    return error.message.includes('Minified React error');
  }

  private isZustandError(error: Error): boolean {
    return (
      error.message.includes('zustand') ||
      error.message.includes('store') ||
      error.message.includes('forceStoreRerender') ||
      (error.stack?.includes('zustand') ?? false)
    );
  }

  private extractErrorCode(error: Error): string {
    const match = error.message.match(/Minified React error #(\d+)/);
    return match ? match[1] : 'unknown';
  }

  componentWillUnmount() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
  }

  render() {
    if (this.state.hasError) {
      // 커스텀 fallback이 제공된 경우
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { maxRetries = 3 } = this.props;
      const canRetry = this.state.retryCount < maxRetries;
      const isAIError =
        this.state.error?.message?.includes('AI') ||
        this.state.error?.message?.includes('agent') ||
        this.state.error?.message?.includes('400');

      return (
        <div className='min-h-screen bg-gradient-to-br from-red-900/20 via-purple-900/20 to-blue-900/20 flex items-center justify-center p-6'>
          <div className='max-w-lg w-full bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-8 text-center'>
            {/* 아이콘 */}
            <div className='mb-6'>
              <AlertTriangle className='w-16 h-16 text-red-400 mx-auto' />
            </div>

            {/* 제목 */}
            <h1 className='text-2xl font-bold text-white mb-4'>
              {isAIError ? '🤖 AI 에이전트 오류' : '⚡ 시스템 오류'}
            </h1>

            {/* 설명 */}
            <div className='mb-6 text-white/80'>
              {isAIError ? (
                <div>
                  <p className='mb-2'>
                    AI 에이전트 초기화 중 문제가 발생했습니다.
                  </p>
                  <p className='text-sm text-white/60'>
                    시스템은 여전히 작동하며, 기본 모드로 계속 사용할 수
                    있습니다.
                  </p>
                </div>
              ) : (
                <div>
                  <p className='mb-2'>예상치 못한 오류가 발생했습니다.</p>
                  <p className='text-sm text-white/60'>
                    잠시 후 다시 시도하거나 홈으로 이동해주세요.
                  </p>
                </div>
              )}
            </div>

            {/* 에러 정보 (개발 모드) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className='mb-6 p-4 bg-red-500/20 rounded-lg text-left'>
                <p className='text-red-300 text-xs font-mono'>
                  {this.state.error.message}
                </p>
              </div>
            )}

            {/* 재시도 횟수 표시 */}
            {this.state.retryCount > 0 && (
              <div className='mb-4 text-sm text-white/60'>
                재시도 횟수: {this.state.retryCount}/{maxRetries}
              </div>
            )}

            {/* 액션 버튼들 */}
            <div className='flex flex-col sm:flex-row gap-3'>
              {canRetry && (
                <button
                  onClick={this.handleRetry}
                  className='flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors'
                >
                  <RefreshCw className='w-4 h-4' />
                  다시 시도
                </button>
              )}

              <button
                onClick={this.handleGoHome}
                className='flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors'
              >
                <Home className='w-4 h-4' />
                홈으로 이동
              </button>
            </div>

            {/* 도움말 */}
            <div className='mt-6 text-xs text-white/50'>
              {isAIError ? (
                <p>
                  AI 기능을 사용하지 않고도 시스템 모니터링은 정상적으로
                  작동합니다.
                </p>
              ) : (
                <p>
                  문제가 지속되면 브라우저를 새로고침하거나 관리자에게
                  문의하세요.
                </p>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AIAgentErrorBoundary;
