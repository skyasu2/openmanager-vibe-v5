'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, X } from 'lucide-react';
import { motion } from 'framer-motion';

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
    console.error('🚨 ServerModal Error:', error, errorInfo);
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
        <div className='fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4'>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className='bg-white rounded-2xl shadow-2xl w-full max-w-md p-6'
          >
            <div className='text-center'>
              <div className='mx-auto flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4'>
                <AlertTriangle className='w-8 h-8 text-red-600' />
              </div>

              <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                서버 모달 오류
              </h3>

              <p className='text-gray-600 mb-4'>
                서버 상세 정보를 표시하는 중 오류가 발생했습니다.
              </p>

              {this.state.error && (
                <div className='bg-gray-50 rounded-lg p-3 mb-4 text-left'>
                  <p className='text-sm text-gray-700 font-mono'>
                    {this.state.error.message}
                  </p>
                </div>
              )}

              <div className='flex gap-3 justify-center'>
                <button
                  onClick={this.handleRetry}
                  className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2'
                >
                  <RefreshCw className='w-4 h-4' />
                  다시 시도
                </button>

                <button
                  onClick={this.props.onClose}
                  className='px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors flex items-center gap-2'
                >
                  <X className='w-4 h-4' />
                  닫기
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ServerModalErrorBoundary;
