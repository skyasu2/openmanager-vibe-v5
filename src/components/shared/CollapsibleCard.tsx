'use client';

// React import 제거 - Next.js 15 자동 JSX Transform 사용
// framer-motion 제거 - CSS 애니메이션 사용
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CollapsibleCardProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
  children: ReactNode;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  variant?: 'default' | 'bordered' | 'elevated';
  size?: 'sm' | 'md' | 'lg';
}

export default function CollapsibleCard({
  title,
  subtitle,
  icon,
  isExpanded,
  onToggle,
  children,
  className,
  headerClassName,
  contentClassName,
  variant = 'default',
  size = 'md',
}: CollapsibleCardProps) {
  const baseClasses = {
    default: 'bg-white rounded-lg shadow-sm',
    bordered: 'bg-white rounded-lg border border-gray-200',
    elevated: 'bg-white rounded-lg shadow-md',
  };

  const sizeClasses = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  return (
    <div className={cn(baseClasses[variant], className)}>
      {/* 헤더 */}
      <div
        className={cn(
          'flex cursor-pointer select-none items-center justify-between',
          'rounded-lg transition-colors duration-200 hover:bg-gray-50',
          sizeClasses[size],
          headerClassName
        )}
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          {icon && <div className="flex-shrink-0">{icon}</div>}
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            {subtitle && (
              <p className="mt-0.5 text-sm text-gray-600">{subtitle}</p>
            )}
          </div>
        </div>

        {/* 토글 버튼 */}
        <div
          className="flex-shrink-0 rounded-full p-1 transition-colors hover:bg-gray-100"
        >
          <ChevronDown className="h-5 w-5 text-gray-500" />
        </div>
      </div>

      {/* 콘텐츠 */}
      {isExpanded && (
          <div
            className="overflow-hidden transition-all duration-300 ease-in-out"
          >
            <div
              className={cn(
                'mt-2 border-t border-gray-100 pt-4',
                contentClassName
              )}
            >
              {children}
            </div>
          </div>
        )}
    </div>
  );
}
