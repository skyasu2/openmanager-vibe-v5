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
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { 
      hasError: true, 
      error 
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
        this.setState({      error,      errorInfo: errorInfo.componentStack || undefined    });

    // Send to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      this.logErrorToService(error, errorInfo);
    }
  }

  private logErrorToService(error: Error, errorInfo: React.ErrorInfo) {
    try {
      // Send error to monitoring service
      fetch('/api/error-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          timestamp: new Date().toISOString(),
          url: window.location.href,
          userAgent: navigator.userAgent,
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

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

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
              ⚠️
            </div>
            
            <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>
              앗! 오류가 발생했습니다
            </h1>
            
            <p style={{ 
              fontSize: '1.1rem', 
              marginBottom: '2rem', 
              opacity: 0.9,
              lineHeight: 1.6 
            }}>
              예상치 못한 오류가 발생했습니다. 잠시 후 다시 시도해주세요.
              {process.env.NODE_ENV === 'development' && (
                <>
                  <br /><br />
                  <strong>개발 모드 오류 정보:</strong><br />
                  {this.state.error?.message}
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
                  background: 'linear-gradient(45deg, #1a73e8, #34a853)',
                  color: 'white',
                  fontSize: '1rem',
                  fontWeight: '600',
                  padding: '0.8rem 2rem',
                  border: 'none',
                  borderRadius: '50px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                다시 시도
              </button>

              <button
                onClick={this.handleReload}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  fontSize: '1rem',
                  fontWeight: '600',
                  padding: '0.8rem 2rem',
                  border: 'none',
                  borderRadius: '50px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                페이지 새로고침
              </button>

                                          <button                onClick={() => window.location.href = '/'}                style={{                  background: 'transparent',                  color: 'rgba(255, 255, 255, 0.8)',                  fontSize: '1rem',                  fontWeight: '600',                  padding: '0.8rem 2rem',                  border: '1px solid rgba(255, 255, 255, 0.3)',                  borderRadius: '50px',                  cursor: 'pointer',                  transition: 'all 0.3s ease'                }}                onMouseOver={(e) => {                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';                  e.currentTarget.style.transform = 'translateY(-2px)';                }}                onMouseOut={(e) => {                  e.currentTarget.style.background = 'transparent';                  e.currentTarget.style.transform = 'translateY(0)';                }}              >                홈으로 이동              </button>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
              <details style={{ 
                marginTop: '2rem', 
                textAlign: 'left',
                background: 'rgba(0, 0, 0, 0.3)',
                padding: '1rem',
                borderRadius: '8px',
                fontSize: '0.8rem'
              }}>
                <summary style={{ cursor: 'pointer', marginBottom: '0.5rem' }}>
                  개발자 정보 (클릭하여 펼치기)
                </summary>
                <pre style={{ whiteSpace: 'pre-wrap', overflow: 'auto' }}>
                  {this.state.errorInfo}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 