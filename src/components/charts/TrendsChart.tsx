import React, { memo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface TrendDataPoint {
  time: string;
  CPU: number;
  Memory: number;
  Alerts: number;
}

interface TrendsChartProps {
  data: TrendDataPoint[];
}

// 📈 트렌드 전용 툴팁
interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    name?: string;
    color?: string;
  }>;
  label?: string;
}

const TrendsTooltip = memo(({ active, payload, label }: TooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
        <p className="mb-2 font-semibold text-gray-800">{label}</p>
        <div className="space-y-1">
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {entry.value.toFixed(1)}
              {entry.name !== 'Alerts' ? '%' : '건'}
            </p>
          ))}
        </div>
      </div>
    );
  }
  return null;
});

TrendsTooltip.displayName = 'TrendsTooltip';

const TrendsChart = memo<TrendsChartProps>(({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-500">
        <div className="text-center">
          <div className="mb-4 h-32 w-full animate-pulse rounded-lg bg-gray-200" />
          <p>트렌드 데이터 로딩 중...</p>
        </div>
      </div>
    );
  }

  // 최신 값들 계산
  const latestData = data[data.length - 1];
  const avgCpu = data.reduce((sum, item) => sum + item.CPU, 0) / data.length;
  const avgMemory =
    data.reduce((sum, item) => sum + item.Memory, 0) / data.length;

  return (
    <div className="space-y-4">
      {/* 현재 상태 요약 */}
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <div className="text-lg font-semibold text-red-500">
            {latestData?.CPU.toFixed(1)}%
          </div>
          <div className="text-xs text-gray-600">현재 CPU</div>
        </div>
        <div>
          <div className="text-lg font-semibold text-yellow-500">
            {latestData?.Memory.toFixed(1)}%
          </div>
          <div className="text-xs text-gray-600">현재 메모리</div>
        </div>
        <div>
          <div className="text-lg font-semibold text-blue-500">
            {latestData?.Alerts}
          </div>
          <div className="text-xs text-gray-600">현재 알림</div>
        </div>
      </div>

      {/* 차트 */}
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 10 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
            <Tooltip content={<TrendsTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: '12px' }}
              formatter={(value) => <span className="text-xs">{value}</span>}
            />
            <Line
              type="monotone"
              dataKey="CPU"
              stroke="#ef4444"
              strokeWidth={2}
              dot={{ fill: '#ef4444', strokeWidth: 2, r: 3 }}
              activeDot={{ r: 5, fill: '#ef4444' }}
            />
            <Line
              type="monotone"
              dataKey="Memory"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={{ fill: '#f59e0b', strokeWidth: 2, r: 3 }}
              activeDot={{ r: 5, fill: '#f59e0b' }}
            />
            <Line
              type="monotone"
              dataKey="Alerts"
              stroke="#06b6d4"
              strokeWidth={2}
              dot={{ fill: '#06b6d4', strokeWidth: 2, r: 3 }}
              activeDot={{ r: 5, fill: '#06b6d4' }}
              yAxisId="right"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 평균값 표시 */}
      <div className="text-center text-xs text-gray-500">
        평균 CPU: {avgCpu.toFixed(1)}% | 평균 메모리: {avgMemory.toFixed(1)}%
      </div>
    </div>
  );
});

TrendsChart.displayName = 'TrendsChart';

export default TrendsChart;
