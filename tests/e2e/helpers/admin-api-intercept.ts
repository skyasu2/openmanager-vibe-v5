import { Page, Route } from '@playwright/test';
import {
  playgroundAdminConversations,
  playgroundAdminLogs,
  playgroundAdminStats,
} from './admin-mock-data';

const fulfill = (route: Route, body: Record<string, unknown>) => {
  route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
};

export async function interceptAdminApis(page: Page): Promise<void> {
  console.log('🛡️ Admin API intercept 활성화');
  await page.route('**/api/admin/conversations', (route) =>
    fulfill(route, { conversations: playgroundAdminConversations })
  );
  await page.route('**/api/admin/logs', (route) =>
    fulfill(route, { logs: playgroundAdminLogs })
  );
  await page.route('**/api/admin/stats', (route) =>
    fulfill(route, { stats: playgroundAdminStats })
  );
}
