/**
 * 🧠 Intelligent Monitoring Modal Component
 * IntelligentMonitoringPage에서 분리된 모달 컴포넌트
 */

'use client';

import { Monitor, X } from 'lucide-react';
import type { IntelligentMonitoringModalProps } from '@/types/intelligent-monitoring.types';
import IntelligentMonitoringPage from '../pages/IntelligentMonitoringPage';

export default function IntelligentMonitoringModal({
  isOpen,
  onClose,
}: IntelligentMonitoringModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="h-[90vh] w-full max-w-6xl overflow-hidden rounded-xl bg-white shadow-2xl">
        {/* 모달 헤더 */}
        <div className="flex items-center justify-between border-b border-gray-200 bg-linear-to-r from-emerald-50 to-teal-50 p-4">
          <div className="flex items-center space-x-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-r from-emerald-500 to-teal-500">
              <Monitor className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">이상감지/예측</h2>
              <p className="text-sm text-gray-600">
                AI Supervisor: 이상탐지 → 근본원인 → 예측모니터링
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 transition-colors hover:bg-gray-100"
            title="모달 닫기"
            aria-label="모달 닫기"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* 모달 내용 */}
        <div className="h-full overflow-auto p-4">
          <IntelligentMonitoringPage />
        </div>
      </div>
    </div>
  );
}
