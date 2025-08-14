/**
 * 📊 LogDashboard Chart Components
 * 
 * Direct imports for Recharts components (Next.js 15 supports SSR):
 * - Type-safe Recharts components
 * - Optimized for Next.js 15 SSR compatibility
 */

// Direct imports for all chart components (Next.js 15 지원)
export {
  BarChart,
  LineChart,
  PieChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Bar,
  Line,
  Cell,
  Pie,
} from 'recharts';

// Custom tooltip component for better styling
export interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    color: string;
    name: string;
    value: number | string;
  }>;
  label?: string;
}

export const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-2 shadow-lg">
        <p className="text-sm font-medium text-gray-900">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};