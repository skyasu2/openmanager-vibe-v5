/**
 * 📡 외부 API Mock
 */

import { vi } from 'vitest';

// 외부 API Mock
global.fetch = vi.fn().mockImplementation(url => {
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
  });
});
