/**
 * 🔍 디버깅용 에러 바운더리 - 15개 TypeError 원인 추적
 * 각 서버 카드 컴포넌트를 개별 래핑하여 정확한 에러 발생 지점 식별
 */
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  componentName: string;
  serverId?: string;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ComponentErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 🚨 TypeError 감지 시 상세 로깅
    const isTypeError = error.message.includes('Cannot read properties of undefined') && 
                       error.message.includes("(reading 'length')");
    
    if (isTypeError) {
      console.error(`🚨 TypeError 발견! 컴포넌트: ${this.props.componentName}`);
      console.error(`📍 서버 ID: ${this.props.serverId || 'Unknown'}`);
      console.error(`💥 에러 메시지:`, error.message);
      console.error(`📋 컴포넌트 스택:`, errorInfo.componentStack);
      console.error(`🔍 JavaScript 스택:`, error.stack);
      
      // 🎯 에러 위치 세밀 분석
      if (error.stack) {
        const stackLines = error.stack.split('\n');
        const relevantLine = stackLines.find(line => 
          line.includes('ImprovedServerCard') || 
          line.includes('SafeServerCard') ||
          line.includes('ServerMetrics') ||
          line.includes('useServerDashboard')
        );
        if (relevantLine) {
          console.error(`🎯 관련 코드 위치:`, relevantLine);
        }
      }
      
      // 🚨 전역 에러 카운터 증가
      if (typeof window !== 'undefined') {
        (window as any).__typeErrorCount = ((window as any).__typeErrorCount || 0) + 1;
        console.error(`📊 총 TypeError 개수: ${(window as any).__typeErrorCount}/15`);
      }
    }

    this.setState({ hasError: true, error, errorInfo });
  }

  // 🛡️ AI 교차검증: 재시도 기능 추가 (Gemini UX 권장)
  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-6 rounded-xl shadow-sm">
          {/* 🎨 Gemini 권장: 사용자 친화적 아이콘과 메시지 */}
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-amber-800 font-medium text-lg">
                일시적인 문제가 발생했습니다
              </h3>
              <p className="text-amber-700 text-sm mt-1">
                {this.props.componentName === 'ServerCard' ?
                  `서버 ${this.props.serverId}의 정보를 불러오는 중 문제가 발생했습니다.` :
                  `${this.props.componentName} 컴포넌트에서 문제가 발생했습니다.`
                }
              </p>

              {/* 🚀 Codex 권장: 실용적인 사용자 액션 */}
              <div className="mt-4 flex items-center gap-3">
                <button
                  onClick={this.handleRetry}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  다시 시도
                </button>

                <button
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors duration-200"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  페이지 새로고침
                </button>
              </div>

              {/* 🔍 개발 환경에서만 기술적 세부사항 표시 */}
              {process.env.NODE_ENV === 'development' && (
                <details className="mt-4 group">
                  <summary className="text-amber-700 cursor-pointer text-sm font-medium group-open:text-amber-800">
                    🔧 개발자 정보
                  </summary>
                  <div className="mt-2 p-3 bg-amber-100 rounded-lg">
                    <p className="text-xs text-amber-800 font-medium mb-2">
                      에러: {this.state.error?.message}
                    </p>
                    <pre className="text-xs text-amber-700 overflow-auto max-h-32 bg-white p-2 rounded border">
                      {this.state.error?.stack}
                    </pre>
                  </div>
                </details>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * 🎯 서버 카드 전용 에러 바운더리 (AI 교차검증 UX 개선)
 */
export const ServerCardErrorBoundary: React.FC<{
  children: ReactNode;
  serverId: string;
}> = ({ children, serverId }) => (
  <ComponentErrorBoundary
    componentName="ServerCard"
    serverId={serverId}
    fallback={
      // 🎨 Gemini 권장: 서버 카드와 일관된 디자인 시스템
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 min-h-[240px] flex flex-col justify-center items-center">
        {/* 🎯 Codex 권장: 직관적인 아이콘과 상태 표시 */}
        <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>

        {/* 🛡️ 사용자 친화적 메시지 */}
        <div className="text-center">
          <h3 className="text-slate-700 font-medium text-lg mb-2">
            서버 정보 로드 오류
          </h3>
          <p className="text-slate-500 text-sm mb-1">
            서버 #{serverId}
          </p>
          <p className="text-slate-400 text-xs">
            잠시 후 자동으로 다시 시도됩니다
          </p>
        </div>

        {/* 🚀 Qwen 권장: 최소한의 상태 표시 */}
        <div className="mt-4 flex justify-center">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
            <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
          </div>
        </div>
      </div>
    }
  >
    {children}
  </ComponentErrorBoundary>
);