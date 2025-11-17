import { memo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';

interface ChartDataPoint {
  name: string;
  value: number;
  color: string;
}

interface AvailabilityChartProps {
  data: ChartDataPoint[];
}

// 🎨 가용성 전용 툴팁
interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    payload: ChartDataPoint;
    name?: string;
    color?: string;
  }>;
}

const AvailabilityTooltip = memo(({ active, payload }: TooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    if (!data) return null;
    
    const total = (payload[0]?.payload?.value ?? 0) + (payload[1]?.payload?.value ?? 0);
    const percentage =
      total > 0 ? ((data.value / total) * 100).toFixed(1) : '0.0';

    return (
      <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
        <p className="font-semibold text-gray-800">{data.name ?? '알 수 없음'}</p>
        <div className="space-y-1">
          <p style={{ color: data.color }} className="text-sm">
            서버 수: {data.value ?? 0}개
          </p>
          <p className="text-xs text-gray-600">비율: {percentage}%</p>
        </div>
      </div>
    );
  }
  return null;
});

AvailabilityTooltip.displayName = 'AvailabilityTooltip';

const AvailabilityChart = memo<AvailabilityChartProps>(({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-500">
        <div className="text-center">
          <div className="mx-auto mb-4 h-32 w-32 animate-pulse rounded-full bg-gray-200" />
          <p>가용성 데이터 로딩 중...</p>
        </div>
      </div>
    );
  }

  // 가용성 요약 정보
  const totalServers = data.reduce((sum, item) => sum + item.value, 0);
  const onlineServers = data.find((item) => item.name === '온라인')?.value || 0;
  const availabilityRate =
    totalServers > 0
      ? ((onlineServers / totalServers) * 100).toFixed(1)
      : '0.0';

  return (
    <div className="space-y-4">
      {/* 가용성 요약 */}
      <div className="text-center">
        <div className="text-3xl font-bold text-green-600">
          {availabilityRate}%
        </div>
        <div className="text-sm text-gray-600">전체 가용성</div>
      </div>

      {/* 차트 */}
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            {/* @ts-expect-error - Recharts 3.x PieProps 타입 정의 이슈 (children prop + data prop) */}
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={30}
              outerRadius={60}
              paddingAngle={1}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<AvailabilityTooltip />} />
            <Legend
              verticalAlign="bottom"
              height={24}
              formatter={(value: string, entry: any) => (
                <span style={{ color: entry.color }} className="text-sm">
                  {value}
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});

AvailabilityChart.displayName = 'AvailabilityChart';

export default AvailabilityChart;
