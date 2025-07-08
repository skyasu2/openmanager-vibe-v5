/**
 * 🎥 Framer Motion Mock
 */

import { vi } from 'vitest';

vi.mock('framer-motion', () => ({
  motion: {
    div: 'div',
    span: 'span',
    p: 'p',
    h1: 'h1',
    h2: 'h2',
    h3: 'h3',
    button: 'button',
    section: 'section',
    article: 'article',
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  useAnimation: () => ({
    start: vi.fn(),
    stop: vi.fn(),
    set: vi.fn(),
  }),
  useMotionValue: () => ({ get: vi.fn(), set: vi.fn() }),
  useSpring: () => ({ get: vi.fn(), set: vi.fn() }),
  useTransform: () => ({ get: vi.fn() }),
}));
