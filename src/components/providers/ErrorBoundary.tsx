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

export class AIAgentErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeout: NodeJS.Timeout | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('🚨 AI Agent Error Boundary 감지된 오류:', error);
    console.error('📍 오류 정보:', errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // 에러 리포팅
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // 개발 모드에서 상세 로깅
    if (process.env.NODE_ENV === 'development') {
      console.group('🔍 Error Boundary 상세 정보');
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.error('Component Stack:', errorInfo.componentStack);
      console.groupEnd();
    }
  }

  handleRetry = () => {
    const { maxRetries = 3 } = this.props;
    
    if (this.state.retryCount < maxRetries) {
      console.log(`🔄 AI Agent 재시도 중... (${this.state.retryCount + 1}/${maxRetries})`);
      
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1
      }));
    } else {
      console.warn('⚠️ 최대 재시도 횟수 초과, 홈으로 이동 권장');
    }
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

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
      const isAIError = this.state.error?.message?.includes('AI') || 
                       this.state.error?.message?.includes('agent') ||
                       this.state.error?.message?.includes('400');

      return (
        <div className="min-h-screen bg-gradient-to-br from-red-900/20 via-purple-900/20 to-blue-900/20 flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-8 text-center">
            {/* 아이콘 */}
            <div className="mb-6">
              <AlertTriangle className="w-16 h-16 text-red-400 mx-auto" />
            </div>

            {/* 제목 */}
            <h1 className="text-2xl font-bold text-white mb-4">
              {isAIError ? '🤖 AI 에이전트 오류' : '⚡ 시스템 오류'}
            </h1>

            {/* 설명 */}
            <div className="mb-6 text-white/80">
              {isAIError ? (
                <div>
                  <p className="mb-2">AI 에이전트 초기화 중 문제가 발생했습니다.</p>
                  <p className="text-sm text-white/60">
                    시스템은 여전히 작동하며, 기본 모드로 계속 사용할 수 있습니다.
                  </p>
                </div>
              ) : (
                <div>
                  <p className="mb-2">예상치 못한 오류가 발생했습니다.</p>
                  <p className="text-sm text-white/60">
                    잠시 후 다시 시도하거나 홈으로 이동해주세요.
                  </p>
                </div>
              )}
            </div>

            {/* 에러 정보 (개발 모드) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-6 p-4 bg-red-500/20 rounded-lg text-left">
                <p className="text-red-300 text-xs font-mono">
                  {this.state.error.message}
                </p>
              </div>
            )}

            {/* 재시도 횟수 표시 */}
            {this.state.retryCount > 0 && (
              <div className="mb-4 text-sm text-white/60">
                재시도 횟수: {this.state.retryCount}/{maxRetries}
              </div>
            )}

            {/* 액션 버튼들 */}
            <div className="flex flex-col sm:flex-row gap-3">
              {canRetry && (
                <button
                  onClick={this.handleRetry}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  다시 시도
                </button>
              )}
              
              <button
                onClick={this.handleGoHome}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
              >
                <Home className="w-4 h-4" />
                홈으로 이동
              </button>
            </div>

            {/* 도움말 */}
            <div className="mt-6 text-xs text-white/50">
              {isAIError ? (
                <p>AI 기능을 사용하지 않고도 시스템 모니터링은 정상적으로 작동합니다.</p>
              ) : (
                <p>문제가 지속되면 브라우저를 새로고침하거나 관리자에게 문의하세요.</p>
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