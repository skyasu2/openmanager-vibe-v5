import type { FC } from 'react';
/**
 * 📝 ProgressLabel Component
 *
 * SimulateProgressBar의 텍스트 정보를 담당하는 모듈화된 컴포넌트
 * - 단계 정보 표시
 * - 동적 설명 텍스트
 * - 애니메이션 전환
 */

// React import C81cAc70 - Next.js 15 C790B3d9 JSX Transform C0acC6a9
// framer-motion 제거 - CSS 애니메이션 사용
import { formatPercentage } from '@/lib/utils';

interface ProgressLabelProps {
  currentStep: number;
  totalSteps: number;
  stepDescription?: string;
  error?: string | null;
  progress?: number;
  format?: 'default' | 'percentage' | 'step-count' | 'custom';
  customTitle?: string;
  showProgress?: boolean;
}

const ProgressLabel: FC<ProgressLabelProps> = ({
  currentStep,
  totalSteps,
  stepDescription,
  error = null,
  progress,
  format = 'default',
  customTitle,
  showProgress = true,
}) => {
  // 상태별 텍스트 색상
  const getTextColor = () => {
    if (error) return 'text-red-400';
    if (currentStep >= totalSteps - 1) return 'text-green-400';
    return 'text-blue-400';
  };

  // 진행률 계산
  const calculatedProgress =
    progress ?? Math.round(((currentStep + 1) / totalSteps) * 100);
  const isComplete = currentStep >= totalSteps - 1 || calculatedProgress >= 100;

  // 제목 텍스트 생성
  const getTitleText = () => {
    if (customTitle) return customTitle;

    switch (format) {
      case 'percentage':
        return `진행률: ${formatPercentage(calculatedProgress)}`;
      case 'step-count':
        return `${currentStep + 1} / ${totalSteps} 단계`;
      case 'custom':
        return stepDescription || `단계 ${currentStep + 1}`;
      default:
        return `🔄 시뮬레이션 진행 중... (스텝 ${currentStep + 1} / ${totalSteps})`;
    }
  };

  // 설명 텍스트 생성
  const getDescriptionText = () => {
    if (error) return `❌ ${error}`;
    if (isComplete) return '✅ 시뮬레이션이 성공적으로 완료되었습니다';
    return stepDescription || `단계 ${currentStep + 1} 진행 중`;
  };

  return (
    <div className="flex-1">
      {/* 제목 */}
      <h3
        className="text-lg font-semibold text-white"
        key={`title-${currentStep}`}
      >
        {getTitleText()}
      </h3>

      {/* 설명 텍스트 */}
      <p
        key={stepDescription || currentStep}
        className={`text-sm ${getTextColor()} mt-1`}
      >
        {getDescriptionText()}
      </p>

      {/* 진행률 표시 (옵션) */}
      {showProgress && (
        <div className="mt-2 flex items-center space-x-2">
          <div className="h-1 flex-1 rounded-full bg-gray-700/30">
            <div
              className={`h-full rounded-full ${
                error
                  ? 'bg-red-400'
                  : isComplete
                    ? 'bg-green-400'
                    : 'bg-blue-400'
              }`}
            />
          </div>
          <span className={`text-xs font-medium ${getTextColor()}`}>
            {calculatedProgress}%
          </span>
        </div>
      )}
    </div>
  );
};

export default ProgressLabel;
