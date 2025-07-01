/**
 * 🔘 StepDots Component
 * 
 * SimulateProgressBar의 단계 표시점을 담당하는 모듈화된 컴포넌트
 * - 총 단계 수만큼 점 표시
 * - 현재 진행 상태 표시
 * - 호버 효과 및 애니메이션
 */

import React from 'react';
import { motion } from 'framer-motion';

interface StepDotsProps {
  currentStep: number;
  totalSteps: number;
  error?: string | null;
  showLabels?: boolean;
  orientation?: 'horizontal' | 'vertical';
  size?: 'sm' | 'md' | 'lg';
  onStepClick?: (step: number) => void;
}

const StepDots: React.FC<StepDotsProps> = ({
  currentStep,
  totalSteps,
  error = null,
  showLabels = false,
  orientation = 'horizontal',
  size = 'md',
  onStepClick
}) => {
  // 크기별 클래스
  const getSizeClasses = () => {
    switch (size) {
      case 'sm': return { dot: 'w-1.5 h-1.5', spacing: 'gap-1' };
      case 'lg': return { dot: 'w-4 h-4', spacing: 'gap-3' };
      default: return { dot: 'w-2 h-2', spacing: 'gap-2' };
    }
  };

  // 방향별 클래스
  const getOrientationClasses = () => {
    return orientation === 'vertical' 
      ? 'flex flex-col items-center' 
      : 'flex flex-row justify-between items-center';
  };

  // 점의 상태별 색상
  const getDotColor = (stepIndex: number) => {
    if (stepIndex < currentStep) {
      return 'bg-green-400'; // 완료된 단계
    }
    if (stepIndex === currentStep) {
      if (error) return 'bg-red-400'; // 현재 단계 오류
      return 'bg-blue-400'; // 현재 진행 중인 단계
    }
    return 'bg-gray-600'; // 미완료 단계
  };

  // 점 클릭 핸들러
  const handleDotClick = (stepIndex: number) => {
    if (onStepClick && stepIndex <= currentStep) {
      onStepClick(stepIndex);
    }
  };

  const sizeClasses = getSizeClasses();

  return (
    <div className={`${getOrientationClasses()} ${sizeClasses.spacing} px-1`}>
      {Array.from({ length: totalSteps }, (_, index) => (
        <div key={index} className="relative flex flex-col items-center">
          {/* 점 */}
          <motion.div
            className={`${sizeClasses.dot} rounded-full transition-all duration-300 cursor-pointer relative ${getDotColor(index)}`}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ 
              delay: index * 0.1,
              type: "spring",
              damping: 15,
              stiffness: 300
            }}
            whileHover={{ 
              scale: onStepClick ? 1.5 : 1.2,
              transition: { duration: 0.2 }
            }}
            whileTap={onStepClick ? { scale: 0.9 } : {}}
            onClick={() => handleDotClick(index)}
          >
            {/* 현재 단계 펄스 효과 */}
            {index === currentStep && !error && (
              <motion.div
                className="absolute inset-0 rounded-full bg-blue-400"
                animate={{ 
                  scale: [1, 1.5, 1],
                  opacity: [0.8, 0.2, 0.8]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            )}

            {/* 완료 체크 표시 */}
            {index < currentStep && (
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <div className="w-1 h-1 bg-white rounded-full" />
              </motion.div>
            )}
          </motion.div>

          {/* 라벨 (옵션) */}
          {showLabels && (
            <motion.span
              className={`text-xs mt-1 ${
                index === currentStep 
                  ? error ? 'text-red-400' : 'text-blue-400'
                  : index < currentStep 
                    ? 'text-green-400'
                    : 'text-gray-500'
              }`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.1 + 0.3 }}
            >
              {index + 1}
            </motion.span>
          )}

          {/* 연결선 (마지막 점 제외) */}
          {orientation === 'horizontal' && index < totalSteps - 1 && (
            <motion.div
              className={`absolute top-1/2 left-full w-2 h-px -translate-y-1/2 ${
                index < currentStep ? 'bg-green-400/50' : 'bg-gray-600/50'
              }`}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: index * 0.1 + 0.2 }}
            />
          )}

          {orientation === 'vertical' && index < totalSteps - 1 && (
            <motion.div
              className={`absolute top-full left-1/2 w-px h-2 -translate-x-1/2 ${
                index < currentStep ? 'bg-green-400/50' : 'bg-gray-600/50'
              }`}
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ delay: index * 0.1 + 0.2 }}
            />
          )}
        </div>
      ))}
    </div>
  );
};

export default StepDots; 