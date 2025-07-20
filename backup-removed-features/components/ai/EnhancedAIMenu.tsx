/**
 * 🎨 Enhanced AI Menu Component
 * 
 * 사용성 개선된 AI 사이드바 메뉴
 * - 지능형 툴팁 위치 조정
 * - 접근성 향상 (키보드 네비게이션)
 * - 반응형 최적화
 * - 사용 패턴 기반 재배치
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  FileText,
  TrendingUp,
  Settings,
  BarChart3,
  ScrollText,
  Brain,
  Zap,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Star,
} from 'lucide-react';

export type AIFunction = 
  | 'chat' | 'thinking' | 'prediction' | 'pattern-analysis' 
  | 'log-analysis' | 'optimization' | 'auto-report' | 'advanced-management';

interface AIMenuItem {
  id: AIFunction;
  icon: React.ComponentType<any>;
  label: string;
  description: string;
  shortcut?: string;
  color: string;
  bgColor: string;
  gradient: string;
  category: 'core' | 'analysis' | 'management';
  popularity: number; // 사용 빈도 (1-10)
  isNew?: boolean;
  isPro?: boolean;
}

const AI_MENU_ITEMS: AIMenuItem[] = [
  // 핵심 기능 (가장 많이 사용)
  {
    id: 'chat',
    icon: MessageSquare,
    label: 'AI 채팅',
    description: '자연어로 시스템을 제어하고 질의하세요',
    shortcut: 'Ctrl+K',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 hover:bg-blue-100',
    gradient: 'from-blue-500 to-cyan-500',
    category: 'core',
    popularity: 10,
  },
  {
    id: 'thinking',
    icon: Brain,
    label: 'AI 사고과정',
    description: '복잡한 문제 해결 과정을 시각화',
    shortcut: 'Ctrl+T',
    color: 'text-pink-600',
    bgColor: 'bg-pink-50 hover:bg-pink-100',
    gradient: 'from-pink-500 to-rose-500',
    category: 'core',
    popularity: 9,
    isNew: true,
  },
  {
    id: 'prediction',
    icon: TrendingUp,
    label: '예측 분석',
    description: '시스템 성능 및 장애를 미리 예측',
    shortcut: 'Ctrl+P',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 hover:bg-purple-100',
    gradient: 'from-purple-500 to-violet-500',
    category: 'analysis',
    popularity: 8,
  },
  
  // 분석 기능
  {
    id: 'pattern-analysis',
    icon: BarChart3,
    label: '패턴 분석',
    description: '시스템 패턴 및 이상 징후를 탐지',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 hover:bg-orange-100',
    gradient: 'from-orange-500 to-amber-500',
    category: 'analysis',
    popularity: 7,
  },
  {
    id: 'log-analysis',
    icon: ScrollText,
    label: '로그 분석',
    description: '실시간 로그 패턴 분석 및 요약',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50 hover:bg-indigo-100',
    gradient: 'from-indigo-500 to-blue-500',
    category: 'analysis',
    popularity: 6,
  },
  {
    id: 'optimization',
    icon: Zap,
    label: '성능 최적화',
    description: '시스템 성능 최적화 제안 및 실행',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50 hover:bg-yellow-100',
    gradient: 'from-yellow-500 to-orange-500',
    category: 'analysis',
    popularity: 5,
    isPro: true,
  },
  
  // 관리 기능
  {
    id: 'auto-report',
    icon: FileText,
    label: '자동 보고서',
    description: 'AI 기반 시스템 분석 보고서 생성',
    color: 'text-green-600',
    bgColor: 'bg-green-50 hover:bg-green-100',
    gradient: 'from-green-500 to-emerald-500',
    category: 'management',
    popularity: 4,
  },
  {
    id: 'advanced-management',
    icon: Settings,
    label: 'AI 엔진 관리',
    description: '통합 AI 시스템 고급 설정 및 관리',
    color: 'text-gray-600',
    bgColor: 'bg-gray-50 hover:bg-gray-100',
    gradient: 'from-gray-500 to-slate-500',
    category: 'management',
    popularity: 3,
  },
];

interface EnhancedAIMenuProps {
  selectedFunction: AIFunction;
  onFunctionChange: (func: AIFunction) => void;
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
  className?: string;
}

export default function EnhancedAIMenu({
  selectedFunction,
  onFunctionChange,
  isMinimized = false,
  onToggleMinimize,
  className = '',
}: EnhancedAIMenuProps) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [showHelp, setShowHelp] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // 사용 빈도 기반 정렬
  const sortedItems = [...AI_MENU_ITEMS].sort((a, b) => b.popularity - a.popularity);

  // 키보드 네비게이션
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!menuRef.current) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setFocusedIndex(prev => 
            prev < sortedItems.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setFocusedIndex(prev => 
            prev > 0 ? prev - 1 : sortedItems.length - 1
          );
          break;
        case 'Enter':
          if (focusedIndex >= 0) {
            onFunctionChange(sortedItems[focusedIndex].id);
          }
          break;
        case 'Escape':
          setFocusedIndex(-1);
          break;
        case '?':
          if (e.shiftKey) {
            setShowHelp(!showHelp);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [focusedIndex, sortedItems, onFunctionChange, showHelp]);

  return (
    <div ref={menuRef} className={`enhanced-ai-menu ${className}`}>
      {/* 최소화된 상태 */}
      {isMinimized && (
        <motion.div
          className="minimized-menu"
          initial={{ width: 0 }}
          animate={{ width: 60 }}
          transition={{ duration: 0.3 }}
        >
          <button
            onClick={onToggleMinimize}
            className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center text-white mb-2"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          
          {/* 인기 기능 3개만 표시 */}
          {sortedItems.slice(0, 3).map((item, index) => {
            const Icon = item.icon;
            const isSelected = selectedFunction === item.id;
            
            return (
              <motion.button
                key={item.id}
                onClick={() => onFunctionChange(item.id)}
                className={`
                  w-12 h-12 rounded-xl mb-1 flex items-center justify-center
                  transition-all duration-200 group relative
                  ${isSelected 
                    ? `bg-gradient-to-r ${item.gradient} text-white shadow-lg` 
                    : `${item.bgColor} ${item.color}`
                  }
                `}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Icon className="w-4 h-4" />
                
                {/* 최소화 상태 툴팁 */}
                <div className="ai-menu-tooltip">
                  <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg">
                    {item.label}
                  </div>
                </div>
              </motion.button>
            );
          })}
        </motion.div>
      )}

      {/* 전체 메뉴 */}
      {!isMinimized && (
        <motion.div
          className="full-menu flex flex-col space-y-1 p-3 bg-white/95 backdrop-blur-sm border-l border-gray-200 shadow-lg"
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 280, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {/* 헤더 */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                <Brain className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-800">AI 어시스턴트</h3>
                <p className="text-xs text-gray-500">8개 기능 사용 가능</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setShowHelp(!showHelp)}
                className="p-1 hover:bg-gray-100 rounded"
                title="도움말 (Shift+?)"
              >
                <HelpCircle className="w-4 h-4 text-gray-400" />
              </button>
              
              {onToggleMinimize && (
                <button
                  onClick={onToggleMinimize}
                  className="p-1 hover:bg-gray-100 rounded"
                  title="최소화"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-400" />
                </button>
              )}
            </div>
          </div>

          {/* 도움말 패널 */}
          <AnimatePresence>
            {showHelp && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="bg-blue-50 rounded-lg p-3 mb-4 text-xs text-blue-800"
              >
                <div className="font-semibold mb-2">키보드 단축키</div>
                <div className="space-y-1">
                  <div>↑/↓ 화살표: 메뉴 탐색</div>
                  <div>Enter: 선택</div>
                  <div>Ctrl+K: AI 채팅</div>
                  <div>Shift+?: 도움말</div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 메뉴 아이템들 */}
          <div className="space-y-1">
            {sortedItems.map((item, index) => {
              const Icon = item.icon;
              const isSelected = selectedFunction === item.id;
              const isFocused = focusedIndex === index;
              
              return (
                <motion.button
                  key={item.id}
                  onClick={() => onFunctionChange(item.id)}
                  onMouseEnter={() => setHoveredItem(item.id)}
                  onMouseLeave={() => setHoveredItem(null)}
                  className={`
                    ai-menu-item w-full flex items-center space-x-3 p-3 rounded-xl
                    transition-all duration-200 text-left group relative
                    ${isSelected ? 'ai-menu-item-selected' : ''}
                    ${isSelected 
                      ? `bg-gradient-to-r ${item.gradient} text-white shadow-lg transform scale-[1.02]` 
                      : isFocused
                        ? 'bg-gray-100 shadow-md transform scale-[1.01]'
                        : `${item.bgColor} ${item.color} hover:shadow-md hover:transform hover:scale-[1.01]`
                    }
                  `}
                  whileHover={{ x: -2 }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div className="flex-shrink-0 relative">
                    <Icon className="w-5 h-5" />
                    
                    {/* 새 기능 표시 */}
                    {item.isNew && (
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
                    )}
                    
                    {/* Pro 기능 표시 */}
                    {item.isPro && (
                      <Star className="absolute -top-1 -right-1 w-3 h-3 text-yellow-500 fill-current" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm truncate">{item.label}</span>
                      {item.shortcut && (
                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                          isSelected ? 'bg-white/20' : 'bg-gray-200 text-gray-500'
                        }`}>
                          {item.shortcut}
                        </span>
                      )}
                    </div>
                    <p className={`text-xs mt-1 ${
                      isSelected ? 'text-white/80' : 'text-gray-500'
                    }`}>
                      {item.description}
                    </p>
                  </div>

                  {/* 인기도 표시 */}
                  <div className="flex-shrink-0">
                    <div className="flex space-x-0.5">
                      {Array.from({ length: 3 }, (_, i) => (
                        <div
                          key={i}
                          className={`w-1 h-1 rounded-full ${
                            i < Math.floor(item.popularity / 3.5)
                              ? isSelected ? 'bg-white' : 'bg-gray-400'
                              : 'bg-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* 하단 정보 */}
          <div className="mt-4 pt-3 border-t border-gray-200">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>총 {sortedItems.length}개 기능</span>
              <span>인기순 정렬</span>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
} 