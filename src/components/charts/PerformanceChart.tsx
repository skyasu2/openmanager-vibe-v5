import { memo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { SafePieProps, ExtendedTooltipProps } from '@/types/CustomRechartsTypes';

interface ChartDataPoint {
  name: string;
  value: number;
  color: string;
}

interface PerformanceChartProps {
  data: ChartDataPoint[];
}

// 🎨 커스텀 툴팁 최적화
interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    name?: string;
    color?: string;
  }>;
}

const CustomTooltip = memo(({ active, payload }: TooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    if (!data) return null;
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
        <p className="font-semibold text-gray-800">{data.name}</p>
        <p style={{ color: data.color }} className="text-sm">
          사용률: {(data.value ?? 0).toFixed(1)}%
        </p>
      </div>
    );
  }
  return null;
});

CustomTooltip.displayName = 'CustomTooltip';

const PerformanceChart = memo<PerformanceChartProps>(({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-500">
        <div className="text-center">
          <div className="mx-auto mb-4 h-32 w-32 animate-pulse rounded-full bg-gray-200" />
          <p>성능 데이터 로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            {...({
              data: data,
              cx: "50%",
              cy: "50%",
              innerRadius: 40,
              outerRadius: 80,
              paddingAngle: 2,
              dataKey: "value"
            } as SafePieProps)}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip {...({ content: <CustomTooltip /> } as ExtendedTooltipProps)} />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value: string, entry: { color: string }) => (
              <span style={{ color: entry.color }}>{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
});

PerformanceChart.displayName = 'PerformanceChart';

export default PerformanceChart;
