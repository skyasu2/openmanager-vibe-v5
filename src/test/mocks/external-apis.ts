/**
 * 📡 외부 API Mock
 */

import { vi } from 'vitest';

// Slack API Mock
global.fetch = vi.fn().mockImplementation(url => {
  if (typeof url === 'string' && url.includes('slack')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ ok: true }),
    });
  }
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
  });
});
