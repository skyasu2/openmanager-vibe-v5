import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import type {
  ComponentStatus,
  SystemComponent,
  WindowWithDebug,
} from '@/types/system-checklist';
import {
  getComponentIcon,
  getPriorityBorder,
  getStatusIcon,
} from '@/utils/system-checklist-icons';

export type ChecklistItemProps = {
  component: SystemComponent;
  status: ComponentStatus;
};

/**
 * 체크리스트 아이템 컴포넌트
 * 개별 시스템 컴포넌트의 상태를 표시
 */
export function ChecklistItem({ component, status }: ChecklistItemProps) {
  const isDiagnosticAvailable =
    status.status === 'failed' &&
    (process.env.NEXT_PUBLIC_NODE_ENV ||
      process.env.NODE_ENV === 'development');

  const handleCardActivate = () => {
    if (isDiagnosticAvailable) {
      (
        window as unknown as WindowWithDebug
      ).systemChecklistDebug?.analyzeComponent(component.id);
    }
  };

  const getBackgroundClass = () => {
    switch (status.status) {
      case 'completed':
        return 'bg-green-500/10';
      case 'failed':
        return 'bg-red-500/10';
      case 'loading':
        return 'bg-blue-500/10';
      default:
        return 'bg-gray-500/10';
    }
  };

  return (
    <button
      type="button"
      className={`w-full text-left flex items-center rounded-xl border p-3 backdrop-blur-sm ${getPriorityBorder(component.priority)} ${getBackgroundClass()} transition-all duration-300 ${isDiagnosticAvailable ? 'cursor-pointer hover:bg-red-500/20 active:scale-[0.98]' : 'opacity-60 cursor-default'}`}
      disabled={!isDiagnosticAvailable}
      onClick={handleCardActivate}
      onKeyDown={(event: ReactKeyboardEvent<HTMLButtonElement>) => {
        if (!isDiagnosticAvailable) return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          handleCardActivate();
        }
      }}
      title={
        status.status === 'failed'
          ? `클릭하여 에러 분석 (에러: ${status.error})`
          : component.description
      }
    >
      {/* 컴포넌트 아이콘 */}
      <span className="mr-3 text-2xl">{getComponentIcon(component.name)}</span>

      {/* 상태 정보 */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <span className="truncate text-sm font-medium text-white">
            {component.name}
          </span>
          {getStatusIcon(status)}
        </div>

        {/* 진행률 바 (로딩 중일 때만) */}
        {status.status === 'loading' && (
          <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-gray-600/30">
            <div
              className="h-full animate-pulse rounded-full bg-blue-400 transition-all duration-300"
              style={{
                width: status.progress ? `${status.progress}%` : '60%',
              }}
            />
          </div>
        )}

        {/* 에러 메시지 (실패 시) */}
        {status.status === 'failed' && status.error && (
          <div className="mt-1 truncate text-xs text-red-300">
            {status.error}
          </div>
        )}
      </div>
    </button>
  );
}
