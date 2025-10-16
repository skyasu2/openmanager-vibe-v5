/**
 * 🔧 Type-safe Recharts Wrappers
 *
 * Recharts 2.15.4와 TypeScript 5.7 strict mode 호환성 해결
 *
 * 사용법:
 * ```tsx
 * // Before:
 * import { Tooltip, Pie } from 'recharts';
 *
 * // After:
 * import { TypeSafeTooltip as Tooltip, TypeSafePie as Pie } from '@/components/charts/wrappers';
 * ```
 *
 * 또는:
 * ```tsx
 * import { TypeSafeTooltip, TypeSafePie } from '@/components/charts/wrappers';
 *
 * <TypeSafeTooltip formatter={...} />
 * <TypeSafePie label={...} data={...} />
 * ```
 */

export { TypeSafeTooltip } from './TypeSafeTooltip';
export { TypeSafePie } from './TypeSafePie';
