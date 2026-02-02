import type { FC } from 'react';
/**
 * 🎯 StatusIcon Component
 *
 * SimulateProgressBar의 상태 아이콘을 담당하는 모듈화된 컴포넌트
 * - 단계별 아이콘 표시
 * - 애니메이션 효과
 * - 상태별 색상 변화
 */

// React import C81cAc70 - Next.js 15 C790B3d9 JSX Transform C0acC6a9
// framer-motion 제거 - CSS 애니메이션 사용
import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  AlertCircle,
  BarChart3,
  Brain,
  CheckCircle,
  CheckSquare,
  Database,
  Globe,
  Loader2,
  RotateCcw,
  Search,
  Server,
  Shield,
  Sparkles,
  Zap,
} from 'lucide-react';

interface StatusIconProps {
  currentStep: number;
  isActive: boolean;
  isComplete: boolean;
  error?: string | null;
  customIcon?: LucideIcon;
  size?: 'sm' | 'md' | 'lg';
}

const StatusIcon: FC<StatusIconProps> = ({
  currentStep,
  isActive,
  isComplete,
  error = null,
  customIcon,
  size = 'md',
}) => {
  // 단계별 아이콘 매핑
  const getStepIconComponent = (step: number): LucideIcon => {
    const iconMap: LucideIcon[] = [
      Server, // 🚀 시스템 초기화
      Search, // 🔍 서버 스캔
      BarChart3, // 📊 메트릭 수집
      Database, // 🔧 데이터베이스
      Globe, // 🌐 네트워크
      Brain, // 🤖 AI 엔진
      Activity, // 📈 Prometheus
      RotateCcw, // 🔄 Timer
      Zap, // ⚡ 성능 최적화
      Shield, // 🛡️ 보안
      CheckSquare, // ✅ 검증
      Sparkles, // 🎉 완료
    ];

    return iconMap[step] || Loader2;
  };

  // 상태별 색상 클래스
  const getStatusClasses = () => {
    if (error)
      return {
        container: 'border-red-500 bg-red-500/10',
        icon: 'text-red-400',
      };
    if (isComplete)
      return {
        container: 'border-green-500 bg-green-500/10',
        icon: 'text-green-400',
      };
    return {
      container: 'border-blue-500 bg-blue-500/10',
      icon: 'text-blue-400',
    };
  };

  // 크기별 클래스
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return { container: 'w-8 h-8', icon: 'w-4 h-4' };
      case 'lg':
        return { container: 'w-16 h-16', icon: 'w-8 h-8' };
      default:
        return { container: 'w-12 h-12', icon: 'w-6 h-6' };
    }
  };

  const statusClasses = getStatusClasses();
  const sizeClasses = getSizeClasses();
  const IconComponent = customIcon || getStepIconComponent(currentStep);

  return (
    <div className="relative">
      {/* 메인 아이콘 컨테이너 */}
      <div
        className={`${sizeClasses.container} flex items-center justify-center rounded-xl border-2 ${statusClasses.container}`}
      >
        <div key={currentStep}>
          {error ? (
            <AlertCircle className={`${sizeClasses.icon} text-red-400`} />
          ) : isComplete ? (
            <CheckCircle className={`${sizeClasses.icon} text-green-400`} />
          ) : (
            <IconComponent
              className={`${sizeClasses.icon} ${statusClasses.icon} ${
                isActive && !isComplete ? 'animate-pulse' : ''
              }`}
            />
          )}
        </div>
      </div>

      {/* 회전 링 (로딩 중일 때) */}
      {isActive && !isComplete && !error && (
        <div className="absolute inset-0 rounded-xl border-2 border-blue-400/30 animate-spin" />
      )}
    </div>
  );
};

export default StatusIcon;
