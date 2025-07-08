/**
 * 📈 Analytics Mock
 */

import { vi } from 'vitest';

vi.mock('@vercel/analytics', () => ({
  Analytics: () => null,
  track: vi.fn(),
}));
