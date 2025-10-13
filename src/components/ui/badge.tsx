'use client';

import { forwardRef, type HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Badge variants using Design System v1.0.0 tokens
 *
 * 디자인 시스템 토큰 활용:
 * - Border Radius: var(--radius-full)
 * - Transition: var(--duration-150)
 * - Color: var(--color-primary-500), var(--color-success-500), var(--color-error-500)
 * - Typography: text-caption (12px)
 */
const badgeVariants = cva(
  'inline-flex items-center border px-2.5 py-0.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2',
  {
    variants: {
      variant: {
        // Primary: 브랜드 색상
        default:
          'border-transparent bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 text-white hover:opacity-90 focus:ring-purple-400',
        // Success: 성공 상태
        success:
          'border-transparent bg-[var(--color-success-500)] text-white hover:opacity-90 focus:ring-green-400',
        // Warning: 경고 상태
        warning:
          'border-transparent bg-[var(--color-warning-500)] text-white hover:opacity-90 focus:ring-amber-400',
        // Error: 에러 상태
        destructive:
          'border-transparent bg-[var(--color-error-500)] text-white hover:opacity-90 focus:ring-red-400',
        // Info: 정보 상태
        info:
          'border-transparent bg-[var(--color-info-500)] text-white hover:opacity-90 focus:ring-blue-400',
        // Secondary: 서피스 색상
        secondary:
          'border-transparent bg-[var(--color-surface-100)] text-gray-700 hover:bg-[var(--color-surface-200)] focus:ring-gray-400',
        // Outline: 테두리만
        outline:
          'border-[var(--color-neutral-300)] text-gray-700 hover:bg-gray-50 focus:ring-gray-400',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, style, ...props }: BadgeProps) {
  return (
    <div
      className={cn(badgeVariants({ variant }), className)}
      style={{
        borderRadius: 'var(--radius-full)',
        transitionDuration: 'var(--duration-150)',
        transitionProperty: 'background-color, opacity',
        ...style,
      }}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
