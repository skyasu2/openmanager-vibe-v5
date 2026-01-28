/**
 * 시스템 상태 배지 Props
 */
interface SystemStatusBadgeProps {
  /** 시스템 활성 상태 */
  isActive: boolean;
  /** 포맷된 남은 시간 문자열 */
  remainingTimeFormatted?: string;
  /** 남은 시간 (밀리초) */
  remainingTime?: number;
}

/**
 * 시스템 상태 배지 컴포넌트 (Server Component)
 *
 * @description
 * - 시스템 자동 종료 타이머 표시
 * - 5분 이하 시 경고 표시
 * - 시스템 종료됨 상태 표시
 * - 복잡한 조건 로직 캡슐화
 *
 * @example
 * ```tsx
 * <SystemStatusBadge
 *   isActive={true}
 *   remainingTimeFormatted="15:30"
 *   remainingTime={930000}
 * />
 * ```
 */
export function SystemStatusBadge({
  isActive,
  remainingTimeFormatted,
  remainingTime,
}: SystemStatusBadgeProps) {
  // 시스템 활성 상태이고 남은 시간이 있는 경우
  if (isActive && remainingTimeFormatted) {
    const isWarning = remainingTime && remainingTime < 5 * 60 * 1000;

    return (
      <div className="flex items-center gap-2 rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-1">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 animate-pulse rounded-full bg-yellow-400" />
          <span className="text-sm font-medium text-yellow-800">
            시스템 자동 종료: {remainingTimeFormatted}
          </span>
        </div>
        {isWarning && (
          <span className="animate-pulse text-xs font-semibold text-red-600">
            ⚠️ 곧 종료됨
          </span>
        )}
      </div>
    );
  }

  // 시스템 종료됨
  if (!isActive) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-gray-300 bg-gray-100 px-3 py-1">
        <div className="h-2 w-2 rounded-full bg-gray-400" />
        <span className="text-sm font-medium text-gray-600">시스템 종료됨</span>
      </div>
    );
  }

  // 상태 없음 (표시하지 않음)
  return null;
}
