'use client';

import { formatPercentage } from '@/lib/utils';
import { motion } from 'framer-motion';

export interface UnifiedCircularGaugeProps {
    value: number;
    max?: number;
    label: string;
    type: 'cpu' | 'memory' | 'disk' | 'network';
    size?: number;
    variant?: 'card' | 'modal' | 'modal-3d';
    showAnimation?: boolean;
    showRealTimeUpdates?: boolean;
    className?: string;
}

// 메트릭 타입별 색상 및 스타일 설정
const getMetricConfig = (
    value: number,
    type: 'cpu' | 'memory' | 'disk' | 'network'
) => {
    const thresholds = {
        cpu: { warning: 70, critical: 85 },
        memory: { warning: 80, critical: 90 },
        disk: { warning: 80, critical: 95 },
        network: { warning: 60, critical: 80 },
    };

    const threshold = thresholds[type];
    const isCritical = value >= threshold.critical;
    const isWarning = value >= threshold.warning;

    // 기본 색상 설정
    const baseColors = {
        cpu: { color: '#ef4444', gradient: 'from-red-500 to-red-600' },
        memory: { color: '#3b82f6', gradient: 'from-blue-500 to-blue-600' },
        disk: { color: '#8b5cf6', gradient: 'from-purple-500 to-purple-600' },
        network: { color: '#22c55e', gradient: 'from-green-500 to-green-600' },
    };

    // 상태에 따른 색상 오버라이드
    if (isCritical) {
        return {
            color: '#ef4444',
            gradient: 'from-red-500 to-red-600',
            textColor: 'text-red-700',
            bgColor: 'bg-red-100',
            borderColor: 'border-red-300',
            status: '위험',
        };
    } else if (isWarning) {
        return {
            color: '#f59e0b',
            gradient: 'from-amber-500 to-amber-600',
            textColor: 'text-amber-700',
            bgColor: 'bg-amber-100',
            borderColor: 'border-amber-300',
            status: '주의',
        };
    } else {
        const base = baseColors[type];
        return {
            color: base.color,
            gradient: base.gradient,
            textColor: type === 'cpu' ? 'text-red-700' :
                type === 'memory' ? 'text-blue-700' :
                    type === 'disk' ? 'text-purple-700' : 'text-green-700',
            bgColor: type === 'cpu' ? 'bg-red-100' :
                type === 'memory' ? 'bg-blue-100' :
                    type === 'disk' ? 'bg-purple-100' : 'bg-green-100',
            borderColor: type === 'cpu' ? 'border-red-300' :
                type === 'memory' ? 'border-blue-300' :
                    type === 'disk' ? 'border-purple-300' : 'border-green-300',
            status: '정상',
        };
    }
};

