/**
 * 📊 LogDashboard Stats Cards
 *
 * Summary statistics cards for the log dashboard:
 * - Total logs count with formatting
 * - Error rate percentage display
 * - Recent errors count
 * - System status indicator
 */

import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, FileText, XCircle } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import type { LogData } from './LogDashboard.types';

interface StatsCardsProps {
  data: LogData;
}

export function LogDashboardStatsCards({ data }: StatsCardsProps) {
  if (!data.stats) {
    return null;
  }

  const cards = [
    {
      title: '총 로그',
      value: data.stats.totalLogs.toLocaleString(),
      icon: FileText,
      iconColor: 'text-blue-500',
      valueColor: 'text-gray-900',
    },
    {
      title: '에러율',
      value: `${(data.stats.errorRate * 100).toFixed(1)}%`,
      icon: AlertTriangle,
      iconColor: 'text-red-500',
      valueColor: 'text-red-600',
    },
    {
      title: '최근 에러',
      value: data.stats.recentErrors.length.toString(),
      icon: XCircle,
      iconColor: 'text-orange-500',
      valueColor: 'text-orange-600',
    },
    {
      title: '상태',
      value: data.status?.enabled ? '활성' : '비활성',
      icon: CheckCircle,
      iconColor: 'text-green-500',
      valueColor: data.status?.enabled ? 'text-green-600' : 'text-gray-500',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4"
    >
      {cards.map((card, index) => {
        const IconComponent = card.icon;

        return (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + index * 0.05 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{card.title}</p>
                    <p className={`text-2xl font-bold ${card.valueColor}`}>
                      {card.value}
                    </p>
                  </div>
                  <IconComponent className={`h-6 w-6 ${card.iconColor}`} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
