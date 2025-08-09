/**
 * 📊 PerformanceDashboard Components
 * 
 * Reusable UI components for performance dashboard:
 * - Custom tooltip component
 * - Chart-specific UI elements
 * - Dashboard widgets
 */

import type { CustomTooltipProps } from './PerformanceDashboard.types';

/**
 * 🎨 커스텀 툴팁 컴포넌트
 * Recharts용 스타일링된 툴팁
 */
export function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
        <p className="font-semibold text-gray-800">{label}</p>
        {payload.map((entry, index: number) => (
          <p key={index} style={{ color: entry.color }} className="text-sm">
            {entry.name}:{' '}
            {typeof entry.value === 'number'
              ? entry.value.toFixed(1)
              : entry.value}
            {entry.name.includes('Rate') || entry.name.includes('confidence')
              ? '%'
              : ''}
          </p>
        ))}
      </div>
    );
  }
  return null;
}