'use client';

import React from 'react';
import { motion } from 'framer-motion';
import type { MenuItem } from '../types/profile.types';

interface ProfileMenuItemProps extends MenuItem {
  onClick?: (e: React.MouseEvent) => void;
  index?: number;
}

/**
 * 프로필 메뉴 아이템 컴포넌트
 * 일관된 메뉴 아이템 UI 제공
 */
export const ProfileMenuItem = React.memo(function ProfileMenuItem({
  id,
  label,
  icon: Icon,
  action,
  visible,
  danger = false,
  description,
  badge,
  disabled = false,
  dividerBefore = false,
  onClick,
  index = 0,
}: ProfileMenuItemProps) {
  if (!visible) return null;

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (onClick) {
      onClick(e);
    }

    if (!disabled && action) {
      console.log(`🔘 메뉴 클릭: ${label}`);
      await action();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
      e.preventDefault();
      handleClick(e as unknown as React.MouseEvent);
    }
  };

  // 색상 클래스 결정
  const getColorClasses = () => {
    if (disabled) {
      return 'text-gray-400 cursor-not-allowed';
    }
    if (danger) {
      return 'text-red-700 hover:bg-red-50';
    }
    return 'text-gray-700 hover:bg-gray-50';
  };

  // 아이콘 색상 클래스
  const getIconColorClasses = () => {
    if (disabled) return 'text-gray-300';
    if (danger) return 'text-red-500';
    return 'text-gray-400';
  };

  return (
    <>
      {dividerBefore && <div className='border-t border-gray-100 my-1' />}
      <motion.button
        id={id}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={`flex items-center w-full px-4 py-2 text-sm transition-colors cursor-pointer ${getColorClasses()}`}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.05 }}
        whileHover={!disabled ? { x: 2 } : undefined}
        whileTap={!disabled ? { scale: 0.98 } : undefined}
        role='menuitem'
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
      >
        <Icon
          className={`w-4 h-4 mr-3 flex-shrink-0 ${getIconColorClasses()}`}
        />

        <div className='flex-1 text-left'>
          <span className='block'>{label}</span>
          {description && (
            <span className='text-xs text-gray-500 mt-0.5 block'>
              {description}
            </span>
          )}
        </div>

        {badge && (
          <span
            className={`ml-auto text-xs flex-shrink-0 ${
              danger ? 'text-red-500' : 'text-gray-500'
            }`}
          >
            {badge}
          </span>
        )}
      </motion.button>
    </>
  );
});

/**
 * 메뉴 구분선 컴포넌트
 */
export const MenuDivider = React.memo(function MenuDivider() {
  return <div className='border-t border-gray-100 my-1' />;
});

/**
 * 메뉴 섹션 헤더 컴포넌트
 */
export const MenuSectionHeader = React.memo(function MenuSectionHeader({
  title,
}: {
  title: string;
}) {
  return (
    <div className='px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider'>
      {title}
    </div>
  );
});
