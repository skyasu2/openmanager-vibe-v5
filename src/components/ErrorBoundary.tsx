'use client';

import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: string;
  errorId?: string;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // 에러 ID 생성 (디버깅용)
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Update state so the next render will show the fallback UI
    return { 
      hasError: true, 
      error,
      errorId
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // React 에러 타입 분석
    const isHydrationError = this.isHydrationError(error);
    const isMinifiedError = this.isMinifiedReactError(error);
    
    this.setState({
      error,
      errorInfo: errorInfo.componentStack || undefined,
      errorId: this.state.errorId
    });

    // 특별한 에러 타입에 대한 추가 로깅
    if (isHydrationError) {
      console.warn('🔄 Hydration error detected - this is usually caused by client/server mismatch');
      console.warn('💡 Common causes: localStorage access, Date objects, random values during SSR');
    }

    if (isMinifiedError) {
      console.warn('⚠️ Minified React error detected - check React error decoder for details');
      console.warn('🔗 Visit: https://react.dev/errors/' + this.extractErrorCode(error));
    }

    // Send to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      this.logErrorToService(error, errorInfo, { isHydrationError, isMinifiedError });
    }
  }

  private isHydrationError(error: Error): boolean {
    const message = error.message.toLowerCase();
    return message.includes('hydration') || 
           message.includes('server') && message.includes('client') ||
           message.includes('text content does not match') ||
           message.includes('expected server html');
  }

  private isMinifiedReactError(error: Error): boolean {
    return error.message.includes('Minified React error') ||
           /react error #\d+/i.test(error.message);
  }

  private extractErrorCode(error: Error): string {
    const match = error.message.match(/react error #(\d+)/i);
    return match ? match[1] : 'unknown';
  }

  private logErrorToService(error: Error, errorInfo: React.ErrorInfo, metadata: any) {
    try {
      // Send error to monitoring service
      fetch('/api/error-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          errorId: this.state.errorId,
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          timestamp: new Date().toISOString(),
          url: window.location.href,
          userAgent: navigator.userAgent,
          metadata,
          errorType: metadata.isHydrationError ? 'hydration' : 
                    metadata.isMinifiedError ? 'minified-react' : 'general'
        }),
      }).catch(console.error);
    } catch (e) {
      console.error('Failed to log error to service:', e);
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isHydrationError = this.state.error && this.isHydrationError(this.state.error);
      const isMinifiedError = this.state.error && this.isMinifiedReactError(this.state.error);

      // Default error UI
      return (
        <div style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          padding: '2rem'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '16px',
            padding: '3rem',
            maxWidth: '600px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>
              {isHydrationError ? '🔄' : '⚠️'}
            </div>
            
            <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>
              {isHydrationError ? '페이지 로딩 중 오류' : '앗! 오류가 발생했습니다'}
            </h1>
            
            <p style={{ 
              fontSize: '1.1rem', 
              marginBottom: '2rem', 
              opacity: 0.9,
              lineHeight: 1.6 
            }}>
              {isHydrationError 
                ? '페이지를 새로고침하면 문제가 해결될 수 있습니다.'
                : '예상치 못한 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
              }
              
              {process.env.NODE_ENV === 'development' && (
                <>
                  <br /><br />
                  <strong>개발 모드 오류 정보:</strong><br />
                  <code style={{ 
                    background: 'rgba(0,0,0,0.3)', 
                    padding: '0.5rem', 
                    borderRadius: '4px',
                    fontSize: '0.9rem',
                    display: 'block',
                    marginTop: '0.5rem',
                    textAlign: 'left'
                  }}>
                    {this.state.error?.message}
                  </code>
                  
                  {this.state.errorId && (
                    <>
                      <br />
                      <strong>에러 ID:</strong> {this.state.errorId}
                    </>
                  )}
                  
                  {isMinifiedError && (
                    <>
                      <br />
                      <strong>React 에러 코드:</strong> {this.extractErrorCode(this.state.error!)}
                      <br />
                      <a 
                        href={`https://react.dev/errors/${this.extractErrorCode(this.state.error!)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#87CEEB' }}
                      >
                        자세한 정보 보기 →
                      </a>
                    </>
                  )}
                </>
              )}
            </p>

            <div style={{ 
              display: 'flex', 
              gap: '1rem', 
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={this.handleRetry}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '8px',
                  padding: '0.75rem 1.5rem',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                }}
              >
                다시 시도
              </button>
              
              <button
                onClick={this.handleReload}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '8px',
                  padding: '0.75rem 1.5rem',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                }}
              >
                새로고침
              </button>

              <button
                onClick={this.handleGoHome}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '8px',
                  padding: '0.75rem 1.5rem',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                }}
              >
                홈으로
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 