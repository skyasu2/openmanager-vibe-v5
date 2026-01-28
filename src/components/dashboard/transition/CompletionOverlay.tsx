import type { KeyboardEvent as ReactKeyboardEvent } from 'react';

export type CompletionOverlayProps = {
  onProceed: () => void;
};

/**
 * 완료 상태 오버레이 컴포넌트
 * 시스템 초기화 완료 시 표시되는 오버레이
 */
export function CompletionOverlay({ onProceed }: CompletionOverlayProps) {
  const handleClick = () => {
    onProceed();
  };

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onProceed();
    }
  };

  return (
    <button
      type="button"
      className="absolute inset-0 flex items-center justify-center rounded-2xl border border-green-500/50 bg-green-500/20 backdrop-blur-sm duration-500 animate-in fade-in zoom-in"
      tabIndex={0}
      aria-label="체크리스트 완료 후 다음 단계로 이동"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500">
          <svg
            className="h-8 w-8 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h3 className="mb-2 text-xl font-bold text-white">
          시스템 초기화 완료
        </h3>
        <p className="mb-3 text-sm text-gray-300">다음 단계로 진행합니다...</p>
        <div className="inline-flex items-center space-x-2 rounded-lg border border-green-400/50 bg-green-500/30 px-4 py-2">
          <span className="text-sm text-green-200">클릭하여 계속</span>
          <svg
            className="h-4 w-4 text-green-200"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
        </div>
      </div>
    </button>
  );
}
