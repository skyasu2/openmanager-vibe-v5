/**
 * 📊 PerformanceDashboard Tab Components
 * 
 * Extracted tab content components:
 * - Overview tab
 * - Engines tab
 * - Trends tab
 * - Alerts tab
 */

import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  Brain,
  CheckCircle,
  Filter,
  Search,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { TabsContent } from '../ui/tabs';
import type { PerformanceData, PerformanceAlert } from './PerformanceDashboard.types';
import { COLORS, ENGINE_COLORS } from './PerformanceDashboard.constants';
import { CustomTooltip } from './PerformanceDashboard.components';
import {
  AreaChart,
  BarChart,
  LineChart,
  PieChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Area,
  Bar,
  Line,
  Cell,
  Pie,
} from './PerformanceDashboard.charts';

interface PerformanceDashboardTabsProps {
  modeData: any[];
  trendsData: any[];
  engineData: any[];
  filteredAlerts: PerformanceAlert[];
  filterEngine: string;
  setFilterEngine: (value: string) => void;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
}

export function PerformanceDashboardTabs({
  modeData,
  trendsData,
  engineData,
  filteredAlerts,
  filterEngine,
  setFilterEngine,
  searchQuery,
  setSearchQuery,
}: PerformanceDashboardTabsProps) {
  return (
    <>
      {/* 개요 탭 */}
      <TabsContent value="overview" className="space-y-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* 모드별 분포 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-600" />
                AI 모드 분포
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={modeData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {modeData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            Object.values(COLORS)[
                              index % Object.values(COLORS).length
                            ]
                          }
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* 시간별 요청 트렌드 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                시간별 요청 트렌드
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="requests"
                      stroke={COLORS.primary}
                      fill={COLORS.primary}
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      {/* 엔진 성능 탭 */}
      <TabsContent value="engines" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-600" />
              엔진별 성능 비교
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={engineData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    yAxisId="left"
                    dataKey="requests"
                    fill={COLORS.primary}
                    name="요청 수"
                  />
                  <Bar
                    yAxisId="left"
                    dataKey="responseTime"
                    fill={COLORS.warning}
                    name="응답시간(ms)"
                  />
                  <Bar
                    yAxisId="right"
                    dataKey="successRate"
                    fill={COLORS.success}
                    name="성공률(%)"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* 트렌드 탭 */}
      <TabsContent value="trends" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              성능 트렌드 분석
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="responseTime"
                    stroke={COLORS.warning}
                    strokeWidth={2}
                    name="응답시간(ms)"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="successRate"
                    stroke={COLORS.success}
                    strokeWidth={2}
                    name="성공률(%)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* 알림 탭 */}
      <TabsContent value="alerts" className="space-y-6">
        {/* 알림 필터 */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={filterEngine}
              onChange={(e) => setFilterEngine(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2"
            >
              <option value="all">모든 엔진</option>
              {Object.keys(ENGINE_COLORS).map((engine) => (
                <option key={engine} value={engine}>
                  {engine}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-1 items-center gap-2">
            <Search className="h-4 w-4 text-gray-500" />
            <input
              type="text"
              placeholder="알림 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2"
            />
          </div>
        </div>

        {/* 알림 목록 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              성능 알림 ({filteredAlerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 space-y-3 overflow-y-auto">
              <AnimatePresence>
                {filteredAlerts.map((alert, index) => (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.1 }}
                    className={`rounded-lg border-l-4 p-4 ${
                      alert.type === 'critical'
                        ? 'border-red-500 bg-red-50'
                        : 'border-yellow-500 bg-yellow-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="mb-1 flex items-center gap-2">
                          <Badge
                            variant={
                              alert.type === 'critical'
                                ? 'destructive'
                                : 'secondary'
                            }
                          >
                            {alert.type === 'critical'
                              ? 'CRITICAL'
                              : 'WARNING'}
                          </Badge>
                          <span className="text-sm font-medium text-gray-900">
                            {alert.engine}
                          </span>
                        </div>
                        <p className="mb-2 text-sm text-gray-700">
                          {alert.message}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>
                            {alert.metric}: {alert.value.toFixed(2)}
                            {alert.metric.includes('Rate')
                              ? '%'
                              : alert.metric.includes('Time')
                                ? 'ms'
                                : ''}
                          </span>
                          <span>
                            임계값: {alert.threshold}
                            {alert.metric.includes('Rate')
                              ? '%'
                              : alert.metric.includes('Time')
                                ? 'ms'
                                : ''}
                          </span>
                          <span>
                            {new Date(alert.timestamp).toLocaleString(
                              'ko-KR'
                            )}
                          </span>
                        </div>
                      </div>
                      <AlertTriangle
                        className={`h-5 w-5 ${
                          alert.type === 'critical'
                            ? 'text-red-500'
                            : 'text-yellow-500'
                        }`}
                      />
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {filteredAlerts.length === 0 && (
                <div className="py-8 text-center text-gray-500">
                  <CheckCircle className="mx-auto mb-2 h-12 w-12 text-green-500" />
                  <p>현재 활성 알림이 없습니다.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </>
  );
}