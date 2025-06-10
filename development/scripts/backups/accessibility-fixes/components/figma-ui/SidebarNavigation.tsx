'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  BarChart3,
  Shield,
  Settings,
  Users,
  Bell,
  HelpCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Search,
  Menu,
  X,
  Activity,
  Database,
  Cloud,
  Zap,
} from 'lucide-react';

export interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  href?: string;
  badge?: string;
  active?: boolean;
  children?: NavItem[];
}

export interface SidebarNavigationProps {
  isOpen?: boolean;
  isCollapsed?: boolean;
  onToggle?: () => void;
  onCollapse?: (collapsed: boolean) => void;
  onItemClick?: (item: NavItem) => void;
  items?: NavItem[];
  currentPath?: string;
  showSearch?: boolean;
  showUserProfile?: boolean;
  userProfile?: {
    name: string;
    email: string;
    avatar?: string;
    role?: string;
  };
  variant?: 'light' | 'dark' | 'glass';
  position?: 'left' | 'right';
}

const defaultNavItems: NavItem[] = [
  {
    id: 'dashboard',
    label: '대시보드',
    icon: Home,
    href: '/dashboard',
    active: true,
  },
  {
    id: 'monitoring',
    label: '모니터링',
    icon: Activity,
    href: '/monitoring',
    badge: '실시간',
    children: [
      {
        id: 'servers',
        label: '서버 현황',
        icon: Database,
        href: '/monitoring/servers',
      },
      {
        id: 'networks',
        label: '네트워크',
        icon: Cloud,
        href: '/monitoring/networks',
      },
      {
        id: 'performance',
        label: '성능 분석',
        icon: Zap,
        href: '/monitoring/performance',
      },
    ],
  },
  {
    id: 'analytics',
    label: '분석',
    icon: BarChart3,
    href: '/analytics',
    badge: '3',
  },
  {
    id: 'security',
    label: '보안',
    icon: Shield,
    href: '/security',
  },
  {
    id: 'users',
    label: '사용자 관리',
    icon: Users,
    href: '/users',
  },
  {
    id: 'notifications',
    label: '알림',
    icon: Bell,
    href: '/notifications',
    badge: '12',
  },
  {
    id: 'settings',
    label: '설정',
    icon: Settings,
    href: '/settings',
  },
  {
    id: 'help',
    label: '도움말',
    icon: HelpCircle,
    href: '/help',
  },
];

