/**
 * 🏗️ 베이스 패널 레이아웃 컴포넌트
 * 
 * - 모든 AI 패널의 공통 레이아웃
 * - 헤더, 필터, 콘텐츠 영역 표준화
 * - 로딩 상태 및 새로고침 버튼 통합
 */

'use client';

import React, { ReactNode } from 'react';
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
  className = ''
}) => {
  return (
    <div className={`flex flex-col h-full bg-gray-900/50 ${className}`}>
      {/* 헤더 */}
      <div className="p-4 border-b border-gray-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg ${iconGradient} flex items-center justify-center`}>
              {icon}
            </div>
            <div>
              <h3 className="text-white font-medium">{title}</h3>
              <p className="text-gray-400 text-sm">{subtitle}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* 새로고침 버튼 */}
            {onRefresh && (
              <motion.button
                onClick={onRefresh}
                disabled={isLoading}
                className="p-2 bg-gray-700/50 hover:bg-gray-600/70 border border-gray-600/30 
                           rounded-lg text-gray-300 transition-colors disabled:opacity-50"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </motion.button>
            )}
            
            {/* 관리 페이지 링크 */}
            {adminPath && (
              <Link href={adminPath} target="_blank">
                <motion.button
                  className="flex items-center gap-1 px-2 py-1 bg-blue-500/20 hover:bg-blue-500/30 
                             border border-blue-500/30 rounded-lg text-blue-300 text-xs transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <ExternalLink className="w-3 h-3" />
                  {adminLabel}
                </motion.button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* 필터 영역 */}
      {showFilters && filters.length > 0 && (
        <div className="p-4 border-b border-gray-700/30">
          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => (
              <motion.button
                key={filter.id}
                onClick={() => onFilterChange?.(filter.id)}
                className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs border transition-all ${
                  selectedFilter === filter.id
                    ? 'bg-blue-500/20 border-blue-500/50 text-blue-300'
                    : 'bg-gray-800/50 border-gray-600/30 text-gray-400 hover:bg-gray-700/70'
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
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>

      {/* 하단 정보 */}
      {bottomInfo && (
        <div className="p-4 border-t border-gray-700/50">
          <div className="text-center">
            <p className="text-gray-400 text-xs">
              {bottomInfo.primary}
            </p>
            <p className="text-gray-500 text-xs mt-1">
              {bottomInfo.secondary}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default BasePanelLayout; 