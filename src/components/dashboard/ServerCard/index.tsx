/**
 * 🎯 ServerCard v2.0 - Index Export
 *
 * 모듈화된 ServerCard 컴포넌트 패키지
 * - 메인 컴포넌트 및 하위 컴포넌트 export
 * - 타입 정의 export
 * - 깔끔한 import 경로 제공
 */

// 메인 컴포넌트
export { default } from './ServerCard';
export { default as ServerCard } from './ServerCard';

// 하위 컴포넌트들 (독립적 사용 가능)
export { default as ServerIcon } from './ServerIcon';
export { default as MetricsDisplay } from './MetricsDisplay';
export { default as StatusBadge } from './StatusBadge';
export { default as ActionButtons } from './ActionButtons';

// 타입 정의 (필요시 확장 가능)
export type ServerCardVariant = 'default' | 'compact' | 'detailed';

export interface ServerCardActionHandler {
  (action: string, server: any): void;
}
