/**
 * ActionButtons Component
 * 
 * ⚡ 액션 버튼 컴포넌트
 */

'use client';

import React from 'react';
import { ActionButton } from '../types';

interface ActionButtonsProps {
  actions: ActionButton[];
  className?: string;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  actions,
  className = ''
}) => {
  const getButtonClasses = (variant: ActionButton['variant'] = 'secondary', disabled = false) => {
    const baseClasses = 'px-3 py-2 text-sm rounded-lg transition-colors focus:outline-none focus:ring-2';
    
    if (disabled) {
      return `${baseClasses} opacity-50 cursor-not-allowed bg-gray-200 dark:bg-gray-700 text-gray-500`;
    }

    switch (variant) {
      case 'primary':
        return `${baseClasses} bg-blue-500 hover:bg-blue-600 text-white focus:ring-blue-500`;
      case 'danger':
        return `${baseClasses} bg-red-500 hover:bg-red-600 text-white focus:ring-red-500`;
      case 'secondary':
      default:
        return `${baseClasses} bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 
                text-gray-700 dark:text-gray-300 focus:ring-gray-500`;
    }
  };

  const handleActionClick = async (action: ActionButton) => {
    if (action.disabled) return;

    try {
      await action.action();
    } catch (error) {
      console.error('Action execution failed:', error);
    }
  };

  if (actions.length === 0) {
    return null;
  }

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {actions.map((action) => (
        <button
          key={action.id}
          onClick={() => handleActionClick(action)}
          disabled={action.disabled}
          className={getButtonClasses(action.variant, action.disabled)}
          title={action.label}
        >
          <div className="flex items-center space-x-1">
            {action.icon && (
              <span className="text-sm">{action.icon}</span>
            )}
            <span>{action.label}</span>
          </div>
        </button>
      ))}
    </div>
  );
}; 