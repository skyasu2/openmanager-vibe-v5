import type { FC } from 'react';

/**
 * 🔘 StepDots Component
 *
 * SimulateProgressBar의 단계 표시점을 담당하는 모듈화된 컴포넌트
 * - 총 단계 수만큼 점 표시
 * - 현재 진행 상태 표시
 * - 호버 효과 및 애니메이션
 */

// React import C81cAc70 - Next.js 15 C790B3d9 JSX Transform C0acC6a9
// framer-motion 제거 - CSS 애니메이션 사용

interface StepDotsProps {
  currentStep: number;
  totalSteps: number;
  error?: string | null;
  showLabels?: boolean;
  orientation?: 'horizontal' | 'vertical';
  size?: 'sm' | 'md' | 'lg';
  onStepClick?: (step: number) => void;
}

const StepDots: FC<StepDotsProps> = ({
  currentStep,
  totalSteps,
  error = null,
  showLabels = false,
  orientation = 'horizontal',
  size = 'md',
  onStepClick,
}) => {
  // 크기별 클래스
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return { dot: 'w-1.5 h-1.5', spacing: 'gap-1' };
      case 'lg':
        return { dot: 'w-4 h-4', spacing: 'gap-3' };
      default:
        return { dot: 'w-2 h-2', spacing: 'gap-2' };
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
          <button
            type="button"
            disabled={!onStepClick || index > currentStep}
            aria-label={`단계 ${index + 1}`}
            aria-pressed={index === currentStep}
            className={`${sizeClasses.dot} relative rounded-full transition-all duration-300 ${getDotColor(index)} ${onStepClick && index <= currentStep ? 'cursor-pointer focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400' : 'cursor-default'}`}
            onClick={() => handleDotClick(index)}
          >
            {/* 현재 단계 펄스 효과 */}
            {index === currentStep && !error && (
              <div className="absolute inset-0 animate-ping rounded-full bg-blue-400 opacity-75" />
            )}

            {/* 완료 체크 표시 */}
            {index < currentStep && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-1 w-1 rounded-full bg-white" />
              </div>
            )}
          </button>

          {/* 라벨 (옵션) */}
          {showLabels && (
            <span
              className={`mt-1 text-xs ${
                index === currentStep
                  ? error
                    ? 'text-red-400'
                    : 'text-blue-400'
                  : index < currentStep
                    ? 'text-green-400'
                    : 'text-gray-500'
              }`}
            >
              {index + 1}
            </span>
          )}

          {/* 연결선 (마지막 점 제외) */}
          {orientation === 'horizontal' && index < totalSteps - 1 && (
            <div
              className={`absolute left-full top-1/2 h-px w-2 -translate-y-1/2 ${
                index < currentStep ? 'bg-green-400/50' : 'bg-gray-600/50'
              }`}
            />
          )}

          {orientation === 'vertical' && index < totalSteps - 1 && (
            <div
              className={`absolute left-1/2 top-full h-2 w-px -translate-x-1/2 ${
                index < currentStep ? 'bg-green-400/50' : 'bg-gray-600/50'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
};

export default StepDots;