export default function SidebarNavigation({
  isOpen = true,
  isCollapsed = false,
  onToggle,
  onCollapse,
  onItemClick,
  items = defaultNavItems,
  currentPath = '/dashboard',
  showSearch = true,
  showUserProfile = true,
  userProfile = {
    name: '김개발자',
    email: 'developer@example.com',
    role: '시스템 관리자',
  },
  variant = 'light',
  position = 'left',
}: SidebarNavigationProps) {
  const [expandedItems, setExpandedItems] = useState<string[]>(['monitoring']);
  const [searchQuery, setSearchQuery] = useState('');

  const getVariantClasses = () => {
    switch (variant) {
      case 'dark':
        return 'bg-gray-900 border-gray-800 text-white';
      case 'glass':
        return 'bg-white/80 backdrop-blur-xl border-gray-200/50 text-gray-900';
      default:
        return 'bg-white border-gray-200 text-gray-900';
    }
  };

  const getPositionClasses = () => {
    return position === 'right' ? 'right-0' : 'left-0';
  };

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleItemClick = (item: NavItem) => {
    if (item.children) {
      toggleExpanded(item.id);
    } else {
      onItemClick?.(item);
    }
  };

  const filteredItems = items.filter(item =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className='fixed inset-0 bg-black/50 z-40 md:hidden'
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <motion.aside
        initial={{ x: position === 'left' ? -300 : 300 }}
        animate={{
          x: 0,
          width: isCollapsed ? 80 : 280,
        }}
        exit={{ x: position === 'left' ? -300 : 300 }}
        transition={{ type: 'spring', damping: 20, stiffness: 100 }}
        className={`
          fixed top-0 ${getPositionClasses()} h-screen z-50 border-r shadow-xl
          ${getVariantClasses()}
          ${isCollapsed ? 'w-20' : 'w-70'}
          flex flex-col
        `}
      >
        {/* Header */}
        <div className='flex items-center justify-between p-4 border-b border-gray-200/50'>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className='flex items-center gap-3'
            >
              <div className='w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center'>
                <Activity className='w-5 h-5 text-white' />
              </div>
              <div>
                <h2 className='font-bold text-lg'>OpenManager</h2>
                <p className='text-xs text-gray-500'>v5.0</p>
              </div>
            </motion.div>
          )}

          <div className='flex items-center gap-2'>
            <button
              onClick={() => onCollapse?.(!isCollapsed)}
              className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
            >
              {isCollapsed ? (
                <ChevronRight className='w-4 h-4' />
              ) : (
                <ChevronLeft className='w-4 h-4' />
              )}
            </button>

            <button
              onClick={onToggle}
              className='p-2 hover:bg-gray-100 rounded-lg transition-colors md:hidden'
            >
              <X className='w-4 h-4' />
            </button>
          </div>
        </div>

        {/* Search */}
        {showSearch && !isCollapsed && (
          <div className='p-4 border-b border-gray-200/50'>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400' />
              <input
                type='text'
                placeholder='메뉴 검색...'
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className='w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
              />
            </div>
          </div>
        )}

        {/* Navigation Items */}
        <nav className='flex-1 overflow-y-auto py-4 space-y-1'>
          {filteredItems.map((item, index) => {
            const IconComponent = item.icon;
            const isActive = currentPath === item.href;
            const isExpanded = expandedItems.includes(item.id);
            const hasChildren = item.children && item.children.length > 0;

            return (
              <div key={item.id}>
                {/* Main Item */}
                <motion.button
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleItemClick(item)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 mx-2 rounded-lg transition-all duration-200
                    ${
                      isActive
                        ? 'bg-blue-500 text-white shadow-lg'
                        : 'hover:bg-gray-100 text-gray-700'
                    }
                    ${isCollapsed ? 'justify-center' : 'justify-between'}
                  `}
                >
                  <div className='flex items-center gap-3'>
                    <IconComponent
                      className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-500'}`}
                    />

                    {!isCollapsed && (
                      <span className='font-medium'>{item.label}</span>
                    )}
                  </div>

                  {!isCollapsed && (
                    <div className='flex items-center gap-2'>
                      {item.badge && (
                        <span
                          className={`
                          px-2 py-1 text-xs rounded-full font-medium
                          ${
                            isActive
                              ? 'bg-white/20 text-white'
                              : 'bg-blue-100 text-blue-600'
                          }
                        `}
                        >
                          {item.badge}
                        </span>
                      )}

                      {hasChildren && (
                        <motion.div
                          animate={{ rotate: isExpanded ? 90 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronRight className='w-4 h-4' />
                        </motion.div>
                      )}
                    </div>
                  )}
                </motion.button>

                {/* Children Items */}
                <AnimatePresence>
                  {hasChildren && isExpanded && !isCollapsed && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className='ml-6 mt-1 space-y-1'
                    >
                      {item.children?.map((child, childIndex) => {
                        const ChildIcon = child.icon;
                        const isChildActive = currentPath === child.href;

                        return (
                          <motion.button
                            key={child.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: childIndex * 0.05 }}
                            onClick={() => onItemClick?.(child)}
                            className={`
                              w-full flex items-center gap-3 px-4 py-2 mx-2 rounded-lg transition-all duration-200 text-sm
                              ${
                                isChildActive
                                  ? 'bg-blue-50 text-blue-600 border-l-2 border-blue-500'
                                  : 'hover:bg-gray-50 text-gray-600'
                              }
                            `}
                          >
                            <ChildIcon className='w-4 h-4' />
                            <span>{child.label}</span>
                          </motion.button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </nav>

        {/* User Profile */}
        {showUserProfile && !isCollapsed && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className='p-4 border-t border-gray-200/50'
          >
            <div className='flex items-center gap-3 p-3 bg-gray-50 rounded-lg'>
              <div className='w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center'>
                <span className='text-white font-medium'>
                  {userProfile.name.charAt(0)}
                </span>
              </div>
              <div className='flex-1 min-w-0'>
                <p className='font-medium text-sm truncate'>
                  {userProfile.name}
                </p>
                <p className='text-xs text-gray-500 truncate'>
                  {userProfile.role}
                </p>
              </div>
              <button className='p-1 hover:bg-gray-200 rounded transition-colors'>
                <LogOut className='w-4 h-4 text-gray-400' />
              </button>
            </div>
          </motion.div>
        )}

        {/* Collapsed User Icon */}
        {showUserProfile && isCollapsed && (
          <div className='p-4 border-t border-gray-200/50'>
            <div className='w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto'>
              <span className='text-white font-medium'>
                {userProfile.name.charAt(0)}
              </span>
            </div>
          </div>
        )}
      </motion.aside>
    </>
  );
}
