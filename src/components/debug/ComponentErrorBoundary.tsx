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

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="border border-red-300 bg-red-50 p-4 rounded-lg">
          <h3 className="text-red-800 font-semibold">
            ⚠️ {this.props.componentName} 에러 발생
          </h3>
          <p className="text-red-600 text-sm mt-2">
            {this.state.error?.message}
          </p>
          <details className="mt-2">
            <summary className="text-red-700 cursor-pointer text-sm">
              기술 세부사항
            </summary>
            <pre className="text-xs text-red-600 mt-1 overflow-auto">
              {this.state.error?.stack}
            </pre>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * 🎯 서버 카드 전용 에러 바운더리 (사용 편의성)
 */
export const ServerCardErrorBoundary: React.FC<{
  children: ReactNode;
  serverId: string;
}> = ({ children, serverId }) => (
  <ComponentErrorBoundary 
    componentName="ServerCard" 
    serverId={serverId}
    fallback={
      <div className="bg-gray-100 border border-gray-300 p-4 rounded-lg">
        <p className="text-gray-600">서버 #{serverId} 로딩 오류</p>
        <p className="text-xs text-gray-500 mt-1">관리자에게 문의해주세요</p>
      </div>
    }
  >
    {children}
  </ComponentErrorBoundary>
);