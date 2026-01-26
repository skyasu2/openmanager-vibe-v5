'use client';

import { AlertTriangle, RefreshCw, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { Component, type ErrorInfo } from 'react';
// framer-motion 제거 - CSS 애니메이션 사용
import debug from '@/utils/debug';

interface Props {
  children: ReactNode;
  onClose: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ServerModalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    debug.error('🚨 ServerModal Error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>

              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                서버 모달 오류
              </h3>

              <p className="mb-4 text-gray-600">
                서버 상세 정보를 표시하는 중 오류가 발생했습니다.
              </p>

              {this.state.error && (
                <div className="mb-4 rounded-lg bg-gray-50 p-3 text-left">
                  <p className="font-mono text-sm text-gray-700">
                    {this.state.error.message}
                  </p>
                </div>
              )}

              <div className="flex justify-center gap-3">
                <button
                  type="button"
                  onClick={this.handleRetry}
                  className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
                >
                  <RefreshCw className="h-4 w-4" />
                  다시 시도
                </button>

                <button
                  type="button"
                  onClick={this.props.onClose}
                  className="flex items-center gap-2 rounded-lg bg-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-400"
                >
                  <X className="h-4 w-4" />
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ServerModalErrorBoundary;
