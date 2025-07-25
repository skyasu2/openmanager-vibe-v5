'use client';

import React from 'react';
import { Monitor, Network, Database, BarChart3 } from 'lucide-react';
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
    <div className='flex space-x-1 bg-gray-100 rounded-lg p-1'>
      {tabs.map(tab => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              isActive
                ? `bg-white ${tab.color} shadow-sm border ${tab.borderColor}`
                : 'text-gray-600 hover:text-gray-900 hover:bg-white hover:bg-opacity-50'
            }`}
          >
            <Icon size={16} />
            <span>{tab.label}</span>
            {tab.count > 0 && (
              <span
                className={`px-2 py-0.5 text-xs rounded-full ${
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
