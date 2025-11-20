/**
 * 🔄 SimulateProgressBar Component v2.0
 *
 * 모듈화된 시스템 시뮬레이션 진행바 컴포넌트
 * - 하위 컴포넌트로 분리된 구조
 * - 성능 최적화 및 재사용성 향상
 * - 사용자 정의 가능한 UI 옵션
 * - Toast 알림 및 UX 개선
 */

import { Sparkles } from 'lucide-react';
import { Fragment, memo, useCallback, useEffect, type FC } from 'react';
import { useToast } from '@/hooks/use-toast'; //
import ProgressLabel from './ProgressLabel';
import StatusIcon from './StatusIcon';
import StepDots from './StepDots';

interface SimulateProgressBarProps {
  currentStep: number;
  totalSteps: number;
  progress?: number;
  isActive: boolean;
  stepDescription?: string;
  stepIcon?: string;
  showDetailed?: boolean;
  onComplete?: () => void;
  error?: string | null;
  variant?: 'default' | 'compact' | 'detailed';
  labelFormat?: 'default' | 'percentage' | 'step-count' | 'custom';
  showProgressNumber?: boolean;
  showStepDots?: boolean;
  showToastNotifications?: boolean;
  customTitle?: string;
  onStepChange?: (step: number, description: string) => void;
}

const SimulateProgressBar: FC<SimulateProgressBarProps> = memo(
  ({
    currentStep,
    totalSteps,
    progress,
    isActive,
    stepDescription,
    stepIcon: _stepIcon,
    showDetailed = true,
    onComplete,
    error = null,
    variant = 'default',
    labelFormat = 'default',
    showProgressNumber = true,
    showStepDots = true,
    showToastNotifications = true,
    customTitle,
    onStepChange,
  }) => {
    const { toast } = useToast();

    const calculatedProgress =
      progress ?? Math.round(((currentStep + 1) / totalSteps) * 100);
    const isComplete =
      currentStep >= totalSteps - 1 || calculatedProgress >= 100;

    const getProgressColor = () => {
      if (error) return 'from-red-500 to-red-600';
      if (isComplete) return 'from-green-500 to-emerald-600';
      if (calculatedProgress >= 75) return 'from-blue-500 to-purple-600';
      if (calculatedProgress >= 50) return 'from-blue-400 to-blue-600';
      if (calculatedProgress >= 25) return 'from-cyan-400 to-blue-500';
      return 'from-gray-400 to-gray-500';
    };

    const getTextColor = () => {
      if (error) return 'text-red-400';
      if (isComplete) return 'text-green-400';
      return 'text-blue-400';
    };

    const handleStepChange = useCallback(
      (step: number, description: string) => {
        if (showToastNotifications) {
          const stepNumber = step + 1;
          toast({
            title: `단계 ${stepNumber}`,
            description: `🔄 ${description}`,
          });
        }
        onStepChange?.(step, description);
      },
      [showToastNotifications, onStepChange, toast]
    );

    useEffect(() => {
      if (stepDescription) {
        handleStepChange(currentStep, stepDescription);
      }
    }, [currentStep, stepDescription, handleStepChange]);

    useEffect(() => {
      if (isComplete && onComplete && !error) {
        if (showToastNotifications) {
          toast({
            title: '성공',
            description: '🎉 시뮬레이션 완료! 시스템이 성공적으로 준비되었습니다.',
          });
        }
        const timer = setTimeout(onComplete, 1000);
        return () => clearTimeout(timer);
      }
      return undefined;
    }, [isComplete, onComplete, error, showToastNotifications, toast]);

    useEffect(() => {
      if (error && showToastNotifications) {
        toast({
          variant: 'destructive',
          title: '오류',
          description: `❌ 시뮬레이션 오류: ${error}`,
        });
      }
    }, [error, showToastNotifications, toast]);

    const getVariantClasses = () => {
      switch (variant) {
        case 'compact':
          return 'p-4 rounded-lg';
        case 'detailed':
          return 'p-8 rounded-xl';
        default:
          return 'p-6 rounded-xl';
      }
    };

    return (
      <div
        className={`border border-gray-700/50 bg-gradient-to-br from-gray-900/80 to-gray-800/80 shadow-xl backdrop-blur-lg ${getVariantClasses()}`}
      >
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <StatusIcon
              currentStep={currentStep}
              isActive={isActive}
              isComplete={isComplete}
              error={error}
              size={
                variant === 'compact'
                  ? 'sm'
                  : variant === 'detailed'
                    ? 'lg'
                    : 'md'
              }
            />
            <ProgressLabel
              currentStep={currentStep}
              totalSteps={totalSteps}
              stepDescription={stepDescription}
              error={error}
              progress={calculatedProgress}
              format={labelFormat}
              customTitle={customTitle}
              showProgress={variant !== 'compact'}
            />
          </div>
          {showProgressNumber && (
            <div className="text-right">
              <div className={`text-3xl font-bold ${getTextColor()}`}>
                {calculatedProgress}%
              </div>
              <div className="text-xs text-gray-400">
                {isComplete ? '완료' : error ? '오류' : '진행률'}
              </div>
            </div>
          )}
        </div>

        {variant !== 'compact' && (
          <div className="mb-4">
            <div className="h-4 w-full overflow-hidden rounded-full border border-gray-600/30 bg-gray-700/50 backdrop-blur-sm">
              <div
                style={{ width: `${calculatedProgress}%` }}
                className={`h-full bg-gradient-to-r ${getProgressColor()} relative overflow-hidden rounded-full transition-all duration-800 ease-out`}
              >
                {!error && (
                  <div
                    className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent ${isActive && !isComplete ? "animate-pulse" : ""}`}
                  />
                )}
                {isActive && !isComplete && !error && (
                  <div
                    className="absolute inset-0 bg-white/10"
                  />
                )}
              </div>
            </div>
            {showStepDots && showDetailed && (
              <div className="mt-3">
                <StepDots
                  currentStep={currentStep}
                  totalSteps={totalSteps}
                  error={error}
                  showLabels={variant === 'detailed'}
                  size={variant === 'detailed' ? 'lg' : 'md'}
                />
              </div>
            )}
          </div>
        )}

        {showDetailed && variant !== 'compact' && (
          <div className="flex justify-between text-xs text-gray-400">
            <span>시작</span>
            <span>
              {isComplete
                ? '완료됨'
                : error
                  ? '오류 발생'
                  : `${currentStep + 1}/${totalSteps} 단계`}
            </span>
            <span>완료</span>
          </div>
        )}

        <Fragment>
          {isComplete && !error && (
            <div className="mt-4 rounded-lg border border-green-500/20 bg-green-500/10 p-4">
              <div className="flex items-center space-x-3">
                <div>
                  <Sparkles className="h-5 w-5 text-green-400" aria-hidden="true" />
                </div>
                <div>
                  <div className="font-medium text-green-400">
                    시뮬레이션 완료!
                  </div>
                  <div className="text-sm text-green-300/80">
                    시스템이 성공적으로 준비되었습니다.
                  </div>
                </div>
              </div>
            </div>
          )}
        </Fragment>
      </div>
    );
  });

SimulateProgressBar.displayName = 'SimulateProgressBar';

export default SimulateProgressBar;