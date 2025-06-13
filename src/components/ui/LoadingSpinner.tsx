/**
 * 🔄 통일된 로딩 스피너 컴포넌트
 *
 * OpenManager Vibe v5 전체에서 사용하는 표준 로딩 UI
 * - 다양한 크기 지원
 * - 컨텍스트별 메시지
 * - 접근성 지원
 * - 일관된 디자인
 */

import React from 'react';
import { Loader2, Brain, Server, Database, Wifi } from 'lucide-react';
import { motion } from 'framer-motion';

export interface LoadingSpinnerProps {
  /** 로딩 스피너 크기 */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** 로딩 메시지 */
  message?: string;
  /** 로딩 컨텍스트 (아이콘 선택용) */
  context?: 'default' | 'ai' | 'server' | 'database' | 'network';
  /** 전체 화면 오버레이 여부 */
  fullScreen?: boolean;
  /** 배경 색상 */
  variant?: 'light' | 'dark' | 'transparent';
  /** 추가 CSS 클래스 */
  className?: string;
  /** 진행률 표시 (0-100) */
  progress?: number;
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
};

const containerSizeClasses = {
  sm: 'p-2',
  md: 'p-4',
  lg: 'p-6',
  xl: 'p-8',
};

const textSizeClasses = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
  xl: 'text-lg',
};

const getContextIcon = (
  context: LoadingSpinnerProps['context'],
  size: string
) => {
  const iconClass = `${sizeClasses[size as keyof typeof sizeClasses]} animate-spin`;

  switch (context) {
    case 'ai':
      return <Brain className={iconClass} />;
    case 'server':
      return <Server className={iconClass} />;
    case 'database':
      return <Database className={iconClass} />;
    case 'network':
      return <Wifi className={iconClass} />;
    default:
      return <Loader2 className={iconClass} />;
  }
};

const getContextMessage = (context: LoadingSpinnerProps['context']): string => {
  switch (context) {
    case 'ai':
      return 'AI 엔진 처리 중...';
    case 'server':
      return '서버 데이터 로딩 중...';
    case 'database':
      return '데이터베이스 연결 중...';
    case 'network':
      return '네트워크 연결 중...';
    default:
      return '로딩 중...';
  }
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  message,
  context = 'default',
  fullScreen = false,
  variant = 'light',
  className = '',
  progress,
}) => {
  const displayMessage = message || getContextMessage(context);

  const variantClasses = {
    light: 'bg-white/90 text-gray-900',
    dark: 'bg-gray-900/90 text-white',
    transparent: 'bg-transparent text-current',
  };

  const content = (
    <div
      className={`flex flex-col items-center justify-center space-y-3 ${containerSizeClasses[size]}`}
    >
      {/* 로딩 아이콘 */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className='relative'
      >
        {getContextIcon(context, size)}

        {/* 진행률 링 (progress가 있을 때) */}
        {progress !== undefined && (
          <svg
            className={`absolute inset-0 ${sizeClasses[size]} transform -rotate-90`}
            viewBox='0 0 24 24'
          >
            <circle
              cx='12'
              cy='12'
              r='10'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              strokeOpacity='0.2'
            />
            <circle
              cx='12'
              cy='12'
              r='10'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              strokeDasharray={`${2 * Math.PI * 10}`}
              strokeDashoffset={`${2 * Math.PI * 10 * (1 - progress / 100)}`}
              strokeLinecap='round'
              className='transition-all duration-300'
            />
          </svg>
        )}
      </motion.div>

      {/* 로딩 메시지 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className={`text-center ${textSizeClasses[size]}`}
      >
        <div className='font-medium'>{displayMessage}</div>
        {progress !== undefined && (
          <div className='text-xs opacity-70 mt-1'>
            {Math.round(progress)}% 완료
          </div>
        )}
      </motion.div>

      {/* 점 애니메이션 */}
      <motion.div
        className='flex space-x-1'
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            className='w-1 h-1 bg-current rounded-full'
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </motion.div>
    </div>
  );

  if (fullScreen) {
    return (
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm ${variantClasses[variant]} ${className}`}
        role='status'
        aria-live='polite'
        aria-label={displayMessage}
      >
        {content}
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-center ${variantClasses[variant]} ${className}`}
      role='status'
      aria-live='polite'
      aria-label={displayMessage}
    >
      {content}
    </div>
  );
};

// 편의 컴포넌트들
export const AILoadingSpinner: React.FC<
  Omit<LoadingSpinnerProps, 'context'>
> = props => <LoadingSpinner {...props} context='ai' />;

export const ServerLoadingSpinner: React.FC<
  Omit<LoadingSpinnerProps, 'context'>
> = props => <LoadingSpinner {...props} context='server' />;

export const DatabaseLoadingSpinner: React.FC<
  Omit<LoadingSpinnerProps, 'context'>
> = props => <LoadingSpinner {...props} context='database' />;

export const NetworkLoadingSpinner: React.FC<
  Omit<LoadingSpinnerProps, 'context'>
> = props => <LoadingSpinner {...props} context='network' />;

// 기본 내보내기
export default LoadingSpinner;
