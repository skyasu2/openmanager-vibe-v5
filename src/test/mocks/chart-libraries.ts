/**
 * 📊 Chart Libraries Mock
 * Mock implementations for Chart.js, React-Chartjs-2, Recharts, and D3.js
 */

import { createElement, type ReactNode } from 'react';
import { vi } from 'vitest';

// ===============================
// 📊 Chart.js Core Mock
// ===============================
vi.mock('chart.js/auto', () => ({
  Chart: vi.fn().mockImplementation(() => ({
    update: vi.fn(),
    destroy: vi.fn(),
    resize: vi.fn(),
    render: vi.fn(),
    canvas: {
      getContext: vi.fn(() => ({
        clearRect: vi.fn(),
        fillRect: vi.fn(),
        drawImage: vi.fn(),
      })),
    },
    data: { datasets: [], labels: [] },
    options: {},
  })),
}));

// ===============================
// 📊 React-Chartjs-2 Mock
// ===============================
vi.mock('react-chartjs-2', () => ({
  Chart: ({ children }: { children?: ReactNode }) => {
    return createElement(
      'div',
      { 'data-testid': 'mock-chart' },
      children
    );
  },
  Bar: ({ data, options }: { data?: unknown; options?: unknown }) => {
    return createElement(
      'div',
      { 'data-testid': 'mock-bar-chart' },
      'Bar Chart Mock'
    );
  },
  Line: ({ data, options }: { data?: unknown; options?: unknown }) => {
    return createElement(
      'div',
      { 'data-testid': 'mock-line-chart' },
      'Line Chart Mock'
    );
  },
  Pie: ({ data, options }: { data?: unknown; options?: unknown }) => {
    return createElement(
      'div',
      { 'data-testid': 'mock-pie-chart' },
      'Pie Chart Mock'
    );
  },
  Doughnut: ({ data, options }: { data?: unknown; options?: unknown }) => {
    return createElement(
      'div',
      { 'data-testid': 'mock-doughnut-chart' },
      'Doughnut Chart Mock'
    );
  },
  Radar: ({ data, options }: { data?: unknown; options?: unknown }) => {
    return createElement(
      'div',
      { 'data-testid': 'mock-radar-chart' },
      'Radar Chart Mock'
    );
  },
  PolarArea: ({ data, options }: { data?: unknown; options?: unknown }) => {
    return createElement(
      'div',
      { 'data-testid': 'mock-polar-area-chart' },
      'Polar Area Chart Mock'
    );
  },
  Bubble: ({ data, options }: { data?: unknown; options?: unknown }) => {
    return createElement(
      'div',
      { 'data-testid': 'mock-bubble-chart' },
      'Bubble Chart Mock'
    );
  },
  Scatter: ({ data, options }: { data?: unknown; options?: unknown }) => {
    return createElement(
      'div',
      { 'data-testid': 'mock-scatter-chart' },
      'Scatter Chart Mock'
    );
  },
}));

