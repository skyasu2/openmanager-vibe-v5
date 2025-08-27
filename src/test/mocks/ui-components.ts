/**
 * 🎨 UI 컴포넌트 Mock
 */

import { vi } from 'vitest';
import type { ReactNode } from 'react';

// React Transition Group Mock
vi.mock('react-transition-group', () => ({
  CSSTransition: ({ children }: { children: ReactNode }) => children,
  TransitionGroup: ({ children }: { children: ReactNode }) => children,
  Transition: ({ children }: { children: ReactNode }) => children,
}));
