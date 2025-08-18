/**
 * 📊 PerformanceDashboard Metrics Cards
 *
 * Extracted metrics summary cards:
 * - Performance score card
 * - Total requests card
 * - Average response time card
 * - Success rate card
 * - Fallback rate card
 */

import { motion } from 'framer-motion';
import { BarChart3, CheckCircle, Clock, Target, Zap } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import type { PerformanceData } from './PerformanceDashboard.types';

interface PerformanceDashboardMetricsProps {
  data: PerformanceData;
  performanceScore: number;
}

export function PerformanceDashboardMetrics({
  data,
  performanceScore,
}: PerformanceDashboardMetricsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5"
    >
      {/* 성능 점수 */}
      <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-100">성능 점수</p>
              <p className="text-3xl font-bold">{performanceScore}</p>
              <p className="text-xs text-blue-100">/ 100</p>
            </div>
            <Target className="h-8 w-8 text-blue-200" />
          </div>
        </CardContent>
      </Card>

      {/* 총 요청 수 */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">총 요청</p>
              <p className="text-2xl font-bold text-gray-900">
                {data.stats.totalRequests.toLocaleString()}
              </p>
            </div>
            <BarChart3 className="h-6 w-6 text-blue-500" />
          </div>
        </CardContent>
      </Card>

      {/* 평균 응답시간 */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">평균 응답시간</p>
              <p className="text-2xl font-bold text-gray-900">
                {Math.round(data.stats.averageResponseTime)}ms
              </p>
            </div>
            <Clock className="h-6 w-6 text-orange-500" />
          </div>
        </CardContent>
      </Card>

      {/* 성공률 */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">성공률</p>
              <p className="text-2xl font-bold text-green-600">
                {(data.stats.successRate * 100).toFixed(1)}%
              </p>
            </div>
            <CheckCircle className="h-6 w-6 text-green-500" />
          </div>
        </CardContent>
      </Card>

      {/* 폴백률 */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">폴백률</p>
              <p className="text-2xl font-bold text-yellow-600">
                {(data.stats.fallbackRate * 100).toFixed(1)}%
              </p>
            </div>
            <Zap className="h-6 w-6 text-yellow-500" />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