// ===============================
// 📈 Recharts Mock
// ===============================
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: ReactNode }) => {
    return createElement(
      'div',
      { 'data-testid': 'mock-responsive-container' },
      children
    );
  },
  LineChart: ({
    children,
    data,
  }: {
    children: ReactNode;
    data?: unknown;
  }) => {
    return createElement(
      'div',
      { 'data-testid': 'mock-line-chart' },
      children
    );
  },
  BarChart: ({
    children,
    data,
  }: {
    children: ReactNode;
    data?: unknown;
  }) => {
    return createElement(
      'div',
      { 'data-testid': 'mock-bar-chart' },
      children
    );
  },
  AreaChart: ({
    children,
    data,
  }: {
    children: ReactNode;
    data?: unknown;
  }) => {
    return createElement(
      'div',
      { 'data-testid': 'mock-area-chart' },
      children
    );
  },
  PieChart: ({
    children,
    data,
  }: {
    children: ReactNode;
    data?: unknown;
  }) => {
    return createElement(
      'div',
      { 'data-testid': 'mock-pie-chart' },
      children
    );
  },
  RadarChart: ({
    children,
    data,
  }: {
    children: ReactNode;
    data?: unknown;
  }) => {
    return createElement(
      'div',
      { 'data-testid': 'mock-radar-chart' },
      children
    );
  },
  ScatterChart: ({
    children,
    data,
  }: {
    children: ReactNode;
    data?: unknown;
  }) => {
    return createElement(
      'div',
      { 'data-testid': 'mock-scatter-chart' },
      children
    );
  },

  // Chart components
  XAxis: ({ dataKey }: { dataKey?: string }) => {
    return createElement('div', { 'data-testid': 'mock-x-axis' });
  },
  YAxis: ({ dataKey }: { dataKey?: string }) => {
    return createElement('div', { 'data-testid': 'mock-y-axis' });
  },
  CartesianGrid: () => {
    return createElement('div', { 'data-testid': 'mock-cartesian-grid' });
  },
  Tooltip: () => {
    return createElement('div', { 'data-testid': 'mock-tooltip' });
  },
  Legend: () => {
    return createElement('div', { 'data-testid': 'mock-legend' });
  },

  // Data components
  Line: ({ dataKey, stroke }: { dataKey: string; stroke?: string }) => {
    return createElement('div', { 'data-testid': 'mock-line' });
  },
  Bar: ({ dataKey, fill }: { dataKey: string; fill?: string }) => {
    return createElement('div', { 'data-testid': 'mock-bar' });
  },
  Area: ({ dataKey, fill }: { dataKey: string; fill?: string }) => {
    return createElement('div', { 'data-testid': 'mock-area' });
  },
  Cell: ({ fill }: { fill?: string }) => {
    return createElement('div', { 'data-testid': 'mock-cell' });
  },

  // Reference components
  ReferenceLine: ({
    x,
    y,
    stroke,
  }: {
    x?: number;
    y?: number;
    stroke?: string;
  }) => {
    return createElement('div', { 'data-testid': 'mock-reference-line' });
  },
  ReferenceDot: ({ x, y, fill }: { x?: number; y?: number; fill?: string }) => {
    return createElement('div', { 'data-testid': 'mock-reference-dot' });
  },
  ReferenceArea: ({
    x1,
    x2,
    y1,
    y2,
    fill,
  }: {
    x1?: number;
    x2?: number;
    y1?: number;
    y2?: number;
    fill?: string;
  }) => {
    return createElement('div', { 'data-testid': 'mock-reference-area' });
  },

  // Brush component
  Brush: ({ dataKey }: { dataKey?: string }) => {
    return createElement('div', { 'data-testid': 'mock-brush' });
  },

  // Error bar component
  ErrorBar: ({ dataKey }: { dataKey?: string }) => {
    return createElement('div', { 'data-testid': 'mock-error-bar' });
  },
}));

// ===============================
// 🎯 D3.js Mock (if used)
// ===============================
vi.mock('d3', () => ({
  select: vi.fn(() => ({
    append: vi.fn().mockReturnThis(),
    attr: vi.fn().mockReturnThis(),
    style: vi.fn().mockReturnThis(),
    text: vi.fn().mockReturnThis(),
    selectAll: vi.fn().mockReturnThis(),
    data: vi.fn().mockReturnThis(),
    enter: vi.fn().mockReturnThis(),
    exit: vi.fn().mockReturnThis(),
    remove: vi.fn().mockReturnThis(),
    transition: vi.fn().mockReturnThis(),
    duration: vi.fn().mockReturnThis(),
    ease: vi.fn().mockReturnThis(),
    on: vi.fn().mockReturnThis(),
  })),
  scaleLinear: vi.fn(() => ({
    domain: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
  })),
  scaleBand: vi.fn(() => ({
    domain: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    bandwidth: vi.fn(() => 20),
  })),
  axisBottom: vi.fn(() => vi.fn()),
  axisLeft: vi.fn(() => vi.fn()),
  line: vi.fn(() => vi.fn()),
  area: vi.fn(() => vi.fn()),
  pie: vi.fn(() => vi.fn()),
  arc: vi.fn(() => vi.fn()),
  max: vi.fn((data, accessor) => Math.max(...data.map(accessor))),
  min: vi.fn((data, accessor) => Math.min(...data.map(accessor))),
  extent: vi.fn((data, accessor) => [
    Math.min(...data.map(accessor)),
    Math.max(...data.map(accessor)),
  ]),
}));

export {};
