/**
 * 📊 PerformanceDashboard Footer Component
 * 
 * Extracted footer status information:
 * - Monitoring status
 * - Metrics count  
 * - Alerts count
 * - Last update timestamp
 */

import { motion } from 'framer-motion';
import type { PerformanceData } from './PerformanceDashboard.types';

interface PerformanceDashboardFooterProps {
  data: PerformanceData;
  lastUpdate: Date | null;
}

export function PerformanceDashboardFooter({
  data,
  lastUpdate,
}: PerformanceDashboardFooterProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
      className="flex items-center justify-between border-t border-gray-200 pt-4 text-sm text-gray-500"
    >
      <div className="flex items-center gap-4">
        <span>모니터링 상태: {data.status.enabled ? '활성' : '비활성'}</span>
        <span>메트릭 수: {data.status.metricsCount.toLocaleString()}</span>
        <span>알림 수: {data.status.alertsCount}</span>
      </div>

      {lastUpdate && (
        <span>마지막 업데이트: {lastUpdate.toLocaleTimeString('ko-KR')}</span>
      )}
    </motion.div>
  );
}