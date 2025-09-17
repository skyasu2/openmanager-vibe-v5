/**
 * 🎨 커스텀 툴팁 컴포넌트
 * AdminDashboardCharts에서 분리된 툴팁 컴포넌트
 */

import type { SafeTooltipProps } from '@/types/CustomRechartsTypes';

interface CustomTooltipProps extends SafeTooltipProps<number, string> {}

export default function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
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
            {entry.name !== 'Alerts' && '%'}
          </p>
        ))}
      </div>
    );
  }
  return null;
}