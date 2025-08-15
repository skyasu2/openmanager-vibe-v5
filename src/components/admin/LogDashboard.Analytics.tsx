'use client';
/**
 * 📊 LogDashboard Analytics Tab
 * 
 * Analytics and visualization components:
 * - Log level distribution pie chart
 * - Category breakdown bar chart
 * - Time-based trend analysis
 * - Performance metrics visualization
 */

import { BarChart3, PieChart as PieChartIcon, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import {
  BarChart,
  PieChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Bar,
  Pie,
  Cell,
  CustomTooltip,
} from './LogDashboard.charts';
import type { LogData } from './LogDashboard.types';
import { LEVEL_COLORS, CATEGORY_COLORS } from './LogDashboard.types';
import type { ChartDataPoint } from "@/types/core-types";

interface AnalyticsTabProps {
  data: LogData;
}

export function LogDashboardAnalytics({ data }: AnalyticsTabProps) {
  if (!data.stats) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            <PieChartIcon className="mx-auto mb-2 h-12 w-12 text-gray-300" />
            <p>통계 데이터가 없습니다.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 레벨별 분포 데이터 준비
  const levelData: ChartDataPoint[] = Object.entries(data.stats.levelBreakdown)
    .filter(([, count]) => count > 0)
    .map(([level, count]) => ({
      name: level.toUpperCase(),
      value: count,
      color: LEVEL_COLORS[level as keyof typeof LEVEL_COLORS],
    }));

  // 카테고리별 분포 데이터 준비
  const categoryData: ChartDataPoint[] = Object.entries(data.stats.categoryBreakdown)
    .filter(([, count]) => count > 0)
    .map(([category, count]) => ({
      name: category,
      value: count,
      color: CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS],
    }));

  // 시간대별 트렌드 데이터 (샘플 데이터 - 실제 구현에서는 API에서 가져와야 함)
  const trendData = [
    { time: '00:00', logs: 45, errors: 2 },
    { time: '04:00', logs: 23, errors: 1 },
    { time: '08:00', logs: 156, errors: 8 },
    { time: '12:00', logs: 234, errors: 12 },
    { time: '16:00', logs: 189, errors: 7 },
    { time: '20:00', logs: 167, errors: 5 },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* 레벨별 분포 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-blue-600" />
              로그 레벨 분포
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={levelData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {levelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* 카테고리별 분포 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-green-600" />
              카테고리별 로그 수
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    fontSize={12}
                  />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" fill="#8884d8">
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 시간대별 트렌드 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-purple-600" />
            시간대별 로그 트렌드
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="logs" fill="#3B82F6" name="총 로그" />
                <Bar dataKey="errors" fill="#EF4444" name="에러" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* 최근 에러 목록 */}
      {data.stats.recentErrors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-red-600">⚠️</span>
              최근 에러 ({data.stats.recentErrors.length}개)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.stats.recentErrors.slice(0, 5).map((error) => (
                <div
                  key={error.id}
                  className="rounded-lg border border-red-200 bg-red-50 p-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-red-800">
                        {error.source}
                      </p>
                      <p className="mt-1 text-sm text-red-700">
                        {error.message}
                      </p>
                      <p className="mt-1 text-xs text-red-600">
                        {new Date(error.timestamp).toLocaleString('ko-KR')}
                      </p>
                    </div>
                    <span className="ml-2 rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800">
                      {error.level.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}