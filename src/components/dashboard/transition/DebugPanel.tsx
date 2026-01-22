/**
 * 🛠️ Debug Panel Component
 *
 * SystemChecklist 디버그 패널 UI
 * - 진행률 및 성능 정보 표시
 * - 에러 히스토리
 * - 디버그 도구 안내
 *
 * @created 2026-01-10 (SystemChecklist에서 분리)
 */

'use client';

import type { DebugInfo, PerformanceInfo } from '@/types/system-checklist';

export interface DebugPanelProps {
  debugInfo: DebugInfo;
  totalProgress: number;
  completedCount: number;
  failedCount: number;
  loadingCount: number;
  onClose: () => void;
}

export function DebugPanel({
  debugInfo,
  totalProgress,
  completedCount,
  failedCount,
  loadingCount,
  onClose,
}: DebugPanelProps) {
  return (
    <div className="fixed right-4 top-4 z-50 max-w-md rounded-lg border border-cyan-500/50 bg-black/90 p-4 text-xs text-white backdrop-blur-lg">
      <div className="mb-3 flex items-center justify-between">
        <span className="font-semibold text-cyan-400">
          🛠️ 시스템 체크리스트 디버그
        </span>
        <button
          type="button"
          onClick={onClose}
          className="text-gray-400 hover:text-white"
        >
          ✕
        </button>
      </div>

      <div className="space-y-2 text-xs">
        <div className="grid grid-cols-2 gap-2">
          <div>진행률: {totalProgress}%</div>
          <div>완료: {completedCount}</div>
          <div>실패: {failedCount}</div>
          <div>로딩: {loadingCount}</div>
        </div>

        <PerformanceSection performance={debugInfo.performance} />

        {debugInfo.errors.length > 0 && (
          <ErrorsSection errors={debugInfo.errors} />
        )}

        <ToolsSection />
      </div>
    </div>
  );
}

function PerformanceSection({ performance }: { performance: PerformanceInfo }) {
  return (
    <div className="border-t border-gray-600 pt-2">
      <div className="mb-1 text-yellow-300">⚡ 성능:</div>
      <div>소요시간: {Math.round(performance.checklistDuration / 1000)}s</div>
      <div>평균 응답: {Math.round(performance.averageResponseTime)}ms</div>
    </div>
  );
}

function ErrorsSection({ errors }: { errors: DebugInfo['errors'] }) {
  return (
    <div className="border-t border-gray-600 pt-2">
      <div className="mb-1 text-red-300">🚨 에러 ({errors.length}):</div>
      {errors.slice(-2).map((error, idx) => (
        <div key={idx} className="text-xs text-red-200">
          {error.component}: {error.error.substring(0, 30)}...
        </div>
      ))}
    </div>
  );
}

function ToolsSection() {
  return (
    <div className="border-t border-gray-600 pt-2">
      <div className="mb-1 text-green-300">🔧 도구:</div>
      <div>• D: 패널 토글</div>
      <div>• R: 재시도</div>
      <div>• systemChecklistDebug.*</div>
    </div>
  );
}

export default DebugPanel;