export default function UnifiedCircularGauge({
    value,
    max = 100,
    label,
    type,
    size = 80,
    variant = 'card',
    showAnimation = true,
    showRealTimeUpdates = false,
    className = '',
}: UnifiedCircularGaugeProps) {
    const percentage = Math.max(0, Math.min(100, (value / max) * 100));
    const config = getMetricConfig(percentage, type);

    // 변형별 크기 및 스타일 설정
    const variantConfig = {
        card: {
            size: size || 60,
            strokeWidth: 4,
            showStatus: false,
            centerTextSize: 'text-xs',
            labelSize: 'text-xs',
        },
        modal: {
            size: size || 150,
            strokeWidth: 8,
            showStatus: true,
            centerTextSize: 'text-2xl',
            labelSize: 'text-sm',
        },
        'modal-3d': {
            size: size || 140,
            strokeWidth: 8,
            showStatus: true,
            centerTextSize: 'text-2xl',
            labelSize: 'text-xs',
        },
    };

    const currentConfig = variantConfig[variant];
    const radius = (currentConfig.size - currentConfig.strokeWidth * 2) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
        <div className={`flex flex-col items-center ${className}`}>
            <div className='relative' style={{ width: currentConfig.size, height: currentConfig.size }}>
                <svg
                    width={currentConfig.size}
                    height={currentConfig.size}
                    className={`transform -rotate-90 ${variant === 'modal-3d' ? 'drop-shadow-lg' : ''}`}
                >
                    <defs>
                        {/* 그라데이션 정의 */}
                        <linearGradient
                            id={`gradient-${label}-${type}`}
                            x1='0%'
                            y1='0%'
                            x2='100%'
                            y2='100%'
                        >
                            <stop offset='0%' stopColor={config.color} stopOpacity='0.8' />
                            <stop offset='100%' stopColor={config.color} stopOpacity='1' />
                        </linearGradient>

                        {/* 3D 효과용 방사형 그라데이션 */}
                        {variant === 'modal-3d' && (
                            <radialGradient id={`radial-gradient-${label}-${type}`}>
                                <stop offset='0%' stopColor={config.color} stopOpacity='0.3' />
                                <stop offset='100%' stopColor={config.color} stopOpacity='0.1' />
                            </radialGradient>
                        )}

                        {/* 그림자 효과 */}
                        <filter
                            id={`shadow-${label}-${type}`}
                            x='-50%'
                            y='-50%'
                            width='200%'
                            height='200%'
                        >
                            <feDropShadow dx='0' dy='2' stdDeviation='3' floodOpacity='0.3' />
                        </filter>
                    </defs>

                    {/* 배경 원 */}
                    <circle
                        cx={currentConfig.size / 2}
                        cy={currentConfig.size / 2}
                        r={radius}
                        stroke='#e5e7eb'
                        strokeWidth={currentConfig.strokeWidth}
                        fill='none'
                        opacity={variant === 'card' ? '0.2' : '1'}
                    />

                    {/* 3D 효과용 내부 원 (modal-3d 전용) */}
                    {variant === 'modal-3d' && (
                        <circle
                            cx={currentConfig.size / 2}
                            cy={currentConfig.size / 2}
                            r={radius - 10}
                            fill={`url(#radial-gradient-${label}-${type})`}
                            className='opacity-20'
                        />
                    )}

                    {/* 진행률 원 */}
                    <motion.circle
                        cx={currentConfig.size / 2}
                        cy={currentConfig.size / 2}
                        r={radius}
                        stroke={variant === 'modal-3d' ? `url(#gradient-${label}-${type})` : config.color}
                        strokeWidth={currentConfig.strokeWidth}
                        fill='none'
                        strokeLinecap='round'
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                        filter={variant !== 'card' ? `url(#shadow-${label}-${type})` : undefined}
                        className={
                            showAnimation ? 'transition-all duration-1000 ease-out' : ''
                        }
                        initial={showAnimation ? { strokeDashoffset: circumference } : undefined}
                        animate={showAnimation ? { strokeDashoffset } : undefined}
                        transition={showAnimation ? { duration: 1.5, ease: 'easeOut' } : undefined}
                        style={{
                            filter: variant === 'modal-3d' ? `drop-shadow(0 0 8px ${config.color}40)` : undefined,
                        }}
                    />
                </svg>

                {/* 중앙 텍스트 */}
                <div className='absolute inset-0 flex items-center justify-center'>
                    <div className='text-center'>
                        <div className={`font-bold ${currentConfig.centerTextSize}`} style={{ color: config.color }}>
                            {variant === 'card' ? value.toFixed(0) : formatPercentage(value).replace('%', '')}
                            <span className={variant === 'card' ? 'text-xs' : 'text-xl'}>%</span>
                        </div>
                        {currentConfig.showStatus && (
                            <div className='text-xs text-gray-500 mt-1'>{config.status}</div>
                        )}
                    </div>
                </div>

                {/* 실시간 펄스 효과 (카드 전용) */}
                {showRealTimeUpdates && variant === 'card' && (
                    <motion.div
                        animate={{
                            scale: [1, 1.1, 1],
                            opacity: [0.3, 0.7, 0.3],
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: 'easeInOut',
                        }}
                        className={`absolute inset-0 rounded-full border-2 ${config.borderColor} opacity-30`}
                    />
                )}

                {/* 애니메이션 효과 (모달 전용) */}
                {showAnimation && variant !== 'card' && percentage > 75 && (
                    <div className='absolute inset-0 flex items-center justify-center'>
                        <div
                            className='w-3 h-3 rounded-full animate-pulse'
                            style={{
                                backgroundColor: config.color,
                                boxShadow: `0 0 10px ${config.color}50`,
                            }}
                        />
                    </div>
                )}
            </div>

            {/* 라벨 */}
            <div className='mt-2 text-center'>
                <div className={`font-medium text-gray-700 ${currentConfig.labelSize}`}>
                    {label}
                </div>
                {max !== 100 && variant !== 'card' && (
                    <div className='text-xs text-gray-500'>
                        {value.toFixed(2)} / {max}
                    </div>
                )}
            </div>
        </div>
    );
}

// 편의를 위한 사전 정의된 변형들
export const ServerCardGauge = (props: Omit<UnifiedCircularGaugeProps, 'variant'>) => (
    <UnifiedCircularGauge {...props} variant='card' />
);

export const ServerModalGauge = (props: Omit<UnifiedCircularGaugeProps, 'variant'>) => (
    <UnifiedCircularGauge {...props} variant='modal' />
);

export const ServerModal3DGauge = (props: Omit<UnifiedCircularGaugeProps, 'variant'>) => (
    <UnifiedCircularGauge {...props} variant='modal-3d' />
);