import { test } from '@playwright/test';
import {
  ADMIN_FEATURES_REMOVED,
  ADMIN_FEATURES_SKIP_MESSAGE,
} from './helpers/featureFlags';

test.describe('관리자 페이지는 제거되었습니다', () => {
  test.skip(ADMIN_FEATURES_REMOVED, ADMIN_FEATURES_SKIP_MESSAGE);
  test('legacy admin page flow', () => {
    test.fixme();
  });
});
