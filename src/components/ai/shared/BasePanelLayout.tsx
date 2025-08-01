/**
 * 🏗️ 베이스 패널 레이아웃 컴포넌트
 *
 * - 모든 AI 패널의 공통 레이아웃
 * - 헤더, 필터, 콘텐츠 영역 표준화
 * - 로딩 상태 및 새로고침 버튼 통합
 */

'use client';

import type { ReactNode } from 'react';
import React from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface FilterItem {
  id: string;
  label: string;
  icon: string;
}

interface BasePanelLayoutProps {
  // 헤더 정보
  title: string;
  subtitle: string;
  icon: ReactNode;
  iconGradient: string;

  // 액션 버튼들
  onRefresh?: () => void;
  isLoading?: boolean;
  adminPath?: string;
  adminLabel?: string;

  // 필터 관련
  filters?: FilterItem[];
  selectedFilter?: string;
  onFilterChange?: (filterId: string) => void;
  showFilters?: boolean;

  // 콘텐츠
  children: ReactNode;

  // 하단 정보
  bottomInfo?: {
    primary: string;
    secondary: string;
  };

  className?: string;
}

const BasePanelLayout: React.FC<BasePanelLayoutProps> = ({
  title,
  subtitle,
  icon,
  iconGradient,
  onRefresh,
  isLoading = false,
  adminPath,
  adminLabel = '관리',
  filters = [],
  selectedFilter,
  onFilterChange,
  showFilters = true,
  children,
  bottomInfo,
  className = '',
}) => {
  return (
    <div className={`flex h-full flex-col bg-gray-900/50 ${className}`}>
      {/* 헤더 */}
      <div className="border-b border-gray-700/50 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`h-8 w-8 rounded-lg ${iconGradient} flex items-center justify-center`}
            >
              {icon}
            </div>
            <div>
              <h3 className="font-medium text-white">{title}</h3>
              <p className="text-sm text-gray-400">{subtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* 새로고침 버튼 */}
            {onRefresh && (
              <motion.button
                onClick={onRefresh}
                disabled={isLoading}
                className="rounded-lg border border-gray-600/30 bg-gray-700/50 p-2 text-gray-300 transition-colors hover:bg-gray-600/70 disabled:opacity-50"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <RefreshCw
                  className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
                />
              </motion.button>
            )}

            {/* 관리 페이지 링크 */}
            {adminPath && (
              <Link href={adminPath} target="_blank">
                <motion.button
                  className="flex items-center gap-1 rounded-lg border border-blue-500/30 bg-blue-500/20 px-2 py-1 text-xs text-blue-300 transition-colors hover:bg-blue-500/30"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <ExternalLink className="h-3 w-3" />
                  {adminLabel}
                </motion.button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* 필터 영역 */}
      {showFilters && filters.length > 0 && (
        <div className="border-b border-gray-700/30 p-4">
          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => (
              <motion.button
                key={filter.id}
                onClick={() => onFilterChange?.(filter.id)}
                className={`flex items-center gap-1 rounded-full border px-3 py-1 text-xs transition-all ${
                  selectedFilter === filter.id
                    ? 'border-blue-500/50 bg-blue-500/20 text-blue-300'
                    : 'border-gray-600/30 bg-gray-800/50 text-gray-400 hover:bg-gray-700/70'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span>{filter.icon}</span>
                {filter.label}
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* 메인 콘텐츠 */}
      <div className="flex-1 overflow-y-auto">{children}</div>

      {/* 하단 정보 */}
      {bottomInfo && (
        <div className="border-t border-gray-700/50 p-4">
          <div className="text-center">
            <p className="text-xs text-gray-400">{bottomInfo.primary}</p>
            <p className="mt-1 text-xs text-gray-500">{bottomInfo.secondary}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default BasePanelLayout;
