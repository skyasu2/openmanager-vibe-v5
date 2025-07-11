/**
 * 🌊 SmoothTransition Component v1.0
 *
 * 페이지 전환 래퍼 컴포넌트
 * - 깜빡임 방지
 * - 부드러운 페이지 전환
 * - 로딩 상태 관리
 */

import React, { memo, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SmoothTransitionProps {
  children: ReactNode;
  isLoading?: boolean;
  loadingComponent?: ReactNode;
  className?: string;
  onEnterComplete?: () => void;
  onExitComplete?: () => void;
}

const SmoothTransition: React.FC<SmoothTransitionProps> = memo(
  ({
    children,
    isLoading = false,
    loadingComponent,
    className = '',
    onEnterComplete,
    onExitComplete,
  }) => {
    // 페이지 전환 애니메이션 variants
    const pageVariants: any = {
      initial: {
        opacity: 0,
        y: 20,
        scale: 0.98,
      },
      enter: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
          duration: 0.4,
          ease: [0.25, 0.46, 0.45, 0.94], // 부드러운 easing
          staggerChildren: 0.1,
        },
      },
      exit: {
        opacity: 0,
        y: -20,
        scale: 1.02,
        transition: {
          duration: 0.3,
          ease: [0.25, 0.46, 0.45, 0.94],
        },
      },
    };

    const contentVariants: any = {
      initial: {
        opacity: 0,
        y: 10,
      },
      enter: {
        opacity: 1,
        y: 0,
        transition: {
          duration: 0.3,
          ease: 'easeOut',
        },
      },
      exit: {
        opacity: 0,
        y: -10,
        transition: {
          duration: 0.2,
          ease: 'easeIn',
        },
      },
    };

    // 기본 로딩 컴포넌트
    const defaultLoadingComponent = (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className='min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center'
      >
        <div className='text-center'>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className='w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full mx-auto mb-4'
          />
          <motion.p
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className='text-gray-600 font-medium'
          >
            페이지를 로드하고 있습니다...
          </motion.p>
        </div>
      </motion.div>
    );

    return (
      <div className={`relative ${className}`}>
        <AnimatePresence mode='wait' onExitComplete={onExitComplete}>
          {isLoading ? (
            <motion.div
              key='loading'
              variants={pageVariants}
              initial='initial'
              animate='enter'
              exit='exit'
              onAnimationComplete={definition => {
                if (definition === 'enter') {
                  onEnterComplete?.();
                }
              }}
              style={{
                willChange: 'transform, opacity',
                transform: 'translate3d(0, 0, 0)',
              }}
            >
              {loadingComponent || defaultLoadingComponent}
            </motion.div>
          ) : (
            <motion.div
              key='content'
              variants={pageVariants}
              initial='initial'
              animate='enter'
              exit='exit'
              onAnimationComplete={definition => {
                if (definition === 'enter') {
                  onEnterComplete?.();
                }
              }}
              style={{
                willChange: 'transform, opacity',
                transform: 'translate3d(0, 0, 0)',
              }}
            >
              <motion.div variants={contentVariants}>{children}</motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

SmoothTransition.displayName = 'SmoothTransition';

export default SmoothTransition;
