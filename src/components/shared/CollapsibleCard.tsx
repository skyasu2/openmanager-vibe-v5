'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CollapsibleCardProps {
    title: string;
    subtitle?: string;
    icon?: React.ReactNode;
    isExpanded: boolean;
    onToggle: () => void;
    children: React.ReactNode;
    className?: string;
    headerClassName?: string;
    contentClassName?: string;
    variant?: 'default' | 'bordered' | 'elevated';
    size?: 'sm' | 'md' | 'lg';
}

export default function CollapsibleCard({
    title,
    subtitle,
    icon,
    isExpanded,
    onToggle,
    children,
    className,
    headerClassName,
    contentClassName,
    variant = 'default',
    size = 'md',
}: CollapsibleCardProps) {
    const baseClasses = {
        default: 'bg-white rounded-lg shadow-sm',
        bordered: 'bg-white rounded-lg border border-gray-200',
        elevated: 'bg-white rounded-lg shadow-md',
    };

    const sizeClasses = {
        sm: 'p-3',
        md: 'p-4',
        lg: 'p-6',
    };

    return (
        <div className={cn(baseClasses[variant], className)}>
            {/* 헤더 */}
            <div
                className={cn(
                    'flex items-center justify-between cursor-pointer select-none',
                    'hover:bg-gray-50 rounded-lg transition-colors duration-200',
                    sizeClasses[size],
                    headerClassName
                )}
                onClick={onToggle}
            >
                <div className="flex items-center gap-3">
                    {icon && (
                        <div className="flex-shrink-0">
                            {icon}
                        </div>
                    )}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                            {title}
                        </h3>
                        {subtitle && (
                            <p className="text-sm text-gray-600 mt-0.5">
                                {subtitle}
                            </p>
                        )}
                    </div>
                </div>

                {/* 토글 버튼 */}
                <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex-shrink-0 p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                </motion.div>
            </div>

            {/* 콘텐츠 */}
            <AnimatePresence initial={false}>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{
                            duration: 0.3,
                            ease: [0.04, 0.62, 0.23, 0.98]
                        }}
                        className="overflow-hidden"
                    >
                        <div className={cn(
                            'border-t border-gray-100 mt-2 pt-4',
                            contentClassName
                        )}>
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
} 