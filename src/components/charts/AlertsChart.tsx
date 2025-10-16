import { memo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Cell,
  Tooltip,
} from 'recharts';

interface ChartDataPoint {
  name: string;
  value: number;
  color: string;
}

interface AlertsChartProps {
  data: ChartDataPoint[];
}

// 🚨 알림 전용 툴팁
interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    payload: ChartDataPoint;
    color?: string;
  }>;
  label?: string;
}

const AlertsTooltip = memo(({ active, payload, label }: TooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    if (!data) return null;
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
        <p className="font-semibold text-gray-800">{label} 알림</p>
        <p style={{ color: data.color }} className="text-sm">
          개수: {data.value ?? 0}건
        </p>
      </div>
    );
  }
  return null;
});

AlertsTooltip.displayName = 'AlertsTooltip';

const AlertsChart = memo<AlertsChartProps>(({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-500">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <span className="text-2xl">✅</span>
          </div>
          <p className="font-medium text-green-600">알림이 없습니다</p>
          <p className="text-sm text-gray-500">
            모든 시스템이 정상 작동 중입니다
          </p>
        </div>
      </div>
    );
  }

  // 총 알림 수 계산
  const totalAlerts = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="space-y-4">
      {/* 알림 요약 */}
      <div className="text-center">
        <div className="text-2xl font-bold text-orange-600">{totalAlerts}</div>
        <div className="text-sm text-gray-600">총 알림 수</div>
      </div>

      {/* 차트 */}
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<AlertsTooltip />} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});

AlertsChart.displayName = 'AlertsChart';

export default AlertsChart;
