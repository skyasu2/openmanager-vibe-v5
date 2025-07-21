/**
 * ⚠️ 사용자 친화적 에러 메시지 컴포넌트
 *
 * 경연대회 데모에서 에러 발생 시 사용자에게 친화적인 메시지와
 * 복구 가이드를 제공하는 컴포넌트
 */

import React from 'react';
import { RefreshCw, Home, HelpCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export interface ErrorMessageProps {
  /** 에러 제목 */
  title?: string;
  /** 에러 메시지 */
  message?: string;
  /** 에러 타입 */
  type?: 'network' | 'server' | 'data' | 'ai' | 'auth' | 'unknown';
  /** 복구 액션들 */
  actions?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
    icon?: React.ReactNode;
  }[];
  /** 전체 화면 표시 여부 */
  fullScreen?: boolean;
  /** 추가 CSS 클래스 */
  className?: string;
  /** 기술적 세부사항 표시 여부 */
  showTechnicalDetails?: boolean;
  /** 기술적 에러 정보 */
  technicalError?: string;
}

// 에러 타입별 메시지 및 가이드
const getErrorInfo = (type: ErrorMessageProps['type']) => {
  switch (type) {
    case 'network':
      return {
        title: '네트워크 연결 문제',
        message: '인터넷 연결을 확인하고 다시 시도해주세요.',
        icon: '🌐',
        suggestions: [
          '인터넷 연결 상태를 확인해주세요',
          '잠시 후 다시 시도해주세요',
          '브라우저를 새로고침해보세요',
        ],
      };
    case 'server':
      return {
        title: '서버 연결 오류',
        message: '서버에 일시적인 문제가 발생했습니다.',
        icon: '🔧',
        suggestions: [
          '잠시 후 다시 시도해주세요',
          '페이지를 새로고침해보세요',
          '문제가 지속되면 관리자에게 문의하세요',
        ],
      };
    case 'data':
      return {
        title: '데이터 로딩 실패',
        message: '데이터를 불러오는 중 문제가 발생했습니다.',
        icon: '📊',
        suggestions: [
          '페이지를 새로고침해보세요',
          '다른 메뉴로 이동 후 다시 시도해보세요',
          '브라우저 캐시를 삭제해보세요',
        ],
      };
    case 'ai':
      return {
        title: 'AI 엔진 오류',
        message: 'AI 분석 중 문제가 발생했습니다.',
        icon: '🤖',
        suggestions: [
          '다시 질문해보세요',
          '질문을 다르게 표현해보세요',
          '잠시 후 다시 시도해주세요',
        ],
      };
    case 'auth':
      return {
        title: '인증 오류',
        message: '로그인이 필요하거나 권한이 없습니다.',
        icon: '🔐',
        suggestions: [
          '로그인 상태를 확인해주세요',
          '페이지를 새로고침해보세요',
          '관리자에게 권한을 요청하세요',
        ],
      };
    default:
      return {
        title: '알 수 없는 오류',
        message: '예상치 못한 문제가 발생했습니다.',
        icon: '❓',
        suggestions: [
          '페이지를 새로고침해보세요',
          '브라우저를 다시 시작해보세요',
          '다른 브라우저를 사용해보세요',
        ],
      };
  }
};

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  title,
  message,
  type = 'unknown',
  actions = [],
  fullScreen = false,
  className = '',
  showTechnicalDetails = false,
  technicalError,
}) => {
  const errorInfo = getErrorInfo(type);
  const displayTitle = title || errorInfo.title;
  const displayMessage = message || errorInfo.message;

  // 기본 액션들
  const defaultActions = [
    {
      label: '새로고침',
      onClick: () => window.location.reload(),
      variant: 'primary' as const,
      icon: <RefreshCw className='w-4 h-4' />,
    },
    {
      label: '홈으로',
      onClick: () => (window.location.href = '/main'),
      variant: 'secondary' as const,
      icon: <Home className='w-4 h-4' />,
    },
  ];

  const allActions = actions.length > 0 ? actions : defaultActions;

  const content = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className='max-w-md mx-auto text-center space-y-6'
    >
      {/* 에러 아이콘 */}
      <div className='text-6xl mb-4'>{errorInfo.icon}</div>

      {/* 에러 제목 */}
      <div>
        <h2 className='text-2xl font-bold text-gray-900 dark:text-white mb-2'>
          {displayTitle}
        </h2>
        <p className='text-gray-600 dark:text-gray-300'>{displayMessage}</p>
      </div>

      {/* 해결 방법 제안 */}
      <div className='bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4'>
        <h3 className='text-sm font-medium text-blue-900 dark:text-blue-100 mb-2 flex items-center'>
          <HelpCircle className='w-4 h-4 mr-2' />
          해결 방법
        </h3>
        <ul className='text-sm text-blue-800 dark:text-blue-200 space-y-1'>
          {errorInfo.suggestions.map((suggestion, index) => (
            <li key={index} className='flex items-start'>
              <span className='text-blue-500 mr-2'>•</span>
              {suggestion}
            </li>
          ))}
        </ul>
      </div>

      {/* 액션 버튼들 */}
      <div className='flex flex-col sm:flex-row gap-3 justify-center'>
        {allActions.map((action, index) => (
          <motion.button
            key={index}
            onClick={action.onClick}
            className={`
              inline-flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-all
              ${
                action.variant === 'primary'
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white'
              }
            `}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {action.icon && <span className='mr-2'>{action.icon}</span>}
            {action.label}
          </motion.button>
        ))}
      </div>

      {/* 기술적 세부사항 (개발자용) */}
      {showTechnicalDetails && technicalError && (
        <details className='text-left'>
          <summary className='text-sm text-gray-500 cursor-pointer hover:text-gray-700'>
            기술적 세부사항 보기
          </summary>
          <div className='mt-2 p-3 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono text-gray-700 dark:text-gray-300 overflow-auto'>
            {technicalError}
          </div>
        </details>
      )}
    </motion.div>
  );

  if (fullScreen) {
    return (
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center bg-white dark:bg-gray-900 p-6 ${className}`}
      >
        {content}
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center p-6 ${className}`}>
      {content}
    </div>
  );
};

// 특정 에러 타입별 편의 컴포넌트들
export const NetworkError: React.FC<
  Omit<ErrorMessageProps, 'type'>
> = props => <ErrorMessage {...props} type='network' />;

export const ServerError: React.FC<Omit<ErrorMessageProps, 'type'>> = props => (
  <ErrorMessage {...props} type='server' />
);

export const DataError: React.FC<Omit<ErrorMessageProps, 'type'>> = props => (
  <ErrorMessage {...props} type='data' />
);

export const AIError: React.FC<Omit<ErrorMessageProps, 'type'>> = props => (
  <ErrorMessage {...props} type='ai' />
);

export const AuthError: React.FC<Omit<ErrorMessageProps, 'type'>> = props => (
  <ErrorMessage {...props} type='auth' />
);

// 기본 내보내기
export default ErrorMessage;
