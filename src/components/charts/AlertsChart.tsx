import React, { memo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
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
const AlertsTooltip = memo(({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className='bg-white p-3 border border-gray-200 rounded-lg shadow-lg'>
        <p className='font-semibold text-gray-800'>{label} 알림</p>
        <p style={{ color: data.color }} className='text-sm'>
          개수: {data.value}건
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
      <div className='flex items-center justify-center h-64 text-gray-500'>
        <div className='text-center'>
          <div className='w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center'>
            <span className='text-2xl'>✅</span>
          </div>
          <p className='text-green-600 font-medium'>알림이 없습니다</p>
          <p className='text-sm text-gray-500'>
            모든 시스템이 정상 작동 중입니다
          </p>
        </div>
      </div>
    );
  }

  // 총 알림 수 계산
  const totalAlerts = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className='space-y-4'>
      {/* 알림 요약 */}
      <div className='text-center'>
        <div className='text-2xl font-bold text-orange-600'>{totalAlerts}</div>
        <div className='text-sm text-gray-600'>총 알림 수</div>
      </div>

      {/* 차트 */}
      <div className='h-48'>
        <ResponsiveContainer width='100%' height='100%'>
          <BarChart
            data={data}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray='3 3' stroke='#f0f0f0' />
            <XAxis
              dataKey='name'
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
            <Tooltip content={<AlertsTooltip />} />
            <Bar
              dataKey='value'
              radius={[4, 4, 0, 0]}
            >
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
