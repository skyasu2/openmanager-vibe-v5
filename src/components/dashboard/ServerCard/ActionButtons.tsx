/**
 * 🔘 ActionButtons Component v2.0
 *
 * 서버 액션 버튼 컴포넌트
 * - 상태별 액션 버튼 표시
 * - 호버 효과 및 애니메이션
 * - 접근성 지원
 */

import React, { memo, useState } from 'react';
import { Server } from '../../../types/server';

interface ActionButtonsProps {
  server: Server;
  variant?: 'default' | 'compact' | 'detailed';
  onAction?: (action: string, server: Server) => void;
  showLabels?: boolean;
}

const ActionButtons: React.FC<ActionButtonsProps> = memo(
  ({ server, variant = 'default', onAction, showLabels = false }) => {
    const [hoveredAction, setHoveredAction] = useState<string | null>(null);

    // 서버 상태별 사용 가능한 액션들
    const getAvailableActions = () => {
      const baseActions = [
        {
          key: 'view',
          label: '상세보기',
          icon: '👁️',
          color: 'text-blue-600 hover:text-blue-700',
          bgColor: 'hover:bg-blue-50',
          available: true,
          description: '서버 상세 정보 보기',
        },
        {
          key: 'logs',
          label: '로그',
          icon: '📋',
          color: 'text-gray-600 hover:text-gray-700',
          bgColor: 'hover:bg-gray-50',
          available: true,
          description: '서버 로그 확인',
        },
      ];

      // 상태별 추가 액션
      if (server.status === 'online') {
        baseActions.push(
          {
            key: 'restart',
            label: '재시작',
            icon: '🔄',
            color: 'text-yellow-600 hover:text-yellow-700',
            bgColor: 'hover:bg-yellow-50',
            available: true,
            description: '서버 재시작',
          },
          {
            key: 'stop',
            label: '중지',
            icon: '⏸️',
            color: 'text-red-600 hover:text-red-700',
            bgColor: 'hover:bg-red-50',
            available: true,
            description: '서버 중지',
          }
        );
      } else if (server.status === 'offline') {
        baseActions.push({
          key: 'start',
          label: '시작',
          icon: '▶️',
          color: 'text-green-600 hover:text-green-700',
          bgColor: 'hover:bg-green-50',
          available: true,
          description: '서버 시작',
        });
      }

      // 경고 상태일 때 추가 액션
      if (server.status === 'warning') {
        baseActions.push({
          key: 'diagnose',
          label: '진단',
          icon: '🔍',
          color: 'text-purple-600 hover:text-purple-700',
          bgColor: 'hover:bg-purple-50',
          available: true,
          description: '문제 진단 실행',
        });
      }

      // 알림이 있을 때 추가 액션
      if (server.alerts > 0) {
        baseActions.push({
          key: 'alerts',
          label: '알림',
          icon: '🚨',
          color: 'text-red-600 hover:text-red-700',
          bgColor: 'hover:bg-red-50',
          available: true,
          description: '알림 확인',
        });
      }

      return baseActions.filter(action => action.available);
    };

    // 배리언트별 클래스
    const getVariantClasses = () => {
      switch (variant) {
        case 'compact':
          return {
            button: 'p-1.5 text-xs',
            container: 'flex gap-1',
            maxButtons: 3,
          };
        case 'detailed':
          return {
            button: 'p-2 text-sm',
            container: 'flex flex-wrap gap-2',
            maxButtons: 6,
          };
        default:
          return {
            button: 'p-1.5 text-xs',
            container: 'flex gap-1.5',
            maxButtons: 4,
          };
      }
    };

    const actions = getAvailableActions();
    const classes = getVariantClasses();
    const visibleActions = actions.slice(0, classes.maxButtons);
    const hiddenActionsCount = actions.length - classes.maxButtons;

    const handleActionClick = (action: string) => {
      if (onAction) {
        onAction(action, server);
      } else {
        // 기본 동작 (콘솔 로그)
        console.log(`Action "${action}" triggered for server "${server.name}"`);
      }
    };

    return (
      <div className={`${classes.container} items-center`}>
        {/* 액션 버튼들 */}
        {visibleActions.map(action => (
          <button
            key={action.key}
            onClick={e => {
              e.stopPropagation(); // 카드 클릭 이벤트와 분리
              handleActionClick(action.key);
            }}
            onMouseEnter={() => setHoveredAction(action.key)}
            onMouseLeave={() => setHoveredAction(null)}
            className={`
            ${classes.button}
            ${action.color}
            ${action.bgColor}
            rounded-lg border border-gray-200 
            transition-all duration-200 
            hover:shadow-sm hover:border-gray-300
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50
            ${hoveredAction === action.key ? 'scale-105' : ''}
          `}
            title={action.description}
            aria-label={action.description}
          >
            <div className='flex items-center gap-1'>
              <span>{action.icon}</span>
              {(showLabels || variant === 'detailed') && (
                <span className='whitespace-nowrap'>{action.label}</span>
              )}
            </div>
          </button>
        ))}

        {/* 더보기 버튼 (숨겨진 액션이 있을 때) */}
        {hiddenActionsCount > 0 && variant !== 'detailed' && (
          <button
            onClick={e => {
              e.stopPropagation();
              handleActionClick('more');
            }}
            className={`
            ${classes.button}
            text-gray-500 hover:text-gray-600
            hover:bg-gray-50
            rounded-lg border border-gray-200 
            transition-all duration-200 
            hover:shadow-sm hover:border-gray-300
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50
          `}
            title={`${hiddenActionsCount}개 추가 액션 보기`}
            aria-label={`${hiddenActionsCount}개 추가 액션 보기`}
          >
            <div className='flex items-center gap-1'>
              <span>⋯</span>
              {showLabels && (
                <span className='text-xs'>+{hiddenActionsCount}</span>
              )}
            </div>
          </button>
        )}

        {/* 빠른 상태 토글 (detailed 모드에서만) */}
        {variant === 'detailed' && server.status === 'online' && (
          <div className='ml-2 pl-2 border-l border-gray-200'>
            <div className='flex items-center gap-1 text-xs text-gray-500'>
              <span>빠른 액션:</span>
              <button
                onClick={e => {
                  e.stopPropagation();
                  handleActionClick('quick-restart');
                }}
                className='px-2 py-1 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 transition-colors'
                title='1분 내 자동 재시작'
              >
                ⚡ 빠른 재시작
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }
);

ActionButtons.displayName = 'ActionButtons';

export default ActionButtons;
