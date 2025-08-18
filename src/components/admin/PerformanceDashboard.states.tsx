/**
 * 📊 PerformanceDashboard State Components
 *
 * Extracted loading and error state components:
 * - Loading state with spinner
 * - Error state with retry button
 */

import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';

interface LoadingStateProps {}

export function LoadingState({}: LoadingStateProps) {
  return (
    <div className="space-y-6 p-6">
      <div className="flex h-64 items-center justify-center">
        <div className="flex items-center gap-2 text-blue-600">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span>성능 데이터 로딩 중...</span>
        </div>
      </div>
    </div>
  );
}

interface ErrorStateProps {
  error: string;
  handleManualRefresh: () => void;
}

export function ErrorState({ error, handleManualRefresh }: ErrorStateProps) {
  return (
    <div className="p-6">
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
        <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-red-500" />
        <h3 className="mb-2 text-lg font-semibold text-red-800">
          데이터 로드 실패
        </h3>
        <p className="mb-4 text-red-600">{error}</p>
        <Button onClick={handleManualRefresh} variant="destructive">
          <RefreshCw className="mr-2 h-4 w-4" />
          다시 시도
        </Button>
      </div>
    </div>
  );
}
