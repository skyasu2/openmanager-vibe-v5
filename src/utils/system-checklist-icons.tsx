/**
 * 🎨 System Checklist 아이콘 유틸리티
 * SystemChecklist 컴포넌트에서 분리된 아이콘 관련 함수들
 */

import type React from 'react';
import type {
  ComponentStatus,
  SystemComponent,
} from '@/hooks/useSystemChecklist';

// 컴포넌트 아이콘 매핑 (텍스트 대신 시각적 아이콘)
export const getComponentIcon = (name: string): string => {
  switch (name) {
    case 'API 서버 연결':
      return '🌐';
    case '메트릭 데이터베이스':
      return '📊';
    case 'AI 분석 엔진':
      return '🧠';
    case 'Prometheus 허브':
      return '📈';
    case '서버 생성기':
      return '🖥️';
    case '캐시 시스템':
      return '⚡';
    case '보안 검증':
      return '🔒';
    case 'UI 컴포넌트':
      return '🎨';
    default:
      return '⚙️';
  }
};

// 상태별 아이콘
export const getStatusIcon = (status: ComponentStatus): React.ReactElement => {
  if (status.status === 'loading') {
    return (
      <div className="h-4 w-4 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />
    );
  }

  switch (status.status) {
    case 'completed':
      return (
        <div className="flex h-4 w-4 items-center justify-center rounded-full bg-green-500">
          <svg
            className="h-3 w-3 text-white"
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
      );
    case 'failed':
      return (
        <div className="flex h-4 w-4 items-center justify-center rounded-full bg-red-500">
          <svg
            className="h-3 w-3 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>
      );
    case 'pending':
      return <div className="h-4 w-4 rounded-full bg-gray-600 opacity-50" />;
    default:
      return <div className="h-4 w-4 rounded-full bg-gray-600 opacity-50" />;
  }
};

// 우선순위별 테두리 색상
export const getPriorityBorder = (
  priority: SystemComponent['priority']
): string => {
  switch (priority) {
    case 'critical':
      return 'border-red-500/50';
    case 'high':
      return 'border-orange-500/50';
    case 'medium':
      return 'border-yellow-500/50';
    case 'low':
      return 'border-gray-500/50';
    default:
      return '';
  }
};
