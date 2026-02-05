/**
 * Lightweight stub for recharts
 * Prevents vitest from resolving D3.js transitive deps on WSL.
 * Loaded via resolve.alias in vitest.config.main.ts.
 */
const noop = () => null;
const Container = ({ children }: { children?: React.ReactNode }) => (
  <div>{children}</div>
);

export const Area = noop;
export const AreaChart = Container;
export const Bar = noop;
export const BarChart = Container;
export const CartesianGrid = noop;
export const Cell = noop;
export const Legend = noop;
export const Line = noop;
export const LineChart = Container;
export const Pie = noop;
export const PieChart = Container;
export const ResponsiveContainer = Container;
export const Tooltip = noop;
export const XAxis = noop;
export const YAxis = noop;
