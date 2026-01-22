/**
 * 🎛️ 통합 시스템 제어 패널
 *
 * ProcessManager를 통한 시스템 제어 UI:
 * - 시작/중지/재시작 버튼
 * - 실시간 상태 표시
 * - 프로세스별 모니터링
 * - 30분 안정성 표시
 */

'use client';

// framer-motion 제거 - CSS 애니메이션 사용
import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Play,
  RefreshCw,
  Shield,
  Square,
} from 'lucide-react';
import { useState } from 'react';

interface SystemOperation {
  success: boolean;
  message: string;
  errors?: string[];
  warnings?: string[];
}

export function SystemControlPanel() {
  const [isLoading, setIsLoading] = useState(false);
  const [operation, setOperation] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<
    Array<{ type: string; message: string; timestamp: Date }>
  >([]);
  const [isCollapsed, setIsCollapsed] = useState(true);

  // 시스템 제어 함수 (수동 액션만 유지)
  const executeSystemAction = async (
    action: string,
    options?: unknown
  ): Promise<SystemOperation> => {
    setIsLoading(true);
    setOperation(action);

    try {
      const response = await fetch('/api/system', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, options }),
      });

      const result = await response.json();

      if (result.success) {
        setAlerts((prev) => [
          ...prev,
          {
            type: 'success',
            message: result.message,
            timestamp: new Date(),
          },
        ]);
      } else {
        setAlerts((prev) => [
          ...prev,
          {
            type: 'error',
            message: result.message,
            timestamp: new Date(),
          },
        ]);
      }

      return result;
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : '알 수 없는 오류';
      setAlerts((prev) => [
        ...prev,
        {
          type: 'error',
          message: errorMsg,
          timestamp: new Date(),
        },
      ]);

      return {
        success: false,
        message: errorMsg,
      };
    } finally {
      setIsLoading(false);
      setOperation(null);

      // 🚫 자동 상태 업데이트 제거 - 수동 새로고침만 지원
      // setTimeout(fetchSystemStatus, 1000);
    }
  };

  // 시스템 시작 (수동 액션만 유지)
  const handleStart = () => {
    if (
      !confirm(
        '통합 프로세스 관리 시스템을 시작하시겠습니까?\n상태 모니터링은 Vercel 대시보드에서 확인하세요.'
      )
    ) {
      return;
    }

    void executeSystemAction('start', { mode: 'full' });
  };

  // 시스템 중지 (수동 액션만 유지)
  const handleStop = () => {
    if (
      !confirm(
        '시스템을 중지하시겠습니까?\n모든 프로세스가 안전하게 종료됩니다.'
      )
    ) {
      return;
    }

    void executeSystemAction('stop');
  };

  // 시스템 재시작 (수동 액션만 유지)
  const handleRestart = () => {
    if (
      !confirm(
        '시스템을 재시작하시겠습니까?\n잠시 서비스가 중단될 수 있습니다.'
      )
    ) {
      return;
    }

    void executeSystemAction('restart');
  };

  // 수동 새로고침 버튼 추가
  const handleManualRefresh = () => {
    window.open('https://vercel.com/dashboard', '_blank');
  };

  // 🎨 UI 렌더링 (Vercel 플랫폼 모니터링 안내 포함)
  return (
    <div className="rounded-lg border bg-white p-6 shadow-xs">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Shield className="h-6 w-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            시스템 제어 패널
          </h3>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handleManualRefresh}
            className="rounded-md bg-blue-50 px-3 py-1 text-sm text-blue-600 transition-colors hover:bg-blue-100"
          >
            📊 Vercel 대시보드 열기
          </button>

          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="rounded-md p-2 transition-colors hover:bg-gray-100"
          >
            {isCollapsed ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Vercel 플랫폼 모니터링 안내 */}
      <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-start space-x-3">
          <AlertCircle className="mt-0.5 h-5 w-5 text-blue-600" />
          <div>
            <h4 className="mb-1 font-medium text-blue-900">
              Vercel 플랫폼 모니터링 사용 권장
            </h4>
            <p className="mb-2 text-sm text-blue-800">
              주기적 헬스체크가 제거되었습니다. 실시간 모니터링은 Vercel
              대시보드를 사용하세요.
            </p>
            <div className="space-y-1 text-xs text-blue-700">
              <div>• 📊 실시간 상태: Vercel Dashboard &gt; Functions</div>
              <div>• 📈 성능 메트릭: Analytics 탭</div>
              <div>• 🚨 에러 로그: Functions &gt; Errors</div>
              <div>• 🔄 배포 상태: Deployments 탭</div>
            </div>
          </div>
        </div>
      </div>

      {!isCollapsed && (
        <div className="space-y-4">
          {/* 수동 제어 버튼들 */}
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={handleStart}
              disabled={isLoading}
              className="flex items-center justify-center space-x-2 rounded-lg bg-green-600 px-4 py-3 text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Play className="h-4 w-4" />
              <span className="text-sm font-medium">시작</span>
            </button>

            <button
              type="button"
              onClick={handleStop}
              disabled={isLoading}
              className="flex items-center justify-center space-x-2 rounded-lg bg-red-600 px-4 py-3 text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Square className="h-4 w-4" />
              <span className="text-sm font-medium">중지</span>
            </button>

            <button
              type="button"
              onClick={handleRestart}
              disabled={isLoading}
              className="flex items-center justify-center space-x-2 rounded-lg bg-orange-600 px-4 py-3 text-white transition-colors hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw className="h-4 w-4" />
              <span className="text-sm font-medium">재시작</span>
            </button>
          </div>

          {/* 로딩 상태 표시 */}
          {isLoading && (
            <div className="flex items-center justify-center space-x-2 py-4">
              <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
              <span className="text-sm text-gray-600">
                {operation} 작업 진행 중...
              </span>
            </div>
          )}

          {/* 알림 메시지 */}
          {alerts.length > 0 && (
            <div className="space-y-2">
              {alerts.slice(-3).map((alert, index) => (
                <div
                  key={index}
                  className={`rounded-lg p-3 text-sm ${
                    alert.type === 'success'
                      ? 'border border-green-200 bg-green-50 text-green-800'
                      : 'border border-red-200 bg-red-50 text-red-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{alert.message}</span>
                    <span className="text-xs opacity-75">
                      {alert.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
