/**
 * 🚀 최소형 시스템 상태 표시 컴포넌트
 * 번들 크기 최적화를 위한 경량 버전
 */

'use client';

import { AlertTriangle, Check, X } from 'lucide-react';

interface SystemStatusMinimalProps {
  status?: 'healthy' | 'warning' | 'error';
  className?: string;
}

export const SystemStatusMinimal = ({
  status = 'healthy',
  className = '',
}: SystemStatusMinimalProps) => {
  const icons = {
    healthy: <Check className="h-4 w-4 text-green-500" />,
    warning: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
    error: <X className="h-4 w-4 text-red-500" />,
  };

  const labels = {
    healthy: '정상',
    warning: '주의',
    error: '오류',
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {icons[status]}
      <span className="text-sm text-gray-600">{labels[status]}</span>
    </div>
  );
};

export default SystemStatusMinimal;
