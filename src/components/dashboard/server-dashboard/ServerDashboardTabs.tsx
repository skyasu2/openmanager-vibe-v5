'use client';

// React import C81cAc70 - Next.js 15 C790B3d9 JSX Transform C0acC6a9
import { BarChart3, Database, Monitor, Network } from 'lucide-react';
import type { DashboardTab } from '../../../hooks/useServerDashboard';

interface ServerDashboardTabsProps {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  serverStats: {
    total: number;
    online: number;
    warning: number;
    offline: number;
  };
}

export function ServerDashboardTabs({
  activeTab,
  onTabChange,
  serverStats,
}: ServerDashboardTabsProps) {
  const tabs = [
    {
      id: 'servers' as const,
      label: '서버',
      icon: Monitor,
      count: serverStats.total,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
    },
    {
      id: 'network' as const,
      label: '네트워크',
      icon: Network,
      count: 0,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
    },
    {
      id: 'clusters' as const,
      label: '클러스터',
      icon: Database,
      count: 0,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
    },
    {
      id: 'applications' as const,
      label: '애플리케이션',
      icon: BarChart3,
      count: 0,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
    },
  ];

  return (
    <div className="flex space-x-1 rounded-lg bg-gray-100 p-1">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            type="button"
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center space-x-2 rounded-md px-4 py-2 text-sm font-medium transition-all duration-200 ${
              isActive
                ? `bg-white ${tab.color} border shadow-xs ${tab.borderColor}`
                : 'text-gray-600 hover:bg-white/50 hover:text-gray-900'
            }`}
          >
            <Icon size={16} />
            <span>{tab.label}</span>
            {tab.count > 0 && (
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${
                  isActive
                    ? `${tab.bgColor} ${tab.color}`
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
