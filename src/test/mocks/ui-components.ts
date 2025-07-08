/**
 * 🎨 UI 컴포넌트 Mock
 */

import { vi } from 'vitest';

// React Transition Group Mock
vi.mock('react-transition-group', () => ({
  CSSTransition: ({ children }: { children: React.ReactNode }) => children,
  TransitionGroup: ({ children }: { children: React.ReactNode }) => children,
  Transition: ({ children }: { children: React.ReactNode }) => children,
}));
